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



function HashSeparateChaining(am)
{
    // call superclass' constructor, which calls init
    HashSeparateChaining.superclass.constructor.call(this, am);
}
HashSeparateChaining.inheritFrom(Hash);


// Various constants

HashSeparateChaining.DEFAULT_TABLE_SIZE = 13;
HashSeparateChaining.TABLE_SIZES = [7, 13, 23];
HashSeparateChaining.TABLE_SIZE_LABELS = ["Small (7)", "Medium (13)", "Large (23)"];

HashSeparateChaining.NODE_INSERT_X = 100;
HashSeparateChaining.NODE_INSERT_Y = 75;

HashSeparateChaining.prototype.addControls = function()
{
    HashSeparateChaining.superclass.addControls.call(this);
    this.addBreakToAlgorithmBar();

    this.addLabelToAlgorithmBar("Table size:");
    this.sizeSelect = this.addSelectToAlgorithmBar(HashSeparateChaining.TABLE_SIZES, HashSeparateChaining.TABLE_SIZE_LABELS);
    this.sizeSelect.value = HashSeparateChaining.DEFAULT_TABLE_SIZE;
    this.sizeSelect.onchange = this.resetAll.bind(this);
}


HashSeparateChaining.prototype.resetAll = function()
{
    this.tableSize = parseInt(this.sizeSelect.value) || HashSeparateChaining.DEFAULT_TABLE_SIZE;
    HashSeparateChaining.superclass.resetAll.call(this);

    this.tableCells = new Array(this.tableSize);
    for (var i = 0; i < this.tableSize; i++) {
        this.tableCells[i] = null;
        this.cmd("SetNull", this.tableCellIDs[i], 1);
    }

    this.initialIndex = this.nextIndex;
    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}


HashSeparateChaining.prototype.reset = function()
{
    for (var i = 0; i < this.table_size; i++) {
        this.tableCells[i] = null;
    }
    this.nextIndex = this.initialIndex;
}


///////////////////////////////////////////////////////////////////////////////
// Calculating canvas positions and sizes

HashSeparateChaining.prototype.getCellPosX = function(i) 
{
    return (this.getCanvasWidth() + (2*i + 1 - this.tableSize) * this.getCellWidth()) / 2;
}

HashSeparateChaining.prototype.getCellPosY = function(i) 
{
    return Math.round(this.getCellIndexPosY(i) - this.getCellHeight() / 2 - 20);
}

HashSeparateChaining.prototype.getCellIndexPosY = function(i)
{
    return Math.round(this.getCanvasHeight() * 0.8);
}

HashSeparateChaining.prototype.getCellWidth = function()
{
    return Math.min(70, Math.round(this.getCanvasWidth() / (this.tableSize + 1)));
}

HashSeparateChaining.prototype.getCellHeight = function() 
{
    return Math.max(20, Math.round(this.getCellWidth() * 0.6));
}


///////////////////////////////////////////////////////////////////////////////
// Functions that do the actual work

HashSeparateChaining.prototype.printTable = function()
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
        var node = this.tableCells[i];
        while (node != null) {
            // MoveToAlignMiddle
            this.cmd("Move", this.highlightID, node.x, node.y);
            this.cmd("Step");

            var nextLabelID = this.nextIndex++;
            this.cmd("CreateLabel", nextLabelID, node.data, node.x, node.y);
            this.cmd("SetForegroundColor", nextLabelID, "blue");
            this.cmd("Move", nextLabelID, xPosOfNextLabel, yPosOfNextLabel);
            this.cmd("Step");
    
            xPosOfNextLabel += Hash.PRINT_HORIZONTAL_GAP;
            if (xPosOfNextLabel > this.print_max) {
                xPosOfNextLabel = Hash.FIRST_PRINT_POS_X;
                yPosOfNextLabel += Hash.PRINT_VERTICAL_GAP;
            }   
            node = node.next; 
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


HashSeparateChaining.prototype.clearTable = function()
{
    this.commands = [];
    for (var i = 0; i < this.tableCells.length; i++) {
        var node = this.tableCells[i];
        if (node != null) {
            while (node != null) {
                this.cmd("Delete", node.graphicID);
                node = node.next;
            }
            this.tableCells[i] = null;
            this.cmd("SetNull", this.tableCellIDs[i], 1);
        }
    }
    return this.commands;
}


HashSeparateChaining.prototype.insertElement = function(elem)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, `Inserting ${elem}`);

    var hash = this.getHashCode(elem);
    var index = this.getStartIndex(hash)

    var node = new LinkedListNode(elem, this.nextIndex++, 0, 0);
    this.cmd("CreateLinkedList", node.graphicID, elem, this.getCellWidth() * 0.8, this.getCellHeight(), 0, 0);
    this.cmd("AlignRight", node.graphicID, this.messageID);

    if (this.tableCells[index] != null) {
        this.cmd("Connect", node.graphicID, this.tableCells[index].graphicID);
        this.cmd("Disconnect", this.tableCellIDs[index], this.tableCells[index].graphicID);
    }
    else {
        this.cmd("SetNull", node.graphicID, 1);
        this.cmd("SetNull", this.tableCellIDs[index], 0);
    }
    this.cmd("Connect", this.tableCellIDs[index], node.graphicID);
    node.next = this.tableCells[index];
    this.tableCells[index] = node;

    this.repositionList(index);
    this.cmd("Step");
    this.cmd("SetText", this.messageID, `Inserted ${elem}.`);
    return this.commands;
}


HashSeparateChaining.prototype.deleteElement = function(elem)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, `Deleting ${elem}`);

    var hash = this.getHashCode(elem);
    var index = this.getStartIndex(hash)

    if (this.tableCells[index] == null) {
        this.cmd("SetText", this.messageID, `Deleting ${elem}: Element not found!`);
        return this.commands;
    }

    this.cmd("SetHighlight", this.tableCells[index].graphicID, 1);
    this.cmd("Step");
    this.cmd("SetHighlight", this.tableCells[index].graphicID, 0);
    if (this.tableCells[index].data == elem) {
        if (this.tableCells[index].next != null) {
            this.cmd("Connect", this.tableCellIDs[index], this.tableCells[index].next.graphicID);
        } else {
            this.cmd("SetNull", this.tableCellIDs[index], 1);
        }
        this.cmd("Delete", this.tableCells[index].graphicID);
        this.tableCells[index] = this.tableCells[index].next;
        this.repositionList(index);
        this.cmd("SetText", this.messageID, `Deleted ${elem}.`);
        return this.commands;
    }

    var prevNode = this.tableCells[index];
    var node = this.tableCells[index].next;
    while (node != null) {
        this.cmd("SetHighlight", node.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetHighlight", node.graphicID, 0);
        if (node.data == elem) {
            if (node.next != null) {
                this.cmd("Connect", prevNode.graphicID, node.next.graphicID);
            } else {
                this.cmd("SetNull", prevNode.graphicID, 1);
            }
            prevNode.next = prevNode.next.next;
            this.cmd("Delete", node.graphicID);
            this.repositionList(index);
            this.cmd("SetText", this.messageID, `Deleted ${elem}.`);
            return this.commands;
        }
        else {
            prevNode = node;
            node = node.next;
        }
    }

    this.cmd("SetText", this.messageID, `Deleting ${elem}: Element not found!`);
    return this.commands;
}


HashSeparateChaining.prototype.findElement = function(elem)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, `Finding ${elem}`);

    var hash = this.getHashCode(elem);
    var index = this.getStartIndex(hash)

    var node = this.tableCells[index];
    var found = false;
    while (node != null && !found) {
        this.cmd("SetHighlight", node.graphicID, 1);
        if (node.data == elem) {
            this.cmd("SetText", this.sndMessageID, `${node.data} == ${elem}`)
            found = true;
        } else {
            this.cmd("SetText", this.sndMessageID, `${node.data} != ${elem}`)
        }
        this.cmd("Step");
        this.cmd("SetHighlight", node.graphicID, 0);
        node = node.next;
    }
    this.cmd("SetText", this.sndMessageID, "");

    if (found) {
        this.cmd("SetText", this.messageID, `Found ${elem}.`);
    } else {
        this.cmd("SetText", this.messageID, `Finding ${elem}: Element not found!`);
    }
    return this.commands;
}


HashSeparateChaining.prototype.repositionList = function(index)
{
    if (this.tableCells[index] == null) return;
    var length = 0;
    for (var node = this.tableCells[index]; node != null; node = node.next) length++;
    var nodeSpacing = Math.min(2 * this.getCellHeight(), this.getCellPosY(index) / (length + 1));
    var x = this.getCellPosX(index);
    var y = this.getCellPosY(index) - nodeSpacing;
    var node = this.tableCells[index];
    while (node != null) {
        this.cmd("Move", node.graphicID, x, y);
        node.x = x;
        node.y = y;
        y -= nodeSpacing;
        node = node.next;
    }
}


///////////////////////////////////////////////////////////////////////////////
// Linked list nodes

function LinkedListNode(data, id, x, y)
{
    this.data = data;
    this.graphicID = id;
    this.x = x;
    this.y = y;
    this.next = null;
}


///////////////////////////////////////////////////////////////////////////////
// Initialization

var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new HashSeparateChaining(animManag);
}
