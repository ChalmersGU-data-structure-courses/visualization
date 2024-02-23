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
/* globals Algorithm */
/* exported QueueLL */
///////////////////////////////////////////////////////////////////////////////


class QueueLL extends Algorithm {
    SIZE = 32;
    ELEM_SPACING = 1.5;

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
        this.enqueueField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.enqueueField, "ALPHANUM", this.enqueueCallback.bind(this));
        this.enqueueButton = this.addButtonToAlgorithmBar("Enqueue");
        this.enqueueButton.onclick = this.enqueueCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.dequeueButton = this.addButtonToAlgorithmBar("Dequeue");
        this.dequeueButton.onclick = this.dequeueCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.clearButton = this.addButtonToAlgorithmBar("Clear");
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

        this.queue = [];

        this.headID = this.nextIndex++;
        this.headLabelID = this.nextIndex++;
        this.cmd("CreateRectangle", this.headID, "", this.getRectWidth(), this.getElemHeight(), this.getElemX(0), 2 * this.getElemHeight());
        this.cmd("CreateLabel", this.headLabelID, "head:  ", 0, 0);
        this.cmd("AlignLeft", this.headLabelID, this.headID);
        this.cmd("SetNull", this.headID, 1);

        this.tailID = this.nextIndex++;
        this.tailLabelID = this.nextIndex++;
        this.cmd("CreateRectangle", this.tailID, "", this.getRectWidth(), this.getElemHeight(), this.getElemX(0), this.getCanvasHeight() - 2 * this.getElemHeight());
        this.cmd("CreateLabel", this.tailLabelID, "tail:  ", 0, 0);
        this.cmd("AlignLeft", this.tailLabelID, this.tailID);
        this.cmd("SetNull", this.tailID, 1);

        this.initialIndex = this.nextIndex;
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    reset() {
        this.queue = [];
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
        let x = 1.5 * this.getElemWidth();
        let y = 4.5 * this.getElemHeight();
        for (let k = 0; k < i; k++) {
            x += this.getElemWidth() * this.ELEM_SPACING;
            if (x + this.getElemWidth() > this.getCanvasWidth()) {
                x = 1.5 * this.getElemWidth();
                y += 2.5 * this.getElemHeight();
            }
        }
        return {x: x, y: y};
    }

    getElemWidth() {
        let nrows = 1;
        while (true) {
            const w = nrows * this.getCanvasWidth() / (this.SIZE + 2 * nrows);
            if (w >= 100) return w / this.ELEM_SPACING;
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

    enqueueCallback(event) {
        const enqueuedValue = this.enqueueField.value;
        if (enqueuedValue !== "") {
            this.enqueueField.value = "";
            this.implementAction(this.enqueue.bind(this), enqueuedValue);
        }
    }

    dequeueCallback(event) {
        this.implementAction(this.dequeue.bind(this), "");
    }

    clearCallback(event) {
        this.implementAction(this.clearAll.bind(this), "");
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Functions that do the actual work

    clearAll() {
        this.commands = [];
        this.cmd("SetText", this.messageID, "");
        while (this.queue.length > 0) {
            this.cmd("Delete", this.queue.pop().id);
        }
        this.cmd("SetNull", this.headID, 1);
        this.cmd("SetNull", this.tailID, 1);
        this.nextIndex = this.initialIndex;
        return this.commands;
    }

    enqueue(elem) {
        this.commands = [];
        const elemID = this.nextIndex++;

        this.cmd("SetText", this.messageID, "Enqueuing value:  ");
        this.cmd("CreateLabel", this.messageLabelID, elem, 0, 0);
        this.cmd("CreateLabel", this.messageLabelID2, elem, 0, 0);
        this.cmd("AlignRight", this.messageLabelID, this.messageID);
        this.cmd("AlignRight", this.messageLabelID2, this.messageID);
        this.cmd("Step");

        const insertX = this.getElemX(1), insertY = 2 * this.getElemHeight();
        this.cmd(
            "CreateLinkedList", elemID, "",
            this.getElemWidth(), this.getElemHeight(), insertX, insertY,
            0.25, 0, 1, 1,
        );
        this.cmd("Move", this.messageLabelID, insertX, insertY);
        this.cmd("Step");

        this.cmd("Settext", elemID, elem);
        this.cmd("SetNull", elemID, 1);
        this.cmd("Delete", this.messageLabelID);
        if (this.queue.length === 0) {
            this.cmd("SetNull", this.headID, 0);
            this.cmd("SetNull", this.tailID, 0);
            this.cmd("Connect", this.headID, elemID);
        } else {
            const prevID = this.queue[this.queue.length - 1].id;
            this.cmd("SetNull", prevID, 0);
            this.cmd("Connect", prevID, elemID);
            this.cmd("Step");
            this.cmd("Disconnect", this.tailID, prevID);
        }
        this.cmd("Connect", this.tailID, elemID);
        this.cmd("Step");

        this.queue.push({elem: elem, id: elemID});
        this.resetLinkedListPositions();
        this.cmd("SetText", this.messageID, "");
        this.cmd("Delete", this.messageLabelID2);

        return this.commands;
    }

    dequeue(ignored) {
        this.commands = [];
        if (this.queue.length === 0) {
            this.cmd("SetText", this.messageID, "Queue empty!");
            return this.commands;
        }

        const {elem: elem, id: elemID} = this.queue.shift();

        this.cmd("SetText", this.messageID, "Dequeing value:  ");
        this.cmd("Step");

        this.cmd("CreateLabel", this.messageLabelID, elem, 0, 0);
        this.cmd("AlignMiddle", this.messageLabelID, elemID);
        this.cmd("MoveToAlignRight", this.messageLabelID, this.messageID);
        this.cmd("Step");

        this.cmd("Disconnect", this.headID, elemID);
        if (this.queue.length === 0) {
            this.cmd("SetNull", this.headID, 1);
            this.cmd("SetNull", this.tailID, 1);
            this.cmd("Disconnect", this.tailID, elemID);
        } else {
            this.cmd("Connect", this.headID, this.queue[0].id);
        }
        this.cmd("Step");

        this.cmd("Delete", elemID);
        this.resetLinkedListPositions();
        this.cmd("Step");

        this.cmd("Delete", this.messageLabelID);
        this.cmd("SetText", this.messageID, `Dequeued Value:  ${elem}`);

        if (this.queue.length === 0) {
            this.nextIndex = this.initialIndex;
        }
        return this.commands;
    }

    resetLinkedListPositions() {
        for (let i = 0; i < this.queue.length; i++) {
            this.cmd("Move", this.queue[i].id, this.getElemX(i), this.getElemY(i));
        }
    }
}
