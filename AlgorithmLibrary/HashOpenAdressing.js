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


function HashOpenAdressing(am)
{
    // Call superclass' constructor, which calls init
    HashOpenAdressing.superclass.constructor.call(this, am);
}
HashOpenAdressing.inheritFrom(Hash);


// Various constants

HashOpenAdressing.INDEX_COLOR = Hash.HIGHLIGHT_COLOR;

// This should not be a valid key:
HashOpenAdressing.DELETED = "<deleted>";

HashOpenAdressing.PROBING_LINEAR = "linear";
HashOpenAdressing.PROBING_QUADRATIC = "quadratic";
HashOpenAdressing.PROBING_DOUBLE = "double";

HashOpenAdressing.DEFAULT_TABLE_SIZE = 29;
HashOpenAdressing.TABLE_SIZES = [17, 29, 47];
HashOpenAdressing.TABLE_SIZE_LABELS = ["Small (17)", "Medium (29)", "Large (47)"];

HashOpenAdressing.ARRAY_ELEM_WIDTH = 90;
HashOpenAdressing.ARRAY_ELEM_HEIGHT = 30;
HashOpenAdressing.ARRAY_ELEM_START_X = 50;
HashOpenAdressing.ARRAY_ELEM_START_Y = 100;
HashOpenAdressing.ARRAY_VERTICAL_SEPARATION = 100;



HashOpenAdressing.prototype.addControls = function()
{
    HashOpenAdressing.superclass.addControls.call(this);
    this.addBreakToAlgorithmBar();

    this.addLabelToAlgorithmBar("Table size:");
    this.sizeSelect = this.addSelectToAlgorithmBar(HashOpenAdressing.TABLE_SIZES, HashOpenAdressing.TABLE_SIZE_LABELS);
    this.sizeSelect.value = HashOpenAdressing.DEFAULT_TABLE_SIZE;
    this.sizeSelect.onchange = this.resetAll.bind(this);
    this.addBreakToAlgorithmBar();

    this.addLabelToAlgorithmBar("Probing:");
    this.probingSelect = this.addSelectToAlgorithmBar(
        [HashOpenAdressing.PROBING_LINEAR, HashOpenAdressing.PROBING_QUADRATIC, HashOpenAdressing.PROBING_DOUBLE],
        ["Linear: 1, 2, 3, ...", "Quadratic: 1, 4, 9, ...", "Double hashing: h', 2h', ..."],
    );
    this.probingSelect.value = HashOpenAdressing.PROBING_LINEAR;
    this.probingSelect.onchange = this.resetAll.bind(this);
}



///////////////////////////////////////////////////////////////////////////////
// Calculating canvas positions and sizes

HashOpenAdressing.prototype.getCellPosX = function(i) 
{
    return this.getCellPosXY(i).x;
}

HashOpenAdressing.prototype.getCellPosY = function(i) 
{
    return this.getCellPosXY(i).y;
}

HashOpenAdressing.prototype.getCellIndexPosY = function(i)
{
    return this.getCellPosY(i) + this.getCellHeight();
}

HashOpenAdressing.prototype.getCellPosXY = function(i) 
{
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
    return {x: x, y: y};
}

HashOpenAdressing.prototype.getCellWidth = function()
{
    var nrows = 1;
    while (true) {
        var w = nrows * this.getCanvasWidth() / (this.tableSize + 2 * nrows);
        if (w >= 65 || nrows >= 4) return Math.round(w);
        nrows++;
    }
}

HashOpenAdressing.prototype.getCellHeight = function() 
{
    return Math.round(this.getCellWidth() * 0.4);
}


HashOpenAdressing.prototype.isEmpty = function(i)
{
    return !this.tableCells[i];
}

HashOpenAdressing.prototype.setEmpty = function(i)
{
    this.tableCells[i] = "";
}

HashOpenAdressing.prototype.isDeleted = function(i)
{
    return this.tableCells[i] == HashOpenAdressing.DELETED;
}

HashOpenAdressing.prototype.setDeleted = function(i)
{
    this.tableCells[i] = HashOpenAdressing.DELETED;
}



HashOpenAdressing.prototype.resetAll = function()
{
    HashOpenAdressing.superclass.resetAll.call(this);
    this.commands = [];

    this.messageID = this.nextIndex++;
    this.cmd("CreateLabel", this.messageID, "", Hash.MESSAGE_X, Hash.MESSAGE_Y, 0);

    this.tableSize = parseInt(this.sizeSelect.value) || HashOpenAdressing.DEFAULT_TABLE_SIZE;
    this.tableCellIDs = new Array(this.tableSize);
    this.tableCells = new Array(this.tableSize);
    for (var i = 0; i < this.tableSize; i++) {
        this.tableCells[i] = "";
        this.tableCellIDs[i] = this.nextIndex++;
        this.cmd("CreateRectangle", this.tableCellIDs[i], "", 
            this.getCellWidth(), this.getCellHeight(), this.getCellPosX(i), this.getCellPosY(i));
        var indexID = this.nextIndex++;
        this.cmd("CreateLabel", indexID, i, this.getCellPosX(i), this.getCellIndexPosY(i));
        this.cmd("SetForegroundColor", indexID, HashOpenAdressing.INDEX_COLOR);
    }

    this.initialIndex = this.nextIndex;
    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}


HashOpenAdressing.prototype.reset = function()
{
    for (var i = 0; i < this.tableSize; i++) {
        this.tableCells[i] = "";
    }
    this.nextIndex = this.initialIndex;
}


///////////////////////////////////////////////////////////////////////////////
// Functions that do the actual work

HashOpenAdressing.prototype.insertElement = function(elem)
{
    this.commands = [];
    var labID = this.nextIndex++;
    this.cmd("SetText", this.messageID, `Inserting: `);
    this.cmd("CreateLabel", labID, "", 0, 0);
    this.cmd("AlignRight", labID, this.messageID);
    this.cmd("SetText", this.messageID, `Inserting: ${elem}`);

    var index = this.doHash(elem);
    index = this.getEmptyIndex(index, elem);

    if (index < 0) {
        this.cmd("SetText", this.messageID, `Inserting: ${elem}.  Found no empty cell!`);
    }
    else {
        this.cmd("SetText", labID, elem);
        this.cmd("Move", labID, this.getCellPosX(index), this.getCellPosY(index));
        this.cmd("SetText", this.tableCellIDs[index], "");
        this.cmd("Step");

        this.tableCells[index] = elem;
        this.cmd("SetText", this.tableCellIDs[index], elem);
        this.cmd("SetText", this.messageID, `Inserting: ${elem}.  Element inserted!`);
        this.cmd("Step");
        this.cmd("SetHighlight", this.tableCellIDs[index], 0);
    }
    this.cmd("Delete", labID);
    return this.commands;
}


HashOpenAdressing.prototype.deleteElement = function(elem)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, `Deleting: ${elem}`);

    var index = this.doHash(elem);
    index = this.getElemIndex(index, elem);

    if (index < 0) {
        this.cmd("SetText", this.messageID, `Deleting: ${elem}.  Element not found!`);
    }
    else {
        this.tableCells[index] = HashOpenAdressing.DELETED;
        this.cmd("SetText", this.tableCellIDs[index], HashOpenAdressing.DELETED);
        this.cmd("SetText", this.messageID, `Deleting: ${elem}.  Element deleted!`);
        this.cmd("Step");
        this.cmd("SetHighlight", this.tableCellIDs[index], 0);
    }
    return this.commands;
}


HashOpenAdressing.prototype.doHash = function(input) 
{
    var hash = HashOpenAdressing.superclass.doHash.call(this, input);
    var index = hash % this.tableSize;

    var labelID = this.nextIndex++;
    var labelID2 = this.nextIndex++;
    var highlightID = this.nextIndex++;

    var lblText = `    ${hash} % ${this.tableSize}  =  `;
    this.cmd("CreateLabel", labelID, lblText, Hash.HASH_MOD_X, Hash.HASH_NUMBER_START_Y, 0);
    this.cmd("CreateLabel", labelID2, "", 0, 0);
    this.cmd("AlignRight", labelID2, labelID);
    this.cmd("Settext", labelID, lblText + index);
    this.cmd("Step");

    this.cmd("CreateHighlightCircle", highlightID, Hash.HIGHLIGHT_COLOR, 0, 0);
    this.cmd("SetWidth", highlightID, this.getCellHeight());
    this.cmd("AlignMiddle", highlightID, labelID2);
    this.cmd("Move", highlightID, this.getCellPosX(index), this.getCellIndexPosY(index));
    this.cmd("Step");

    this.cmd("Delete", labelID);
    this.cmd("Delete", labelID2);
    this.cmd("Delete", highlightID);
    this.nextIndex -= 3;
    return index;
}


HashOpenAdressing.prototype.findElement = function(elem)
{
    this.commands = new Array();

    this.cmd("SetText", this.messageID, "Finding Element: " + elem);
    var index = this.doHash(elem);
    var index = this.getElemIndex(index, elem);

    if (index < 0) {
        this.cmd("SetText", this.messageID, `Finding: ${elem}.  Element not found!`);
    }
    else {
        this.cmd("SetText", this.messageID, `Finding: ${elem}.  Element found!`);
        this.cmd("Step");
        this.cmd("SetHighlight", this.tableCellIDs[index], 0);
    }
    return this.commands;
}


HashOpenAdressing.prototype.getElemIndex = function(index, elem)
{
    var probing = this.probingSelect.value;
    var skipDelta = 1;
    if (probing == HashOpenAdressing.PROBING_DOUBLE) {
        skipDelta = this.getSkipDelta(elem, this.nextIndex++);
    }
    var foundIndex = -1;
    for (var i = 0; i < this.tableSize; i++) {
        var nextIndex = (index + this.getSkip(i, skipDelta)) % this.tableSize;
        this.cmd("SetHighlight", this.tableCellIDs[nextIndex], 1);
        this.cmd("Step");
        if (this.tableCells[nextIndex] == elem) {
            foundIndex = nextIndex;
            break;
        }
        this.cmd("SetHighlight", this.tableCellIDs[nextIndex], 0);
        if (!this.tableCells[nextIndex]) {
            break;
        }
    }
    if (probing == HashOpenAdressing.PROBING_DOUBLE) {
        this.cmd("Delete", --this.nextIndex);
    }
    return foundIndex;
}


HashOpenAdressing.prototype.getEmptyIndex = function(index, elem)
{
    var probing = this.probingSelect.value;
    var skipDelta = 1;
    if (probing == HashOpenAdressing.PROBING_DOUBLE) {
        skipDelta = this.getSkipDelta(elem, this.nextIndex++);
    }
    var foundIndex = -1;
    for (var i = 0; i < this.tableSize; i++) {
        var nextIndex = (index + this.getSkip(i, skipDelta)) % this.tableSize;
        this.cmd("SetHighlight", this.tableCellIDs[nextIndex], 1);
        this.cmd("Step");
        if (!this.tableCells[nextIndex]) {
            foundIndex = nextIndex;
            break;
        }
        this.cmd("SetHighlight", this.tableCellIDs[nextIndex], 0);
    }
    if (probing == HashOpenAdressing.PROBING_DOUBLE) {
        this.cmd("Delete", --this.nextIndex);
    }
    return foundIndex;
}


HashOpenAdressing.prototype.getSkipDelta = function(elem, labelID)
{
    var skipDelta = 7 - (this.currHash % 7);
    this.cmd("CreateLabel", this.nextIndex++, `hash2(${elem}) = 7 - (${this.currHash} % 7) = ${skipDelta}`, 20, 45, 0);
    return skipDelta;
}


HashOpenAdressing.prototype.getSkip = function(i, d)
{
    var probing = this.probingSelect.value;
    if (!d) d = 1;
    if (probing == HashOpenAdressing.PROBING_QUADRATIC) {
        return i * i * d;
    }
    else {
        return i * d;
    }
}


///////////////////////////////////////////////////////////////////////////////
// Initialization

var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new HashOpenAdressing(animManag);
}
