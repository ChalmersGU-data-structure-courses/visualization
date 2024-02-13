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
// THIS SOFTWARE IS PROVIDED BY David Galles ``AS IS'' AND ANY EXPRESS OR IMPLIED
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


function TreeSplay(am)
{
    this.init(am);
}
TreeSplay.inheritFrom(Algorithm);


// Various constants

TreeSplay.FOREGROUND_COLOR = "#007700";
TreeSplay.BACKGROUND_COLOR = "#EEFFEE";

TreeSplay.LINK_COLOR = TreeSplay.FOREGROUND_COLOR;
TreeSplay.HIGHLIGHT_CIRCLE_COLOR = TreeSplay.FOREGROUND_COLOR;
TreeSplay.PRINT_COLOR = TreeSplay.FOREGROUND_COLOR;

TreeSplay.NODE_SIZE = 40;
TreeSplay.WIDTH_DELTA = TreeSplay.NODE_SIZE + 10;
TreeSplay.HEIGHT_DELTA = TreeSplay.NODE_SIZE + 10;
TreeSplay.STARTING_Y = 50;


TreeSplay.FIRST_PRINT_POS_X = 50;
TreeSplay.PRINT_VERTICAL_GAP = 20;
TreeSplay.PRINT_HORIZONTAL_GAP = 50;

TreeSplay.MESSAGE_X = 10;
TreeSplay.MESSAGE_Y = 10;



TreeSplay.prototype.init = function(am)
{
    TreeSplay.superclass.init.call(this, am);
    this.addControls();
    this.setup();
}


TreeSplay.prototype.setup = function() 
{
    this.nextIndex = 0;
    this.commands = [];
    this.messageID = this.nextIndex++;
    this.cmd("CreateLabel", this.messageID, "", TreeSplay.MESSAGE_X, TreeSplay.MESSAGE_Y, 0);

    this.initialIndex = this.nextIndex;
    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();

    this.sizeChanged();
}


TreeSplay.prototype.sizeChanged = function()
{
    var w = this.getCanvasWidth();
    var h = this.getCanvasHeight();

    this.startingX = w / 2;
    this.first_print_pos_y = h - 3 * TreeSplay.PRINT_VERTICAL_GAP;
    this.print_max = w - TreeSplay.PRINT_HORIZONTAL_GAP;
    
    this.implementAction(() => {
        this.commands = [];
        this.resizeTree();
        return this.commands;
    });
}

TreeSplay.prototype.addControls = function()
{
    this.insertField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
    this.addReturnSubmit(this.insertField, "ALPHANUM", this.insertCallback.bind(this));
    this.insertButton = this.addControlToAlgorithmBar("Button", "Insert");
    this.insertButton.onclick = this.insertCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.deleteField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
    this.addReturnSubmit(this.deleteField, "ALPHANUM", this.deleteCallback.bind(this));
    this.deleteButton = this.addControlToAlgorithmBar("Button", "Delete");
    this.deleteButton.onclick = this.deleteCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.findField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
    this.addReturnSubmit(this.findField, "ALPHANUM", this.findCallback.bind(this));
    this.findButton = this.addControlToAlgorithmBar("Button", "Find");
    this.findButton.onclick = this.findCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.printButton = this.addControlToAlgorithmBar("Button", "Print");
    this.printButton.onclick = this.printCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.clearButton = this.addControlToAlgorithmBar("Button", "Clear");
    this.clearButton.onclick = this.clearCallback.bind(this);
}


TreeSplay.prototype.reset = function()
{
    this.nextIndex = this.initialIndex;
    this.treeRoot = null;
}


///////////////////////////////////////////////////////////////////////////////
// Callback functions for the algorithm control bar

TreeSplay.prototype.insertCallback = function(event)
{
    var insertedValue = this.normalizeNumber(this.insertField.value);
    if (insertedValue !== "") {
        this.insertField.value = "";
        this.implementAction(this.insertElement.bind(this), insertedValue);
    }
}

TreeSplay.prototype.deleteCallback = function(event)
{
    var deletedValue = this.normalizeNumber(this.deleteField.value);
    if (deletedValue !== "") {
        this.deleteField.value = "";
        this.implementAction(this.deleteElement.bind(this), deletedValue);
    }
}

TreeSplay.prototype.findCallback = function(event)
{
    var findValue = this.normalizeNumber(this.findField.value);
    if (findValue !== "") {
        this.findField.value = "";
        this.implementAction(this.findElement.bind(this), findValue);
    }
}

TreeSplay.prototype.clearCallback = function(event)
{
    this.implementAction(this.clearTree.bind(this), "");
}

TreeSplay.prototype.printCallback = function(event)
{
    this.implementAction(this.printTree.bind(this), "");
}


///////////////////////////////////////////////////////////////////////////////
// Functions that do the actual work

TreeSplay.prototype.printTree = function(unused)
{
    if (this.treeRoot == null) return [];
    this.commands = [];
    this.cmd("SetText", this.messageID, "Printing tree");
    this.highlightID = this.nextIndex++;
    this.cmd("CreateHighlightCircle", this.highlightID, TreeSplay.HIGHLIGHT_CIRCLE_COLOR, this.treeRoot.x, this.treeRoot.y);
    var firstLabel = this.nextIndex;

    this.xPosOfNextLabel = TreeSplay.FIRST_PRINT_POS_X;
    this.yPosOfNextLabel = this.first_print_pos_y;

    this.printTreeRec(this.treeRoot);
    this.cmd("Delete",  this.highlightID);
    this.cmd("Step")
    for (var i = firstLabel; i < this.nextIndex; i++) {
        this.cmd("Delete", i);
    }
    this.nextIndex = this.highlightID;  // Reuse objects. Not necessary.
    this.cmd("SetText", this.messageID, "");
    return this.commands;
}

TreeSplay.prototype.printTreeRec = function(tree)
{
    this.cmd("Step");
    if (tree.left != null) {
        this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
        this.printTreeRec(tree.left);
        this.cmd("Move", this.highlightID, tree.x, tree.y);
        this.cmd("Step");
    }
    var nextLabelID = this.nextIndex++;
    this.cmd("CreateLabel", nextLabelID, tree.data, tree.x, tree.y);
    this.cmd("SetForegroundColor", nextLabelID, TreeSplay.PRINT_COLOR);
    this.cmd("Move", nextLabelID, this.xPosOfNextLabel, this.yPosOfNextLabel);
    this.cmd("Step");

    this.xPosOfNextLabel +=  TreeSplay.PRINT_HORIZONTAL_GAP;
    if (this.xPosOfNextLabel > this.print_max) {
        this.xPosOfNextLabel = TreeSplay.FIRST_PRINT_POS_X;
        this.yPosOfNextLabel += TreeSplay.PRINT_VERTICAL_GAP;
    }
    if (tree.right != null) {
        this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
        this.printTreeRec(tree.right);
        this.cmd("Move", this.highlightID, tree.x, tree.y);
        this.cmd("Step");
    }
}


TreeSplay.prototype.clearTree = function(ignored)
{
    this.commands = [];
    this.deleteTree(this.treeRoot);
    this.treeRoot = null;
    this.nextIndex = this.initialIndex;
    return this.commands;
}


TreeSplay.prototype.deleteTree = function(tree)
{
    if (tree != null) {
        if (tree.left) {
            this.cmd("Disconnect", tree.graphicID, tree.left.graphicID);
            this.deleteTree(tree.left);
            tree.left == null;
        }
        if (tree.right) {
            this.cmd("Disconnect", tree.graphicID, tree.right.graphicID);
            this.deleteTree(tree.right);
            tree.right == null;
        }
        this.cmd("Delete", tree.graphicID);
    }
}


TreeSplay.prototype.findElement = function(findValue)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, `Searching for ${findValue}`);
    this.highlightID = this.nextIndex++;
    var found = this.doFind(this.treeRoot, findValue);
    this.cmd("SetText", this.messageID, `Element ${findValue} ${found?"found":"not found"}`);
    this.validateTree();
    return this.commands;
}


TreeSplay.prototype.doFind = function(tree, value)
{
    if (tree != null) {
        this.cmd("SetHighlight", tree.graphicID, 1);
        var cmp = this.compare(tree.data, value);
        if (cmp == 0) {
            this.cmd("SetText", this.messageID, `Searching for ${value}: ${value} = ${tree.data} (element found!)`);
            this.cmd("Step");
            this.cmd("SetText", this.messageID, `Found ${value}`);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.splayUp(tree);
            return true;
        }
        else if (cmp > 0) {
            this.cmd("SetText", this.messageID, `Searching for ${value}: ${value} < ${tree.data} (look to left subtree)`);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            if (tree.left != null) {
                this.cmd("CreateHighlightCircle", this.highlightID, TreeSplay.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
                this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
                this.cmd("Step");
                this.cmd("Delete", this.highlightID);
                return this.doFind(tree.left, value);
            }
            else {
                this.cmd("SetText", this.messageID, `Searching for ${value}: Element not found`);
                this.cmd("Step");
                this.splayUp(tree);
                return false;
            }
        }
        else {
            this.cmd("SetText", this.messageID, `Searching for ${value}: ${value} > ${tree.data} (look to right subtree)`);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            if (tree.right!= null) {
                this.cmd("CreateHighlightCircle", this.highlightID, TreeSplay.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
                this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
                this.cmd("Step");
                this.cmd("Delete", this.highlightID);
                return this.doFind(tree.right, value);
            }
            else {
                this.cmd("SetText", this.messageID, `Searching for ${value}: Element not found`);
                this.cmd("Step");
                this.splayUp(tree);
                return false;
            }
        }
    }
    else {
        return false;
    }
}


TreeSplay.prototype.insertElement = function(insertedValue)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, `Inserting ${insertedValue}`);
    this.highlightID = this.nextIndex++;
    var treeNodeID = this.nextIndex++;

    if (this.treeRoot == null) {
        var x = this.startingX, y = TreeSplay.STARTING_Y;
        this.cmd("CreateCircle", treeNodeID, insertedValue, x, y);
        this.cmd("SetForegroundColor", treeNodeID, TreeSplay.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", treeNodeID, TreeSplay.BACKGROUND_COLOR);
        this.cmd("Step");
        this.treeRoot = new SplayNode(insertedValue, treeNodeID, x, y);
    }
    else {
        var x = TreeSplay.STARTING_Y, y = 2 * TreeSplay.STARTING_Y;
        this.cmd("CreateCircle", treeNodeID, insertedValue, x, y);
        this.cmd("SetForegroundColor", treeNodeID, TreeSplay.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", treeNodeID, TreeSplay.BACKGROUND_COLOR);
        this.cmd("Step");
        var insertElem = new SplayNode(insertedValue, treeNodeID, x, y);
        this.cmd("SetHighlight", insertElem.graphicID, 1);
        this.insert(insertElem, this.treeRoot);
        this.resizeTree();
        this.cmd("SetText", this.messageID, "Splay inserted element to root of tree");
        this.cmd("Step");
        this.splayUp(insertElem);
    }
    this.cmd("SetText", this.messageID, "");
    this.validateTree();
    return this.commands;
}


TreeSplay.prototype.insert = function(elem, tree)
{
    this.cmd("SetHighlight", tree.graphicID , 1);
    this.cmd("SetHighlight", elem.graphicID , 1);

    var cmp = this.compare(elem.data, tree.data);
    if (cmp < 0) {
        this.cmd("SetText", this.messageID, `${elem.data} < ${tree.data}: Looking at left subtree`);
    }
    else {
        this.cmd("SetText", this.messageID, `${elem.data} >= ${tree.data}: Looking at right subtree`);
    }
    this.cmd("Step");
    this.cmd("SetHighlight", tree.graphicID, 0);
    this.cmd("SetHighlight", elem.graphicID, 0);

    if (cmp < 0) {
        if (tree.left == null) {
            this.cmd("SetText", this.messageID,"Found null tree, inserting element");
            this.cmd("SetHighlight", elem.graphicID, 0);
            tree.left = elem;
            elem.parent = tree;
            this.cmd("Connect", tree.graphicID, elem.graphicID, TreeSplay.LINK_COLOR);
        }
        else {
            this.cmd("CreateHighlightCircle", this.highlightID, TreeSplay.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
            this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
            this.cmd("Step");
            this.cmd("Delete", this.highlightID);
            this.insert(elem, tree.left);
        }
    }
    else {
        if (tree.right == null) {
            this.cmd("SetText", this.messageID, "Found null tree, inserting element");
            this.cmd("SetHighlight", elem.graphicID, 0);
            tree.right = elem;
            elem.parent = tree;
            this.cmd("Connect", tree.graphicID, elem.graphicID, TreeSplay.LINK_COLOR);
            elem.x = tree.x + TreeSplay.WIDTH_DELTA / 2;
            elem.y = tree.y + TreeSplay.HEIGHT_DELTA;
            this.cmd("Move", elem.graphicID, elem.x, elem.y);
        }
        else {
            this.cmd("CreateHighlightCircle", this.highlightID, TreeSplay.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
            this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
            this.cmd("Step");
            this.cmd("Delete", this.highlightID);
            this.insert(elem, tree.right);
        }
    }
}


TreeSplay.prototype.deleteElement = function(deletedValue)
{
    this.commands = [];
    this.cmd("SetText", this.messageID, `Deleting ${deletedValue}`);
    this.cmd("Step");
    this.cmd("SetText", this.messageID, "");
    this.highlightID = this.nextIndex++;
    this.treeDelete(this.treeRoot, deletedValue);
    this.cmd("SetText", this.messageID, "");
    this.validateTree();
    return this.commands;
}

TreeSplay.prototype.treeDelete = function(tree, valueToDelete)
{
    this.cmd("SetText", this.messageID, `Finding ${valueToDelete} and splaying to rooot`);
    this.cmd("Step");
    var inTree = this.doFind(this.treeRoot, valueToDelete);

    if (inTree) {
        this.cmd("SetText", this.messageID, "Removing root, leaving left and right trees");
        this.cmd("Step");
        if (this.treeRoot.right == null) {
            this.cmd("Delete", this.treeRoot.graphicID);
            this.cmd("SetText", this.messageID, "No right tree, make left tree the root");
            this.cmd("Step");
            this.treeRoot = this.treeRoot.left;
            this.treeRoot.parent = null;
            this.resizeTree();
        }
        else if (this.treeRoot.left == null) {
            this.cmd("Delete", this.treeRoot.graphicID);
            this.cmd("SetText", this.messageID, "No left tree, make right tree the root");
            this.cmd("Step");
            this.treeRoot = this.treeRoot.right
            this.treeRoot.parent = null;
            this.resizeTree();
        }
        else {
            var right = this.treeRoot.right;
            var left = this.treeRoot.left;
            var oldGraphicID = this.treeRoot.graphicID;
            this.cmd("Disconnect", this.treeRoot.graphicID, left.graphicID);
            this.cmd("Disconnect", this.treeRoot.graphicID, right.graphicID);
            this.cmd("SetAlpha", this.treeRoot.graphicID, 0);
            this.cmd("SetText", this.messageID, "Splay largest element in left tree to root");
            this.cmd("Step");

            left.parent = null;
            var largestLeft = this.findMax(left);
            this.splayUp(largestLeft);
            this.cmd("SetText", this.messageID, "Left tree now has no right subtree, connect left and right trees");
            this.cmd("Step");
            this.cmd("Connect", largestLeft.graphicID, right.graphicID, TreeSplay.LINK_COLOR);
            largestLeft.parent = null;
            largestLeft.right = right;
            right.parent = largestLeft;
            this.treeRoot = largestLeft;
            this.cmd("Delete", oldGraphicID);
            this.resizeTree();
        }
    }
}


TreeSplay.prototype.findMax = function(tree)
{
    if (tree.right != null) {
        this.highlightID = this.nextIndex++;
        this.cmd("CreateHighlightCircle", this.highlightID, TreeSplay.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
        this.cmd("Step");
        while (tree.right != null) {
            this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
            this.cmd("Step");
            tree = tree.right;
        }
        this.cmd("Delete", this.highlightID);
    }
    return tree;
}


TreeSplay.prototype.singleRotateRight = function(tree)
{
    var A = tree.left;
    var B = tree;
    var t1 = A.left;
    var t2 = A.right;
    var t3 = B.right;

    this.cmd("SetText", this.messageID, "Zig Right");
    this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 1);
    this.cmd("Step");

    if (t2 != null) {
        this.cmd("Disconnect", A.graphicID, t2.graphicID);
        this.cmd("Connect", B.graphicID, t2.graphicID, TreeSplay.LINK_COLOR);
        t2.parent = B;
    }
    this.cmd("Disconnect", B.graphicID, A.graphicID);
    this.cmd("Connect", A.graphicID, B.graphicID, TreeSplay.LINK_COLOR);
    A.parent = B.parent;
    if (B.parent == null) {
        this.treeRoot = A;
    }
    else {
        this.cmd("Disconnect", B.parent.graphicID, B.graphicID, TreeSplay.LINK_COLOR);
        this.cmd("Connect", B.parent.graphicID, A.graphicID, TreeSplay.LINK_COLOR)
        if (B.isLeftChild()) {
            B.parent.left = A;
        }
        else {
            B.parent.right = A;
        }
    }
    A.right = B;
    B.parent = A;
    B.left = t2;
    this.resizeTree();
}


TreeSplay.prototype.singleRotateLeft = function(tree)
{
    var A = tree;
    var B = tree.right;
    var t1 = A.left;
    var t2 = B.left;
    var t3 = B.right;

    this.cmd("SetText", this.messageID, "Zig Left");
    this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 1);
    this.cmd("Step");

    if (t2 != null) {
        this.cmd("Disconnect", B.graphicID, t2.graphicID);
        this.cmd("Connect", A.graphicID, t2.graphicID, TreeSplay.LINK_COLOR);
        t2.parent = A;
    }
    this.cmd("Disconnect", A.graphicID, B.graphicID);
    this.cmd("Connect", B.graphicID, A.graphicID, TreeSplay.LINK_COLOR);
    B.parent = A.parent;
    if (A.parent == null) {
        this.treeRoot = B;
    }
    else {
        this.cmd("Disconnect", A.parent.graphicID, A.graphicID, TreeSplay.LINK_COLOR);
        this.cmd("Connect", A.parent.graphicID, B.graphicID, TreeSplay.LINK_COLOR)
        if (A.isLeftChild()) {
            A.parent.left = B;
        } else {
            A.parent.right = B;
        }
    }
    B.left = A;
    A.parent = B;
    A.right = t2;
    this.resizeTree();
}


TreeSplay.prototype.doubleRotateRight = function(tree)
{
    var A = tree.left;
    var B = tree.left.right;
    var C = tree;
    var t1 = A.left;
    var t2 = B.left;
    var t3 = B.right;
    var t4 = C.right;
    
    this.cmd("SetText", this.messageID, "Zig-Zag Right");
    this.cmd("SetEdgeHighlight", C.graphicID, A.graphicID, 1);
    this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 1);
    this.cmd("Step");

    if (t2 != null) {
        this.cmd("Disconnect",B.graphicID, t2.graphicID);
        t2.parent = A;
        A.right = t2;
        this.cmd("Connect", A.graphicID, t2.graphicID, TreeSplay.LINK_COLOR);
    }
    if (t3 != null) {
        this.cmd("Disconnect",B.graphicID, t3.graphicID);
        t3.parent = C;
        C.left = t2;
        this.cmd("Connect", C.graphicID, t3.graphicID, TreeSplay.LINK_COLOR);
    }
    if (C.parent == null) {
        B.parent = null;
        this.treeRoot = B;
    }
    else {
        this.cmd("Disconnect",C.parent.graphicID, C.graphicID);
        this.cmd("Connect",C.parent.graphicID, B.graphicID, TreeSplay.LINK_COLOR);
        if (C.isLeftChild()) {
            C.parent.left = B
        } else {
            C.parent.right = B;
        }
        B.parent = C.parent;
        C.parent = B;
    }
    this.cmd("Disconnect", C.graphicID, A.graphicID);
    this.cmd("Disconnect", A.graphicID, B.graphicID);
    this.cmd("Connect", B.graphicID, A.graphicID, TreeSplay.LINK_COLOR);
    this.cmd("Connect", B.graphicID, C.graphicID, TreeSplay.LINK_COLOR);

    B.left = A;
    A.parent = B;
    B.right = C;
    C.parent = B;
    A.right = t2;
    C.left = t3;
    this.resizeTree();
}


TreeSplay.prototype.doubleRotateLeft = function(tree)
{
    var A = tree;
    var B = tree.right.left;
    var C = tree.right;
    var t1 = A.left;
    var t2 = B.left;
    var t3 = B.right;
    var t4 = C.right;
    
    this.cmd("SetText", this.messageID, "Zig-Zag Left");
    this.cmd("SetEdgeHighlight", A.graphicID, C.graphicID, 1);
    this.cmd("SetEdgeHighlight", C.graphicID, B.graphicID, 1);
    this.cmd("Step");

    if (t2 != null) {
        this.cmd("Disconnect",B.graphicID, t2.graphicID);
        t2.parent = A;
        A.right = t2;
        this.cmd("Connect", A.graphicID, t2.graphicID, TreeSplay.LINK_COLOR);
    }
    if (t3 != null) {
        this.cmd("Disconnect",B.graphicID, t3.graphicID);
        t3.parent = C;
        C.left = t2;
        this.cmd("Connect", C.graphicID, t3.graphicID, TreeSplay.LINK_COLOR);
    }

    if (A.parent == null) {
        B.parent = null;
        this.treeRoot = B;
    }
    else {
        this.cmd("Disconnect",A.parent.graphicID, A.graphicID);
        this.cmd("Connect",A.parent.graphicID, B.graphicID, TreeSplay.LINK_COLOR);
        if (A.isLeftChild()) {
            A.parent.left = B
        } else {
            A.parent.right = B;
        }
        B.parent = A.parent;
        A.parent = B;
    }
    this.cmd("Disconnect", A.graphicID, C.graphicID);
    this.cmd("Disconnect", C.graphicID, B.graphicID);
    this.cmd("Connect", B.graphicID, A.graphicID, TreeSplay.LINK_COLOR);
    this.cmd("Connect", B.graphicID, C.graphicID, TreeSplay.LINK_COLOR);

    B.left = A;
    A.parent = B;
    B.right = C;
    C.parent = B;
    A.right = t2;
    C.left = t3;
    this.resizeTree();
}


TreeSplay.prototype.zigZigRight = function(tree)
{
    var A = tree.left.left;
    var B = tree.left;
    var C = tree;
    var t1 = A.left;
    var t2 = A.right;
    var t3 = B.right;
    var t4 = C.right;

    this.cmd("SetText", this.messageID, "Zig-Zig Right");
    this.cmd("SetEdgeHighlight", C.graphicID, B.graphicID, 1);
    this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 1);
    this.cmd("Step");
    this.cmd("SetEdgeHighlight", C.graphicID, B.graphicID, 0);
    this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 0);

    if (C.parent != null) {
        this.cmd("Disconnect", C.parent.graphicID, C.graphicID);
        this.cmd("Connect", C.parent.graphicID, A.graphicID, TreeSplay.LINK_COLOR);
        if (C.isLeftChild()) {
            C.parent.left = A;
        } else {
            C.parent.right = A;
        }
    }
    else {
        this.treeRoot = A;
    }

    if (t2 != null) {
        this.cmd("Disconnect", A.graphicID, t2.graphicID);
        this.cmd("Connect", B.graphicID, t2.graphicID, TreeSplay.LINK_COLOR);
        t2.parent = B;
    }
    if (t3 != null) {
        this.cmd("Disconnect", B.graphicID, t3.graphicID);
        this.cmd("Connect", C.graphicID, t3.graphicID, TreeSplay.LINK_COLOR);
        t3.parent = C;
    }
    this.cmd("Disconnect", B.graphicID, A.graphicID);
    this.cmd("Connect", A.graphicID, B.graphicID, TreeSplay.LINK_COLOR);
    this.cmd("Disconnect", C.graphicID, B.graphicID);
    this.cmd("Connect", B.graphicID, C.graphicID, TreeSplay.LINK_COLOR);

    A.right = B;
    A.parent = C.parent;
    B.parent = A;
    B.left = t2;
    B.right = C;
    C.parent = B;
    C.left = t3;
    this.resizeTree();
}


TreeSplay.prototype.zigZigLeft = function(tree)
{
    var A = tree;
    var B = tree.right;
    var C = tree.right.right;
    var t1 = A.left;
    var t2 = B.left;
    var t3 = C.left;
    var t4 = C.right;

    this.cmd("SetText", this.messageID, "Zig-Zig Left");
    this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 1);
    this.cmd("SetEdgeHighlight", B.graphicID, C.graphicID, 1);
    this.cmd("Step");
    this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 0);
    this.cmd("SetEdgeHighlight", B.graphicID, C.graphicID, 0);


    if (A.parent != null) {
        this.cmd("Disconnect", A.parent.graphicID, A.graphicID);
        this.cmd("Connect", A.parent.graphicID, C.graphicID, TreeSplay.LINK_COLOR);
        if (A.isLeftChild()) {
            A.parent.left = C;
        } else {
            A.parent.right = C;
        }
    }
    else {
        this.treeRoot = C;
    }

    if (t2 != null) {
        this.cmd("Disconnect", B.graphicID, t2.graphicID);
        this.cmd("Connect", A.graphicID, t2.graphicID, TreeSplay.LINK_COLOR);
        t2.parent = A;
    }
    if (t3 != null) {
        this.cmd("Disconnect", C.graphicID, t3.graphicID);
        this.cmd("Connect", B.graphicID, t3.graphicID, TreeSplay.LINK_COLOR);
        t3.parent = B;
    }
    this.cmd("Disconnect", A.graphicID, B.graphicID);
    this.cmd("Disconnect", B.graphicID, C.graphicID);
    this.cmd("Connect", C.graphicID, B.graphicID, TreeSplay.LINK_COLOR);
    this.cmd("Connect", B.graphicID, A.graphicID, TreeSplay.LINK_COLOR);

    C.parent = A.parent;
    A.right = t2;
    B.left = A;
    A.parent = B;
    B.right = t3;
    C.left = B;
    B.parent = C;
    this.resizeTree();
}


//  TODO: This top-down version is broken. Don't use
TreeSplay.prototype.splayDown = function(value)
{
    if (this.treeRoot == null) {
        return false;
    }
    else if (this.treeRoot.data == value) {
        return true;
    } 
    else if (value < this.treeRoot.data) {
        if (this.treeRoot.left == null) {
            return false;
        }
        else if (this.treeRoot.left.data == value) {
            this.singleRotateRight(this.treeRoot);
            return true;
        }
        else if (value < this.treeRoot.left.data) {
            if (this.treeRoot.left.left == null) {
                this.singleRotateRight(this.treeRoot);
            } else {
                this.zigZigRight(this.treeRoot);
            }
            return this.splayDown(value);
        }
        else {
            if (this.treeRoot.left.right == null) {
                this.singleRotateRight(this.treeRoot);
            } else {
                this.doubleRotateRight(this.treeRoot);
            }
            return this.splayDown(value);
        }
    }
    else {
        if (this.treeRoot.right == null) {
            return false;
        }
        else if (this.treeRoot.right.data == value) {
            this.singleRotateLeft(this.treeRoot);
            return true;
        }
        else if (value > this.treeRoot.right.data) {
            if (this.treeRoot.right.right == null) {
                this.singleRotateLeft(this.treeRoot);
            } else {
                this.zigZigLeft(this.treeRoot);
            }
            return this.splayDown(value);
        }
        else {
            if (this.treeRoot.right.left == null) {
                this.singleRotateLeft(this.treeRoot);
            }
            else {
                this.doubleRotateLeft(this.treeRot);
            }
            return this.splayDown(value);
        }
    }
}


TreeSplay.prototype.splayUp = function(tree)
{
    if (tree.parent == null) {
        return;
    }
    else if (tree.parent.parent == null) {
        if (tree.isLeftChild()) {
            this.singleRotateRight(tree.parent);
        } else {
            this.singleRotateLeft(tree.parent);
        }
    }
    else if (tree.isLeftChild() && !tree.parent.isLeftChild()) {
        this.doubleRotateLeft(tree.parent.parent);
        this.splayUp(tree);
    }
    else if (!tree.isLeftChild() && tree.parent.isLeftChild()) {
        this.doubleRotateRight(tree.parent.parent);
        this.splayUp(tree);
    }
    else if (tree.isLeftChild()) {
        this.zigZigRight(tree.parent.parent);
        this.splayUp(tree);
    }
    else {
        this.zigZigLeft(tree.parent.parent);
        this.splayUp(tree);
    }
}


TreeSplay.prototype.validateTree = function(tree, parent)
{
    if (!tree) {
        tree = this.treeRoot;
        if (!tree) return;
        // console.log("Validating tree", tree);
    } else {
        if (tree.parent !== parent) console.error("Parent mismatch:", tree, parent);
    }
    if (!tree.graphicID) console.error("Tree missing ID:", tree);
    if (tree.left) this.validateTree(tree.left, tree);
    if (tree.right) this.validateTree(tree.right, tree);
}



TreeSplay.prototype.resizeTree = function()
{
    var startingPoint = this.startingX;
    this.resizeWidths(this.treeRoot);
    if (this.treeRoot != null) {
        if (this.treeRoot.leftWidth > startingPoint) {
            startingPoint = this.treeRoot.leftWidth;
        }
        else if (this.treeRoot.rightWidth > startingPoint) {
            startingPoint = Math.max(this.treeRoot.leftWidth, 2 * startingPoint - this.treeRoot.rightWidth);
        }
        this.setNewPositions(this.treeRoot, startingPoint, TreeSplay.STARTING_Y, 0);
        this.animateNewPositions(this.treeRoot);
        this.cmd("Step");
    }
}


TreeSplay.prototype.setNewPositions = function(tree, xPosition, yPosition, side)
{
    if (tree != null) {
        tree.y = yPosition;
        if (side < 0) {
            xPosition = xPosition - tree.rightWidth;
        }
        else if (side > 0) {
            xPosition = xPosition + tree.leftWidth;
        }
        tree.x = xPosition;
        this.setNewPositions(tree.left, xPosition, yPosition + TreeSplay.HEIGHT_DELTA, -1);
        this.setNewPositions(tree.right, xPosition, yPosition + TreeSplay.HEIGHT_DELTA, 1);
    }
}


TreeSplay.prototype.animateNewPositions = function(tree)
{
    if (tree != null) {
        this.cmd("Move", tree.graphicID, tree.x, tree.y);
        this.animateNewPositions(tree.left);
        this.animateNewPositions(tree.right);
    }
}

TreeSplay.prototype.resizeWidths = function(tree)
{
    if (tree == null) {
        return 0;
    }
    tree.leftWidth = Math.max(this.resizeWidths(tree.left), TreeSplay.WIDTH_DELTA / 2);
    tree.rightWidth = Math.max(this.resizeWidths(tree.right), TreeSplay.WIDTH_DELTA / 2);
    return tree.leftWidth + tree.rightWidth;
}



///////////////////////////////////////////////////////////////////////////////
// Splay tree nodes are ordinary BST nodes

function SplayNode(val, id, initialX, initialY)
{
    this.data = val;
    this.x = initialX;
    this.y = initialY;
    this.graphicID = id;
    this.left = null;
    this.right = null;
    this.parent = null;
    this.leftWidth = 0;
    this.rightWidth = 0;

    this.isLeftChild = () => this.parent == null || this.parent.left == this;
}


///////////////////////////////////////////////////////////////////////////////
// Initialization

var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new TreeSplay(animManag);
}