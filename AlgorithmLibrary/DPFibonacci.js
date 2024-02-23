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
/* exported DPFibonacci */
///////////////////////////////////////////////////////////////////////////////


class DPFibonacci extends Algorithm {
    TABLE_ELEM_WIDTH = 40;
    TABLE_ELEM_HEIGHT = 30;

    TABLE_START_X = 500;
    TABLE_START_Y = 40;
    TABLE_DIFF_X = 100;

    CODE_START_X = 10;
    CODE_START_Y = 10;
    CODE_LINE_HEIGHT = 14;

    RECURSIVE_START_X = 20;
    RECURSIVE_START_Y = 120;
    RECURSIVE_DELTA_Y = 14;
    RECURSIVE_DELTA_X = 15;
    CODE_HIGHLIGHT_COLOR = "#FF0000";
    CODE_STANDARD_COLOR = "#000000";

    TABLE_INDEX_COLOR = "#0000FF";
    CODE_RECURSIVE_1_COLOR = "#339933";
    CODE_RECURSIVE_2_COLOR = "#0099FF";

    MAX_VALUE = 20;

    MESSAGE_ID = 0;

    constructor(am) {
        super();
        this.init(am);
    }

    init(am) {
        super.init(am);
        this.nextIndex = 0;
        this.addControls();
        this.code = [
            ["def ", "fib(n)", ":"],
            ["     if ", "(n <= 1) "],
            ["          return 1"],
            ["     else"],
            ["          return ", "fib(n-1)", " + ", "fib(n-2)"],
        ];

        this.codeID = new Array(this.code.length);

        for (let i = 0; i < this.code.length; i++) {
            this.codeID[i] = new Array(this.code[i].length);
            for (let j = 0; j < this.code[i].length; j++) {
                this.codeID[i][j] = this.nextIndex++;
                this.cmd("CreateLabel", this.codeID[i][j], this.code[i][j], this.CODE_START_X, this.CODE_START_Y + i * this.CODE_LINE_HEIGHT, 0);
                this.cmd("SetForegroundColor", this.codeID[i][j], this.CODE_STANDARD_COLOR);
                if (j > 0) {
                    this.cmd("AlignRight", this.codeID[i][j], this.codeID[i][j - 1]);
                }
            }
        }

        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
        this.initialIndex = this.nextIndex;
        this.oldIDs = [];
        this.commands = [];
    }

    addControls() {
        this.fibField = this.addControlToAlgorithmBar("Text", "", {maxlength: 2, size: 2});
        this.addReturnSubmit(this.fibField, "int", this.emptyCallback.bind(this));

        this.recursiveButton = this.addControlToAlgorithmBar("Button", "Fibonacci Recursive");
        this.recursiveButton.onclick = this.recursiveCallback.bind(this);

        this.tableButton = this.addControlToAlgorithmBar("Button", "Fibonacci Table");
        this.tableButton.onclick = this.tableCallback.bind(this);

        this.memoizedButton = this.addControlToAlgorithmBar("Button", "Fibonacci Memoized");
        this.memoizedButton.onclick = this.memoizedCallback.bind(this);
    }

    buildTable(maxVal) {
        this.tableID = new Array(maxVal + 1);
        this.tableVals = new Array(maxVal + 1);
        this.tableXPos = new Array(maxVal + 1);
        this.tableYPos = new Array(maxVal + 1);
        const tableRows = Math.floor((this.getCanvasHeight() - this.TABLE_ELEM_HEIGHT - this.TABLE_START_Y) / this.TABLE_ELEM_HEIGHT);

        for (let i = 0; i <= maxVal; i++) {
            this.tableID[i] = this.nextIndex++;
            this.tableVals[i] = -1;
            this.oldIDs.push(this.tableID[i]);

            const yPos = i % tableRows * this.TABLE_ELEM_HEIGHT + this.TABLE_START_Y;
            const xPos = Math.floor(i / tableRows) * this.TABLE_DIFF_X + this.TABLE_START_X;

            this.tableXPos[i] = xPos;
            this.tableYPos[i] = yPos;

            this.cmd("CreateRectangle", this.tableID[i],
                "",
                this.TABLE_ELEM_WIDTH,
                this.TABLE_ELEM_HEIGHT,
                xPos,
                yPos);
            const indexID = this.nextIndex++;
            this.oldIDs.push(indexID);
            this.cmd("CreateLabel", indexID, i, xPos - this.TABLE_ELEM_WIDTH, yPos);
            this.cmd("SetForegroundColor", indexID, this.TABLE_INDEX_COLOR);
        }
    }

    clearOldIDs() {
        for (let i = 0; i < this.oldIDs.length; i++) {
            this.cmd("Delete", this.oldIDs[i]);
        }
        this.oldIDs = [];
        this.nextIndex = this.initialIndex;
    }

    reset() {
        this.oldIDs = [];
        this.nextIndex = this.initialIndex;
    }

    emptyCallback(event) {
        this.implementAction(this.helpMessage.bind(this), "");
        // TODO:  Put up a message to push the appropriate button?
    }

    recursiveCallback(event) {
        let fibValue = this.normalizeNumber(this.fibField.value);
        if (fibValue !== "") {
            fibValue = Math.min(fibValue, this.MAX_VALUE);
            this.fibField.value = fibValue;
            this.implementAction(this.recursiveFib.bind(this), fibValue);
        }
    }

    tableCallback(event) {
        let fibValue = this.normalizeNumber(this.fibField.value);
        if (fibValue !== "") {
            fibValue = Math.min(fibValue, this.MAX_VALUE);
            this.fibField.value = fibValue;
            this.implementAction(this.tableFib.bind(this), fibValue);
        }
    }

    memoizedCallback(event) {
        let fibValue = this.normalizeNumber(this.fibField.value);
        if (fibValue !== "") {
            fibValue = Math.min(fibValue, this.MAX_VALUE);
            this.fibField.value = fibValue;
            this.implementAction(this.memoizedFib.bind(this), fibValue);
        }
    }

    helpMessage(value) {
        this.commands = [];
        this.clearOldIDs();
        const messageID = this.nextIndex++;
        this.oldIDs.push(messageID);
        this.cmd("CreateLabel", messageID,
            `Enter a value betweeen 0 and ${String(this.MAX_VALUE)} in the text field.\n` +
            "Then press the Fibonacci Recursive, Fibonacci Table, or Fibonacci Memoized button",
            this.RECURSIVE_START_X, this.RECURSIVE_START_Y, 0);
        return this.commands;
    }

    recursiveFib(value) {
        this.commands = [];

        this.clearOldIDs();

        this.currentY = this.RECURSIVE_START_Y;

        const functionCallID = this.nextIndex++;
        this.oldIDs.push(functionCallID);
        const final = this.fib(value, this.RECURSIVE_START_X, functionCallID);
        this.cmd("SetText", functionCallID, `fib(${String(value)}) = ${String(final)}`);
        return this.commands;
    }

    fib(value, xPos, ID) {
        this.cmd("CreateLabel", ID, `fib(${String(value)})`, xPos, this.currentY, 0);
        this.currentY += this.RECURSIVE_DELTA_Y;
        this.cmd("SetForegroundColor", this.codeID[0][1], this.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[0][1], this.CODE_STANDARD_COLOR);
        this.cmd("SetForegroundColor", this.codeID[1][1], this.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[1][1], this.CODE_STANDARD_COLOR);
        if (value > 1) {
            const firstID = this.nextIndex++;
            const secondID = this.nextIndex++;
            this.cmd("SetForegroundColor", this.codeID[4][1], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[4][1], this.CODE_STANDARD_COLOR);
            const firstValue = this.fib(value - 1, xPos + this.RECURSIVE_DELTA_X, firstID);
            this.currentY += this.RECURSIVE_DELTA_Y;
            this.cmd("SetForegroundColor", this.codeID[4][3], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[4][3], this.CODE_STANDARD_COLOR);
            const secondValue = this.fib(value - 2, xPos + this.RECURSIVE_DELTA_X, secondID);

            this.cmd("SetForegroundColor", this.codeID[4][1], this.CODE_RECURSIVE_1_COLOR);
            this.cmd("SetForegroundColor", firstID, this.CODE_RECURSIVE_1_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][2], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][3], this.CODE_RECURSIVE_2_COLOR);
            this.cmd("SetForegroundColor", secondID, this.CODE_RECURSIVE_2_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[4][1], this.CODE_STANDARD_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][2], this.CODE_STANDARD_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][3], this.CODE_STANDARD_COLOR);

            this.cmd("Delete", firstID);
            this.cmd("Delete", secondID);
            this.cmd("SetText", ID, firstValue + secondValue);
            this.cmd("Step");
            this.currentY = this.currentY - 2 * this.RECURSIVE_DELTA_Y;
            return firstValue + secondValue;
        } else {
            this.cmd("SetText", ID, "1");
            this.cmd("SetForegroundColor", this.codeID[2][0], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[2][0], this.CODE_STANDARD_COLOR);

            this.currentY -= this.RECURSIVE_DELTA_Y;
            return 1;
        }
    }

    tableFib(value) {
        this.commands = [];
        this.clearOldIDs();
        this.buildTable(value);

        for (let i = 0; i <= value && i <= 1; i++) {
            this.cmd("SetForegroundColor", this.codeID[1][1], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("SetForegroundColor", this.codeID[2][0], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("SetHighlight", this.tableID[i], 1);
            this.cmd("SetText", this.tableID[i], 1);
            this.tableVals[i] = 1;
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[1][1], this.CODE_STANDARD_COLOR);
            this.cmd("SetForegroundColor", this.codeID[2][0], this.CODE_STANDARD_COLOR);
            this.cmd("SetHighlight", this.tableID[i], 0);
        }
        for (let i = 2; i <= value; i++) {
            this.cmd("SetHighlight", this.tableID[i - 1], 1);
            this.cmd("SetHighlight", this.tableID[i - 2], 1);
            this.cmd("SetForegroundColor", this.codeID[4][1], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][2], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][3], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.tableVals[i] = this.tableVals[i - 1] + this.tableVals[i - 2];
            this.cmd("SetText", this.tableID[i], this.tableVals[i]);
            this.cmd("SetTextColor", this.tableID[i], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[4][1], this.CODE_STANDARD_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][2], this.CODE_STANDARD_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][3], this.CODE_STANDARD_COLOR);
            this.cmd("SetTextColor", this.tableID[i], this.CODE_STANDARD_COLOR);
            this.cmd("SetHighlight", this.tableID[i - 1], 0);
            this.cmd("SetHighlight", this.tableID[i - 2], 0);
        }

        const finalID = this.nextIndex++;
        this.oldIDs.push(finalID);
        this.cmd("CreateLabel", finalID, this.tableVals[value], this.tableXPos[value] - 5, this.tableYPos[value] - 5, 0);
        this.cmd("Move", finalID, this.RECURSIVE_START_X, this.RECURSIVE_START_Y);
        this.cmd("Step");
        this.cmd("SetText", finalID, `fib(${String(value)}) = ${String(this.tableVals[value])}`);

        return this.commands;
    }

    fibMem(value, xPos, ID) {
        this.cmd("CreateLabel", ID, `fib(${String(value)})`, xPos, this.currentY, 0);
        this.cmd("SetHighlight", this.tableID[value], 1);
        // TODO: Add an extra pause here?
        this.cmd("Step");
        if (this.tableVals[value] >= 0) {
            this.cmd("Delete", ID, `fib(${String(value)})`, xPos, this.currentY, 0);
            this.cmd("CreateLabel", ID, this.tableVals[value], this.tableXPos[value] - 5, this.tableYPos[value] - 5, 0);
            this.cmd("Move", ID, xPos, this.currentY);
            this.cmd("Step");
            this.cmd("SetHighlight", this.tableID[value], 0);
            return this.tableVals[value];
        }
        this.cmd("SetHighlight", this.tableID[value], 0);
        this.currentY += this.RECURSIVE_DELTA_Y;
        this.cmd("SetForegroundColor", this.codeID[0][1], this.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[0][1], this.CODE_STANDARD_COLOR);
        this.cmd("SetForegroundColor", this.codeID[1][1], this.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[1][1], this.CODE_STANDARD_COLOR);
        if (value > 1) {
            const firstID = this.nextIndex++;
            const secondID = this.nextIndex++;
            this.cmd("SetForegroundColor", this.codeID[4][1], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[4][1], this.CODE_STANDARD_COLOR);
            const firstValue = this.fibMem(value - 1, xPos + this.RECURSIVE_DELTA_X, firstID);
            this.currentY += this.RECURSIVE_DELTA_Y;
            this.cmd("SetForegroundColor", this.codeID[4][3], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[4][3], this.CODE_STANDARD_COLOR);
            const secondValue = this.fibMem(value - 2, xPos + this.RECURSIVE_DELTA_X, secondID);

            this.cmd("SetForegroundColor", this.codeID[4][1], this.CODE_RECURSIVE_1_COLOR);
            this.cmd("SetForegroundColor", firstID, this.CODE_RECURSIVE_1_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][2], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][3], this.CODE_RECURSIVE_2_COLOR);
            this.cmd("SetForegroundColor", secondID, this.CODE_RECURSIVE_2_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[4][1], this.CODE_STANDARD_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][2], this.CODE_STANDARD_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][3], this.CODE_STANDARD_COLOR);

            this.cmd("Delete", firstID);
            this.cmd("Delete", secondID);
            this.cmd("SetText", ID, firstValue + secondValue);
            this.cmd("Step");
            this.tableVals[value] = firstValue + secondValue;
            this.currentY = this.currentY - 2 * this.RECURSIVE_DELTA_Y;
            this.cmd("CreateLabel", this.nextIndex, this.tableVals[value], xPos + 5, this.currentY + 5);
            this.cmd("Move", this.nextIndex, this.tableXPos[value], this.tableYPos[value], this.currentY);
            this.cmd("Step");
            this.cmd("Delete", this.nextIndex);
            this.cmd("SetText", this.tableID[value], this.tableVals[value]);
            return firstValue + secondValue;
        } else {
            this.cmd("SetText", ID, "1");
            this.cmd("SetForegroundColor", this.codeID[2][0], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[2][0], this.CODE_STANDARD_COLOR);
            this.tableVals[value] = 1;
            this.cmd("CreateLabel", this.nextIndex, this.tableVals[value], xPos + 5, this.currentY + 5);
            this.cmd("Move", this.nextIndex, this.tableXPos[value], this.tableYPos[value], this.currentY);
            this.cmd("Step");
            this.cmd("Delete", this.nextIndex);
            this.cmd("SetText", this.tableID[value], this.tableVals[value]);

            this.currentY -= this.RECURSIVE_DELTA_Y;
            return 1;
        }
    }

    memoizedFib(value) {
        this.commands = [];

        this.clearOldIDs();
        this.buildTable(value);

        this.currentY = this.RECURSIVE_START_Y;

        const functionCallID = this.nextIndex++;
        this.oldIDs.push(functionCallID);
        const final = this.fibMem(value, this.RECURSIVE_START_X, functionCallID);

        this.cmd("SetText", functionCallID, `fib(${String(value)}) = ${String(final)}`);
        return this.commands;
    }
}
