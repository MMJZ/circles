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
            var xmod = v.view.left % v.gridSpacing,
                ymod = v.view.top % v.gridSpacing;

            c.strokeStyle = '#aaa';
            c.lineWidth = 1;
            var i;
            for (i = v.view.left - xmod; i <= v.view.right; i+= v.gridSpacing) {
                c.beginPath();
                c.moveTo(i, v.view.top);
                c.lineTo(i, v.view.bottom);
                c.closePath();
                c.stroke();
            }
            for (i = v.view.top - ymod; i <= v.view.bottom; i+= v.gridSpacing) {
                c.beginPath();
                c.moveTo(v.view.left, i);
                c.lineTo(v.view.right, i);
                c.closePath();
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
        lastupdatetime: null,
        gridSpacing: 150,
        gameLength: 1000 * 60,
        tickLength: 20,
        maxTime: this.gameLength / this.tickLength,
        boundary: {
            outerSize: 6000,
            innerStart: this.outerSize / 4,
            centre: this.outerSize / 2,
            speed: this.outerSize / (4 * this.maxTime),
        },
    },
    socket,
    Game = {
        init: function() {
            UI.bindUIActions();
            UI.bindWindowResize();
        },

        begin: function() {
            // valid nickname - alphanumeric and underscore
            var regex = /^\w*$/;
            var nick = document.getElementById('nameInput').value;
            if (regex.test(nick)) {
                UI.keyActions.bind();
                v.player.name = nick;
                Server.connectAndStart();
            } else {
                UI.showStartMessage('nickname must be alphanumeric');
            }
        },

        physics: function() {
            var now = window.performance.now(),
                timeDiff = now - v.lastupdatetime,
                scale, p;

            scale = timeDiff / v.tickLength;

            for(var i = 0; i < v.players.length; i++) {
                p = v.players[i];
                p.pos.x += p.vel.x * scale;
                p.pos.y += p.vel.y * scale;
            }

            v.lastupdatetime = now;
        },

        startForRealz: function() {
            var gameLoop = function() {
                v.loopID = window.requestAnimationFrame( gameLoop );

                Game.physics();
                Game.draw();
                Server.update();
            };

            v.lastupdatetime = window.performance.now();
            UI.hideStartMenu();
            gameLoop();
        },

        end: function() {
            window.cancelAnimationFrame(v.loopID);
            d.fillAll(d.white, true);
            UI.showStartMenu();
            UI.showStartMessage('');
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

        getOuterBoundaryRadius: function (){
            return v.boundary.centre - v.time * v.boundary.speed;
        },

        getInnerBoundaryRadius: function (){
            return v.boundary.centre - v.time * v.boundary.speed - v.boundary.innerStart;
        },

        setViewAndPlayer: function() {
            var me = v.players.find(function(p) {
                return p.id === v.player.id;
            });
            if (me != undefined) {
                v.player.x = me.pos.x;
                v.player.y = me.pos.y;

                v.view.left   = v.player.x - v.centre.x;
                v.view.top    = v.player.y - v.centre.y;
                v.view.right  = v.player.x + v.centre.x;
                v.view.bottom = v.player.y + v.centre.y;
            }
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
