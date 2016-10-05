module.exports = function(){
    var module = {
        tickLength: 20, // framerate = 1000/20 = 50fps.
        playerRadius: 20,
        playerMaxSpeed: 30,
        playerAcceleration: 0.4,
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

    module.getExplosionRadius = function(time){
        return 12 * time;
    };

    return module;
};
