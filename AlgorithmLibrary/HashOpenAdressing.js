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


class HashOpenAdressing extends Hash {
    // This is a special key and should not be possible to enter in the GUI:
    static DELETED = "<deleted>";

    static PROBING_LINEAR = "linear";
    static PROBING_QUADRATIC = "quadratic";
    static PROBING_DOUBLE = "double";

    static DEFAULT_TABLE_SIZE = 23;
    static TABLE_SIZES = [13, 23, 41];
    static TABLE_SIZE_LABELS = ["Small (13)", "Medium (23)", "Large (41)"];

    static ARRAY_ELEM_START_Y = 100;

    constructor(am) {
        super(am);
        this.init(am);
    }

    addControls() {
        super.addControls();
        this.addBreakToAlgorithmBar();

        this.addLabelToAlgorithmBar("Table size:");
        this.sizeSelect = this.addSelectToAlgorithmBar(HashOpenAdressing.TABLE_SIZES, HashOpenAdressing.TABLE_SIZE_LABELS);
        this.sizeSelect.value = HashOpenAdressing.DEFAULT_TABLE_SIZE;
        this.sizeSelect.onchange = this.resetAll.bind(this);
        this.addBreakToAlgorithmBar();

        this.addLabelToAlgorithmBar("Probing:");
        this.probingSelect = this.addSelectToAlgorithmBar(
            [HashOpenAdressing.PROBING_LINEAR, HashOpenAdressing.PROBING_QUADRATIC, HashOpenAdressing.PROBING_DOUBLE],
            ["Linear: 1, 2, 3, ...", "Quadratic: 1, 4, 9, ...", "Double hashing: h', 2h', ..."]
        );
        this.probingSelect.value = HashOpenAdressing.PROBING_LINEAR;
        this.probingSelect.onchange = this.resetAll.bind(this);
    }

    resetAll() {
        this.tableSize = parseInt(this.sizeSelect.value) || HashOpenAdressing.DEFAULT_TABLE_SIZE;
        super.resetAll();

        this.tableCells = new Array(this.tableSize);
        for (var i = 0; i < this.tableSize; i++) {
            this.tableCells[i] = "";
        }

        this.initialIndex = this.nextIndex;
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    reset() {
        for (var i = 0; i < this.tableSize; i++) {
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
        var startX = this.getCellWidth();
        var x = startX;
        var y = HashOpenAdressing.ARRAY_ELEM_START_Y;
        for (var k = 0; k < i; k++) {
            x += this.getCellWidth();
            if (x + this.getCellWidth() > this.getCanvasWidth()) {
                x = startX;
                y += Math.round(2.2 * this.getCellHeight());
            }
        }
        return { x: x, y: y };
    }

    getCellWidth() {
        var nrows = 1;
        while (true) {
            var w = nrows * this.getCanvasWidth() / (this.tableSize + 2 * nrows);
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
        var firstLabel = this.nextIndex;

        var xPosOfNextLabel = Hash.FIRST_PRINT_POS_X;
        var yPosOfNextLabel = this.getCanvasHeight() * 0.9;

        for (var i = 0; i < this.tableCells.length; i++) {
            this.cmd("Move", this.highlightID, this.getCellPosX(i), this.getCellPosY(i));
            this.cmd("Step");
            var elem = this.tableCells[i];
            if (elem && elem !== HashOpenAdressing.DELETED) {
                var nextLabelID = this.nextIndex++;
                this.cmd("CreateLabel", nextLabelID, elem, this.getCellPosX(i), this.getCellPosY(i));
                this.cmd("SetForegroundColor", nextLabelID, "blue");
                this.cmd("Move", nextLabelID, xPosOfNextLabel, yPosOfNextLabel);
                this.cmd("Step");

                xPosOfNextLabel += Hash.PRINT_HORIZONTAL_GAP;
                if (xPosOfNextLabel > this.print_max) {
                    xPosOfNextLabel = Hash.FIRST_PRINT_POS_X;
                    yPosOfNextLabel += Hash.PRINT_VERTICAL_GAP;
                }
            }
        }

        this.cmd("Delete", this.highlightID);
        this.cmd("Step");
        for (var i = firstLabel; i < this.nextIndex; i++) {
            this.cmd("Delete", i);
        }
        this.nextIndex = this.highlightID; // Reuse objects. Not necessary.
        this.cmd("SetText", this.messageID, "");
        return this.commands;
    }

    clearTable() {
        this.commands = [];
        for (var i = 0; i < this.tableCells.length; i++) {
            this.tableCells[i] = "";
            this.cmd("SetText", this.tableCellIDs[i], "");
        }
        return this.commands;
    }

    insertElement(elem) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Inserting ${elem}`);

        var hash = this.getHashCode(elem);
        var startIndex = this.getStartIndex(hash);
        var index = this.getEmptyIndex(startIndex, elem);

        if (index < 0) {
            this.cmd("SetText", this.messageID, `Inserting ${elem}: Table is full!`);
        }
        else {
            var labID = this.nextIndex++;
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

        var hash = this.getHashCode(elem);
        var startIndex = this.getStartIndex(hash);
        var index = this.getElemIndex(startIndex, elem);

        if (index < 0) {
            this.cmd("SetText", this.messageID, `Deleting ${elem}: Element not found!`);
        }
        else {
            this.tableCells[index] = HashOpenAdressing.DELETED;
            this.cmd("SetText", this.tableCellIDs[index], HashOpenAdressing.DELETED);
            this.cmd("SetText", this.messageID, `Deleted ${elem}.`);
            this.cmd("Step");
            this.cmd("SetHighlight", this.tableCellIDs[index], 0);
        }
        return this.commands;
    }

    findElement(elem) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Finding ${elem}`);

        var hash = this.getHashCode(elem);
        var startIndex = this.getStartIndex(hash);
        var index = this.getElemIndex(startIndex, elem);

        if (index < 0) {
            this.cmd("SetText", this.messageID, `Finding ${elem}: Element not found!`);
        }
        else {
            this.cmd("SetText", this.messageID, `Found ${elem}.`);
            this.cmd("SetHighlight", this.tableCellIDs[index], 0);
        }
        return this.commands;
    }

    getElemIndex(index, elem) {
        var probing = this.probingSelect.value;
        var skipDelta = 1;
        if (probing == HashOpenAdressing.PROBING_DOUBLE) {
            skipDelta = this.getSkipDelta(elem, this.nextIndex++);
        }
        for (var i = 0; i < this.tableSize; i++) {
            var nextIndex = (index + this.getSkip(i, skipDelta)) % this.tableSize;
            this.cmd("SetHighlight", this.tableCellIDs[nextIndex], 1);
            this.cmd("Step");
            if (this.tableCells[nextIndex] == elem) {
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
        var probing = this.probingSelect.value;
        var skipDelta = 1;
        if (probing == HashOpenAdressing.PROBING_DOUBLE) {
            skipDelta = this.getSkipDelta(elem);
        }
        for (var i = 0; i < this.tableSize; i++) {
            var nextIndex = (index + this.getSkip(i, skipDelta)) % this.tableSize;
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
        var skipDelta = 7 - (this.currHash % 7);
        this.cmd("SetText", this.sndMessageID, `hash2(${elem}) = 7 - (${this.currHash} % 7) = ${skipDelta}`);
        return skipDelta;
    }

    getSkip(i, d) {
        var probing = this.probingSelect.value;
        if (!d) d = 1;
        if (probing == HashOpenAdressing.PROBING_QUADRATIC) {
            return i * i * d;
        }
        else {
            return i * d;
        }
    }
}

