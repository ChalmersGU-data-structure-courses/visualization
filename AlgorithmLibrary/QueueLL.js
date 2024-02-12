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

function QueueLL(am)
{
    this.init(am);
}
QueueLL.inheritFrom(Algorithm);


QueueLL.LINKED_LIST_START_X = 100;
QueueLL.LINKED_LIST_START_Y = 200;
QueueLL.LINKED_LIST_ELEM_WIDTH = 70;
QueueLL.LINKED_LIST_ELEM_HEIGHT = 30;


QueueLL.LINKED_LIST_INSERT_X = 250;
QueueLL.LINKED_LIST_INSERT_Y = 50;

QueueLL.LINKED_LIST_ELEM_SPACING = 100;
QueueLL.LINKED_LIST_LINE_SPACING = 100;

QueueLL.TOP_POS_X = 180;
QueueLL.TOP_POS_Y = 100;
QueueLL.TOP_LABEL_X = 130;
QueueLL.TOP_LABEL_Y = 100;

QueueLL.TOP_ELEM_WIDTH = 30;
QueueLL.TOP_ELEM_HEIGHT = 30;

QueueLL.TAIL_POS_X = 180;
QueueLL.TAIL_LABEL_X = 130;

QueueLL.PUSH_LABEL_X = 50;
QueueLL.PUSH_LABEL_Y = 30;
QueueLL.PUSH_ELEMENT_X = 120;
QueueLL.PUSH_ELEMENT_Y = 30;

QueueLL.SIZE = 32;


QueueLL.prototype.init = function(am)
{
    QueueLL.superclass.init.call(this, am);
    this.addControls();
    this.setup();
}


QueueLL.prototype.sizeChanged = function()
{
    this.setup();
}


QueueLL.prototype.addControls = function()
{
    this.enqueueField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
    this.addReturnSubmit(this.enqueueField, "ALPHANUM", this.enqueueCallback.bind(this));
    this.enqueueButton = this.addControlToAlgorithmBar("Button", "Enqueue");
    this.enqueueButton.onclick = this.enqueueCallback.bind(this);

    this.dequeueButton = this.addControlToAlgorithmBar("Button", "Dequeue");
    this.dequeueButton.onclick = this.dequeueCallback.bind(this);

    this.clearButton = this.addControlToAlgorithmBar("Button", "Clear Queue");
    this.clearButton.onclick = this.clearCallback.bind(this);
}



QueueLL.prototype.setup = function()
{
    this.animationManager.resetAll();
    this.nextIndex = 0;
    this.initialIndex = this.nextIndex;

    var h = this.getCanvasHeight();
    this.tail_pos_y = h - QueueLL.LINKED_LIST_ELEM_HEIGHT;
    this.tail_label_y = this.tail_pos_y;

    this.linkedListElemID = new Array(QueueLL.SIZE);
    for (var i = 0; i < QueueLL.SIZE; i++) {

        this.linkedListElemID[i]= this.nextIndex++;
    }
    this.headID = this.nextIndex++;
    this.headLabelID = this.nextIndex++;

    this.tailID = this.nextIndex++;
    this.tailLabelID = this.nextIndex++;

    this.arrayData = new Array(QueueLL.SIZE);
    this.top = 0;
    this.leftoverLabelID = this.nextIndex++;

    this.commands = [];

    this.cmd("CreateLabel", this.headLabelID, "Head", QueueLL.TOP_LABEL_X, QueueLL.TOP_LABEL_Y);
    this.cmd("CreateRectangle", this.headID, "", QueueLL.TOP_ELEM_WIDTH, QueueLL.TOP_ELEM_HEIGHT, QueueLL.TOP_POS_X, QueueLL.TOP_POS_Y);
    this.cmd("SetNull", this.headID, 1);


    this.cmd("CreateLabel", this.tailLabelID, "Tail", QueueLL.TAIL_LABEL_X, this.tail_label_y);
    this.cmd("CreateRectangle", this.tailID, "", QueueLL.TOP_ELEM_WIDTH, QueueLL.TOP_ELEM_HEIGHT, QueueLL.TAIL_POS_X, this.tail_pos_y);
    this.cmd("SetNull", this.tailID, 1);

    this.cmd("CreateLabel", this.leftoverLabelID, "", 5, QueueLL.PUSH_LABEL_Y,0);


    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}


QueueLL.prototype.resetLinkedListPositions = function()
{
    var nextX = QueueLL.LINKED_LIST_START_X;
    var nextY = QueueLL.LINKED_LIST_START_Y;
    for (var i = this.top - 1; i >= 0; i--) {
        this.cmd("Move", this.linkedListElemID[i], nextX, nextY);
        nextX += QueueLL.LINKED_LIST_ELEM_SPACING;
        if (nextX > this.getCanvasWidth() - QueueLL.LINKED_LIST_ELEM_SPACING) {
            nextX = QueueLL.LINKED_LIST_START_X;
            nextY += QueueLL.LINKED_LIST_LINE_SPACING;
        }
    }
}




QueueLL.prototype.reset = function()
{
    this.top = 0;
    this.nextIndex = this.initialIndex;

}


QueueLL.prototype.enqueueCallback = function(event)
{
    var enqueuedValue = this.enqueueField.value;
    if (this.top < QueueLL.SIZE && enqueuedValue !== "") {
        this.enqueueField.value = "";
        this.implementAction(this.enqueue.bind(this), enqueuedValue);
    }
}


QueueLL.prototype.dequeueCallback = function(event)
{
    if (this.top > 0) {
        this.implementAction(this.dequeue.bind(this), "");
    }
}


QueueLL.prototype.clearCallback = function(event)
{
    this.setup();
}



QueueLL.prototype.enqueue = function(elemToPush)
{
    this.commands = new Array();

    this.arrayData[this.top] = elemToPush;

    this.cmd("SetText", this.leftoverLabelID, "");

    for (var i = this.top; i > 0; i--) {
        this.arrayData[i] = this.arrayData[i-1];
        this.linkedListElemID[i] =this.linkedListElemID[i-1];
    }
    this.arrayData[0] = elemToPush;
    this.linkedListElemID[0] = this.nextIndex++;

    var labPushID = this.nextIndex++;
    var labPushValID = this.nextIndex++;
    this.cmd("CreateLinkedList",this.linkedListElemID[0], "" ,QueueLL.LINKED_LIST_ELEM_WIDTH, QueueLL.LINKED_LIST_ELEM_HEIGHT,
        QueueLL.LINKED_LIST_INSERT_X, QueueLL.LINKED_LIST_INSERT_Y, 0.25, 0, 1, 1);

    this.cmd("SetNull", this.linkedListElemID[0], 1);
    this.cmd("CreateLabel", labPushID, "Enqueuing Value: ", QueueLL.PUSH_LABEL_X, QueueLL.PUSH_LABEL_Y);
    this.cmd("CreateLabel", labPushValID,elemToPush, QueueLL.PUSH_ELEMENT_X, QueueLL.PUSH_ELEMENT_Y);

    this.cmd("Step");



    this.cmd("Move", labPushValID, QueueLL.LINKED_LIST_INSERT_X, QueueLL.LINKED_LIST_INSERT_Y);

    this.cmd("Step");
    this.cmd("SetText", this.linkedListElemID[0], elemToPush);
    this.cmd("Delete", labPushValID);

    if (this.top == 0) {
        this.cmd("SetNull", this.headID, 0);
        this.cmd("SetNull", this.tailID, 0);
        this.cmd("connect", this.headID, this.linkedListElemID[this.top]);
        this.cmd("connect", this.tailID, this.linkedListElemID[this.top]);
    }
    else {
        this.cmd("SetNull", this.linkedListElemID[1], 0);
        this.cmd("Connect",  this.linkedListElemID[1], this.linkedListElemID[0]);
        this.cmd("Step");
        this.cmd("Disconnect", this.tailID, this.linkedListElemID[1]);
    }
    this.cmd("Connect", this.tailID, this.linkedListElemID[0]);

    this.cmd("Step");
    this.top = this.top + 1;
    this.resetLinkedListPositions();
    this.cmd("Delete", labPushID);
    this.cmd("Step");

    return this.commands;
}

QueueLL.prototype.dequeue = function(ignored)
{
    this.commands = new Array();

    var labPopID = this.nextIndex++;
    var labPopValID = this.nextIndex++;

    this.cmd("SetText", this.leftoverLabelID, "");


    this.cmd("CreateLabel", labPopID, "Dequeued Value: ", QueueLL.PUSH_LABEL_X, QueueLL.PUSH_LABEL_Y);
    this.cmd("CreateLabel", labPopValID,this.arrayData[this.top - 1], QueueLL.LINKED_LIST_START_X, QueueLL.LINKED_LIST_START_Y);

    this.cmd("Move", labPopValID,  QueueLL.PUSH_ELEMENT_X, QueueLL.PUSH_ELEMENT_Y);
    this.cmd("Step");
    this.cmd("Disconnect", this.headID, this.linkedListElemID[this.top - 1]);

    if (this.top == 1) {
        this.cmd("SetNull", this.headID, 1);
        this.cmd("SetNull", this.tailID, 1);
        this.cmd("Disconnect", this.tailID, this.linkedListElemID[this.top-1]);
    }
    else {
        this.cmd("Connect", this.headID, this.linkedListElemID[this.top-2]);
    }
    this.cmd("Step");
    this.cmd("Delete", this.linkedListElemID[this.top - 1]);
    this.top = this.top - 1;
    this.resetLinkedListPositions();

    this.cmd("Delete", labPopValID)
    this.cmd("Delete", labPopID);
    this.cmd("SetText", this.leftoverLabelID, "Dequeued Value: " + this.arrayData[this.top]);



    return this.commands;
}


var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new QueueLL(animManag);
}
