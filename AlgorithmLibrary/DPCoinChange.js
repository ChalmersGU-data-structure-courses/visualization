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



function DPCoinChange(am)
{
    this.init(am);

}

DPCoinChange.inheritFrom(Algorithm);

DPCoinChange.TABLE_ELEM_WIDTH = 30;
DPCoinChange.TABLE_ELEM_HEIGHT = 30;

DPCoinChange.TABLE_START_X = 500;
DPCoinChange.TABLE_START_Y = 50;
DPCoinChange.TABLE_DIFF_X = 70;

DPCoinChange.CODE_START_X = 10;
DPCoinChange.CODE_START_Y = 10;
DPCoinChange.CODE_LINE_HEIGHT = 14;


DPCoinChange.GREEDY_START_X = 100;
DPCoinChange.GREEDY_START_Y = 150;
DPCoinChange.RECURSIVE_START_X = 220;
DPCoinChange.RECURSIVE_START_Y = 10;
DPCoinChange.RECURSIVE_DELTA_Y = 14;
DPCoinChange.RECURSIVE_DELTA_X = 8;
DPCoinChange.CODE_HIGHLIGHT_COLOR = "#FF0000";
DPCoinChange.CODE_STANDARD_COLOR = "#000000";

DPCoinChange.TABLE_INDEX_COLOR = "#0000FF"
DPCoinChange.CODE_RECURSIVE_1_COLOR = "#339933";
DPCoinChange.CODE_RECURSIVE_2_COLOR = "#0099FF";

DPCoinChange.DPCode = [["def ","change(n, coinArray)",":"],
                 ["     if ","(n == 0) "],
                 ["          return 0"],
                 ["     best = -1"],
                 ["     for coin in coinArray:"],
                 ["         if ","(coin <= n)",":"],
                 ["             nextTry = ","change(n - coin, coinArray)"],
                 ["         if (", "best < 0",  " or ",  "best > nextTry + 1", ")"],
                 ["             best = nextTry + 1"],
                 ["     return best"]];


DPCoinChange.GREEDYCode = [["def ","changeGreedy(n, coinArray)",":"],
                       ["    coinsRequired = 0"],
                       ["    for coin in reversed(coinArray): "],
                       ["       while ", "(n <= coin)"],
                       ["          n = n - coin"],
                       ["          coinsRequired = coinsRequired + 1"],
                       ["    return coinsRequired"]];


DPCoinChange.COINS = [[1, 5, 10, 25],
                  [1, 4, 6, 10]];


DPCoinChange.MAX_VALUE = 30;

DPCoinChange.MESSAGE_ID = 0;


DPCoinChange.prototype.setCode = function(codeArray)
{
    this.code = codeArray;
    this.codeID = Array(this.code.length);
    var i, j;
    for (i = 0; i < this.code.length; i++) {
        this.codeID[i] = new Array(this.code[i].length);
        for (j = 0; j < this.code[i].length; j++) {
            this.codeID[i][j] = this.nextIndex++;
            this.cmd("CreateLabel", this.codeID[i][j], this.code[i][j], DPCoinChange.CODE_START_X, DPCoinChange.CODE_START_Y + i * DPCoinChange.CODE_LINE_HEIGHT, 0);
            this.cmd("SetForegroundColor", this.codeID[i][j], DPCoinChange.CODE_STANDARD_COLOR);
            if (j > 0) {
                this.cmd("AlignRight", this.codeID[i][j], this.codeID[i][j-1]);
            }
        }
    }
}


DPCoinChange.prototype.deleteCode = function()
{
    var i,j
    for (i = 0; i < this.codeID.length; i++) {
        for (j = 0; j < this.codeID[i].length; j++) {
            this.cmd("Delete", this.codeID[i][j]);
        }
    }
    this.codeID = [];
}

DPCoinChange.prototype.setCodeAlpha = function(codeArray, alpha)
{
    var i, j
    for (i = 0; i < codeArray.length; i++) {
        var foo = 3;
        foo = codeArray[i];
        for (j = 0; j < codeArray[i].length; j++) {
            this.cmd("SetAlpha", codeArray[i][j], alpha);
        }
    }
}



DPCoinChange.prototype.init = function(am)
{
    DPCoinChange.superclass.init.call(this, am);
    this.nextIndex = 0;
    this.addControls();
    // HACK!!
    this.setCode(DPCoinChange.GREEDYCode);
    this.greedyCodeID = this.codeID;
    this.setCodeAlpha(this.greedyCodeID, 0);
    ///
    this.setCode(DPCoinChange.DPCode);
    this.usingDPCode = true;


    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
    this.initialIndex = this.nextIndex;
    this.oldIDs = [];
    this.commands = [];
}


DPCoinChange.prototype.addControls = function()
{
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

    var coinLabels = [];
    for (var i = 0; i < DPCoinChange.COINS.length; i++) {
        var nextLabel = "Coins: [" + DPCoinChange.COINS[i][0];
        for (var j = 1; j < DPCoinChange.COINS[i].length; j++) {
            nextLabel = nextLabel + ", " + DPCoinChange.COINS[i][j];
        }
        nextLabel = nextLabel + "]";
        coinLabels.push(nextLabel);
    }
    this.coinTypeButtons = this.addRadioButtonGroupToAlgorithmBar(coinLabels, "CoinType");
    for (var i = 0; i < this.coinTypeButtons.length; i++) {
        this.coinTypeButtons[i].onclick = this.coinTypeChangedCallback.bind(this, i);
    }
    this.coinTypeButtons[0].checked = true;
    this.coinIndex = 0;
}



DPCoinChange.prototype.coinTypeChangedCallback = function(coinIndex)
{
    this.implementAction(this.coinTypeChanged.bind(this), coinIndex);
}


DPCoinChange.prototype.coinTypeChanged = function(coinIndex)
{
    this.commands = [];
    this.coinIndex = coinIndex;
    this.coinTypeButtons[coinIndex].checked = true;
    this.clearOldIDs();

    return this.commands;
}





DPCoinChange.prototype.greedyCallback = function(value)
{
    var changeValue = this.normalizeNumber(this.changeField.value);
    if (changeValue !== "") {
        changeValue = Math.min(changeValue, DPCoinChange.MAX_VALUE);
        this.changeField.value = changeValue;
        this.implementAction(this.implementGreedy.bind(this), changeValue);
    }
}


DPCoinChange.prototype.implementGreedy = function(value)
{
    this.commands = [];
    this.clearOldIDs();
    var initialValue = value;
    if (this.usingDPCode) {
        this.setCodeAlpha(this.greedyCodeID, 1);
        this.setCodeAlpha(this.codeID, 0);
        this.usingDPCode = false;
    }

    var currX = DPCoinChange.GREEDY_START_X;
    var currY = DPCoinChange.GREEDY_START_Y + 2.5 * DPCoinChange.TABLE_ELEM_HEIGHT;

    var messageID = this.nextIndex++;
    this.oldIDs.push(messageID);

    var valueRemainingID = this.nextIndex++;
    this.oldIDs.push(valueRemainingID);

    this.cmd("CreateRectangle", valueRemainingID, value,  DPCoinChange.TABLE_ELEM_WIDTH,
             DPCoinChange.TABLE_ELEM_HEIGHT,
              DPCoinChange.GREEDY_START_X, DPCoinChange.GREEDY_START_Y);

    var tempLabel = this.nextIndex++;
    this.oldIDs.push(tempLabel);
    this.cmd("CreateLabel", tempLabel, "Amount remaining:",0, 0);
    this.cmd("AlignLeft", tempLabel, valueRemainingID);

    var requiredCoinsID = this.nextIndex++;
    this.oldIDs.push(requiredCoinsID);

    this.cmd("CreateRectangle", requiredCoinsID, value,  DPCoinChange.TABLE_ELEM_WIDTH,
             DPCoinChange.TABLE_ELEM_HEIGHT,
             DPCoinChange.GREEDY_START_X, DPCoinChange.GREEDY_START_Y + DPCoinChange.TABLE_ELEM_HEIGHT);

    tempLabel = this.nextIndex++;
    this.oldIDs.push(tempLabel);
    this.cmd("CreateLabel", tempLabel, "Required Coins:",0, 0);
    this.cmd("AlignLeft", tempLabel, requiredCoinsID);


    var requiredCoins = 0;
    var i;
    for (i = DPCoinChange.COINS[this.coinIndex].length - 1; i >=0; i--) {
        while (value >= DPCoinChange.COINS[this.coinIndex][i]) {
            requiredCoins = requiredCoins + 1;
            value = value - DPCoinChange.COINS[this.coinIndex][i];
            this.cmd("SetText", valueRemainingID, value);
            this.cmd("SetText", requiredCoinsID, requiredCoins);
            var moveIndex = this.nextIndex++;
            this.oldIDs.push(moveIndex);
            this.cmd("CreateLabel", moveIndex, DPCoinChange.COINS[this.coinIndex][i], DPCoinChange.GREEDY_START_X, DPCoinChange.GREEDY_START_Y);
            this.cmd("Move", moveIndex, currX, currY);
            currX += DPCoinChange.TABLE_ELEM_WIDTH;
            this.cmd("Step");
        }

    }

    this.cmd("CreateLabel", messageID,
             "changeGreedy(" + String(initialValue)+ ", [" +String(DPCoinChange.COINS[this.coinIndex]) +"])    = " + String(requiredCoins),
             DPCoinChange.RECURSIVE_START_X, DPCoinChange.RECURSIVE_START_Y, 0);

    return this.commands;
}




DPCoinChange.prototype.buildTable = function(maxVal)
{

    this.tableID = new Array(2);
    this.tableVals = new Array(2);
    this.tableXPos = new Array(2);
    this.tableYPos = new Array(2);
    var i;
    for (i = 0; i < 2; i++) {
        this.tableID[i] = new Array(maxVal + 1);
        this.tableVals[i] = new Array(maxVal + 1);
        this.tableXPos[i] = new Array(maxVal + 1);
        this.tableYPos[i] = new Array(maxVal + 1);
    }

    var j;
    var indexID;
    var xPos;
    var yPos;
    var table_rows = Math.floor((this.getCanvasHeight() - DPCoinChange.TABLE_ELEM_HEIGHT - DPCoinChange.TABLE_START_Y) / DPCoinChange.TABLE_ELEM_HEIGHT);
    var table_cols = Math.ceil((maxVal + 1) / table_rows);

    var header1ID = this.nextIndex++;
    this.oldIDs.push(header1ID);

    this.cmd("CreateLabel", header1ID, "# of Coins Required", DPCoinChange.TABLE_START_X, DPCoinChange.TABLE_START_Y - 30);


    var header2ID = this.nextIndex++;
    this.oldIDs.push(header2ID);

    this.cmd("CreateLabel", header2ID, "Coins to Use", DPCoinChange.TABLE_START_X + table_cols*DPCoinChange.TABLE_DIFF_X + 1.5*DPCoinChange.TABLE_DIFF_X, DPCoinChange.TABLE_START_Y - 30);



    for (i = 0; i <= maxVal; i++) {
        yPos = i % table_rows * DPCoinChange.TABLE_ELEM_HEIGHT + DPCoinChange.TABLE_START_Y;
        xPos = Math.floor(i / table_rows) * DPCoinChange.TABLE_DIFF_X + DPCoinChange.TABLE_START_X;

        for (j = 0; j < 2; j++) {

            this.tableID[j][i] = this.nextIndex++;
            this.tableVals[j][i] = -1;
            this.oldIDs.push(this.tableID[j][i]);


            this.tableXPos[j][i] = xPos;
            this.tableYPos[j][i] = yPos;

            this.cmd("CreateRectangle", this.tableID[j][i],
                     "",
                     DPCoinChange.TABLE_ELEM_WIDTH,
                     DPCoinChange.TABLE_ELEM_HEIGHT,
                     xPos,
                     yPos);
            indexID = this.nextIndex++;
            this.oldIDs.push(indexID);
            this.cmd("CreateLabel", indexID, i, xPos - DPCoinChange.TABLE_ELEM_WIDTH,  yPos);
            this.cmd("SetForegroundColor", indexID, DPCoinChange.TABLE_INDEX_COLOR);

            xPos = xPos + table_cols * DPCoinChange.TABLE_DIFF_X + 1.5*DPCoinChange.TABLE_DIFF_X;
        }



    }
}

DPCoinChange.prototype.clearOldIDs = function()
{
    for (var i = 0; i < this.oldIDs.length; i++) {
        this.cmd("Delete", this.oldIDs[i]);
    }
    this.oldIDs =[];
    this.nextIndex = this.initialIndex;

}


DPCoinChange.prototype.reset = function()
{
    this.oldIDs =[];
    this.coinIndex = 0;
    this.usingDPCode = true;
    this.coinTypeButtons[0].checked = true;
    this.nextIndex = this.initialIndex;
}



DPCoinChange.prototype.emptyCallback = function(event)
{
    this.implementAction(this.helpMessage.bind(this), "");
    // TODO:  Put up a message to push the appropriate button?

}

DPCoinChange.prototype.displayCoinsUsed = function()
{
    var currValue = this.tableVals[1].length - 1;
    var currX = 30;
    var currY = 200;

    var moveID;
    moveID = this.nextIndex++;

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

DPCoinChange.prototype.recursiveCallback = function(event)
{
    var changeValue = this.normalizeNumber(this.changeField.value);
    if (changeValue !== "") {
        changeValue = Math.min(changeValue, DPCoinChange.MAX_VALUE - 5);
        this.changeField.value = changeValue;
        this.implementAction(this.recursiveChange.bind(this), changeValue);
    }
}


DPCoinChange.prototype.tableCallback = function(event)
{
    var changeValue = this.normalizeNumber(this.changeField.value);
    if (changeValue !== "") {
        changeValue = Math.min(changeValue, DPCoinChange.MAX_VALUE);
        this.changeField.value = changeValue;
        this.implementAction(this.tableChange.bind(this), changeValue);
    }
}


DPCoinChange.prototype.memoizedCallback = function(event)
{
    var changeValue = this.normalizeNumber(this.changeField.value);
    if (changeValue !== "") {
        changeValue = Math.min(changeValue, DPCoinChange.MAX_VALUE - 5);
        this.changeField.value = changeValue;
        this.implementAction(this.memoizedChange.bind(this), changeValue);
    }
}


DPCoinChange.prototype.helpMessage = function(value)
{
    this.commands = [];
    this.clearOldIDs();
    var messageID = this.nextIndex++;
    this.oldIDs.push(messageID);
    this.cmd("CreateLabel", messageID,
             "Enter a value between 0 and " + String(DPCoinChange.MAX_VALUE) + " in the text field.\n" +
             "Then press the Change Recursive, Change Table, Change Memoized, or Change Greedy button",
             DPCoinChange.RECURSIVE_START_X, DPCoinChange.RECURSIVE_START_Y, 0);
    return this.commands;
}


DPCoinChange.prototype.recursiveChange = function(value)
{
    this.commands = [];

    this.clearOldIDs();
    if (!this.usingDPCode) {
        this.setCodeAlpha(this.greedyCodeID, 0);
        this.setCodeAlpha(this.codeID, 1);
        this.usingDPCode = true;
    }

    this.currentY = DPCoinChange.RECURSIVE_START_Y;

    var functionCallID = this.nextIndex++;
    this.oldIDs.push(functionCallID);
    var final = this.change(value, DPCoinChange.RECURSIVE_START_X, functionCallID);
    this.cmd("SetText", functionCallID,  "change(" + String(value)+ ", [" +String(DPCoinChange.COINS[this.coinIndex]) +"])    = " + String(final[0]));
    return this.commands;
}


DPCoinChange.prototype.change = function(value, xPos, ID)
{
    var coins = DPCoinChange.COINS[this.coinIndex];
    this.cmd("CreateLabel", ID, "change(" + String(value)+ ", [" +String(coins) +"])", xPos, this.currentY, 0);
    this.currentY += DPCoinChange.RECURSIVE_DELTA_Y;
    this.cmd("SetForegroundColor", this.codeID[0][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
    this.cmd("Step");
    this.cmd("SetForegroundColor", this.codeID[0][1], DPCoinChange.CODE_STANDARD_COLOR);
    this.cmd("SetForegroundColor", this.codeID[1][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
    this.cmd("Step");
    this.cmd("SetForegroundColor", this.codeID[1][1], DPCoinChange.CODE_STANDARD_COLOR);
    // return 1;
    if (value > 0) {
        this.cmd("SetForegroundColor", this.codeID[3][0], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[3][0], DPCoinChange.CODE_STANDARD_COLOR);
        this.cmd("SetForegroundColor", this.codeID[4][0], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[4][0], DPCoinChange.CODE_STANDARD_COLOR);

        var i;
        var best = -1;
        var nextID = this.nextIndex++;
        var nextID2 = this.nextIndex++;
        var recID = nextID;
        var bestList;
        for (i = 0; i < coins.length; i++) {
            this.cmd("SetForegroundColor", this.codeID[5][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[5][1], DPCoinChange.CODE_STANDARD_COLOR);
            if (value >= coins[i]) {
                this.cmd("SetForegroundColor", this.codeID[6][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
                this.cmd("Step");
                this.cmd("SetForegroundColor", this.codeID[6][1], DPCoinChange.CODE_STANDARD_COLOR);
                var nextTry = this.change(value - coins[i], xPos + DPCoinChange.RECURSIVE_DELTA_X, recID);
                // TODO:  SOMEHTING ELSE HERE
                if (best == -1) {
                    this.cmd("SetForegroundColor", this.codeID[7][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
                    this.cmd("Step");
                    this.cmd("SetForegroundColor", this.codeID[7][1], DPCoinChange.CODE_STANDARD_COLOR);
                    best = nextTry[0] + 1;
                    bestList = nextTry[1];
                    bestList.push(coins[i]);
                    this.currentY += DPCoinChange.RECURSIVE_DELTA_Y;
                    recID = nextID2;
                }
                else if (best > nextTry[0] + 1) {
                    this.cmd("SetForegroundColor", this.codeID[7][2], DPCoinChange.CODE_HIGHLIGHT_COLOR);
                    this.cmd("Step");
                    this.cmd("SetForegroundColor", this.codeID[7][2], DPCoinChange.CODE_STANDARD_COLOR);
                    best = nextTry[0] + 1;
                    bestList = nextTry[1];
                    bestList.push(coins[i]);;
                    this.cmd("Delete", recID);
                    this.cmd("SetText", nextID, String(best) + "       ([" + String(bestList) + "])");
                    this.cmd("SetPosition", nextID, xPos + DPCoinChange.RECURSIVE_DELTA_X, this.currentY);
                    this.cmd("Move", nextID, xPos + DPCoinChange.RECURSIVE_DELTA_X, this.currentY - DPCoinChange.RECURSIVE_DELTA_Y);
                    this.cmd("Step");
                }
                else {
                    this.cmd("Delete", recID);
                }
            }
            else {
                break;
            }
        }
        this.cmd("Delete", nextID);
        this.cmd("SetText", ID, String(best) + "       ([" + String(bestList) + "])");
        this.cmd("SetPosition", ID, xPos + DPCoinChange.RECURSIVE_DELTA_X, this.currentY);
        this.cmd("Move", ID, xPos, this.currentY - 2 * DPCoinChange.RECURSIVE_DELTA_Y);


        this.currentY = this.currentY - 2 * DPCoinChange.RECURSIVE_DELTA_Y;

        this.cmd("SetForegroundColor", this.codeID[9][0], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[9][0], DPCoinChange.CODE_STANDARD_COLOR);
        this.cmd("Step");
        return [best, bestList];
    }
    else {
        this.cmd("SetText", ID, "0");
        this.cmd("SetForegroundColor", this.codeID[2][0], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[2][0], DPCoinChange.CODE_STANDARD_COLOR);

        this.currentY -=  DPCoinChange.RECURSIVE_DELTA_Y;
        return [0, []];
    }



}




DPCoinChange.prototype.tableChange = function(value)
{
    this.commands = [];
    this.clearOldIDs();
    if (!this.usingDPCode) {
        this.setCodeAlpha(this.greedyCodeID, 0);
        this.setCodeAlpha(this.codeID, 1);
        this.usingDPCode = true;
    }

    this.buildTable(value);
    coins = DPCoinChange.COINS[this.coinIndex];
    var i;
    for (i = 0; i <= value && i <= 0; i++) {
        this.cmd("SetForegroundColor", this.codeID[1][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("SetForegroundColor", this.codeID[2][0], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("SetHighlight", this.tableID[0][i], 1);
        this.cmd("SetText", this.tableID[0][i], 0);
        this.tableVals[0][i] = 0;
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[1][1], DPCoinChange.CODE_STANDARD_COLOR);
        this.cmd("SetForegroundColor", this.codeID[2][0], DPCoinChange.CODE_STANDARD_COLOR);
        this.cmd("SetHighlight", this.tableID[0][i], 0);
    }
    for (i = 1; i <= value; i++) {
        this.tableVals[0][i] = -1;
        var j;
        for (j = 0; j < coins.length; j++) {
            if (coins[j] <= i) {
                this.cmd("SetHighlight", this.tableID[0][i-coins[j]], 1);
                this.cmd("SetHighlight", this.tableID[0][i], 1);
                this.cmd("Step");
                if (this.tableVals[0][i] == -1 || this.tableVals[0][i] > this.tableVals[0][i - coins[j]] + 1) {
                    this.tableVals[0][i] = this.tableVals[0][i- coins[j]] + 1;
                    this.cmd("SetText", this.tableID[0][i], this.tableVals[0][i]);
                    this.cmd("SetHighlight", this.tableID[1][i], 1);
                    this.cmd("SetText", this.tableID[1][i], coins[j]);
                    this.tableVals[1][i] = coins[j];
                    this.cmd("Step")
                    this.cmd("SetHighlight", this.tableID[1][i], 0);
                }
                this.cmd("SetHighlight", this.tableID[0][i-coins[j]], 0);
                this.cmd("SetHighlight", this.tableID[0][i], 0);
            }
        }
    }

    var finalID = this.nextIndex++;
    this.oldIDs.push(finalID);
    this.cmd("CreateLabel", finalID, this.tableVals[0][value], this.tableXPos[0][value] - 5, this.tableYPos[0][value] - 5, 0);
    this.cmd("Move", finalID, DPCoinChange.RECURSIVE_START_X, DPCoinChange.RECURSIVE_START_Y);
    this.cmd("Step");
    this.cmd("SetText", finalID, "change(" + String(value) + ") = " + String(this.tableVals[0][value]));

    this.displayCoinsUsed();

    return this.commands;


}



DPCoinChange.prototype.fibMem = function(value, xPos, ID)
{
    this.cmd("CreateLabel", ID, "fib(" + String(value)+")", xPos, this.currentY, 0);
    this.cmd("SetHighlight", this.tableID[value], 1);
    // TODO: Add an extra pause here?
    this.cmd("Step");
    if (this.tableVals[value] >= 0) {
        this.cmd("Delete", ID, "fib(" + String(value)+")", xPos, this.currentY, 0);
        this.cmd("CreateLabel", ID, this.tableVals[value], this.tableXPos[value] - 5, this.tableYPos[value] - 5, 0);
        this.cmd("Move", ID, xPos, this.currentY);
        this.cmd("Step")
        this.cmd("SetHighlight", this.tableID[value], 0);
        return this.tableVals[value];
    }
    this.cmd("SetHighlight", this.tableID[value], 0);
    this.currentY += DPCoinChange.RECURSIVE_DELTA_Y;
    this.cmd("SetForegroundColor", this.codeID[0][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
    this.cmd("Step");
    this.cmd("SetForegroundColor", this.codeID[0][1], DPCoinChange.CODE_STANDARD_COLOR);
    this.cmd("SetForegroundColor", this.codeID[1][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
    this.cmd("Step");
    this.cmd("SetForegroundColor", this.codeID[1][1], DPCoinChange.CODE_STANDARD_COLOR);
    if (value > 1) {
        var firstID = this.nextIndex++;
        var secondID = this.nextIndex++;
        this.cmd("SetForegroundColor", this.codeID[4][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[4][1], DPCoinChange.CODE_STANDARD_COLOR);
        var firstValue = this.fibMem(value-1, xPos + DPCoinChange.RECURSIVE_DELTA_X, firstID);
        this.currentY += DPCoinChange.RECURSIVE_DELTA_Y;
        this.cmd("SetForegroundColor", this.codeID[4][3], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[4][3], DPCoinChange.CODE_STANDARD_COLOR);
        var secondValue = this.fibMem(value-2, xPos + DPCoinChange.RECURSIVE_DELTA_X, secondID);


        this.cmd("SetForegroundColor", this.codeID[4][1], DPCoinChange.CODE_RECURSIVE_1_COLOR);
        this.cmd("SetForegroundColor", firstID, DPCoinChange.CODE_RECURSIVE_1_COLOR);
        this.cmd("SetForegroundColor", this.codeID[4][2], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("SetForegroundColor", this.codeID[4][3], DPCoinChange.CODE_RECURSIVE_2_COLOR);
        this.cmd("SetForegroundColor", secondID, DPCoinChange.CODE_RECURSIVE_2_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[4][1], DPCoinChange.CODE_STANDARD_COLOR);
        this.cmd("SetForegroundColor", this.codeID[4][2], DPCoinChange.CODE_STANDARD_COLOR);
        this.cmd("SetForegroundColor", this.codeID[4][3], DPCoinChange.CODE_STANDARD_COLOR);



        this.cmd("Delete", firstID);
        this.cmd("Delete", secondID);
        this.cmd("SetText", ID, firstValue + secondValue);
        this.cmd("Step");
        this.tableVals[value] = firstValue + secondValue;
        this.currentY = this.currentY - 2 * DPCoinChange.RECURSIVE_DELTA_Y;
        this.cmd("CreateLabel", this.nextIndex, this.tableVals[value], xPos+5, this.currentY + 5);
        this.cmd("Move", this.nextIndex, this.tableXPos[value], this.tableYPos[value], this.currentY);
        this.cmd("Step");
        this.cmd("Delete", this.nextIndex);
        this.cmd("SetText", this.tableID[value], this.tableVals[value]);
        return firstValue + secondValue;
    }
    else {
        this.cmd("SetText", ID, "1");
        this.cmd("SetForegroundColor", this.codeID[2][0], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[2][0], DPCoinChange.CODE_STANDARD_COLOR);
        this.tableVals[value] = 1;
        this.cmd("CreateLabel", this.nextIndex, this.tableVals[value], xPos + 5, this.currentY + 5);
        this.cmd("Move", this.nextIndex, this.tableXPos[value], this.tableYPos[value], this.currentY);
        this.cmd("Step");
        this.cmd("Delete", this.nextIndex);
        this.cmd("SetText", this.tableID[value], this.tableVals[value]);

        this.currentY -= DPCoinChange.RECURSIVE_DELTA_Y;
        return 1;
    }

}

DPCoinChange.prototype.memoizedChange = function(value)
{
    this.commands = [];

    if (!this.usingDPCode) {
        this.setCodeAlpha(this.greedyCodeID, 0);
        this.setCodeAlpha(this.codeID, 1);
        this.usingDPCode = true;
    }


    this.clearOldIDs();
    this.buildTable(value);

    this.currentY = DPCoinChange.RECURSIVE_START_Y;

    var functionCallID = this.nextIndex++;
    this.oldIDs.push(functionCallID);
    var final = this.changeMem(value, DPCoinChange.RECURSIVE_START_X, functionCallID);
    this.cmd("SetText", functionCallID,  "change(" + String(value)+ ", [" +String(DPCoinChange.COINS[this.coinIndex]) +"])    = " + String(final[0]));
    return this.commands;

    // this.currentY = DPChange.RECURSIVE_START_Y;

    // return this.commands;
}



DPCoinChange.prototype.changeMem = function(value, xPos, ID)
{
    var coins = DPCoinChange.COINS[this.coinIndex];
    this.cmd("CreateLabel", ID, "change(" + String(value)+ ", [" +String(coins) +"])", xPos, this.currentY, 0);
    this.cmd("SetForegroundColor", this.codeID[0][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
    this.cmd("SetHighlight", this.tableID[0][value], 1);
    this.cmd("Step");
    if (this.tableVals[0][value] >= 0) {
        this.cmd("Delete", ID);
        this.cmd("CreateLabel", ID, this.tableVals[0][value], this.tableXPos[0][value] - 5, this.tableYPos[0][value] - 5, 0);
        this.cmd("Move", ID, xPos, this.currentY);
        this.cmd("Step")
        this.cmd("SetHighlight", this.tableID[0][value], 0);
        this.cmd("SetForegroundColor", this.codeID[0][1], DPCoinChange.CODE_STANDARD_COLOR);
        return [this.tableVals[0][value], []];
    }
    this.cmd("SetHighlight", this.tableID[0][value], 0);
    this.currentY += DPCoinChange.RECURSIVE_DELTA_Y;



    this.cmd("SetForegroundColor", this.codeID[0][1], DPCoinChange.CODE_STANDARD_COLOR);
    this.cmd("SetForegroundColor", this.codeID[1][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
    this.cmd("Step");
    this.cmd("SetForegroundColor", this.codeID[1][1], DPCoinChange.CODE_STANDARD_COLOR);
    // return 1;
    if (value > 0) {
        this.cmd("SetForegroundColor", this.codeID[3][0], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[3][0], DPCoinChange.CODE_STANDARD_COLOR);
        this.cmd("SetForegroundColor", this.codeID[4][0], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[4][0], DPCoinChange.CODE_STANDARD_COLOR);

        var i;
        var best = -1;
        var nextID = this.nextIndex++;
        var nextID2 = this.nextIndex++;
        var recID = nextID;
        var bestList;
        for (i = 0; i < coins.length; i++) {
            this.cmd("SetForegroundColor", this.codeID[5][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.codeID[5][1], DPCoinChange.CODE_STANDARD_COLOR);
            if (value >= coins[i]) {
                this.cmd("SetForegroundColor", this.codeID[6][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
                this.cmd("Step");
                this.cmd("SetForegroundColor", this.codeID[6][1], DPCoinChange.CODE_STANDARD_COLOR);
                var nextTry = this.changeMem(value - coins[i], xPos + DPCoinChange.RECURSIVE_DELTA_X, recID);
                // TODO:  SOMEHTING ELSE HERE
                if (best == -1) {
                    this.cmd("SetForegroundColor", this.codeID[7][1], DPCoinChange.CODE_HIGHLIGHT_COLOR);
                    this.cmd("Step");
                    this.cmd("SetForegroundColor", this.codeID[7][1], DPCoinChange.CODE_STANDARD_COLOR);
                    best = nextTry[0] + 1;
                    bestList = nextTry[1];
                    bestList.push(coins[i]);;
                    this.currentY += DPCoinChange.RECURSIVE_DELTA_Y;
                    recID = nextID2;
                }
                else if (best > nextTry[0] + 1) {
                    this.cmd("SetForegroundColor", this.codeID[7][2], DPCoinChange.CODE_HIGHLIGHT_COLOR);
                    this.cmd("Step");
                    this.cmd("SetForegroundColor", this.codeID[7][2], DPCoinChange.CODE_STANDARD_COLOR);
                    best = nextTry[0] + 1;
                    bestList = nextTry[1];
                    bestList.push(coins[i]);;
                    this.cmd("Delete", recID);
                    this.cmd("SetText", nextID, String(best));
                    this.cmd("SetPosition", nextID, xPos + DPCoinChange.RECURSIVE_DELTA_X, this.currentY);
                    this.cmd("Move", nextID, xPos + DPCoinChange.RECURSIVE_DELTA_X, this.currentY - DPCoinChange.RECURSIVE_DELTA_Y);
                    this.cmd("Step");
                }
                else {
                    this.cmd("Step");
                    this.cmd("Delete", recID);
                }
            }
            else {
                break;
            }
        }
        this.cmd("Delete", nextID);
        this.cmd("SetText", ID, String(best));
        this.cmd("SetText", this.tableID[0][value], best);
        this.cmd("SetText", this.tableID[1][value], bestList[0]);
        this.tableVals[0][value] = best;
        this.tableVals[1][value] = bestList[0];

        this.cmd("SetPosition", ID, xPos + DPCoinChange.RECURSIVE_DELTA_X, this.currentY);
        this.cmd("Move", ID, xPos, this.currentY - 2 * DPCoinChange.RECURSIVE_DELTA_Y);


        this.currentY = this.currentY - 2 * DPCoinChange.RECURSIVE_DELTA_Y;

        this.cmd("SetForegroundColor", this.codeID[9][0], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[9][0], DPCoinChange.CODE_STANDARD_COLOR);
        this.cmd("Step");
        return [best, bestList];
    }
    else {
        this.cmd("SetText", ID, "0");
        this.cmd("SetForegroundColor", this.codeID[2][0], DPCoinChange.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.codeID[2][0], DPCoinChange.CODE_STANDARD_COLOR);
        this.cmd("SetText", this.tableID[0][value], 0);

        this.currentY -=  DPCoinChange.RECURSIVE_DELTA_Y;
        return [0, []];
    }



}



var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new DPCoinChange(animManag);
}



