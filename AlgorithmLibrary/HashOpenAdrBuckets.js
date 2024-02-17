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


function HashOpenAdrBuckets(am)
{
    // call superclass' constructor, which calls init
    HashOpenAdrBuckets.superclass.constructor.call(this, am);
}
HashOpenAdrBuckets.inheritFrom(Hash);


// Various constants

// This is a special key and should not be possible to enter in the GUI:
HashOpenAdrBuckets.DELETED = "<deleted>";

HashOpenAdrBuckets.DEFAULT_TABLE_SIZE = 23;
HashOpenAdrBuckets.TABLE_SIZES = [13, 23, 41];
HashOpenAdrBuckets.TABLE_SIZE_LABELS = ["Small (13)", "Medium (23)", "Large (41)"];
HashOpenAdrBuckets.NUM_BUCKETS = {13: 5, 23: 6, 41: 11};

HashOpenAdrBuckets.ARRAY_ELEM_START_Y = 100;




HashOpenAdrBuckets.prototype.addControls = function()
{
    HashOpenAdrBuckets.superclass.addControls.call(this);
    this.addBreakToAlgorithmBar();

    this.addLabelToAlgorithmBar("Table size:");
    this.sizeSelect = this.addSelectToAlgorithmBar(HashOpenAdrBuckets.TABLE_SIZES, HashOpenAdrBuckets.TABLE_SIZE_LABELS);
    this.sizeSelect.value = HashOpenAdrBuckets.DEFAULT_TABLE_SIZE;
    this.sizeSelect.onchange = this.resetAll.bind(this);
}

HashOpenAdrBuckets.prototype.resetAll = function()
{
    this.tableSize = parseInt(this.sizeSelect?.value) || HashOpenAdrBuckets.DEFAULT_TABLE_SIZE;
    HashOpenAdrBuckets.superclass.resetAll.call(this);

    this.numBuckets = HashOpenAdrBuckets.NUM_BUCKETS[this.tableSize];
    this.bucketSize = Math.floor((this.tableSize-2) / this.numBuckets);

    this.tableCells = new Array(this.tableSize);
    for (var i = 0; i < this.tableSize; i++) {
        this.tableCells[i] = "";
    }

    for (i = 0; i <= this.numBuckets; i++) {
        var nextID = this.nextIndex++;
        this.cmd(
            "CreateRectangle", nextID, "", 
            0, 2.5 * this.getCellHeight(), 
            this.getBucketPosX(i), this.getBucketPosY(i),
            "center", "top"
        );
        var lblID = this.nextIndex++;
        var lbl = i < this.numBuckets ? i : "Overflow";
        this.cmd("CreateLabel", lblID, lbl, this.getBucketLabelX(i), this.getBucketLabelY(i), 0);
    }

    this.initialIndex = this.nextIndex;
    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}

HashOpenAdrBuckets.prototype.reset = function()
{
    for (var i = 0; i < this.tableSize; i++) {
        this.tableCells[i] = "";
    }
    this.nextIndex = this.initialIndex;
}


///////////////////////////////////////////////////////////////////////////////
// Calculating canvas positions and sizes

HashOpenAdrBuckets.prototype.getBucketPosX = function(i) 
{
    return this.getCellPosX(i * this.bucketSize) - this.getCellWidth()/2;
}

HashOpenAdrBuckets.prototype.getBucketPosY = function(i) 
{
    return this.getCellPosY(i * this.bucketSize) - this.getCellHeight()/2;
}

HashOpenAdrBuckets.prototype.getBucketLabelX = function(i) 
{
    return this.getBucketPosX(i) + 5;
}

HashOpenAdrBuckets.prototype.getBucketLabelY = function(i) 
{
    return this.getBucketPosY(i) + 2 * this.getCellHeight();
}

HashOpenAdrBuckets.prototype.getCellPosX = function(i) 
{
    return this.getCellPosXY(i).x;
}

HashOpenAdrBuckets.prototype.getCellPosY = function(i) 
{
    return this.getCellPosXY(i).y;
}

HashOpenAdrBuckets.prototype.getCellIndexPosY = function(i)
{
    return this.getCellPosY(i) + this.getCellHeight();
}

HashOpenAdrBuckets.prototype.getCellPosXY = function(i) 
{
    var startX = this.getCellWidth();
    var x = startX;
    var y = HashOpenAdrBuckets.ARRAY_ELEM_START_Y;
    for (var k = 0; k < i; k++) {
        x += this.getCellWidth();
        if (x + this.getCellWidth() > this.getCanvasWidth()) {
            x = startX;
            y += Math.round(4 * this.getCellHeight());
        }
    }
    return {x: x, y: y};
}

HashOpenAdrBuckets.prototype.getCellWidth = function()
{
    var nrows = 1;
    while (true) {
        var w = nrows * this.getCanvasWidth() / (this.tableSize + 2 * nrows);
        if (w >= 65 || nrows >= 4) return Math.round(w);
        nrows++;
    }
}

HashOpenAdrBuckets.prototype.getCellHeight = function() 
{
    return Math.round(this.getCellWidth() * 0.4);
}


///////////////////////////////////////////////////////////////////////////////
// Functions that do the actual work

HashOpenAdrBuckets.prototype.printTable = function()
{
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
        if (elem && elem !== HashOpenAdrBuckets.DELETED) {
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


HashOpenAdressing.prototype.clearTable = function()
{
    this.commands = [];
    for (var i = 0; i < this.tableCells.length; i++) {
        this.tableCells[i] = "";
        this.cmd("SetText", this.tableCellIDs[i], "");
    }
    return this.commands;
}


HashOpenAdrBuckets.prototype.insertElement = function(elem)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, `Inserting ${elem}`);

    var hash = this.getHashCode(elem);
    var bucket = this.getBucket(hash)
    var index = this.getEmptyIndex(bucket, elem);
    this.cmd("SetText", this.sndMessageID, "");

    if (index < 0) {
        this.cmd("SetText", this.messageID, `Inserting ${elem}: Buckets are full!`);
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
        this.cmd("SetText", this.tableCellIDs[index], elem);
        this.tableCells[index] = elem;
        this.cmd("Step");
        this.cmd("SetHighlight", this.tableCellIDs[index], 0);
    }
    return this.commands;
}



HashOpenAdrBuckets.prototype.deleteElement = function(elem)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, `Deleting: ${elem}`);

    var hash = this.getHashCode(elem);
    var bucket = this.getBucket(hash)
    var index = this.getElemIndex(bucket, elem);
    this.cmd("SetText", this.sndMessageID, "");

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


HashOpenAdrBuckets.prototype.findElement = function(elem)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, `Finding ${elem}`);

    var hash = this.getHashCode(elem);
    var bucket = this.getBucket(hash)
    var index = this.getElemIndex(bucket, elem);
    this.cmd("SetText", this.sndMessageID, "");

    if (index < 0) {
        this.cmd("SetText", this.messageID, `Finding ${elem}: Element not found!`);
    }
    else {
        this.cmd("SetText", this.messageID, `Found ${elem}.`);
        this.cmd("Step");
        this.cmd("SetHighlight", this.tableCellIDs[index], 0);
    }
    return this.commands;
}


Hash.prototype.getBucket = function(hash)
{
    var bucket = hash % this.numBuckets;

    var labelID = this.nextIndex++;
    var labelID2 = this.nextIndex++;
    var highlightID = this.nextIndex++;

    var lblText = `    ${hash} % ${this.tableSize}  =  `;
    this.cmd("CreateLabel", labelID, lblText, Hash.HASH_MOD_X, Hash.HASH_NUMBER_START_Y, 0);
    this.cmd("CreateLabel", labelID2, "", 0, 0);
    this.cmd("AlignRight", labelID2, labelID);
    this.cmd("Settext", labelID, lblText + bucket);
    this.cmd("Step");

    this.cmd("CreateHighlightCircle", highlightID, Hash.HIGHLIGHT_COLOR, 0, 0);
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


HashOpenAdrBuckets.prototype.getBucketIndices = function(bucket)
{
    if (bucket < 0) bucket = this.numBuckets;
    var len = this.bucketSize;
    var start = bucket * len;
    if (bucket >= this.numBuckets) len = this.tableSize - start;
    return Array.from({length: len}, (_, i) => i + start);
}


HashOpenAdrBuckets.prototype.getElemIndex = function(bucket, elem)
{
    this.cmd("SetText", this.sndMessageID, `Searching in bucket ${bucket}.`);
    for (var i of this.getBucketIndices(bucket)) {
        this.cmd("SetHighlight", this.tableCellIDs[i], 1);
        this.cmd("Step");
        if (this.tableCells[i] == elem) return i;
        this.cmd("SetHighlight", this.tableCellIDs[i], 0);
        if (!this.tableCells[i]) return -1;
    }
    // Can only get this far if we didn't find the element we are looking for,
    //  *and* the bucket was full -- look at overflow bucket.
    this.cmd("SetText", this.sndMessageID, "Bucket is full - searching the overflow bucket.");
    for (var i of this.getBucketIndices(-1)) {
        this.cmd("SetHighlight", this.tableCellIDs[i], 1);
        this.cmd("Step");
        if (this.tableCells[i] == elem) return i;
        this.cmd("SetHighlight", this.tableCellIDs[i], 0);
        if (!this.tableCells[i]) return -1;
    }
    return -1;
}

HashOpenAdrBuckets.prototype.getEmptyIndex = function(bucket)
{
    this.cmd("SetText", this.sndMessageID, `Searching in bucket ${bucket}.`);
    for (var i of this.getBucketIndices(bucket)) {
        this.cmd("SetHighlight", this.tableCellIDs[i], 1);
        this.cmd("Step");
        this.cmd("SetHighlight", this.tableCellIDs[i], 0);
        if (!this.tableCells[i]) return i;
    }
    // Can only get this far if we didn't find any empty cell -- look at overflow bucket.
    this.cmd("SetText", this.sndMessageID, "Bucket is full - searching the overflow bucket.");
    for (var i of this.getBucketIndices(-1)) {
        this.cmd("SetHighlight", this.tableCellIDs[i], 1);
        this.cmd("Step");
        this.cmd("SetHighlight", this.tableCellIDs[i], 0);
        if (!this.tableCells[i]) return i;
    }
}


///////////////////////////////////////////////////////////////////////////////
// Initialization

var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new HashOpenAdrBuckets(animManag);
}
