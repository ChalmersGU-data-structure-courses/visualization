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



BTree.FIRST_PRINT_POS_X = 50;
BTree.PRINT_VERTICAL_GAP = 20;
BTree.PRINT_MAX = 990;
BTree.PRINT_HORIZONTAL_GAP = 50;

BTree.MAX_DEGREES = [3, 4, 5, 6, 7];
BTree.INITIAL_MAX_DEGREE = 3;

BTree.HEIGHT_DELTA = 50;
BTree.NODE_SPACING = 3;
BTree.STARTING_Y = 30;
BTree.WIDTH_PER_ELEM = 40;
BTree.NODE_HEIGHT = 20;

BTree.MESSAGE_X = 5;
BTree.MESSAGE_Y = 10;

BTree.LINK_COLOR = "#007700";
BTree.HIGHLIGHT_CIRCLE_COLOR = "#007700";
BTree.FOREGROUND_COLOR = "#007700";
BTree.BACKGROUND_COLOR = "#EEFFEE";
BTree.PRINT_COLOR = BTree.FOREGROUND_COLOR;



function BTree(am, max_degree)
{
    this.initial_max_degree = max_degree || BTree.INITIAL_MAX_DEGREE;
    this.init(am);
}
BTree.inheritFrom(Algorithm);


BTree.prototype.init = function(am)
{
    BTree.superclass.init.call(this, am);
    this.addControls();
    this.setup();
}


BTree.prototype.setup = function() 
{
    this.nextIndex = 0;
    this.commands = [];
    this.messageID = this.nextIndex++;
    this.cmd("CreateLabel", this.messageID, "", BTree.MESSAGE_X, BTree.MESSAGE_Y, 0);
    this.moveLabel1ID = this.nextIndex++;
    this.moveLabel2ID = this.nextIndex++;

    this.initialIndex = this.nextIndex;
    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();

    this.updateMaxDegree();
    this.sizeChanged();
}


BTree.prototype.sizeChanged = function()
{
    var w = this.getCanvasWidth();
    var h = this.getCanvasHeight();

    this.starting_x = w / 2;
    this.first_print_pos_y = h - 3 * BTree.PRINT_VERTICAL_GAP;
    this.xPosOfNextLabel = 100;
    this.yPosOfNextLabel = 200;

    this.implementAction(() => {
        this.commands = [];
        this.resizeTree();
        return this.commands;
    });
}


BTree.prototype.addControls = function()
{
    this.insertField = this.addControlToAlgorithmBar("Text", "");
    this.insertField.onkeydown = this.returnSubmit(this.insertField,  this.insertCallback.bind(this), 4);
    this.insertButton = this.addControlToAlgorithmBar("Button", "Insert");
    this.insertButton.onclick = this.insertCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.deleteField = this.addControlToAlgorithmBar("Text", "");
    this.deleteField.onkeydown = this.returnSubmit(this.deleteField,  this.deleteCallback.bind(this), 4);
    this.deleteButton = this.addControlToAlgorithmBar("Button", "Delete");
    this.deleteButton.onclick = this.deleteCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.findField = this.addControlToAlgorithmBar("Text", "");
    this.findField.onkeydown = this.returnSubmit(this.findField,  this.findCallback.bind(this), 4);

    this.findButton = this.addControlToAlgorithmBar("Button", "Find");
    this.findButton.onclick = this.findCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.printButton = this.addControlToAlgorithmBar("Button", "Print");
    this.printButton.onclick = this.printCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.clearButton = this.addControlToAlgorithmBar("Button", "Clear");
    this.clearButton.onclick = this.clearCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.maxDegreeSelect = this.addSelectToAlgorithmBar(
        BTree.MAX_DEGREES,
        BTree.MAX_DEGREES.map((d) => `Max. degree ${d}`)
    );
    this.maxDegreeSelect.value = this.initial_max_degree;
    this.maxDegreeSelect.onchange = this.maxDegreeChangedHandler.bind(this);
    this.addBreakToAlgorithmBar();

    this.premptiveSplitBox = this.addCheckboxToAlgorithmBar("Preemtive split/merge");
}


BTree.prototype.reset = function()
{
    this.nextIndex = this.initialIndex;
    this.updateMaxDegree();
    this.treeRoot = null;
}


BTree.prototype.preemptiveSplit = function()
{
    return this.premptiveSplitBox.checked;
}

BTree.prototype.updateMaxDegree = function() {
    maxDegree = parseInt(this.maxDegreeSelect.value) || this.initial_max_degree;
    var preemptiveSplitDisabled = maxDegree % 2 != 0;
    if (preemptiveSplitDisabled && this.preemptiveSplit()) {
        this.premptiveSplitBox.checked = false;
    }
    this.premptiveSplitBox.disabled = preemptiveSplitDisabled;
}

BTree.prototype.getMaxDegree = function() {
    return parseInt(this.maxDegreeSelect.value);
}

BTree.prototype.getMaxKeys = function() {
    return this.getMaxDegree() - 1;
}

BTree.prototype.getMinKeys = function() {
    return Math.floor((this.getMaxDegree() + 1) / 2) - 1;
}

BTree.prototype.getSplitIndex = function() {
    return Math.floor((this.getMaxDegree() - 1) / 2);
}


BTree.prototype.maxDegreeChangedHandler = function(event)
{
    this.implementAction(this.clearTree.bind(this));
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}


BTree.prototype.insertCallback = function(event)
{
    var insertedValue = this.normalizeNumber(this.insertField.value.toUpperCase());
    if (insertedValue != "") {
        this.insertField.value = "";
        this.implementAction(this.insertElement.bind(this), insertedValue);
    }
}

BTree.prototype.deleteCallback = function(event)
{
    var deletedValue = this.normalizeNumber(this.deleteField.value.toUpperCase());
    if (deletedValue != "") {
        this.deleteField.value = "";
        this.implementAction(this.deleteElement.bind(this),deletedValue);
    }
}

BTree.prototype.clearCallback = function(event)
{
    this.implementAction(this.clearTree.bind(this), "");
}


BTree.prototype.printCallback = function(event)
{
    this.implementAction(this.printTree.bind(this),"");
}


BTree.prototype.printTree = function(unused)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, "Printing tree");
    var firstLabel = this.nextIndex;

    this.xPosOfNextLabel = BTree.FIRST_PRINT_POS_X;
    this.yPosOfNextLabel = this.first_print_pos_y;

    this.printTreeRec(this.treeRoot);
    this.cmd("Step");
    for (var i = firstLabel; i < this.nextIndex; i++) {
        this.cmd("Delete", i);
    }
    this.nextIndex = firstLabel;
    this.cmd("SetText", this.messageID, "");
    return this.commands;
}


BTree.prototype.printTreeRec = function (tree)
{
    this.cmd("SetHighlight", tree.graphicID, 1);
    var nextLabelID;
    if (tree.isLeaf) {
        for (var i = 0; i < tree.numKeys;i++) {
            nextLabelID = this.nextIndex++;
            this.cmd("CreateLabel", nextLabelID, tree.keys[i], this.getLabelX(tree, i), tree.y);
            this.cmd("SetForegroundColor", nextLabelID, BTree.PRINT_COLOR);
            this.cmd("Move", nextLabelID, this.xPosOfNextLabel, this.yPosOfNextLabel);
            this.cmd("Step");
            this.xPosOfNextLabel +=  BTree.PRINT_HORIZONTAL_GAP;
            if (this.xPosOfNextLabel > BTree.PRINT_MAX) {
                this.xPosOfNextLabel = BTree.FIRST_PRINT_POS_X;
                this.yPosOfNextLabel += BTree.PRINT_VERTICAL_GAP;
            }
        }
        this.cmd("SetHighlight", tree.graphicID, 0);
    }
    else {
        this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[0].graphicID, 1);
        this.cmd("Step");
        this.cmd("SetHighlight", tree.graphicID, 0);
        this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[0].graphicID, 0);
        this.printTreeRec(tree.children[0]);
        for (i = 0; i < tree.numKeys; i++) {
            this.cmd("SetHighlight", tree.graphicID, 1);
            nextLabelID = this.nextIndex++;
            this.cmd("CreateLabel", nextLabelID, tree.keys[i], this.getLabelX(tree, i), tree.y);
            this.cmd("SetForegroundColor", nextLabelID, BTree.PRINT_COLOR);
            this.cmd("Move", nextLabelID, this.xPosOfNextLabel, this.yPosOfNextLabel);
            this.cmd("Step");
            this.xPosOfNextLabel +=  BTree.PRINT_HORIZONTAL_GAP;
            if (this.xPosOfNextLabel > BTree.PRINT_MAX) {
                this.xPosOfNextLabel = BTree.FIRST_PRINT_POS_X;
                this.yPosOfNextLabel += BTree.PRINT_VERTICAL_GAP;
            }
            this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i+1].graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i+1].graphicID, 0);
            this.printTreeRec(tree.children[i+1]);
        }
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetHighlight", tree.graphicID, 0);
    }
}


BTree.prototype.clearTree = function(ignored)
{
    this.updateMaxDegree();
    this.commands = [];
    this.deleteTree(this.treeRoot);
    this.treeRoot = null;
    this.nextIndex = this.initialIndex;
    return this.commands;
}


BTree.prototype.deleteTree = function(tree)
{
    if (tree != null) {
        if (!tree.isLeaf) {
            for (var i = 0; i <= tree.numKeys; i++) {
                this.cmd("Disconnect", tree.graphicID, tree.children[i].graphicID);
                this.deleteTree(tree.children[i]);
                tree.children[i] == null;
            }
        }
        this.cmd("Delete", tree.graphicID);
    }
}


BTree.prototype.changeDegree = function()
{
    this.updateMaxDegree();
    this.commands = [];
    this.deleteTree(this.treeRoot);
    this.treeRoot = null;
    this.nextIndex = this.initialIndex;
    if (this.commands.length == 0) {
        this.cmd("Step");
    }
    return this.commands;
}


BTree.prototype.findCallback = function(event)
{
    var findValue = this.normalizeNumber(this.findField.value.toUpperCase());
    if (findValue != "") {
        this.findField.value = "";
        this.implementAction(this.findElement.bind(this),findValue);
    }
}


BTree.prototype.findElement = function(findValue)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, `Finding ${findValue}`);
    this.findInTree(this.treeRoot, findValue);
    return this.commands;
}


BTree.prototype.findInTree = function(tree, val)
{
    if (tree != null) {
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("Step");
        var i = 0; 
        while (i < tree.numKeys && this.compare(tree.keys[i], val) < 0)
            i++;
        if (i == tree.numKeys) {
            if (!tree.isLeaf) {
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[tree.numKeys].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[tree.numKeys].graphicID, 0);
                this.findInTree(tree.children[tree.numKeys], val);
            }
            else {
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetText", this.messageID, `Element ${val} is not in the tree`);
            }
        }
        else if (this.compare(tree.keys[i], val) > 0) {
            if (!tree.isLeaf) {
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 0);
                this.findInTree(tree.children[i], val);
            }
            else {
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetText", this.messageID, `Element ${val} is not in the tree`);
            }
        }
        else {
            this.cmd("SetTextColor", tree.graphicID, "#FF0000", i);
            this.cmd("SetText", this.messageID, `Element ${val} found`);
            this.cmd("Step");
            this.cmd("SetTextColor", tree.graphicID, BTree.FOREGROUND_COLOR, i);
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("Step");
        }
    }
    else {
        this.cmd("SetText", this.messageID, `Element ${val} is not in the tree`);
    }
}


BTree.prototype.insertElement = function(insertedValue)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, `Inserting ${insertedValue}`);
    this.cmd("Step");

    if (this.treeRoot == null) {
        this.treeRoot = new BTreeNode(this.nextIndex++, this.starting_x, BTree.STARTING_Y);
        this.cmd(
            "CreateBTreeNode",
            this.treeRoot.graphicID,
            BTree.WIDTH_PER_ELEM, BTree.NODE_HEIGHT,
            1,
            this.starting_x,
            BTree.STARTING_Y,
            BTree.BACKGROUND_COLOR,
            BTree.FOREGROUND_COLOR
        );
        this.treeRoot.keys[0] = insertedValue;
        this.cmd("SetText", this.treeRoot.graphicID, insertedValue, 0);
    }
    else {
        if (this.preemptiveSplit()) {
            if (this.treeRoot.numKeys == this.getMaxKeys()) {
                this.split(this.treeRoot)
                this.resizeTree();
                this.cmd("Step");
            }
            this.insertNotFull(this.treeRoot, insertedValue);
        }
        else {
            this.insert(this.treeRoot, insertedValue);
        }
        if (!this.treeRoot.isLeaf) {
            this.resizeTree();
        }
    }
    this.cmd("SetText", this.messageID, "");
    this.validateTree();
    return this.commands;
}


BTree.prototype.insertNotFull = function(tree, insertValue)
{
    this.cmd("SetHighlight", tree.graphicID, 1);
    this.cmd("Step");
    if (tree.isLeaf) {
        this.cmd("SetText", this.messageID, `Inserting ${insertValue} into the leaf node ${tree}`);
        tree.numKeys++;
        this.cmd("SetNumElements", tree.graphicID, tree.numKeys);
        var insertIndex = tree.numKeys - 1;
        while (insertIndex > 0 && this.compare(tree.keys[insertIndex - 1], insertValue) > 0) {
            tree.keys[insertIndex] = tree.keys[insertIndex - 1];
            this.cmd("SetText", tree.graphicID, tree.keys[insertIndex], insertIndex);
            insertIndex--;
        }
        tree.keys[insertIndex] = insertValue;
        this.cmd("SetText", tree.graphicID, tree.keys[insertIndex], insertIndex);
        this.cmd("SetHighlight", tree.graphicID, 0);
        this.resizeTree();
    }
    else {
        var findIndex = 0;
        while (findIndex < tree.numKeys && this.compare(tree.keys[findIndex], insertValue) < 0) {
            findIndex++;
        }
        this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[findIndex].graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[findIndex].graphicID, 0);
        this.cmd("SetHighlight", tree.graphicID, 0);
        if (tree.children[findIndex].numKeys == this.getMaxKeys()) {
            var newTree = this.split(tree.children[findIndex]);
            this.resizeTree();
            this.cmd("Step");
            this.insertNotFull(newTree, insertValue);
        }
        else {
            this.insertNotFull(tree.children[findIndex], insertValue);
        }
    }
}


BTree.prototype.insert = function(tree, insertValue)
{
    this.cmd("SetHighlight", tree.graphicID, 1);
    this.cmd("Step");
    if (tree.isLeaf) {
        this.cmd("SetText", this.messageID, `Inserting ${insertValue} into the leaf node ${tree}`);
        tree.numKeys++;
        this.cmd("SetNumElements", tree.graphicID, tree.numKeys);
        var insertIndex = tree.numKeys - 1;
        while (insertIndex > 0 && this.compare(tree.keys[insertIndex - 1], insertValue) > 0) {
            tree.keys[insertIndex] = tree.keys[insertIndex - 1];
            this.cmd("SetText", tree.graphicID, tree.keys[insertIndex], insertIndex);
            insertIndex--;
        }
        tree.keys[insertIndex] = insertValue;
        this.cmd("SetText", tree.graphicID, tree.keys[insertIndex], insertIndex);
        this.cmd("SetHighlight", tree.graphicID, 0);
        this.resizeTree();
        this.insertRepair(tree);
    }
    else {
        var findIndex = 0;
        while (findIndex < tree.numKeys && this.compare(tree.keys[findIndex], insertValue) < 0) {
            findIndex++;
        }
        this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[findIndex].graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[findIndex].graphicID, 0);
        this.cmd("SetHighlight", tree.graphicID, 0);
        this.insert(tree.children[findIndex], insertValue);
    }
}


BTree.prototype.insertRepair = function(tree)
{
    if (tree.numKeys <= this.getMaxKeys()) {
        return;
    }
    else if (tree.parent == null) {
        this.treeRoot = this.split(tree);
        return;
    }
    else {
        var newNode = this.split(tree);
        this.insertRepair(newNode);
    }
}


BTree.prototype.split = function(tree)
{
    this.cmd("SetText", this.messageID, `Node ${tree} contains too many keys: splitting it`);
    this.cmd("SetHighlight", tree.graphicID, 1);
    this.cmd("Step");
    this.cmd("SetHighlight", tree.graphicID, 0);
    var rightNode = new BTreeNode(this.nextIndex++, tree.x + 100, tree.y);
    var risingNode = tree.keys[this.getSplitIndex()];

    if (tree.parent != null) {
        var currentParent = tree.parent;
        var parentIndex = 0; 
        while (parentIndex < currentParent.numKeys + 1 && currentParent.children[parentIndex] != tree) parentIndex++;
        if (parentIndex == currentParent.numKeys + 1) {
            throw new Error("Couldn't find which child we were!");
        }
        this.cmd("SetNumElements", currentParent.graphicID, currentParent.numKeys + 1);
        for (i = currentParent.numKeys; i > parentIndex; i--) {
            currentParent.children[i+1] = currentParent.children[i];
            this.cmd("Disconnect", currentParent.graphicID, currentParent.children[i].graphicID);
            this.cmd(
                "Connect", 
                currentParent.graphicID, 
                currentParent.children[i].graphicID, 
                BTree.FOREGROUND_COLOR,
                0,   // Curve
                0,   // Directed
                "",  // Label
                i+1  // Connection Point
            );
            currentParent.keys[i] = currentParent.keys[i-1];
            this.cmd("SetText", currentParent.graphicID, currentParent.keys[i], i);
        }
        currentParent.numKeys++;
        currentParent.keys[parentIndex] = risingNode;
        this.cmd("SetText", currentParent.graphicID, "", parentIndex);
        this.moveLabel1ID = this.nextIndex++;
        this.cmd("CreateLabel", this.moveLabel1ID, risingNode, this.getLabelX(tree, this.getSplitIndex()), tree.y)
        this.cmd("SetForegroundColor", this.moveLabel1ID, BTree.FOREGROUND_COLOR);
        this.cmd("Move", this.moveLabel1ID,  this.getLabelX(currentParent, parentIndex),  currentParent.y)
        currentParent.children[parentIndex+1] = rightNode;
        rightNode.parent = currentParent;
    }

    rightNode.numKeys = tree.numKeys - this.getSplitIndex() - 1;
    this.cmd(
        "CreateBTreeNode",
        rightNode.graphicID,
        BTree.WIDTH_PER_ELEM, 
        BTree.NODE_HEIGHT,
        rightNode.numKeys,
        tree.x,
        tree.y,
        BTree.BACKGROUND_COLOR,
        BTree.FOREGROUND_COLOR
    );
    for (var i = this.getSplitIndex() + 1; i < tree.numKeys + 1; i++) {
        var j = i - this.getSplitIndex() - 1;
        if (i < tree.numKeys) {
            rightNode.keys[j] = tree.keys[i];
            this.cmd("SetText", rightNode.graphicID, rightNode.keys[j], j);
        }
        if (tree.children[i] != null) {
            rightNode.children[j] = tree.children[i];
            rightNode.isLeaf = false;
            this.cmd("Disconnect", tree.graphicID, tree.children[i].graphicID);
            this.cmd(
                "Connect", 
                rightNode.graphicID,
                rightNode.children[j].graphicID,
                BTree.FOREGROUND_COLOR,
                0,   // Curve
                0,   // Directed
                "",  // Label
                j    // Connection Point
            );
            tree.children[i].parent = rightNode;
        }
    }
    for (var i = tree.numKeys - 1; i >= this.getSplitIndex(); i--) {
        this.cmd("SetText", tree.graphicID, "", i);  // TO MAKE UNDO WORK
        tree.children.pop();
        tree.keys.pop();
        tree.numKeys--;        
    }
    this.cmd("SetNumElements", tree.graphicID, this.getSplitIndex());
    var leftNode = tree;

    if (tree.parent != null) {
        this.cmd(
            "Connect", 
            currentParent.graphicID, 
            rightNode.graphicID, 
            BTree.FOREGROUND_COLOR,
            0,   // Curve
            0,   // Directed
            "",  // Label
            parentIndex + 1  // Connection Point
        );
        this.resizeTree();
        this.cmd("Step")
        this.cmd("Delete", this.moveLabel1ID);
        this.cmd("SetText", currentParent.graphicID, risingNode, parentIndex);
        return tree.parent;
    }
    else {  // if (tree.parent == null)
        this.treeRoot = new BTreeNode(this.nextIndex++, this.starting_x, BTree.STARTING_Y);
        this.cmd(
            "CreateBTreeNode",
            this.treeRoot.graphicID,
            BTree.WIDTH_PER_ELEM,
            BTree.NODE_HEIGHT,
            1,
            this.starting_x,
            BTree.STARTING_Y,
            BTree.BACKGROUND_COLOR,
            BTree.FOREGROUND_COLOR
        );
        this.treeRoot.keys[0] = risingNode;
        this.cmd("SetText", this.treeRoot.graphicID, risingNode, 0);
        this.treeRoot.children[0] = leftNode;
        this.treeRoot.children[1] = rightNode;
        leftNode.parent = this.treeRoot;
        rightNode.parent = this.treeRoot;
        this.cmd(
            "Connect", 
            this.treeRoot.graphicID, 
            leftNode.graphicID, 
            BTree.FOREGROUND_COLOR,
            0,  // Curve
            0,  // Directed
            "", // Label
            0   // Connection Point
        );
        this.cmd(
            "Connect", 
            this.treeRoot.graphicID, 
            rightNode.graphicID, 
            BTree.FOREGROUND_COLOR,
            0,  // Curve
            0,  // Directed
            "", // Label
            1   // Connection Point
        );
        this.treeRoot.isLeaf = false;
        return this.treeRoot;
    }
}


BTree.prototype.deleteElement = function(deletedValue)
{
    this.commands = [];
    this.cmd("SetText", 0, "Deleting "+deletedValue);
    this.cmd("Step");
    this.cmd("SetText", 0, "");
    this.highlightID = this.nextIndex++;
    if (this.preemptiveSplit()) {
        this.doDeleteNotEmpty(this.treeRoot, deletedValue);
    }
    else {
        this.doDelete(this.treeRoot, deletedValue);
    }
    if (this.treeRoot && this.treeRoot.numKeys == 0) {
        this.cmd("Step");
        this.cmd("Delete", this.treeRoot.graphicID);
        this.treeRoot = this.treeRoot.children[0];
        this.treeRoot.parent = null;
        this.resizeTree();
    }
    this.validateTree();
    return this.commands;
}


BTree.prototype.doDeleteNotEmpty = function(tree, val)
{
    if (tree != null) {
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("Step");
        var i = 0; 
        while (i < tree.numKeys && this.compare(tree.keys[i], val) < 0) i++;
        if (i == tree.numKeys) {
            if (!tree.isLeaf) {
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[tree.numKeys].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[tree.numKeys].graphicID, 0);

                if (tree.children[tree.numKeys].numKeys == this.getMinKeys()) {
                    var nextNode;
                    if (tree.children[tree.numKeys - 1].numKeys > this.getMinKeys()) {
                        nextNode = this.stealFromLeft(tree.children[tree.numKeys], tree.numKeys)
                        this.doDeleteNotEmpty(nextNode, val);
                    }
                    else {
                        nextNode = this.mergeRight(tree.children[tree.numKeys - 1])
                        this.doDeleteNotEmpty(nextNode, val);
                    }
                }
                else {
                    this.doDeleteNotEmpty(tree.children[tree.numKeys], val);
                }
            }
            else {
                this.cmd("SetHighlight", tree.graphicID, 0);
            }
        }
        else if (this.compare(tree.keys[i], val) > 0) {
            if (!tree.isLeaf) {
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 0);

                if (tree.children[i].numKeys > this.getMinKeys()) {
                    this.doDeleteNotEmpty(tree.children[i], val);
                }
                else {
                    if (tree.children[i+1].numKeys > this.getMinKeys()) {
                        nextNode = this.stealFromRight(tree.children[i], i);
                        this.doDeleteNotEmpty(nextNode, val);
                    }
                    else {
                        nextNode = this.mergeRight(tree.children[i]);
                        this.doDeleteNotEmpty(nextNode, val);
                    }
                }
            }
            else {
                this.cmd("SetHighlight", tree.graphicID, 0);
            }
        }
        else {
            this.cmd("SetTextColor", tree.graphicID, "FF0000", i);
            this.cmd("Step");
            if (tree.isLeaf) {
                this.cmd("SetTextColor", tree.graphicID, BTree.FOREGROUND_COLOR, i);
                for (var j = i; j < tree.numKeys - 1; j++) {
                    tree.keys[j] = tree.keys[j+1];
                    this.cmd("SetText", tree.graphicID, tree.keys[j], j);
                }
                tree.children.pop();
                tree.keys.pop();
                tree.numKeys--;
                this.cmd("SetText", tree.graphicID, "", tree.numKeys);
                this.cmd("SetNumElements", tree.graphicID, tree.numKeys);
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.resizeTree();
                this.cmd("SetText", this.messageID, "");
            }
            else {
                this.cmd("SetText", this.messageID, "Checking to see if tree to left of \nelement to delete has an extra key");
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 0);
                var maxNode = tree.children[i];

                if (tree.children[i].numKeys == this.getMinKeys()) {
                    this.cmd("SetText", this.messageID,
                             "Tree to left of element to delete does not have an extra key. \nLooking to the right ...");
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i+1].graphicID, 1);
                    this.cmd("Step");
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i + 1].graphicID, 0);
                    // Trees to left and right of node to delete don't have enough keys
                    // Do a merge, and then recursively delete the element
                    if (tree.children[i+1].numKeys == this.getMinKeys()) {
                        this.cmd("SetText", this.messageID,
                                 "Neither subtree has extra nodes. Merging around the key to delete, \nand recursively deleting ...");
                        this.cmd("Step");
                        this.cmd("SetTextColor", tree.graphicID, BTree.FOREGROUND_COLOR, i);
                        nextNode = this.mergeRight(tree.children[i]);
                        this.doDeleteNotEmpty(nextNode, val);
                        return;
                    }
                    else {
                        this.cmd("SetText", this.messageID,
                                 "Tree to right of element to delete does have an extra key. \nFinding the smallest key in that subtree ...");
                        this.cmd("Step");

                        var minNode = tree.children[i+1];
                        while (!minNode.isLeaf) {
                            this.cmd("SetHighlight", minNode.graphicID, 1);
                            this.cmd("Step")
                            this.cmd("SetHighlight", minNode.graphicID, 0);
                            if (minNode.children[0].numKeys == this.getMinKeys()) {
                                if (minNode.children[1].numKeys == this.getMinKeys()) {
                                    minNode = this.mergeRight(minNode.children[0]);
                                }
                                else {
                                    minNode = this.stealFromRight(minNode.children[0], 0);
                                }
                            }
                            else {
                                minNode = minNode.children[0];
                            }
                        }

                        this.cmd("SetHighlight", minNode.graphicID, 1);
                        tree.keys[i] = minNode.keys[0];
                        this.cmd("SetTextColor", tree.graphicID, BTree.FOREGROUND_COLOR, i);
                        this.cmd("SetText", tree.graphicID, "", i);
                        this.cmd("SetText", minNode.graphicID, "", 0);

                        this.cmd("CreateLabel", this.moveLabel1ID, minNode.keys[0], this.getLabelX(minNode, 0),  minNode.y)
                        this.cmd("Move", this.moveLabel1ID, this.getLabelX(tree, i), tree.y);
                        this.cmd("Step");
                        this.cmd("Delete", this.moveLabel1ID);
                        this.cmd("SetText", tree.graphicID, tree.keys[i], i);
                        for (i = 1; i < minNode.numKeys; i++) {
                            minNode.keys[i-1] = minNode.keys[i]
                            this.cmd("SetText", minNode.graphicID, minNode.keys[i-1], i - 1);
                        }
                        this.cmd("SetText", minNode.graphicID, "",minNode.numKeys - 1);

                        minNode.children.pop();
                        minNode.keys.pop();
                        minNode.numKeys--;
                        this.cmd("SetHighlight", minNode.graphicID, 0);
                        this.cmd("SetHighlight", tree.graphicID, 0);

                        this.cmd("SetNumElements", minNode.graphicID, minNode.numKeys);
                        this.resizeTree();
                        this.cmd("SetText", this.messageID, "");
                    }
                }
                else {
                    this.cmd("SetText", this.messageID,
                             "Tree to left of element to delete does have an extra key. \nFinding the largest key in that subtree ...");
                    this.cmd("Step");
                    while (!maxNode.isLeaf) {
                        this.cmd("SetHighlight", maxNode.graphicID, 1);
                        this.cmd("Step")
                        this.cmd("SetHighlight", maxNode.graphicID, 0);
                        if (maxNode.children[maxNode.numKeys].numKeys == this.getMinKeys()) {
                            if (maxNode.children[maxNode.numKeys - 1] > this.getMinKeys()) {
                                maxNode = this.stealFromLeft(maxNode.children[maxNode.numKeys], maxNode.numKeys);
                            }
                            else {
                                maxNode = this.mergeRight(maxNode.children[maxNode.numKeys-1]);
                            }
                        }
                        else {
                            maxNode = maxNode.children[maxNode.numKeys];
                        }
                    }
                    this.cmd("SetHighlight", maxNode.graphicID, 1);
                    tree.keys[i] = maxNode.keys[maxNode.numKeys - 1];
                    this.cmd("SetTextColor", tree.graphicID, BTree.FOREGROUND_COLOR, i);
                    this.cmd("SetText", tree.graphicID, "", i);
                    this.cmd("SetText", maxNode.graphicID, "", maxNode.numKeys - 1);
                    this.cmd("CreateLabel", this.moveLabel1ID, tree.keys[i], this.getLabelX(maxNode, maxNode.numKeys - 1),  maxNode.y)
                    this.cmd("Move", this.moveLabel1ID, this.getLabelX(tree, i), tree.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.moveLabel1ID);
                    this.cmd("SetText", tree.graphicID, tree.keys[i], i);
                    maxNode.children.pop();
                    maxNode.keys.pop();
                    maxNode.numKeys--;
                    this.cmd("SetHighlight", maxNode.graphicID, 0);
                    this.cmd("SetHighlight", tree.graphicID, 0);

                    this.cmd("SetNumElements", maxNode.graphicID, maxNode.numKeys);
                    this.resizeTree();
                    this.cmd("SetText", this.messageID, "");
                }
            }
        }
    }
}


BTree.prototype.doDelete = function(tree, val)
{
    if (tree != null) {
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("Step");
        var i = 0;
        while (i < tree.numKeys && this.compare(tree.keys[i], val) < 0) i++;
        if (i == tree.numKeys) {
            if (!tree.isLeaf) {
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[tree.numKeys].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[tree.numKeys].graphicID, 0);
                this.doDelete(tree.children[tree.numKeys], val);
            }
            else {
                this.cmd("SetHighlight", tree.graphicID, 0);
            }
        }
        else if (this.compare(tree.keys[i], val) > 0) {
            if (!tree.isLeaf) {
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 0);
                this.doDelete(tree.children[i], val);
            }
            else {
                this.cmd("SetHighlight", tree.graphicID, 0);
            }
        }
        else {
            this.cmd("SetTextColor", tree.graphicID, "#FF0000", i);
            this.cmd("Step");
            if (tree.isLeaf) {
                this.cmd("SetTextColor", tree.graphicID, BTree.FOREGROUND_COLOR, i);
                for (var j = i; j < tree.numKeys - 1; j++) {
                    tree.keys[j] = tree.keys[j+1];
                    this.cmd("SetText", tree.graphicID, tree.keys[j], j);
                }
                tree.children.pop();
                tree.keys.pop();
                tree.numKeys--;
                this.cmd("SetText", tree.graphicID, "", tree.numKeys);
                this.cmd("SetNumElements", tree.graphicID, tree.numKeys);
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.repairAfterDelete(tree);
            }
            else {
                var maxNode = tree.children[i];
                while (!maxNode.isLeaf) {
                    this.cmd("SetHighlight", maxNode.graphicID, 1);
                    this.cmd("Step")
                    this.cmd("SetHighlight", maxNode.graphicID, 0);
                    maxNode = maxNode.children[maxNode.numKeys];
                }
                this.cmd("SetHighlight", maxNode.graphicID, 1);
                tree.keys[i] = maxNode.keys[maxNode.numKeys - 1];
                this.cmd("SetTextColor", tree.graphicID, BTree.FOREGROUND_COLOR, i);
                this.cmd("SetText", tree.graphicID, "", i);
                this.cmd("SetText", maxNode.graphicID, "", maxNode.numKeys - 1);
                this.cmd("CreateLabel", this.moveLabel1ID, tree.keys[i], this.getLabelX(maxNode, maxNode.numKeys - 1),  maxNode.y)
                this.cmd("Move", this.moveLabel1ID, this.getLabelX(tree, i), tree.y);
                this.cmd("Step");
                this.cmd("Delete", this.moveLabel1ID);
                this.cmd("SetText", tree.graphicID, tree.keys[i], i);
                maxNode.children.pop();
                maxNode.keys.pop();
                maxNode.numKeys--;
                this.cmd("SetHighlight", maxNode.graphicID, 0);
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetNumElements", maxNode.graphicID, maxNode.numKeys);
                this.repairAfterDelete(maxNode);
            }
        }
    }
}


BTree.prototype.mergeRight = function(tree)
{
    var parentNode = tree.parent;
    var parentIndex = 0;
    while (parentNode.children[parentIndex] != tree) parentIndex++;
    var rightSib = parentNode.children[parentIndex+1];
    this.cmd("SetHighlight", tree.graphicID, 1);
    this.cmd("SetHighlight", parentNode.graphicID, 1);
    this.cmd("SetHighlight", rightSib.graphicID, 1);
    this.cmd("SetText", this.messageID, `Merging nodes: \n${tree} + [${parentNode.keys[parentIndex]}] + ${rightSib}`);
    this.cmd("Step");

    this.cmd("SetNumElements", tree.graphicID, tree.numKeys + rightSib.numKeys + 1);
    tree.x = (tree.x + rightSib.x) / 2
    this.cmd("SetPosition", tree.graphicID, tree.x,  tree.y);

    tree.keys[tree.numKeys] = parentNode.keys[parentIndex];
    var fromParentIndex = tree.numKeys;
    this.cmd("SetText", tree.graphicID, "", tree.numKeys);
    this.cmd("CreateLabel", this.moveLabel1ID, parentNode.keys[parentIndex],  this.getLabelX(parentNode, parentIndex),  parentNode.y);

    for (var i = 0; i < rightSib.numKeys; i++) {
        tree.keys[tree.numKeys + 1 + i] = rightSib.keys[i];
        this.cmd("SetText", tree.graphicID, tree.keys[tree.numKeys + 1 + i], tree.numKeys + 1 + i);
        this.cmd("SetText", rightSib.graphicID, "", i);
    }
    if (!tree.isLeaf) {
        for (i = 0; i <= rightSib.numKeys; i++) {
            this.cmd("Disconnect", rightSib.graphicID, rightSib.children[i].graphicID);
            tree.children[tree.numKeys + 1 + i] = rightSib.children[i];
            tree.children[tree.numKeys + 1 + i].parent = tree;
            this.cmd(
                "Connect", 
                tree.graphicID,
                tree.children[tree.numKeys + 1 + i].graphicID,
                BTree.FOREGROUND_COLOR,
                0,  // Curve
                0,  // Directed
                "", // Label
                tree.numKeys + 1 + i   // Connection Point
            );
        }
    }
    this.cmd("Disconnect", parentNode.graphicID, rightSib.graphicID);
    for (i = parentIndex+1; i < parentNode.numKeys; i++) {
        this.cmd("Disconnect", parentNode.graphicID, parentNode.children[i+1].graphicID);
        parentNode.children[i] = parentNode.children[i+1];
        this.cmd(
            "Connect", 
            parentNode.graphicID,
            parentNode.children[i].graphicID,
            BTree.FOREGROUND_COLOR,
            0,  // Curve
            0,  // Directed
            "", // Label
            i   // Connection Point
        );
        parentNode.keys[i-1] = parentNode.keys[i];
        this.cmd("SetText", parentNode.graphicID, parentNode.keys[i-1], i-1);
    }
    this.cmd("SetText", parentNode.graphicID, "", parentNode.numKeys - 1);
    parentNode.children.pop();
    parentNode.keys.pop();
    parentNode.numKeys--;
    this.cmd("SetNumElements", parentNode.graphicID, parentNode.numKeys);
    this.cmd("SetHighlight", tree.graphicID, 0);
    this.cmd("SetHighlight", parentNode.graphicID, 0);
    // this.cmd("SetHighlight", rightSib.graphicID, 0);
    // this.cmd("Step");
    this.cmd("Delete", rightSib.graphicID);
    tree.numKeys = tree.numKeys + rightSib.numKeys + 1;
    this.cmd("Move", this.moveLabel1ID, this.getLabelX(tree, fromParentIndex), tree.y);
    this.cmd("Step");
    // resizeTree();
    this.cmd("Delete", this.moveLabel1ID);
    this.cmd("SetText", tree.graphicID, tree.keys[fromParentIndex], fromParentIndex);
    this.cmd("SetText", this.messageID, "");
    return tree;
}


BTree.prototype.stealFromRight = function(tree, parentIndex)
{
    // Steal from right sibling
    var parentNode = tree.parent;
    var rightSib = parentNode.children[parentIndex + 1];
    this.cmd("SetHighlight", tree.graphicID, 1);
    this.cmd("SetHighlight", parentNode.graphicID, 1);
    this.cmd("SetHighlight", rightSib.graphicID, 1);
    this.cmd("SetText", this.messageID, `Stealing from right sibling: \n${tree} ← [${parentNode.keys[parentIndex]}] ← ${rightSib}`);
    this.cmd("Step");

    tree.numKeys++;
    this.cmd("SetNumElements", tree.graphicID, tree.numKeys);

    this.cmd("SetText", tree.graphicID, "",  tree.numKeys - 1);
    this.cmd("SetText", parentNode.graphicID, "", parentIndex);
    this.cmd("SetText", rightSib.graphicID, "", 0);

    var tmpLabel1 = this.nextIndex++;
    var tmpLabel2 = this.nextIndex++;
    this.cmd("CreateLabel", tmpLabel1, rightSib.keys[0], this.getLabelX(rightSib, 0),  rightSib.y)
    this.cmd("CreateLabel", tmpLabel2, parentNode.keys[parentIndex], this.getLabelX(parentNode, parentIndex),  parentNode.y)
    this.cmd("SetForegroundColor", tmpLabel1, BTree.FOREGROUND_COLOR);
    this.cmd("SetForegroundColor", tmpLabel2, BTree.FOREGROUND_COLOR);

    this.cmd("Move", tmpLabel1, this.getLabelX(parentNode, parentIndex),  parentNode.y);
    this.cmd("Move", tmpLabel2, this.getLabelX(tree, tree.numKeys - 1), tree.y);
    this.cmd("Step")
    this.cmd("Delete", tmpLabel1);
    this.cmd("Delete", tmpLabel2);
    tree.keys[tree.numKeys - 1] = parentNode.keys[parentIndex];
    parentNode.keys[parentIndex] = rightSib.keys[0];

    this.cmd("SetText", tree.graphicID, tree.keys[tree.numKeys - 1], tree.numKeys - 1);
    this.cmd("SetText", parentNode.graphicID, parentNode.keys[parentIndex], parentIndex);
    if (!tree.isLeaf) {
        tree.children[tree.numKeys] = rightSib.children[0];
        tree.children[tree.numKeys].parent = tree;
        this.cmd("Disconnect", rightSib.graphicID, rightSib.children[0].graphicID);
        this.cmd(
            "Connect", 
            tree.graphicID,
            tree.children[tree.numKeys].graphicID,
            BTree.FOREGROUND_COLOR,
            0,  // Curve
            0,  // Directed
            "", // Label
            tree.numKeys   // Connection Point
        );
        for (var i = 1; i < rightSib.numKeys + 1; i++) {
            this.cmd("Disconnect", rightSib.graphicID, rightSib.children[i].graphicID);
            rightSib.children[i-1] = rightSib.children[i];
            this.cmd(
                "Connect", 
                rightSib.graphicID,
                rightSib.children[i-1].graphicID,
                BTree.FOREGROUND_COLOR,
                0,  // Curve
                0,  // Directed
                "", // Label
                i-1 // Connection Point
            );
        }
    }
    for (i = 1; i < rightSib.numKeys; i++) {
        rightSib.keys[i-1] = rightSib.keys[i];
        this.cmd("SetText", rightSib.graphicID, rightSib.keys[i-1], i-1);
    }
    this.cmd("SetText", rightSib.graphicID, "", rightSib.numKeys-1);
    rightSib.children.pop();
    rightSib.keys.pop();
    rightSib.numKeys--;
    this.cmd("SetNumElements", rightSib.graphicID, rightSib.numKeys);
    this.cmd("Step");
    this.cmd("SetHighlight", tree.graphicID, 0);
    this.cmd("SetHighlight", parentNode.graphicID, 0);
    this.cmd("SetHighlight", rightSib.graphicID, 0);
    this.resizeTree();
    this.cmd("SetText", this.messageID, "");
    return tree;
}


BTree.prototype.stealFromLeft = function(tree, parentIndex)
{
    var parentNode = tree.parent;
    // Steal from left sibling
    tree.numKeys++;
    this.cmd("SetNumElements", tree.graphicID, tree.numKeys);
    for (i = tree.numKeys - 1; i > 0; i--) {
        tree.keys[i] = tree.keys[i-1];
        this.cmd("SetText", tree.graphicID, tree.keys[i], i);
    }
    var leftSib = parentNode.children[parentIndex -1];
    this.cmd("SetText", this.messageID, `Stealing from left sibling: \n${leftSib} → [${parentNode.keys[parentIndex]}] → ${tree}`);
    this.cmd("SetText", tree.graphicID, "", 0);
    this.cmd("SetText", parentNode.graphicID, "", parentIndex - 1);
    this.cmd("SetText", leftSib.graphicID, "", leftSib.numKeys - 1);

    var tmpLabel1 = this.nextIndex++;
    var tmpLabel2 = this.nextIndex++;
    this.cmd("CreateLabel", tmpLabel1, leftSib.keys[leftSib.numKeys - 1], this.getLabelX(leftSib, leftSib.numKeys - 1),  leftSib.y)
    this.cmd("CreateLabel", tmpLabel2, parentNode.keys[parentIndex - 1], this.getLabelX(parentNode, parentIndex - 1),  parentNode.y)
    this.cmd("SetForegroundColor", tmpLabel1, BTree.FOREGROUND_COLOR);
    this.cmd("SetForegroundColor", tmpLabel2, BTree.FOREGROUND_COLOR);

    this.cmd("Move", tmpLabel1, this.getLabelX(parentNode, parentIndex - 1),  parentNode.y);
    this.cmd("Move", tmpLabel2, this.getLabelX(tree, 0), tree.y);
    this.cmd("Step")
    this.cmd("Delete", tmpLabel1);
    this.cmd("Delete", tmpLabel2);
    if (!tree.isLeaf) {
        for (var i = tree.numKeys; i > 0; i--) {
            this.cmd("Disconnect", tree.graphicID, tree.children[i-1].graphicID);
            tree.children[i] = tree.children[i-1];
            this.cmd(
                "Connect", 
                tree.graphicID,
                tree.children[i].graphicID,
                BTree.FOREGROUND_COLOR,
                0,  // Curve
                0,  // Directed
                "", // Label
                i   // Connection Point
            );
        }
        tree.children[0] = leftSib.children[leftSib.numKeys];
        this.cmd("Disconnect", leftSib.graphicID, leftSib.children[leftSib.numKeys].graphicID);
        this.cmd(
            "Connect", 
            tree.graphicID,
            tree.children[0].graphicID,
            BTree.FOREGROUND_COLOR,
            0,  // Curve
            0,  // Directed
            "", // Label
            0   // Connection Point
        );
        leftSib.children[leftSib.numKeys] = null;
        tree.children[0].parent = tree;
    }
    tree.keys[0] = parentNode.keys[parentIndex - 1];
    this.cmd("SetText", tree.graphicID, tree.keys[0], 0);
    parentNode.keys[parentIndex-1] = leftSib.keys[leftSib.numKeys - 1];
    this.cmd("SetText", parentNode.graphicID, parentNode.keys[parentIndex - 1], parentIndex - 1);
    this.cmd("SetText", leftSib.graphicID,"", leftSib.numKeys - 1);
    leftSib.children.pop();
    leftSib.keys.pop();
    leftSib.numKeys--;
    this.cmd("SetNumElements", leftSib.graphicID, leftSib.numKeys);
    this.resizeTree();
    this.cmd("SetText", this.messageID, "");
    return tree;
}


BTree.prototype.repairAfterDelete = function(tree)
{
    if (tree.numKeys < this.getMinKeys()) {
        if (tree.parent == null) {
            if (tree.numKeys == 0) {
                this.cmd("Step");
                this.cmd("Delete", tree.graphicID);
                this.treeRoot = tree.children[0];
                if (this.treeRoot != null)
                    this.treeRoot.parent = null;
                this.resizeTree();
            }
        }
        else {
            var parentNode = tree.parent;
            var parentIndex = 0; 
            while (parentNode.children[parentIndex] != tree) parentIndex++;
            if (parentIndex > 0 && parentNode.children[parentIndex - 1].numKeys > this.getMinKeys()) {
                this.stealFromLeft(tree, parentIndex);
            }
            else if (parentIndex < parentNode.numKeys && parentNode.children[parentIndex + 1].numKeys > this.getMinKeys()) {
                this.stealFromRight(tree,parentIndex);
            }
            else if (parentIndex == 0) {
                // Merge with right sibling
                var nextNode = this.mergeRight(tree);
                this.repairAfterDelete(nextNode.parent);
            }
            else {
                // Merge with left sibling
                nextNode = this.mergeRight(parentNode.children[parentIndex-1]);
                this.repairAfterDelete(nextNode.parent);
            }
        }
    }
}


BTree.prototype.validateTree = function(tree, parent)
{
    if (!tree) {
        tree = this.treeRoot;
        if (!tree) return;
        // console.log("Validating tree", tree);
    } else {
        if (tree.parent !== parent) console.error("Parent mismatch:", tree, parent);
    }
    if (!tree.graphicID) console.error("Tree missing ID:", tree);
    if (tree.keys.length != tree.numKeys) console.error("N:o keys mismatch", tree);
    if (tree.isLeaf) {
        if (tree.children.length > 0) console.error("Leaf node has children", tree);
    } else {
        if (tree.children.length != tree.numKeys + 1) console.error("N:o children mismatch", tree);
        for (var child of tree.children) {
            if (child) {
                this.validateTree(child, tree);
            } else {
                console.error("Null child", tree);
            }
        }
    }
}



BTree.prototype.getLabelX = function(tree, index)
{
    return tree.x - BTree.WIDTH_PER_ELEM * tree.numKeys / 2 + BTree.WIDTH_PER_ELEM / 2 + index * BTree.WIDTH_PER_ELEM;
}


BTree.prototype.resizeTree = function()
{
    this.resizeWidths(this.treeRoot);
    this.setNewPositions(this.treeRoot, this.starting_x, BTree.STARTING_Y);
    this.animateNewPositions(this.treeRoot);
}


BTree.prototype.setNewPositions = function(tree, xPosition, yPosition)
{
    if (tree != null) {
        tree.y = yPosition;
        tree.x = xPosition;
        if (!tree.isLeaf) {
            var leftEdge = xPosition - tree.width / 2;
            var priorWidth = 0;
            for (var i = 0; i < tree.numKeys+1; i++) {
                this.setNewPositions(tree.children[i], leftEdge + priorWidth + tree.widths[i] / 2, yPosition+BTree.HEIGHT_DELTA);
                priorWidth += tree.widths[i];
            }
        }
    }
}


BTree.prototype.animateNewPositions = function(tree)
{
    if (tree == null) {
        return;
    }
    var i;
    for (i = 0; i < tree.numKeys + 1; i++) {
        this.animateNewPositions(tree.children[i]);
    }
    this.cmd("Move", tree.graphicID, tree.x, tree.y);
}

BTree.prototype.resizeWidths = function(tree)
{
    if (tree == null) {
        return 0;
    }
    if (tree.isLeaf) {
        for (var i = 0; i < tree.numKeys + 1; i++) {
            tree.widths[i] = 0;
        }
        tree.width = tree.numKeys * BTree.WIDTH_PER_ELEM + BTree.NODE_SPACING;
        return tree.width;
    }
    else {
        var treeWidth = 0;
        for (i = 0; i < tree.numKeys+1; i++) {
            tree.widths[i] = this.resizeWidths(tree.children[i]);
            treeWidth = treeWidth + tree.widths[i];
        }
        treeWidth = Math.max(treeWidth, tree.numKeys * BTree.WIDTH_PER_ELEM + BTree.NODE_SPACING);
        tree.width = treeWidth;
        return treeWidth;
    }
}



function BTreeNode(id, initialX, initialY)
{
    this.widths = [];
    this.keys = [];
    this.children = [];
    this.x = initialX;
    this.y = initialY;
    this.graphicID = id;
    this.numKeys = 1;
    this.isLeaf = true;
    this.parent = null;
    this.leftWidth = 0;
    this.rightWidth = 0;

    this.toString = () => "[" + this.keys.join(" ") + "]";
}




var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new BTree(animManag);
}
