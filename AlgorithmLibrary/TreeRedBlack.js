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


class RedBlackNode {
    constructor(val, id, blackLevel, initialX, initialY) {
        this.data = val;
        this.x = initialX;
        this.y = initialY;
        this.blackLevel = blackLevel;
        this.phantomLeaf = false;
        this.graphicID = id;
        this.left = null;
        this.right = null;
        this.parent = null;
        this.leftWidth = 0;
        this.rightWidth = 0;
    }
    isLeftChild() {
        return this.parent == null || this.parent.left == this;
    }
}


class TreeRedBlack extends Algorithm {

    static FOREGROUND_RED = "#770000";
    static BACKGROUND_RED = "#FFBBBB";
    static FOREGROUND_BLACK = "#000000";
    static BACKGROUND_BLACK = "#CCCCCC";
    static BACKGROUND_DOUBLE_BLACK = "#777777";
    static BACKGROUND_NULL_LEAF = TreeRedBlack.BACKGROUND_DOUBLE_BLACK;

    static HIGHLIGHT_LABEL_COLOR = "#FF0000";
    static HIGHLIGHT_LINK_COLOR = TreeRedBlack.HIGHLIGHT_LABEL_COLOR;

    static LINK_COLOR = TreeRedBlack.FOREGROUND_BLACK;
    static HIGHLIGHT_COLOR = "#007700";
    static PRINT_COLOR = TreeRedBlack.FOREGROUND_BLACK;

    static NODE_SIZE = 40;
    static NULL_LEAF_SIZE = TreeRedBlack.NODE_SIZE / 2;
    static WIDTH_DELTA = TreeRedBlack.NODE_SIZE + 10;
    static HEIGHT_DELTA = TreeRedBlack.NODE_SIZE + 10;
    static STARTING_Y = 50;

    static FIRST_PRINT_POS_X = 50;
    static PRINT_VERTICAL_GAP = 20;
    static PRINT_HORIZONTAL_GAP = 50;

    static MESSAGE_X = 10;
    static MESSAGE_Y = 10;


    constructor(am) {
        super();
        this.init(am);
    }

    init(am) {
        super.init(am);
        this.addControls();
        this.setup();
    }

    setup() {
        this.nextIndex = 0;
        this.commands = [];
        this.messageID = this.nextIndex++;
        this.cmd("CreateLabel", this.messageID, "", TreeRedBlack.MESSAGE_X, TreeRedBlack.MESSAGE_Y, 0);

        this.initialIndex = this.nextIndex;
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();

        this.sizeChanged();
    }

    sizeChanged() {
        var w = this.getCanvasWidth();
        var h = this.getCanvasHeight();

        this.startingX = w / 2;
        this.first_print_pos_y = h - 3 * TreeRedBlack.PRINT_VERTICAL_GAP;
        this.print_max = w - TreeRedBlack.PRINT_HORIZONTAL_GAP;

        this.implementAction(() => {
            this.commands = [];
            this.resizeTree();
            return this.commands;
        });
    }

    addControls() {
        this.insertField = this.addControlToAlgorithmBar("Text", "", { maxlength: 4, size: 4 });
        this.addReturnSubmit(this.insertField, "ALPHANUM", this.insertCallback.bind(this));
        this.insertButton = this.addControlToAlgorithmBar("Button", "Insert");
        this.insertButton.onclick = this.insertCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.deleteField = this.addControlToAlgorithmBar("Text", "", { maxlength: 4, size: 4 });
        this.addReturnSubmit(this.deleteField, "ALPHANUM", this.deleteCallback.bind(this));
        this.deleteButton = this.addControlToAlgorithmBar("Button", "Delete");
        this.deleteButton.onclick = this.deleteCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.findField = this.addControlToAlgorithmBar("Text", "", { maxlength: 4, size: 4 });
        this.addReturnSubmit(this.findField, "ALPHANUM", this.findCallback.bind(this));
        this.findButton = this.addControlToAlgorithmBar("Button", "Find");
        this.findButton.onclick = this.findCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.printButton = this.addControlToAlgorithmBar("Button", "Print");
        this.printButton.onclick = this.printCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.clearButton = this.addControlToAlgorithmBar("Button", "Clear");
        this.clearButton.onclick = this.clearCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.showNullLeaves = this.addCheckboxToAlgorithmBar("Show Null Leaves");
        this.showNullLeaves.onclick = this.showNullLeavesCallback.bind(this);
        this.showNullLeaves.checked = false;;
    }

    reset() {
        this.nextIndex = this.initialIndex;
        this.treeRoot = null;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Callback functions for the algorithm control bar

    insertCallback(event) {
        var insertedValue = this.normalizeNumber(this.insertField.value);
        if (insertedValue !== "") {
            this.insertField.value = "";
            this.implementAction(this.insertElement.bind(this), insertedValue);
        }
    }

    deleteCallback(event) {
        var deletedValue = this.normalizeNumber(this.deleteField.value);
        if (deletedValue !== "") {
            this.deleteField.value = "";
            this.implementAction(this.deleteElement.bind(this), deletedValue);
        }
    }

    findCallback(event) {
        var findValue = this.normalizeNumber(this.findField.value);
        if (findValue !== "") {
            this.findField.value = "";
            this.implementAction(this.findElement.bind(this), findValue);
        }
    }

    clearCallback(event) {
        this.implementAction(this.clearTree.bind(this), "");
    }

    printCallback(event) {
        this.implementAction(this.printTree.bind(this), "");
    }

    showNullLeavesCallback(event) {
        if (this.showNullLeaves.checked) {
            this.animationManager.setAllLayers([0, 1]);
        }
        else {
            this.animationManager.setAllLayers([0]);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Functions that do the actual work

    printTree() {
        if (this.treeRoot == null) return [];
        this.commands = [];
        this.cmd("SetText", this.messageID, "Printing tree");
        this.highlightID = this.nextIndex++;
        this.cmd("CreateHighlightCircle", this.highlightID, TreeRedBlack.HIGHLIGHT_COLOR, this.treeRoot.x, this.treeRoot.y);
        var firstLabel = this.nextIndex;

        this.xPosOfNextLabel = TreeRedBlack.FIRST_PRINT_POS_X;
        this.yPosOfNextLabel = this.first_print_pos_y;

        this.printTreeRec(this.treeRoot);
        this.cmd("Delete", this.highlightID);
        this.cmd("Step");
        for (var i = firstLabel; i < this.nextIndex; i++) {
            this.cmd("Delete", i);
        }
        this.nextIndex = this.highlightID; // Reuse objects. Not necessary.
        this.cmd("SetText", this.messageID, "");
        return this.commands;
    }

    printTreeRec(tree) {
        this.cmd("Step");
        if (tree.left != null && !tree.left.phantomLeaf) {
            this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
            this.printTreeRec(tree.left);
            this.cmd("Move", this.highlightID, tree.x, tree.y);
            this.cmd("Step");
        }
        var nextLabelID = this.nextIndex++;
        this.cmd("CreateLabel", nextLabelID, tree.data, tree.x, tree.y);
        this.cmd("SetForegroundColor", nextLabelID, TreeRedBlack.PRINT_COLOR);
        this.cmd("Move", nextLabelID, this.xPosOfNextLabel, this.yPosOfNextLabel);
        this.cmd("Step");

        this.xPosOfNextLabel += TreeRedBlack.PRINT_HORIZONTAL_GAP;
        if (this.xPosOfNextLabel > this.print_max) {
            this.xPosOfNextLabel = TreeRedBlack.FIRST_PRINT_POS_X;
            this.yPosOfNextLabel += TreeRedBlack.PRINT_VERTICAL_GAP;

        }
        if (tree.right != null && !tree.right.phantomLeaf) {
            this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
            this.printTreeRec(tree.right);
            this.cmd("Move", this.highlightID, tree.x, tree.y);
            this.cmd("Step");
        }
    }

    clearTree() {
        this.commands = [];
        this.deleteTree(this.treeRoot);
        this.treeRoot = null;
        this.nextIndex = this.initialIndex;
        return this.commands;
    }

    deleteTree(tree) {
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

    findElement(findValue) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Searching for ${findValue}`);
        this.highlightID = this.nextIndex++;
        var found = this.doFind(this.treeRoot, findValue);
        this.cmd("SetText", this.messageID, `Element ${findValue} ${found ? "found" : "not found"}`);
        return this.commands;
    }

    doFind(tree, value) {
        if (tree != null && !tree.phantomLeaf) {
            this.cmd("SetHighlight", tree.graphicID, 1);
            var cmp = this.compare(tree.data, value);
            if (cmp == 0) {
                this.cmd("SetText", this.messageID, `Searching for ${value}: ${value} = ${tree.data} (element found!)`);
                this.cmd("Step");
                this.cmd("SetText", this.messageID, `Found ${value}`);
                this.cmd("SetHighlight", tree.graphicID, 0);
                return true;
            }
            else if (cmp > 0) {
                this.cmd("SetText", this.messageID, `Searching for ${value}: ${value} < ${tree.data} (look to left subtree)`);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                if (tree.left != null) {
                    this.cmd("CreateHighlightCircle", this.highlightID, TreeRedBlack.HIGHLIGHT_COLOR, tree.x, tree.y);
                    this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightID);
                }
                return this.doFind(tree.left, value);
            }
            else {
                this.cmd("SetText", this.messageID, `Searching for ${value}: ${value} > ${tree.data} (look to right subtree)`);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                if (tree.right != null) {
                    this.cmd("CreateHighlightCircle", this.highlightID, TreeRedBlack.HIGHLIGHT_COLOR, tree.x, tree.y);
                    this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightID);
                }
                return this.doFind(tree.right, value);
            }
        }
        else {
            return false;
        }
    }

    insertElement(insertedValue) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Inserting ${insertedValue}`);
        this.highlightID = this.nextIndex++;
        var treeNodeID = this.nextIndex++;

        if (this.treeRoot == null) {
            var x = this.startingX, y = TreeRedBlack.STARTING_Y;
            this.cmd("CreateCircle", treeNodeID, insertedValue, x, y);
            this.cmd("SetWidth", treeNodeID, TreeRedBlack.NODE_SIZE);
            this.cmd("SetForegroundColor", treeNodeID, TreeRedBlack.FOREGROUND_BLACK);
            this.cmd("SetBackgroundColor", treeNodeID, TreeRedBlack.BACKGROUND_BLACK);
            this.treeRoot = new RedBlackNode(insertedValue, treeNodeID, 1, x, y);
            this.attachNullLeaves(this.treeRoot);
        }
        else {
            var x = TreeRedBlack.STARTING_Y, y = 2 * TreeRedBlack.STARTING_Y;
            this.cmd("CreateCircle", treeNodeID, insertedValue, x, y);
            this.cmd("SetWidth", treeNodeID, TreeRedBlack.NODE_SIZE);
            this.cmd("SetForegroundColor", treeNodeID, TreeRedBlack.FOREGROUND_RED);
            this.cmd("SetBackgroundColor", treeNodeID, TreeRedBlack.BACKGROUND_RED);
            this.cmd("Step");
            var insertElem = new RedBlackNode(insertedValue, treeNodeID, 0, x, y);
            this.cmd("SetHighlight", insertElem.graphicID, 1);
            this.insert(insertElem, this.treeRoot);
        }
        this.resizeTree();
        this.cmd("SetText", this.messageID, "");
        this.validateTree();
        return this.commands;
    }

    findUncle(tree) {
        if (tree.parent == null) return null;
        var par = tree.parent;
        if (par.parent == null) return null;
        var grandPar = par.parent;
        if (grandPar.left == par) {
            return grandPar.right;
        } else {
            return grandPar.left;
        }
    }

    blackLevel(tree) {
        return tree == null ? 1 : tree.blackLevel;
    }

    attachNullLeaf(node, isLeftChild) {
        // Add phantom leaf to the left or right
        var nullLeafID = this.nextIndex++;
        this.cmd("CreateCircle", nullLeafID, "", node.x, node.y);
        this.cmd("SetWidth", nullLeafID, TreeRedBlack.NULL_LEAF_SIZE);
        this.cmd("SetBackgroundColor", nullLeafID, TreeRedBlack.BACKGROUND_NULL_LEAF);
        var nullLeaf = new RedBlackNode("", nullLeafID, 1, this.startingX, TreeRedBlack.STARTING_Y);
        nullLeaf.phantomLeaf = true;
        nullLeaf.parent = node;
        this.cmd("SetLayer", nullLeafID, 1);
        this.cmd("Connect", node.graphicID, nullLeafID, TreeRedBlack.LINK_COLOR);
        if (isLeftChild) {
            node.left = nullLeaf;
        } else {
            node.right = nullLeaf;
        }
        return nullLeaf;
    }

    attachNullLeaves(node) {
        this.attachNullLeaf(node, true);
        this.attachNullLeaf(node, false);
    }

    singleRotateRight(tree) {
        var A = tree.left;
        var B = tree;
        var t1 = A.left;
        var t2 = A.right;
        var t3 = B.right;

        this.cmd("SetText", this.messageID, "Single Rotate Right");
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 1);
        this.cmd("Step");

        if (t2 != null) {
            this.cmd("Disconnect", A.graphicID, t2.graphicID);
            this.cmd("Connect", B.graphicID, t2.graphicID, TreeRedBlack.LINK_COLOR);
            t2.parent = B;
        }
        this.cmd("Disconnect", B.graphicID, A.graphicID);
        this.cmd("Connect", A.graphicID, B.graphicID, TreeRedBlack.LINK_COLOR);
        A.parent = B.parent;
        if (this.treeRoot == B) {
            this.treeRoot = A;
        }
        else {
            this.cmd("Disconnect", B.parent.graphicID, B.graphicID, TreeRedBlack.LINK_COLOR);
            this.cmd("Connect", B.parent.graphicID, A.graphicID, TreeRedBlack.LINK_COLOR);
            if (B.isLeftChild()) {
                B.parent.left = A;
            } else {
                B.parent.right = A;
            }
        }
        A.right = B;
        B.parent = A;
        B.left = t2;
        this.resizeTree();
        return A;
    }

    singleRotateLeft(tree) {
        var A = tree;
        var B = tree.right;
        var t1 = A.left;
        var t2 = B.left;
        var t3 = B.right;

        this.cmd("SetText", this.messageID, "Single Rotate Left");
        this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 1);
        this.cmd("Step");

        if (t2 != null) {
            this.cmd("Disconnect", B.graphicID, t2.graphicID);
            this.cmd("Connect", A.graphicID, t2.graphicID, TreeRedBlack.LINK_COLOR);
            t2.parent = A;
        }
        this.cmd("Disconnect", A.graphicID, B.graphicID);
        this.cmd("Connect", B.graphicID, A.graphicID, TreeRedBlack.LINK_COLOR);
        B.parent = A.parent;
        if (this.treeRoot == A) {
            this.treeRoot = B;
        }
        else {
            this.cmd("Disconnect", A.parent.graphicID, A.graphicID, TreeRedBlack.LINK_COLOR);
            this.cmd("Connect", A.parent.graphicID, B.graphicID, TreeRedBlack.LINK_COLOR);
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
        return B;
    }

    insert(elem, tree) {
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("SetHighlight", elem.graphicID, 1);

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
            if (tree.left == null || tree.left.phantomLeaf) {
                this.cmd("SetText", this.messageID, "Found null tree (or phantom leaf), inserting element");
                if (tree.left != null) {
                    this.cmd("Delete", tree.left.graphicID);
                }
                this.cmd("SetHighlight", elem.graphicID, 0);
                tree.left = elem;
                elem.parent = tree;
                this.cmd("Connect", tree.graphicID, elem.graphicID, TreeRedBlack.LINK_COLOR);

                this.attachNullLeaves(elem);
                this.resizeTree();
                this.fixDoubleRed(elem);
            }
            else {
                this.cmd("CreateHighlightCircle", this.highlightID, TreeRedBlack.HIGHLIGHT_COLOR, tree.x, tree.y);
                this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
                this.cmd("Step");
                this.cmd("Delete", this.highlightID);
                this.insert(elem, tree.left);
            }
        }
        else {
            if (tree.right == null || tree.right.phantomLeaf) {
                this.cmd("SetText", this.messageID, "Found null tree (or phantom leaf), inserting element");
                if (tree.right != null) {
                    this.cmd("Delete", tree.right.graphicID);
                }
                this.cmd("SetHighlight", elem.graphicID, 0);
                tree.right = elem;
                elem.parent = tree;
                this.cmd("Connect", tree.graphicID, elem.graphicID, TreeRedBlack.LINK_COLOR);
                elem.x = tree.x + TreeRedBlack.WIDTH_DELTA / 2;
                elem.y = tree.y + TreeRedBlack.HEIGHT_DELTA;
                this.cmd("Move", elem.graphicID, elem.x, elem.y);

                this.attachNullLeaves(elem);
                this.resizeTree();
                this.fixDoubleRed(elem);
            }
            else {
                this.cmd("CreateHighlightCircle", this.highlightID, TreeRedBlack.HIGHLIGHT_COLOR, tree.x, tree.y);
                this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
                this.cmd("Step");
                this.cmd("Delete", this.highlightID);
                this.insert(elem, tree.right);
            }
        }
    }

    fixDoubleRed(tree) {
        if (tree.parent != null) {
            if (tree.parent.blackLevel > 0) {
                return;
            }
            if (tree.parent.parent == null) {
                this.cmd("SetText", this.messageID, "Tree root is red: Color it black");
                this.cmd("Step");
                tree.parent.blackLevel = 1;
                this.cmd("SetForegroundColor", tree.parent.graphicID, TreeRedBlack.FOREGROUND_BLACK);
                this.cmd("SetBackgroundColor", tree.parent.graphicID, TreeRedBlack.BACKGROUND_BLACK);
                return;
            }
            var uncle = this.findUncle(tree);
            if (this.blackLevel(uncle) == 0) {
                this.cmd("SetText", this.messageID, "Node and parent are both red, sibling of parent is red: \nPush blackness down from grandparent");
                this.cmd("Step");

                uncle.blackLevel = 1;
                this.cmd("SetForegroundColor", uncle.graphicID, TreeRedBlack.FOREGROUND_BLACK);
                this.cmd("SetBackgroundColor", uncle.graphicID, TreeRedBlack.BACKGROUND_BLACK);

                tree.parent.blackLevel = 1;
                this.cmd("SetForegroundColor", tree.parent.graphicID, TreeRedBlack.FOREGROUND_BLACK);
                this.cmd("SetBackgroundColor", tree.parent.graphicID, TreeRedBlack.BACKGROUND_BLACK);

                tree.parent.parent.blackLevel = 0;
                this.cmd("SetForegroundColor", tree.parent.parent.graphicID, TreeRedBlack.FOREGROUND_RED);
                this.cmd("SetBackgroundColor", tree.parent.parent.graphicID, TreeRedBlack.BACKGROUND_RED);
                this.cmd("Step");
                this.fixDoubleRed(tree.parent.parent);
            }
            else {
                if (tree.isLeftChild() && !tree.parent.isLeftChild()) {
                    this.cmd("SetText", this.messageID, "Node and parent are both red, \nnode is left child, parent is right child: Rotate right");
                    this.cmd("Step");
                    this.singleRotateRight(tree.parent);
                    tree = tree.right;
                }
                else if (!tree.isLeftChild() && tree.parent.isLeftChild()) {
                    this.cmd("SetText", this.messageID, "Node and parent are both red, \nnode is right child, parent is left child: Rotate left");
                    this.cmd("Step");
                    this.singleRotateLeft(tree.parent);
                    tree = tree.left;
                }

                if (tree.isLeftChild()) {
                    this.cmd("SetText", this.messageID, "Node and parent are both red, node is left child, parent is left child: \nOne right rotation can fix extra redness");
                    this.cmd("Step");
                    this.singleRotateRight(tree.parent.parent);

                    tree.parent.blackLevel = 1;
                    this.cmd("SetForegroundColor", tree.parent.graphicID, TreeRedBlack.FOREGROUND_BLACK);
                    this.cmd("SetBackgroundColor", tree.parent.graphicID, TreeRedBlack.BACKGROUND_BLACK);

                    tree.parent.right.blackLevel = 0;
                    this.cmd("SetForegroundColor", tree.parent.right.graphicID, TreeRedBlack.FOREGROUND_RED);
                    this.cmd("SetBackgroundColor", tree.parent.right.graphicID, TreeRedBlack.BACKGROUND_RED);
                }
                else {
                    this.cmd("SetText", this.messageID, "Node and parent are both red, node is right child, parent is right child: \nOne left rotation can fix extra redness");
                    this.cmd("Step");
                    this.singleRotateLeft(tree.parent.parent);

                    tree.parent.blackLevel = 1;
                    this.cmd("SetForegroundColor", tree.parent.graphicID, TreeRedBlack.FOREGROUND_BLACK);
                    this.cmd("SetBackgroundColor", tree.parent.graphicID, TreeRedBlack.BACKGROUND_BLACK);

                    tree.parent.left.blackLevel = 0;
                    this.cmd("SetForegroundColor", tree.parent.left.graphicID, TreeRedBlack.FOREGROUND_RED);
                    this.cmd("SetBackgroundColor", tree.parent.left.graphicID, TreeRedBlack.BACKGROUND_RED);
                }
            }
        }
        else {
            if (tree.blackLevel == 0) {
                this.cmd("SetText", this.messageID, "Root of the tree is red: Color it black");
                this.cmd("Step");

                tree.blackLevel = 1;
                this.cmd("SetForegroundColor", tree.graphicID, TreeRedBlack.FOREGROUND_BLACK);
                this.cmd("SetBackgroundColor", tree.graphicID, TreeRedBlack.BACKGROUND_BLACK);
            }
        }
    }

    deleteElement(deletedValue) {
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

    fixNullLeaf(tree, isLeftChild) {
        this.cmd("SetText", this.messageID, "Coloring 'null leaf' double black");
        var nullLeaf = this.attachNullLeaf(tree, isLeftChild);
        nullLeaf.blackLevel = 2;
        this.resizeTree();
        this.fixDoubleBlackChild(tree, true);
        nullLeaf.blackLevel = 1;
        this.fixNodeColor(nullLeaf);
    }

    fixDoubleBlackChild(parNode, isLeftChild) {
        var sibling = isLeftChild ? parNode.right : parNode.left;
        var doubleBlackNode = isLeftChild ? parNode.left : parNode.right;
        if (this.blackLevel(sibling) > 0 && this.blackLevel(sibling.left) > 0 && this.blackLevel(sibling.right) > 0) {
            this.cmd("SetText", this.messageID, "Double black node has a black sibling with 2 black children: Push up black level");
            this.cmd("Step");
            sibling.blackLevel = 0;
            this.fixNodeColor(sibling);
            if (doubleBlackNode != null) {
                doubleBlackNode.blackLevel = 1;
                this.fixNodeColor(doubleBlackNode);
            }
            if (parNode.blackLevel == 0) {
                parNode.blackLevel = 1;
                this.fixNodeColor(parNode);
            }
            else {
                parNode.blackLevel = 2;
                this.fixNodeColor(parNode);
                this.cmd("SetText", this.messageID, "Pushing up black level created another double black node: Repeating...");
                this.cmd("Step");
                this.fixDoubleBlack(parNode);
            }
        }
        else if (this.blackLevel(sibling) == 0) {
            this.cmd("SetText", this.messageID, "Double black node has red sibling: Rotate tree to make sibling black");
            this.cmd("Step");
            if (isLeftChild) {
                var newPar = this.singleRotateLeft(parNode);
                newPar.blackLevel = 1;
                this.fixNodeColor(newPar);
                newPar.left.blackLevel = 0;
                this.fixNodeColor(newPar.left);
                this.cmd("Step");
                this.fixDoubleBlack(newPar.left.left);
            }
            else {
                var newPar = this.singleRotateRight(parNode);
                newPar.blackLevel = 1;
                this.fixNodeColor(newPar);
                newPar.right.blackLevel = 0;
                this.fixNodeColor(newPar.right);
                this.cmd("Step");
                this.fixDoubleBlack(newPar.right.right);
            }
        }
        else if (isLeftChild && this.blackLevel(sibling.right) > 0) {
            this.cmd("SetText", this.messageID, "Double black node is a left child, and has a black sibling whose right child is black: \nRotate right to make opposite child red");
            this.cmd("Step");
            var newSib = this.singleRotateRight(sibling);
            newSib.blackLevel = 1;
            this.fixNodeColor(newSib);
            newSib.right.blackLevel = 0;
            this.fixNodeColor(newSib.right);
            this.cmd("Step");
            this.fixDoubleBlackChild(parNode, isLeftChild);
        }
        else if (!isLeftChild && this.blackLevel(sibling.left) > 0) {
            this.cmd("SetText", this.messageID, "Double black node is a right child, and has a black sibling whose left child is black: \nRotate left to make opposite child red");
            this.cmd("Step");
            var newSib = this.singleRotateLeft(sibling);
            newSib.blackLevel = 1;
            this.fixNodeColor(newSib);
            newSib.left.blackLevel = 0;
            this.fixNodeColor(newSib.left);
            this.cmd("Step");
            this.fixDoubleBlackChild(parNode, isLeftChild);
        }
        else if (isLeftChild) {
            this.cmd("SetText", this.messageID, "Double black node is a left child, and has a black sibling whose right child is red: \nOne left rotation can fix double-blackness");
            this.cmd("Step");
            var oldParBlackLevel = parNode.blackLevel;
            var newPar = this.singleRotateLeft(parNode);
            if (oldParBlackLevel == 0) {
                newPar.blackLevel = 0;
                this.fixNodeColor(newPar);
                newPar.left.blackLevel = 1;
                this.fixNodeColor(newPar.left);
            }
            newPar.right.blackLevel = 1;
            this.fixNodeColor(newPar.right);
            if (newPar.left.left != null) {
                newPar.left.left.blackLevel = 1;
                this.fixNodeColor(newPar.left.left);
            }
        }
        else {
            this.cmd("SetText", this.messageID, "Double black node is a right child, and has a black sibling whose left child is red: \nOne right rotation can fix double-blackness");
            this.cmd("Step");
            var oldParBlackLevel = parNode.blackLevel;
            var newPar = this.singleRotateRight(parNode);
            if (oldParBlackLevel == 0) {
                newPar.blackLevel = 0;
                this.fixNodeColor(newPar);
                newPar.right.blackLevel = 1;
                this.fixNodeColor(newPar.right);
            }
            newPar.left.blackLevel = 1;
            this.fixNodeColor(newPar.left);
            if (newPar.right.right != null) {
                newPar.right.right.blackLevel = 1;
                this.fixNodeColor(newPar.right.right);
            }
        }
    }

    fixDoubleBlack(tree) {
        if (tree.blackLevel > 1) {
            if (tree.parent == null) {
                this.cmd("SetText", this.messageID, "Double black node is root: Make it single black");
                this.cmd("Step");
                tree.blackLevel = 1;
                this.cmd("SetBackgroundColor", tree.graphicID, TreeRedBlack.BACKGROUND_BLACK);
            }
            else if (tree.parent.left == tree) {
                this.fixDoubleBlackChild(tree.parent, true);
            }
            else {
                this.fixDoubleBlackChild(tree.parent, false);
            }
        }
    }

    treeDelete(tree, valueToDelete) {
        var leftchild = false;
        if (tree != null && !tree.phantomLeaf) {
            if (tree.parent != null) {
                leftchild = tree.parent.left == tree;
            }
            this.cmd("SetHighlight", tree.graphicID, 1);
            var cmp = this.compare(valueToDelete, tree.data);
            if (cmp < 0) {
                this.cmd("SetText", this.messageID, `${valueToDelete} < ${tree.data}: Looking at left subtree`);
            }
            else if (cmp > 0) {
                this.cmd("SetText", this.messageID, `${valueToDelete} > ${tree.data}: Looking at right subtree`);
            }
            else {
                this.cmd("SetText", this.messageID, `${valueToDelete} == ${tree.data}: Found node to delete`);
            }
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);

            if (cmp == 0) {
                var needFix = tree.blackLevel > 0;
                if ((tree.left == null || tree.left.phantomLeaf) && (tree.right == null || tree.right.phantomLeaf)) {
                    this.cmd("SetText", this.messageID, "Node to delete is a leaf: Delete it");
                    this.cmd("Delete", tree.graphicID);
                    if (tree.left != null) {
                        this.cmd("Delete", tree.left.graphicID);
                    }
                    if (tree.right != null) {
                        this.cmd("Delete", tree.right.graphicID);
                    }

                    if (leftchild && tree.parent != null) {
                        tree.parent.left = null;
                        this.resizeTree();
                        if (needFix) {
                            this.fixNullLeaf(tree.parent, true);
                        }
                        else {
                            this.attachNullLeaf(tree.parent, true);
                            this.resizeTree();
                        }
                    }
                    else if (tree.parent != null) {
                        tree.parent.right = null;
                        this.resizeTree();
                        if (needFix) {
                            this.fixNullLeaf(tree.parent, false);
                        }
                        else {
                            this.attachNullLeaf(tree.parent, false);
                            this.resizeTree();
                        }
                    }
                    else {
                        this.treeRoot = null;
                    }
                }
                else if (tree.left == null || tree.left.phantomLeaf) {
                    this.cmd("SetText", this.messageID, "Node to delete has no left child: \nSet parent of deleted node to right child of deleted node");
                    if (tree.left != null) {
                        this.cmd("Delete", tree.left.graphicID);
                        tree.left = null;
                    }

                    if (tree.parent != null) {
                        this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                        this.cmd("Connect", tree.parent.graphicID, tree.right.graphicID, TreeRedBlack.LINK_COLOR);
                        this.cmd("Step");
                        this.cmd("Delete", tree.graphicID);
                        if (leftchild) {
                            tree.parent.left = tree.right;
                            if (needFix) {
                                this.cmd("SetText", this.messageID, "Back node removed: Increasing child's blackness level");
                                tree.parent.left.blackLevel++;
                                this.fixNodeColor(tree.parent.left);
                                this.fixDoubleBlack(tree.parent.left);
                            }
                        }
                        else {
                            tree.parent.right = tree.right;
                            if (needFix) {
                                this.cmd("SetText", this.messageID, "Back node removed: Increasing child's blackness level");
                                tree.parent.right.blackLevel++;
                                this.fixNodeColor(tree.parent.right);
                                this.fixDoubleBlack(tree.parent.right);
                            }

                        }
                        tree.right.parent = tree.parent;
                    }
                    else {
                        this.cmd("Delete", tree.graphicID);
                        this.treeRoot = tree.right;
                        this.treeRoot.parent = null;
                        if (this.treeRoot.blackLevel == 0) {
                            this.treeRoot.blackLevel = 1;
                            this.cmd("SetForegroundColor", this.treeRoot.graphicID, TreeRedBlack.FOREGROUND_BLACK);
                            this.cmd("SetBackgroundColor", this.treeRoot.graphicID, TreeRedBlack.BACKGROUND_BLACK);
                        }
                    }
                    this.resizeTree();
                }
                else if (tree.right == null || tree.right.phantomLeaf) {
                    this.cmd("SetText", this.messageID, "Node to delete has no right child: \nSet parent of deleted node to left child of deleted node");
                    if (tree.right != null) {
                        this.cmd("Delete", tree.right.graphicID);
                        tree.right = null;
                    }
                    if (tree.parent != null) {
                        this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                        this.cmd("Connect", tree.parent.graphicID, tree.left.graphicID, TreeRedBlack.LINK_COLOR);
                        this.cmd("Step");
                        this.cmd("Delete", tree.graphicID);
                        if (leftchild) {
                            tree.parent.left = tree.left;
                            if (needFix) {
                                tree.parent.left.blackLevel++;
                                this.fixNodeColor(tree.parent.left);
                                this.fixDoubleBlack(tree.parent.left);
                                this.resizeTree();
                            }
                            else {
                                this.cmd("SetText", this.messageID, "Deleted node was red: No tree rotations required");
                                this.resizeTree();
                            }
                        }
                        else {
                            tree.parent.right = tree.left;
                            if (needFix) {
                                tree.parent.right.blackLevel++;
                                this.fixNodeColor(tree.parent.right);
                                this.fixDoubleBlack(tree.parent.left);
                                this.resizeTree();
                            }
                            else {
                                this.cmd("SetText", this.messageID, "Deleted node was red: No tree rotations required");
                                this.resizeTree();
                            }
                        }
                        tree.left.parent = tree.parent;
                    }
                    else {
                        this.cmd("Delete", tree.graphicID);
                        this.treeRoot = tree.left;
                        this.treeRoot.parent = null;
                        if (this.treeRoot.blackLevel == 0) {
                            this.treeRoot.blackLevel = 1;
                            this.fixNodeColor(this.treeRoot);
                        }
                    }
                }
                else // tree.left != null && tree.right != null
                {
                    this.cmd("SetText", this.messageID, "Node to delete has two childern: \nFind largest node in left subtree");
                    this.highlightID = this.nextIndex++;
                    this.cmd("CreateHighlightCircle", this.highlightID, TreeRedBlack.HIGHLIGHT_COLOR, tree.x, tree.y);
                    var tmp = tree;
                    tmp = tree.left;
                    this.cmd("Move", this.highlightID, tmp.x, tmp.y);
                    this.cmd("Step");
                    while (tmp.right != null && !tmp.right.phantomLeaf) {
                        tmp = tmp.right;
                        this.cmd("Move", this.highlightID, tmp.x, tmp.y);
                        this.cmd("Step");
                    }
                    if (tmp.right != null) {
                        this.cmd("Delete", tmp.right.graphicID);
                        tmp.right = null;
                    }
                    this.cmd("SetText", tree.graphicID, " ");
                    var labelID = this.nextIndex++;
                    this.cmd("CreateLabel", labelID, tmp.data, tmp.x, tmp.y);
                    this.cmd("SetForegroundColor", labelID, TreeRedBlack.FOREGROUND_BLACK);
                    tree.data = tmp.data;
                    this.cmd("Move", labelID, tree.x, tree.y);
                    this.cmd("SetText", this.messageID, "Copy largest value of left subtree into node to delete");

                    this.cmd("Step");
                    this.cmd("SetHighlight", tree.graphicID, 0);
                    this.cmd("Delete", labelID);
                    this.cmd("SetText", tree.graphicID, tree.data);
                    this.cmd("Delete", this.highlightID);
                    this.cmd("SetText", this.messageID, "Remove node whose value we copied");

                    var needFix = tmp.blackLevel > 0;
                    if (tmp.left == null) {
                        this.cmd("Delete", tmp.graphicID);
                        if (tmp.parent != tree) {
                            tmp.parent.right = null;
                            this.resizeTree();
                            if (needFix) {
                                this.fixNullLeaf(tmp.parent, false);
                            }
                            else {
                                this.cmd("SetText", this.messageID, "Deleted node was red: No tree rotations required");
                                this.cmd("Step");
                            }
                        }
                        else {
                            tree.left = null;
                            this.resizeTree();
                            if (needFix) {
                                this.fixNullLeaf(tmp.parent, true);
                            }
                            else {
                                this.cmd("SetText", this.messageID, "Deleted node was red: No tree rotations required");
                                this.cmd("Step");
                            }
                        }
                    }
                    else {
                        this.cmd("Disconnect", tmp.parent.graphicID, tmp.graphicID);
                        this.cmd("Connect", tmp.parent.graphicID, tmp.left.graphicID, TreeRedBlack.LINK_COLOR);
                        this.cmd("Step");
                        this.cmd("Delete", tmp.graphicID);

                        if (tmp.parent != tree) {
                            tmp.parent.right = tmp.left;
                            tmp.left.parent = tmp.parent;
                            this.resizeTree();
                            if (needFix) {
                                this.cmd("SetText", this.messageID, "Coloring child of deleted node black");
                                this.cmd("Step");
                                tmp.left.blackLevel++;
                                if (tmp.left.phantomLeaf) {
                                    this.cmd("SetLayer", tmp.left.graphicID, 0);
                                }
                                this.fixNodeColor(tmp.left);
                                this.fixDoubleBlack(tmp.left);
                                if (tmp.left.phantomLeaf) {
                                    this.cmd("SetLayer", tmp.left.graphicID, 1);
                                }
                            }
                            else {
                                this.cmd("SetText", this.messageID, "Deleted node was red: No tree rotations required");
                                this.cmd("Step");
                            }
                        }
                        else {
                            tree.left = tmp.left;
                            tmp.left.parent = tree;
                            this.resizeTree();
                            if (needFix) {
                                this.cmd("SetText", this.messageID, "Coloring child of deleted node black");
                                this.cmd("Step");
                                tmp.left.blackLevel++;
                                if (tmp.left.phantomLeaf) {
                                    this.cmd("SetLayer", tmp.left.graphicID, 0);
                                }
                                this.fixNodeColor(tmp.left);
                                this.fixDoubleBlack(tmp.left);
                                if (tmp.left.phantomLeaf) {
                                    this.cmd("SetLayer", tmp.left.graphicID, 1);
                                }
                            }
                            else {
                                this.cmd("SetText", this.messageID, "Deleted node was red: No tree rotations required");
                                this.cmd("Step");
                            }
                        }
                    }
                    tmp = tmp.parent;
                }
            }
            else if (cmp < 0) {
                if (tree.left != null) {
                    this.cmd("CreateHighlightCircle", this.highlightID, TreeRedBlack.HIGHLIGHT_COLOR, tree.x, tree.y);
                    this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightID);
                }
                this.treeDelete(tree.left, valueToDelete);
            }
            else {
                if (tree.right != null) {
                    this.cmd("CreateHighlightCircle", this.highlightID, TreeRedBlack.HIGHLIGHT_COLOR, tree.x, tree.y);
                    this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightID);
                }
                this.treeDelete(tree.right, valueToDelete);
            }
        }
        else {
            this.cmd("SetText", this.messageID, `Element ${valueToDelete} not found, could not delete`);
            this.cmd("Step");
        }

    }

    fixNodeColor(tree) {
        this.cmd("SetForegroundColor", tree.graphicID, (
            tree.blackLevel == 0 ? TreeRedBlack.FOREGROUND_RED :
                /* blackLevel >= 1 */ TreeRedBlack.FOREGROUND_BLACK
        ));
        this.cmd("SetBackgroundColor", tree.graphicID, (
            tree.phantomLeaf ? TreeRedBlack.BACKGROUND_NULL_LEAF :
                tree.blackLevel == 0 ? TreeRedBlack.BACKGROUND_RED :
                    tree.blackLevel == 1 ? TreeRedBlack.BACKGROUND_BLACK :
                        /* blackLevel > 1 */ TreeRedBlack.BACKGROUND_DOUBLE_BLACK
        ));
    }

    validateTree(tree, parent) {
        if (!tree) {
            tree = this.treeRoot;
            if (!tree) return 0;
            // console.log("Validating tree", tree);
        }
        if (!tree.graphicID) console.error("Tree missing ID:", tree);
        if (tree.parent != parent) console.error("Parent mismatch:", tree, parent);
        if (tree.blackLevel > 1) console.error("Double-black node:", tree);
        if (tree.blackLevel == 0) {
            if (tree.phantomLeaf) console.error("Red phantom leaf:", tree.parent);
            if (tree.parent && tree.parent.blackLevel == 0) console.error("Red node has red child:", tree.parent);
        }
        var leftPath = 0;
        if (tree.left) {
            leftPath = this.validateTree(tree.left, tree);
        }
        if (tree.right) {
            var rightPath = this.validateTree(tree.right, tree);
            if (rightPath != leftPath) console.error(`Different black path lengths, ${leftPath} != ${rightPath}:`, tree);
        }
        return leftPath + tree.blackLevel;
    }

    resizeTree() {
        var startingPoint = this.startingX;
        this.resizeWidths(this.treeRoot);
        if (this.treeRoot != null) {
            if (this.treeRoot.leftWidth > startingPoint) {
                startingPoint = this.treeRoot.leftWidth;
            }
            else if (this.treeRoot.rightWidth > startingPoint) {
                startingPoint = Math.max(this.treeRoot.leftWidth, 2 * startingPoint - this.treeRoot.rightWidth);
            }
            this.setNewPositions(this.treeRoot, startingPoint, TreeRedBlack.STARTING_Y, 0);
            this.animateNewPositions(this.treeRoot);
            this.cmd("Step");
        }
    }

    setNewPositions(tree, xPosition, yPosition, side) {
        if (tree != null) {
            tree.y = yPosition;
            if (tree.phantomLeaf) {
                tree.y -= (TreeRedBlack.NODE_SIZE - TreeRedBlack.NULL_LEAF_SIZE) / 2;
            }
            if (side < 0) {
                xPosition = xPosition - tree.rightWidth;
            }
            else if (side > 0) {
                xPosition = xPosition + tree.leftWidth;
            }
            tree.x = xPosition;
            this.setNewPositions(tree.left, xPosition, yPosition + TreeRedBlack.HEIGHT_DELTA, -1);
            this.setNewPositions(tree.right, xPosition, yPosition + TreeRedBlack.HEIGHT_DELTA, 1);
        }
    }

    animateNewPositions(tree) {
        if (tree != null) {
            this.cmd("Move", tree.graphicID, tree.x, tree.y);
            this.animateNewPositions(tree.left);
            this.animateNewPositions(tree.right);
        }
    }

    resizeWidths(tree) {
        if (tree == null) {
            return 0;
        }
        tree.leftWidth = Math.max(this.resizeWidths(tree.left), TreeRedBlack.WIDTH_DELTA / 2);
        tree.rightWidth = Math.max(this.resizeWidths(tree.right), TreeRedBlack.WIDTH_DELTA / 2);
        if (tree.phantomLeaf) {
            tree.leftWidth -= (TreeRedBlack.NODE_SIZE - TreeRedBlack.NULL_LEAF_SIZE) / 2;
            tree.rightWidth -= (TreeRedBlack.NODE_SIZE - TreeRedBlack.NULL_LEAF_SIZE) / 2;
        }
        return tree.leftWidth + tree.rightWidth;
    }

}
