var canvas = document.getElementById('canvas'),
    c = canvas.getContext('2d'),
    socket,
    d = {
        // drawing code
        // variables
        white: '#fafafa',
        black: '#1a1a1a',
        radius: 20,
        // functions
        clearA: function() {
            // resets canvas and clears
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.clearRect(0, 0, canvas.width, canvas.height);
        },
        clearB: function() {
            // clears around the player
            c.clearRect(v.view.left, v.view.top, canvas.width, canvas.height);
        },
        grid: function() {
            var w = v.view,
                xmod = w.left % v.gridSpacing,
                ymod = w.top % v.gridSpacing;

            c.strokeStyle = '#aaa';
            c.lineWidth = 1;

            var i;
            for (i = w.left - xmod; i <= w.right; i+= v.gridSpacing) {
                c.beginPath();
                c.moveTo(i, w.top);
                c.lineTo(i, w.bottom);
                c.closePath();
                c.stroke();
            }
            for (i = w.top - ymod; i <= w.bottom; i+= v.gridSpacing) {
                c.beginPath();
                c.moveTo(w.left, i);
                c.lineTo(w.right, i);
                c.closePath();
                c.stroke();
            }
        },
        boundary: function() {
            // draws the second area (not the innermost), kind of like a doughnut
            c.fillStyle = v.whiteInner ? d.black : d.white;
            c.beginPath();
            c.arc(v.boundary.centre, v.boundary.centre, d.getOuterBoundaryRadius(), 0, 2*Math.PI);
            c.arc(v.boundary.centre, v.boundary.centre, d.getInnerBoundaryRadius(), 0, 2*Math.PI, true);
            c.fill();
        },
        circle: function(x, y, r, fs) {
            if (fs !== undefined) c.fillStyle = fs;
            c.beginPath();
            c.arc(x, y, r, 0, Math.PI*2, true);
            c.closePath();
            c.fill();
        },
        player: function(x, y, name, dark, you) {
            var colour = you ? '#5599BB' : dark ? d.black : d.white;
            c.font = 'bold 20pt Source Sans Pro';

            if (!you) {
                c.strokeStyle = dark ? d.white : d.black;
                c.lineWidth = 3;
                c.strokeText(name, x, y - 32);
            }

            d.circle(x, y, d.radius, colour);
            c.fillText(name, x, y - 32);
        },
        getOuterBoundaryRadius: function (){
            return v.boundary.centre - v.time * v.boundary.speed;
        },
        getInnerBoundaryRadius: function (){
            return v.boundary.centre - v.time * v.boundary.speed - v.boundary.innerStart;
        },
    },
    v = {
        // global variables
        // hardcoded
        gridSpacing: 150,
        gameLength: 1000 * 60,
        tickLength: 20,
        boundary: {
            outerSize: 10000,
        },
        resetVars: function() {
            // defaults
            this.keys =  {
                left: false,
                right: false,
                up: false,
                down: false,
            };
            this.centre = {
                x: window.innerWidth/2,
                y: window.innerHeight/2,
            };
            this.view = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            };
            this.player = {
                name: null,
                id: null,
                x: 0,
                y: 0,
            };
            this.players = [];
            this.leaderboard = [];
            this.endMessage = '';
            this.time = null;
            this.lastupdatetime = null;
            this.loopID = null;
            this.whiteInner = true;

            // calculated
            this.maxTime = this.gameLength / this.tickLength;
            this.boundary.innerStart = this.boundary.outerSize / 4;
            this.boundary.centre = this.boundary.outerSize / 2;
            this.boundary.speed = this.boundary.outerSize / (4 * this.maxTime);
        },
    },
    Game = {
        // Game code
        init: function() {
            // when the page loads
            v.resetVars();
            UI.bindUIActions();
            UI.bindWindowResize();
        },

        begin: function() {
            // what happens when you press play
            // valid nickname - alphanumeric and underscore
            var regex = /^\w*$/;
            var nick = document.getElementById('nameInput').value;
            if (regex.test(nick)) {
                v.player.name = nick || 'anon';
                Server.connectAndStart();
            } else {
                UI.showStartMessage('nickname must be alphanumeric');
            }
        },

        physics: function() {
            // client side estimation of what's going to happen, which smooths it out
            // operates on time difference, not ticks
            var now = window.performance.now(),
                timeDiff = now - v.lastupdatetime,
                scale, p;

            scale = timeDiff / v.tickLength;

            for(var i = 0; i < v.players.length; i++) {
                p = v.players[i];
                p.pos.x += p.vel.x * scale;
                p.pos.y += p.vel.y * scale;
                if (p.id === v.player.id) {
                    v.player.x = p.pos.x;
                    v.player.y = p.pos.y;
                }
            }

            Game.setView();

            v.lastupdatetime = now;
        },

        startForRealz: function() {
            // starts the game... for realz
            var gameLoop = function() {
                v.loopID = window.requestAnimationFrame( gameLoop );
                Game.draw();
                Game.physics();
            };

            v.lastupdatetime = window.performance.now();
            UI.hideStartMenu();
            UI.keyActions.bind();
            gameLoop();
        },

        end: function() {
            // ends (only happens after a disconnect)
            window.cancelAnimationFrame(v.loopID);
            d.clearA();
            UI.showStartMenu();
            UI.keyActions.unbind();
            UI.showStartMessage(v.endMessage);
            v.resetVars();
            document.body.style.backgroundColor = d.white;
        },

        draw: function() {
            // draw what's happening
            // reset and translate
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.translate(-v.view.left, -v.view.top);

            // background
            d.clearB();
            d.boundary();
            d.grid();
            c.textAlign = 'center';

            // draw all players
            var p, dark;
            for (var i = 0; i < v.players.length; i++) {
                p = v.players[i];
                if (p.id !== v.player.id) {
                    dark = (v.whiteInner === p.inner) ? true : false;
                    d.player(p.pos.x, p.pos.y, p.name, dark, false);
                }
            }

            // draw me last
            d.player(v.player.x, v.player.y, v.player.name, true, true);
        },

        swapColours: function() {
            // change the colour of the 'innermost' circle when a round ends,
            // so it looks all seamless
            v.whiteInner = !v.whiteInner;
            var colour = v.whiteInner ? d.white : d.black;
            document.body.style.backgroundColor = colour;
        },

        setView: function() {
            // where the left/top etc of the window are in 'real' coordinates
            v.view.left   = v.player.x - v.centre.x;
            v.view.top    = v.player.y - v.centre.y;
            v.view.right  = v.player.x + v.centre.x;
            v.view.bottom = v.player.y + v.centre.y;
        },

        setViewAndPlayer: function() {
            // find myself, and set the view based on where i am
            var me = v.players.find(function(p) {
                return p.id === v.player.id;
            });
            if (me != null) {
                v.player.x = me.pos.x;
                v.player.y = me.pos.y;
                Game.setView();
            }
        },
    },
    Server = {
        connectAndStart: function() {
            // connects and defines events
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
                socket.on('endRound', function(leaderboard) {
                    v.leaderboard = leaderboard;
                    UI.updateLeaderboard();
                    Game.swapColours();
                });
                socket.on('kick', function(message){
                    v.endMessage = message;
                });
                socket.on('ping', function(time) {
                    socket.emit('pong', time);
                });
                socket.on('disconnect', function(){
                    Game.end();
                });
            } catch (e) {
                // when 'io is not defined' because the script didn't load
                if (e instanceof ReferenceError) UI.showStartMessage('server is down :(');
                else UI.showStartMessage('I have no idea what went wrong ¯\\_(ツ)_/¯');
            }
        },

        update: function() {
            socket.emit('update', v.keys);
        },
    },
    UI = {
        e: {
            // html elements
            input: document.getElementById('nameInput'),
            playButton: document.getElementById('playButton'),
            startMenu: document.getElementById('startMenu'),
            message: document.getElementById('message'),
            leaderboard: document.getElementById('leaderboard'),
            leaderlist: document.getElementById('leaderlist'),
        },

        bindUIActions: function() {
            // what happens when you click/press buttons
            UI.e.playButton.addEventListener('click', Game.begin);
            UI.e.input.addEventListener('keypress', function(e) {
                // enter key
                if (e.keyCode === 13) {
                    Game.begin();
                }
            });
        },

        bindWindowResize: function() {
            // when the window changes size
            var resize = function() {
                var w = window.innerWidth,
                    h = window.innerHeight,
                    dpr = window.devicePixelRatio || 1,
                    bsr = c.webkitBackingStorePixelRatio ||
                             c.mozBackingStorePixelRatio ||
                              c.msBackingStorePixelRatio ||
                               c.oBackingStorePixelRatio ||
                                c.backingStorePixelRatio || 1,
                    ratio = dpr/bsr;

                canvas.width = w * ratio;
                canvas.height = h * ratio;
                canvas.style.width = w + 'px';
                canvas.style.height = h + 'px';
                v.centre.x = w/2;
                v.centre.y = h/2;
                c.scale(ratio, ratio);

                // if game running
                if (v.loopID) {
                    Game.draw();
                } else {
                    d.clearA();
                }
            };
            // do it when game loads as well
            resize();
            window.addEventListener('resize', resize);
        },

        keyActions: {
            // arrow keys
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
                Server.update();
            },
            keyupHandler: function(e) {
                switch (e.keyCode) {
                    case 37: v.keys.left  = false; break;
                    case 38: v.keys.up    = false; break;
                    case 39: v.keys.right = false; break;
                    case 40: v.keys.down  = false; break;
                }
                Server.update();
            },
        },

        showStartMenu: function() {
            UI.e.startMenu.addEventListener('animationend', function() {
                UI.e.startMenu.className = '';
            }, false);
            UI.e.startMenu.className = '';
            window.focus();
        },

        hideStartMenu: function() {
            UI.e.startMenu.addEventListener('animationend', function() {
                UI.e.startMenu.className = 'hidden';
            }, false);
            UI.e.startMenu.className = 'animateHide';
            window.focus();
        },

        showStartMessage: function(msg) {
            // the message above the input for your nickname
            UI.e.message.innerHTML = msg;
        },

        updateLeaderboard: function() {
            if (v.leaderboard.length === 0) {
                UI.e.leaderboard.className = 'hidden';
            } else {
                UI.e.leaderboard.className = '';
                UI.e.leaderlist.innerHTML = '';
                var item, text;
                for (var i = 0; i < v.leaderboard.length; i++) {
                    item = document.createElement('li');
                    text = v.leaderboard[i].name + ' (' + v.leaderboard[i].score + ')';
                    if (v.leaderboard[i].id === v.player.id)
                        item.className = 'you';
                    item.appendChild(document.createTextNode(text));
                    UI.e.leaderlist.appendChild(item);
                }
            }
        },
    };

Game.init();
