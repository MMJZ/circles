module.exports = function(canvasID){
    var module = {};

    var s = require('../shared.js')();

    var white = '#fafafa',
        black = '#1a1a1a',
        blue = '#5599BB',
        playerFont = 'bold 20pt Source Sans Pro',
        radius = 20;

    var canvas = document.getElementById(canvasID),
        context = canvas.getContext('2d'),
        gridcanvas = document.createElement('canvas'),
        gridc = gridcanvas.getContext('2d'),
        circlesCanvas = document.createElement('canvas'),
        circlesC = circlesCanvas.getContext('2d'),
        gridSpacing = 200,
        whiteInner = true,
        ratio,
        time,
        width, height,
        centre = {
            x: 0,
            y: 0,
        },
        view = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
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
        // draw all players
        context.textAlign = 'center';
        context.shadowBlur = 1;
        var p, dark;
        for (var i = 0; i < players.length; i++) {
            p = players[i];
            if (p.id !== player.id) {
                dark = (whiteInner === p.inner) ? true : false;
                drawPlayer(p.pos.x, p.pos.y, p.name, dark, false);
            }
        }

        // draw me last
        drawPlayer(player.x, player.y, player.name, true, true);
        context.shadowBlur = 0;
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

    var gridPrerender = function() {
        gridc.strokeStyle = '#aaa';
        gridc.lineWidth = 1;

        var i;
        gridc.beginPath();
        for (i = 0; i < gridcanvas.width; i+= gridSpacing) {
            gridc.moveTo(i, 0);
            gridc.lineTo(i, gridcanvas.height);
        }
        for (i = 0; i < gridcanvas.height; i+= gridSpacing) {
            gridc.moveTo(0, i);
            gridc.lineTo(gridcanvas.width, i);
        }
        gridc.stroke();
    };

    var drawGrid = function() {
        var xPos = view.left - ((view.left + gridSpacing) % gridSpacing),
            yPos = view.top  - ((view.top  + gridSpacing) % gridSpacing);

        context.drawImage(gridcanvas, xPos, yPos);
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
        circlesCanvas.width = rad * 6 * ratio;
        circlesCanvas.height = rad * 2 * ratio;

        drawCircle(rad, rad, rad - 1, black);
        drawCircle(3*rad, rad, rad - 1, white);
        drawCircle(5*rad, rad, rad - 1, blue);
    };

    var drawPlayer = function(x, y, name, dark, you) {
        var pos = you ? 4*rad : dark ? 0 : 2*rad;
        context.drawImage(circlesCanvas, pos, 0, rad*2, rad*2,
                          x - rad, y - rad, rad*2, rad*2);

        context.fillStyle = you ? blue : dark ? black : white;
        context.shadowColor = you ? 'transparent' : dark ? white : black;
        context.fillText(name, x, y - 32);
    };

    module.resize = function(endFunction) {
        var dpr = window.devicePixelRatio || 1,
            bsr = context.webkitBackingStorePixelRatio ||
                     context.mozBackingStorePixelRatio ||
                      context.msBackingStorePixelRatio ||
                       context.oBackingStorePixelRatio ||
                        context.backingStorePixelRatio || 1;
        ratio = dpr/bsr;
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        gridcanvas.width = (width + gridSpacing) * ratio;
        gridcanvas.height = (height + gridSpacing) * ratio;
        gridPrerender();
        circlesPrerender();

        centre.x = width/2;
        centre.y = height/2;

        endFunction.call();
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
        view.left   = player.x - centre.x;
        view.top    = player.y - centre.y;
        view.right  = player.x + centre.x;
        view.bottom = player.y + centre.y;
    };

    return module;
};
