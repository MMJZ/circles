!function(e){function n(o){if(t[o])return t[o].exports;var r=t[o]={exports:{},id:o,loaded:!1};return e[o].call(r.exports,r,r.exports,n),r.loaded=!0,r.exports}var t={};return n.m=e,n.c=t,n.p="/circles/",n(0)}([function(e,n,t){t(6),t(3)},function(e,n){e.exports=function(){var e={tickLength:20,playerRadius:20,playerMaxSpeed:20,playerAcceleration:.2,outerBoundarySize:8e3,gameLength:4e4,maxLag:1e4};return e.maxTime=e.gameLength/e.tickLength,e.boundarySpeed=e.outerBoundarySize/(4*e.maxTime),e.innerBoundaryStart=e.outerBoundarySize/4,e.centrePoint=e.outerBoundarySize/2,e.getInnerBoundaryPosition=function(n){return e.innerBoundaryStart+n*e.boundarySpeed},e.getOuterBoundaryPosition=function(n){return n*e.boundarySpeed},e.getOuterBoundaryRadius=function(n){return e.centrePoint-n*e.boundarySpeed},e.getInnerBoundaryRadius=function(n){return e.centrePoint-n*e.boundarySpeed-e.innerBoundaryStart},e.getSecondsLeft=function(n){return Math.ceil((1-n/e.maxTime)*e.gameLength/1e3)},e.getExplosionRadius=function(e){return 12*e},e}},function(e,n){e.exports=function(){var e={},n={input:document.getElementById("nameInput"),playButton:document.getElementById("playButton"),startScreen:document.getElementById("startScreen"),message:document.getElementById("message"),leaderboard:document.getElementById("leaderboard"),leaderlist:document.getElementById("leaderlist")},t={threshold:35,inProgress:0,startX:0,startY:0},o={left:!1,right:!1,up:!1,down:!1};e.bindPlayButton=function(e){n.playButton.addEventListener("click",e),n.input.addEventListener("keypress",function(n){13===n.keyCode&&e.call()})},e.bindWindowResize=function(e,n){e(n),window.addEventListener("resize",function(){e(n)})};var r;e.userControlEvents={bindActions:function(e){r=e,a.bindActions(),i.bindActions()},unbindActions:function(){a.unbindActions(),i.unbindActions()}};var i={bindActions:function(){window.addEventListener("touchstart",this.touchStartHandler),window.addEventListener("touchmove",this.touchMoveHandler),window.addEventListener("touchend",this.touchEndHandler)},unbindActions:function(){window.removeEventListener("touchstart",this.touchStartHandler),window.removeEventListener("touchmove",this.touchMoveHandler),window.removeEventListener("touchend",this.touchEndHandler)},touchStartHandler:function(e){if(e.preventDefault(),1===e.touches.length){var n=e.touches[0];n.startX=n.screenX,n.startY=n.screenY}r(o)},touchMoveHandler:function(e){e.preventDefault();var n=e.touches[0].screenX-t.startX,i=e.touches[0].screenY-t.startY;n>t.threshold?o.right=!0:o.right=!1,n<-t.threshold?o.left=!0:o.left=!1,i>t.threshold?o.down=!0:o.down=!1,i<-t.threshold?o.up=!0:o.up=!1,r(o)},touchEndHandler:function(e){e.preventDefault(),0===e.touches.length&&(o={left:!1,right:!1,up:!1,down:!1}),r(o)}},a={bindActions:function(){window.addEventListener("keydown",this.keydownHandler),window.addEventListener("keyup",this.keyupHandler)},unbindActions:function(){window.removeEventListener("keydown",this.keydownHandler),window.removeEventListener("keyup",this.keyupHandler)},keydownHandler:function(e){if(!e.repeat){switch(e.keyCode){case 37:case 65:o.left=!0;break;case 38:case 87:o.up=!0;break;case 39:case 68:o.right=!0;break;case 40:case 83:o.down=!0}r(o)}},keyupHandler:function(e){switch(e.keyCode){case 37:case 65:o.left=!1;break;case 38:case 87:o.up=!1;break;case 39:case 68:o.right=!1;break;case 40:case 83:o.down=!1}r(o)}};return e.showStartScreen=function(){n.startScreen.addEventListener("animationend",function(){n.startScreen.className=""},!1),n.startScreen.className="",window.focus()},e.hideStartScreen=function(){n.startScreen.addEventListener("animationend",function(){n.startScreen.className="hidden"},!1),n.startScreen.className="animateHide",window.focus()},e.showStartMessage=function(e){n.message.innerHTML=e},e.updateLeaderboard=function(e,t){if(0===e.length)n.leaderboard.className="hidden";else{n.leaderboard.className="",n.leaderlist.innerHTML="";for(var o,r,i=0;i<e.length;i++)o=document.createElement("li"),r=e[i].name+" ("+e[i].score+")",e[i].id===t&&(o.className="you"),o.appendChild(document.createTextNode(r)),n.leaderlist.appendChild(o)}},e}},function(e,n,t){var o=t(5)();o.init()},function(e,n,t){e.exports=function(e){var n,o,r={},i=t(1)(),a="#fafafa",c="#1a1a1a",d="#5599BB",s="bold 20pt Source Sans Pro",u=200,l=document.getElementById(e),f=l.getContext("2d"),h=document.createElement("canvas"),m=h.getContext("2d"),p=!0,w={left:0,right:0,top:0,bottom:0,centreX:0,centreY:0};r.canvas=l,r.setTime=function(e){o=e},r.incTime=function(e){o+=e},r.currentFrame=function(e,t){f.setTransform(n,0,0,n,0,0),f.translate(-w.left,-w.top),y(),f.globalCompositeOperation="xor",f.font="200px Montserrat Alternates",f.textBaseline="middle",b(p,i.centrePoint),S(),f.globalCompositeOperation="source-over",v(),P(),g(e,t)};var g=function(e,n){f.font=s,f.textBaseline="alphabetic",f.textAlign="center",f.shadowBlur=1;for(var t,o,r=0;r<e.length;r++)t=e[r],t.id!==n.id&&(o=p===t.inner,L(t.pos.x,t.pos.y,t.name,o,!1));f.shadowBlur=0};r.clearA=function(){f.setTransform(1,0,0,1,0,0),f.clearRect(0,0,l.width,l.height)};var y=function(){f.clearRect(w.left,w.top,window.innerWidth,window.innerHeight)},v=function(){var e=w.left-(w.left+u+.5)%u,n=w.top-(w.top+u+.5)%u;e=(0|e)+.5,n=(0|n)+.5,f.strokeStyle="#aaa",f.lineWidth=1;var t;for(f.beginPath(),t=e;t<w.right;t+=u)f.moveTo(t,w.top),f.lineTo(t,w.bottom);for(t=n;t<w.bottom;t+=u)f.moveTo(w.left,t),f.lineTo(w.right,t);f.stroke()},S=function(){f.fillStyle=p?c:a,f.beginPath(),f.arc(i.centrePoint,i.centrePoint,i.getOuterBoundaryRadius(o),0,2*Math.PI),f.arc(i.centrePoint,i.centrePoint,i.getInnerBoundaryRadius(o),0,2*Math.PI,!0),f.fill()},b=function(){f.fillStyle=p?c:a,f.fillText(i.getSecondsLeft(o),i.centrePoint,i.centrePoint)},x=150,P=function(){var e=i.getExplosionRadius(o),n=i.getOuterBoundaryRadius(o),t=Math.max(e-x,0),r=Math.min(e,n);if(t<=n){var a=f.createRadialGradient(i.centrePoint,i.centrePoint,r,i.centrePoint,i.centrePoint,t);a.addColorStop(1,"transparent"),a.addColorStop(0,"#aaa"),f.fillStyle=a,f.beginPath(),f.arc(i.centrePoint,i.centrePoint,r,0,2*Math.PI,!0),f.arc(i.centrePoint,i.centrePoint,t,0,2*Math.PI,!1),f.closePath(),f.fill()}},k=function(e,n,t,o){void 0!==o&&(m.fillStyle=o),m.beginPath(),m.arc(e,n,t,0,2*Math.PI,!0),m.closePath(),m.fill()},B=i.playerRadius+1,E=function(){h.width=6*B*n,h.height=2*B*n,k(B,B,B-1,c),k(3*B,B,B-1,a),k(5*B,B,B-1,d)},L=function(e,n,t,o,r){var i=r?4*B:o?0:2*B;f.drawImage(h,i,0,2*B,2*B,e-B,n-B,2*B,2*B),f.fillStyle=r?d:o?c:a,f.shadowColor=r?"transparent":o?a:c,f.fillText(t,e,n-32)},M=document.getElementById("myName"),A=document.getElementById("me");return r.showMe=function(e){M.innerHTML=e.name,A.className=""},r.hideMe=function(){A.className="hidden"},r.resize=function(e){var t=window.devicePixelRatio||1,o=f.webkitBackingStorePixelRatio||f.mozBackingStorePixelRatio||f.msBackingStorePixelRatio||f.oBackingStorePixelRatio||f.backingStorePixelRatio||1,r=window.innerWidth,i=window.innerHeight;n=t/o,l.width=r*n,l.height=i*n,l.style.width=r+"px",l.style.height=i+"px",E(),w.centreX=r/2,w.centreY=i/2,e()},r.swapColours=function(){p=!p;var e=p?a:c;document.body.style.backgroundColor=e},r.setView=function(e){w.left=e.x-w.centreX,w.top=e.y-w.centreY,w.right=e.x+w.centreX,w.bottom=e.y+w.centreY},r}},function(e,n,t){e.exports=function(){var e,n,o,r={},i=t(4)("canvas"),a=t(2)(),c=t(1)(),d={name:void 0,id:void 0},s=[];r.init=function(){a.bindPlayButton(r.begin),a.bindWindowResize(i.resize,function(){e?i.currentFrame(s,d):i.clearA()})},r.begin=function(){var e=/^\w*$/,n=document.getElementById("nameInput").value;if(e.test(n)){var t=window.navigator.platform.toUpperCase().indexOf("MAC")>=0;t&&(n+="IsADick"),d.name=n||"anon",r.server.connect()}else a.showStartMessage("nickname must be alphanumeric")};var u;return r.server={connect:function(){try{u=io("http://circles-nerdycouple.rhcloud.com:8000",{reconnection:!1}),a.showStartMessage("connecting..."),u.on("connect",function(){a.showStartMessage("connected"),d.id="/#"+u.id,u.emit("nick",d)}),u.on("ready",function(){r.startForRealz()}),u.on("update",function(e,n){s=e,i.setTime(n),r.setViewAndPlayer()}),u.on("endRound",function(e){a.updateLeaderboard(e),i.swapColours()}),u.on("kick",function(e){o=e}),u.on("ping",function(e){u.emit("pong",e)}),u.on("disconnect",function(){r.end()})}catch(e){e instanceof ReferenceError?a.showStartMessage("server is down :("):a.showStartMessage("I have no idea what went wrong ¯\\_(ツ)_/¯")}},update:function(e){u.emit("update",e)}},r.physics=function(){var e,t,o=window.performance.now(),r=o-n;e=r/c.tickLength;for(var a=0;a<s.length;a++)t=s[a],t.pos.x+=t.vel.x*e,t.pos.y+=t.vel.y*e,t.id===d.id&&(d.x=t.pos.x,d.y=t.pos.y);i.setView(d),i.incTime(e),n=o},r.startForRealz=function(){var t=function(){i.currentFrame(s,d),r.physics(),setTimeout(function(){e=window.requestAnimationFrame(t)},50)};n=window.performance.now(),a.hideStartScreen(),a.userControlEvents.bindActions(r.server.update),i.showMe(d),t()},r.end=function(){window.cancelAnimationFrame(e),i.clearA(),a.showStartScreen(),a.userControlEvents.unbindActions(),a.showStartMessage(o),document.body.style.backgroundColor=i.white},r.setViewAndPlayer=function(){var e=s.find(function(e){return e.id===d.id});null!=e&&(d.x=e.pos.x,d.y=e.pos.y,i.setView(d))},r}},function(e,n){}]);