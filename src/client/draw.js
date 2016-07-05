module.exports = function(canvasID){
    var module = {};

    var s = require('../shared.js')();

    // statics
    var white = '#fafafa',
        black = '#1a1a1a',
        playerFont = 'bold 20pt Source Sans Pro',
        gridSpacing = 200;

    var canvas = document.getElementById(canvasID),
        context = canvas.getContext('2d'),
        circlesCanvas = document.createElement('canvas'),
        circlesC = circlesCanvas.getContext('2d'),
        whiteInner = true,
        ratio,
        time,
        view = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            centreX: 0,
            centreY: 0,
        };

    // exported
    module.canvas = canvas;

    module.setTime = function(newTime) {
        time = newTime;
    };
    module.incTime = function(timeDiff) {
        time += timeDiff;
    };

    module.currentFrame = function(players, player) {
        // draw what's happening
        // reset and translate
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.translate(-view.left, -view.top);

        // background
        clearB();

        context.globalCompositeOperation = 'xor';
        context.textAlign = 'center';
        context.font = '200px Montserrat Alternates';
        context.textBaseline = 'middle';
        drawTime(whiteInner, s.centrePoint);

        drawBoundary();

        context.globalCompositeOperation = 'source-over';
        drawGrid();
        drawExplosion();

        drawPlayers(players, player);
    };

    var drawPlayers = function(players, player) {
        context.font = playerFont;
        context.textBaseline = 'alphabetic';
        // draw all players, except me
        var p, dark;
        for (var i = 0; i < players.length; i++) {
            p = players[i];
            if (p.id !== player.id) {
                dark = (whiteInner === p.inner) ? true : false;
                drawPlayer(p.pos.x, p.pos.y, p.name, dark);
            }
        }
    };

    module.clearA = function() {
        // resets canvas and clears
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
    };

    var clearB = function() {
        // clears around the player
        context.clearRect(view.left, view.top, window.innerWidth, window.innerHeight);
    };

    var drawGrid = function() {
        var xPos = view.left - ((view.left + gridSpacing + 0.5) % gridSpacing),
            yPos = view.top  - ((view.top  + gridSpacing + 0.5) % gridSpacing);

        // 0.5 leads to non-blurry lines
        xPos = (xPos | 0) + 0.5;
        yPos = (yPos | 0) + 0.5;

        context.strokeStyle = '#aaa';
        context.lineWidth = 1;

        var i;
        context.beginPath();
        for (i = xPos; i < view.right; i+= gridSpacing) {
            context.moveTo(i, view.top);
            context.lineTo(i, view.bottom);
        }
        for (i = yPos; i < view.bottom; i+= gridSpacing) {
            context.moveTo(view.left, i);
            context.lineTo(view.right, i);
        }
        context.stroke();
    };

    var drawBoundary = function() {
        // draws the second area (not the innermost), kind of like a doughnut
        context.fillStyle = whiteInner ? black : white;
        context.beginPath();
        context.arc(s.centrePoint, s.centrePoint, s.getOuterBoundaryRadius(time), 0, 2*Math.PI);
        context.arc(s.centrePoint, s.centrePoint, s.getInnerBoundaryRadius(time), 0, 2*Math.PI, true);
        context.fill();
    };

    var drawTime = function() {
        context.fillStyle = whiteInner ? black : white;
        context.fillText(s.getSecondsLeft(time), s.centrePoint, s.centrePoint);
    };

    var len = 150;
    var drawExplosion = function() {
        var size = s.getExplosionRadius(time),
            outer = s.getOuterBoundaryRadius(time),
            inRadius = Math.max(size - len, 0),
            outRadius = Math.min(size, outer);
        if (inRadius <= outer) {
            var gradient = context.createRadialGradient(s.centrePoint, s.centrePoint, outRadius,
                                                        s.centrePoint, s.centrePoint, inRadius);
            gradient.addColorStop(1, 'transparent');
            gradient.addColorStop(0, '#aaa');

            context.fillStyle = gradient;
            context.beginPath();
            context.arc(s.centrePoint, s.centrePoint, outRadius, 0, Math.PI*2, true);
            context.arc(s.centrePoint, s.centrePoint, inRadius, 0, Math.PI*2, false);
            context.closePath();
            context.fill();
        }
    };

    var drawCircle = function(x, y, r, fs) {
        if (fs !== undefined) circlesC.fillStyle = fs;
        circlesC.beginPath();
        circlesC.arc(x, y, r, 0, Math.PI*2, true);
        circlesC.closePath();
        circlesC.fill();
    };

    var rad = s.playerRadius + 1;
    var circlesPrerender = function() {
        circlesCanvas.width = rad * 4 * ratio;
        circlesCanvas.height = rad * 2 * ratio;

        drawCircle(rad, rad, rad - 1, black);
        drawCircle(3*rad, rad, rad - 1, white);
    };

    var drawPlayer = function(x, y, name, dark) {
        var pos;
        if (dark) {
            pos = 0;
            context.fillStyle = black;
        } else {
            pos = 2*rad;
            context.fillStyle = white;
        }

        context.drawImage(circlesCanvas, pos, 0, rad*2, rad*2,
                          x - rad, y - rad, rad*2, rad*2);

        context.fillText(name, x, y - 32);
    };

    var myName = document.getElementById('myName');
    var me = document.getElementById('me');
    module.showMe = function(player) {
        myName.innerHTML = player.name;
        me.className = '';
    };
    module.hideMe = function() {
        me.className = 'hidden';
    };

    module.resize = function(endFunction) {
        var dpr = window.devicePixelRatio || 1,
            bsr = context.webkitBackingStorePixelRatio ||
                     context.mozBackingStorePixelRatio ||
                      context.msBackingStorePixelRatio ||
                       context.oBackingStorePixelRatio ||
                        context.backingStorePixelRatio || 1,
            w = window.innerWidth,
            h = window.innerHeight;

        ratio = dpr/bsr;

        canvas.width = w * ratio;
        canvas.height = h * ratio;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        circlesPrerender();

        view.centreX = w/2;
        view.centreY = h/2;

        endFunction();
    };

    module.swapColours = function() {
        // change the colour of the 'innermost' circle when a round ends,
        // so it looks all seamless
        whiteInner = !whiteInner;
        var colour = whiteInner ? white : black;
        document.body.style.backgroundColor = colour;
    };

    module.setView = function(player) {
        // where the left/top etc of the window are in 'real' coordinates
        view.left   = player.x - view.centreX;
        view.top    = player.y - view.centreY;
        view.right  = player.x + view.centreX;
        view.bottom = player.y + view.centreY;
    };

    return module;
};
