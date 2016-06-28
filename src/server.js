/*jslint bitwise: true, node: true */

// Under the hood setup

var express = require('express');
var app = express();
var http = require('http');

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");

var server = http.createServer(app).listen(app.get('port') ,app.get('ip'), function () {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'),app.get('port'));
});

app.get('/', function (req, res) {
    res.status('200').sendfile('index.html', { root : __dirname});
});

var io = require('socket.io')(server);

// Config static variables

var tickLength = 20; // framerate = 1000/20 = 50fps.
var playerRadius = 20;
var playerMaxSpeed = 20;
var playerAcceleration = 0.2;
var outerBoundarySize = 6000;
var gameLength = 1000 * 60;
var maxLag = 6000;

// Deduced static variables

var maxTime = gameLength / tickLength;
var boundarySpeed = outerBoundarySize / (4 * maxTime);
var innerBoundaryStart = outerBoundarySize / 4;
var centrePoint = outerBoundarySize / 2;

// World variables

var time = 0;
var users = [];
var sockets = {};
var running = false;
var simulator;

// World derived Variables

function getInnerBoundaryPosition(){
    return innerBoundaryStart + time * boundarySpeed;
}

function getOuterBoundaryPosition(){
    return time * boundarySpeed;
}

function getOuterBoundaryRadius(){
    return centrePoint - time * boundarySpeed;
}

function getInnerBoundaryRadius(){
    return centrePoint - time * boundarySpeed - innerBoundaryStart;
}

function getSecondsLeft(){
    return Math.ceil((1 - time / maxTime) * gameLength / 1000);
}

// Game Ticking

function startTicking(){
    running = true;
    time = 0;
    console.log("info : Starting Tick");
    simulator = setInterval(function(){
        doGameTick();
    }, tickLength);
}

function stopTicking(){
    running = false;
    clearInterval(simulator);
    console.log("info : Trees saaaaaaaved"); // for the trees mate
}

function doGameTick(){
    
    time += 1;
    if(time === maxTime) endRound();
    var player;
    
    // Movement
    
    for(var i = 0; i < users.length; i++){
        player = users[i];
        if(player.lastUpdate < getNow() - maxLag){
            sockets[player.id].emit('kick', 'lagging out');
            sockets[player.id].disconnect();
        }
        if(player.keys.left) player.vel.x -= playerAcceleration;
        if(player.keys.up) player.vel.y -= playerAcceleration;
        if(player.keys.down) player.vel.y += playerAcceleration;
        if(player.keys.right) player.vel.x += playerAcceleration;
        if(player.vel.x > playerMaxSpeed) player.vel.x = playerMaxSpeed;
        if(player.vel.x < -playerMaxSpeed) player.vel.x = -playerMaxSpeed;
        if(player.vel.y > playerMaxSpeed) player.vel.y = playerMaxSpeed;
        if(player.vel.y < -playerMaxSpeed) player.vel.y = -playerMaxSpeed;
        player.pos.x += player.vel.x;
        player.pos.y += player.vel.y;
    }
    
    // Collisions
    
    var outP = getOuterBoundaryPosition();
    var inP = getInnerBoundaryPosition();
    
    for(i = 0; i < users.length - 1; i++){
        player = users[i];
        var dx = centrePoint - player.pos.x;
        var dy = centrePoint - player.pos.y;
        var dx2 = sq(dx), dy2 = sq(dy);
        if(player.inner){
            if(dx2 + dy2 > sq(centrePoint - inP + playerRadius)){
                player.inner = false;
                var nscore = countLivingPlayersAndInc();
                player.score -= nscore;
                if(player.score < 0) player.score = 0;
                sockets[player.id].emit('dead', nscore);
            }
        }else{
            if(dx2 + dy2 >= sq(centrePoint - outP - playerRadius)){
                var droot = Math.sqrt(dx2 + dy2);
                var normalX = dx / droot;
                var normalY = dy / droot;
                var tangentX = -normalY;
                var tangentY = normalX;
                var normalSpeed = -(normalX * player.vel.x + normalY * player.vel.y);
                var tangentSpeed = tangentX * player.vel.x + tangentY * player.vel.y;
                player.vel = {
                    x: normalSpeed * normalX + tangentSpeed * tangentX,
                    y: normalSpeed * normalY + tangentSpeed * tangentY
                };
            }else if(dx2 + dy2 < sq(centrePoint - inP + playerRadius)){
                bashCircles(player, {pos:{x:centrePoint,y:centrePoint},vel:{x:0,y:0}});
            }
        }
    }
    
    for(i = 0; i < users.length - 1; i++) for(var j = i + 1; j < users.length; j++) 
        if(isTouching(users[i], users[j])) bashCircles(users[i], users[j]);
    
    var outInf = [];
    for(i = 0; i < users.length; i++){
        var playerOutInf = users[i];
        outInf.push({
            pos: playerOutInf.pos,
            vel: playerOutInf.vel,
            name: playerOutInf.name,
            id: playerOutInf.id,
            inner: playerOutInf.inner
        });
    }
    io.emit('update', outInf, time);
}

function endRound(){
    time = 0;
    for(var i = 0; i < users.length; i++){
        if(users[i].inner) users[i].score += users.length - 1;
        else users.inner = true;
    }
    users.sort(function(a, b) { return b.score - a.score; });
    var leaderboard = [];
    for(i = 0; i < Math.min(10, users.length); i++){
        leaderboard.push({
            name: users[i].name,
            score: users[i].score
        });
    }
    io.emit('endRound', leaderboard);
}

// Socketing

io.on('connection', function(socket) {
    console.log('info : user taking an interest');
    var currentPlayer;
    socket.on('nick', function(pplayer) {
        console.log('info : ' + pplayer.name + ' connecting');
        if(findIndex(users, pplayer.id) > -1){
            console.log('cerr : player is already connected');
            socket.disconnect();
        }else if(!validNick(pplayer.name)){
            socket.emit('kick', 'nicked by the nick :(');
            socket.disconnect();
        }else{
            console.log('info : ' + pplayer.name + ' connected');
            sockets[socket.id] = socket;
            socket.emit('ready');
            if(!running) startTicking();
            
            currentPlayer = {
                id: socket.id,
                pos: getFreePosition(),
                vel: {
                    x: 0,
                    y: 0
                },
                name: pplayer.name,
                keys: {
                    left: false,
                    up: false,
                    right: false,
                    down: false
                },
                inner: false,
                score: 0,
                lastUpdate: getNow()
            };
            users.push(currentPlayer);
            console.log('info : ' + users.length + ' players connected');
        }
    });

    socket.on('disconnect', function () {
        if(currentPlayer.id === null) return;
        var indexx = findIndex(users, currentPlayer.id);
        if (indexx > -1) users.splice(indexx, 1);
        console.log('info : ' + currentPlayer.name + ' disconnected');
        if(users.length === 0) stopTicking();
    });
    
    socket.on('ping', function () {socket.emit('pong');});
    
    socket.on('update', function(keys) {
        currentPlayer.lastUpdate = getNow();
        currentPlayer.keys = keys;
    });
});

// Circle Functions

function getFreePosition(){
    var minx = getOuterBoundaryPosition();
    var range = outerBoundarySize - 2 * minx;
    findloop:
    while(true){
        var tx = Math.random() * range + minx;
        var ty = Math.random() * range + minx;
        var dx2 = sq(centrePoint - tx), dy2 = sq(centrePoint - ty);
        if(dx2 + dy2 < sq(centrePoint - getInnerBoundaryPosition() + playerRadius)) continue;
        if(dx2 + dy2 > sq(centrePoint - getOuterBoundaryPosition() - playerRadius)) continue;
        var recr = 2 * playerRadius;
        var x1 = tx - recr, y1 = ty - recr, x2 = tx + recr, y2 = ty + recr;
        for(var i = 0; i < users.length; i++){
            var theirpos = users[i].pos;
            if(theirpos.x >= x1 && theirpos.x <= x2 && theirpos.y >= y1 && theirpos.y <= y2) 
                continue findloop;
        }
        return {x: tx, y: ty};
    }
}

function isTouching(a, b){
    var r = playerRadius;
    var ax1 = a.pos.x-r, bx1 = b.pos.x-r, ay1 = a.pos.y-r, by1 = b.pos.y-r;
    var ax2 = a.pos.x+r, ay2 = b.pos.x+r, bx2 = a.pos.y+r, by2 = b.pos.y+r;
    if(ax2 < bx1 || ay2 < by1 || bx2 < ax1 || by2 < ay1) return false;
    return sq(b.pos.x - a.pos.x) + sq(b.pos.y - a.pos.y) < sq(r + r);
}

function bashCircles(a, b){
    var xDist = a.pos.x - b.pos.x, yDist = a.pos.y - b.pos.y,
        xVel = b.vel.x - a.vel.x, yVel = b.vel.y - a.vel.y;
    var dotProduct = xDist * xVel + yDist * yVel;
    if(dotProduct > 0){
        var collisionScale = dotProduct / (sq(xDist) + sq(yDist));
        var xCollision = xDist * collisionScale,
            yCollision = yDist * collisionScale;
        a.vel = {x: xCollision, y: yCollision};
        b.vel = {x: -xCollision, y: -yCollision};
    }
}

// Util Functions

function sq(x){ return x * x;}
function getNow(){ return new Date().getTime();}
function validNick(nickname) { return /^\w*$/.exec(nickname) !== null;}

function findIndex(arr, id){
    var len = arr.length;
    while (len--) if (arr[len].id === id) return len;
    return -1;
}

function countLivingPlayersAndInc(){
    var r = 0;
    for(var i = 0; i < users.length; i++) if(users[i].inner){
        users[i].score += 1;
        r++;
    }
    return r;
}
