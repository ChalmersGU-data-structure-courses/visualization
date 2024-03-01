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

///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals Toolbar, EventListener, ObjectManager, UndoBlock, DEBUG */
/* exported initCanvas, AnimationManager, SingleAnimation */
///////////////////////////////////////////////////////////////////////////////

// Creates and returns an AnimationManager
function initCanvas(canvas, generalControlBar, algorithmControlBar) {
    // UI nodes should be given, otherwise use defaults.
    if (!(canvas instanceof HTMLElement)) canvas = document.getElementById(canvas || "canvas");
    generalControlBar = new Toolbar(generalControlBar || "generalAnimationControls");
    algorithmControlBar = new Toolbar(algorithmControlBar || "algorithmSpecificControls");

    const controlBars = [generalControlBar, algorithmControlBar];

    const animationSpeeds = {
        default: 75,
        values: [25, 50, 75, 100],
        labels: ["Slowest", "Slow", "Fast", "Fastest"],
    };

    const canvasSizes = {
        default: "750:450",
        values: ["500:300", "750:450", "1000:600"],
        labels: ["Small", "Medium", "Large"],
    };

    const am = new AnimationManager(canvas, controlBars, animationSpeeds, canvasSizes);
    am.algorithmControlBar = algorithmControlBar;
    return am;
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


class AnimationManager extends EventListener {
    DEFAULT_ANIMATION_SPEED = 75;
    DEFAULT_CANVAS_SIZE = "750:450";
    DEFAULT_PAUSED_VALUE = false;

    constructor(canvas, controlBars, animationSpeeds, canvasSizes) {
        super();

        const objectManager = new ObjectManager(canvas);
        // Holder for all animated objects.
        // All animation is done by manipulating objects in this container
        this.animatedObjects = objectManager;
        this.objectManager = objectManager; // TODO: change this to animatedObjects later
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
        const bar = this.controlBars[0];

        this.skipBackButton = bar.addButton("⏮", {title: "Skip back"});
        this.skipBackButton.onclick = this.skipBack.bind(this);
        this.stepBackButton = bar.addButton("⏴", {title: "Step back"});
        this.stepBackButton.onclick = this.stepBack.bind(this);
        this.playPauseBackButton = bar.addButton("⏯︎", {title: "Run/pause animation"});
        this.playPauseBackButton.onclick = this.togglePlayPause.bind(this);
        this.stepForwardButton = bar.addButton("⏵", {title: "Step forward"});
        this.stepForwardButton.onclick = this.step.bind(this);
        this.skipForwardButton = bar.addButton("⏭", {title: "Skip forward"});
        this.skipForwardButton.onclick = this.skipForward.bind(this);

        if (animationSpeeds) {
            bar.addBreak();
            bar.addLabel("Animation speed:");
            this.speedSelector = bar.addSelect(animationSpeeds.values, animationSpeeds.labels);
            this.speedSelector.onchange = this.updateAnimationSpeed.bind(this);
            const speed = this.getCookie("VisualizationSpeed") || animationSpeeds.default;
            this.speedSelector.value = speed;
        }

        if (canvasSizes) {
            bar.addBreak();
            bar.addLabel("Canvas size:");
            this.sizeSelector = bar.addSelect(canvasSizes.values, canvasSizes.labels);
            this.sizeSelector.onchange = this.updateCanvasSize.bind(this);
            const size = this.getCookie("VisualizationSize") || canvasSizes.default;
            this.sizeSelector.value = size;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // Utility methods

    lerp(from, to, percent) {
        return (to - from) * percent + from;
    }

    parseBool(value, defaultValue) {
        if (value == null) return defaultValue;
        if (typeof value === "string") {
            const uppercase = value.trim().toUpperCase();
            value = !(uppercase === "FALSE" || uppercase === "F" || uppercase === "0" || uppercase === "");
        }
        return Boolean(value);
    }

    parseColor(color, defaultColor) {
        if (!color) return defaultColor;
        if (color.startsWith("0x")) return `#${color.substring(2)}`;
        return color;
    }

    parseText(text) {
        if (text instanceof Array) text = text.join("\n");
        return text.toString();
    }

    getCookie(cookieName) {
        // console.log(`Current cookies: ${document.cookie}`);
        for (const cookie of document.cookie.split(";")) {
            const [x, y] = cookie.split("=", 2);
            if (x.trim() === cookieName) {
                return decodeURIComponent(y);
            }
        }
        return null;
    }

    setCookie(cookieName, value, expireDays) {
        value = encodeURIComponent(value);
        if (expireDays > 0) {
            const exdate = new Date();
            exdate.setDate(exdate.getDate() + expireDays);
            value += `; expires=${exdate.toUTCString()}`;
        }
        document.cookie = `${cookieName}=${value}`;
        // console.log(`Setting cookie ${cookieName} = ${value}`);
    }

    ///////////////////////////////////////////////////////////////////////////
    // The state of the toolbar

    togglePlayPause() {
        this.playPauseBackButton.value = this.animationPaused() ? "" : "paused";
        this.updatePaused();
    }

    updatePaused() {
        if (this.playPauseBackButton) {
            if (this.animationPaused()) {
                this.playPauseBackButton.innerText = "⏯︎";
                this.playPauseBackButton.setAttribute("title", "Run animation");
                if (!this.skipBackButton.disabled) {
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
        return this.playPauseBackButton?.value || this.DEFAULT_PAUSED_VALUE;
    }

    updateAnimationSpeed() {
        const speed = this.speedSelector?.value || this.DEFAULT_ANIMATION_SPEED;
        this.setCookie("VisualizationSpeed", speed, 30);
        // console.log(`New animation speed: ${speed}`);
    }

    animationBlockLength() {
        const speed = Number(this.speedSelector?.value) || this.DEFAULT_ANIMATION_SPEED;
        return Math.floor((100 - speed) / 2);
    }

    updateCanvasSize() {
        const size = this.sizeSelector?.value || this.DEFAULT_CANVAS_SIZE;
        let [w, h] = size.split(":").map((n) => parseInt(n));
        if (isNaN(w) || isNaN(h)) {
            [w, h] = this.DEFAULT_CANVAS_SIZE.split(":").map((n) => parseInt(n));
        }
        this.canvas.width = w;
        this.canvas.height = h;
        this.setCookie("VisualizationSize", `${w}:${h}`, 30);
        // console.log(`New canvas size: ${this.canvas.width} x ${this.canvas.height}`);
        this.animatedObjects.draw();
        this.fireEvent("CanvasSizeChanged", {width: this.canvas.width, height: this.canvas.height});
    }

    ///////////////////////////////////////////////////////////////////////////
    // Listeners

    animationWaiting() {
        if (this.playPauseBackButton) {
            this.stepForwardButton.disabled = false;
            if (!this.skipBackButton.disabled) {
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
            if (!this.skipBackButton.disabled && this.animationPaused()) {
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
            try {
                this.update();
                this.objectManager.draw();
            } catch (error) {
                this.stopTimer();
                console.error(error);
            }
        }, 30);
    }

    update() {
        if (this.currentlyAnimating) {
            const animBlockLength = this.animationBlockLength();
            this.currFrame = this.currFrame + 1;
            for (let i = 0; i < this.currentBlock.length; i++) {
                if (this.currFrame === animBlockLength || (this.currFrame === 1 && animBlockLength === 0)) {
                    this.animatedObjects.setNodePosition(
                        this.currentBlock[i].objectID,
                        this.currentBlock[i].toX,
                        this.currentBlock[i].toY,
                    );
                } else if (this.currFrame < animBlockLength) {
                    const objectID = this.currentBlock[i].objectID;
                    const percent = 1 / (animBlockLength - this.currFrame);
                    const oldX = this.animatedObjects.getNodeX(objectID);
                    const oldY = this.animatedObjects.getNodeY(objectID);
                    const targetX = this.currentBlock[i].toX;
                    const targetY = this.currentBlock[i].toY;
                    const newX = this.lerp(oldX, targetX, percent);
                    const newY = this.lerp(oldY, targetY, percent);
                    this.animatedObjects.setNodePosition(objectID, newX, newY);
                }
            }
            if (this.currFrame >= animBlockLength) {
                if (this.doingUndo) {
                    if (this.finishUndoBlock(this.undoStack.pop())) {
                        this.awaitingStep = true;
                        this.fireEvent("AnimationWaiting", "NoData");
                    }
                } else if (this.animationPaused() && (this.currentAnimation < this.AnimationSteps.length)) {
                    this.awaitingStep = true;
                    this.fireEvent("AnimationWaiting", "NoData");
                    this.currentBlock = [];
                } else {
                    this.startNextBlock();
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
        if (commands == null || commands.length === 0) {
            this.AnimationSteps = ["Step"];
        } else {
            this.AnimationSteps = commands;
        }
        this.undoAnimationStepIndices = [];
        this.currentAnimation = 0;
        this.startNextBlock();
        this.currentlyAnimating = true;
        this.fireEvent("AnimationStarted", "NoData");
        this.startTimer();
    }

    // Step backwards one step.  A no-op if the animation is not currently paused
    stepBack() {
        if (this.awaitingStep && this.undoStack != null && this.undoStack.length !== 0) {
            //  TODO:  Get events working correctly!
            this.fireEvent("AnimationStarted", "NoData");
            this.stopTimer();
            this.awaitingStep = false;
            this.undoLastBlock();
            // Re-kick thie timer.  The timer may or may not be running at this point,
            // so to be safe we'll kill it and start it again.
            this.stopTimer();
            this.startTimer();
        } else if (!this.currentlyAnimating && this.animationPaused() && this.undoAnimationStepIndices != null) {
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
        let keepUndoing = this.undoAnimationStepIndices != null && this.undoAnimationStepIndices.length !== 0;
        if (keepUndoing) {
            for (let i = 0; this.currentBlock != null && i < this.currentBlock.length; i++) {
                const objectID = this.currentBlock[i].objectID;
                this.animatedObjects.setNodePosition(
                    objectID,
                    this.currentBlock[i].toX,
                    this.currentBlock[i].toY,
                );
            }
            if (this.doingUndo) {
                this.finishUndoBlock(this.undoStack.pop());
            }
            while (keepUndoing) {
                this.undoLastBlock();
                for (let i = 0; i < this.currentBlock.length; i++) {
                    const objectID = this.currentBlock[i].objectID;
                    this.animatedObjects.setNodePosition(
                        objectID,
                        this.currentBlock[i].toX,
                        this.currentBlock[i].toY,
                    );
                }
                keepUndoing = this.finishUndoBlock(this.undoStack.pop());
            }
            this.stopTimer();
            this.animatedObjects.update();
            this.animatedObjects.draw();
            if (this.undoStack == null || this.undoStack.length === 0) {
                this.fireEvent("AnimationUndoUnavailable", "NoData");
            }
        }
    }

    skipForward() {
        if (this.currentlyAnimating) {
            this.animatedObjects.runFast = true;
            while (this.AnimationSteps != null && this.currentAnimation < this.AnimationSteps.length) {
                for (let i = 0; this.currentBlock != null && i < this.currentBlock.length; i++) {
                    const objectID = this.currentBlock[i].objectID;
                    this.animatedObjects.setNodePosition(
                        objectID,
                        this.currentBlock[i].toX,
                        this.currentBlock[i].toY,
                    );
                }
                if (this.doingUndo) {
                    this.finishUndoBlock(this.undoStack.pop());
                }
                this.startNextBlock();
                for (let i = 0; i < this.currentBlock.length; i++) {
                    const objectID = this.currentBlock[i].objectID;
                    this.animatedObjects.setNodePosition(
                        objectID,
                        this.currentBlock[i].toX,
                        this.currentBlock[i].toY,
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
        for (let i = undoBlock.length - 1; i >= 0; i--) {
            undoBlock[i].undoInitialStep(this.animatedObjects);
        }
        this.doingUndo = false;

        // If we are at the final end of the animation ...
        if (this.undoAnimationStepIndices.length === 0) {
            this.awaitingStep = false;
            this.currentlyAnimating = false;
            this.undoAnimationStepIndices = this.undoAnimationStepIndicesStack.pop();
            this.AnimationSteps = this.previousAnimationSteps.pop();
            this.fireEvent("AnimationEnded", "NoData");
            this.fireEvent("AnimationUndo", "NoData");
            this.currentBlock = [];
            if (this.undoStack == null || this.undoStack.length === 0) {
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
        if (this.undoAnimationStepIndices.length === 0) {
            // Nothing on the undo stack.  Return
            return;
        }
        if (this.undoAnimationStepIndices.length > 0) {
            this.doingUndo = true;
            let anyAnimations = false;
            this.currentAnimation = this.undoAnimationStepIndices.pop();
            this.currentBlock = [];
            const undo = this.undoStack[this.undoStack.length - 1];
            for (let i = undo.length - 1; i >= 0; i--) {
                const animateNext = undo[i].addUndoAnimation(this.currentBlock);
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
        const undoBlock = [];
        if (this.currentAnimation === this.AnimationSteps.length) {
            this.currentlyAnimating = false;
            this.awaitingStep = false;
            this.fireEvent("AnimationEnded", "NoData");
            this.stopTimer();
            this.animatedObjects.update();
            this.animatedObjects.draw();
            return;
        }
        this.undoAnimationStepIndices.push(this.currentAnimation);

        let foundBreak = false;
        let anyAnimations = false;

        while (this.currentAnimation < this.AnimationSteps.length && !foundBreak) {
            let args = this.AnimationSteps[this.currentAnimation];
            if (typeof args === "string") {
                args = args.split("<;>");
            } else {
                args = [...args]; // Make a shallow copy so to not accidentally modify the original list
            }
            if (DEBUG) console.log("-->", ...args);
            const cmd = args.shift().toUpperCase();
            const id = Number(args.shift());
            if (cmd === "CREATECIRCLE") {
                const label = this.parseText(args.shift());
                const x = Number(args.shift());
                const y = Number(args.shift());
                undoBlock.push(new UndoBlock.Create(id));
                this.animatedObjects.addCircleObject(id, label);
                this.animatedObjects.setNodePosition(id, x, y);
            } else if (cmd === "CONNECT") {
                const toID = Number(args.shift());
                const color = this.parseColor(args.shift(), "black");
                const curve = Number(args.shift()) || 0.0;
                const directed = this.parseBool(args.shift(), true);
                const label = args.shift() || "";
                const connectionPoint = Number(args.shift()) || 0;
                undoBlock.push(new UndoBlock.Connection(id, toID, false));
                this.animatedObjects.connectEdge(id, toID, color, curve, directed, label, connectionPoint);
            } else if (cmd === "CREATERECTANGLE") {
                const label = this.parseText(args.shift());
                const width = Number(args.shift());
                const height = Number(args.shift());
                const x = Number(args.shift());
                const y = Number(args.shift());
                const xJustify = args.shift() || "center";
                const yJustify = args.shift() || "center";
                undoBlock.push(new UndoBlock.Create(id));
                this.animatedObjects.addRectangleObject(id, label, width, height, xJustify, yJustify);
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
            } else if (cmd === "MOVE") {
                const fromX = this.animatedObjects.getNodeX(id);
                const fromY = this.animatedObjects.getNodeY(id);
                const toX = Number(args.shift());
                const toY = Number(args.shift());
                undoBlock.push(new UndoBlock.Move(id, toX, toY, fromX, fromY));
                this.currentBlock.push(new SingleAnimation(id, fromX, fromY, toX, toY));
                anyAnimations = true;
            } else if (cmd === "MOVETOALIGNRIGHT") {
                const fromX = this.animatedObjects.getNodeX(id);
                const fromY = this.animatedObjects.getNodeY(id);
                const otherId = Number(args.shift());
                const [toX, toY] = this.animatedObjects.getAlignRightPos(id, otherId);
                undoBlock.push(new UndoBlock.Move(id, toX, toY, fromX, fromY));
                this.currentBlock.push(new SingleAnimation(id, fromX, fromY, toX, toY));
                anyAnimations = true;
            } else if (cmd === "STEP") {
                foundBreak = true;
            } else if (cmd === "SETFOREGROUNDCOLOR") {
                const oldColor = this.animatedObjects.foregroundColor(id);
                const color = this.parseColor(args.shift());
                undoBlock.push(new UndoBlock.SetForegroundColor(id, oldColor));
                this.animatedObjects.setForegroundColor(id, color);
            } else if (cmd === "SETBACKGROUNDCOLOR") {
                const oldColor = this.animatedObjects.backgroundColor(id);
                const color = this.parseColor(args.shift());
                undoBlock.push(new UndoBlock.SetBackgroundColor(id, oldColor));
                this.animatedObjects.setBackgroundColor(id, color);
            } else if (cmd === "SETHIGHLIGHT") {
                const highlight = this.parseBool(args.shift());
                undoBlock.push(new UndoBlock.Highlight(id, !highlight));
                this.animatedObjects.setHighlight(id, highlight);
            } else if (cmd === "DISCONNECT") {
                const toID = Number(args.shift());
                const removedEdge = this.animatedObjects.findEdge(id, toID);
                undoBlock.push(removedEdge.createUndoDisconnect());
                this.animatedObjects.disconnectEdge(id, toID);
            } else if (cmd === "SETALPHA") {
                const oldAlpha = this.animatedObjects.getAlpha(id);
                const alpha = Number(args.shift());
                undoBlock.push(new UndoBlock.SetAlpha(id, oldAlpha));
                this.animatedObjects.setAlpha(id, alpha);
            } else if (cmd === "SETTEXT") {
                const text = this.parseText(args.shift());
                const index = Number(args.shift()) || 0;
                if (id === 0 && DEBUG) console.warn(text); // We abuse warnings to make messages show in the console
                const oldText = this.animatedObjects.getText(id, index);
                undoBlock.push(new UndoBlock.SetText(id, oldText, index));
                this.animatedObjects.setText(id, text, index);
            } else if (cmd === "DELETE") {
                const removedObject = this.animatedObjects.getObject(id);
                const removedEdges = this.animatedObjects.findIncidentEdges(id);
                for (const edge of removedEdges) undoBlock.push(edge.createUndoDisconnect());
                undoBlock.push(removedObject.createUndoDelete()); // This must come after the previous line
                this.animatedObjects.disconnectIncidentEdges(id);
                this.animatedObjects.removeObject(id);
            } else if (cmd === "CREATEHIGHLIGHTCIRCLE") {
                const color = this.parseColor(args.shift());
                const x = Number(args.shift());
                const y = Number(args.shift());
                const radius = Number(args.shift()) || 20;
                undoBlock.push(new UndoBlock.Create(id));
                this.animatedObjects.addHighlightCircleObject(id, color, radius);
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
            } else if (cmd === "CREATELABEL") {
                const label = this.parseText(args.shift());
                const x = Number(args.shift());
                const y = Number(args.shift());
                const centering = this.parseBool(args.shift(), true);
                undoBlock.push(new UndoBlock.Create(id));
                this.animatedObjects.addLabelObject(id, label, centering);
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
            } else if (cmd === "SETEDGECOLOR") {
                const toID = Number(args.shift());
                const color = this.parseColor(args.shift());
                const oldColor = this.animatedObjects.getEdgeColor(id, toID);
                undoBlock.push(new UndoBlock.SetEdgeColor(id, toID, oldColor));
                this.animatedObjects.setEdgeColor(id, toID, color);
            } else if (cmd === "SETEDGEALPHA") {
                const toID = Number(args.shift());
                const alpha = Number(args.shift());
                const oldAlpha = this.animatedObjects.getEdgeAlpha(id, toID);
                undoBlock.push(new UndoBlock.SetEdgeAlpha(id, toID, oldAlpha));
                this.animatedObjects.setEdgeAlpha(id, toID, alpha);
            } else if (cmd === "SETEDGEHIGHLIGHT") {
                const toID = Number(args.shift());
                const highlight = this.parseBool(args.shift());
                const oldHighlight = this.animatedObjects.getEdgeHighlight(id, toID);
                undoBlock.push(new UndoBlock.HighlightEdge(id, toID, oldHighlight));
                this.animatedObjects.setEdgeHighlight(id, toID, highlight);
            } else if (cmd === "SETHEIGHT") {
                const height = Number(args.shift());
                const oldHeight = this.animatedObjects.getHeight(id);
                undoBlock.push(new UndoBlock.SetHeight(id, oldHeight));
                this.animatedObjects.setHeight(id, height);
            } else if (cmd === "SETLAYER") {
                const layer = Number(args.shift());
                // TODO: Add undo information here
                this.animatedObjects.setLayer(id, layer);
            } else if (cmd === "CREATELINKEDLIST") {
                const label = this.parseText(args.shift());
                const width = Number(args.shift());
                const height = Number(args.shift());
                const x = Number(args.shift());
                const y = Number(args.shift());
                const linkPercent = Number(args.shift()) || 0.25;
                const verticalOrientation = this.parseBool(args.shift(), true);
                const linkPosEnd = this.parseBool(args.shift(), false);
                const numLabels = Number(args.shift()) || 1;
                undoBlock.push(new UndoBlock.Create(id));
                this.animatedObjects.addLinkedListObject(
                    id, label, width, height,
                    linkPercent, verticalOrientation, linkPosEnd, numLabels,
                );
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
            } else if (cmd === "SETNULL") {
                const nullVal = this.parseBool(args.shift());
                const oldNull = this.animatedObjects.getNull(id);
                undoBlock.push(new UndoBlock.SetNull(id, oldNull));
                this.animatedObjects.setNull(id, nullVal);
            } else if (cmd === "SETTEXTCOLOR") {
                const color = this.parseColor(args.shift());
                const index = Number(args.shift()) || 0;
                const oldColor = this.animatedObjects.getTextColor(id, index);
                undoBlock.push(new UndoBlock.SetTextColor(id, oldColor, index));
                this.animatedObjects.setTextColor(id, color, index);
            } else if (cmd === "CREATEBTREENODE") {
                const widthPerElem = Number(args.shift());
                const height = Number(args.shift());
                const numElems = Number(args.shift());
                const x = Number(args.shift());
                const y = Number(args.shift());
                const bgColor = this.parseColor(args.shift(), "white");
                const fgColor = this.parseColor(args.shift(), "black");
                undoBlock.push(new UndoBlock.Create(id));
                this.animatedObjects.addBTreeNode(id, widthPerElem, height, numElems, bgColor, fgColor);
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
            } else if (cmd === "SETWIDTH") {
                const width = Number(args.shift());
                const oldWidth = this.animatedObjects.getWidth(id);
                undoBlock.push(new UndoBlock.SetWidth(id, oldWidth));
                this.animatedObjects.setWidth(id, width);
            } else if (cmd === "SETNUMELEMENTS") {
                const numElems = Number(args.shift());
                const removedObject = this.animatedObjects.getObject(id);
                const oldNumElems = removedObject.getNumElements();
                undoBlock.push(new UndoBlock.SetNumElements(removedObject, oldNumElems, numElems));
                this.animatedObjects.setNumElements(id, numElems);
            } else if (cmd === "SETPOSITION") {
                const x = Number(args.shift());
                const y = Number(args.shift());
                const oldX = this.animatedObjects.getNodeX(id);
                const oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoBlock.SetPosition(id, oldX, oldY));
                this.animatedObjects.setNodePosition(id, x, y);
            } else if (cmd === "ALIGNMIDDLE") {
                const otherID = Number(args.shift());
                const oldX = this.animatedObjects.getNodeX(id);
                const oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoBlock.SetPosition(id, oldX, oldY));
                this.animatedObjects.alignMiddle(id, otherID);
            } else if (cmd === "ALIGNRIGHT") {
                const otherID = Number(args.shift());
                const oldX = this.animatedObjects.getNodeX(id);
                const oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoBlock.SetPosition(id, oldX, oldY));
                this.animatedObjects.alignRight(id, otherID);
            } else if (cmd === "ALIGNLEFT") {
                const otherID = Number(args.shift());
                const oldX = this.animatedObjects.getNodeX(id);
                const oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoBlock.SetPosition(id, oldX, oldY));
                this.animatedObjects.alignLeft(id, otherID);
            } else if (cmd === "ALIGNTOP") {
                const otherID = Number(args.shift());
                const oldX = this.animatedObjects.getNodeX(id);
                const oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoBlock.SetPosition(id, oldX, oldY));
                this.animatedObjects.alignTop(id, otherID);
            } else if (cmd === "ALIGNBOTTOM") {
                const otherID = Number(args.shift());
                const oldX = this.animatedObjects.getNodeX(id);
                const oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoBlock.SetPosition(id, oldX, oldY));
                this.animatedObjects.alignBottom(id, otherID);
            } else if (cmd === "SETHIGHLIGHTINDEX") {
                const index = Number(args.shift());
                const oldIndex = this.animatedObjects.getHighlightIndex(id);
                undoBlock.push(new UndoBlock.SetHighlightIndex(id, oldIndex));
                this.animatedObjects.setHighlightIndex(id, index);
            } else {
                console.error(`Unknown command: ${cmd}`);
            }
            this.currentAnimation++;
        }
        this.currFrame = 0;

        // Hack: If there are not any animations, and we are currently paused,
        // then set the current frame to the end of the anumation, so that we will
        // advance immediately upon the next step button. If we are not paused, then
        // animate as normal.
        if ((!anyAnimations && this.animationPaused()) || (!anyAnimations && this.currentAnimation === this.AnimationSteps.length)) {
            this.currFrame = this.animationBlockLength();
        }

        this.undoStack.push(undoBlock);
    }
}
