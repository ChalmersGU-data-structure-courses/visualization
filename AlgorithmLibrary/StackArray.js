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


function StackArray(am)
{
    this.init(am);
}
StackArray.inheritFrom(Algorithm);


// Various constants

StackArray.SIZE = 15;
StackArray.INDEX_COLOR = "#0000FF";


StackArray.prototype.init = function(am)
{
    StackArray.superclass.init.call(this, am);
    this.addControls();
    this.resetAll();
}


StackArray.prototype.sizeChanged = function()
{
    this.resetAll();
}


StackArray.prototype.addControls = function()
{
    this.pushField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
    this.addReturnSubmit(this.pushField, "ALPHANUM", this.pushCallback.bind(this));
    this.pushButton = this.addControlToAlgorithmBar("Button", "Push");
    this.pushButton.onclick = this.pushCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.popButton = this.addControlToAlgorithmBar("Button", "Pop");
    this.popButton.onclick = this.popCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.clearButton = this.addControlToAlgorithmBar("Button", "Clear");
    this.clearButton.onclick = this.clearCallback.bind(this);
}


StackArray.prototype.resetAll = function()
{
    this.animationManager.resetAll();
    this.nextIndex = 0;
    this.commands = [];

    this.leftoverLabelID = this.nextIndex++;
    this.cmd("CreateLabel", this.leftoverLabelID, "", this.getArrayX(6), 2 * this.getArrayElemHeight());

    this.top = 0;
    this.topID = this.nextIndex++;
    this.topLabelID = this.nextIndex++;
    this.cmd("CreateRectangle", this.topID, 0, this.getArrayElemWidth(), this.getArrayElemHeight(), this.getArrayX(3), 2 * this.getArrayElemHeight());
    this.cmd("CreateLabel", this.topLabelID, "top:  ", 0, 0);
    this.cmd("AlignLeft", this.topLabelID, this.topID);

    this.arrayData = [];
    this.arrayID = [];
    this.arrayLabelID = [];
    for (var i = 0; i < StackArray.SIZE; i++) {
        this.arrayID[i] = this.nextIndex++;
        this.arrayLabelID[i] = this.nextIndex++;
        this.cmd("CreateRectangle", this.arrayID[i], "", this.getArrayElemWidth(), this.getArrayElemHeight(), this.getArrayX(i), this.getArrayY(i));
        this.cmd("CreateLabel", this.arrayLabelID[i], i, this.getArrayX(i), this.getArrayLabelY(i));
        this.cmd("SetForegroundColor", this.arrayLabelID[i], StackArray.INDEX_COLOR);
    }

    this.highlightID = this.nextIndex++;

    this.initialIndex = this.nextIndex;
    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}


StackArray.prototype.reset = function()
{
    this.top = 0;
    this.nextIndex = this.initialIndex;
}


///////////////////////////////////////////////////////////////////////////////
// Calculating canvas positions and sizes

StackArray.prototype.getArrayX = function(i)
{
    return this.getArrayXY(i).x;
}

StackArray.prototype.getArrayY = function(i)
{
    return this.getArrayXY(i).y;
}

StackArray.prototype.getArrayLabelY = function(i)
{
    return this.getArrayY(i) + this.getArrayElemHeight() * 0.9;
}

StackArray.prototype.getArrayXY = function(i)
{
    var x = 1.5 * this.getArrayElemWidth();
    var y = 4.5 * this.getArrayElemHeight();
    for (var k = 0; k < i; k++) {
        x += this.getArrayElemWidth();
        if (x + this.getArrayElemWidth() > this.getCanvasWidth()) {
            x = 1.5 * this.getArrayElemWidth();
            y += 2.5 * this.getArrayElemHeight();
        }
    }
    return {x: x, y: y};
}

StackArray.prototype.getArrayElemWidth = function() 
{
    var nrows = 1;
    while (true) {
        var w = nrows * this.getCanvasWidth() / (StackArray.SIZE + 2 * nrows);
        if (w >= 25) return w;
        nrows++;
    }
}

StackArray.prototype.getArrayElemHeight = function() 
{
    return this.getArrayElemWidth() * 0.8;
}


///////////////////////////////////////////////////////////////////////////////
// Callback functions for the algorithm control bar

StackArray.prototype.pushCallback = function(event)
{
    var pushVal = this.pushField.value;
    if (pushVal !== "") {
        this.pushField.value = "";
        this.implementAction(this.push.bind(this), pushVal);
    }
}

StackArray.prototype.popCallback = function(event)
{
    this.implementAction(this.pop.bind(this), "");
}

StackArray.prototype.clearCallback = function(event)
{
    this.implementAction(this.clearAll.bind(this), "");
}


///////////////////////////////////////////////////////////////////////////////
// Functions that do the actual work

StackArray.prototype.clearAll = function()
{
    this.commands = [];
    this.cmd("SetText", this.leftoverLabelID, "");
    for (var i = 0; i < StackArray.SIZE; i++) {
        this.arrayData[i] = null;
        this.cmd("SetText", this.arrayID[i], "");
    }
    this.top = 0;
    this.cmd("SetText", this.topID, this.top);
    return this.commands;
}


StackArray.prototype.push = function(elemToPush)
{
    this.commands = [];
    if (this.top >= StackArray.SIZE) {
        this.cmd("SetText", this.leftoverLabelID, "Stack full!");
        return this.commands;
    }

    var labPushValID1 = this.nextIndex++;
    var labPushValID2 = this.nextIndex++;
    this.arrayData[this.top] = elemToPush;

    this.cmd("SetText", this.leftoverLabelID, "Pushing value:  ");
    this.cmd("CreateLabel", labPushValID1, elemToPush, 0, 0);
    this.cmd("CreateLabel", labPushValID2, elemToPush, 0, 0);
    this.cmd("AlignRight", labPushValID1, this.leftoverLabelID);
    this.cmd("AlignRight", labPushValID2, this.leftoverLabelID);
    this.cmd("Step");

    this.cmd("CreateHighlightCircle", this.highlightID, StackArray.INDEX_COLOR, 0, 0);
    this.cmd("SetWidth", this.highlightID, this.getArrayElemHeight());
    this.cmd("AlignMiddle", this.highlightID, this.topID);
    this.cmd("Step");

    this.cmd("Move", this.highlightID, this.getArrayX(this.top), this.getArrayLabelY(this.top));
    this.cmd("Step");

    this.cmd("Move", labPushValID1, this.getArrayX(this.top), this.getArrayY(this.top));
    this.cmd("Step");

    this.cmd("Settext", this.arrayID[this.top], elemToPush);
    this.cmd("Delete", labPushValID1);
    this.cmd("Delete", this.highlightID);
    this.cmd("SetHighlight", this.topID, 1);
    this.cmd("Step");

    this.top++;
    this.cmd("SetText", this.topID, this.top);
    this.cmd("Step");

    this.cmd("SetText", this.leftoverLabelID, "");
    this.cmd("Delete", labPushValID2);
    this.cmd("SetHighlight", this.topID, 0);

    return this.commands;
}


StackArray.prototype.pop = function(ignored)
{
    this.commands = [];
    if (this.top == 0) {
        this.cmd("SetText", this.leftoverLabelID, "Stack empty!");
        return this.commands;
    }

    var labPopValID = this.nextIndex++;

    this.cmd("SetText", this.leftoverLabelID, "Popping value:  ");
    this.cmd("SetHighlight", this.topID, 1);
    this.cmd("Step");

    this.top--;
    this.cmd("SetText", this.topID, this.top);
    this.cmd("Step");

    this.cmd("SetHighlight", this.topID, 0);
    this.cmd("CreateHighlightCircle", this.highlightID, StackArray.INDEX_COLOR, 0, 0);
    this.cmd("SetWidth", this.highlightID, this.getArrayElemHeight());
    this.cmd("AlignMiddle", this.highlightID, this.topID);
    this.cmd("Step");

    this.cmd("Move", this.highlightID, this.getArrayX(this.top), this.getArrayLabelY(this.top));
    this.cmd("Step");

    this.cmd("CreateLabel", labPopValID, this.arrayData[this.top], 0, 0);
    this.cmd("AlignMiddle", labPopValID, this.arrayID[this.top]);
    this.cmd("Settext", this.arrayID[this.top], "");
    this.cmd("MoveToAlignRight", labPopValID, this.leftoverLabelID);
    this.cmd("Step");

    this.cmd("Delete", labPopValID)
    this.cmd("Delete", this.highlightID);
    this.cmd("SetText", this.leftoverLabelID, "Popped value:  " + this.arrayData[this.top]);

    return this.commands;
}


///////////////////////////////////////////////////////////////////////////////
// Initialization

var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new StackArray(animManag);
}
