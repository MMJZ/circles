var canvas = document.getElementById('canvas'),
    c = canvas.getContext('2d'),
    v = {
        keys: {
            left: false,
            right: false,
            up: false,
            down: false,
        },
    socket,
    Game = {
        init: function() {
            this.bindUIActions();
            this.bindWindowResize();
            c.textAlign = 'center';
        },

        bindUIActions: function() {
            var playButton = document.getElementById('playButton');
            playButton.addEventListener('click', Game.begin);
            var input = document.getElementById('nameInput');
            input.addEventListener('keypress', function(e) {
                // enter key
                if (e.keyCode == 13) {
                    Game.begin();
                }
            });
        },

        bindWindowResize: function() {
            var resize = function() {
                canvas.height = window.innerHeight;
                canvas.width = window.innerWidth;
                Game.draw();
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
                    case 37: v.keys.left = true; break;
                    case 38: v.keys.up = true; break;
                    case 39: v.keys.right = true; break;
                    case 40: v.key.down = true; break;
                }
            },
            keyupHandler: function(e) {
                switch (e.keyCode) {
                    case 37: v.keys.left = false; break;
                    case 38: v.keys.up = false; break;
                    case 39: v.keys.right = false; break;
                    case 40: v.key.down = false; break;
                }
            },
        },

        begin: function() {
            // valid nickname - alphanumeric and underscore
            var regex = /^\w*$/;
            var nick = document.getElementById('nameInput').value;
            if (regex.test(nick)) {
                Game.keyActions.bind();
                Server.connectAndStart(nick);
            } else {
                UI.showStartMessage('nickname must be alphanumeric');
            }
        },

        startForRealz: function() {
            UI.hideStartMenu();
            // TODO
        },

        end: function() {
            // TODO
        },

        draw: function() {
            var d = {
                white: '#fafafa',
                black: '#1a1a1a',
                radius: 8,
                fillAll: function(fs) {
                    if (fs != undefined) c.fillStyle = fs;
                    c.fillRect(0, 0, canvas.width, canvas.height);
                },
                circle: function(x, y, r, fs) {
                    if (fs != undefined) c.fillStyle = fs;
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
                    if (you) {
                        d.circle(x, y, d.radius, '#5599BB');
                        c.fillStyle = '#5599BB';
                    } else {
                        d.circle(x, y, d.radius, colour);
                        // ^ this set the fillstyle so i don't have to
                    }

                    c.font = '12pt Montserrat Alternates';
                    c.fillText(name, x, y - 15);
                },
            };

            d.fillAll(d.white);
        },
    },
    Server = {
        connectAndStart: function(nick) {
            try {
                socket = io('http://localhost:3000');
                UI.showStartMessage('connecting...');

                socket.on('connect', function(){
                    UI.showStartMessage('connected');
                    socket.emit('nick', nick);
                });
                socket.on('ready', function() {
                    Game.startForRealz();
                });
                socket.on('update', function(stuff) {
                    Game.draw(stuff);
                });
                socket.on('disconnect', function(){
                    Game.end();
                });
                socket.on('kick', function() {
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
        hideStartMenu: function() {
            var a = document.getElementById('startMenu');
            a.addEventListener('animationend', function() {
                a.className = 'hidden';
            }, false);
            a.className = 'animate';
            window.focus();
        },
        showStartMessage: function(msg) {
            var m = document.getElementById('message');
            m.innerHTML = msg;
        },
    };

Game.init();
