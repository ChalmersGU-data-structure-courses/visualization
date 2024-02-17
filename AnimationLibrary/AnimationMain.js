// Copyright 2011 David Galles, University of San Francisco. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
// of conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY <COPYRIGHT HOLDER> ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of the University of San Francisco


// Creates and returns an AnimationManager
function initCanvas(canvas, generalControlBar, algorithmControlBar) {
    // UI nodes should be given, otherwise use defaults.
    if (!(canvas instanceof HTMLElement)) canvas = document.getElementById(canvas || "canvas");
    generalControlBar = new Toolbar(generalControlBar || "generalAnimationControls");
    algorithmControlBar = new Toolbar(algorithmControlBar || "algorithmSpecificControls");

    var controlBars = [generalControlBar, algorithmControlBar];

    var animationSpeeds = {
        default: 75,
        values: [25, 50, 75, 100],
        labels: ["Slowest", "Slow", "Fast", "Fastest"],
    };

    var canvasSizes = {
        default: "750:450",
        values: ["500:300", "750:450", "1000:600"],
        labels: ["Small", "Medium", "Large"],
    };

    var am = new AnimationManager(canvas, controlBars, animationSpeeds, canvasSizes);
    am.algorithmControlBar = algorithmControlBar;
    return am;
}


class AnimationManager extends EventListener {
    static DEFAULT_ANIMATION_SPEED = 75;
    static DEFAULT_CANVAS_SIZE = "750:450";
    static DEFAULT_PAUSED_VALUE = false;
    
    constructor(canvas, controlBars, animationSpeeds, canvasSizes) {
        super();

        var objectManager = new ObjectManager(canvas);
        // Holder for all animated objects.
        // All animation is done by manipulating objects in this container
        this.animatedObjects = objectManager;
        this.objectManager = objectManager;  // TODO: change this to animatedObjects later
        this.canvas = canvas;
        this.controlBars = controlBars;
        this.setupGeneralControlBar(animationSpeeds, canvasSizes);

        this.updatePaused();
        this.updateAnimationSpeed();
        this.updateCanvasSize();

        // Control variables for stopping / starting animation
        // this.animationPaused() ??= false;
        this.awaitingStep = false;
        this.currentlyAnimating = false;

        // Array holding the code for the animation.  This is
        // an array of strings, each of which is an animation command
        // currentAnimation is an index into this array
        this.AnimationSteps = [];
        this.currentAnimation = 0;
        this.previousAnimationSteps = [];

        // Control variables for where we are in the current animation block.
        // currFrame holds the frame number of the current animation block,
        // while animationBlockLength holds the length of the current animation
        // block (in frame numbers).
        this.currFrame = 0;
        this.animationBlockLength ??= 0;

        // The animation block that is currently running.  Array of singleAnimations
        this.currentBlock = null;

        // Animation listeners
        this.addListener("AnimationStarted", this, this.animationStarted);
        this.addListener("AnimationEnded", this, this.animationEnded);
        this.addListener("AnimationWaiting", this, this.animationWaiting);
        this.addListener("AnimationUndoUnavailable", this, this.animationUndoUnavailable);

        /////////////////////////////////////
        // Variables for handling undo.
        ////////////////////////////////////
        //  A stack of UndoBlock objects (subclassed, UndoBlock is an abstract base class)
        //  each of which can undo a single animation element
        this.undoStack = [];
        this.doingUndo = false;

        // A stack containing the beginning of each animation block, as an index
        // into the AnimationSteps array
        this.undoAnimationStepIndices = [];
        this.undoAnimationStepIndicesStack = [];
    }

    setupGeneralControlBar(animationSpeeds, canvasSizes) {
        if (!this.controlBars?.length) return;
        var bar = this.controlBars[0];

        this.skipBackButton = bar.addButton("⏮", {title: "Skip back"});
        this.skipBackButton.onclick = this.skipBack.bind(this);
        this.stepBackButton = bar.addButton("⏴", {title: "Step back"});
        this.stepBackButton.onclick = this.stepBack.bind(this);
        this.playPauseBackButton = bar.addButton("⏯︎", {title: "Run/pause animation"});
        this.playPauseBackButton.onclick = this.togglePlayPause.bind(this);
        this.stepForwardButton = bar.addButton("⏵", {title: "Step forward"});
        this.stepForwardButton.onclick = this.step.bind(this) ;
        this.skipForwardButton = bar.addButton("⏭", {title: "Skip forward"});
        this.skipForwardButton.onclick = this.skipForward.bind(this);

        if (animationSpeeds) {
            bar.addBreak();
            bar.addLabel("Animation speed:");
            this.speedSelector = bar.addSelect(animationSpeeds.values, animationSpeeds.labels);
            this.speedSelector.onchange = this.updateAnimationSpeed.bind(this);
            var speed = this.getCookie("VisualizationSpeed") || animationSpeeds.default;
            this.speedSelector.value = speed;
        }

        if (canvasSizes) {
            bar.addBreak();
            bar.addLabel("Canvas size:");
            this.sizeSelector = bar.addSelect(canvasSizes.values, canvasSizes.labels);
            this.sizeSelector.onchange = this.updateCanvasSize.bind(this);
            var size = this.getCookie("VisualizationSize") || canvasSizes.default;
            this.sizeSelector.value = size;
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    // Utility methods

    lerp(from, to, percent) {
        return (to - from) * percent + from;
    }

    parseBool(str, defaultValue) {
        if (str == null) return defaultValue;
        var uppercase = str.trim().toUpperCase();
        var returnVal = !(uppercase == "FALSE" || uppercase == "F" || uppercase == "0" || uppercase == "");
        return returnVal;
    }

    parseColor(color, defaultColor) {
        if (!color) return defaultColor;
        if (color.startsWith("0x")) return "#" + color.substring(2);
        return color;
    }

    getCookie(cookieName) {
        // console.log(`Current cookies: ${document.cookie}`);
        for (var cookie of document.cookie.split(";")) {
            var [x, y] = cookie.split("=", 2);
            if (x.trim() == cookieName) {
                return decodeURIComponent(y);
            }
        }
    }

    setCookie(cookieName, value, expireDays) {
        value = encodeURIComponent(value);
        if (expireDays > 0) {
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + expireDays);
            value += "; expires=" + exdate.toUTCString();
        }
        document.cookie = cookieName + "=" + value;
        // console.log(`Setting cookie ${cookieName} = ${value}`);
    }


    ///////////////////////////////////////////////////////////////////////////
    // The state of the toolbar

    togglePlayPause()
    {
        this.playPauseBackButton.value = this.animationPaused() ? "" : "paused";
        this.updatePaused();
    }

    updatePaused() {
        if (this.playPauseBackButton) {
            if (this.animationPaused()) {
                this.playPauseBackButton.innerText = "⏯︎";
                this.playPauseBackButton.setAttribute("title", "Run animation");
                if (this.skipBackButton.disabled == false) {
                    this.stepBackButton.disabled = false;
                }
            } else {
                this.playPauseBackButton.innerText = "⏸";
                this.playPauseBackButton.setAttribute("title", "Pause animation");
            }
        }
        if (!this.animationPaused()) {
            this.step();
        }
    }

    animationPaused() {
        return this.playPauseBackButton?.value || AnimationManager.DEFAULT_PAUSED_VALUE;
    }

    updateAnimationSpeed() {
        var speed = this.speedSelector?.value || AnimationManager.DEFAULT_ANIMATION_SPEED
        this.setCookie("VisualizationSpeed", speed, 30);
        // console.log(`New animation speed: ${speed}`);
    }

    animationBlockLength() {
        var speed = Number(this.speedSelector?.value) || AnimationManager.DEFAULT_ANIMATION_SPEED;
        return Math.floor((100 - speed) / 2);
    }

    updateCanvasSize() {
        var size = this.sizeSelector?.value || AnimationManager.DEFAULT_CANVAS_SIZE;
        var [w, h] = size.split(":").map((n) => parseInt(n));
        if (isNaN(w) || isNaN(h)) {
            [w, h] = AnimationManager.DEFAULT_CANVAS_SIZE.split(":").map((n) => parseInt(n));
        }
        this.canvas.width = w;
        this.canvas.height = h;
        this.setCookie("VisualizationSize", w+":"+h, 30);
        // console.log(`New canvas size: ${this.canvas.width} x ${this.canvas.height}`);
        this.animatedObjects.draw();
        this.fireEvent("CanvasSizeChanged", {width: this.canvas.width, height: this.canvas.height});
    }


    ///////////////////////////////////////////////////////////////////////////
    // Listeners

    animationWaiting() {
        if (this.playPauseBackButton) {
            this.stepForwardButton.disabled = false;
            if (this.skipBackButton.disabled == false) {
                this.stepBackButton.disabled = false;
            }
        }
        this.objectManager.setStatus("Animation paused", "red");
    }

    animationStarted() {
        if (this.playPauseBackButton) {
            this.skipForwardButton.disabled = false;
            this.skipBackButton.disabled = false;
            this.stepForwardButton.disabled = true;
            this.stepBackButton.disabled = true;
        }
        this.objectManager.setStatus("Animation running", "darkgreen");
    }

    animationEnded() {
        if (this.playPauseBackButton) {
            this.skipForwardButton.disabled = true;
            this.stepForwardButton.disabled = true;
            if (this.skipBackButton.disabled == false && this.animationPaused()) {
                this.stepBackButton.disabled = false;
            }
        }
        this.objectManager.setStatus("Animation completed", "black");
    }

    animationUndoUnavailable() {
        if (this.playPauseBackButton) {
            this.skipBackButton.disabled = true;
            this.stepBackButton.disabled = true;
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    // Animations, timers

    stopTimer() {
        clearTimeout(this.timer);
    }

    startTimer() {
        this.timer = setTimeout(() => {
            // We need to set the timeout *first*, otherwise if we
            // try to clear it later, we get behavior we don't want ...
            this.startTimer();
            this.update();
            this.objectManager.draw();
        }, 30);
    }

    update() {
        if (this.currentlyAnimating) {
            var animBlockLength = this.animationBlockLength();
            this.currFrame = this.currFrame + 1;
            for (var i = 0; i < this.currentBlock.length; i++) {
                if (this.currFrame == animBlockLength || (this.currFrame == 1 && animBlockLength == 0)) {
                    this.animatedObjects.setNodePosition(
                        this.currentBlock[i].objectID,
                        this.currentBlock[i].toX,
                        this.currentBlock[i].toY
                    );
                }
                else if (this.currFrame < animBlockLength) {
                    var objectID = this.currentBlock[i].objectID;
                    var percent = 1 / (animBlockLength - this.currFrame);
                    var oldX = this.animatedObjects.getNodeX(objectID);
                    var oldY = this.animatedObjects.getNodeY(objectID);
                    var targetX = this.currentBlock[i].toX;
                    var targetY = this.currentBlock[i].toY;
                    var newX = this.lerp(oldX, targetX, percent);
                    var newY = this.lerp(oldY, targetY, percent);
                    this.animatedObjects.setNodePosition(objectID, newX, newY);
                }
            }
            if (this.currFrame >= animBlockLength) {
                if (this.doingUndo) {
                    if (this.finishUndoBlock(this.undoStack.pop())) {
                        this.awaitingStep = true;
                        this.fireEvent("AnimationWaiting", "NoData");
                    }
                }
                else {
                    if (this.animationPaused() && (this.currentAnimation < this.AnimationSteps.length)) {
                        this.awaitingStep = true;
                        this.fireEvent("AnimationWaiting", "NoData");
                        this.currentBlock = [];
                    }
                    else {
                        this.startNextBlock();
                    }
                }
            }
            this.animatedObjects.update();
        }
    }

    resetAll() {
        this.clearHistory();
        this.animatedObjects.clearAllObjects();
        this.animatedObjects.draw();
        this.stopTimer();
    }

    setLayer(shown, layers) {
        this.animatedObjects.setLayer(shown, layers);
        // Drop in an extra draw call here, just in case we are not
        // in the middle of an update loop when this changes
        this.animatedObjects.draw();
    }

    setAllLayers(layers) {
        this.animatedObjects.setAllLayers(layers);
        // Drop in an extra draw call here, just in case we are not
        // in the middle of an update loop when this changes
        this.animatedObjects.draw();
    }

    /// WARNING:  Could be dangerous to call while an animation is running ...
    clearHistory() {
        this.undoStack = [];
        this.undoAnimationStepIndices = null;
        this.previousAnimationSteps = [];
        this.undoAnimationStepIndicesStack = [];
        this.AnimationSteps = null;
        this.fireEvent("AnimationUndoUnavailable", "NoData");
        this.stopTimer();
        this.animatedObjects.update();
        this.animatedObjects.draw();
    }

    //  Start a new animation.  The input parameter commands is an array of strings,
    //  which represents the animation to start
    StartNewAnimation(commands) {
        this.stopTimer();
        if (this.AnimationSteps != null) {
            this.previousAnimationSteps.push(this.AnimationSteps);
            this.undoAnimationStepIndicesStack.push(this.undoAnimationStepIndices);
        }
        if (commands == undefined || commands.length == 0) {
            this.AnimationSteps = ["Step"];
        }
        else {
            this.AnimationSteps = commands;
        }
        this.undoAnimationStepIndices = new Array();
        this.currentAnimation = 0;
        this.startNextBlock();
        this.currentlyAnimating = true;
        this.fireEvent("AnimationStarted", "NoData");
        this.startTimer();
    }

    // Step backwards one step.  A no-op if the animation is not currently paused
    stepBack() {
        if (this.awaitingStep && this.undoStack != null && this.undoStack.length != 0) {
            //  TODO:  Get events working correctly!
            this.fireEvent("AnimationStarted", "NoData");
            this.stopTimer();
            this.awaitingStep = false;
            this.undoLastBlock();
            // Re-kick thie timer.  The timer may or may not be running at this point,
            // so to be safe we'll kill it and start it again.
            this.stopTimer();
            this.startTimer();
        }
        else if (!this.currentlyAnimating && this.animationPaused() && this.undoAnimationStepIndices != null) {
            this.fireEvent("AnimationStarted", "NoData");
            this.currentlyAnimating = true;
            this.undoLastBlock();
            // Re-kick thie timer.  The timer may or may not be running at this point,
            // so to be safe we'll kill it and start it again.
            this.stopTimer();
            this.startTimer();
        }
    }

    // Step forwards one step.  A no-op if the animation is not currently paused
    step() {
        if (this.awaitingStep) {
            this.startNextBlock();
            this.fireEvent("AnimationStarted", "NoData");
            this.currentlyAnimating = true;
            // Re-kick thie timer.  The timer should be going now, but we've had some difficulty with
            // it timing itself out, so we'll be safe and kick it now.
            this.stopTimer();
            this.startTimer();
        }
    }

    skipBack() {
        var keepUndoing = this.undoAnimationStepIndices != null && this.undoAnimationStepIndices.length != 0;
        if (keepUndoing) {
            for (var i = 0; this.currentBlock != null && i < this.currentBlock.length; i++) {
                var objectID = this.currentBlock[i].objectID;
                this.animatedObjects.setNodePosition(
                    objectID,
                    this.currentBlock[i].toX,
                    this.currentBlock[i].toY
                );
            }
            if (this.doingUndo) {
                this.finishUndoBlock(this.undoStack.pop());
            }
            while (keepUndoing) {
                this.undoLastBlock();
                for (var i = 0; i < this.currentBlock.length; i++) {
                    objectID = this.currentBlock[i].objectID;
                    this.animatedObjects.setNodePosition(
                        objectID,
                        this.currentBlock[i].toX,
                        this.currentBlock[i].toY
                    );
                }
                keepUndoing = this.finishUndoBlock(this.undoStack.pop());
            }
            this.stopTimer();
            this.animatedObjects.update();
            this.animatedObjects.draw();
            if (this.undoStack == null || this.undoStack.length == 0) {
                this.fireEvent("AnimationUndoUnavailable", "NoData");
            }
        }
    }

    skipForward() {
        if (this.currentlyAnimating) {
            this.animatedObjects.runFast = true;
            while (this.AnimationSteps != null && this.currentAnimation < this.AnimationSteps.length) {
                for (var i = 0; this.currentBlock != null && i < this.currentBlock.length; i++) {
                    var objectID = this.currentBlock[i].objectID;
                    this.animatedObjects.setNodePosition(
                        objectID,
                        this.currentBlock[i].toX,
                        this.currentBlock[i].toY
                    );
                }
                if (this.doingUndo) {
                    this.finishUndoBlock(this.undoStack.pop());
                }
                this.startNextBlock();
                for (var i = 0; i < this.currentBlock.length; i++) {
                    var objectID = this.currentBlock[i].objectID;
                    this.animatedObjects.setNodePosition(
                        objectID,
                        this.currentBlock[i].toX,
                        this.currentBlock[i].toY
                    );
                }
            }
            this.animatedObjects.update();
            this.currentlyAnimating = false;
            this.awaitingStep = false;
            this.doingUndo = false;

            this.animatedObjects.runFast = false;
            this.fireEvent("AnimationEnded", "NoData");
            this.stopTimer();
            this.animatedObjects.update();
            this.animatedObjects.draw();
        }
    }

    finishUndoBlock(undoBlock) {
        for (var i = undoBlock.length - 1; i >= 0; i--) {
            undoBlock[i].undoInitialStep(this.animatedObjects);
        }
        this.doingUndo = false;

        // If we are at the final end of the animation ...
        if (this.undoAnimationStepIndices.length == 0) {
            this.awaitingStep = false;
            this.currentlyAnimating = false;
            this.undoAnimationStepIndices = this.undoAnimationStepIndicesStack.pop();
            this.AnimationSteps = this.previousAnimationSteps.pop();
            this.fireEvent("AnimationEnded", "NoData");
            this.fireEvent("AnimationUndo", "NoData");
            this.currentBlock = [];
            if (this.undoStack == null || this.undoStack.length == 0) {
                this.currentlyAnimating = false;
                this.awaitingStep = false;
                this.fireEvent("AnimationUndoUnavailable", "NoData");
            }
            this.stopTimer();
            this.animatedObjects.update();
            this.animatedObjects.draw();
            return false;
        }
        return true;
    }

    undoLastBlock() {
        if (this.undoAnimationStepIndices.length == 0) {
            // Nothing on the undo stack.  Return
            return;
        }
        if (this.undoAnimationStepIndices.length > 0) {
            this.doingUndo = true;
            var anyAnimations = false;
            this.currentAnimation = this.undoAnimationStepIndices.pop();
            this.currentBlock = [];
            var undo = this.undoStack[this.undoStack.length - 1];
            for (var i = undo.length - 1; i >= 0; i--) {
                var animateNext = undo[i].addUndoAnimation(this.currentBlock);
                anyAnimations = anyAnimations || animateNext;
            }
            this.currFrame = 0;

            // Hack:  If there are not any animations, and we are currently paused,
            // then set the current frame to the end of the animation, so that we will
            // advance immediagely upon the next step button.  If we are not paused, then
            // animate as normal.
            if (!anyAnimations && this.animationPaused()) {
                this.currFrame = this.animationBlockLength();
            }
            this.currentlyAnimating = true;
        }
    }

    startNextBlock() {
        this.awaitingStep = false;
        this.currentBlock = [];
        var undoBlock = [];
        if (this.currentAnimation == this.AnimationSteps.length) {
            this.currentlyAnimating = false;
            this.awaitingStep = false;
            this.fireEvent("AnimationEnded", "NoData");
            this.stopTimer();
            this.animatedObjects.update();
            this.animatedObjects.draw();
            return;
        }
        this.undoAnimationStepIndices.push(this.currentAnimation);

        var foundBreak = false;
        var anyAnimations = false;

        while (this.currentAnimation < this.AnimationSteps.length && !foundBreak) {
            var args = this.AnimationSteps[this.currentAnimation].split("<;>");
            // console.log(...args);
            var cmd = args.shift().toUpperCase();
            var id = Number(args.shift());
            if (cmd == "CREATECIRCLE") {
                var label = args.shift();
                var x = Number(args.shift());
                var y = Number(args.shift());
                undoBlock.push(new UndoCreate(id));
                this.animatedObjects.addCircleObject(id, label);
                this.animatedObjects.setNodePosition(id, x, y);
            }
            else if (cmd == "CONNECT") {
                var toID = Number(args.shift());
                var color = this.parseColor(args.shift(), "black");
                var curve = Number(args.shift()) || 0.0;
                var directed = this.parseBool(args.shift(), true);
                var label = args.shift() || "";
                var connectionPoint = Number(args.shift()) || 0;
                undoBlock.push(new UndoConnect(id, toID, false));
                this.animatedObjects.connectEdge(id, toID, color, curve, directed, label, connectionPoint);
            }
            else if (cmd == "CREATERECTANGLE") {
                var label = args.shift();
                var width = Number(args.shift());
                var height = Number(args.shift());
                var x = Number(args.shift());
                var y = Number(args.shift());
                var xJustify = args.shift() || "center";
                var yJustify = args.shift() || "center";
                undoBlock.push(new UndoCreate(id));
                this.animatedObjects.addRectangleObject(id, label, width, height, xJustify, yJustify);
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
            }
            else if (cmd == "MOVE") {
                var fromX = this.animatedObjects.getNodeX(id);
                var fromY = this.animatedObjects.getNodeY(id);
                var toX = Number(args.shift());
                var toY = Number(args.shift());
                undoBlock.push(new UndoMove(id, toX, toY, fromX, fromY));
                this.currentBlock.push(new SingleAnimation(id, fromX, fromY, toX, toY));
                anyAnimations = true;
            }
            else if (cmd == "MOVETOALIGNRIGHT") {
                var fromX = this.animatedObjects.getNodeX(id);
                var fromY = this.animatedObjects.getNodeY(id);
                var otherId = Number(args.shift());
                var [toX, toY] = this.animatedObjects.getAlignRightPos(id, otherId);
                undoBlock.push(new UndoMove(id, toX, toY, fromX, fromY));
                this.currentBlock.push(new SingleAnimation(id, fromX, fromY, toX, toY));
                anyAnimations = true;
            }
            else if (cmd == "STEP") {
                foundBreak = true;
            }
            else if (cmd == "SETFOREGROUNDCOLOR") {
                var oldColor = this.animatedObjects.foregroundColor(id);
                var color = this.parseColor(args.shift());
                undoBlock.push(new UndoSetForegroundColor(id, oldColor));
                this.animatedObjects.setForegroundColor(id, color);
            }
            else if (cmd == "SETBACKGROUNDCOLOR") {
                var oldColor = this.animatedObjects.backgroundColor(id);
                var color = this.parseColor(args.shift());
                undoBlock.push(new UndoSetBackgroundColor(id, oldColor));
                this.animatedObjects.setBackgroundColor(id, color);
            }
            else if (cmd == "SETHIGHLIGHT") {
                var highlight = this.parseBool(args.shift());
                undoBlock.push(new UndoHighlight(id, !highlight));
                this.animatedObjects.setHighlight(id, highlight);
            }
            else if (cmd == "DISCONNECT") {
                var toID = Number(args.shift());
                var removedEdge = this.animatedObjects.findEdge(id, toID);
                undoBlock.push(removedEdge.createUndoDisconnect());
                this.animatedObjects.disconnectEdge(id, toID);
            }
            else if (cmd == "SETALPHA") {
                var oldAlpha = this.animatedObjects.getAlpha(id);
                var alpha = Number(args.shift());
                undoBlock.push(new UndoSetAlpha(id, oldAlpha));
                this.animatedObjects.setAlpha(id, alpha);
            }
            else if (cmd == "SETTEXT") {
                var text = args.shift();
                var index = Number(args.shift()) || 0;
                var oldText = this.animatedObjects.getText(id, index);
                undoBlock.push(new UndoSetText(id, oldText, index));
                this.animatedObjects.setText(id, text, index);
            }
            else if (cmd == "DELETE") {
                var removedObject = this.animatedObjects.getObject(id);
                var removedEdges = this.animatedObjects.findIncidentEdges(id);
                for (var edge of removedEdges) undoBlock.push(edge.createUndoDisconnect());
                undoBlock.push(removedObject.createUndoDelete()); // This must come after the previous line
                this.animatedObjects.disconnectIncidentEdges(id);
                this.animatedObjects.removeObject(id);
            }
            else if (cmd == "CREATEHIGHLIGHTCIRCLE") {
                var color = this.parseColor(args.shift());
                var x = Number(args.shift());
                var y = Number(args.shift());
                var radius = Number(args.shift()) || 20;
                undoBlock.push(new UndoCreate(id));
                this.animatedObjects.addHighlightCircleObject(id, color, radius);
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
            }
            else if (cmd == "CREATELABEL") {
                var label = args.shift();
                var x = Number(args.shift());
                var y = Number(args.shift());
                var centering = this.parseBool(args.shift(), true);
                undoBlock.push(new UndoCreate(id));
                this.animatedObjects.addLabelObject(id, label, centering);
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
            }
            else if (cmd == "SETEDGECOLOR") {
                var toID = Number(args.shift());
                var color = this.parseColor(args.shift());
                var oldColor = this.animatedObjects.getEdgeColor(id, toID);
                undoBlock.push(new UndoSetEdgeColor(id, toID, oldColor));
                this.animatedObjects.setEdgeColor(id, toID, color);
            }
            else if (cmd == "SETEDGEALPHA") {
                var toID = Number(args.shift());
                var alpha = Number(args.shift());
                var oldAlpha = this.animatedObjects.getEdgeAlpha(id, toID);
                undoBlock.push(new UndoSetEdgeAlpha(id, toID, oldAlpha));
                this.animatedObjects.setEdgeAlpha(id, toID, alpha);
            }
            else if (cmd == "SETEDGEHIGHLIGHT") {
                var toID = Number(args.shift());
                var highlight = this.parseBool(args.shift());
                var oldHighlight = this.animatedObjects.getEdgeHighlight(id, toID);
                undoBlock.push(new UndoHighlightEdge(id, toID, oldHighlight));
                this.animatedObjects.setEdgeHighlight(id, toID, highlight);
            }
            else if (cmd == "SETHEIGHT") {
                var height = Number(args.shift());
                var oldHeight = this.animatedObjects.getHeight(id);
                undoBlock.push(new UndoSetHeight(id, oldHeight));
                this.animatedObjects.setHeight(id, height);
            }
            else if (cmd == "SETLAYER") {
                var layer = Number(args.shift());
                // TODO: Add undo information here
                this.animatedObjects.setLayer(id, layer);
            }
            else if (cmd == "CREATELINKEDLIST") {
                var label = args.shift();
                var width = Number(args.shift());
                var height = Number(args.shift());
                var x = Number(args.shift());
                var y = Number(args.shift());
                var linkPercent = Number(args.shift()) || 0.25;
                var verticalOrientation = this.parseBool(args.shift(), true);
                var linkPosEnd = this.parseBool(args.shift(), false);
                var numLabels = Number(args.shift()) || 1;
                undoBlock.push(new UndoCreate(id));
                this.animatedObjects.addLinkedListObject(
                    id, label, width, height,
                    linkPercent, verticalOrientation, linkPosEnd, numLabels
                );
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
            }
            else if (cmd == "SETNULL") {
                var nullVal = this.parseBool(args.shift());
                var oldNull = this.animatedObjects.getNull(id);
                undoBlock.push(new UndoSetNull(id, oldNull));
                this.animatedObjects.setNull(id, nullVal);
            }
            else if (cmd == "SETTEXTCOLOR") {
                var color = this.parseColor(args.shift());
                var index = Number(args.shift()) || 0;
                var oldColor = this.animatedObjects.getTextColor(id, index);
                undoBlock.push(new UndoSetTextColor(id, oldColor, index));
                this.animatedObjects.setTextColor(id, color, index);
            }
            else if (cmd == "CREATEBTREENODE") {
                var widthPerElem = Number(args.shift());
                var height = Number(args.shift());
                var numElems = Number(args.shift());
                var x = Number(args.shift());
                var y = Number(args.shift());
                var bgColor = this.parseColor(args.shift(), "white");
                var fgColor = this.parseColor(args.shift(), "black");
                undoBlock.push(new UndoCreate(id));
                this.animatedObjects.addBTreeNode(id, widthPerElem, height, numElems, bgColor, fgColor);
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
            }
            else if (cmd == "SETWIDTH") {
                var width = Number(args.shift());
                var oldWidth = this.animatedObjects.getWidth(id);
                undoBlock.push(new UndoSetWidth(id, oldWidth));
                this.animatedObjects.setWidth(id, width);
            }
            else if (cmd == "SETNUMELEMENTS") {
                var numElems = Number(args.shift());
                var removedObject = this.animatedObjects.getObject(id);
                var oldNumElems = removedObject.getNumElements();
                undoBlock.push(new UndoSetNumElements(removedObject, oldNumElems, numElems));
                this.animatedObjects.setNumElements(id, numElems);
            }
            else if (cmd == "SETPOSITION") {
                var x = Number(args.shift());
                var y = Number(args.shift());
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoSetPosition(id, oldX, oldY));
                this.animatedObjects.setNodePosition(id, x, y);
            }
            else if (cmd == "ALIGNMIDDLE") {
                var otherID = Number(args.shift());
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoSetPosition(id, oldX, oldY));
                this.animatedObjects.alignMiddle(id, otherID);
            }
            else if (cmd == "ALIGNRIGHT") {
                var otherID = Number(args.shift());
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoSetPosition(id, oldX, oldY));
                this.animatedObjects.alignRight(id, otherID);
            }
            else if (cmd == "ALIGNLEFT") {
                var otherID = Number(args.shift());
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoSetPosition(id, oldX, oldY));
                this.animatedObjects.alignLeft(id, otherID);
            }
            else if (cmd == "ALIGNTOP") {
                var otherID = Number(args.shift());
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoSetPosition(id, oldX, oldY));
                this.animatedObjects.alignTop(id, otherID);
            }
            else if (cmd == "ALIGNBOTTOM") {
                var otherID = Number(args.shift());
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoSetPosition(id, oldX, oldY));
                this.animatedObjects.alignBottom(id, otherID);
            }
            else if (cmd == "SETHIGHLIGHTINDEX") {
                var index = Number(args.shift());
                var oldIndex = this.animatedObjects.getHighlightIndex(id);
                undoBlock.push(new UndoSetHighlightIndex(id, oldIndex));
                this.animatedObjects.setHighlightIndex(id, index);
            }
            else {
                console.error("Unknown command: " + cmd);
            }
            this.currentAnimation++;
        }
        this.currFrame = 0;

        // Hack: If there are not any animations, and we are currently paused,
        // then set the current frame to the end of the anumation, so that we will
        // advance immediately upon the next step button. If we are not paused, then
        // animate as normal.
        if (!anyAnimations && this.animationPaused() || (!anyAnimations && this.currentAnimation == this.AnimationSteps.length)) {
            this.currFrame = this.animationBlockLength();
        }

        this.undoStack.push(undoBlock);
    }
}


class SingleAnimation {
    constructor(id, fromX, fromY, toX, toY) {
        this.objectID = id;
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
    }
}


class Toolbar {
    constructor(toolbar) {
        if (typeof (toolbar) == "string") {
            toolbar = document.getElementById(toolbar);
        }
        this.toolbar = toolbar;
        toolbar.innerHTML = "";
        toolbar.classList.add("toolbar");
    }

    element(tag, attrs, ...children) {
        var element = document.createElement(tag);
        if (attrs) {
            for (var name in attrs) {
                element.setAttribute(name, attrs[name]);
            }
        }
        if (children) {
            element.append(...children);
        }
        return element;
    }

    input(type, value, attrs) {
        if (!attrs) attrs = {};
        attrs["type"] = type;
        attrs["value"] = value;
        return this.element("input", attrs);
    }

    add(element) {
        return this.toolbar.appendChild(element);
    }

    addBreak() {
        return this.add(this.element("span", { class: "break" }, " "));
    }

    addLabel(...content) {
        return this.add(this.element("span", { class: "label" }, ...content));
    }

    addInput(type, value, attrs) {
        return this.add(this.input(type, value, attrs));
    }

    addButton(text, attrs) {
        return this.add(this.element("button", attrs, text));
    }

    addCheckbox(label, attrs) {
        if (!attrs) attrs = {};
        if (!attrs.id) attrs.id = `${this.toolbar.id}-${this.toolbar.childElementCount}`;
        var checkbox = this.addInput("checkbox", label, attrs);
        this.add(this.element("label", { for: attrs.id }, label));
        return checkbox;
    }

    addRadio(label, group, attrs) {
        if (!attrs) attrs = {};
        if (!attrs.id) attrs.id = `${this.toolbar.id}-${this.toolbar.childElementCount}`;
        attrs.name = group;
        var radio = this.addInput("radio", label, attrs);
        this.add(this.element("label", { for: attrs.id }, label));
        return radio;
    }

    addRadioButtons(labels, group, attrs) {
        var radioList = [];
        for (var lbl of labels) {
            radioList.push(this.addRadio(lbl, group, attrs));
        }
        return radioList;
    }

    addSelect(values, labels, attrs) {
        var options = [];
        for (var i = 0; i < values.length; i++) {
            options.push(
                this.element("option", { value: values[i] }, labels ? labels[i] : values[i])
            );
        }
        return this.add(this.element("select", attrs, ...options));
    }
}

