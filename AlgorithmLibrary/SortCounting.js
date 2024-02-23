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
///////////////////////////////////////////////////////////////////////////////


Algorithm.Sort.Counting = class CountingSort extends Algorithm.Sort {
    ARRAY_ELEM_WIDTH = 30;
    ARRAY_ELEM_HEIGHT = 30;
    ARRAY_ELEM_START_X = 20;

    COUNTER_ARRAY_ELEM_WIDTH = 30;
    COUNTER_ARRAY_ELEM_HEIGHT = 30;
    COUNTER_ARRAY_ELEM_START_X = 20;

    MAX_DATA_VALUE = 30;
    COUNTER_ARRAY_SIZE = this.MAX_DATA_VALUE + 1;

    ARRAY_SIZE = 30;

    constructor(am) {
        super();
        this.init(am);
    }

    init(am) {
        super.init(am);
        this.addControls();
        this.setup();
    }

    sizeChanged() {
        this.setup();
    }

    addControls() {
        this.resetButton = this.addButtonToAlgorithmBar("Randomize List");
        this.resetButton.onclick = this.resetCallback.bind(this);

        this.countingsSortButton = this.addButtonToAlgorithmBar("Counting Sort");
        this.countingsSortButton.onclick = this.countingSortCallback.bind(this);
    }

    setup() {
        this.animationManager.resetAll();
        this.nextIndex = 0;

        const h = this.getCanvasHeight();
        this.ARRAY_ELEM_Y = 3 * this.COUNTER_ARRAY_ELEM_HEIGHT;
        this.COUNTER_ARRAY_ELEM_Y = Math.floor(h / 2);
        this.SWAP_ARRAY_ELEM_Y = h - 3 * this.COUNTER_ARRAY_ELEM_HEIGHT;

        this.arrayData = new Array(this.ARRAY_SIZE);
        this.arrayRects = new Array(this.ARRAY_SIZE);
        this.arrayIndices = new Array(this.ARRAY_SIZE);

        this.counterData = new Array(this.COUNTER_ARRAY_SIZE);
        this.counterRects = new Array(this.COUNTER_ARRAY_SIZE);
        this.counterIndices = new Array(this.COUNTER_ARRAY_SIZE);

        this.swapData = new Array(this.ARRAY_SIZE);
        this.swapRects = new Array(this.ARRAY_SIZE);
        this.swapIndices = new Array(this.ARRAY_SIZE);

        this.commands = [];

        this.animationManager.resetAll();
        for (let i = 0; i < this.ARRAY_SIZE; i++) {
            let nextID = this.nextIndex++;
            this.arrayData[i] = Math.floor(Math.random() * this.MAX_DATA_VALUE);
            this.cmd("CreateRectangle", nextID, this.arrayData[i], this.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_HEIGHT, this.ARRAY_ELEM_START_X + i * this.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);
            this.arrayRects[i] = nextID;

            nextID = this.nextIndex++;
            this.arrayIndices[i] = nextID;
            this.cmd("CreateLabel", nextID, i, this.ARRAY_ELEM_START_X + i * this.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y + this.ARRAY_ELEM_HEIGHT);
            this.cmd("SetForegroundColor", nextID, "#0000FF");

            nextID = this.nextIndex++;
            this.cmd("CreateRectangle", nextID, "", this.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_HEIGHT, this.ARRAY_ELEM_START_X + i * this.ARRAY_ELEM_WIDTH, this.SWAP_ARRAY_ELEM_Y);
            this.swapRects[i] = nextID;

            nextID = this.nextIndex++;
            this.swapIndices[i] = nextID;
            this.cmd("CreateLabel", nextID, i, this.ARRAY_ELEM_START_X + i * this.ARRAY_ELEM_WIDTH, this.SWAP_ARRAY_ELEM_Y + this.ARRAY_ELEM_HEIGHT);
            this.cmd("SetForegroundColor", nextID, "#0000FF");
        }
        for (let i = this.COUNTER_ARRAY_SIZE - 1; i >= 0; i--) {
            let nextID = this.nextIndex++;
            this.cmd("CreateRectangle", nextID, "", this.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_HEIGHT, this.COUNTER_ARRAY_ELEM_START_X + i * this.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_Y);
            this.counterRects[i] = nextID;

            nextID = this.nextIndex++;
            this.counterIndices[i] = nextID;
            this.cmd("CreateLabel", nextID, i, this.COUNTER_ARRAY_ELEM_START_X + i * this.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_Y + this.COUNTER_ARRAY_ELEM_HEIGHT);
            this.cmd("SetForegroundColor", nextID, "#0000FF");
        }

        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    resetAll(small) {
        this.animationManager.resetAll();
        this.nextIndex = 0;
    }

    countingSortCallback(event) {
        this.commands = [];
        const animatedCircleID = this.nextIndex++;
        const animatedCircleID2 = this.nextIndex++;
        const animatedCircleID3 = this.nextIndex++;
        const animatedCircleID4 = this.nextIndex++;
        for (let i = 0; i < this.COUNTER_ARRAY_SIZE; i++) {
            this.counterData[i] = 0;
            this.cmd("SetText", this.counterRects[i], 0);
        }
        for (let i = 0; i < this.ARRAY_SIZE; i++) {
            this.cmd("CreateHighlightCircle", animatedCircleID, "#0000FF", this.ARRAY_ELEM_START_X + i * this.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);
            this.cmd("CreateHighlightCircle", animatedCircleID2, "#0000FF", this.ARRAY_ELEM_START_X + i * this.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);
            const index = this.arrayData[i];
            this.cmd("Move", animatedCircleID, this.COUNTER_ARRAY_ELEM_START_X + index * this.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_Y + this.COUNTER_ARRAY_ELEM_HEIGHT);
            this.cmd("Step");
            this.counterData[index]++;
            this.cmd("SetText", this.counterRects[this.arrayData[i]], this.counterData[this.arrayData[i]]);
            this.cmd("Step");
            this.cmd("SetAlpha", this.arrayRects[i], 0.2);
            this.cmd("Delete", animatedCircleID);
            this.cmd("Delete", animatedCircleID2);
        }
        for (let i = 1; i < this.COUNTER_ARRAY_SIZE; i++) {
            this.cmd("SetHighlight", this.counterRects[i - 1], 1);
            this.cmd("SetHighlight", this.counterRects[i], 1);
            this.cmd("Step");
            this.counterData[i] = this.counterData[i] + this.counterData[i - 1];
            this.cmd("SetText", this.counterRects[i], this.counterData[i]);
            this.cmd("Step");
            this.cmd("SetHighlight", this.counterRects[i - 1], 0);
            this.cmd("SetHighlight", this.counterRects[i], 0);
        }
        for (let i = this.ARRAY_SIZE - 1; i >= 0; i--) {
            this.cmd("SetAlpha", this.arrayRects[i], 1.0);
        }
        for (let i = this.ARRAY_SIZE - 1; i >= 0; i--) {
            this.cmd("CreateHighlightCircle", animatedCircleID, "#0000FF", this.ARRAY_ELEM_START_X + i * this.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);
            this.cmd("CreateHighlightCircle", animatedCircleID2, "#0000FF", this.ARRAY_ELEM_START_X + i * this.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);

            const index = this.arrayData[i];
            this.cmd("Move", animatedCircleID2, this.COUNTER_ARRAY_ELEM_START_X + index * this.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_Y + this.COUNTER_ARRAY_ELEM_HEIGHT);
            this.cmd("Step");

            const insertIndex = --this.counterData[this.arrayData[i]];
            this.cmd("SetText", this.counterRects[this.arrayData[i]], this.counterData[this.arrayData[i]]);
            this.cmd("Step");

            this.cmd("CreateHighlightCircle", animatedCircleID3, "#AAAAFF", this.COUNTER_ARRAY_ELEM_START_X + index * this.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_Y);
            this.cmd("CreateHighlightCircle", animatedCircleID4, "#AAAAFF", this.COUNTER_ARRAY_ELEM_START_X + index * this.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_Y);

            this.cmd("Move", animatedCircleID4, this.ARRAY_ELEM_START_X + insertIndex * this.ARRAY_ELEM_WIDTH, this.SWAP_ARRAY_ELEM_Y + this.COUNTER_ARRAY_ELEM_HEIGHT);
            this.cmd("Step");

            const moveLabel = this.nextIndex++;
            this.cmd("SetText", this.arrayRects[i], "");
            this.cmd("CreateLabel", moveLabel, this.arrayData[i], this.ARRAY_ELEM_START_X + i * this.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);
            this.cmd("Move", moveLabel, this.ARRAY_ELEM_START_X + insertIndex * this.ARRAY_ELEM_WIDTH, this.SWAP_ARRAY_ELEM_Y);
            this.swapData[insertIndex] = this.arrayData[i];
            this.cmd("Step");
            this.cmd("Delete", moveLabel);
            this.nextIndex--; // Reuse index from moveLabel, now that it has been removed.
            this.cmd("SetText", this.swapRects[insertIndex], this.swapData[insertIndex]);
            this.cmd("Delete", animatedCircleID);
            this.cmd("Delete", animatedCircleID2);
            this.cmd("Delete", animatedCircleID3);
            this.cmd("Delete", animatedCircleID4);
        }
        for (let i = 0; i < this.ARRAY_SIZE; i++) {
            this.cmd("SetText", this.arrayRects[i], "");
        }

        for (let i = 0; i < this.COUNTER_ARRAY_SIZE; i++) {
            this.cmd("SetAlpha", this.counterRects[i], 0.05);
            this.cmd("SetAlpha", this.counterIndices[i], 0.05);
        }

        this.cmd("Step");
        const startLab = this.nextIndex;
        for (let i = 0; i < this.ARRAY_SIZE; i++) {
            this.cmd("CreateLabel", startLab + i, this.swapData[i], this.ARRAY_ELEM_START_X + i * this.ARRAY_ELEM_WIDTH, this.SWAP_ARRAY_ELEM_Y);
            this.cmd("Move", startLab + i, this.ARRAY_ELEM_START_X + i * this.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);
            this.cmd("SetText", this.swapRects[i], "");
        }
        this.cmd("Step");
        for (let i = 0; i < this.ARRAY_SIZE; i++) {
            this.arrayData[i] = this.swapData[i];
            this.cmd("SetText", this.arrayRects[i], this.arrayData[i]);
            this.cmd("Delete", startLab + i);
        }
        for (let i = 0; i < this.COUNTER_ARRAY_SIZE; i++) {
            this.cmd("SetAlpha", this.counterRects[i], 1);
            this.cmd("SetAlpha", this.counterIndices[i], 1);
        }
        this.animationManager.StartNewAnimation(this.commands);
    }

    randomizeArray() {
        this.commands = [];
        for (let i = 0; i < this.ARRAY_SIZE; i++) {
            this.arrayData[i] = Math.floor(1 + Math.random() * this.MAX_DATA_VALUE);
            this.cmd("SetText", this.arrayRects[i], this.arrayData[i]);
        }

        for (let i = 0; i < this.COUNTER_ARRAY_SIZE; i++) {
            this.cmd("SetText", this.counterRects[i], "");
        }

        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    // We want to (mostly) ignore resets, since we are disallowing undoing
    reset() {
        this.commands = [];
    }

    resetCallback(event) {
        this.randomizeArray();
    }
};
