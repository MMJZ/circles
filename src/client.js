var canvas = document.getElementById('canvas'),
    c = canvas.getContext('2d'),
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

        begin: function() {
            var hideStartMenu = function() {
                var a = document.getElementById('startMenu');
                a.addEventListener('animationend', function() {
                    a.className = 'hidden';
                }, false);
                a.className = 'animate';
            };

            // valid nickname - alphanumeric and underscore
            var regex = /^\w*$/;
            var nick = document.getElementById('nameInput').value;
            if (regex.test(nick)) {
                hideStartMenu();
                // TODO: start game
            } else {
                alert('nickname must be alphanumeric');
            }
        },

        draw: function() {
            var d = {
                white: '#fafafa',
                black: '#1a1a1a',
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
                ccircle: function(r, fs) {
                    this.circle(canvas.width/2, canvas.height/2, r, fs);
                }
            };

            d.fillAll(d.white);

            //TODO
        }
    };

Game.init();
