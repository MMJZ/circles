var canvas = document.getElementById("canvas"),
    c = canvas.getContext('2d'),
    Game = {
    init: function() {
        this.bindUIActions();
        this.bindWindowResize();
    },

    bindUIActions: function() {
        var playButton = document.getElementById("playButton");
        playButton.addEventListener("click", Game.begin);
    },

    bindWindowResize: function() {
        var resize = function() {
            canvas.height = window.innerHeight;
            canvas.width = window.innerWidth;
            Game.draw();
        }
        resize();
        window.addEventListener("resize", resize);
    },

    begin: function() {
        console.log("beginning...???");
        // TODO
    },

    draw: function() {
        var d = {
            white: "#fafafa",
            black: "#1a1a1a",
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
        }

        d.fillAll(d.white);

        //TODO
    }
};

Game.init();
