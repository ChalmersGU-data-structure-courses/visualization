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


function TreeTrie(am)
{
    this.init(am);
}
TreeTrie.inheritFrom(Algorithm);


// Various constants

TreeTrie.FOREGROUND_COLOR = "#007700";
TreeTrie.BACKGROUND_COLOR = "#EEFFEE";

TreeTrie.LINK_COLOR = TreeTrie.FOREGROUND_COLOR;
TreeTrie.HIGHLIGHT_CIRCLE_COLOR = TreeTrie.FOREGROUND_COLOR;
TreeTrie.PRINT_COLOR = TreeTrie.FOREGROUND_COLOR;
TreeTrie.TRUE_COLOR = TreeTrie.BACKGROUND_COLOR;
TreeTrie.FALSE_COLOR = "#FFFFFF";


TreeTrie.NODE_WIDTH = 30;

TreeTrie.WIDTH_DELTA = 50;
TreeTrie.HEIGHT_DELTA = 50;
TreeTrie.STARTING_Y = 80;
TreeTrie.LeftMargin = 300;
TreeTrie.NEW_NODE_Y = 100
TreeTrie.NEW_NODE_X = 50;
TreeTrie.FIRST_PRINT_POS_X = 50;
TreeTrie.PRINT_VERTICAL_GAP = 20;
TreeTrie.PRINT_HORIZONTAL_GAP = 50;



TreeTrie.prototype.init = function(am)
{
    TreeTrie.superclass.init.call(this, am);
    this.addControls();

    this.nextIndex = 0;
    this.commands = [];
    this.cmd("CreateLabel", 0, "", 20, 10, 0);
    this.cmd("CreateLabel", 1, "", 20, 10, 0);
    this.cmd("CreateLabel", 2, "", 20, 30, 0);
    this.nextIndex = 3;
    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();

    this.sizeChanged();
}


TreeTrie.prototype.sizeChanged = function()
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


TreeTrie.prototype.addControls = function()
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


TreeTrie.prototype.reset = function()
{
    this.nextIndex = 3;
    this.root = null;
}


TreeTrie.prototype.insertCallback = function(event)
{
    var insertedValue = this.insertField.value;
    if (insertedValue !== "") {
        this.insertField.value = "";
        this.implementAction(this.add.bind(this), insertedValue);
    }
}


TreeTrie.prototype.deleteCallback = function(event)
{
    var deletedValue = this.deleteField.value;
    if (deletedValue !== "") {
        this.deleteField.value = "";
        this.implementAction(this.deleteElement.bind(this), deletedValue);
    }
}


TreeTrie.prototype.printCallback = function(event)
{
    this.implementAction(this.printTree.bind(this),"");
}



TreeTrie.prototype.findCallback = function(event)
{
    var findValue = this.findField.value;
    if (findValue !== "") {
        this.findField.value = "";
        this.implementAction(this.findElement.bind(this), findValue);
    }
}


TreeTrie.prototype.printTree = function(unused)
{
    this.commands = [];
    if (this.root != null) {
        this.highlightID = this.nextIndex++;
        this.printLabel1 = this.nextIndex++;
        this.printLabel2 = this.nextIndex++;
        var firstLabel = this.nextIndex++;
        this.cmd("CreateLabel", firstLabel, "Output: ", TreeTrie.FIRST_PRINT_POS_X, this.first_print_pos_y);
        this.cmd("CreateHighlightCircle", this.highlightID, TreeTrie.HIGHLIGHT_CIRCLE_COLOR, this.root.x, this.root.y);
        this.cmd("SetWidth", this.highlightID, TreeTrie.NODE_WIDTH);
        this.cmd("CreateLabel", this.printLabel1, "Current String: ", 20, 10, 0);
        this.cmd("CreateLabel", this.printLabel2, "", 20, 10, 0);
        this.cmd("AlignRight", this.printLabel2, this.printLabel1);
        this.xPosOfNextLabel = TreeTrie.FIRST_PRINT_POS_X;
        this.yPosOfNextLabel = this.first_print_pos_y;
        this.printTreeRec(this.root, "");

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


TreeTrie.prototype.printTreeRec = function(tree, stringSoFar)
{
    if (tree.wordRemainder != "") {
    }
    if (tree.isword) {
        var nextLabelID = this.nextIndex++;
        this.cmd("CreateLabel", nextLabelID, stringSoFar + "  ", 20, 10, 0);
        this.cmd("SetForegroundColor", nextLabelID, TreeTrie.PRINT_COLOR);
        this.cmd("AlignRight", nextLabelID, this.printLabel1, TreeTrie.PRINT_COLOR);
        this.cmd("MoveToAlignRight", nextLabelID, nextLabelID - 1);
        this.cmd("Step");

        this.xPosOfNextLabel +=  TreeTrie.PRINT_HORIZONTAL_GAP;
        if (this.xPosOfNextLabel > this.print_max) {
            this.xPosOfNextLabel = TreeTrie.FIRST_PRINT_POS_X;
            this.yPosOfNextLabel += TreeTrie.PRINT_VERTICAL_GAP;
        }
    }
    for (var i = 0; i < 26; i++) {
        if (tree.children[i] != null) {
            var stringSoFar2 = stringSoFar + tree.children[i].wordRemainder;
            var nextLabelID = this.nextIndex++;
            var fromx =  (tree.children[i].x + tree.x) / 2 + TreeTrie.NODE_WIDTH / 2;
            var fromy =  (tree.children[i].y + tree.y) / 2;
            this.cmd("CreateLabel", nextLabelID, tree.children[i].wordRemainder,fromx, fromy, 0);
            this.cmd("MoveToAlignRight", nextLabelID, this.printLabel2);
            this.cmd("Move", this.highlightID, tree.children[i].x, tree.children[i].y);
            this.cmd("Step");
            this.cmd("Delete", nextLabelID);
            this.nextIndex--;
            this.cmd("SetText", this.printLabel2, stringSoFar2);

            this.printTreeRec(tree.children[i], stringSoFar2);
            this.cmd("Move", this.highlightID, tree.x, tree.y);
            this.cmd("SetText", this.printLabel2, stringSoFar);
            this.cmd("Step");
        }
    }
}


TreeTrie.prototype.findElement = function(word)
{
    this.commands = [];
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


TreeTrie.prototype.doFind = function(tree, s)
{
    if (tree == null) {
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
       var index = s.charCodeAt(0) - "A".charCodeAt(0);
       if (tree.children[index] == null) {
            this.cmd("SetText", 2, "Child " + s.charAt(0) + " does not exist\nWord is Not the tree");
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID , 0);
            return null
        }
        this.cmd("CreateHighlightCircle", this.highlightID, TreeTrie.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
        this.cmd("SetWidth", this.highlightID, TreeTrie.NODE_WIDTH);
        this.cmd("SetText", 2, "Making recursive call to " + s.charAt(0) + " child, passing in " + s.substring(1));
        this.cmd("Step")
        this.cmd("SetHighlight", tree.graphicID , 0);
        this.cmd("SetHighlightIndex", 1, -1);
        this.cmd("SetText", 1, "\"" + s.substring(1) + "\"");
        this.cmd("Move", this.highlightID, tree.children[index].x, tree.children[index].y);
        this.cmd("Step");
        this.cmd("Delete", this.highlightID);
        return this.doFind(tree.children[index], s.substring(1))
    }
}


TreeTrie.prototype.insertElement = function(insertedValue)
{
    this.cmd("SetText", 0, "");
    return this.commands;
}


TreeTrie.prototype.insert = function(elem, tree)
{

}


TreeTrie.prototype.deleteElement = function(word)
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
        this.cmd("step");
        this.cmd("SetBackgroundColor", node.graphicID, TreeTrie.FALSE_COLOR);
        node.isword = false;
        this.cmd("SetHighlight", node.graphicID , 0);
        this.cleanupAfterDelete(node);
        this.resizeTree();
    }
    else {
        this.cmd("SetText", 2, "\""+word+"\" not in tree, nothing to delete");
        this.cmd("step");
        this.cmd("SetHighlightIndex", 1,  -1);
    }

    this.cmd("SetText", 0, "");
    this.cmd("SetText", 1, "");
    this.cmd("SetText", 2, "");
    return this.commands;
}



TreeTrie.prototype.numChildren = function(tree)
{
    if (tree == null) {
        return 0;
    }
    var children = 0;
    for (var i = 0; i < 26; i++) {
        if (tree.children[i] != null) {
            children++;
        }
    }
    return children;
}


TreeTrie.prototype.cleanupAfterDelete = function(tree)
{
    var children = this.numChildren(tree)
    if (children == 0 && !tree.isword) {
        this.cmd("SetText", 2, "Deletion left us with a \"False\" leaf\nRemoving false leaf");
        this.cmd("SetHighlight" ,tree.graphicID , 1);
        this.cmd("Step");
        this.cmd("SetHighlight", tree.graphicID , 0);
        if (tree.parent != null) {
            var index = 0
            while (tree.parent.children[index] != tree) {
                index++;
            }
            this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
            this.cmd("Delete", tree.graphicID , 0);
            tree.parent.children[index] = null;
            this.cleanupAfterDelete(tree.parent);
        }
        else {
            this.cmd("Delete", tree.graphicID , 0);
            this.root = null;
        }
    }
}


TreeTrie.prototype.resizeTree = function()
{
    this.resizeWidths(this.root);
    if (this.root != null) {
        var startingPoint = this.root.width / 2 + 1 + TreeTrie.LeftMargin;
        this.setNewPositions(this.root, startingPoint, TreeTrie.STARTING_Y);
        this.animateNewPositions(this.root);
        this.cmd("Step");
    }
}


TreeTrie.prototype.add = function(word)
{
    this.commands = new Array();
    this.cmd("SetText", 0, "Inserting; ");
    this.cmd("SetText", 1, "\"" + word  + "\"");
    this.cmd("AlignRight", 1, 0);
    this.cmd("Step");
    if (this.root == null) {
        this.cmd("CreateCircle", this.nextIndex, "", TreeTrie.NEW_NODE_X, TreeTrie.NEW_NODE_Y);
        this.cmd("SetForegroundColor", this.nextIndex, TreeTrie.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", this.nextIndex, TreeTrie.FALSE_COLOR);
        this.cmd("SetWidth", this.nextIndex, TreeTrie.NODE_WIDTH);
        this.cmd("SetText", 2, "Creating a new root");
        this.root = new TrieNode("", this.nextIndex, TreeTrie.NEW_NODE_X, TreeTrie.NEW_NODE_Y)
        this.cmd("Step");
        this.resizeTree();
        this.cmd("SetText", 2, "" );
        this.highlightID = this.nextIndex++;
        this.nextIndex++;
    }
    this.addR(word.toUpperCase(), this.root);
    this.cmd("SetText", 0, "");
    this.cmd("SetText", 1, "");
    this.cmd("SetText", 2, "");
    return this.commands;
}


TreeTrie.prototype.addR = function(s, tree)
{
    this.cmd("SetHighlight", tree.graphicID , 1);

    if (s.length == 0) {
        this.cmd("SetText", 2, "Reached the end of the string \nSet current node to true");
        this.cmd("Step");
        // this.cmd("SetText", tree.graphicID, "T");
        this.cmd("SetBackgroundColor", tree.graphicID, TreeTrie.TRUE_COLOR);
        this.cmd("SetHighlight", tree.graphicID , 0);
        tree.isword = true;
        return;
    }
    else {
       this.cmd("SetHighlightIndex", 1, 1);
       var index = s.charCodeAt(0) - "A".charCodeAt(0);
       if (tree.children[index] == null) {
           this.cmd("CreateCircle", this.nextIndex, s.charAt(0), TreeTrie.NEW_NODE_X, TreeTrie.NEW_NODE_Y);
           this.cmd("SetForegroundColor", this.nextIndex, TreeTrie.FOREGROUND_COLOR);
           this.cmd("SetBackgroundColor", this.nextIndex, TreeTrie.FALSE_COLOR);
           this.cmd("SetWidth", this.nextIndex, TreeTrie.NODE_WIDTH);
           this.cmd("SetText", 2, "Child " + s.charAt(0) + " does not exist.  Creating ... ");
           tree.children[index] = new TrieNode(s.charAt(0), this.nextIndex, TreeTrie.NEW_NODE_X, TreeTrie.NEW_NODE_Y)
           tree.children[index].parent = tree;
           this.cmd("Connect", tree.graphicID, tree.children[index].graphicID, TreeTrie.FOREGROUND_COLOR, 0, false, s.charAt(0));

           this.cmd("Step");
           this.resizeTree();
           this.cmd("SetText", 2, "" );
           this.nextIndex++;
           this.highlightID = this.nextIndex++;
        }
        this.cmd("CreateHighlightCircle", this.highlightID, TreeTrie.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
        this.cmd("SetWidth", this.highlightID, TreeTrie.NODE_WIDTH);
        this.cmd("SetText", 2, "Making recursive call to " + s.charAt(0) + " child, passing in \"" + s.substring(1) + "\"");
        this.cmd("Step")
        this.cmd("SetHighlight", tree.graphicID , 0);
        this.cmd("SetHighlightIndex", 1, -1);
        this.cmd("SetText", 1, "\"" + s.substring(1) + "\"");

        this.cmd("Move", this.highlightID, tree.children[index].x, tree.children[index].y);
        this.cmd("Step")
        this.cmd("Delete", this.highlightID);
        this.addR(s.substring(1), tree.children[index])
    }
}


TreeTrie.prototype.setNewPositions = function(tree, xPosition, yPosition)
{
    if (tree != null) {
        tree.x = xPosition;
        tree.y = yPosition;
        var newX = xPosition - tree.width / 2;
        var newY = yPosition + TreeTrie.HEIGHT_DELTA;
        for (var i = 0; i < 26; i++) {
                if (tree.children[i] != null) {
                    this.setNewPositions(tree.children[i], newX + tree.children[i].width / 2, newY);
                    newX = newX + tree.children[i].width;
                }
        }
    }
}


TreeTrie.prototype.animateNewPositions = function(tree)
{
    if (tree != null) {
        this.cmd("Move", tree.graphicID, tree.x, tree.y);
        for (var i = 0; i < 26; i++) {
            this.animateNewPositions(tree.children[i])
        }
    }
}


TreeTrie.prototype.resizeWidths = function(tree)
{
    if (tree == null) {
        return 0;
    }
    var size = 0;
    for (var i = 0; i < 26; i++) {
        tree.childWidths[i] = this.resizeWidths(tree.children[i]);
        size += tree.childWidths[i]
    }
    tree.width = Math.max(size, TreeTrie.NODE_WIDTH + 4)
    return tree.width;
}



function TrieNode(val, id, initialX, initialY)
{
    this.wordRemainder = val;
    this.x = initialX;
    this.y = initialY;
    this.graphicID = id;
    this.children = new Array(26);
    this.childWidths = new Array(26);
    for (var i = 0; i < 26; i++) {
        this.children[i] = null;
        this.childWidths[i] =0;
    }
    this.width = 0;
    this.parent = null;
}



var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new TreeTrie(animManag);
}