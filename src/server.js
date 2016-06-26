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
var playerAcceleration = 20;
var outerBoundarySize = 6000;
var innerBoundarySize = 3000;
var gameLength = 1000 * 60;

// Deduced static variables

var maxTime = gameLength / tickLength;
var boundarySpeed = innerBoundarySize / (2 * maxTime);
var innerBoundaryStart = (outerBoundarySize - innerBoundarySize) / 2;

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

function getOuterBoundaryPisition(){
    return time * boundarySpeed;
}

// Game Ticking

function doGameTick(){
    time += 1;
}

// Socketing

io.on('connection', function(socket) {

    console.log('info : user taking an interest');

    var currentPlayer;

    socket.on('nick', function(player) {

        console.log('info : ' + player.name + ' connecting');

        if(findIndex(users, player.id) > -1){
            console.log('cerr : player is already connected');
            socket.disconnect();
        }else if(!validNick(player.name)){
            socket.emit('kick', 'Nicked by the nick :(');
            socket.disconnect();
        }else{
            console.log('info : ' + player.name + ' connected');

            currentPlayer = {
                id: socket.id,
                pos: getFreePosition(),
                vel: {
                    x: 0,
                    y: 0
                },
                name: player.name,
                radius: playerRadius,
                lastUpdate: new Date().getTime()
            };
        }
    });

    socket.on('disconnect', function () {
        var indexx = findIndex(users, currentPlayer.id);
        if (indexx > -1) users.splice(indexx, 1);
        console.log('info : ' + currentPlayer.name + ' disconnected');
        socket.broadcast.emit('playerDisconnect', { name: currentPlayer.name });
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
    var ar = a.radius, br = b.radius;
    var ax1 = a.x, bx1 = b.x, ay1 = a.y, by1 = b.y;
    var ax2 = ax1 + 2*ar, ay2 = ay1 + 2*ar, bx2 = bx1 + 2*br, by2 = by2 + 2*br;
    if(ax2 < bx1 || ay2 < by1 || bx2 < ax1 || by2 < ay1) return false;
    var axc = ax1 + ar, ayc = ay1 + ar, bxc = bx1 + br, byc = by1 + br;
    return sq(bxc - axc) + sq(byc - ayc) < sq(ar + br);
}

function sq(x){
    return x * x;
}

function bashCircles(a, b){
    var xDist = a.x - b.x, yDist = a.y - b.y,
        xVel = b.vx - a.vx, yVel = b.vy - a.vy;
    var dotProduct = xDist * xVel + yDist * yVel;
    if(dotProduct > 0){
        var collisionScale = dotProduct / (sq(xDist) + sq(yDist));
        var xCollision = xDist * collisionScale,
            yCollision = yDist * collisionScale;
        var combinedMass = a.radius + b.radius;
        var collWA = 2 * b.radius / combinedMass,
            collWB = 2 * a.radius / combinedMass;
        a.vel.set0(collWA * xCollision, collWA * yCollision);
        b.vel.set0(-collWB * xCollision, -collWB * yCollision);
    }
}

// Util Functions

function findIndex(arr, id){
    var len = arr.length;
    while (len--) if (arr[len].id === id) return len;
    return -1;
}

function validNick(nickname) {
    var regex = /^\w*$/;
    return regex.exec(nickname) !== null;
}
