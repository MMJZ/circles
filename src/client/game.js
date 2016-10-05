/*eslint-env commonjs */
module.exports = function(){
    var module = {};

    var Draw = require('./draw.js')('canvas');
    var UI = require('./UI.js')();
    var s = require('../shared.js')();

    var gameLoopID,
        player = {
            name: undefined,
            id: undefined,
        },
        players = [],
        socket,
        lastupdatetime,
        endMessage = '';

    module.init = function() {
        UI.bindPlayButton(module.play);
        UI.bindWindowResize(Draw.resize, function() {
            // if game running
            if (gameLoopID) {
                Draw.currentFrame(players, player);
            } else {
                Draw.reset();
            }
        });
    };

    module.play = function() {
        var regex = /^\w*$/;
        var nick = document.getElementById('nameInput').value;
        if (regex.test(nick)) {
            player.name = nick || 'anon';
            module.server.connect();
        } else {
            UI.showStartMessage('nickname can only have numbers and letters');
        }
    };

    module.server = {
        connect: function() {
            try {
                socket = io('http://127.0.0.1:3002', {
                //socket = io('http://circles-nerdycouple.rhcloud.com:8000', {
                    reconnection: false,
                });
                UI.showStartMessage('connecting...');

                socket.on('connect', function(){
                    UI.showStartMessage('connected');
                    player.id = '/#' + socket.id;
                    socket.emit('nick', player);
                });
                socket.on('ready', function() {
                    module.start();
                });
                socket.on('update', function(playerList, serverTime) {
                    players = playerList;
                    Draw.setTime(serverTime);
                    module.setViewAndPlayer();
                });
                socket.on('leaderboard', function(leaderboard){
                    UI.updateLeaderboard(leaderboard);
                });
                socket.on('endRound', function(){
                    Draw.swapColours();
                });
                socket.on('kick', function(message){
                    endMessage = message;
                });
                socket.on('ping', function(time) {
                    socket.emit('pong', time);
                });
                socket.on('disconnect', function(){
                    module.end();
                });
            } catch (e) {
                // when 'io is not defined' because the script didn't load
                if (e instanceof ReferenceError) UI.showStartMessage('server is down :(');
                else UI.showStartMessage('I have no idea what went wrong ¯\\_(ツ)_/¯');
            }
        },
        update: function(keys) {
            socket.emit('update', keys);
        },
    };

    module.physics = function() {
        // client side estimation of what's going to happen, which smooths it out
        // operates on time difference, not ticks
        var now = window.performance.now(),
            timeDiff = now - lastupdatetime,
            scale, p;

        scale = timeDiff / s.tickLength;

        for(var i = 0; i < players.length; i++) {
            p = players[i];
            p.pos.x += p.vel.x * scale;
            p.pos.y += p.vel.y * scale;
            if (p.id === player.id) {
                player.x = p.pos.x;
                player.y = p.pos.y;
            }
        }

        Draw.setView(player);
        Draw.incTime(scale);

        lastupdatetime = now;
    };

    module.start = function() {
        var gameLoop = function() {
            Draw.currentFrame(players, player);
            module.physics();
            setTimeout( function() {
                gameLoopID = window.requestAnimationFrame( gameLoop );
            }, 0);
        };

        UI.setup(module.server.update);
        lastupdatetime = window.performance.now();
        Draw.showMe(player);
        gameLoop();
    };

    module.end = function() {
        window.cancelAnimationFrame(gameLoopID);
        Draw.reset();
        UI.reset(endMessage);
    };

    module.setViewAndPlayer = function() {
        // find myself, and set the view based on where i am
        var me = players.find(function(p) {
            return p.id === player.id;
        });
        if (me != null) {
            player.x = me.pos.x;
            player.y = me.pos.y;
            Draw.setView(player);
        }
    };

    return module;
};
