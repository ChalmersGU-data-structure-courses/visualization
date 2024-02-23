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
/* globals Hash */
/* exported HashOpenAdressing */
///////////////////////////////////////////////////////////////////////////////


class HashOpenAdressing extends Hash {
    // This is a special key and should not be possible to enter in the GUI:
    DELETED = "<deleted>";

    PROBING_LINEAR = "linear";
    PROBING_QUADRATIC = "quadratic";
    PROBING_DOUBLE = "double";

    DEFAULT_TABLE_SIZE = 23;
    TABLE_SIZES = [13, 23, 41];
    TABLE_SIZE_LABELS = ["Small (13)", "Medium (23)", "Large (41)"];

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
        this.addBreakToAlgorithmBar();

        this.addLabelToAlgorithmBar("Probing:");
        this.probingSelect = this.addSelectToAlgorithmBar(
            [this.PROBING_LINEAR, this.PROBING_QUADRATIC, this.PROBING_DOUBLE],
            ["Linear: 1, 2, 3, ...", "Quadratic: 1, 4, 9, ...", "Double hashing: h', 2h', ..."],
        );
        this.probingSelect.value = this.PROBING_LINEAR;
        this.probingSelect.onchange = this.resetAll.bind(this);
    }

    resetAll() {
        this.tableSize = parseInt(this.sizeSelect.value) || this.DEFAULT_TABLE_SIZE;
        super.resetAll();

        this.tableCells = new Array(this.tableSize);
        for (let i = 0; i < this.tableSize; i++) {
            this.tableCells[i] = "";
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
                y += Math.round(2.2 * this.getCellHeight());
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
        const startIndex = this.getStartIndex(hash);
        const index = this.getEmptyIndex(startIndex, elem);

        if (index < 0) {
            this.cmd("SetText", this.messageID, `Inserting ${elem}: Table is full!`);
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
            this.cmd("Step");
            this.cmd("SetHighlight", this.tableCellIDs[index], 0);
        }
        return this.commands;
    }

    deleteElement(elem) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Deleting: ${elem}`);

        const hash = this.getHashCode(elem);
        const startIndex = this.getStartIndex(hash);
        const index = this.getElemIndex(startIndex, elem);

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
        const startIndex = this.getStartIndex(hash);
        const index = this.getElemIndex(startIndex, elem);

        if (index < 0) {
            this.cmd("SetText", this.messageID, `Finding ${elem}: Element not found!`);
        } else {
            this.cmd("SetText", this.messageID, `Found ${elem}.`);
            this.cmd("SetHighlight", this.tableCellIDs[index], 0);
        }
        return this.commands;
    }

    getElemIndex(index, elem) {
        const probing = this.probingSelect.value;
        let skipDelta = 1;
        if (probing === this.PROBING_DOUBLE) {
            skipDelta = this.getSkipDelta(elem, this.nextIndex++);
        }
        for (let i = 0; i < this.tableSize; i++) {
            const nextIndex = (index + this.getSkip(i, skipDelta)) % this.tableSize;
            this.cmd("SetHighlight", this.tableCellIDs[nextIndex], 1);
            this.cmd("Step");
            if (this.tableCells[nextIndex] === elem) {
                this.cmd("SetText", this.sndMessageID, "");
                return nextIndex;
            }
            this.cmd("SetHighlight", this.tableCellIDs[nextIndex], 0);
            if (!this.tableCells[nextIndex]) {
                break;
            }
        }
        this.cmd("SetText", this.sndMessageID, "");
        return -1;
    }

    getEmptyIndex(index, elem) {
        const probing = this.probingSelect.value;
        let skipDelta = 1;
        if (probing === this.PROBING_DOUBLE) {
            skipDelta = this.getSkipDelta(elem);
        }
        for (let i = 0; i < this.tableSize; i++) {
            const nextIndex = (index + this.getSkip(i, skipDelta)) % this.tableSize;
            this.cmd("SetHighlight", this.tableCellIDs[nextIndex], 1);
            this.cmd("Step");
            if (!this.tableCells[nextIndex]) {
                this.cmd("SetText", this.sndMessageID, "");
                return nextIndex;
            }
            this.cmd("SetHighlight", this.tableCellIDs[nextIndex], 0);
        }
        this.cmd("SetText", this.sndMessageID, "");
        return -1;
    }

    getSkipDelta(elem) {
        const skipDelta = 7 - (this.currHash % 7);
        this.cmd("SetText", this.sndMessageID, `hash2(${elem}) = 7 - (${this.currHash} % 7) = ${skipDelta}`);
        return skipDelta;
    }

    getSkip(i, d) {
        const probing = this.probingSelect.value;
        if (!d) d = 1;
        if (probing === this.PROBING_QUADRATIC) {
            return i * i * d;
        } else {
            return i * d;
        }
    }
}
