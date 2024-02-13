// Copyright 2016 David Galles, University of San Francisco. All rights reserved.
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
// WARRANTIES, INCLUDING, BUT NOT LIIBTED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
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


function TreeTernary(am)
{
    this.init(am);
}
TreeTernary.inheritFrom(Algorithm);


// Various constants

TreeTernary.FOREGROUND_COLOR = "#007700";
TreeTernary.BACKGROUND_COLOR = "#CCFFCC";

TreeTernary.CENTER_LINK_COLOR = TreeTernary.FOREGROUND_COLOR;
TreeTernary.SIDE_LINK_COLOR = "#8888AA";
TreeTernary.HIGHLIGHT_CIRCLE_COLOR = TreeTernary.FOREGROUND_COLOR;
TreeTernary.PRINT_COLOR = TreeTernary.FOREGROUND_COLOR;
TreeTernary.TRUE_COLOR = TreeTernary.BACKGROUND_COLOR;
TreeTernary.FALSE_COLOR = "#FFFFFF"


TreeTernary.NODE_WIDTH = 30;

TreeTernary.WIDTH_DELTA = 50;
TreeTernary.HEIGHT_DELTA = 50;
TreeTernary.STARTING_Y = 20;
TreeTernary.LeftMargin = 300;
TreeTernary.NEW_NODE_Y = 100
TreeTernary.NEW_NODE_X = 50;
TreeTernary.FIRST_PRINT_POS_X = 50;
TreeTernary.PRINT_VERTICAL_GAP = 20;
TreeTernary.PRINT_HORIZONTAL_GAP = 50;



TreeTernary.prototype.init = function(am)
{
    TreeTernary.superclass.init.call(this, am);
    this.addControls();

    this.nextIndex = 0;
    this.commands = [];
    this.cmd("CreateLabel", 0, "", 20, 10, 0);
    this.cmd("CreateLabel", 1, "", 20, 10, 0);
    this.cmd("CreateLabel", 2, "", 20, 30, 0);
    this.nextIndex = 3;
    this.root = null;
    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();

    this.sizeChanged();
}


TreeTernary.prototype.sizeChanged = function()
{
    var w = this.getCanvasWidth();
    var h = this.getCanvasHeight();

    this.startingX = w / 2;
    this.first_print_pos_y = h - 2 * TreeTrie.PRINT_VERTICAL_GAP;
    this.print_max = w - 10;
    
    this.implementAction(() => {
        this.commands = [];
        this.resizeTree();
        return this.commands;
    });
}


TreeTernary.prototype.addControls = function()
{
    this.insertField = this.addControlToAlgorithmBar("Text", "", {maxlength: 12, size: 12});
    this.addReturnSubmit(this.insertField, "ALPHA", this.insertCallback.bind(this));
    this.insertButton = this.addControlToAlgorithmBar("Button", "Insert");
    this.insertButton.onclick = this.insertCallback.bind(this);

    this.deleteField = this.addControlToAlgorithmBar("Text", "", {maxlength: 12, size: 12});
    this.addReturnSubmit(this.deleteField, "ALPHA", this.deleteCallback.bind(this));
    this.deleteButton = this.addControlToAlgorithmBar("Button", "Delete");
    this.deleteButton.onclick = this.deleteCallback.bind(this);

    this.findField = this.addControlToAlgorithmBar("Text", "", {maxlength: 12, size: 12});
    this.addReturnSubmit(this.findField, "ALPHA", this.findCallback.bind(this));
    this.findButton = this.addControlToAlgorithmBar("Button", "Find");
    this.findButton.onclick = this.findCallback.bind(this);

    this.printButton = this.addControlToAlgorithmBar("Button", "Print");
    this.printButton.onclick = this.printCallback.bind(this);
}

TreeTernary.prototype.reset = function()
{
    this.nextIndex = 3;
    this.root = null;
}

TreeTernary.prototype.insertCallback = function(event)
{
    var insertedValue = this.insertField.value;
    if (insertedValue !== "") {
        this.insertField.value = "";
        this.implementAction(this.add.bind(this), insertedValue);
    }
}


TreeTernary.prototype.deleteCallback = function(event)
{
    var deletedValue = this.deleteField.value;
    if (deletedValue !== "") {
        this.deleteField.value = "";
        this.implementAction(this.deleteElement.bind(this), deletedValue);
    }

}


TreeTernary.prototype.cleanupAfterDelete = function(tree)
{
    if (tree == null) {
        return;
    }
    else if (tree.center != null) {
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("SetText", 2, "Clerning up after delete ...\nTree has center child, no more cleanup required");
        this.cmd("step");
        this.cmd("SetText", 2, "");
        this.cmd("SetHighlight", tree.graphicID, 0);
        return;
    }
    else if (tree.center == null && tree.right == null && tree.left == null && tree.isword == true) {
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("SetText", 2, "Clerning up after delete ...\nLeaf at end of word, no more cleanup required");
        this.cmd("step");
        this.cmd("SetText", 2, "");
        this.cmd("SetHighlight", tree.graphicID, 0);
        return;
    }
    else if (tree.center == null && tree.left == null && tree.right == null) {
        this.cmd("SetText", 2, "Clearning up after delete ...");
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("step");
        this.cmd("Delete", tree.graphicID);
        if (tree.parent == null) {
            this.root = null;
        }
        else if (tree.parent.left == tree) {
            this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
            tree.parent.left = null;
        }
        else if (tree.parent.right == tree) {
            this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
            tree.parent.right = null;
        }
        else if (tree.parent.center == tree) {
            this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
            tree.parent.center = null;
            tree.parent.charAt = " ";
            this.cmd("SetText", tree.parent.graphicID, " ");
        }
        this.cleanupAfterDelete(tree.parent);
    }
    else if ((tree.left == null && tree.center == null)  || (tree.right == null && tree.center == null)) {
        var child = null
        if (tree.left != null)
            child = tree.left
        else
            child = tree.right;
        this.cmd("Disconnect", tree.graphicID, child.graphicID);
        if (tree.parent == null) {
            this.cmd("Delete", tree.graphicID);
            this.root = child;
        }
        else if (tree.parent.left == tree) {
            this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
            this.cmd("Connect", tree.parent.graphicID, child.graphicID, TreeTernary.SIDE_LINK_COLOR, 0.0001, false, "<" + tree.parent.nextChar)
            tree.parent.left = child;
            child.parent = tree.parent;
            this.cmd("Step");
            this.cmd("Delete", tree.graphicID);
        }
        else if (tree.parent.right == tree) {
            this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
            this.cmd("Connect", tree.parent.graphicID, child.graphicID, TreeTernary.SIDE_LINK_COLOR, -0.0001, false, ">" + tree.parent.nextChar)
            tree.parent.right = child;
            child.parent = tree.parent;
            this.cmd("Step");
            this.cmd("Delete", tree.graphicID);
        }
        else if (tree.parent.center == tree) {
            this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
            this.cmd("Connect", tree.parent.graphicID, child.graphicID, TreeTernary.CENTER_LINK_COLOR, 0.0001, false, "=" + tree.parent.nextChar)
            child.parent = tree.parent;
            tree.parent.center = child;
            this.cmd("Step");
            this.cmd("Delete", tree.graphicID);
        }
        else {
            throw("What??")
        }
    }
    else if (tree.right != null && tree.center == null && tree.right != null) {
        var node = tree.left;

        var parent = tree.parent;
        this.cmd("CreateHighlightCircle", this.highlightID, TreeTernary.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
        this.cmd("SetWidth", this.highlightID, TreeTernary.NODE_WIDTH);
        this.cmd("Move", this.highlightID, node.x, node.y);
        this.cmd("Step")
        while (node.right != null) {
            node = node.right;
            this.cmd("Move", this.highlightID, node.x, node.y);
            this.cmd("Step")
        }
        if (tree.left != node) {
            this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
            node.parent.right = node.left;
            if (node.left != null) {
                node.left.parent = node.parent;
                this.cmd("Disconnect", node.graphicID, node.left.graphicID);
                this.cmd("Connect", node.parent.graphicID, node.left.graphicID, TreeTernary.CENTER_LINK_COLOR, -0.0001, false, ">" + node.parent.nextChar)
            }
            this.cmd("Disconnect", tree.graphicID, tree.right.graphicID);
            this.cmd("Disconnect", tree.graphicID, tree.left.graphicID);
            node.right = tree.right;
            node.left = tree.left;
            tree.right.parent = node;
            tree.left.parent = node;
            this.cmd("Connect", node.graphicID, node.left.graphicID, TreeTernary.SIDE_LINK_COLOR, 0.0001, false, "<" + node.nextChar)
            this.cmd("Connect", node.graphicID, node.right.graphicID, TreeTernary.SIDE_LINK_COLOR, -0.0001, false, ">" + node.nextChar)
        }
        else {
            this.cmd("Disconnect", tree.graphicID, tree.left.graphicID);
            this.cmd("Disconnect", tree.graphicID, tree.right.graphicID);
            node.right = tree.right;
            node.right.parent = node;
            this.cmd("Connect", node.graphicID, node.right.graphicID, TreeTernary.SIDE_LINK_COLOR, -0.0001, false, ">" + node.nextChar)
        }
        this.cmd("Delete", this.highlightID);
        this.cmd("Delete", tree.graphicID);
        this.cmd("Step");
        node.parent = tree.parent;
        if (node.parent == null) {
            this.root = node;
        }
        else {
            this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
            if (tree.parent.left == tree) {
                tree.parent.left = node;
                node.parent = tree.parent;
                this.cmd("Connect", node.parent.graphicID, node.graphicID, TreeTernary.SIDE_LINK_COLOR, 0.0001, false, "<" + node.parent.nextChar)
            }
            else if (tree.parent.right == tree) {
                tree.parent.right = node;
                node.parent = tree.parent;
                this.cmd("Connect", node.parent.graphicID, node.graphicID, TreeTernary.SIDE_LINK_COLOR, -0.0001, false, ">" + node.parent.nextChar)
            }
            else if (tree.parent.center == tree) {
                tree.parent.center = node;
                node.parent = tree.parent;
                this.cmd("Connect", node.parent.graphicID, node.graphicID, TreeTernary.CENTER_LINK_COLOR, 0.0001, false, "=" + node.parent.nextChar)
            }
            else {
            }
        }
    }
}


TreeTernary.prototype.deleteElement = function(word)
{
    this.commands = [];
    this.cmd("SetText", 0, "Deleting: ");
    this.cmd("SetText", 1, "\"" + word  + "\"");
    this.cmd("AlignRight", 1, 0);
    this.cmd("Step");


    var node = this.doFind(this.root, word);
    if (node != null) {
        this.cmd("SetHighlight", node.graphicID , 1);
        this.cmd("SetText", 2, "Found \""+word+"\", setting value in tree to False");
        this.cmd("step")
        this.cmd("SetBackgroundColor", node.graphicID, TreeTernary.FALSE_COLOR);
        node.isword = false
        this.cmd("SetHighlight", node.graphicID , 0);
        this.cleanupAfterDelete(node)
        this.resizeTree()
    }
    else {
        this.cmd("SetText", 2, "\""+word+"\" not in tree, nothing to delete");
        this.cmd("step")
        this.cmd("SetHighlightIndex", 1,  -1)
    }
    this.cmd("SetText", 0, "");
    this.cmd("SetText", 1, "");
    this.cmd("SetText", 2, "");
    return this.commands;
}



TreeTernary.prototype.printCallback = function(event)
{
    this.implementAction(this.printTree.bind(this),"");
}


TreeTernary.prototype.printTree = function(unused)
{

    this.commands = [];

    if (this.root != null) {
        this.highlightID = this.nextIndex++;
        this.printLabel1 = this.nextIndex++;
        this.printLabel2 = this.nextIndex++;
        var firstLabel = this.nextIndex++;
        this.cmd("CreateLabel", firstLabel, "Output: ", TreeTernary.FIRST_PRINT_POS_X, this.first_print_pos_y);
        this.cmd("CreateHighlightCircle", this.highlightID, TreeTernary.HIGHLIGHT_CIRCLE_COLOR, this.root.x, this.root.y);
        this.cmd("SetWidth", this.highlightID, TreeTernary.NODE_WIDTH);
        this.cmd("CreateLabel", this.printLabel1, "Current String: ", 20, 10, 0);
        this.cmd("CreateLabel", this.printLabel2, "", 20, 10, 0);
        this.cmd("AlignRight", this.printLabel2, this.printLabel1);
        this.xPosOfNextLabel = TreeTernary.FIRST_PRINT_POS_X;
        this.yPosOfNextLabel = this.first_print_pos_y;
        this.printTreeRec(this.root, "");

        // this.cmd("SetText", this.printLabel1, "About to delete");
        // this.cmd("Step")

        this.cmd("Delete",  this.highlightID);
        this.cmd("Delete",  this.printLabel1);
        this.cmd("Delete",  this.printLabel2);
        this.cmd("Step")

        for (var i = firstLabel; i < this.nextIndex; i++) {
            this.cmd("Delete", i);
        }
        this.nextIndex = this.highlightID;  /// Reuse objects.  Not necessary.
    }
    return this.commands;
}


TreeTernary.prototype.printTreeRec = function(tree, stringSoFar)
{
    if (tree.isword) {
        var nextLabelID = this.nextIndex++;
        this.cmd("CreateLabel", nextLabelID, stringSoFar + "  ", 20, 10, 0);
        this.cmd("SetForegroundColor", nextLabelID, TreeTernary.PRINT_COLOR);
        this.cmd("AlignRight", nextLabelID, this.printLabel1, TreeTernary.PRINT_COLOR);
        this.cmd("MoveToAlignRight", nextLabelID, nextLabelID - 1);
        this.cmd("Step");

        this.xPosOfNextLabel +=  TreeTernary.PRINT_HORIZONTAL_GAP;
        if (this.xPosOfNextLabel > this.print_max) {
            this.xPosOfNextLabel = TreeTernary.FIRST_PRINT_POS_X;
            this.yPosOfNextLabel += Ternrary.PRINT_VERTICAL_GAP;
        }
    }
    if (tree.left != null) {
        this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
        this.cmd("Step");
        this.printTreeRec(tree.left, stringSoFar);
        this.cmd("Move", this.highlightID, tree.x, tree.y);
        this.cmd("Step");
    }
    if (tree.center != null) {
        var nextLabelID = this.nextIndex;
        this.cmd("CreateLabel", nextLabelID, tree.nextChar, tree.x, tree.y, 0);
        this.cmd("MoveToAlignRight", nextLabelID, this.printLabel2);

        this.cmd("Move", this.highlightID, tree.center.x, tree.center.y);
        this.cmd("Step");
        this.cmd("Delete", nextLabelID);
        this.cmd("SetText", this.printLabel2, stringSoFar + tree.nextChar);
        this.printTreeRec(tree.center, stringSoFar + tree.nextChar);
        this.cmd("Move", this.highlightID, tree.x, tree.y);
        this.cmd("SetText", this.printLabel2, stringSoFar);
        this.cmd("Step");
    }
    if (tree.right != null) {
        this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
        this.cmd("Step");
        this.printTreeRec(tree.right, stringSoFar);
        this.cmd("Move", this.highlightID, tree.x, tree.y);
        this.cmd("Step");
    }
}


TreeTernary.prototype.findCallback = function(event)
{
    var findValue = this.findField.value;
    if (findValue !== "") {
        this.findField.value = "";
        this.implementAction(this.findElement.bind(this), findValue);
    }
}

TreeTernary.prototype.findElement = function(word)
{
    this.commands = [];

    this.commands = new Array();
    this.cmd("SetText", 0, "Finding: ");
    this.cmd("SetText", 1, "\"" + word  + "\"");
    this.cmd("AlignRight", 1, 0);
    this.cmd("Step");

    var node = this.doFind(this.root, word);
    if (node != null) {
        this.cmd("SetText", 0, "Found \""+word+"\"");
    }
    else {
        this.cmd("SetText", 0, "\""+word+"\" not Found");
    }

    this.cmd("SetText", 1, "");
    this.cmd("SetText", 2, "");

    return this.commands;
}


TreeTernary.prototype.doFind = function(tree, s)
{
    if (tree == null) {
        this.cmd("SetText", 2, "Reached null tree\nWord is not in the tree");
        this.cmd("Step");
        return null;
    }
    this.cmd("SetHighlight", tree.graphicID , 1);

    if (s.length == 0) {
        if (tree.isword == true) {
            this.cmd("SetText", 2, "Reached the end of the string \nCurrent node is True\nWord is in the tree");
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID , 0);
            return tree
        }
        else {
            this.cmd("SetText", 2, "Reached the end of the string \nCurrent node is False\nWord is Not the tree");
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID , 0);
            return null

        }
    }
    else {
        this.cmd("SetHighlightIndex", 1, 1);

        var child = null;
        if (tree.nextChar == " ") {
            this.cmd("SetText", 2, "Reached a leaf without a character, still have characeters left in search string \nString is not in the tree");
            this.cmd("Step");
            this.cmd("SetHighlightIndex", 1, -1);
            this.cmd("SetHighlight", tree.graphicID , 0);
            return null;
        }

        if (tree.nextChar == s.charAt(0)) {
            this.cmd("SetText", 2, "Next character in string  matches character at current node\nRecursively look at center child, \nremoving first letter from search string");
            this.cmd("Step");
            s = s.substring(1);
            child = tree.center;
        }
        else if (tree.nextChar > s.charAt(0)) {
            this.cmd("SetText", 2, "Next character in string < Character at current node\nRecursively look at left node, \nleaving search string as it is");
            this.cmd("Step");
            child = tree.left;
        }
        else {
            this.cmd("SetText", 2, "Next character in string > Character at current node\nRecursively look at left right, \nleaving search string as it is");
            this.cmd("Step");
            child = tree.right;
        }
        if (child != null) {
            this.cmd("SetText", 1, "\""+s+"\"");
            this.cmd("SetHighlightIndex", 1, -1);

            this.cmd("CreateHighlightCircle", this.highlightID, TreeTernary.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
            this.cmd("SetWidth", this.highlightID, TreeTernary.NODE_WIDTH);
            this.cmd("SetHighlight", tree.graphicID , 0);

            this.cmd("Move", this.highlightID, child.x, child.y);
            this.cmd("Step")
            this.cmd("Delete", this.highlightID);
        }
        else {
            this.cmd("SetHighlight", tree.graphicID , 0);
        }
        return this.doFind(child, s)
    }
}


TreeTernary.prototype.insertElement = function(insertedValue)
{
    this.cmd("SetText", 0, "");
    return this.commands;
}


TreeTernary.prototype.insert = function(elem, tree)
{

}



TreeTernary.prototype.resizeTree = function()
{
    this.resizeWidths(this.root);
    if (this.root != null) {
        var startingPoint = TreeTernary.LeftMargin;
        if (this.root.left == null) {
            startingPoint += TreeTernary.NODE_WIDTH / 2;
        }
        else {
            startingPoint += this.root.left.width;
        }
        // var startingPoint = this.root.width / 2 + 1 + Ternary.LeftMargin;
        this.setNewPositions(this.root, startingPoint, TreeTernary.STARTING_Y);
        this.animateNewPositions(this.root);
        this.cmd("Step");
    }
}


TreeTernary.prototype.add = function(word)
{
    this.commands = new Array();
    this.cmd("SetText", 0, "Inserting; ");
    this.cmd("SetText", 1, "\"" + word  + "\"");
    this.cmd("AlignRight", 1, 0);
    this.cmd("Step");
    if (this.root == null) {
        this.cmd("CreateCircle", this.nextIndex, " ", TreeTernary.NEW_NODE_X, TreeTernary.NEW_NODE_Y);
        this.cmd("SetForegroundColor", this.nextIndex, TreeTernary.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", this.nextIndex, TreeTernary.FALSE_COLOR);
        this.cmd("SetWidth", this.nextIndex, TreeTernary.NODE_WIDTH);
        this.cmd("SetText", 2, "Creating a new root");
        this.root = new TernaryNode(" ", this.nextIndex, TreeTernary.NEW_NODE_X, TreeTernary.NEW_NODE_Y)
        this.cmd("Step");
        this.resizeTree();
        this.cmd("SetText", 2, "" );
        this.nextIndex++;
        this.highlightID = this.nextIndex++;
    }
    this.addR(word.toUpperCase(), this.root);
    this.cmd("SetText", 0, "");
    this.cmd("SetText", 1, "");
    this.cmd("SetText", 2, "");
    return this.commands;
}


TreeTernary.prototype.createIfNotExtant = function (tree, child, label)
{
    if (child == null) {
        this.cmd("CreateCircle", this.nextIndex, " ", TreeTernary.NEW_NODE_X, TreeTernary.NEW_NODE_Y);
        this.cmd("SetForegroundColor", this.nextIndex, TreeTernary.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", this.nextIndex, TreeTernary.FALSE_COLOR);
        this.cmd("SetWidth", this.nextIndex, TreeTernary.NODE_WIDTH);
        this.cmd("SetText", 2, "Creating a new node");
        child = new TernaryNode(" ", this.nextIndex, TreeTernary.NEW_NODE_X, TreeTernary.NEW_NODE_Y)
        this.cmd("Step");
        var dir = 0.0001;
        if (label.charAt(0) == '>') {
            dir = -0.0001
        }
        var color = TreeTernary.FOREGROUND_COLOR;
        if (label.charAt(0) == "=") {
            color = TreeTernary.CENTER_LINK_COLOR;
        }
        else {
            color = TreeTernary.SIDE_LINK_COLOR;
        }
        this.cmd("Connect", tree.graphicID, this.nextIndex, color, dir, false, label)
        this.cmd("SetText", 2, "" );
        this.nextIndex++;
        this.highlightID = this.nextIndex++;
    }
    return child;
}


TreeTernary.prototype.addR = function(s, tree)
{
    this.cmd("SetHighlight", tree.graphicID , 1);
    if (s.length == 0) {
            this.cmd("SetText", 2, "Reached the end of the string \nSet current node to true");
            this.cmd("Step");
            this.cmd("SetBackgroundColor", tree.graphicID, TreeTernary.TRUE_COLOR);
            this.cmd("SetHighlight", tree.graphicID , 0);
            tree.isword = true;
            return;
    }
    else {
       this.cmd("SetHighlightIndex", 1, 1);
       if (tree.nextChar == ' ') {
           tree.nextChar = s.charAt(0);
           this.cmd("SetText", 2, "No character for this node, setting to " + s.charAt(0));
           this.cmd("SetText", tree.graphicID, s.charAt(0));
           this.cmd("Step");
           if (tree.center == null) {
               tree.center = this.createIfNotExtant(tree, tree.center, "="+s.charAt(0));
               tree.center.parent = tree;
               this.resizeTree();
           }
           this.cmd("SetHighlightIndex", 1, -1);
           this.cmd("SetHighlight", tree.graphicID , 0);
           this.cmd("SetText", 1, "\"" + s.substring(1) + "\"");

           this.cmd("CreateHighlightCircle", this.highlightID, TreeTernary.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
           this.cmd("SetWidth", this.highlightID, TreeTernary.NODE_WIDTH);
           this.cmd("Move", this.highlightID, tree.center.x, tree.center.y);
           this.cmd("Step")
           this.cmd("Delete", this.highlightID);

           this.addR(s.substring(1), tree.center)
       }
       else if (tree.nextChar == s.charAt(0)) {
           this.cmd("CreateHighlightCircle", this.highlightID, TreeTernary.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
           this.cmd("SetWidth", this.highlightID, TreeTernary.NODE_WIDTH);
           this.cmd("SetText", 2, "Making recursive call to center child, passing in \"" + s.substring(1) + "\"");
           this.cmd("Step")
           this.cmd("SetHighlight", tree.graphicID , 0);
           this.cmd("SetHighlightIndex", 1, -1);
           this.cmd("SetText", 1, "\"" + s.substring(1) + "\"");
           this.cmd("Move", this.highlightID, tree.center.x, tree.center.y);
           this.cmd("Step")
           this.cmd("Delete", this.highlightID);
           this.addR(s.substring(1), tree.center)
       }
       else {
        var child = null;
        var label = "";
        if (tree.nextChar > s.charAt(0)) {
            label = "<" + tree.nextChar;
            this.cmd("SetText", 2, "Next character in stirng is < value stored at current node \n Making recursive call to left child passing in \"" + s+ "\"");
            tree.left = this.createIfNotExtant(tree, tree.left, label);
            tree.left.parent = tree;
            this.resizeTree();
            child = tree.left;
        }
        else {
            label = ">" + tree.nextChar;
            this.cmd("SetText", 2, "Next character in stirng is > value stored at current node \n Making recursive call to right child passing in \"" + s + "\"");
            tree.right= this.createIfNotExtant(tree, tree.right, label);
            tree.right.parent = tree;
            child = tree.right;
            this.resizeTree();
        }
            this.cmd("CreateHighlightCircle", this.highlightID, TreeTernary.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
            this.cmd("SetWidth", this.highlightID, TreeTernary.NODE_WIDTH);
            this.cmd("Step")
            this.cmd("SetHighlight", tree.graphicID , 0);
            this.cmd("SetHighlightIndex", 1, -1);
            // this.cmd("SetText", 1, "\"" + s.substring(1) + "\"");
            this.cmd("Move", this.highlightID, child.x, child.y);
            this.cmd("Step")
            this.cmd("Delete", this.highlightID);
            this.addR(s, child)
        }
    }
}


TreeTernary.prototype.setNewPositions = function(tree, xLeft, yPosition)
{
    if (tree != null) {
        tree.x = xLeft + TreeTernary.NODE_WIDTH / 2;
        tree.y = yPosition;
        var newYPos = yPosition + TreeTernary.HEIGHT_DELTA;
        if (tree.left != null) {
           this.setNewPositions(tree.left, xLeft, newYPos);
        }
        if (tree.center != null) {
            this.setNewPositions(tree.center, xLeft + tree.leftWidth, newYPos);
            tree.x = tree.center.x;
        }
        if (tree.right != null) {
            this.setNewPositions(tree.right, xLeft + tree.leftWidth + tree.centerWidth, newYPos);
        }
    }
}


TreeTernary.prototype.animateNewPositions = function(tree)
{
    if (tree != null) {
        this.cmd("Move", tree.graphicID, tree.x, tree.y);
        this.animateNewPositions(tree.left)
        this.animateNewPositions(tree.center)
        this.animateNewPositions(tree.right)
    }
}


TreeTernary.prototype.resizeWidths = function(tree)
{
    if (tree == null) {
        return 0;
    }
    tree.leftWidth = (this.resizeWidths(tree.left));
    tree.centerWidth = (this.resizeWidths(tree.center));
    tree.rightWidth = (this.resizeWidths(tree.right));
    tree.width = Math.max(tree.leftWidth + tree.centerWidth+tree.rightWidth, TreeTernary.NODE_WIDTH + 4);
    return tree.width;
}


function TernaryNode(val, id, initialX, initialY)
{
    this.nextChar = val;
    this.x = initialX;
    this.y = initialY;
    this.graphicID = id;

    this.left = null;
    this.center = null;
    this.right = null;
    this.leftWidth = 0;
    this.centerWidth = 0;
    this.rightWwidth = 0;
    this.parent = null;
}


var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new TreeTernary(animManag);
}
