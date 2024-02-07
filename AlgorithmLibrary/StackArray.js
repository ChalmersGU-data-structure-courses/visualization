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


StackArray.ARRAY_START_X = 100;
StackArray.ARRAY_START_Y = 200;
StackArray.ARRAY_ELEM_WIDTH = 50;
StackArray.ARRAY_ELEM_HEIGHT = 50;

StackArray.ARRAY_LINE_SPACING = 130;

StackArray.TOP_POS_X = 180;
StackArray.TOP_POS_Y = 100;
StackArray.TOP_LABEL_X = 130;
StackArray.TOP_LABEL_Y = 100;

StackArray.PUSH_LABEL_X = 50;
StackArray.PUSH_LABEL_Y = 30;
StackArray.PUSH_ELEMENT_X = 120;
StackArray.PUSH_ELEMENT_Y = 30;

StackArray.SIZE = 15;


StackArray.prototype.init = function(am)
{
    StackArray.superclass.init.call(this, am);
    this.addControls();
    this.setup();
}


StackArray.prototype.sizeChanged = function()
{
    this.setup();
}


StackArray.prototype.addControls = function()
{
    this.pushField = this.addControlToAlgorithmBar("Text", "");
    this.pushField.onkeydown = this.returnSubmit(this.pushField,  this.pushCallback.bind(this), 6);
    this.pushButton = this.addControlToAlgorithmBar("Button", "Push");
    this.pushButton.onclick = this.pushCallback.bind(this);

    this.popButton = this.addControlToAlgorithmBar("Button", "Pop");
    this.popButton.onclick = this.popCallback.bind(this);

    this.clearButton = this.addControlToAlgorithmBar("Button", "Clear Stack");
    this.clearButton.onclick = this.clearCallback.bind(this);
}


StackArray.prototype.setup = function()
{
    this.animationManager.resetAll();
    this.nextIndex = 0;
    this.initialIndex = this.nextIndex;

    this.arrayID = new Array(StackArray.SIZE);
    this.arrayLabelID = new Array(StackArray.SIZE);
    for (var i = 0; i < StackArray.SIZE; i++)
    {

        this.arrayID[i]= this.nextIndex++;
        this.arrayLabelID[i]= this.nextIndex++;
    }
    this.topID = this.nextIndex++;
    this.topLabelID = this.nextIndex++;

    this.arrayData = new Array(StackArray.SIZE);
    this.top = 0;
    this.leftoverLabelID = this.nextIndex++;

    this.commands = [];

    var xpos = StackArray.ARRAY_START_X;
    var ypos = StackArray.ARRAY_START_Y;
    for (var i = 0; i < StackArray.SIZE; i++)
    {
        this.cmd("CreateRectangle", this.arrayID[i], "", StackArray.ARRAY_ELEM_WIDTH, StackArray.ARRAY_ELEM_HEIGHT,xpos, ypos);
        this.cmd("CreateLabel",this.arrayLabelID[i], i, xpos, ypos + StackArray.ARRAY_ELEM_HEIGHT);
        this.cmd("SetForegroundColor", this.arrayLabelID[i], "#0000FF");
        xpos += StackArray.ARRAY_ELEM_WIDTH;
        if (xpos > this.getCanvasWidth() - StackArray.ARRAY_LINE_SPACING) {
            xpos = StackArray.ARRAY_START_X;
            ypos += StackArray.ARRAY_LINE_SPACING;
        }
    }

    this.cmd("CreateLabel", this.topLabelID, "top", StackArray.TOP_LABEL_X, StackArray.TOP_LABEL_Y);
    this.cmd("CreateRectangle", this.topID, 0, StackArray.ARRAY_ELEM_WIDTH, StackArray.ARRAY_ELEM_HEIGHT, StackArray.TOP_POS_X, StackArray.TOP_POS_Y);

    this.cmd("CreateLabel", this.leftoverLabelID, "", StackArray.PUSH_LABEL_X, StackArray.PUSH_LABEL_Y);

    this.highlight1ID = this.nextIndex++;
    this.highlight2ID = this.nextIndex++;

    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}



StackArray.prototype.reset = function()
{
    this.top = 0;
    this.nextIndex = this.initialIndex;

}


StackArray.prototype.pushCallback = function(event)
{
    if (this.top < StackArray.SIZE && this.pushField.value != "")
    {
        var pushVal = this.pushField.value;
        this.pushField.value = ""
        this.implementAction(this.push.bind(this), pushVal);
    }
}


StackArray.prototype.popCallback = function(event)
{
    if (this.top > 0)
    {
        this.implementAction(this.pop.bind(this), "");
    }
}


StackArray.prototype.clearCallback = function(event)
{
    this.setup();
}


StackArray.prototype.getXYPos = function(index) {
    var xpos = StackArray.ARRAY_START_X;
    var ypos = StackArray.ARRAY_START_Y;
    for (var i = 0; i < index; i++)
    {
        xpos += StackArray.ARRAY_ELEM_WIDTH;
        if (xpos > this.getCanvasWidth() - StackArray.ARRAY_LINE_SPACING) {
            xpos = StackArray.ARRAY_START_X;
            ypos += StackArray.ARRAY_LINE_SPACING;
        }
    }
    return [xpos, ypos];
}


StackArray.prototype.push = function(elemToPush)
{
    this.commands = new Array();

    var labPushID = this.nextIndex++;
    var labPushValID = this.nextIndex++;
    this.arrayData[this.top] = elemToPush;

    this.cmd("SetText", this.leftoverLabelID, "");

    this.cmd("CreateLabel", labPushID, "Pushing Value: ", StackArray.PUSH_LABEL_X, StackArray.PUSH_LABEL_Y);
    this.cmd("CreateLabel", labPushValID,elemToPush, StackArray.PUSH_ELEMENT_X, StackArray.PUSH_ELEMENT_Y);

    this.cmd("Step");
    this.cmd("CreateHighlightCircle", this.highlight1ID, "#0000FF",  StackArray.TOP_POS_X, StackArray.TOP_POS_Y);
    this.cmd("Step");

    var [xpos, ypos] = this.getXYPos(this.top);

    this.cmd("Move", this.highlight1ID, xpos, ypos + StackArray.ARRAY_ELEM_HEIGHT);
    this.cmd("Step");

    this.cmd("Move", labPushValID, xpos, ypos);
    this.cmd("Step");

    this.cmd("Settext", this.arrayID[this.top], elemToPush);
    this.cmd("Delete", labPushValID);

    this.cmd("Delete", this.highlight1ID);

    this.cmd("SetHighlight", this.topID, 1);
    this.cmd("Step");
    this.top = this.top + 1;
    this.cmd("SetText", this.topID, this.top)
    this.cmd("Delete", labPushID);
    this.cmd("Step");
    this.cmd("SetHighlight", this.topID, 0);

    return this.commands;
}


StackArray.prototype.pop = function(ignored)
{
    this.commands = new Array();

    var labPopID = this.nextIndex++;
    var labPopValID = this.nextIndex++;

    this.cmd("SetText", this.leftoverLabelID, "");


    this.cmd("CreateLabel", labPopID, "Popped Value: ", StackArray.PUSH_LABEL_X, StackArray.PUSH_LABEL_Y);


    this.cmd("SetHighlight", this.topID, 1);
    this.cmd("Step");
    this.top = this.top - 1;
    this.cmd("SetText", this.topID, this.top)
    this.cmd("Step");
    this.cmd("SetHighlight", this.topID, 0);

    this.cmd("CreateHighlightCircle", this.highlight1ID, "#0000FF",  StackArray.TOP_POS_X, StackArray.TOP_POS_Y);
    this.cmd("Step");

    var [xpos, ypos] = this.getXYPos(this.top);

    this.cmd("Move", this.highlight1ID, xpos, ypos + StackArray.ARRAY_ELEM_HEIGHT);
    this.cmd("Step");

    this.cmd("CreateLabel", labPopValID,this.arrayData[this.top], xpos, ypos);
    this.cmd("Settext", this.arrayID[this.top], "");
    this.cmd("Move", labPopValID,  StackArray.PUSH_ELEMENT_X, StackArray.PUSH_ELEMENT_Y);
    this.cmd("Step");
    this.cmd("Delete", labPopValID)
    this.cmd("Delete", labPopID);
    this.cmd("Delete", this.highlight1ID);
    this.cmd("SetText", this.leftoverLabelID, "Popped Value: " + this.arrayData[this.top]);

    return this.commands;
}


var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new StackArray(animManag);
}
