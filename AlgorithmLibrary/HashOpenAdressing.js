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

HashOpenAdressing.CLOSED_HASH_TABLE_SIZE = 29;
HashOpenAdressing.INDEX_COLOR = Hash.HIGHLIGHT_COLOR;

HashOpenAdressing.PROBING_LINEAR = "linear";
HashOpenAdressing.PROBING_QUADRATIC = "quadratic";
HashOpenAdressing.PROBING_DOUBLE = "double";

HashOpenAdressing.ARRAY_ELEM_WIDTH = 90;
HashOpenAdressing.ARRAY_ELEM_HEIGHT = 30;
HashOpenAdressing.ARRAY_ELEM_START_X = 50;
HashOpenAdressing.ARRAY_ELEM_START_Y = 100;
HashOpenAdressing.ARRAY_VERTICAL_SEPARATION = 100;



HashOpenAdressing.prototype.addControls = function()
{
    HashOpenAdressing.superclass.addControls.call(this);
    this.addBreakToAlgorithmBar();

    this.probingSelect = this.addSelectToAlgorithmBar(
        [HashOpenAdressing.PROBING_LINEAR, HashOpenAdressing.PROBING_QUADRATIC, HashOpenAdressing.PROBING_DOUBLE],
        ["Linear probing: f(i) = i", "Quadratic probing: f(i) = i²", "Double hashing: f(i) = i · h'(x)"],
    );
    this.probingSelect.value = HashOpenAdressing.PROBING_LINEAR;
    this.probingSelect.onchange = this.resetAll.bind(this);
}


HashOpenAdressing.prototype.resetAll = function()
{
    HashOpenAdressing.superclass.resetAll.call(this);
    this.commands = [];
    this.messageID = this.nextIndex++;

    var w = this.getCanvasWidth();
    this.elements_per_row = Math.floor(w / HashOpenAdressing.ARRAY_ELEM_WIDTH);
    //this.POINTER_ARRAY_ELEM_Y = h - ClosedHash.POINTER_ARRAY_ELEM_WIDTH;

    this.table_size = HashOpenAdressing.CLOSED_HASH_TABLE_SIZE;
    this.skipDist = new Array(this.table_size);
    this.hashTableVisual = new Array(this.table_size);
    this.hashTableIndices = new Array(this.table_size);
    this.hashTableValues = new Array(this.table_size);

    this.indexXPos = new Array(this.table_size);
    this.indexYPos = new Array(this.table_size);

    this.empty = new Array(this.table_size);
    this.deleted = new Array(this.table_size);

    for (var i = 0; i < this.table_size; i++) {
        this.skipDist[i] = i; // Start with linear probing
        this.empty[i] = true;
        this.deleted[i] = false;

        this.indexXPos[i] = (
            HashOpenAdressing.ARRAY_ELEM_START_X 
            + (i % this.elements_per_row) * HashOpenAdressing.ARRAY_ELEM_WIDTH
        );
        this.indexYPos[i] = (
            HashOpenAdressing.ARRAY_ELEM_START_Y 
            + Math.floor(i / this.elements_per_row) * HashOpenAdressing.ARRAY_VERTICAL_SEPARATION
            + HashOpenAdressing.ARRAY_ELEM_HEIGHT
        );

        this.hashTableVisual[i] = this.nextIndex++;
        this.cmd("CreateRectangle", this.hashTableVisual[i], "", 
            HashOpenAdressing.ARRAY_ELEM_WIDTH, HashOpenAdressing.ARRAY_ELEM_HEIGHT, this.indexXPos[i], this.indexYPos[i] - HashOpenAdressing.ARRAY_ELEM_HEIGHT);

        this.hashTableIndices[i] = this.nextIndex++;
        this.cmd("CreateLabel", this.hashTableIndices[i], i, this.indexXPos[i], this.indexYPos[i]);
        this.cmd("SetForegroundColor", this.hashTableIndices[i], HashOpenAdressing.INDEX_COLOR);
    }
    this.cmd("CreateLabel", this.messageID, "", Hash.MESSAGE_X, Hash.MESSAGE_Y, 0);

    this.initialIndex = this.nextIndex;
    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}


HashOpenAdressing.prototype.reset = function()
{
    for (var i = 0; i < this.table_size; i++) {
        this.empty[i]= true;
        this.deleted[i] = false;
    }
    this.nextIndex = this.initialIndex;
}


///////////////////////////////////////////////////////////////////////////////
// Calculating canvas positions and sizes

Hash.prototype.getArrayX = function(i)
{
    return this.getArrayXY(i).x;
}

Hash.prototype.getArrayY = function(i)
{
    return this.getArrayXY(i).y;
}

Hash.prototype.getArrayLabelY = function(i)
{
    return this.getArrayY(i) + this.getArrayElemHeight() * 0.9;
}

Hash.prototype.getArrayXY = function(i)
{
    var x = 1.5 * this.getArrayElemWidth();
    var y = 4.5 * this.getArrayElemHeight();
    for (var k = 0; k < i; k++) {
        x += this.getArrayElemWidth();
        if (x + this.getArrayElemWidth() > this.getCanvasWidth()) {
            x = 1.5 * this.getArrayElemWidth();
            y += 2.5 * this.getArrayElemHeight();
        }
    }
    return {x: x, y: y};
}

Hash.prototype.getArrayElemWidth = function() 
{
    var nrows = 1;
    while (true) {
        var w = nrows * this.getCanvasWidth() / (Hash.SIZE + 2 * nrows);
        if (w >= 25) return w;
        nrows++;
    }
}

Hash.prototype.getArrayElemHeight = function() 
{
    return this.getArrayElemWidth() * 0.8;
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
        this.cmd("Move", labID, this.indexXPos[index], this.indexYPos[index] - HashOpenAdressing.ARRAY_ELEM_HEIGHT);
        this.cmd("SetText", this.hashTableVisual[index], "");
        this.cmd("Step");

        this.hashTableValues[index] = elem;
        this.empty[index] = false;
        this.deleted[index] = false;
        this.cmd("SetText", this.hashTableVisual[index], elem);
        this.cmd("SetText", this.messageID, `Inserting: ${elem}.  Element inserted!`);
        this.cmd("Step");
        this.cmd("SetHighlight", this.hashTableVisual[index], 0);
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
        this.empty[index] = true;
        this.deleted[index] = true;
        this.cmd("SetText", this.hashTableVisual[index], "<deleted>");
        this.cmd("SetText", this.messageID, `Deleting: ${elem}.  Element deleted!`);
        this.cmd("Step");
        this.cmd("SetHighlight", this.hashTableVisual[index], 0);
    }
    return this.commands;
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
        this.cmd("SetHighlight", this.hashTableVisual[index], 0);
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
    for (var i = 0; i < this.table_size; i++) {
        var candidateIndex = (index + this.getSkip(i, skipDelta)) % this.table_size;
        this.cmd("SetHighlight", this.hashTableVisual[candidateIndex], 1);
        this.cmd("Step");
        if (!this.empty[candidateIndex] && this.hashTableValues[candidateIndex] == elem) {
            foundIndex = candidateIndex;
            break;
        }
        this.cmd("SetHighlight", this.hashTableVisual[candidateIndex], 0);
        if (this.empty[candidateIndex] && !this.deleted[candidateIndex]) {
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
    for (var i = 0; i < this.table_size; i++) {
        var candidateIndex = (index + this.getSkip(i, skipDelta)) % this.table_size;
        this.cmd("SetHighlight", this.hashTableVisual[candidateIndex], 1);
        this.cmd("Step");
        if (this.empty[candidateIndex]) {
            foundIndex = candidateIndex;
            break;
        }
        this.cmd("SetHighlight", this.hashTableVisual[candidateIndex], 0);
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
