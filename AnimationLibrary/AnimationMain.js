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


// Utility function to read a cookie
function getCookie(cookieName)
{
    // console.log(`Current cookies: ${document.cookie}`);
    for (var cookie of document.cookie.split(";")) {
        var [x, y] = cookie.split("=", 2);
        if (x.trim() == cookieName) {
            return decodeURIComponent(y);
        }
    }
}


// Utility funciton to write a cookie
function setCookie(cookieName, value, expireDays)
{
    value = encodeURIComponent(value);
    if (expireDays > 0) {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + expireDays);
        value += "; expires=" + exdate.toUTCString();
    }
    document.cookie = cookieName + "=" + value;
    // console.log(`Setting cookie ${cookieName} = ${value}`);
}


// Utility function for parsing a boolean value
function parseBool(str, default_)
{
    if (str == null) return default_;
    var uppercase = str.trim().toUpperCase();
    var returnVal = !(uppercase == "FALSE" || uppercase == "F" || uppercase == "0" || uppercase == "");
    return returnVal;
}


// Utility function for parsing a color value
function parseColor(clr, default_)
{
    if (clr == null) return default_;
    if (clr.charAt(0) == "#") {
        return clr;
    }
    else if (clr.substring(0,2) == "0x") {
        return "#" + clr.substring(2);
    }
}


var ANIMATION_SPEED_DEFAULT = "Fast";
var ANIMATION_SPEEDS = {
    "Slowest": 25,
    "Slow": 50,
    "Fast": 75,
    "Fastest": 100,
}

var CANVAS_SIZE_DEFAULT = "Large";
var CANVAS_SIZES = {
    "Small":  {w: 500, h: 300},
    "Medium": {w: 750, h: 450},
    "Large":  {w:1000, h: 600},
}


function returnSubmit(field, funct, maxsize, intOnly)
{
    if (maxsize != undefined) {
        field.size = maxsize;
    }

    return function(event)
    {
        var keyASCII = 0;
        if (window.event) { // IE
            keyASCII = event.keyCode;
        } else if (event.which) { // Netscape/Firefox/Opera
            keyASCII = event.which;
        }

        if (keyASCII == 13) {
            funct();
            return false;
        } 
        else if (keyASCII == 59  || keyASCII == 45 || keyASCII == 46 || keyASCII == 190 || keyASCII == 173) {
            return false;
        } 
        else if (maxsize != undefined && field.value.length >= maxsize || intOnly && (keyASCII < 48 || keyASCII > 57)) {
            if (!controlKey(keyASCII))
                return false;
        }
        return true;
    }
}


function animWaiting()
{
    this.stepForwardButton.disabled = false;
    if (this.skipBackButton.disabled == false) {
        this.stepBackButton.disabled = false;
    }
    this.objectManager.statusReport.setText("Animation Paused");
    this.objectManager.statusReport.setForegroundColor("#FF0000");
}


function animStarted()
{
    this.skipForwardButton.disabled = false;
    this.skipBackButton.disabled = false;
    this.stepForwardButton.disabled = true;
    this.stepBackButton.disabled = true;
    this.objectManager.statusReport.setText("Animation Running");
    this.objectManager.statusReport.setForegroundColor("#009900");
}


function animEnded()
{
    this.skipForwardButton.disabled = true;
    this.stepForwardButton.disabled = true;
    if (this.skipBackButton.disabled == false && this.animationPaused) {
        this.stepBackButton.disabled = false;
    }
    this.objectManager.statusReport.setText("Animation Completed");
    this.objectManager.statusReport.setForegroundColor("#000000");
}


function animUndoUnavailable()
{
    this.skipBackButton.disabled = true;
    this.stepBackButton.disabled = true;
}


function timeout()
{
    // We need to set the timeout *first*, otherwise if we
    // try to clear it later, we get behavior we don't want ...
    this.timer = setTimeout(timeout.bind(this), 30);
    this.update();
    this.objectManager.draw();
}


function togglePlayPause()
{
    this.setPaused(!this.animationPaused);
}


// Creates and returs an AnimationManager
function initCanvas(canvas, generalControlBar, algorithmControlBar)
{
    // UI nodes should be given, otherwise use defaults.
    if (!(canvas instanceof HTMLElement)) canvas = document.getElementById(canvas || "canvas");
    generalControlBar = new Toolbar(generalControlBar || "generalAnimationControls");
    algorithmControlBar = new Toolbar(algorithmControlBar || "algorithmSpecificControls");

    var objectManager = new ObjectManager(canvas);
    var animationManager = new AnimationManager(objectManager);
    animationManager.canvas = canvas;
    animationManager.generalControlBar = generalControlBar;
    animationManager.algorithmControlBar = algorithmControlBar;

    animationManager.skipBackButton = generalControlBar.addInput("Button", "⏮", {title: "Skip back"});
    animationManager.skipBackButton.onclick = animationManager.skipBack.bind(animationManager);
    animationManager.stepBackButton = generalControlBar.addInput("Button", "⏴", {title: "Step back"});
    animationManager.stepBackButton.onclick = animationManager.stepBack.bind(animationManager);
    animationManager.playPauseBackButton = generalControlBar.addInput("Button", "⏯︎", {title: "Run/pause animation"});
    animationManager.playPauseBackButton.onclick = togglePlayPause.bind(animationManager);
    animationManager.stepForwardButton = generalControlBar.addInput("Button", "⏵", {title: "Step forward"});
    animationManager.stepForwardButton.onclick = animationManager.step.bind(animationManager) ;
    animationManager.skipForwardButton = generalControlBar.addInput("Button", "⏭", {title: "Skip forward"});
    animationManager.skipForwardButton.onclick = animationManager.skipForward.bind(animationManager);

    animationManager.setPaused(false);

    generalControlBar.addBreak();

    generalControlBar.addLabel("Animation speed:");
    animationManager.speedSelector = generalControlBar.addSelect(Object.keys(ANIMATION_SPEEDS));
    animationManager.speedSelector.onchange = animationManager.setAnimationSpeed.bind(animationManager);

    var speed = getCookie("VisualizationSpeed");
    if (!speed) speed = ANIMATION_SPEED_DEFAULT;
    animationManager.setAnimationSpeed(speed);

    generalControlBar.addBreak();

    generalControlBar.addLabel("Canvas size:");
    animationManager.sizeSelector = generalControlBar.addSelect(Object.keys(CANVAS_SIZES));
    animationManager.sizeSelector.onchange = animationManager.changeSize.bind(animationManager);

    var size = getCookie("VisualizationSize");
    if (!size) size = CANVAS_SIZE_DEFAULT;
    animationManager.changeSize(size);

    animationManager.addListener("AnimationStarted", animationManager, animStarted);
    animationManager.addListener("AnimationEnded", animationManager, animEnded);
    animationManager.addListener("AnimationWaiting", animationManager, animWaiting);
    animationManager.addListener("AnimationUndoUnavailable", animationManager, animUndoUnavailable);
    return animationManager;
}


function AnimationManager(objectManager)
{
    AnimationManager.superclass.constructor.call(this);

    // Holder for all animated objects.
    // All animation is done by manipulating objects in this container
    this.animatedObjects = objectManager;
    // TODO: change this to animatedObjects later
    this.objectManager = objectManager;

    // Control variables for stopping / starting animation
    this.animationPaused = false;
    this.awaitingStep = false;
    this.currentlyAnimating = false;

    // Array holding the code for the animation.  This is
    // an array of strings, each of which is an animation command
    // currentAnimation is an index into this array
    this.AnimationSteps = [];
    this.currentAnimation = 0;

    this.previousAnimationSteps = [];

    // Control variables for where we are in the current animation block.
    //  currFrame holds the frame number of the current animation block,
    //  while animationBlockLength holds the length of the current animation
    //  block (in frame numbers).
    this.currFrame = 0;
    this.animationBlockLength = 0;

    //  The animation block that is currently running.  Array of singleAnimations
    this.currentBlock = null;

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

    this.animationBlockLength = 10;

    this.lerp = function(from, to, percent)
    {
        return (to - from) * percent + from;
    }

    // Pause / unpause animation
    this.setPaused = function(pausedValue)
    {
        this.animationPaused = pausedValue;
        if (this.animationPaused) {
            this.playPauseBackButton.setAttribute("value", "⏯︎");
            this.playPauseBackButton.setAttribute("title", "Run animation");
            if (this.skipBackButton.disabled == false) {
                this.stepBackButton.disabled = false;
            }
        }
        else {
            this.playPauseBackButton.setAttribute("value", "⏸");
            this.playPauseBackButton.setAttribute("title", "Pause animation");
        }
        if (!this.animationPaused) {
            this.step();
        }
    }

    // Set the speed of the animation
    this.setAnimationSpeed = function(speed)
    {
        if (ANIMATION_SPEEDS.hasOwnProperty(speed)) {
            this.speedSelector.value = speed;
        } else {
            speed = this.speedSelector.value;
        }
        var numericSpeed = ANIMATION_SPEEDS[speed];
        this.animationBlockLength = Math.floor((100 - numericSpeed) / 2);
        setCookie("VisualizationSpeed", speed, 30);
        // console.log(`New animation speed: ${speed} = ${numericSpeed} --> animation block length: ${this.animationBlockLength}`);
    }

    // Set the size of the canvas
    this.changeSize = function(size)
    {
        if (CANVAS_SIZES.hasOwnProperty(size)) {
            this.sizeSelector.value = size;
        } else {
            size = this.sizeSelector.value;
        }
        this.canvas.width = CANVAS_SIZES[size].w;
        this.canvas.height = CANVAS_SIZES[size].h;
        setCookie("VisualizationSize", size, 30);
        // console.log(`New canvas size: ${size} = ${this.canvas.width} x ${this.canvas.height}`);

        this.animatedObjects.draw();
        this.fireEvent("CanvasSizeChanged", {width: this.canvas.width, height: this.canvas.height});
    }


    this.startNextBlock = function()
    {
        this.awaitingStep = false;
        this.currentBlock = [];
        var undoBlock = []
        if (this.currentAnimation == this.AnimationSteps.length) {
            this.currentlyAnimating = false;
            this.awaitingStep = false;
            this.fireEvent("AnimationEnded","NoData");
            clearTimeout(this.timer);
            this.animatedObjects.update();
            this.animatedObjects.draw();
            return;
        }
        this.undoAnimationStepIndices.push(this.currentAnimation);

        var foundBreak = false;
        var anyAnimations = false;

        while (this.currentAnimation < this.AnimationSteps.length && !foundBreak) {
            var args = this.AnimationSteps[this.currentAnimation].split("<;>");
            var cmd = args.shift().toUpperCase();
            var id = parseInt(args.shift());
            if (cmd == "CREATECIRCLE") {
                var label = args.shift();
                var x = parseInt(args.shift());
                var y = parseInt(args.shift());
                this.animatedObjects.addCircleObject(id, label);
                this.animatedObjects.setNodePosition(id, x, y);
                undoBlock.push(new UndoCreate(id));
            }
            else if (cmd == "CONNECT") {
                var toID = parseInt(args.shift());
                var color = parseColor(args.shift(), "#000000");
                var curve = parseFloat(args.shift()) || 0.0;
                var directed = parseBool(args.shift(), true);
                var label = args.shift() || "";
                var connectionPoint = parseInt(args.shift()) || 0;
                this.animatedObjects.connectEdge(id, toID, color, curve, directed, label, connectionPoint);
                undoBlock.push(new UndoConnect(id, toID, false));
            }
            else if (cmd == "CREATERECTANGLE") {
                var label = args.shift();
                var width = parseInt(args.shift());
                var height = parseInt(args.shift());
                var x = parseInt(args.shift());
                var y = parseInt(args.shift());
                var xJustify = args.shift() || "center";
                var yJustify = args.shift() || "center";
                var bgColor = "#ffffff", fgColor = "#000000";
                this.animatedObjects.addRectangleObject(id, label, width, height, xJustify, yJustify, bgColor, fgColor);
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
                undoBlock.push(new UndoCreate(id));
            }
            else if (cmd == "MOVE") {
                var fromX = this.animatedObjects.getNodeX(id);
                var fromY = this.animatedObjects.getNodeY(id);
                var toX = parseInt(args.shift());
                var toY = parseInt(args.shift());
                var nextAnim = new SingleAnimation(id, fromX, fromY, toX, toY);
                this.currentBlock.push(nextAnim);
                undoBlock.push(new UndoMove(id, toX, toY, fromX, fromY));
                anyAnimations = true;
            }
            else if (cmd == "MOVETOALIGNRIGHT") {
                var fromX = this.animatedObjects.getNodeX(id);
                var fromY = this.animatedObjects.getNodeY(id);
                var otherId = parseInt(args.shift());
                var [toX, toY] = this.animatedObjects.getAlignRightPos(id, otherId);
                var nextAnim = new SingleAnimation(id, fromX, fromY, toX, toY);
                this.currentBlock.push(nextAnim);
                undoBlock.push(new UndoMove(id, toX, toY, fromX, fromY));
                anyAnimations = true;
            }
            else if (cmd == "STEP") {
                foundBreak = true;
            }
            else if (cmd == "SETFOREGROUNDCOLOR") {
                var oldColor = this.animatedObjects.foregroundColor(id);
                var color = parseColor(args.shift());
                this.animatedObjects.setForegroundColor(id, color);
                undoBlock.push(new UndoSetForegroundColor(id, oldColor));
            }
            else if (cmd == "SETBACKGROUNDCOLOR") {
                var oldColor = this.animatedObjects.backgroundColor(id);
                var color = parseColor(args.shift());
                this.animatedObjects.setBackgroundColor(id, color);
                undoBlock.push(new UndoSetBackgroundColor(id, oldColor));
            }
            else if (cmd == "SETHIGHLIGHT") {
                var highlight = parseBool(args.shift());
                this.animatedObjects.setHighlight(id, highlight);
                undoBlock.push(new UndoHighlight(id, !highlight));
            }
            else if (cmd == "DISCONNECT") {
                var toID = parseInt(args.shift());
                var undoConnect = this.animatedObjects.disconnect(id, toID);
                if (undoConnect != null) {
                    undoBlock.push(undoConnect);
                }
            }
            else if (cmd == "SETALPHA") {
                var oldAlpha = this.animatedObjects.getAlpha(id);
                var alpha = parseFloat(args.shift());
                this.animatedObjects.setAlpha(id, alpha);
                undoBlock.push(new UndoSetAlpha(id, oldAlpha));
            }
            else if (cmd == "SETTEXT") {
                var text = args.shift();
                var index = parseInt(args.shift()) || 0;
                var oldText = this.animatedObjects.getText(id, index);
                this.animatedObjects.setText(id, text, index);
                if (oldText != undefined) {
                    undoBlock.push(new UndoSetText(id, oldText, index));
                }
            }
            else if (cmd == "DELETE") {
                var removedEdges = this.animatedObjects.deleteIncident(id);
                if (removedEdges.length > 0) {
                    undoBlock = undoBlock.concat(removedEdges);
                }
                var obj = this.animatedObjects.getObject(id);
                if (obj != null) {
                    undoBlock.push(obj.createUndoDelete());
                    this.animatedObjects.removeObject(id);
                }
            }
            else if (cmd == "CREATEHIGHLIGHTCIRCLE") {
                var color = parseColor(args.shift());
                var x = parseInt(args.shift());
                var y = parseInt(args.shift());
                var radius = parseFloat(args.shift()) || 20;
                this.animatedObjects.addHighlightCircleObject(id, color, radius);
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
                undoBlock.push(new UndoCreate(id));
            }
            else if (cmd == "CREATELABEL") {
                var label = args.shift();
                var x = parseInt(args.shift());
                var y = parseInt(args.shift());
                var centering = parseBool(args.shift(), true);
                this.animatedObjects.addLabelObject(id, label, centering);
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
                undoBlock.push(new UndoCreate(id));
            }
            else if (cmd == "SETEDGECOLOR") {
                var toID = parseInt(args.shift());
                var color = parseColor(args.shift());
                var oldColor = this.animatedObjects.setEdgeColor(id, toID, color);
                undoBlock.push(new UndoSetEdgeColor(id, toID, oldColor));
            }
            else if (cmd == "SETEDGEALPHA") {
                var toID = parseInt(args.shift());
                var alpha = parseFloat(args.shift());
                var oldAlpha = this.animatedObjects.setEdgeAlpha(id, toID, alpha);
                undoBlock.push(new UndoSetEdgeAlpha(id, toID, oldAlpha));
            }
            else if (cmd == "SETEDGEHIGHLIGHT") {
                var toID = parseInt(args.shift());
                var highlight = parseBool(args.shift());
                var oldHighlight = this.animatedObjects.setEdgeHighlight(id, toID, highlight);
                undoBlock.push(new UndoHighlightEdge(id, toID, oldHighlight));
            }
            else if (cmd == "SETHEIGHT") {
                var height = parseInt(args.shift());
                var oldHeight = this.animatedObjects.getHeight(id);
                this.animatedObjects.setHeight(id, height);
                undoBlock.push(new UndoSetHeight(id, oldHeight));
            }
            else if (cmd == "SETLAYER") {
                var layer = parseInt(args.shift());
                this.animatedObjects.setLayer(id, layer);
                //TODO: Add undo information here
            }
            else if (cmd == "CREATELINKEDLIST") {
                var label = args.shift();
                var width = parseInt(args.shift());
                var height = parseInt(args.shift());
                var x = parseInt(args.shift());
                var y = parseInt(args.shift());
                var linkPercent = parseFloat(args.shift()) || 0.25;
                var verticalOrientation = parseBool(args.shift(), true);
                var linkPosEnd = parseBool(args.shift(), false);
                var numLabels = parseInt(args.shift()) || 1;
                var bgColor = "#FFFFFF", fgColor = "#000000";
                this.animatedObjects.addLinkedListObject(
                    id, label, width, height, 
                    linkPercent, verticalOrientation, linkPosEnd, 
                    numLabels, bgColor, fgColor
                );
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
                undoBlock.push(new UndoCreate(id));
            }
            else if (cmd == "SETNULL") {
                var nullVal = parseBool(args.shift());
                var oldNull = this.animatedObjects.getNull(id);
                this.animatedObjects.setNull(id, nullVal);
                undoBlock.push(new UndoSetNull(id, oldNull));
            }
            else if (cmd == "SETTEXTCOLOR") {
                var color = parseColor(args.shift());
                var index = parseInt(args.shift()) || 0;
                var oldColor = this.animatedObjects.getTextColor(id, index);
                this.animatedObjects.setTextColor(id, color, index);
                undoBlock.push(new UndoSetTextColor(id, oldColor, index));
            }
            else if (cmd == "CREATEBTREENODE") {
                var widthPerElem = parseFloat(args.shift());
                var height = parseFloat(args.shift());
                var numElems = parseInt(args.shift());
                var x = parseInt(args.shift());
                var y = parseInt(args.shift());
                var bgColor = parseColor(args.shift(), "#FFFFFF");
                var fgColor = parseColor(args.shift(), "#000000");
                this.animatedObjects.addBTreeNode(id, widthPerElem, height, numElems, bgColor, fgColor);
                if (!isNaN(x) && !isNaN(y)) {
                    this.animatedObjects.setNodePosition(id, x, y);
                }
                undoBlock.push(new UndoCreate(id));
            }
            else if (cmd == "SETWIDTH") {
                var width = parseInt(args.shift());
                var oldWidth = this.animatedObjects.getWidth(id);
                this.animatedObjects.setWidth(id, width);
                undoBlock.push(new UndoSetWidth(id, oldWidth));
            }
            else if (cmd == "SETNUMELEMENTS") {
                var numElems = parseInt(args.shift());
                var oldID = this.animatedObjects.getObject(id);
                var oldNumElems = oldID.getNumElements();
                this.animatedObjects.setNumElements(id, numElems);
                undoBlock.push(new UndoSetNumElements(oldID, oldNumElems, numElems));
            }
            else if (cmd == "SETPOSITION") {
                var x = parseInt(args.shift());
                var y = parseInt(args.shift());
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                this.animatedObjects.setNodePosition(id, x, y);
                undoBlock.push(new UndoSetPosition(id, oldX, oldY));
            }
            else if (cmd == "ALIGNRIGHT") {
                var otherID = parseInt(args.shift());
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                this.animatedObjects.alignRight(id, otherID);
                undoBlock.push(new UndoSetPosition(id, oldX, oldY));
            }
            else if (cmd == "ALIGNLEFT") {
                var otherID = parseInt(args.shift());
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                this.animatedObjects.alignLeft(id, otherID);
                undoBlock.push(new UndoSetPosition(id, oldX, oldY));
            }
            else if (cmd == "ALIGNTOP") {
                var otherID = parseInt(args.shift());
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                this.animatedObjects.alignTop(id, otherID);
                undoBlock.push(new UndoSetPosition(id, oldX, oldY));
            }
            else if (cmd == "ALIGNBOTTOM") {
                var otherID = parseInt(args.shift());
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                this.animatedObjects.alignBottom(id, otherID);
                undoBlock.push(new UndoSetPosition(id, oldX, oldY));
            }
            else if (cmd == "SETHIGHLIGHTINDEX") {
                var index = parseInt(args.shift());
                var oldIndex = this.animatedObjects.getHighlightIndex(id)
                this.animatedObjects.setHighlightIndex(id, index);
                undoBlock.push(new UndoSetHighlightIndex(id, oldIndex));
            }
            else {
                console.error("Unknown command: " + cmd);
            }
            this.currentAnimation++;
        }
        this.currFrame = 0;

        // Hack:  If there are not any animations, and we are currently paused,
        // then set the current frame to the end of the anumation, so that we will
        // advance immediagely upon the next step button.  If we are not paused, then
        // animate as normal.
        if (!anyAnimations && this.animationPaused || (!anyAnimations && this.currentAnimation == this.AnimationSteps.length) ) {
            this.currFrame = this.animationBlockLength;
        }

        this.undoStack.push(undoBlock);
    }

    //  Start a new animation.  The input parameter commands is an array of strings,
    //  which represents the animation to start
    this.StartNewAnimation = function(commands)
    {
        clearTimeout(this.timer);
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
        this.timer = setTimeout(timeout.bind(this), 30);
    }

    // Step backwards one step.  A no-op if the animation is not currently paused
    this.stepBack = function() 
    {
        if (this.awaitingStep && this.undoStack != null && this.undoStack.length != 0) {
            //  TODO:  Get events working correctly!
            this.fireEvent("AnimationStarted", "NoData");
            clearTimeout(this.timer);
            this.awaitingStep = false;
            this.undoLastBlock();
            // Re-kick thie timer.  The timer may or may not be running at this point,
            // so to be safe we'll kill it and start it again.
            clearTimeout(this.timer);
            this.timer = setTimeout(timeout.bind(this), 30);
        }
        else if (!this.currentlyAnimating && this.animationPaused && this.undoAnimationStepIndices != null) {
            this.fireEvent("AnimationStarted", "NoData");
            this.currentlyAnimating = true;
            this.undoLastBlock();
            // Re-kick thie timer.  The timer may or may not be running at this point,
            // so to be safe we'll kill it and start it again.
            clearTimeout(this.timer);
            this.timer = setTimeout(timeout.bind(this), 30);
        }
    }

    // Step forwards one step.  A no-op if the animation is not currently paused
    this.step = function() 
    {
        if (this.awaitingStep) {
            this.startNextBlock();
            this.fireEvent("AnimationStarted", "NoData");
            this.currentlyAnimating = true;
            // Re-kick thie timer.  The timer should be going now, but we've had some difficulty with
            // it timing itself out, so we'll be safe and kick it now.
            clearTimeout(this.timer);
            this.timer = setTimeout(timeout.bind(this), 30);
        }
    }

    /// WARNING:  Could be dangerous to call while an animation is running ...
    this.clearHistory = function() 
    {
        this.undoStack = [];
        this.undoAnimationStepIndices = null;
        this.previousAnimationSteps = [];
        this.undoAnimationStepIndicesStack = [];
        this.AnimationSteps = null;
        this.fireEvent("AnimationUndoUnavailable", "NoData");
        clearTimeout(this.timer);
        this.animatedObjects.update();
        this.animatedObjects.draw();
    }

    this.skipBack = function() 
    {
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
                this.finishUndoBlock(this.undoStack.pop())
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
            clearTimeout(this.timer);
            this.animatedObjects.update();
            this.animatedObjects.draw();
            if (this.undoStack == null || this.undoStack.length == 0) {
                this.fireEvent("AnimationUndoUnavailable", "NoData");
            }
        }
    }

    this.resetAll = function() 
    {
        this.clearHistory();
        this.animatedObjects.clearAllObjects();
        this.animatedObjects.draw();
        clearTimeout(this.timer);
    }

    this.skipForward = function() 
    {
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
                    this.finishUndoBlock(this.undoStack.pop())
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
            clearTimeout(this.timer);
            this.animatedObjects.update();
            this.animatedObjects.draw();
        }
    }

    this.finishUndoBlock = function(undoBlock) 
    {
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
                this.fireEvent("AnimationUndoUnavailable","NoData");
            }
            clearTimeout(this.timer);
            this.animatedObjects.update();
            this.animatedObjects.draw();
            return false;
        }
        return true;
    }

    this.undoLastBlock = function() 
    {
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
            if (!anyAnimations && this.animationPaused) {
                this.currFrame = this.animationBlockLength;
            }
            this.currentlyAnimating = true;
        }
    }

    this.setLayer = function(shown, layers)
    {
        this.animatedObjects.setLayer(shown, layers)
        // Drop in an extra draw call here, just in case we are not
        // in the middle of an update loop when this changes
        this.animatedObjects.draw();
    }

    this.setAllLayers = function(layers)
    {
        this.animatedObjects.setAllLayers(layers);
        // Drop in an extra draw call here, just in case we are not
        // in the middle of an update loop when this changes
        this.animatedObjects.draw();
    }

    this.update = function()
    {
        if (this.currentlyAnimating) {
            this.currFrame = this.currFrame + 1;
            for (var i = 0; i < this.currentBlock.length; i++) {
                if (this.currFrame == this.animationBlockLength || (this.currFrame == 1 && this.animationBlockLength == 0)) {
                    this.animatedObjects.setNodePosition(
                        this.currentBlock[i].objectID,
                        this.currentBlock[i].toX,
                        this.currentBlock[i].toY
                    );
                }
                else if (this.currFrame < this.animationBlockLength) {
                    var objectID = this.currentBlock[i].objectID;
                    var percent = 1 / (this.animationBlockLength - this.currFrame);
                    var oldX = this.animatedObjects.getNodeX(objectID);
                    var oldY = this.animatedObjects.getNodeY(objectID);
                    var targetX = this.currentBlock[i].toX;
                    var targetY = this.currentBlock[i].toY;
                    var newX = this.lerp(oldX, targetX, percent);
                    var newY = this.lerp(oldY, targetY, percent);
                    this.animatedObjects.setNodePosition(objectID, newX, newY);
                }
            }
            if (this.currFrame >= this.animationBlockLength) {
                if (this.doingUndo) {
                    if (this.finishUndoBlock(this.undoStack.pop())) {
                        this.awaitingStep = true;
                        this.fireEvent("AnimationWaiting", "NoData");
                    }
                }
                else {
                    if (this.animationPaused && (this.currentAnimation < this.AnimationSteps.length)) {
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
}

AnimationManager.inheritFrom(EventListener);


function SingleAnimation(id, fromX, fromY, toX, toY)
{
    this.objectID = id;
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
}


function Toolbar(toolbar)
{
    if (typeof(toolbar) == "string") {
        toolbar = document.getElementById(toolbar);
    }
    this.toolbar = toolbar;
    toolbar.innerHTML = "";
    toolbar.classList.add("toolbar");

    this.element = function(tag, attrs, ...children)
    {
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

    this.input = function(type, value, attrs)
    {
        if (!attrs) attrs = {};
        attrs["type"] = type;
        attrs["value"] = value;
        return this.element("input", attrs);
    }

    this.add = function(element)
    {
        return this.toolbar.appendChild(element);
    }

    this.addBreak = function() 
    {
        return this.add(this.element("span", {class: "break"}));
    }

    this.addLabel = function(...content) 
    {
        return this.add(this.element("span", {class: "label"}, ...content));
    }

    this.addInput = function(type, value, attrs)
    {
        return this.add(this.input(type, value, attrs));
    }

    this.addCheckbox = function(label, attrs)
    {
        if (!attrs) attrs = {};
        if (!attrs.id) attrs.id = `${this.toolbar.id}-${this.toolbar.childElementCount}`;
        var checkbox = this.addInput("checkbox", label, attrs);
        this.add(this.element("label", {for: attrs.id}, label));
        return checkbox;
    }

    this.addRadio = function(label, group, attrs)
    {
        if (!attrs) attrs = {};
        if (!attrs.id) attrs.id = `${this.toolbar.id}-${this.toolbar.childElementCount}`;
        attrs.name = group;
        var radio = this.addInput("radio", label, attrs);
        this.add(this.element("label", {for: attrs.id}, label));
        return radio;
    }

    this.addRadioButtons = function(labels, group, attrs)
    {
        var radioList = [];
        for (var lbl of labels) {
            radioList.push(this.addRadio(lbl, group, attrs));
        }
        return radioList;
    }

    this.addSelect = function(values, labels, attrs) {
        var options = [];
        for (var i = 0; i < values.length; i++) {
            options.push(
                this.element("option", {value: values[i]}, labels ? labels[i] : values[i])
            );
        }
        return this.add(this.element("select", attrs, ...options));
    }
}

