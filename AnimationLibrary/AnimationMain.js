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

// Global timer used for doing animation callbacks.
//  TODO:  Make this an instance variable of Animation Manager.
// var timer;
// var swapped = false;


function reorderSibling(node1, node2)
{
    node1.parentNode.replaceChild(node1, node2);
    node1.parentNode.insertBefore(node2, node1);
}


// Utility function to read a cookie
function getCookie(cookieName)
{
    console.log(document.cookie);
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
    console.log(cookieName, value)
}


var ANIMATION_SPEED_DEFAULT = 75;
var ANIMATION_SPEED_SLIDER_MIN = 25;
var ANIMATION_SPEED_SLIDER_MAX = 100;
var ANIMATION_SPEED_SLIDER_STEP = 25;


// TODO:  Move these out of global space into animation manager?
// var objectManager;
// var animationManager;
// var canvas;

// var paused = false;
// var playPauseBackButton;
// var skipBackButton;
// var stepBackButton;
// var stepForwardButton;
// var skipForwardButton;

// var widthEntry;
// var heightEntry;
// var sizeButton;



function returnSubmit(field, funct, maxsize, intOnly)
{

    if (maxsize != undefined)
    {
        field.size = maxsize;
    }
    return function(event)
    {
        var keyASCII = 0;
        if(window.event) // IE
        {
            keyASCII = event.keyCode
        }
        else if (event.which) // Netscape/Firefox/Opera
        {
            keyASCII = event.which
        }

        if (keyASCII == 13)
        {
            funct();
                        return false;
        }
            else if (keyASCII == 59  || keyASCII == 45 || keyASCII == 46 || keyASCII == 190 || keyASCII == 173)
        {
               return false;
        }
        else if (maxsize != undefined && field.value.length >= maxsize ||
                 intOnly && (keyASCII < 48 || keyASCII > 57))

        {
            if (!controlKey(keyASCII))
                return false;
        }
        return true;

    }

}


function animWaiting()
{
    this.stepForwardButton.disabled = false;
    if (this.skipBackButton.disabled == false)
    {
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
    if (this.skipBackButton.disabled == false && this.paused)
    {
        this.stepBackButton.disabled = false;
    }
    // this.objectManager.statusReport.setText("Animation Completed");
    this.objectManager.statusReport.setText("");
    this.objectManager.statusReport.setForegroundColor("#000000");
}



function anumUndoUnavailable()
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


function doPlayPause()
{
    this.paused = !this.paused;
    if (this.paused)
    {
        this.playPauseBackButton.setAttribute("value", "play");
        if (this.skipBackButton.disabled == false)
        {
            this.stepBackButton.disabled = false;
        }

    }
    else
    {
        this.playPauseBackButton.setAttribute("value", "pause");
    }
    this.setPaused(this.paused);
}


// Creates and returs an AnimationManager
function initCanvas(canvas, generalControlBar, algorithmControlBar)
{
    // UI nodes should be given, otherwise use defaults.
    if (!canvas) canvas = document.getElementById("canvas");
    generalControlBar = new Toolbar(generalControlBar || "generalAnimationControls");
    algorithmControlBar = new Toolbar(algorithmControlBar || "algorithmSpecificControls");

    var objectManager = new ObjectManager(canvas);
    var animationManager = new AnimationManager(objectManager);
    animationManager.canvas = canvas;
    animationManager.generalControlBar = generalControlBar;
    animationManager.algorithmControlBar = algorithmControlBar;

    animationManager.skipBackButton = generalControlBar.addInput("Button", "Skip Back");
    animationManager.skipBackButton.onclick = animationManager.skipBack.bind(animationManager);
    animationManager.stepBackButton = generalControlBar.addInput("Button", "Step Back");
    animationManager.stepBackButton.onclick = animationManager.stepBack.bind(animationManager);
    animationManager.playPauseBackButton = generalControlBar.addInput("Button", "Pause");
    animationManager.playPauseBackButton.onclick = doPlayPause.bind(animationManager);
    animationManager.stepForwardButton = generalControlBar.addInput("Button", "Step Forward");
    animationManager.stepForwardButton.onclick = animationManager.step.bind(animationManager) ;
    animationManager.skipForwardButton = generalControlBar.addInput("Button", "Skip Forward");
    animationManager.skipForwardButton.onclick = animationManager.skipForward.bind(animationManager);

    var speed = getCookie("VisualizationSpeed");
    speed = (speed == null || speed == "") ? ANIMATION_SPEED_DEFAULT : parseInt(speed);

    generalControlBar.addLabel("speed:");
    animationManager.speedSlider = generalControlBar.addInput("Range", speed, {
        min: ANIMATION_SPEED_SLIDER_MIN,
        max: ANIMATION_SPEED_SLIDER_MAX,
        step: ANIMATION_SPEED_SLIDER_STEP,
    });
    animationManager.speedSlider.onchange = animationManager.setAnimationSpeed.bind(animationManager);
    animationManager.setAnimationSpeed(speed);

    var width = getCookie("VisualizationWidth");
    var height = getCookie("VisualizationHeight");
    width = (width == null || width == "") ? canvas.width : parseInt(width);
    height = (height == null || height == "") ? canvas.height : parseInt(height);

    var swappedControls = getCookie("VisualizationControlSwapped");
    animationManager.swapped = (swappedControls == "true");
    if (animationManager.swapped) {
        reorderSibling(canvas, generalControlBar.toolbar.parentNode);
    }

    canvas.width = width;
    canvas.height = height;

    generalControlBar.addLabel("w:");
    animationManager.widthEntry = generalControlBar.addInput("Text", canvas.width, {size: 4});
    animationManager.widthEntry.onkeydown = returnSubmit(animationManager.widthEntry, animationManager.changeSize.bind(animationManager), 4, true);

    generalControlBar.addLabel("h:");
    animationManager.heightEntry = generalControlBar.addInput("Text", canvas.height);
    animationManager.heightEntry.onkeydown = returnSubmit(animationManager.heightEntry, animationManager.changeSize.bind(animationManager), 4, true);

    animationManager.sizeButton = generalControlBar.addInput("Button", "Change Canvas Size");
    animationManager.sizeButton.onclick = animationManager.changeSize.bind(animationManager) ;

    animationManager.swapButton = generalControlBar.addInput("Button", "Move Controls");
    animationManager.swapButton.onclick = animationManager.swapControlDiv.bind(animationManager);

    animationManager.addListener("AnimationStarted", animationManager, animStarted);
    animationManager.addListener("AnimationEnded", animationManager, animEnded);
    animationManager.addListener("AnimationWaiting", animationManager, animWaiting);
    animationManager.addListener("AnimationUndoUnavailable", animationManager, anumUndoUnavailable);
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
    // TODO: not sure what's the difference between paused and animationPaused
    this.paused = false;

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
        if (!this.animationPaused)
        {
            this.step();
        }
    }

    // Set the speed of the animation, from 0 (slow) to 100 (fast)
    this.setAnimationSpeed = function(newSpeed)
    {
        newSpeed = parseInt(newSpeed);
        if (isNaN(newSpeed))
        {
            newSpeed = parseInt(this.speedSlider.value);
        }
        this.animationBlockLength = Math.floor((100-newSpeed) / 2);
        setCookie("VisualizationSpeed", String(newSpeed), 30);
        // console.log(`New speed: ${newSpeed}`);
    }


    this.parseBool = function(str)
    {
        var uppercase = str.toUpperCase();
        var returnVal =  !(uppercase == "False" || uppercase == "f" || uppercase == " 0" || uppercase == "0" || uppercase == "");
        return returnVal;

    }

    this.parseColor = function(clr)
    {
            if (clr.charAt(0) == "#")
            {
                return clr;
            }
            else if (clr.substring(0,2) == "0x")
            {
                return "#" + clr.substring(2);
            }
    }


    this.swapControlDiv = function()
    {
        this.swapped = !this.swapped;
        if (this.swapped) {
            reorderSibling(this.canvas, this.generalControlBar.toolbar.parentNode);
            setCookie("VisualizationControlSwapped", "true", 30);
        } else {
            reorderSibling(this.generalControlBar.toolbar.parentNode, this.canvas);
            setCookie("VisualizationControlSwapped", "false", 30);
        }
    }
    
    
    this.changeSize = function()
    {

        var width = parseInt(this.widthEntry.value);
        var height = parseInt(this.heightEntry.value);

        if (width > 100)
        {
            this.canvas.width = width;
            setCookie("VisualizationWidth", String(width), 30);

        }
        if (height > 100)
        {
            this.canvas.height = height;
            setCookie("VisualizationHeight", String(height), 30);
        }
        width.value = this.canvas.width;
        this.heightEntry.value = this.canvas.height;

        this.animatedObjects.draw();
        this.fireEvent("CanvasSizeChanged",{width:this.canvas.width, height:this.canvas.height});
    }

    this.startNextBlock = function()
    {
        this.awaitingStep = false;
        this.currentBlock = [];
        var undoBlock = []
        if (this.currentAnimation == this.AnimationSteps.length )
        {
            this.currentlyAnimating = false;
            this.awaitingStep = false;
            this.fireEvent("AnimationEnded","NoData");
            clearTimeout(this.timer);
            this.animatedObjects.update();
            this.animatedObjects.draw();

            return;
        }
        this.undoAnimationStepIndices.push(this.currentAnimation);

        var foundBreak= false;
        var anyAnimations= false;

        while (this.currentAnimation < this.AnimationSteps.length && !foundBreak)
        {
            var nextCommand = this.AnimationSteps[this.currentAnimation].split("<;>");
            if (nextCommand[0].toUpperCase() == "CREATECIRCLE")
            {
                this.animatedObjects.addCircleObject(parseInt(nextCommand[1]), nextCommand[2]);
                if (nextCommand.length > 4)
                {
                    this.animatedObjects.setNodePosition(parseInt(nextCommand[1]), parseInt(nextCommand[3]), parseInt(nextCommand[4]));
                }
                undoBlock.push(new UndoCreate(parseInt(nextCommand[1])));

            }
            else if (nextCommand[0].toUpperCase() == "CONNECT")
            {

                if (nextCommand.length > 7)
                {
                    this.animatedObjects.connectEdge(parseInt(nextCommand[1]),
                                                                         parseInt(nextCommand[2]),
                                                                         this.parseColor(nextCommand[3]),
                                                                         parseFloat(nextCommand[4]),
                                                                         this.parseBool(nextCommand[5]),
                                                                         nextCommand[6],
                                                                         parseInt(nextCommand[7]));
                }
                else if (nextCommand.length > 6)
                {
                    this.animatedObjects.connectEdge(parseInt(nextCommand[1]),
                                                                         parseInt(nextCommand[2]),
                                                                         this.parseColor(nextCommand[3]),
                                                                         parseFloat(nextCommand[4]),
                                                                         this.parseBool(nextCommand[5]),
                                                                         nextCommand[6],
                                                                         0);
                }
                else if (nextCommand.length > 5)
                {
                    this.animatedObjects.connectEdge(parseInt(nextCommand[1]),
                                                                         parseInt(nextCommand[2]),
                                                                         this.parseColor(nextCommand[3]),
                                                                         parseFloat(nextCommand[4]),
                                                                         this.parseBool(nextCommand[5]),
                                                                         "",
                                                                         0);
                }
                else if (nextCommand.length > 4)
                {
                    this.animatedObjects.connectEdge(parseInt(nextCommand[1]),
                                                                         parseInt(nextCommand[2]),
                                                                         this.parseColor(nextCommand[3]),
                                                                         parseFloat(nextCommand[4]),
                                                                         true,
                                                                         "",
                                                                         0);
                }
                else if (nextCommand.length > 3)
                {
                    this.animatedObjects.connectEdge(parseInt(nextCommand[1]),
                                                                         parseInt(nextCommand[2]),
                                                                         this.parseColor(nextCommand[3]),
                                                                         0.0,
                                                                         true,
                                                                         "",
                                                                         0);
                }
                else
                {
                    this.animatedObjects.connectEdge(parseInt(nextCommand[1]),
                                                                         parseInt(nextCommand[2]),
                                                                        "#000000",
                                                                         0.0,
                                                                         true,
                                                                         "",
                                                                         0);

                }
                undoBlock.push(new UndoConnect(parseInt(nextCommand[1]), parseInt (nextCommand[2]), false));
            }
            else if (nextCommand[0].toUpperCase() == "CREATERECTANGLE")
            {
                if (nextCommand.length == 9)
                {
                    this.animatedObjects.addRectangleObject(parseInt(nextCommand[1]), // ID
                                                            nextCommand[2], // Label
                                                            parseInt(nextCommand[3]), // w
                                                            parseInt(nextCommand[4]), // h
                                                            nextCommand[7], // xJustify
                                                            nextCommand[8],// yJustify
                                                            "#ffffff", // background color
                                                            "#000000"); // foreground color
                }
                else
                {
                    this.animatedObjects.addRectangleObject(parseInt(nextCommand[1]), // ID
                                                            nextCommand[2], // Label
                                                            parseInt(nextCommand[3]), // w
                                                            parseInt(nextCommand[4]), // h
                                                            "center", // xJustify
                                                            "center",// yJustify
                                                            "#ffffff", // background color
                                                            "#000000"); // foreground color

                }
                if (nextCommand.length > 6)
                {
                    this.animatedObjects.setNodePosition(parseInt(nextCommand[1]), parseInt(nextCommand[5]), parseInt(nextCommand[6]));
                }
                undoBlock.push(new UndoCreate(parseInt(nextCommand[1])));
            }

            else if (nextCommand[0].toUpperCase() == "MOVE")
            {
                var objectID = parseInt(nextCommand[1]);
                var nextAnim = new SingleAnimation(objectID,
                                                    this.animatedObjects.getNodeX(objectID),
                                                    this.animatedObjects.getNodeY(objectID),
                                                    parseInt(nextCommand[2]),
                                                    parseInt(nextCommand[3]));
                this.currentBlock.push(nextAnim);

                undoBlock.push(new UndoMove(nextAnim.objectID, nextAnim.toX, nextAnim.toY, nextAnim.fromX, nextAnim.fromY));

                anyAnimations = true;
            }

            else if (nextCommand[0].toUpperCase() == "MOVETOALIGNRIGHT")
            {
                var id = parseInt(nextCommand[1]);
                var otherId = parseInt(nextCommand[2]);
                                var newXY = this.animatedObjects.getAlignRightPos(id, otherId);


                var nextAnim = new SingleAnimation(id,
                                    this.animatedObjects.getNodeX(id),
                                    this.animatedObjects.getNodeY(id),
                                    newXY[0],
                                    newXY[1]);
                this.currentBlock.push(nextAnim);
                undoBlock.push(new UndoMove(nextAnim.objectID, nextAnim.toX, nextAnim.toY, nextAnim.fromX, nextAnim.fromY));
                anyAnimations = true;
            }

            else if (nextCommand[0].toUpperCase() == "STEP")
            {
                foundBreak = true;
            }
            else if (nextCommand[0].toUpperCase() == "SETFOREGROUNDCOLOR")
            {
                var id = parseInt(nextCommand[1]);
                var oldColor = this.animatedObjects.foregroundColor(id);
                this.animatedObjects.setForegroundColor(id, this.parseColor(nextCommand[2]));
                undoBlock.push(new UndoSetForegroundColor(id, oldColor));
            }
            else if (nextCommand[0].toUpperCase() == "SETBACKGROUNDCOLOR")
            {
                id = parseInt(nextCommand[1]);
                oldColor = this.animatedObjects.backgroundColor(id);
                this.animatedObjects.setBackgroundColor(id, this.parseColor(nextCommand[2]));
                undoBlock.push(new UndoSetBackgroundColor(id, oldColor));
            }
            else if (nextCommand[0].toUpperCase() == "SETHIGHLIGHT")
            {
                var newHighlight = this.parseBool(nextCommand[2]);
                this.animatedObjects.setHighlight( parseInt(nextCommand[1]), newHighlight);
                undoBlock.push(new UndoHighlight( parseInt(nextCommand[1]), !newHighlight));
            }
            else if (nextCommand[0].toUpperCase() == "DISCONNECT")
            {
                var undoConnect = this.animatedObjects.disconnect(parseInt(nextCommand[1]), parseInt(nextCommand[2]));
                if (undoConnect != null)
                {
                    undoBlock.push(undoConnect);
                }
            }
            else if (nextCommand[0].toUpperCase() == "SETALPHA")
            {
                var oldAlpha = this.animatedObjects.getAlpha(parseInt(nextCommand[1]));
                this.animatedObjects.setAlpha(parseInt(nextCommand[1]), parseFloat(nextCommand[2]));
                undoBlock.push(new UndoSetAlpha(parseInt(nextCommand[1]), oldAlpha));
            }
            else if (nextCommand[0].toUpperCase() == "SETTEXT")
            {
                if (nextCommand.length > 3)
                {
                    var oldText = this.animatedObjects.getText(parseInt(nextCommand[1]), parseInt(nextCommand[3]));
                    this.animatedObjects.setText(parseInt(nextCommand[1]), nextCommand[2], parseInt(nextCommand[3]));
                    if (oldText != undefined)
                    {
                        undoBlock.push(new UndoSetText(parseInt(nextCommand[1]), oldText, parseInt(nextCommand[3]) ));
                    }
                }
                else
                {
                    oldText = this.animatedObjects.getText(parseInt(nextCommand[1]), 0);
                    this.animatedObjects.setText(parseInt(nextCommand[1]), nextCommand[2], 0);
                    if (oldText != undefined)
                    {
                        undoBlock.push(new UndoSetText(parseInt(nextCommand[1]), oldText, 0));
                    }
                }
            }
            else if (nextCommand[0].toUpperCase() == "DELETE")
            {
                var objectID = parseInt(nextCommand[1]);

                var i;
                var removedEdges = this.animatedObjects.deleteIncident(objectID);
                if (removedEdges.length > 0)
                {
                    undoBlock = undoBlock.concat(removedEdges);
                }
                var obj = this.animatedObjects.getObject(objectID);
                if (obj != null)
                {
                    undoBlock.push(obj.createUndoDelete());
                    this.animatedObjects.removeObject(objectID);
                }
            }
            else if (nextCommand[0].toUpperCase() == "CREATEHIGHLIGHTCIRCLE")
            {
                if (nextCommand.length > 5)
                {
                    this.animatedObjects.addHighlightCircleObject(parseInt(nextCommand[1]), this.parseColor(nextCommand[2]), parseFloat(nextCommand[5]));
                }
                else
                {
                    this.animatedObjects.addHighlightCircleObject(parseInt(nextCommand[1]), this.parseColor(nextCommand[2]), 20);
                }
                if (nextCommand.length > 4)
                {
                    this.animatedObjects.setNodePosition(parseInt(nextCommand[1]), parseInt(nextCommand[3]), parseInt(nextCommand[4]));
                }
                undoBlock.push(new UndoCreate(parseInt(nextCommand[1])));


            }
            else if (nextCommand[0].toUpperCase() == "CREATELABEL")
            {
                if (nextCommand.length == 6)
                {
                    this.animatedObjects.addLabelObject(parseInt(nextCommand[1]), nextCommand[2], this.parseBool(nextCommand[5]));
                }
                else
                {
                    this.animatedObjects.addLabelObject(parseInt(nextCommand[1]), nextCommand[2], true);
                }
                if (nextCommand.length >= 5)
                {

                    this.animatedObjects.setNodePosition(parseInt(nextCommand[1]), parseFloat(nextCommand[3]), parseFloat(nextCommand[4]));
                }
                undoBlock.push(new UndoCreate(parseInt(nextCommand[1])));
            }
            else if (nextCommand[0].toUpperCase() == "SETEDGECOLOR")
            {
                var from = parseInt(nextCommand[1]);
                var to = parseInt(nextCommand[2]);
                var newColor = this.parseColor(nextCommand[3]);
                var oldColor = this.animatedObjects.setEdgeColor(from, to, newColor);
                undoBlock.push(new UndoSetEdgeColor(from, to, oldColor));
            }
            else if (nextCommand[0].toUpperCase() == "SETEDGEALPHA")
            {
                var from = parseInt(nextCommand[1]);
                var to = parseInt(nextCommand[2]);
                var newAlpha = parseFloat(nextCommand[3]);
                var oldAplpha = this.animatedObjects.setEdgeAlpha(from, to, newAlpha);
                undoBlock.push(new UndoSetEdgeAlpha(from, to, oldAplpha));
            }


            else if (nextCommand[0].toUpperCase() == "SETEDGEHIGHLIGHT")
            {
                var newHighlight = this.parseBool(nextCommand[3]);
                var from = parseInt(nextCommand[1]);
                var to = parseInt(nextCommand[2]);
                var oldHighlight = this.animatedObjects.setEdgeHighlight(from, to, newHighlight);
                undoBlock.push(new UndoHighlightEdge(from, to, oldHighlight));
            }
            else if (nextCommand[0].toUpperCase() == "SETHEIGHT")
            {
                id = parseInt(nextCommand[1]);
                var oldHeight = this.animatedObjects.getHeight(id);
                this.animatedObjects.setHeight(id, parseInt(nextCommand[2]));
                undoBlock.push(new UndoSetHeight(id, oldHeight));
            }
            else if (nextCommand[0].toUpperCase() == "SETLAYER")
            {
                this.animatedObjects.setLayer(parseInt(nextCommand[1]), parseInt(nextCommand[2]));
                //TODO: Add undo information here
            }


            else if (nextCommand[0].toUpperCase() == "CREATELINKEDLIST")
            {
                if (nextCommand.length == 11)
                {
                    this.animatedObjects.addLinkedListObject(parseInt(nextCommand[1]), nextCommand[2],
                           parseInt(nextCommand[3]), parseInt(nextCommand[4]), parseFloat(nextCommand[7]),
                           this.parseBool(nextCommand[8]), this.parseBool(nextCommand[9]),parseInt(nextCommand[10]), "#FFFFFF", "#000000");
                }
                else
                {
                    this.animatedObjects.addLinkedListObject(parseInt(nextCommand[1]), nextCommand[2], parseInt(nextCommand[3]), parseInt(nextCommand[4]), 0.25, true, false, 1, "#FFFFFF", "#000000");
                }
                if (nextCommand.length > 6)
                {
                    this.animatedObjects.setNodePosition(parseInt(nextCommand[1]), parseInt(nextCommand[5]), parseInt(nextCommand[6]));
                    undoBlock.push(new UndoCreate(parseInt(nextCommand[1])));
                }

            }
            else if (nextCommand[0].toUpperCase() == "SETNULL")
            {
                var oldNull = this.animatedObjects.getNull(parseInt(nextCommand[1]));
                this.animatedObjects.setNull(parseInt(nextCommand[1]), this.parseBool(nextCommand[2]));
                undoBlock.push(new UndoSetNull(parseInt(nextCommand[1]), oldNull));
            }
            else if (nextCommand[0].toUpperCase() == "SETTEXTCOLOR")
            {
                if (nextCommand.length > 3)
                {
                    oldColor = this.animatedObjects.getTextColor(parseInt(nextCommand[1]), parseInt(nextCommand[3]));
                    this.animatedObjects.setTextColor(parseInt(nextCommand[1]), this.parseColor(nextCommand[2]), parseInt(nextCommand[3]));
                    undoBlock.push(new UndoSetTextColor(parseInt(nextCommand[1]), oldColor, parseInt(nextCommand[3]) ));
                }
                else
                {
                    oldColor = this.animatedObjects.getTextColor(parseInt(nextCommand[1]), 0);
                    this.animatedObjects.setTextColor(parseInt(nextCommand[1]),this.parseColor(nextCommand[2]), 0);
                    undoBlock.push(new UndoSetTextColor(parseInt(nextCommand[1]), oldColor, 0));
                }
            }


            else if (nextCommand[0].toUpperCase() == "CREATEBTREENODE")
            {

                this.animatedObjects.addBTreeNode(parseInt(nextCommand[1]), parseFloat(nextCommand[2]), parseFloat(nextCommand[3]),
                             parseInt(nextCommand[4]),this.parseColor(nextCommand[7]), this.parseColor(nextCommand[8]));
                this.animatedObjects.setNodePosition(parseInt(nextCommand[1]), parseInt(nextCommand[5]), parseInt(nextCommand[6]));
                undoBlock.push(new UndoCreate(parseInt(nextCommand[1])));
            }

            else if (nextCommand[0].toUpperCase() == "SETWIDTH")
            {
                var id = parseInt(nextCommand[1]);
                this.animatedObjects.setWidth(id, parseInt(nextCommand[2]));
                var oldWidth = this.animatedObjects.getWidth(id);
                undoBlock.push(new UndoSetWidth(id, oldWidth));
            }
            else if (nextCommand[0].toUpperCase() == "SETNUMELEMENTS")
            {
                var oldElem = this.animatedObjects.getObject(parseInt(nextCommand[1]));
                undoBlock.push(new UndoSetNumElements(oldElem, parseInt(nextCommand[2])));
                this.animatedObjects.setNumElements(parseInt(nextCommand[1]), parseInt(nextCommand[2]));
            }
            else if (nextCommand[0].toUpperCase() == "SETPOSITION")
            {
                var id = parseInt(nextCommand[1])
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoSetPosition(id, oldX, oldY));
                this.animatedObjects.setNodePosition(id, parseInt(nextCommand[2]), parseInt(nextCommand[3]));
            }
            else if (nextCommand[0].toUpperCase() == "ALIGNRIGHT")
            {
                var id = parseInt(nextCommand[1])
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoSetPosition(id, oldX. oldY));
                this.animatedObjects.alignRight(id, parseInt(nextCommand[2]));
            }
            else if (nextCommand[0].toUpperCase() == "ALIGNLEFT")
            {
                var id = parseInt(nextCommand[1])
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoSetPosition(id, oldX. oldY));
                this.animatedObjects.alignLeft(id, parseInt(nextCommand[2]));
            }
            else if (nextCommand[0].toUpperCase() == "ALIGNTOP")
            {
                var id = parseInt(nextCommand[1])
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoSetPosition(id, oldX. oldY));
                this.animatedObjects.alignTop(id, parseInt(nextCommand[2]));
            }
            else if (nextCommand[0].toUpperCase() == "ALIGNBOTTOM")
            {
                var id = parseInt(nextCommand[1])
                var oldX = this.animatedObjects.getNodeX(id);
                var oldY = this.animatedObjects.getNodeY(id);
                undoBlock.push(new UndoSetPosition(id, oldX. oldY));
                this.animatedObjects.alignBottom(id, parseInt(nextCommand[2]));
            }





            else if (nextCommand[0].toUpperCase() == "SETHIGHLIGHTINDEX")
            {
                var id = parseInt(nextCommand[1]);
                var index = parseInt(nextCommand[2]);
                                var oldIndex = this.animatedObjects.getHighlightIndex(id)
                undoBlock.push(new UndoSetHighlightIndex(id, oldIndex));
                this.animatedObjects.setHighlightIndex(id,index);
            }
            else
            {
    //            throw "Unknown command: " + nextCommand[0];
            }

            this.currentAnimation = this.currentAnimation+1;
        }
        this.currFrame = 0;

        // Hack:  If there are not any animations, and we are currently paused,
        // then set the current frame to the end of the anumation, so that we will
        // advance immediagely upon the next step button.  If we are not paused, then
        // animate as normal.

        if (!anyAnimations && this.animationPaused || (!anyAnimations && this.currentAnimation == this.AnimationSteps.length) )
        {
            this.currFrame = this.animationBlockLength;
        }

        this.undoStack.push(undoBlock);
    }

    //  Start a new animation.  The input parameter commands is an array of strings,
    //  which represents the animation to start
    this.StartNewAnimation = function(commands)
    {
        clearTimeout(this.timer);
        if (this.AnimationSteps != null)
        {
            this.previousAnimationSteps.push(this.AnimationSteps);
            this.undoAnimationStepIndicesStack.push(this.undoAnimationStepIndices);
        }
        if (commands == undefined || commands.length == 0)
        {
            this.AnimationSteps = ["Step"];
        }
        else
        {
            this.AnimationSteps = commands;
        }
        this.undoAnimationStepIndices = new Array();
        this.currentAnimation = 0;
        this.startNextBlock();
        this.currentlyAnimating = true;
        this.fireEvent("AnimationStarted","NoData");
        this.timer = setTimeout(timeout.bind(this), 30);

    }

    // Step backwards one step.  A no-op if the animation is not currently paused
    this.stepBack = function()
    {
        if (this.awaitingStep && this.undoStack != null && this.undoStack.length != 0)
        {
            //  TODO:  Get events working correctly!
            this.fireEvent("AnimationStarted","NoData");
            clearTimeout(this.timer);

            this.awaitingStep = false;
            this.undoLastBlock();
            // Re-kick thie timer.  The timer may or may not be running at this point,
            // so to be safe we'll kill it and start it again.
            clearTimeout(this.timer);
            this.timer = setTimeout(timeout.bind(this), 30);


        }
        else if (!this.currentlyAnimating && this.animationPaused && this.undoAnimationStepIndices != null)
        {
            this.fireEvent("AnimationStarted","NoData");
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
        if (this.awaitingStep)
        {
            this.startNextBlock();
            this.fireEvent("AnimationStarted","NoData");
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
        this.fireEvent("AnimationUndoUnavailable","NoData");
        clearTimeout(this.timer);
        this.animatedObjects.update();
        this.animatedObjects.draw();

    }

    this.skipBack = function()
    {
        var keepUndoing = this.undoAnimationStepIndices != null && this.undoAnimationStepIndices.length != 0;
        if (keepUndoing)
        {
            var i;
            for (i = 0; this.currentBlock != null && i < this.currentBlock.length; i++)
            {
                var objectID = this.currentBlock[i].objectID;
                this.animatedObjects.setNodePosition(objectID,
                                                this.currentBlock[i].toX,
                                                this.currentBlock[i].toY);
            }
            if (this.doingUndo)
            {
                this.finishUndoBlock(this.undoStack.pop())
            }
            while (keepUndoing)
            {
                this.undoLastBlock();
                for (i = 0; i < this.currentBlock.length; i++)
                {
                    objectID = this.currentBlock[i].objectID;
                    this.animatedObjects.setNodePosition(objectID,
                                                    this.currentBlock[i].toX,
                                                    this.currentBlock[i].toY);
                }
                keepUndoing = this.finishUndoBlock(this.undoStack.pop());

            }
            clearTimeout(this.timer);
            this.animatedObjects.update();
            this.animatedObjects.draw();
            if (this.undoStack == null || this.undoStack.length == 0)
            {
                this.fireEvent("AnimationUndoUnavailable","NoData");
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
        if (this.currentlyAnimating)
        {
            this.animatedObjects.runFast = true;
            while (this.AnimationSteps != null && this.currentAnimation < this.AnimationSteps.length)
            {
                var i;
                for (i = 0; this.currentBlock != null && i < this.currentBlock.length; i++)
                {
                    var objectID = this.currentBlock[i].objectID;
                    this.animatedObjects.setNodePosition(objectID,
                                                    this.currentBlock[i].toX,
                                                    this.currentBlock[i].toY);
                }
                if (this.doingUndo)
                {
                    this.finishUndoBlock(this.undoStack.pop())
                }
                this.startNextBlock();
                for (i= 0; i < this.currentBlock.length; i++)
                {
                    var objectID = this.currentBlock[i].objectID;
                    this.animatedObjects.setNodePosition(objectID,
                                                    this.currentBlock[i].toX,
                                                    this.currentBlock[i].toY);
                }

            }
            this.animatedObjects.update();
            this.currentlyAnimating = false;
            this.awaitingStep = false;
            this.doingUndo = false;

            this.animatedObjects.runFast = false;
            this.fireEvent("AnimationEnded","NoData");
            clearTimeout(this.timer);
            this.animatedObjects.update();
            this.animatedObjects.draw();
        }
    }


    this.finishUndoBlock = function(undoBlock)
    {
        for (var i = undoBlock.length - 1; i >= 0; i--)
        {
            undoBlock[i].undoInitialStep(this.animatedObjects);

        }
        this.doingUndo = false;

        // If we are at the final end of the animation ...
        if (this.undoAnimationStepIndices.length == 0)
        {
            this.awaitingStep = false;
            this.currentlyAnimating = false;
            this.undoAnimationStepIndices = this.undoAnimationStepIndicesStack.pop();
            this.AnimationSteps = this.previousAnimationSteps.pop();
            this.fireEvent("AnimationEnded","NoData");
            this.fireEvent("AnimationUndo","NoData");
            this.currentBlock = [];
            if (this.undoStack == null || this.undoStack.length == 0)
            {
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

        if (this.undoAnimationStepIndices.length == 0)
        {

            // Nothing on the undo stack.  Return
            return;

        }
        if (this.undoAnimationStepIndices.length > 0)
        {
            this.doingUndo = true;
            var anyAnimations = false;
            this.currentAnimation = this.undoAnimationStepIndices.pop();
            this.currentBlock = [];
            var undo = this.undoStack[this.undoStack.length - 1];
            var i;
            for (i = undo.length - 1; i >= 0; i--)
            {
                var animateNext = undo[i].addUndoAnimation(this.currentBlock);
                anyAnimations = anyAnimations || animateNext;

            }
            this.currFrame = 0;

            // Hack:  If there are not any animations, and we are currently paused,
            // then set the current frame to the end of the animation, so that we will
            // advance immediagely upon the next step button.  If we are not paused, then
            // animate as normal.
            if (!anyAnimations && this.animationPaused  )
            {
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

        if (this.currentlyAnimating)
        {
            this.currFrame = this.currFrame + 1;
            var i;
            for (i = 0; i < this.currentBlock.length; i++)
            {
                if (this.currFrame == this.animationBlockLength || (this.currFrame == 1 && this.animationBlockLength == 0))
                {
                    this.animatedObjects.setNodePosition(this.currentBlock[i].objectID,
                                                         this.currentBlock[i].toX,
                                                         this.currentBlock[i].toY);
                }
                else if (this.currFrame < this.animationBlockLength)
                {
                    var objectID = this.currentBlock[i].objectID;
                    var percent = 1 / (this.animationBlockLength - this.currFrame);
                    var oldX = this.animatedObjects.getNodeX(objectID);
                    var oldY = this.animatedObjects.getNodeY(objectID);
                    var targetX = this.currentBlock[i].toX;
                    var targety = this.currentBlock[i].toY;
                    var newX = this.lerp(this.animatedObjects.getNodeX(objectID), this.currentBlock[i].toX, percent);
                    var newY = this.lerp(this.animatedObjects.getNodeY(objectID), this.currentBlock[i].toY, percent);
                    this.animatedObjects.setNodePosition(objectID, newX, newY);
                }
            }
            if (this.currFrame >= this.animationBlockLength)
            {
                if (this.doingUndo)
                {
                    if (this.finishUndoBlock(this.undoStack.pop()))
                    {
                        this.awaitingStep = true;
                        this.fireEvent("AnimationWaiting","NoData");
                    }

                }
                else
                {
                    if (this.animationPaused && (this.currentAnimation < this.AnimationSteps.length))
                    {
                        this.awaitingStep = true;
                        this.fireEvent("AnimationWaiting","NoData");
                        this.currentBlock = [];
                    }
                    else
                    {
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
    if (toolbar.tagName.toLowerCase() == "table") {
        toolbar.innerHTML = "<tr></tr>";
    } else {
        toolbar.innerHTML = "<table><tr></tr></table>";
    }

    this.addElement = function(element, attrs) {
        if (attrs) {
            for (var name in attrs) {
                element.setAttribute(name, attrs[name]);
            }
        }
        var td = document.createElement("td");
        td.appendChild(element);
        this.toolbar.getElementsByTagName("tr")[0].appendChild(td);
        return element;
    }

    this.addControl = function(tag, attrs) {
        var element = document.createElement(tag);
        return this.addElement(element, attrs);
    }

    this.addLabel = function(label) {
        return this.addElement(document.createTextNode(label));
    }

    this.addInput = function(type, value, attrs) {
        if (!attrs) attrs = {};
        attrs["type"] = type;
        attrs["value"] = value;
        return this.addControl("input", attrs);
    }

    this.addCheckbox = function(labelText) {
        var label = document.createElement("label");
        var checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        label.append(checkbox, labelText);
        this.addElement(label);
        return checkbox;
    }

    this.addRadioButtons = function(labelTexts, groupName) {
        var span = document.createElement("span");
        var radioList = [];
        for (var i = 0; i < labelTexts.length; i++)
        {
            var label = document.createElement("label");
            var radio = document.createElement("input");
            radio.setAttribute("type", "radio");
            radio.setAttribute("name", groupName);
            radio.setAttribute("value", labelTexts[i]);
            label.append(radio, labelTexts[i]);
            if (i > 0) span.append(document.createElement("br"));
            span.append(label);
            radioList.push(radio);
        }
        this.addElement(span);
        return radioList;
    }
}
