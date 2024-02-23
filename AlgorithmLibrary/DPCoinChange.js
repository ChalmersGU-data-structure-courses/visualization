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
/* exported DPCoinChange */
///////////////////////////////////////////////////////////////////////////////


class DPCoinChange extends Algorithm {
    TABLE_ELEM_WIDTH = 30;
    TABLE_ELEM_HEIGHT = 30;

    TABLE_START_X = 500;
    TABLE_START_Y = 50;
    TABLE_DIFF_X = 70;

    CODE_START_X = 10;
    CODE_START_Y = 10;
    CODE_LINE_HEIGHT = 14;

    GREEDY_START_X = 100;
    GREEDY_START_Y = 150;
    RECURSIVE_START_X = 220;
    RECURSIVE_START_Y = 10;
    RECURSIVE_DELTA_Y = 14;
    RECURSIVE_DELTA_X = 8;
    CODE_HIGHLIGHT_COLOR = "#FF0000";
    CODE_STANDARD_COLOR = "#000000";

    TABLE_INDEX_COLOR = "#0000FF";
    CODE_RECURSIVE_1_COLOR = "#339933";
    CODE_RECURSIVE_2_COLOR = "#0099FF";

    DPCode = [
        ["def ", "change(n, coinArray)", ":"],
        ["     if ", "(n === 0) "],
        ["          return 0"],
        ["     best = -1"],
        ["     for coin in coinArray:"],
        ["         if ", "(coin <= n)", ":"],
        ["             nextTry = ", "change(n - coin, coinArray)"],
        ["         if (", "best < 0", " or ", "best > nextTry + 1", ")"],
        ["             best = nextTry + 1"],
        ["     return best"],
    ];

    GREEDYCode = [
        ["def ", "changeGreedy(n, coinArray)", ":"],
        ["    coinsRequired = 0"],
        ["    for coin in reversed(coinArray): "],
        ["       while ", "(n <= coin)"],
        ["          n = n - coin"],
        ["          coinsRequired = coinsRequired + 1"],
        ["    return coinsRequired"],
    ];

    COINS = [[1, 5, 10, 25],
        [1, 4, 6, 10]];

    MAX_VALUE = 30;

    MESSAGE_ID = 0;

    constructor(am) {
        super();
        this.init(am);
    }

    setCode(codeArray) {
        this.code = codeArray;
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
    }

    deleteCode() {
        for (let i = 0; i < this.codeID.length; i++) {
            for (let j = 0; j < this.codeID[i].length; j++) {
                this.cmd("Delete", this.codeID[i][j]);
            }
        }
        this.codeID = [];
    }

    setCodeAlpha(codeArray, alpha) {
        for (let i = 0; i < codeArray.length; i++) {
            for (let j = 0; j < codeArray[i].length; j++) {
                this.cmd("SetAlpha", codeArray[i][j], alpha);
            }
        }
    }

    init(am) {
        super.init(am);
        this.nextIndex = 0;
        this.addControls();
        // HACK!!
        this.setCode(this.GREEDYCode);
        this.greedyCodeID = this.codeID;
        this.setCodeAlpha(this.greedyCodeID, 0);
        ///
        this.setCode(this.DPCode);
        this.usingDPCode = true;

        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
        this.initialIndex = this.nextIndex;
        this.oldIDs = [];
        this.commands = [];
    }

    addControls() {
        this.changeField = this.addControlToAlgorithmBar("Text", "", {maxlength: 2, size: 2});
        this.addReturnSubmit(this.changeField, "int", this.emptyCallback.bind(this));

        this.recursiveButton = this.addControlToAlgorithmBar("Button", "Change Recursive");
        this.recursiveButton.onclick = this.recursiveCallback.bind(this);

        this.tableButton = this.addControlToAlgorithmBar("Button", "Change Table");
        this.tableButton.onclick = this.tableCallback.bind(this);

        this.memoizedButton = this.addControlToAlgorithmBar("Button", "Change Memoized");
        this.memoizedButton.onclick = this.memoizedCallback.bind(this);

        this.greedyButton = this.addControlToAlgorithmBar("Button", "Change Greedy");
        this.greedyButton.onclick = this.greedyCallback.bind(this);

        const coinLabels = [];
        for (let i = 0; i < this.COINS.length; i++) {
            let nextLabel = `Coins: [${this.COINS[i][0]}`;
            for (let j = 1; j < this.COINS[i].length; j++) {
                nextLabel = `${nextLabel}, ${this.COINS[i][j]}`;
            }
            nextLabel = `${nextLabel}]`;
            coinLabels.push(nextLabel);
        }
        this.coinTypeButtons = this.addRadioButtonGroupToAlgorithmBar(coinLabels, "CoinType");
        for (let i = 0; i < this.coinTypeButtons.length; i++) {
            this.coinTypeButtons[i].onclick = this.coinTypeChangedCallback.bind(this, i);
        }
        this.coinTypeButtons[0].checked = true;
        this.coinIndex = 0;
    }

    coinTypeChangedCallback(coinIndex) {
        this.implementAction(this.coinTypeChanged.bind(this), coinIndex);
    }

    coinTypeChanged(coinIndex) {
        this.commands = [];
        this.coinIndex = coinIndex;
        this.coinTypeButtons[coinIndex].checked = true;
        this.clearOldIDs();

        return this.commands;
    }

    greedyCallback(value) {
        let changeValue = this.normalizeNumber(this.changeField.value);
        if (changeValue !== "") {
            changeValue = Math.min(changeValue, this.MAX_VALUE);
            this.changeField.value = changeValue;
            this.implementAction(this.implementGreedy.bind(this), changeValue);
        }
    }

    implementGreedy(value) {
        this.commands = [];
        this.clearOldIDs();
        const initialValue = value;
        if (this.usingDPCode) {
            this.setCodeAlpha(this.greedyCodeID, 1);
            this.setCodeAlpha(this.codeID, 0);
            this.usingDPCode = false;
        }

        let currX = this.GREEDY_START_X;
        const currY = this.GREEDY_START_Y + 2.5 * this.TABLE_ELEM_HEIGHT;

        const messageID = this.nextIndex++;
        this.oldIDs.push(messageID);

        const valueRemainingID = this.nextIndex++;
        this.oldIDs.push(valueRemainingID);

        this.cmd("CreateRectangle", valueRemainingID, value, this.TABLE_ELEM_WIDTH,
            this.TABLE_ELEM_HEIGHT,
            this.GREEDY_START_X, this.GREEDY_START_Y);

        let tempLabel = this.nextIndex++;
        this.oldIDs.push(tempLabel);
        this.cmd("CreateLabel", tempLabel, "Amount remaining:", 0, 0);
        this.cmd("AlignLeft", tempLabel, valueRemainingID);

        const requiredCoinsID = this.nextIndex++;
        this.oldIDs.push(requiredCoinsID);

        this.cmd("CreateRectangle", requiredCoinsID, value, this.TABLE_ELEM_WIDTH,
            this.TABLE_ELEM_HEIGHT,
            this.GREEDY_START_X, this.GREEDY_START_Y + this.TABLE_ELEM_HEIGHT);

        tempLabel = this.nextIndex++;
        this.oldIDs.push(tempLabel);
        this.cmd("CreateLabel", tempLabel, "Required Coins:", 0, 0);
        this.cmd("AlignLeft", tempLabel, requiredCoinsID);

        let requiredCoins = 0;

        for (let i = this.COINS[this.coinIndex].length - 1; i >= 0; i--) {
            while (value >= this.COINS[this.coinIndex][i]) {
                requiredCoins = requiredCoins + 1;
                value = value - this.COINS[this.coinIndex][i];
                this.cmd("SetText", valueRemainingID, value);
                this.cmd("SetText", requiredCoinsID, requiredCoins);
                const moveIndex = this.nextIndex++;
                this.oldIDs.push(moveIndex);
                this.cmd("CreateLabel", moveIndex, this.COINS[this.coinIndex][i], this.GREEDY_START_X, this.GREEDY_START_Y);
                this.cmd("Move", moveIndex, currX, currY);
                currX += this.TABLE_ELEM_WIDTH;
                this.cmd("Step");
            }
        }

        this.cmd("CreateLabel", messageID,
            `changeGreedy(${String(initialValue)}, [${String(this.COINS[this.coinIndex])}])    = ${String(requiredCoins)}`,
            this.RECURSIVE_START_X, this.RECURSIVE_START_Y, 0);

        return this.commands;
    }

    buildTable(maxVal) {
        this.tableID = new Array(2);
        this.tableVals = new Array(2);
        this.tableXPos = new Array(2);
        this.tableYPos = new Array(2);

        for (let i = 0; i < 2; i++) {
            this.tableID[i] = new Array(maxVal + 1);
            this.tableVals[i] = new Array(maxVal + 1);
            this.tableXPos[i] = new Array(maxVal + 1);
            this.tableYPos[i] = new Array(maxVal + 1);
        }

        const tableRows = Math.floor((this.getCanvasHeight() - this.TABLE_ELEM_HEIGHT - this.TABLE_START_Y) / this.TABLE_ELEM_HEIGHT);
        const tableCols = Math.ceil((maxVal + 1) / tableRows);

        const header1ID = this.nextIndex++;
        this.oldIDs.push(header1ID);

        this.cmd("CreateLabel", header1ID, "# of Coins Required", this.TABLE_START_X, this.TABLE_START_Y - 30);

        const header2ID = this.nextIndex++;
        this.oldIDs.push(header2ID);

        this.cmd("CreateLabel", header2ID, "Coins to Use", this.TABLE_START_X + tableCols * this.TABLE_DIFF_X + 1.5 * this.TABLE_DIFF_X, this.TABLE_START_Y - 30);

        for (let i = 0; i <= maxVal; i++) {
            const yPos = i % tableRows * this.TABLE_ELEM_HEIGHT + this.TABLE_START_Y;
            let xPos = Math.floor(i / tableRows) * this.TABLE_DIFF_X + this.TABLE_START_X;

            for (let j = 0; j < 2; j++) {
                this.tableID[j][i] = this.nextIndex++;
                this.tableVals[j][i] = -1;
                this.oldIDs.push(this.tableID[j][i]);

                this.tableXPos[j][i] = xPos;
                this.tableYPos[j][i] = yPos;

                this.cmd("CreateRectangle", this.tableID[j][i],
                    "",
                    this.TABLE_ELEM_WIDTH,
                    this.TABLE_ELEM_HEIGHT,
                    xPos,
                    yPos);
                const indexID = this.nextIndex++;
                this.oldIDs.push(indexID);
                this.cmd("CreateLabel", indexID, i, xPos - this.TABLE_ELEM_WIDTH, yPos);
                this.cmd("SetForegroundColor", indexID, this.TABLE_INDEX_COLOR);

                xPos = xPos + tableCols * this.TABLE_DIFF_X + 1.5 * this.TABLE_DIFF_X;
            }
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
        this.coinIndex = 0;
        this.usingDPCode = true;
        this.coinTypeButtons[0].checked = true;
        this.nextIndex = this.initialIndex;
    }

    emptyCallback(event) {
        this.implementAction(this.helpMessage.bind(this), "");
        // TODO:  Put up a message to push the appropriate button?
    }

    displayCoinsUsed() {
        let currValue = this.tableVals[1].length - 1;
        let currX = 30;
        const currY = 200;

        let moveID = this.nextIndex++;

        while (currValue > 0) {
            moveID = this.nextIndex++;
            this.oldIDs.push(moveID);
            this.cmd("CreateLabel", moveID, this.tableVals[1][currValue], this.tableXPos[1][currValue], this.tableYPos[1][currValue]);
            this.cmd("Move", moveID, currX, currY);
            this.cmd("Step");
            currX += 20;
            currValue = currValue - this.tableVals[1][currValue];
        }
    }

    recursiveCallback(event) {
        let changeValue = this.normalizeNumber(this.changeField.value);
        if (changeValue !== "") {
            changeValue = Math.min(changeValue, this.MAX_VALUE - 5);
            this.changeField.value = changeValue;
            this.implementAction(this.recursiveChange.bind(this), changeValue);
        }
    }

    tableCallback(event) {
        let changeValue = this.normalizeNumber(this.changeField.value);
        if (changeValue !== "") {
            changeValue = Math.min(changeValue, this.MAX_VALUE);
            this.changeField.value = changeValue;
            this.implementAction(this.tableChange.bind(this), changeValue);
        }
    }

    memoizedCallback(event) {
        let changeValue = this.normalizeNumber(this.changeField.value);
        if (changeValue !== "") {
            changeValue = Math.min(changeValue, this.MAX_VALUE - 5);
            this.changeField.value = changeValue;
            this.implementAction(this.memoizedChange.bind(this), changeValue);
        }
    }

    helpMessage(value) {
        this.commands = [];
        this.clearOldIDs();
        const messageID = this.nextIndex++;
        this.oldIDs.push(messageID);
        this.cmd("CreateLabel", messageID,
            `Enter a value between 0 and ${String(this.MAX_VALUE)} in the text field.\n` +
            "Then press the Change Recursive, Change Table, Change Memoized, or Change Greedy button",
            this.RECURSIVE_START_X, this.RECURSIVE_START_Y, 0);
        return this.commands;
    }

    recursiveChange(value) {
        this.commands = [];

        this.clearOldIDs();
        if (!this.usingDPCode) {
            this.setCodeAlpha(this.greedyCodeID, 0);
            this.setCodeAlpha(this.codeID, 1);
            this.usingDPCode = true;
        }

        this.currentY = this.RECURSIVE_START_Y;

        const functionCallID = this.nextIndex++;
        this.oldIDs.push(functionCallID);
        const final = this.change(value, this.RECURSIVE_START_X, functionCallID);
        this.cmd("SetText", functionCallID, `change(${String(value)}, [${String(this.COINS[this.coinIndex])}])    = ${String(final[0])}`);

        return this.commands;
    }

    change(value, xPos, ID) {
        const coins = this.COINS[this.coinIndex];
        this.cmd("CreateLabel", ID, `change(${String(value)}, [${String(coins)}])`, xPos, this.currentY, 0);
        this.currentY += this.RECURSIVE_DELTA_Y;
        this.cmd("SetForegroundColor", this.codeID[0][1], this.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[0][1], this.CODE_STANDARD_COLOR);
        this.cmd("SetForegroundColor", this.codeID[1][1], this.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[1][1], this.CODE_STANDARD_COLOR);
        if (value > 0) {
            this.cmd("SetForegroundColor", this.codeID[3][0], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[3][0], this.CODE_STANDARD_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][0], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[4][0], this.CODE_STANDARD_COLOR);

            let best = -1;
            const nextID = this.nextIndex++;
            const nextID2 = this.nextIndex++;
            let recID = nextID;
            let bestList = [];
            for (let i = 0; i < coins.length; i++) {
                this.cmd("SetForegroundColor", this.codeID[5][1], this.CODE_HIGHLIGHT_COLOR);
                this.cmd("Step");
                this.cmd("SetForegroundColor", this.codeID[5][1], this.CODE_STANDARD_COLOR);
                if (value >= coins[i]) {
                    this.cmd("SetForegroundColor", this.codeID[6][1], this.CODE_HIGHLIGHT_COLOR);
                    this.cmd("Step");
                    this.cmd("SetForegroundColor", this.codeID[6][1], this.CODE_STANDARD_COLOR);
                    const nextTry = this.change(value - coins[i], xPos + this.RECURSIVE_DELTA_X, recID);
                    // TODO:  SOMEHTING ELSE HERE
                    if (best === -1) {
                        this.cmd("SetForegroundColor", this.codeID[7][1], this.CODE_HIGHLIGHT_COLOR);
                        this.cmd("Step");
                        this.cmd("SetForegroundColor", this.codeID[7][1], this.CODE_STANDARD_COLOR);
                        best = nextTry[0] + 1;
                        bestList = nextTry[1];
                        bestList.push(coins[i]);
                        this.currentY += this.RECURSIVE_DELTA_Y;
                        recID = nextID2;
                    } else if (best > nextTry[0] + 1) {
                        this.cmd("SetForegroundColor", this.codeID[7][2], this.CODE_HIGHLIGHT_COLOR);
                        this.cmd("Step");
                        this.cmd("SetForegroundColor", this.codeID[7][2], this.CODE_STANDARD_COLOR);
                        best = nextTry[0] + 1;
                        bestList = nextTry[1];
                        bestList.push(coins[i]);
                        this.cmd("Delete", recID);
                        this.cmd("SetText", nextID, `${String(best)}       ([${String(bestList)}])`);
                        this.cmd("SetPosition", nextID, xPos + this.RECURSIVE_DELTA_X, this.currentY);
                        this.cmd("Move", nextID, xPos + this.RECURSIVE_DELTA_X, this.currentY - this.RECURSIVE_DELTA_Y);
                        this.cmd("Step");
                    } else {
                        this.cmd("Delete", recID);
                    }
                } else {
                    break;
                }
            }
            this.cmd("Delete", nextID);
            this.cmd("SetText", ID, `${String(best)}       ([${String(bestList)}])`);
            this.cmd("SetPosition", ID, xPos + this.RECURSIVE_DELTA_X, this.currentY);
            this.cmd("Move", ID, xPos, this.currentY - 2 * this.RECURSIVE_DELTA_Y);

            this.currentY = this.currentY - 2 * this.RECURSIVE_DELTA_Y;

            this.cmd("SetForegroundColor", this.codeID[9][0], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[9][0], this.CODE_STANDARD_COLOR);
            this.cmd("Step");
            return [best, bestList];
        } else {
            this.cmd("SetText", ID, "0");
            this.cmd("SetForegroundColor", this.codeID[2][0], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[2][0], this.CODE_STANDARD_COLOR);

            this.currentY -= this.RECURSIVE_DELTA_Y;
            return [0, []];
        }
    }

    tableChange(value) {
        this.commands = [];
        this.clearOldIDs();
        if (!this.usingDPCode) {
            this.setCodeAlpha(this.greedyCodeID, 0);
            this.setCodeAlpha(this.codeID, 1);
            this.usingDPCode = true;
        }

        this.buildTable(value);
        const coins = this.COINS[this.coinIndex];
        for (let i = 0; i <= value && i <= 0; i++) {
            this.cmd("SetForegroundColor", this.codeID[1][1], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("SetForegroundColor", this.codeID[2][0], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("SetHighlight", this.tableID[0][i], 1);
            this.cmd("SetText", this.tableID[0][i], 0);
            this.tableVals[0][i] = 0;
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[1][1], this.CODE_STANDARD_COLOR);
            this.cmd("SetForegroundColor", this.codeID[2][0], this.CODE_STANDARD_COLOR);
            this.cmd("SetHighlight", this.tableID[0][i], 0);
        }
        for (let i = 1; i <= value; i++) {
            this.tableVals[0][i] = -1;
            for (let j = 0; j < coins.length; j++) {
                if (coins[j] <= i) {
                    this.cmd("SetHighlight", this.tableID[0][i - coins[j]], 1);
                    this.cmd("SetHighlight", this.tableID[0][i], 1);
                    this.cmd("Step");
                    if (this.tableVals[0][i] === -1 || this.tableVals[0][i] > this.tableVals[0][i - coins[j]] + 1) {
                        this.tableVals[0][i] = this.tableVals[0][i - coins[j]] + 1;
                        this.cmd("SetText", this.tableID[0][i], this.tableVals[0][i]);
                        this.cmd("SetHighlight", this.tableID[1][i], 1);
                        this.cmd("SetText", this.tableID[1][i], coins[j]);
                        this.tableVals[1][i] = coins[j];
                        this.cmd("Step");
                        this.cmd("SetHighlight", this.tableID[1][i], 0);
                    }
                    this.cmd("SetHighlight", this.tableID[0][i - coins[j]], 0);
                    this.cmd("SetHighlight", this.tableID[0][i], 0);
                }
            }
        }

        const finalID = this.nextIndex++;
        this.oldIDs.push(finalID);
        this.cmd("CreateLabel", finalID, this.tableVals[0][value], this.tableXPos[0][value] - 5, this.tableYPos[0][value] - 5, 0);
        this.cmd("Move", finalID, this.RECURSIVE_START_X, this.RECURSIVE_START_Y);
        this.cmd("Step");
        this.cmd("SetText", finalID, `change(${String(value)}) = ${String(this.tableVals[0][value])}`);

        this.displayCoinsUsed();

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

    memoizedChange(value) {
        this.commands = [];

        if (!this.usingDPCode) {
            this.setCodeAlpha(this.greedyCodeID, 0);
            this.setCodeAlpha(this.codeID, 1);
            this.usingDPCode = true;
        }

        this.clearOldIDs();
        this.buildTable(value);

        this.currentY = this.RECURSIVE_START_Y;

        const functionCallID = this.nextIndex++;
        this.oldIDs.push(functionCallID);
        const final = this.changeMem(value, this.RECURSIVE_START_X, functionCallID);
        this.cmd("SetText", functionCallID, `change(${String(value)}, [${String(this.COINS[this.coinIndex])}])    = ${String(final[0])}`);
        return this.commands;

        // this.currentY = DPChange.RECURSIVE_START_Y;
        // return this.commands;
    }

    changeMem(value, xPos, ID) {
        const coins = this.COINS[this.coinIndex];
        this.cmd("CreateLabel", ID, `change(${String(value)}, [${String(coins)}])`, xPos, this.currentY, 0);
        this.cmd("SetForegroundColor", this.codeID[0][1], this.CODE_HIGHLIGHT_COLOR);
        this.cmd("SetHighlight", this.tableID[0][value], 1);
        this.cmd("Step");
        if (this.tableVals[0][value] >= 0) {
            this.cmd("Delete", ID);
            this.cmd("CreateLabel", ID, this.tableVals[0][value], this.tableXPos[0][value] - 5, this.tableYPos[0][value] - 5, 0);
            this.cmd("Move", ID, xPos, this.currentY);
            this.cmd("Step");
            this.cmd("SetHighlight", this.tableID[0][value], 0);
            this.cmd("SetForegroundColor", this.codeID[0][1], this.CODE_STANDARD_COLOR);
            return [this.tableVals[0][value], []];
        }
        this.cmd("SetHighlight", this.tableID[0][value], 0);
        this.currentY += this.RECURSIVE_DELTA_Y;

        this.cmd("SetForegroundColor", this.codeID[0][1], this.CODE_STANDARD_COLOR);
        this.cmd("SetForegroundColor", this.codeID[1][1], this.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[1][1], this.CODE_STANDARD_COLOR);
        // return 1;
        if (value > 0) {
            this.cmd("SetForegroundColor", this.codeID[3][0], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[3][0], this.CODE_STANDARD_COLOR);
            this.cmd("SetForegroundColor", this.codeID[4][0], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[4][0], this.CODE_STANDARD_COLOR);

            let best = -1;
            const nextID = this.nextIndex++;
            const nextID2 = this.nextIndex++;
            let recID = nextID;
            let bestList = [];
            for (let i = 0; i < coins.length; i++) {
                this.cmd("SetForegroundColor", this.codeID[5][1], this.CODE_HIGHLIGHT_COLOR);
                this.cmd("Step");
                this.cmd("SetForegroundColor", this.codeID[5][1], this.CODE_STANDARD_COLOR);
                if (value >= coins[i]) {
                    this.cmd("SetForegroundColor", this.codeID[6][1], this.CODE_HIGHLIGHT_COLOR);
                    this.cmd("Step");
                    this.cmd("SetForegroundColor", this.codeID[6][1], this.CODE_STANDARD_COLOR);
                    const nextTry = this.changeMem(value - coins[i], xPos + this.RECURSIVE_DELTA_X, recID);
                    // TODO:  SOMEHTING ELSE HERE
                    if (best === -1) {
                        this.cmd("SetForegroundColor", this.codeID[7][1], this.CODE_HIGHLIGHT_COLOR);
                        this.cmd("Step");
                        this.cmd("SetForegroundColor", this.codeID[7][1], this.CODE_STANDARD_COLOR);
                        best = nextTry[0] + 1;
                        bestList = nextTry[1];
                        bestList.push(coins[i]);
                        this.currentY += this.RECURSIVE_DELTA_Y;
                        recID = nextID2;
                    } else if (best > nextTry[0] + 1) {
                        this.cmd("SetForegroundColor", this.codeID[7][2], this.CODE_HIGHLIGHT_COLOR);
                        this.cmd("Step");
                        this.cmd("SetForegroundColor", this.codeID[7][2], this.CODE_STANDARD_COLOR);
                        best = nextTry[0] + 1;
                        bestList = nextTry[1];
                        bestList.push(coins[i]);
                        this.cmd("Delete", recID);
                        this.cmd("SetText", nextID, String(best));
                        this.cmd("SetPosition", nextID, xPos + this.RECURSIVE_DELTA_X, this.currentY);
                        this.cmd("Move", nextID, xPos + this.RECURSIVE_DELTA_X, this.currentY - this.RECURSIVE_DELTA_Y);
                        this.cmd("Step");
                    } else {
                        this.cmd("Step");
                        this.cmd("Delete", recID);
                    }
                } else {
                    break;
                }
            }
            this.cmd("Delete", nextID);
            this.cmd("SetText", ID, String(best));
            this.cmd("SetText", this.tableID[0][value], best);
            this.cmd("SetText", this.tableID[1][value], bestList[0]);
            this.tableVals[0][value] = best;
            this.tableVals[1][value] = bestList[0];

            this.cmd("SetPosition", ID, xPos + this.RECURSIVE_DELTA_X, this.currentY);
            this.cmd("Move", ID, xPos, this.currentY - 2 * this.RECURSIVE_DELTA_Y);

            this.currentY = this.currentY - 2 * this.RECURSIVE_DELTA_Y;

            this.cmd("SetForegroundColor", this.codeID[9][0], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[9][0], this.CODE_STANDARD_COLOR);
            this.cmd("Step");
            return [best, bestList];
        } else {
            this.cmd("SetText", ID, "0");
            this.cmd("SetForegroundColor", this.codeID[2][0], this.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[2][0], this.CODE_STANDARD_COLOR);
            this.cmd("SetText", this.tableID[0][value], 0);

            this.currentY -= this.RECURSIVE_DELTA_Y;
            return [0, []];
        }
    }
}
