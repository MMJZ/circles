/*jslint bitwise: true, node: true */

// Under the hood setup

var express = require('express');
var app = express();
var http = require('http');

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1');

var server = http.createServer(app).listen(app.get('port') ,app.get('ip'), function () {
    console.log('✔ Express server listening at %s:%d ', app.get('ip'),app.get('port'));
});

app.get('/', function (req, res) {
    res.status('200').sendfile('index.html', { root : __dirname});
});

var io = require('socket.io')(server);

// config shared variables
var s = require('../shared.js')();

var pushFac = 10;

// World variables

var time = 0;
var users = [];
var sockets = {};
var running = false;
var simulator;

// Game Ticking

function startTicking(){
    running = true;
    time = 0;
    console.log('info : Starting Tick');
    simulator = setInterval(function(){
        doGameTick();
    }, s.tickLength);
}

function stopTicking(){
    running = false;
    clearInterval(simulator);
    console.log('info : Trees saaaaaaaved'); // for the trees mate
}

function doGameTick(){

    time += 1;
    if(time === s.maxTime) endRound();
    var player;

    // Movement

    for(var i = 0; i < users.length; i++){
        player = users[i];
        if(player.keys.left)  player.vel.x -= s.playerAcceleration;
        if(player.keys.up)    player.vel.y -= s.playerAcceleration;
        if(player.keys.down)  player.vel.y += s.playerAcceleration;
        if(player.keys.right) player.vel.x += s.playerAcceleration;
        player.vel.x *= 0.997;
        player.vel.y *= 0.997;
        if(player.vel.x >  s.playerMaxSpeed) player.vel.x =  s.playerMaxSpeed;
        if(player.vel.x < -s.playerMaxSpeed) player.vel.x = -s.playerMaxSpeed;
        if(player.vel.y >  s.playerMaxSpeed) player.vel.y =  s.playerMaxSpeed;
        if(player.vel.y < -s.playerMaxSpeed) player.vel.y = -s.playerMaxSpeed;
        player.pos.x += player.vel.x;
        player.pos.y += player.vel.y;
    }

    // Collisions
    
    var outP = s.getOuterBoundaryRadius(time);
    var inP = s.getInnerBoundaryRadius(time);
    var exp = s.getExplosionRadius(time);
    var cexp = exp < outP;

    for(i = 0; i < users.length; i++){
        player = users[i];
        var dx = s.centrePoint - player.pos.x;
        var dy = s.centrePoint - player.pos.y;
        var dx2 = sq(dx), dy2 = sq(dy);
        if(cexp && !player.flown){
            if(Math.abs(Math.sqrt(dx2 + dy2) - exp) < 10){
                player.flown = true;
                
                var x = player.pos.x - s.centrePoint, y = s.centrePoint - player.pos.y;
                var angle = Math.atan(y/x);
                if(y < 0) angle += Math.PI;
                player.vel.x += pushFac * Math.cos(angle);
                player.vel.y -= pushFac * Math.sin(angle);
                
                //var x = player.pos.x - s.centrePoint, y = player.pos.y - s.centrePoint;
                //var angle;
                /*
                if(x >= s.centrePoint){
                    if(y >= 0){
                        angle = Math.atan(y/x);
                        player.vel.x += pushFac * Math.cos(angle);
                        player.vel.y += pushFac * Math.sin(angle);
                    }else{
                        angle = Math.atan(-y/x);
                        player.vel.x += pushFac * Math.cos(angle);
                        player.vel.y -= pushFac * Math.sin(angle);
                    }
                }else{
                    if(y >= 0){
                        angle = Math.atan(-y/x);
                        player.vel.x -= pushFac * Math.cos(angle);
                        player.vel.y += pushFac * Math.sin(angle);
                    }else{
                        angle = Math.atan(y/x);
                        player.vel.x -= pushFac * Math.cos(angle);
                        player.vel.y -= pushFac * Math.sin(angle);
                    }
                }
                */
            }
        }
        if(player.inner){
            if(dx2 + dy2 > sq(inP + s.playerRadius)){
                player.inner = false;
                var nscore = countLivingPlayersAndInc();
                player.score -= nscore;
                if(player.score < 0) player.score = 0;
                sockets[player.id].emit('dead', nscore);
            }
        }else{
            if(dx2 + dy2 >= sq(outP - s.playerRadius)){
                var droot = Math.sqrt(dx2 + dy2);
                if(Math.abs(droot - outP) > 3 * s.playerRadius){
                    player.pos = getFreePosition();
                    player.vel = {x:0,y:0};
                    continue;
                }
                var normalX = dx / droot;
                var normalY = dy / droot;
                var tangentX = -normalY;
                var tangentY = normalX;
                var normalSpeed = -(normalX * player.vel.x + normalY * player.vel.y);
                var tangentSpeed = tangentX * player.vel.x + tangentY * player.vel.y;
                player.vel = {
                    x: normalSpeed * normalX * 2 + tangentSpeed * tangentX * 2,
                    y: normalSpeed * normalY * 2 + tangentSpeed * tangentY * 2,
                };
            }else if(dx2 + dy2 < sq(inP + s.playerRadius)){
                bashCircles(player, {pos:{x:s.centrePoint,y:s.centrePoint},vel:{x:0,y:0}});
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
            inner: playerOutInf.inner,
        });
    }
    io.emit('update', outInf, time);
}

function endRound(){
    time = 0;
    for(var i = 0; i < users.length; i++){
        if(users[i].inner) users[i].score += users.length - 1;
        else users[i].inner = true;
        users[i].flown = false;
    }
    users.sort(function(a, b) { return b.score - a.score; });
    var leaderboard = [];
    for(i = 0; i < Math.min(10, users.length); i++){
        leaderboard.push({
            name: users[i].name,
            score: users[i].score,
            id: users[i].id,
        });
    }
    io.emit('endRound', leaderboard);
    io.emit('ping', getNow());
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
            socket.emit('kick', '❌  your name is UNACCEPTABLEEE 🍋 ');
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
                    y: 0,
                },
                name: pplayer.name,
                keys: {
                    left: false,
                    up: false,
                    right: false,
                    down: false,
                },
                inner: false,
                flown: false,
                score: 0,
                lastUpdate: getNow(),
            };
            users.push(currentPlayer);
            console.log('info : ' + users.length + ' players connected');
        }
    });

    socket.on('disconnect', function () {
        if(currentPlayer === null) return;
        var indexx = findIndex(users, currentPlayer.id);
        if (indexx > -1) users.splice(indexx, 1);
        console.log('info : ' + currentPlayer.name + ' disconnected');
        if(users.length === 0) stopTicking();
    });

    socket.on('pong', function (retTime) {
        if(retTime < getNow() - s.maxLag){
            sockets[currentPlayer.id].emit('kick', 'you\'re lagging 😭 ');
            sockets[currentPlayer.id].disconnect();
        }
    });

    socket.on('update', function(keys) {
        currentPlayer.lastUpdate = getNow();
        currentPlayer.keys = keys;
    });
});

// Circle Functions

function getFreePosition(){
    var minx = s.getOuterBoundaryPosition(time);
    var range = s.outerBoundarySize - 2 * minx;
    findloop:
    while(true){
        var tx = Math.random() * range + minx;
        var ty = Math.random() * range + minx;
        var dx2 = sq(s.centrePoint - tx), dy2 = sq(s.centrePoint - ty);
        if(dx2 + dy2 < sq(s.centrePoint - s.getInnerBoundaryPosition(time) + s.playerRadius)) continue;
        if(dx2 + dy2 > sq(s.centrePoint - s.getOuterBoundaryPosition(time) - s.playerRadius)) continue;
        var recr = 2 * s.playerRadius;
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
    var r = s.playerRadius;
    if(a.pos.x + r < b.pos.x - r) return false;
    if(a.pos.y + r < b.pos.y - r) return false;
    if(a.pos.x - r > b.pos.x + r) return false;
    if(a.pos.y - r > b.pos.y + r) return false;
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
