/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var game = __webpack_require__(1)();

	game.init();


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/*eslint-env commonjs */
	module.exports = function(){
	    var module = {};

	    var Draw = __webpack_require__(2)('canvas');
	    var UI = __webpack_require__(4)();
	    var Server = __webpack_require__(5)();
	    var s = __webpack_require__(3)();

	    var loopID,
	        player = {
	            name: undefined,
	            id: undefined,
	        },
	        players,
	        lastupdatetime,
	        endMessage;

	    module.init = function() {
	        UI.bindPlayButton(module.begin);
	        UI.bindWindowResize(Draw.resize, function() {
	            // if game running
	            if (loopID) {
	                Draw.currentFrame();
	            } else {
	                Draw.clearA();
	            }
	        });
	    };

	    module.begin = function() {
	        // what happens when you press play
	        // valid nickname - alphanumeric and underscore
	        var regex = /^\w*$/;
	        var nick = document.getElementById('nameInput').value;
	        if (regex.test(nick)) {
	            var isMac = window.navigator.platform.toUpperCase().indexOf('MAC') >= 0;
	            if (isMac) nick = nick + 'IsADick';
	            player.name = nick || 'anon';
	            player.id = Server.connectAndStart({
	                'message': UI.showStartMessage,
	                'ready': module.startForRealz,
	                'connect': function() {
	                    return player;
	                },
	                'update': function(playersList, serverTime) {
	                    players = playersList;
	                    Draw.time = serverTime;
	                    module.setViewAndPlayer();
	                },
	                'endRound': function(leaderboard) {
	                    UI.updateLeaderboard(leaderboard, player.id);
	                    Draw.swapColours();
	                },
	                'kick': function(message){
	                    endMessage = message;
	                },
	                'disconnect': module.end(),
	            }, player);
	        } else {
	            UI.showStartMessage('nickname must be alphanumeric');
	        }
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

	        module.setView();

	        lastupdatetime = now;
	    };

	    module.startForRealz = function() {
	        // starts the game... for realz
	        var gameLoop = function() {
	            loopID = window.requestAnimationFrame( gameLoop );
	            Draw.currentFrame();
	            module.physics();
	        };

	        lastupdatetime = window.performance.now();
	        UI.hideStartScreen();
	        UI.userControlEvents.bindActions();
	        gameLoop();
	    };

	    module.end = function() {
	        // ends (only happens after a disconnect)
	        window.cancelAnimationFrame(loopID);
	        Draw.clearA();
	        UI.showStartScreen();
	        UI.userControlEvents.unbindActions();
	        UI.showStartMessage(endMessage);
	        // TODO: reset things
	        document.body.style.backgroundColor = Draw.white;
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


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var white = '#fafafa',
	    black = '#1a1a1a',
	    radius = 20;

	module.exports = function(canvasID){
	    var module = {};

	    var s = __webpack_require__(3);

	    var canvas = document.getElementById(canvasID),
	        context = canvas.getContext('2d'),
	        gridcanvas = document.createElement('canvas'),
	        gridc = gridcanvas.getContext('2d'),
	        gridSpacing = 200,
	        whiteInner = false,
	        ratio,
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
	    module.time = 0;

	    module.currentFrame = function(players, player) {
	        // draw what's happening
	        // reset and translate
	        context.setTransform(ratio, 0, 0, ratio, 0, 0);
	        context.translate(-view.left, -view.top);

	        // background
	        module.clearB();
	        context.globalCompositeOperation = 'xor';
	        context.font = '200px Montserrat Alternates';
	        context.textBaseline = 'middle';
	        module.drawTime(whiteInner, s.centrePoint);
	        module.drawBoundary();
	        context.globalCompositeOperation = 'source-over';
	        module.drawGrid();

	        context.font = 'bold 20pt Source Sans Pro';
	        context.textBaseline = 'alphabetic';
	        // draw all players
	        context.textAlign = 'center';
	        context.shadowBlur = 1;
	        var p, dark;
	        for (var i = 0; i < players.length; i++) {
	            p = players[i];
	            if (p.id !== player.id) {
	                dark = (whiteInner === p.inner) ? true : false;
	                player(p.pos.x, p.pos.y, p.name, dark, false);
	            }
	        }

	        // draw me last
	        module.player(player.x, player.y, player.name, true, true);
	        context.shadowBlur = 0;
	    };

	    module.clearA = function() {
	        // resets canvas and clears
	        context.setTransform(1, 0, 0, 1, 0, 0);
	        context.clearRect(0, 0, canvas.width, canvas.height);
	    };

	    module.clearB = function() {
	        // clears around the player
	        context.clearRect(view.left, view.top, window.innerWidth, window.innerHeight);
	    };

	    module.gridPrerender = function() {
	        gridc.strokeStyle = '#aaa';
	        gridc.lineWidth = 1;

	        var i;
	        for (i = 0; i < gridcanvas.width; i+= gridSpacing) {
	            gridc.beginPath();
	            gridc.moveTo(i, 0);
	            gridc.lineTo(i, gridcanvas.height);
	            gridc.closePath();
	            gridc.stroke();
	        }
	        for (i = 0; i < gridcanvas.height; i+= gridSpacing) {
	            gridc.beginPath();
	            gridc.moveTo(0, i);
	            gridc.lineTo(gridcanvas.width, i);
	            gridc.closePath();
	            gridc.stroke();
	        }
	    };

	    module.drawGrid = function() {
	        var xPos = view.left - ((view.left + gridSpacing) % gridSpacing),
	            yPos = view.top  - ((view.top  + gridSpacing) % gridSpacing);

	        context.drawImage(gridcanvas, xPos, yPos);
	    };

	    module.drawBoundary = function() {
	        // draws the second area (not the innermost), kind of like a doughnut
	        context.fillStyle = whiteInner ? black : white;
	        context.beginPath();
	        context.arc(s.centrePoint, s.centrePoint, s.getOuterBoundaryRadius(), 0, 2*Math.PI);
	        context.arc(s.centrePoint, s.centrePoint, s.getInnerBoundaryRadius(), 0, 2*Math.PI, true);
	        context.fill();
	    };

	    module.drawTime = function() {
	        context.fillStyle = whiteInner ? black : white;
	        context.fillText(s.getSecondsLeft(module.time), s.centrePoint, s.centrePoint);
	    };

	    module.drawCircle = function(x, y, r, fs) {
	        if (fs !== undefined) context.fillStyle = fs;
	        context.beginPath();
	        context.arc(x, y, r, 0, Math.PI*2, true);
	        context.closePath();
	        context.fill();
	    };

	    module.drawPlayer = function(x, y, name, dark, you) {
	        var colour = you ? '#5599BB' : dark ? black : white;
	        context.shadowColor = you ? 'transparent' : dark ? white : black;
	        module.circle(x, y, radius, colour);
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
	        module.gridPrerender();

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


/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = function(){
	    var module = {
	        tickLength: 20, // framerate = 1000/20 = 50fps.
	        playerRadius: 20,
	        playerMaxSpeed: 20,
	        playerAcceleration: 0.2,
	        outerBoundarySize: 8000,
	        gameLength: 1000 * 40,
	        maxLag: 10000,
	    };

	    module.maxTime = module.gameLength / module.tickLength;
	    module.boundarySpeed = module.outerBoundarySize / (4 * module.maxTime);
	    module.innerBoundaryStart = module.outerBoundarySize / 4;
	    module.centrePoint = module.outerBoundarySize / 2;

	    module.getInnerBoundaryPosition = function(time){
	        return module.innerBoundaryStart + time * module.boundarySpeed;
	    };

	    module.getOuterBoundaryPosition = function(time){
	        return time * module.boundarySpeed;
	    };

	    module.getOuterBoundaryRadius = function(time){
	        return module.centrePoint - time * module.boundarySpeed;
	    };

	    module.getInnerBoundaryRadius = function(time){
	        return module.centrePoint - time * module.boundarySpeed - module.innerBoundaryStart;
	    };

	    module.getSecondsLeft = function(time){
	        return Math.ceil((1 - time / module.maxTime) * module.gameLength / 1000);
	    };

	    return module;
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/*eslint-env commonjs*/

	module.exports = function(){
	    var module = {};

	    var server = __webpack_require__(5)();

	    var elements = {
	            // html elements
	            input: document.getElementById('nameInput'),
	            playButton: document.getElementById('playButton'),
	            startScreen: document.getElementById('startScreen'),
	            message: document.getElementById('message'),
	            leaderboard: document.getElementById('leaderboard'),
	            leaderlist: document.getElementById('leaderlist'),
	        },
	        touch = {
	            threshold: 35,
	            inProgress: 0,
	            startX: 0,
	            startY: 0,
	        },
	        keys =  {
	            left: false,
	            right: false,
	            up: false,
	            down: false,
	        };

	    module.bindPlayButton = function(playAction) {
	        // what happens when you click/press buttons
	        elements.playButton.addEventListener('click', playAction);
	        elements.input.addEventListener('keypress', function(e) {
	            // enter key
	            if (e.keyCode === 13) {
	                playAction.call();
	            }
	        });
	    };

	    module.bindWindowResize = function(resize, endFunction) {
	        resize(endFunction);
	        window.addEventListener('resize', resize(endFunction));
	    };

	    module.userControlEvents = {
	        // arrow keys
	        bindActions: function() {
	            keyEvents.bindActions();
	            touchEvents.bindActions();
	        },
	        unbindActions: function() {
	            keyEvents.unbindActions();
	            touchEvents.unbindActions();
	        },
	    };

	    var touchEvents = {
	        bindActions: function() {
	            window.addEventListener('touchstart', this.touchStartHandler);
	            window.addEventListener('touchmove', this.touchMoveHandler);
	            window.addEventListener('touchend', this.touchEndHandler);
	        },
	        unbindActions: function() {
	            window.removeEventListener('touchstart', this.touchStartHandler);
	            window.removeEventListener('touchmove', this.touchMoveHandler);
	            window.removeEventListener('touchend', this.touchEndHandler);
	        },
	        touchStartHandler: function(e) {
	            e.preventDefault();
	            // allow only single touch
	            if (e.touches.length === 1) {
	                var touch = e.touches[0];
	                touch.startX = touch.screenX;
	                touch.startY = touch.screenY;
	            }
	        },
	        touchMoveHandler: function(e) {
	            e.preventDefault();
	            var xDiff = e.touches[0].screenX - touch.startX,
	                yDiff = e.touches[0].screenY - touch.startY;

	            if (xDiff > touch.threshold) keys.right = true;
	            else keys.right = false;
	            if (xDiff < -touch.threshold) keys.left = true;
	            else keys.left = false;
	            if (yDiff > touch.threshold) keys.down = true;
	            else keys.down = false;
	            if (yDiff < -touch.threshold) keys.up = true;
	            else keys.up = false;

	            server.update(keys);
	        },
	        touchEndHandler: function(e) {
	            e.preventDefault();
	            if (e.touches.length === 0) {
	                keys = {
	                    left: false,
	                    right: false,
	                    up: false,
	                    down: false,
	                };
	                server.update(keys);
	            }
	        },
	    };

	    var keyEvents = {
	        bindActions: function() {
	            window.addEventListener('keydown', this.keydownHandler);
	            window.addEventListener('keyup', this.keyupHandler);
	        },
	        unbindActions: function() {
	            window.removeEventListener('keydown', this.keydownHandler);
	            window.removeEventListener('keyup', this.keyupHandler);
	        },
	        keydownHandler: function(e) {
	            switch (e.keyCode) {
	                // arrow keys, WASD
	                case 37: case 65: keys.left  = true; break;
	                case 38: case 87: keys.up    = true; break;
	                case 39: case 68: keys.right = true; break;
	                case 40: case 83: keys.down  = true; break;
	            }
	            server.update(keys);
	        },
	        keyupHandler: function(e) {
	            switch (e.keyCode) {
	                case 37: case 65: keys.left  = false; break;
	                case 38: case 87: keys.up    = false; break;
	                case 39: case 68: keys.right = false; break;
	                case 40: case 83: keys.down  = false; break;
	            }
	            server.update(keys);
	        },
	    };

	    module.showStartScreen = function() {
	        elements.startScreen.addEventListener('animationend', function() {
	            elements.startScreen.className = '';
	        }, false);
	        elements.startScreen.className = '';
	        window.focus();
	    };

	    module.hideStartScreen = function() {
	        elements.startScreen.addEventListener('animationend', function() {
	            elements.startScreen.className = 'hidden';
	        }, false);
	        elements.startScreen.className = 'animateHide';
	        window.focus();
	    };

	    module.showStartMessage = function(msg) {
	        // the message above the input for your nickname
	        elements.message.innerHTML = msg;
	    };

	    module.updateLeaderboard = function(leaderboard, yourId) {
	        if (leaderboard.length === 0) {
	            elements.leaderboard.className = 'hidden';
	        } else {
	            elements.leaderboard.className = '';
	            elements.leaderlist.innerHTML = '';
	            var item, text;
	            for (var i = 0; i < leaderboard.length; i++) {
	                item = document.createElement('li');
	                text = leaderboard[i].name + ' (' + leaderboard[i].score + ')';
	                if (leaderboard[i].id === yourId)
	                    item.className = 'you';
	                item.appendChild(document.createTextNode(text));
	                elements.leaderlist.appendChild(item);
	            }
	        }
	    };

	    return module;
	};


/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = function(){
	    var module = {};

	    var socket;

	    module.connectAndStart = function(funcs, player) {
	        // connects and defines events
	        try {
	            socket = io('http://circles-nerdycouple.rhcloud.com:8000', {
	                reconnection: false,
	            });

	            funcs['message'].call('connecting...');
	            player.id = '/#' + socket.id;

	            socket.on('connect', function(){
	                funcs['message'].call('connected');
	                socket.emit('nick', player);
	            });
	            socket.on('ready', funcs['ready']);
	            socket.on('update', funcs['update']);
	            socket.on('endRound', funcs['endRound']);
	            socket.on('kick', funcs['kick']);
	            socket.on('disconnect', funcs['disconnect']);

	            socket.on('ping', function(time) {
	                socket.emit('pong', time);
	            });

	            return player.id;
	        } catch (e) {
	            // when 'io is not defined' because the script didn't load
	            if (e instanceof ReferenceError) funcs['message'].call('server is down :(');
	            else funcs['message'].call('I have no idea what went wrong ¯\\_(ツ)_/¯');
	        }
	    };

	    module.update = function(keys) {
	        socket.emit('update', keys);
	    };

	    return module;
	};


/***/ }
/******/ ]);