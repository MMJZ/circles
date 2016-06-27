/*jslint bitwise: true, node: true */

// Under the hood setup

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Config static variables

var tickLength = 20; // framerate = 1000/20 = 50fps.
var playerRadius = 20;
var playerMaxSpeed = 20;
var playerAcceleration = 2;
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
var leaderboard = [];
var leaderboardChanged = false;

// World derived Variables

function getInnerBoundaryPosition(){
    return innerBoundaryStart + time * boundarySpeed;
}

function getOuterBoundaryPosition(){
    return time * boundarySpeed;
}

function getSecondsLeft(){
    return Math.ceil((1 - time / maxTime) * gameLength / 1000);
}

// Game Ticking

function doGameTick(){
    
    time += 1;
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
    
    // Touch outer circle sets score to 0
    
    var outP = getOuterBoundaryPosition();
    var inP = getInnerBoundaryPosition();
    
    for(i = 0; i < users.length - 1; i++){
        player = users[i];
        if(player.inner){
            if(outDistanceSq(
                centrePoint - player.pos.x,
                centrePoint - player.pos.y,
                centrePoint - inP + playerRadius)){
                    player.inner = false;
                // emit something to do with knockout
            }
        }else{
            if(!inDistanceSq(
                centrePoint - player.pos.x,
                centrePoint - player.pos.y,
                centrePoint - outP - playerRadius)){
                    // bounce inside outside boundary
            }else if(!outDistanceSq(
                centrePoint - player.pos.x,
                centrePoint - player.pos.y,
                centrePoint - inP + playerRadius)){
                    // boundary outside inside boundary
            }
        }
    }
    
    for(i = 0; i < users.length - 1; i++) for(var j = i + 1; j < users.length; j++) 
        if(isTouching(users[i], users[j])) bashCircles(users[i], users[j]);
    
    
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
        var indexx = findIndex(users, currentPlayer.id);
        if (indexx > -1) users.splice(indexx, 1);
        console.log('info : ' + currentPlayer.name + ' disconnected');
        socket.broadcast.emit('playerDisconnect', { name: currentPlayer.name });
    });
    
    socket.on('ping', function () {
        socket.emit('pong');
    });
    
    socket.on('update', function(keys) {
        currentPlayer.lastUpdate = getNow();
        currentPlayer.keys = keys;
    });
});

// Circle Functions

function getFreePosition(){
    return {
        x: 0,
        y: 0
    };
}

function isTouching(a, b){
    var r = playerRadius;
    var ax1 = a.pos.x-r, bx1 = b.pos.x-r, ay1 = a.pos.y-r, by1 = b.pos.y-r;
    var ax2 = a.pos.x+r, ay2 = b.pos.x+r, bx2 = a.pos.y+r, by2 = b.pos.y+r;
    if(ax2 < bx1 || ay2 < by1 || bx2 < ax1 || by2 < ay1) return false;
    return inDistanceSq(b.pos.x - a.pos.x, b.pos.y - a.pos.y, r + r);
}

function inDistanceSq(a, b, c){
    return sq(a) + sq(b) < sq(c);
}
    
function outDistanceSq(a, b, c){
    return sq(a) + sq(b) > sq(c);
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

function sq(x){
    return x * x;
}

function getNow(){
    return new Date().getTime();
}

function findIndex(arr, id){
    var len = arr.length;
    while (len--) if (arr[len].id === id) return len;
    return -1;
}

function validNick(nickname) {
    var regex = /^\w*$/;
    return regex.exec(nickname) !== null;
}
