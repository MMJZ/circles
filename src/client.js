var canvas = document.getElementById('canvas'),
    c = canvas.getContext('2d'),
    // drawing stuff
    d = {
        white: '#fafafa',
        black: '#1a1a1a',
        radius: 20,
        fillAll: function(fs, dontCentreOnPlayer) {
            if (fs !== undefined) c.fillStyle = fs;
            if (dontCentreOnPlayer)
                c.clearRect(0, 0, canvas.width, canvas.height);
            else {
                c.clearRect(v.player.x - v.centre.x, v.player.y - v.centre.y, canvas.width, canvas.height);
            }
        },
        grid: function() {
            var xstart = v.player.x < v.centre.x ? 0 : v.view.left - (v.view.left % v.gridsize.spacing),
                xend = (v.gridsize.x - v.player.x) < v.centre.x ? v.gridsize.x : v.view.right,
                ystart = v.player.y < v.centre.y ? 0 : v.view.top - (v.view.top % v.gridsize.spacing),
                yend = (v.gridsize.y - v.player.y) < v.centre.y ? v.gridsize.y : v.player.y + v.centre.y;

            c.strokeStyle = '#aaa';
            c.lineWidth = 1;
            var i;
            for (i = xstart; i <= xend; i+= v.gridsize.spacing) {
                c.beginPath();
                c.moveTo(i, ystart);
                c.lineTo(i, yend);
                c.stroke();
            }
            for (i = ystart; i <= yend; i+= v.gridsize.spacing) {
                c.beginPath();
                c.moveTo(xstart, i);
                c.lineTo(xend, i);
                c.stroke();
            }
        },
        circle: function(x, y, r, fs) {
            if (fs !== undefined) c.fillStyle = fs;
            c.beginPath();
            c.arc(x, y, r, 0, Math.PI*2, true);
            c.closePath();
            c.fill();
        },
        // centre circle
        ccircle: function(r, fs) {
            this.circle(canvas.width/2, canvas.height/2, r, fs);
        },
        player: function(x, y, name, dark, you) {
            var colour = dark ? d.black : d.white;
            c.font = '16pt Montserrat Alternates';

            if (you) {
                d.circle(x, y, d.radius, '#5599BB');
                c.fillText(name, x, y - 32);
            } else {
                d.circle(x, y, d.radius, colour);
                c.fillText(name, x, y - 32);
            }
        },
    },
    // vars
    v = {
        keys: {
            left: false,
            right: false,
            up: false,
            down: false,
        },
        loopID: null,
        centre: {
            x: 0,
            y: 0,
        },
        view: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        },
        player: {
            name: null,
            id: null,
            x: 0,
            y: 0,
        },
        players: [],
        time: null,
        gridsize: {
            x: 6000,
            y: 6000,
            spacing: 100,
        },
    },
    socket,
    Game = {
        init: function() {
            this.bindUIActions();
            this.bindWindowResize();
        },

        bindUIActions: function() {
            var playButton = document.getElementById('playButton');
            playButton.addEventListener('click', Game.begin);
            var input = document.getElementById('nameInput');
            input.addEventListener('keypress', function(e) {
                // enter key
                if (e.keyCode === 13) {
                    Game.begin();
                }
            });
        },

        bindWindowResize: function() {
            var resize = function() {
                var w = window.innerWidth,
                    h = window.innerHeight,
                    s = window.devicePixelRatio || 1;

                canvas.width = w * s;
                canvas.height = h * s;
                canvas.style.width = w + 'px';
                canvas.style.height = h + 'px';
                v.centre.x = w/2;
                v.centre.y = h/2;
                c.scale(s, s);

                // if game running
                if (v.loopID) {
                    Game.draw();
                } else {
                    d.fillAll(d.white, true);
                }
            };
            resize();
            window.addEventListener('resize', resize);
        },

        keyActions: {
            bind: function() {
                window.addEventListener('keydown', this.keydownHandler);
                window.addEventListener('keyup', this.keyupHandler);
            },
            unbind: function() {
                window.removeEventListener('keydown', this.keydownHandler);
                window.removeEventListener('keyup', this.keyupHandler);
            },
            keydownHandler: function(e) {
                switch (e.keyCode) {
                    case 37: v.keys.left  = true; break;
                    case 38: v.keys.up    = true; break;
                    case 39: v.keys.right = true; break;
                    case 40: v.keys.down  = true; break;
                }
            },
            keyupHandler: function(e) {
                switch (e.keyCode) {
                    case 37: v.keys.left  = false; break;
                    case 38: v.keys.up    = false; break;
                    case 39: v.keys.right = false; break;
                    case 40: v.keys.down  = false; break;
                }
            },
        },

        begin: function() {
            // valid nickname - alphanumeric and underscore
            var regex = /^\w*$/;
            var nick = document.getElementById('nameInput').value;
            if (regex.test(nick)) {
                Game.keyActions.bind();
                v.player.name = nick;
                Server.connectAndStart();
            } else {
                UI.showStartMessage('nickname must be alphanumeric');
            }
        },

        startForRealz: function() {
            var gameLoop = function() {
                v.loopID = window.requestAnimationFrame( gameLoop );

                Server.update();
            };

            UI.hideStartMenu();
            gameLoop();
        },

        end: function() {
            window.cancelAnimationFrame(v.loopID);
            d.fillAll(d.white, true);
            UI.showStartMenu();
        },

        draw: function() {
            // reset and translate
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.translate(-v.view.left, -v.view.top);

            // background
            d.fillAll(d.white);
            d.grid();
            c.textAlign = 'center';

            // draw all players
            var p;
            for (var i = 0; i < v.players.length; i++) {
                p = v.players[i];
                if (p.id === v.player.id) {
                    v.player.x = p.pos.x;
                    v.player.y = p.pos.y;
                } else {
                    d.player(p.pos.x, p.pos.y, p.name, true, false);
                }
            }

            // draw me last
            d.player(v.player.x, v.player.y, v.player.name, true, true);
        },

        setViewAndPlayer: function() {
            var me = v.players.find(function(p) {
                return p.id === v.player.id;
            });
            v.player.x = me.pos.x;
            v.player.y = me.pos.y;

            v.view.left   = v.player.x - v.centre.x;
            v.view.top    = v.player.y - v.centre.y;
            v.view.right  = v.player.x + v.centre.x;
            v.view.bottom = v.player.y + v.centre.y;
        },
    },
    Server = {
        connectAndStart: function() {
            try {
                socket = io('http://circles-nerdycouple.rhcloud.com:8000', {
                    reconnection: false,
                });
                UI.showStartMessage('connecting...');

                socket.on('connect', function(){
                    UI.showStartMessage('connected');
                    v.player.id = '/#' + socket.id;
                    socket.emit('nick', v.player);
                });
                socket.on('ready', function() {
                    Game.startForRealz();
                });
                socket.on('update', function(players, time) {
                    v.players = players;
                    Game.setViewAndPlayer();
                    v.time = time;
                    Game.draw();
                });
                socket.on('disconnect', function(){
                    Game.end();
                });
            } catch (e) {
                if (e instanceof ReferenceError) UI.showStartMessage('server is down :(');
                else UI.showStartMessage('I have no idea what went wrong ¯\\_(ツ)_/¯');
            }
        },
        update: function() {
            socket.emit('update', v.keys);
        },
    },
    UI = {
        showStartMenu: function() {
            var a = document.getElementById('startMenu');
            a.addEventListener('animationend', function() {
                a.className = '';
            }, false);
            a.className = '';
            window.focus();
        },
        hideStartMenu: function() {
            var a = document.getElementById('startMenu');
            a.addEventListener('animationend', function() {
                a.className = 'hidden';
            }, false);
            a.className = 'animateHide';
            window.focus();
        },
        showStartMessage: function(msg) {
            var m = document.getElementById('message');
            m.innerHTML = msg;
        },
    };

Game.init();
