/*eslint-env commonjs*/

module.exports = function(){
    var module = {};

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
        window.addEventListener('resize', function() {
            resize(endFunction);
        });
    };

    var serverUpdate;
    module.userControlEvents = {
        bindActions: function(updateFunc) {
            serverUpdate = updateFunc;
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
            serverUpdate(keys);
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

            serverUpdate(keys);
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
            }

            serverUpdate(keys);
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
            if(!e.repeat) {
                switch (e.keyCode) {
                    // arrow keys, WASD
                    case 37: case 65: keys.left  = true; break;
                    case 38: case 87: keys.up    = true; break;
                    case 39: case 68: keys.right = true; break;
                    case 40: case 83: keys.down  = true; break;
                }
                serverUpdate(keys);
            }
        },
        keyupHandler: function(e) {
            switch (e.keyCode) {
                case 37: case 65: keys.left  = false; break;
                case 38: case 87: keys.up    = false; break;
                case 39: case 68: keys.right = false; break;
                case 40: case 83: keys.down  = false; break;
            }

            serverUpdate(keys);
        },
    };

    module.setup = function(action) {
        module.hideStartScreen();
        module.userControlEvents.bindActions(action);
    };

    module.reset = function(endMessage) {
        module.showStartScreen();
        module.userControlEvents.unbindActions();
        if (endMessage != null) {
            module.showStartMessage(endMessage);
        }
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
