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


class StackLL extends Algorithm {
    static SIZE = 32;
    static ELEM_SPACING = 1.5;

    constructor(am) {
        super();
        this.init(am);
    }

    init(am) {
        super.init(am);
        this.addControls();
        this.resetAll();
    }

    sizeChanged() {
        this.resetAll();
    }

    addControls() {
        this.pushField = this.addControlToAlgorithmBar("Text", "", { maxlength: 4, size: 4 });
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

    resetAll() {
        this.animationManager.resetAll();
        this.nextIndex = 0;
        this.commands = [];

        this.messageID = this.nextIndex++;
        this.messageLabelID = this.nextIndex++;
        this.messageLabelID2 = this.nextIndex++;
        this.cmd("CreateLabel", this.messageID, "", this.getElemX(3), 2 * this.getElemHeight());

        this.stack = [];

        this.topID = this.nextIndex++;
        this.topLabelID = this.nextIndex++;
        this.cmd("CreateRectangle", this.topID, "", this.getRectWidth(), this.getElemHeight(), this.getElemX(0), 2 * this.getElemHeight());
        this.cmd("CreateLabel", this.topLabelID, "top:  ", 0, 0);
        this.cmd("AlignLeft", this.topLabelID, this.topID);
        this.cmd("SetNull", this.topID, 1);

        this.initialIndex = this.nextIndex;
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    reset() {
        this.stack = [];
        this.nextIndex = this.initialIndex;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Calculating canvas positions and sizes

    getElemX(i) {
        return this.getElemXY(i).x;
    }

    getElemY(i) {
        return this.getElemXY(i).y;
    }

    getElemXY(i) {
        var x = 1.5 * this.getElemWidth();
        var y = 4.5 * this.getElemHeight();
        for (var k = 0; k < i; k++) {
            x += this.getElemWidth() * StackLL.ELEM_SPACING;
            if (x + this.getElemWidth() > this.getCanvasWidth()) {
                x = 1.5 * this.getElemWidth();
                y += 2.5 * this.getElemHeight();
            }
        }
        return { x: x, y: y };
    }

    getElemWidth() {
        var nrows = 1;
        while (true) {
            var w = nrows * this.getCanvasWidth() / (StackLL.SIZE + 2 * nrows);
            if (w >= 100) return w / StackLL.ELEM_SPACING;
            nrows++;
        }
    }

    getRectWidth() {
        return this.getElemWidth() - 30;
    }

    getElemHeight() {
        return this.getRectWidth() * 0.8;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Callback functions for the algorithm control bar

    pushCallback(event) {
        var pushVal = this.pushField.value;
        if (pushVal !== "") {
            this.pushField.value = "";
            this.implementAction(this.push.bind(this), pushVal);
        }
    }

    popCallback(event) {
        this.implementAction(this.pop.bind(this), "");
    }

    clearCallback(event) {
        this.implementAction(this.clearAll.bind(this), "");
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Functions that do the actual work

    clearAll() {
        this.commands = [];
        this.cmd("SetText", this.messageID, "");
        while (this.stack.length > 0) {
            this.cmd("Delete", this.stack.pop().id);
            this.nextIndex--;
        }
        this.cmd("SetNull", this.topID, 1);
        return this.commands;
    }

    push(elem) {
        this.commands = [];
        var elemID = this.nextIndex++;

        this.cmd("SetText", this.messageID, "Pushing value:  ");
        this.cmd("CreateLabel", this.messageLabelID, elem, 0, 0);
        this.cmd("CreateLabel", this.messageLabelID2, elem, 0, 0);
        this.cmd("AlignRight", this.messageLabelID, this.messageID);
        this.cmd("AlignRight", this.messageLabelID2, this.messageID);
        this.cmd("Step");

        var insertX = this.getElemX(1), insertY = 2 * this.getElemHeight();
        this.cmd(
            "CreateLinkedList", elemID, "",
            this.getElemWidth(), this.getElemHeight(), insertX, insertY,
            0.25, 0, 1, 1
        );
        this.cmd("Move", this.messageLabelID, insertX, insertY);
        this.cmd("Step");

        this.cmd("SetText", elemID, elem);
        this.cmd("Delete", this.messageLabelID);
        if (this.stack.length == 0) {
            this.cmd("SetNull", this.topID, 0);
            this.cmd("SetNull", elemID, 1);
        }
        else {
            var prevID = this.stack[this.stack.length - 1].id;
            this.cmd("Connect", elemID, prevID);
            this.cmd("Step");
            this.cmd("Disconnect", this.topID, prevID);
        }
        this.cmd("Connect", this.topID, elemID);
        this.cmd("Step");

        this.stack.push({ elem: elem, id: elemID });
        this.resetLinkedListPositions();
        this.cmd("SetText", this.messageID, "");
        this.cmd("Delete", this.messageLabelID2);

        return this.commands;
    }

    pop(ignored) {
        this.commands = [];
        if (this.stack.length == 0) {
            this.cmd("SetText", this.messageID, "Stack empty!");
            return this.commands;
        }

        var { elem: elem, id: elemID } = this.stack.pop();

        this.cmd("SetText", this.messageID, "Popping value:  ");
        this.cmd("Step");

        this.cmd("CreateLabel", this.messageLabelID, elem, 0, 0);
        this.cmd("AlignMiddle", this.messageLabelID, elemID);
        this.cmd("MoveToAlignRight", this.messageLabelID, this.messageID);
        this.cmd("Step");

        this.cmd("Disconnect", this.topID, elemID);
        if (this.stack.length == 0) {
            this.cmd("SetNull", this.topID, 1);
        } else {
            this.cmd("Connect", this.topID, this.stack[this.stack.length - 1].id);
        }
        this.cmd("Step");

        this.cmd("Delete", elemID);
        this.resetLinkedListPositions();
        this.cmd("Step");

        this.cmd("Delete", this.messageLabelID);
        this.cmd("SetText", this.messageID, "Popped value:  " + elem);

        this.nextIndex--;
        return this.commands;
    }

    resetLinkedListPositions() {
        for (var i = 0; i < this.stack.length; i++) {
            var j = this.stack.length - i - 1;
            this.cmd("Move", this.stack[j].id, this.getElemX(i), this.getElemY(i));
        }
    }
}

