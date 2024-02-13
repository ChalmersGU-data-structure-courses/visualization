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

HashOpenAdrBuckets.ARRAY_ELEM_WIDTH = 90;
HashOpenAdrBuckets.ARRAY_ELEM_HEIGHT = 30;
HashOpenAdrBuckets.ARRAY_ELEM_START_X = 50;
HashOpenAdrBuckets.ARRAY_ELEM_START_Y = 100;
HashOpenAdrBuckets.ARRAY_VERTICAL_SEPARATION = 100;

HashOpenAdrBuckets.BUCKET_SIZE = 3;
HashOpenAdrBuckets.NUM_BUCKETS = 11;
HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE = 40;

HashOpenAdrBuckets.ARRAY_Y_POS = 350;

HashOpenAdrBuckets.INDEX_COLOR = "#0000FF";



HashOpenAdrBuckets.prototype.init = function(am)
{
    HashOpenAdrBuckets.superclass.init.call(this, am);
    this.setup();
}


HashOpenAdrBuckets.prototype.sizeChanged = function()
{
    this.setup();
}


HashOpenAdrBuckets.prototype.addControls = function()
{
    HashOpenAdrBuckets.superclass.addControls.call(this);
    // Add new controls here
}



HashOpenAdrBuckets.prototype.insertElement = function(elem)
{
    this.commands = new Array();
    this.cmd("SetText", this.ExplainLabel, "Inserting element: " + String(elem));
    var index = this.doHash(elem);

    var foundIndex = -1;
    for (var candidateIndex = index * HashOpenAdrBuckets.BUCKET_SIZE; candidateIndex < index * HashOpenAdrBuckets.BUCKET_SIZE + HashOpenAdrBuckets.BUCKET_SIZE; candidateIndex++) {
        this.cmd("SetHighlight", this.hashTableVisual[candidateIndex], 1);
        this.cmd("Step");
        this.cmd("SetHighlight", this.hashTableVisual[candidateIndex], 0);
        if (this.empty[candidateIndex]) {
            foundIndex = candidateIndex;
            break;
        }
    }
    if (foundIndex == -1) {
        for (candidateIndex = HashOpenAdrBuckets.BUCKET_SIZE * HashOpenAdrBuckets.NUM_BUCKETS; candidateIndex < HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE; candidateIndex++) {
            this.cmd("SetHighlight", this.hashTableVisual[candidateIndex], 1);
            this.cmd("Step");
            this.cmd("SetHighlight", this.hashTableVisual[candidateIndex], 0);

            if (this.empty[candidateIndex]) {
                foundIndex = candidateIndex;
                break;
            }
        }
    }

    if (foundIndex != -1) {
        var labID = this.nextIndex++;
        this.cmd("CreateLabel", labID, elem, 20, 25);
        this.cmd("Move", labID, this.indexXPos2[foundIndex], this.indexYPos2[foundIndex] - HashOpenAdrBuckets.ARRAY_ELEM_HEIGHT);
        this.cmd("Step");
        this.cmd("Delete", labID);
        this.cmd("SetText", this.hashTableVisual[foundIndex], elem);
        this.hashTableValues[foundIndex] = elem;
        this.empty[foundIndex] = false;
        this.deleted[foundIndex] = false;
    }

    this.cmd("SetText", this.ExplainLabel, "");

    return this.commands;
}


HashOpenAdrBuckets.prototype.getElemIndex = function(elem)
{
    var foundIndex = -1;
    var initialIndex = this.doHash(elem);

    for (var candidateIndex = initialIndex * HashOpenAdrBuckets.BUCKET_SIZE; candidateIndex < initialIndex* HashOpenAdrBuckets.BUCKET_SIZE + HashOpenAdrBuckets.BUCKET_SIZE; candidateIndex++) {
        this.cmd("SetHighlight", this.hashTableVisual[candidateIndex], 1);
        this.cmd("Step");
        this.cmd("SetHighlight", this.hashTableVisual[candidateIndex], 0);
        if (!this.empty[candidateIndex] && this.hashTableValues[candidateIndex] == elem) {
            return candidateIndex;
        }
        else if (this.empty[candidateIndex] && !this.deleted[candidateIndex]) {
            return -1;
        }
    }
    // Can only get this far if we didn't find the element we are looking for,
    //  *and* the bucekt was full -- look at overflow bucket.
    for (candidateIndex = HashOpenAdrBuckets.BUCKET_SIZE * HashOpenAdrBuckets.NUM_BUCKETS; candidateIndex < HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE; candidateIndex++) {
        this.cmd("SetHighlight", this.hashTableVisual[candidateIndex], 1);
        this.cmd("Step");
        this.cmd("SetHighlight", this.hashTableVisual[candidateIndex], 0);

        if (!this.empty[candidateIndex] && this.hashTableValues[candidateIndex] == elem) {
            return candidateIndex;
        }
        else if (this.empty[candidateIndex] && !this.deleted[candidateIndex]) {
            return -1;
        }
    }
    return -1;
}


HashOpenAdrBuckets.prototype.deleteElement = function(elem)
{
    this.commands = new Array();
    this.cmd("SetText", this.ExplainLabel, "Deleting element: " + elem);
    var index = this.getElemIndex(elem);

    if (index == -1) {
        this.cmd("SetText", this.ExplainLabel, "Deleting element: " + elem + "  Element not in table");
    }
    else {
        this.cmd("SetText", this.ExplainLabel, "Deleting element: " + elem + "  Element this.deleted");
        this.empty[index] = true;
        this.deleted[index] = true;
        this.cmd("SetText", this.hashTableVisual[index], "<deleted>");
    }

    return this.commands;
}


HashOpenAdrBuckets.prototype.findElement = function(elem)
{
    this.commands = new Array();
    this.cmd("SetText", this.ExplainLabel, "Finding Element: " + elem);
    var index = this.getElemIndex(elem);
    if (index == -1) {
        this.cmd("SetText", this.ExplainLabel, "Element " + elem + " not found");
    }
    else {
        this.cmd("SetText", this.ExplainLabel, "Element " + elem + " found");
    }
    return this.commands;
}


HashOpenAdrBuckets.prototype.setup = function()
{
    this.animationManager.resetAll();
    this.nextIndex = 0;

    var w = this.getCanvasWidth();
    this.elements_per_row = Math.floor(w / HashOpenAdrBuckets.ARRAY_ELEM_WIDTH) ;
    //this.POINTER_ARRAY_ELEM_Y = h - ClosedHashBucket.POINTER_ARRAY_ELEM_WIDTH;

    this.table_size = HashOpenAdrBuckets.NUM_BUCKETS;
    this.hashTableVisual = new Array(HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE);
    this.hashTableIndices = new Array(HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE);
    this.hashTableValues = new Array(HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE);

    this.indexXPos = new Array(HashOpenAdrBuckets.NUM_BUCKETS);
    this.indexYPos = new Array(HashOpenAdrBuckets.NUM_BUCKETS);

    this.indexXPos2 = new Array(HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE);
    this.indexYPos2 = new Array(HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE);

    this.empty = new Array(HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE);
    this.deleted = new Array(HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE);

    this.ExplainLabel = this.nextIndex++;

    this.commands = [];

    for (var i = 0; i < HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE; i++) {
        var nextID = this.nextIndex++;
        this.empty[i] = true;
        this.deleted[i] = false;

        var nextXPos = HashOpenAdrBuckets.ARRAY_ELEM_START_X + (i % this.elements_per_row) * HashOpenAdrBuckets.ARRAY_ELEM_WIDTH;
        var nextYPos = HashOpenAdrBuckets.ARRAY_ELEM_START_Y + Math.floor(i / this.elements_per_row) * HashOpenAdrBuckets.ARRAY_VERTICAL_SEPARATION;
        this.cmd("CreateRectangle", nextID, "", HashOpenAdrBuckets.ARRAY_ELEM_WIDTH, HashOpenAdrBuckets.ARRAY_ELEM_HEIGHT,nextXPos, nextYPos)
        this.hashTableVisual[i] = nextID;
        nextID = this.nextIndex++;
        this.hashTableIndices[i] = nextID;
        this.indexXPos2[i] = nextXPos;
        this.indexYPos2[i] = nextYPos + HashOpenAdrBuckets.ARRAY_ELEM_HEIGHT

        this.cmd("CreateLabel", nextID, i,this.indexXPos2[i],this.indexYPos2[i]);
        this.cmd("SetForegroundColor", nextID, HashOpenAdrBuckets.INDEX_COLOR);
    }

    for (i = 0; i <= HashOpenAdrBuckets.NUM_BUCKETS; i++) {
        nextID = this.nextIndex++;
        nextXPos = HashOpenAdrBuckets.ARRAY_ELEM_START_X + (i * 3 % this.elements_per_row) * HashOpenAdrBuckets.ARRAY_ELEM_WIDTH - HashOpenAdrBuckets.ARRAY_ELEM_WIDTH / 2;
        nextYPos = HashOpenAdrBuckets.ARRAY_ELEM_START_Y + Math.floor((i * 3) / this.elements_per_row) * HashOpenAdrBuckets.ARRAY_VERTICAL_SEPARATION + HashOpenAdrBuckets.ARRAY_ELEM_HEIGHT;
        this.cmd("CreateRectangle", nextID, "", 0, HashOpenAdrBuckets.ARRAY_ELEM_HEIGHT * 2,nextXPos, nextYPos)
        nextID = this.nextIndex++;
        if (i == HashOpenAdrBuckets.NUM_BUCKETS) {
            this.cmd("CreateLabel", nextID, "Overflow", nextXPos + 3, nextYPos + HashOpenAdrBuckets.ARRAY_ELEM_HEIGHT / 2 , 0);
        }
        else {
            this.indexXPos[i] =  nextXPos + 5;
            this.indexYPos[i] = nextYPos + HashOpenAdrBuckets.ARRAY_ELEM_HEIGHT / 2;
            this.cmd("CreateLabel", nextID, i, this.indexXPos[i],this.indexYPos[i], 0);
        }
    }

    this.cmd("CreateLabel", this.ExplainLabel, "", 10, 25, 0);
    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
    this.resetIndex = this.nextIndex;
}


HashOpenAdrBuckets.prototype.resetAll = function()
{
    this.commands = HashOpenAdrBuckets.superclass.resetAll.call(this);

    for (var i = 0; i < HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE; i++) {
        this.empty[i] = true;
        this.deleted[i] = false;
        this.cmd("SetText", this.hashTableVisual[i], "");
    }
    return this.commands;
    // Clear array, etc
}


// NEED TO OVERRIDE IN PARENT
HashOpenAdrBuckets.prototype.reset = function()
{
    for (var i = 0; i < HashOpenAdrBuckets.CLOSED_HASH_TABLE_SIZE; i++) {
        this.empty[i]= true;
        this.deleted[i] = false;
    }
    this.nextIndex = this.resetIndex ;
    HashOpenAdrBuckets.superclass.reset.call(this);

}


var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new HashOpenAdrBuckets(animManag);
}
