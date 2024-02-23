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
/* exported QueueArray */
///////////////////////////////////////////////////////////////////////////////


class QueueArray extends Algorithm {
    SIZE = 15;
    INDEX_COLOR = "#0000FF";

    ARRAY_START_X = 100;
    ARRAY_START_Y = 200;
    ARRAY_ELEM_WIDTH = 50;
    ARRAY_ELEM_HEIGHT = 50;

    ARRAY_LINE_SPACING = 130;

    HEAD_POS_X = 180;
    HEAD_POS_Y = 100;
    HEAD_LABEL_X = 130;
    HEAD_LABEL_Y = 100;

    TAIL_POS_X = 280;
    TAIL_POS_Y = 100;
    TAIL_LABEL_X = 230;
    TAIL_LABEL_Y = 100;

    QUEUE_LABEL_X = 50;
    QUEUE_LABEL_Y = 30;
    QUEUE_ELEMENT_X = 120;
    QUEUE_ELEMENT_Y = 30;

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
        this.enqueueButton = this.addControlToAlgorithmBar("Button", "Enqueue");
        this.enqueueButton.onclick = this.enqueueCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.dequeueButton = this.addControlToAlgorithmBar("Button", "Dequeue");
        this.dequeueButton.onclick = this.dequeueCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.clearButton = this.addControlToAlgorithmBar("Button", "Clear");
        this.clearButton.onclick = this.clearCallback.bind(this);
    }

    resetAll() {
        this.animationManager.resetAll();
        this.nextIndex = 0;
        this.commands = [];

        this.leftoverLabelID = this.nextIndex++;
        this.cmd("CreateLabel", this.leftoverLabelID, "", this.getArrayX(8), 2 * this.getArrayElemHeight());

        this.head = 0;
        this.headID = this.nextIndex++;
        this.headLabelID = this.nextIndex++;
        this.cmd("CreateRectangle", this.headID, 0, this.getArrayElemWidth(), this.getArrayElemHeight(), this.getArrayX(3), 2 * this.getArrayElemHeight());
        this.cmd("CreateLabel", this.headLabelID, "head:  ", 0, 0);
        this.cmd("AlignLeft", this.headLabelID, this.headID);

        this.tail = 0;
        this.tailID = this.nextIndex++;
        this.tailLabelID = this.nextIndex++;
        this.cmd("CreateRectangle", this.tailID, 0, this.getArrayElemWidth(), this.getArrayElemHeight(), this.getArrayX(5), 2 * this.getArrayElemHeight());
        this.cmd("CreateLabel", this.tailLabelID, "tail:  ", 0, 0);
        this.cmd("AlignLeft", this.tailLabelID, this.tailID);

        this.arrayData = [];
        this.arrayID = [];
        this.arrayLabelID = [];
        for (let i = 0; i < this.SIZE; i++) {
            this.arrayID[i] = this.nextIndex++;
            this.arrayLabelID[i] = this.nextIndex++;
            this.cmd("CreateRectangle", this.arrayID[i], "", this.getArrayElemWidth(), this.getArrayElemHeight(), this.getArrayX(i), this.getArrayY(i));
            this.cmd("CreateLabel", this.arrayLabelID[i], i, this.getArrayX(i), this.getArrayLabelY(i));
            this.cmd("SetForegroundColor", this.arrayLabelID[i], this.INDEX_COLOR);
        }

        this.highlightID = this.nextIndex++;

        this.initialIndex = this.nextIndex;
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    reset() {
        this.head = 0;
        this.tail = 0;
        this.nextIndex = this.initialIndex;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Calculating canvas positions and sizes

    getArrayX(i) {
        return this.getArrayXY(i).x;
    }

    getArrayY(i) {
        return this.getArrayXY(i).y;
    }

    getArrayLabelY(i) {
        return this.getArrayY(i) + this.getArrayElemHeight() * 0.9;
    }

    getArrayXY(i) {
        let x = 1.5 * this.getArrayElemWidth();
        let y = 4.5 * this.getArrayElemHeight();
        for (let k = 0; k < i; k++) {
            x += this.getArrayElemWidth();
            if (x + this.getArrayElemWidth() > this.getCanvasWidth()) {
                x = 1.5 * this.getArrayElemWidth();
                y += 2.5 * this.getArrayElemHeight();
            }
        }
        return {x: x, y: y};
    }

    getArrayElemWidth() {
        let nrows = 1;
        while (true) {
            const w = nrows * this.getCanvasWidth() / (this.SIZE + 2 * nrows);
            if (w >= 25) return w;
            nrows++;
        }
    }

    getArrayElemHeight() {
        return this.getArrayElemWidth() * 0.8;
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
        this.cmd("SetText", this.leftoverLabelID, "");
        for (let i = 0; i < this.SIZE; i++) {
            this.arrayData[i] = null;
            this.cmd("SetText", this.arrayID[i], "");
        }
        this.head = 0;
        this.cmd("SetText", this.headID, this.head);
        this.tail = 0;
        this.cmd("SetText", this.tailID, this.tail);
        return this.commands;
    }

    enqueue(elemToEnqueue) {
        this.commands = [];
        if ((this.tail + 1) % this.SIZE === this.head) {
            this.cmd("SetText", this.leftoverLabelID, "Queue full!");
            return this.commands;
        }

        const labEnqueueValID1 = this.nextIndex++;
        const labEnqueueValID2 = this.nextIndex++;
        this.arrayData[this.tail] = elemToEnqueue;

        this.cmd("SetText", this.leftoverLabelID, "Enqueuing value:  ");
        this.cmd("CreateLabel", labEnqueueValID1, elemToEnqueue, 0, 0);
        this.cmd("CreateLabel", labEnqueueValID2, elemToEnqueue, 0, 0);
        this.cmd("AlignRight", labEnqueueValID1, this.leftoverLabelID);
        this.cmd("AlignRight", labEnqueueValID2, this.leftoverLabelID);
        this.cmd("Step");

        this.cmd("CreateHighlightCircle", this.highlightID, this.INDEX_COLOR, 0, 0);
        this.cmd("SetWidth", this.highlightID, this.getArrayElemHeight());
        this.cmd("AlignMiddle", this.highlightID, this.tailID);
        this.cmd("Step");

        this.cmd("Move", this.highlightID, this.getArrayX(this.tail), this.getArrayLabelY(this.tail));
        this.cmd("Step");

        this.cmd("Move", labEnqueueValID1, this.getArrayX(this.tail), this.getArrayY(this.tail));
        this.cmd("Step");

        this.cmd("Settext", this.arrayID[this.tail], elemToEnqueue);
        this.cmd("Delete", labEnqueueValID1);
        this.cmd("Delete", this.highlightID);
        this.cmd("SetHighlight", this.tailID, 1);
        this.cmd("Step");

        this.tail = (this.tail + 1) % this.SIZE;
        this.cmd("SetText", this.tailID, this.tail);
        this.cmd("Step");

        this.cmd("SetText", this.leftoverLabelID, "");
        this.cmd("Delete", labEnqueueValID2);
        this.cmd("SetHighlight", this.tailID, 0);

        return this.commands;
    }

    dequeue(ignored) {
        this.commands = [];
        if (this.tail === this.head) {
            this.cmd("SetText", this.leftoverLabelID, "Queue empty!");
            return this.commands;
        }

        const labDequeueValID = this.nextIndex++;

        this.cmd("SetText", this.leftoverLabelID, "Dequeing value:  ");
        this.cmd("Step");

        this.cmd("CreateHighlightCircle", this.highlightID, this.INDEX_COLOR, 0, 0);
        this.cmd("SetWidth", this.highlightID, this.getArrayElemHeight());
        this.cmd("AlignMiddle", this.highlightID, this.headID);
        this.cmd("Step");

        this.cmd("Move", this.highlightID, this.getArrayX(this.head), this.getArrayLabelY(this.head));
        this.cmd("Step");

        const dequeuedVal = this.arrayData[this.head];
        this.cmd("CreateLabel", labDequeueValID, dequeuedVal, 0, 0);
        this.cmd("AlignMiddle", labDequeueValID, this.arrayID[this.head]);
        this.cmd("Settext", this.arrayID[this.head], "");
        this.cmd("MoveToAlignRight", labDequeueValID, this.leftoverLabelID);
        this.cmd("Step");

        this.cmd("Delete", this.highlightID);
        this.cmd("SetHighlight", this.headID, 1);
        this.cmd("Step");

        this.head = (this.head + 1) % this.SIZE;
        this.cmd("SetText", this.headID, this.head);
        this.cmd("Step");

        this.cmd("SetHighlight", this.headID, 0);
        this.cmd("Delete", labDequeueValID);
        this.cmd("SetText", this.leftoverLabelID, `Dequeued Value:  ${dequeuedVal}`);

        return this.commands;
    }
}
