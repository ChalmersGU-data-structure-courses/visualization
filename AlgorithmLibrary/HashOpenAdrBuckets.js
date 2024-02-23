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


Algorithm.Hash.OpenAdrBuckets = class OpenAdrBuckets extends Algorithm.Hash {
    // This is a special key and should not be possible to enter in the GUI:
    DELETED = "<deleted>";

    DEFAULT_TABLE_SIZE = 23;
    TABLE_SIZES = [13, 23, 41];
    TABLE_SIZE_LABELS = ["Small (13)", "Medium (23)", "Large (41)"];
    NUM_BUCKETS = {13: 5, 23: 6, 41: 11};

    ARRAY_ELEM_START_Y = 100;

    constructor(am) {
        super();
        this.init(am);
    }

    addControls() {
        super.addControls();
        this.addBreakToAlgorithmBar();

        this.addLabelToAlgorithmBar("Table size:");
        this.sizeSelect = this.addSelectToAlgorithmBar(this.TABLE_SIZES, this.TABLE_SIZE_LABELS);
        this.sizeSelect.value = this.DEFAULT_TABLE_SIZE;
        this.sizeSelect.onchange = this.resetAll.bind(this);
    }

    resetAll() {
        this.tableSize = parseInt(this.sizeSelect?.value) || this.DEFAULT_TABLE_SIZE;
        super.resetAll();

        this.numBuckets = this.NUM_BUCKETS[this.tableSize];
        this.bucketSize = Math.floor((this.tableSize - 2) / this.numBuckets);

        this.tableCells = new Array(this.tableSize);
        for (let i = 0; i < this.tableSize; i++) {
            this.tableCells[i] = "";
        }

        for (let i = 0; i <= this.numBuckets; i++) {
            const nextID = this.nextIndex++;
            this.cmd(
                "CreateRectangle", nextID, "",
                0, 2.5 * this.getCellHeight(),
                this.getBucketPosX(i), this.getBucketPosY(i),
                "center", "top",
            );
            const lblID = this.nextIndex++;
            const lbl = i < this.numBuckets ? i : "Overflow";
            this.cmd("CreateLabel", lblID, lbl, this.getBucketLabelX(i), this.getBucketLabelY(i), 0);
        }

        this.initialIndex = this.nextIndex;
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    reset() {
        for (let i = 0; i < this.tableSize; i++) {
            this.tableCells[i] = "";
        }
        this.nextIndex = this.initialIndex;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Calculating canvas positions and sizes

    getBucketPosX(i) {
        return this.getCellPosX(i * this.bucketSize) - this.getCellWidth() / 2;
    }

    getBucketPosY(i) {
        return this.getCellPosY(i * this.bucketSize) - this.getCellHeight() / 2;
    }

    getBucketLabelX(i) {
        return this.getBucketPosX(i) + 5;
    }

    getBucketLabelY(i) {
        return this.getBucketPosY(i) + 2 * this.getCellHeight();
    }

    getCellPosX(i) {
        return this.getCellPosXY(i).x;
    }

    getCellPosY(i) {
        return this.getCellPosXY(i).y;
    }

    getCellIndexPosY(i) {
        return this.getCellPosY(i) + this.getCellHeight();
    }

    getCellPosXY(i) {
        const startX = this.getCellWidth();
        let x = startX;
        let y = this.ARRAY_ELEM_START_Y;
        for (let k = 0; k < i; k++) {
            x += this.getCellWidth();
            if (x + this.getCellWidth() > this.getCanvasWidth()) {
                x = startX;
                y += Math.round(4 * this.getCellHeight());
            }
        }
        return {x: x, y: y};
    }

    getCellWidth() {
        let nrows = 1;
        while (true) {
            const w = nrows * this.getCanvasWidth() / (this.tableSize + 2 * nrows);
            if (w >= 65 || nrows >= 4) return Math.round(w);
            nrows++;
        }
    }

    getCellHeight() {
        return Math.round(this.getCellWidth() * 0.4);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Functions that do the actual work

    printTable() {
        this.commands = [];
        this.cmd("SetText", this.messageID, "Printing hash table");
        this.highlightID = this.nextIndex++;
        this.cmd("CreateHighlightCircle", this.highlightID, "red", 0, 0);
        const firstLabel = this.nextIndex;

        let xPosOfNextLabel = this.FIRST_PRINT_POS_X;
        let yPosOfNextLabel = this.getCanvasHeight() * 0.9;

        for (let i = 0; i < this.tableCells.length; i++) {
            this.cmd("Move", this.highlightID, this.getCellPosX(i), this.getCellPosY(i));
            this.cmd("Step");
            const elem = this.tableCells[i];
            if (elem && elem !== this.DELETED) {
                const nextLabelID = this.nextIndex++;
                this.cmd("CreateLabel", nextLabelID, elem, this.getCellPosX(i), this.getCellPosY(i));
                this.cmd("SetForegroundColor", nextLabelID, "blue");
                this.cmd("Move", nextLabelID, xPosOfNextLabel, yPosOfNextLabel);
                this.cmd("Step");

                xPosOfNextLabel += this.PRINT_HORIZONTAL_GAP;
                if (xPosOfNextLabel > this.printMax) {
                    xPosOfNextLabel = this.FIRST_PRINT_POS_X;
                    yPosOfNextLabel += this.PRINT_VERTICAL_GAP;
                }
            }
        }

        this.cmd("Delete", this.highlightID);
        this.cmd("Step");
        for (let i = firstLabel; i < this.nextIndex; i++) {
            this.cmd("Delete", i);
        }
        this.nextIndex = this.highlightID; // Reuse objects. Not necessary.
        this.cmd("SetText", this.messageID, "");
        return this.commands;
    }

    clearTable() {
        this.commands = [];
        for (let i = 0; i < this.tableCells.length; i++) {
            this.tableCells[i] = "";
            this.cmd("SetText", this.tableCellIDs[i], "");
        }
        return this.commands;
    }

    insertElement(elem) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Inserting ${elem}`);

        const hash = this.getHashCode(elem);
        const bucket = this.getBucket(hash);
        const index = this.getEmptyIndex(bucket, elem);
        this.cmd("SetText", this.sndMessageID, "");

        if (index < 0) {
            this.cmd("SetText", this.messageID, `Inserting ${elem}: Buckets are full!`);
        } else {
            const labID = this.nextIndex++;
            this.cmd("CreateLabel", labID, elem, 0, 0);
            this.cmd("AlignRight", labID, this.messageID);
            this.cmd("Move", labID, this.getCellPosX(index), this.getCellPosY(index));
            this.cmd("SetText", this.tableCellIDs[index], "");
            this.cmd("Step");

            this.tableCells[index] = elem;
            this.cmd("SetText", this.tableCellIDs[index], elem);
            this.cmd("SetText", this.messageID, `Inserted ${elem}.`);
            this.cmd("Delete", labID);
            this.nextIndex--;
            this.cmd("SetText", this.tableCellIDs[index], elem);
            this.tableCells[index] = elem;
            this.cmd("Step");
            this.cmd("SetHighlight", this.tableCellIDs[index], 0);
        }
        return this.commands;
    }

    deleteElement(elem) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Deleting: ${elem}`);

        const hash = this.getHashCode(elem);
        const bucket = this.getBucket(hash);
        const index = this.getElemIndex(bucket, elem);
        this.cmd("SetText", this.sndMessageID, "");

        if (index < 0) {
            this.cmd("SetText", this.messageID, `Deleting ${elem}: Element not found!`);
        } else {
            this.tableCells[index] = this.DELETED;
            this.cmd("SetText", this.tableCellIDs[index], this.DELETED);
            this.cmd("SetText", this.messageID, `Deleted ${elem}.`);
            this.cmd("Step");
            this.cmd("SetHighlight", this.tableCellIDs[index], 0);
        }
        return this.commands;
    }

    findElement(elem) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Finding ${elem}`);

        const hash = this.getHashCode(elem);
        const bucket = this.getBucket(hash);
        const index = this.getElemIndex(bucket, elem);
        this.cmd("SetText", this.sndMessageID, "");

        if (index < 0) {
            this.cmd("SetText", this.messageID, `Finding ${elem}: Element not found!`);
        } else {
            this.cmd("SetText", this.messageID, `Found ${elem}.`);
            this.cmd("Step");
            this.cmd("SetHighlight", this.tableCellIDs[index], 0);
        }
        return this.commands;
    }

    getBucketIndices(bucket) {
        if (bucket < 0) bucket = this.numBuckets;
        let len = this.bucketSize;
        const start = bucket * len;
        if (bucket >= this.numBuckets) len = this.tableSize - start;
        return Array.from({length: len}, (_, i) => i + start);
    }

    getElemIndex(bucket, elem) {
        this.cmd("SetText", this.sndMessageID, `Searching in bucket ${bucket}.`);
        for (const i of this.getBucketIndices(bucket)) {
            this.cmd("SetHighlight", this.tableCellIDs[i], 1);
            this.cmd("Step");
            if (this.tableCells[i] === elem) return i;
            this.cmd("SetHighlight", this.tableCellIDs[i], 0);
            if (!this.tableCells[i]) return -1;
        }
        // Can only get this far if we didn't find the element we are looking for,
        //  *and* the bucket was full -- look at overflow bucket.
        this.cmd("SetText", this.sndMessageID, "Bucket is full - searching the overflow bucket.");
        for (const i of this.getBucketIndices(-1)) {
            this.cmd("SetHighlight", this.tableCellIDs[i], 1);
            this.cmd("Step");
            if (this.tableCells[i] === elem) return i;
            this.cmd("SetHighlight", this.tableCellIDs[i], 0);
            if (!this.tableCells[i]) return -1;
        }
        return -1;
    }

    getEmptyIndex(bucket) {
        this.cmd("SetText", this.sndMessageID, `Searching in bucket ${bucket}.`);
        for (const i of this.getBucketIndices(bucket)) {
            this.cmd("SetHighlight", this.tableCellIDs[i], 1);
            this.cmd("Step");
            this.cmd("SetHighlight", this.tableCellIDs[i], 0);
            if (!this.tableCells[i]) return i;
        }
        // Can only get this far if we didn't find any empty cell -- look at overflow bucket.
        this.cmd("SetText", this.sndMessageID, "Bucket is full - searching the overflow bucket.");
        for (const i of this.getBucketIndices(-1)) {
            this.cmd("SetHighlight", this.tableCellIDs[i], 1);
            this.cmd("Step");
            this.cmd("SetHighlight", this.tableCellIDs[i], 0);
            if (!this.tableCells[i]) return i;
        }
        return -1;
    }

    getBucket(hash) {
        const bucket = hash % this.numBuckets;

        const labelID = this.nextIndex++;
        const labelID2 = this.nextIndex++;
        const highlightID = this.nextIndex++;

        const lblText = `    ${hash} % ${this.tableSize}  =  `;
        this.cmd("CreateLabel", labelID, lblText, this.HASH_MOD_X, this.HASH_NUMBER_START_Y, 0);
        this.cmd("CreateLabel", labelID2, "", 0, 0);
        this.cmd("AlignRight", labelID2, labelID);
        this.cmd("Settext", labelID, lblText + bucket);
        this.cmd("Step");

        this.cmd("CreateHighlightCircle", highlightID, this.HIGHLIGHT_COLOR, 0, 0);
        this.cmd("SetWidth", highlightID, this.getCellHeight());
        this.cmd("AlignMiddle", highlightID, labelID2);
        this.cmd("Move", highlightID, this.getBucketLabelX(bucket), this.getBucketLabelY(bucket));
        this.cmd("Step");

        this.cmd("Delete", labelID);
        this.cmd("Delete", labelID2);
        this.cmd("Delete", highlightID);
        this.nextIndex -= 3;
        return bucket;
    }
};
