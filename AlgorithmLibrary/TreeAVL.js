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

///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals Algorithm */
/* exported TreeAVL */
///////////////////////////////////////////////////////////////////////////////


class AVLNode {
    constructor(val, id, hid, initialX, initialY) {
        this.data = val;
        this.x = initialX;
        this.y = initialY;
        this.height = 1;
        this.graphicID = id;
        this.heightLabelID = hid;
        this.left = null;
        this.right = null;
        this.parent = null;
        this.leftWidth = 0;
        this.rightWidth = 0;
    }

    isLeftChild() {
        return this.parent == null || this.parent.left === this;
    }
}


class TreeAVL extends Algorithm {
    static FOREGROUND_COLOR = "#007700";
    static BACKGROUND_COLOR = "#EEFFEE";

    static HIGHLIGHT_LABEL_COLOR = "#FF0000";
    static HIGHLIGHT_LINK_COLOR = TreeAVL.HIGHLIGHT_LABEL_COLOR;
    static HIGHLIGHT_COLOR = TreeAVL.FOREGROUND_COLOR;
    static HEIGHT_LABEL_COLOR = TreeAVL.FOREGROUND_COLOR;

    static LINK_COLOR = TreeAVL.FOREGROUND_COLOR;
    static HIGHLIGHT_CIRCLE_COLOR = TreeAVL.FOREGROUND_COLOR;
    static PRINT_COLOR = TreeAVL.FOREGROUND_COLOR;

    static NODE_SIZE = 40;
    static WIDTH_DELTA = TreeAVL.NODE_SIZE + 10;
    static HEIGHT_DELTA = TreeAVL.NODE_SIZE + 10;
    static STARTING_Y = 50;
    static LABEL_DISPLACE = TreeAVL.NODE_SIZE / 2;

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
        this.cmd("CreateLabel", this.messageID, "", TreeAVL.MESSAGE_X, TreeAVL.MESSAGE_Y, 0);

        this.initialIndex = this.nextIndex;
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();

        this.sizeChanged();
    }

    sizeChanged() {
        const w = this.getCanvasWidth();
        const h = this.getCanvasHeight();

        this.startingX = w / 2;
        this.firstPrintPosY = h - 3 * TreeAVL.PRINT_VERTICAL_GAP;
        this.printMax = w - TreeAVL.PRINT_HORIZONTAL_GAP;

        this.implementAction(() => {
            this.commands = [];
            this.resizeTree();
            return this.commands;
        });
    }

    addControls() {
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

    reset() {
        this.nextIndex = this.initialIndex;
        this.treeRoot = null;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Callback functions for the algorithm control bar

    insertCallback(event) {
        const insertedValue = this.normalizeNumber(this.insertField.value);
        if (insertedValue !== "") {
            this.insertField.value = "";
            this.implementAction(this.insertElement.bind(this), insertedValue);
        }
    }

    deleteCallback(event) {
        const deletedValue = this.normalizeNumber(this.deleteField.value);
        if (deletedValue !== "") {
            this.deleteField.value = "";
            this.implementAction(this.deleteElement.bind(this), deletedValue);
        }
    }

    findCallback(event) {
        const findValue = this.normalizeNumber(this.findField.value);
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

    ///////////////////////////////////////////////////////////////////////////////
    // Functions that do the actual work

    printTree() {
        if (this.treeRoot == null) return [];
        this.commands = [];
        this.cmd("SetText", this.messageID, "Printing tree");
        this.highlightID = this.nextIndex++;
        this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, this.treeRoot.x, this.treeRoot.y);
        const firstLabel = this.nextIndex;

        this.xPosOfNextLabel = TreeAVL.FIRST_PRINT_POS_X;
        this.yPosOfNextLabel = this.firstPrintPosY;

        this.printTreeRec(this.treeRoot);
        this.cmd("Delete", this.highlightID);
        this.cmd("Step");
        for (let i = firstLabel; i < this.nextIndex; i++) {
            this.cmd("Delete", i);
        }
        this.nextIndex = this.highlightID; // Reuse objects. Not necessary.
        this.cmd("SetText", this.messageID, "");
        return this.commands;
    }

    printTreeRec(tree) {
        this.cmd("Step");
        if (tree.left != null) {
            this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
            this.printTreeRec(tree.left);
            this.cmd("Move", this.highlightID, tree.x, tree.y);
            this.cmd("Step");
        }
        const nextLabelID = this.nextIndex++;
        this.cmd("CreateLabel", nextLabelID, tree.data, tree.x, tree.y);
        this.cmd("SetForegroundColor", nextLabelID, TreeAVL.PRINT_COLOR);
        this.cmd("Move", nextLabelID, this.xPosOfNextLabel, this.yPosOfNextLabel);
        this.cmd("Step");

        this.xPosOfNextLabel += TreeAVL.PRINT_HORIZONTAL_GAP;
        if (this.xPosOfNextLabel > this.printMax) {
            this.xPosOfNextLabel = TreeAVL.FIRST_PRINT_POS_X;
            this.yPosOfNextLabel += TreeAVL.PRINT_VERTICAL_GAP;
        }
        if (tree.right != null) {
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
            this.cmd("Delete", tree.heightLabelID);
        }
    }

    findElement(findValue) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Searching for ${findValue}`);
        this.highlightID = this.nextIndex++;
        const found = this.doFind(this.treeRoot, findValue);
        this.cmd("SetText", this.messageID, `Element ${findValue} ${found ? "found" : "not found"}`);
        return this.commands;
    }

    doFind(tree, value) {
        if (tree != null) {
            this.cmd("SetHighlight", tree.graphicID, 1);
            const cmp = this.compare(tree.data, value);
            if (cmp === 0) {
                this.cmd("SetText", this.messageID, `Searching for ${value}: ${value} = ${tree.data} (element found!)`);
                this.cmd("Step");
                this.cmd("SetText", this.messageID, `Found ${value}`);
                this.cmd("SetHighlight", tree.graphicID, 0);
                return true;
            } else if (cmp > 0) {
                this.cmd("SetText", this.messageID, `Searching for ${value}: ${value} < ${tree.data} (look to left subtree)`);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                if (tree.left != null) {
                    this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.x, tree.y);
                    this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightID);
                }
                return this.doFind(tree.left, value);
            } else {
                this.cmd("SetText", this.messageID, `Searching for ${value}: ${value} > ${tree.data} (look to right subtree)`);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                if (tree.right != null) {
                    this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.x, tree.y);
                    this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightID);
                }
                return this.doFind(tree.right, value);
            }
        } else {
            return false;
        }
    }

    insertElement(insertedValue) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Inserting ${insertedValue}`);
        this.highlightID = this.nextIndex++;
        const treeNodeID = this.nextIndex++;
        const labelID = this.nextIndex++;

        if (this.treeRoot == null) {
            const x = this.startingX, y = TreeAVL.STARTING_Y;
            this.cmd("CreateCircle", treeNodeID, insertedValue, x, y);
            this.cmd("SetWidth", treeNodeID, TreeAVL.NODE_SIZE);
            this.cmd("SetForegroundColor", treeNodeID, TreeAVL.FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", treeNodeID, TreeAVL.BACKGROUND_COLOR);
            this.cmd("CreateLabel", labelID, 1, x - TreeAVL.LABEL_DISPLACE, y - TreeAVL.LABEL_DISPLACE);
            this.cmd("SetForegroundColor", labelID, TreeAVL.HEIGHT_LABEL_COLOR);
            this.cmd("Step");
            this.treeRoot = new AVLNode(insertedValue, treeNodeID, labelID, x, y);
            this.treeRoot.height = 1;
        } else {
            const x = TreeAVL.STARTING_Y, y = 2 * TreeAVL.STARTING_Y;
            this.cmd("CreateCircle", treeNodeID, insertedValue, x, y);
            this.cmd("SetWidth", treeNodeID, TreeAVL.NODE_SIZE);
            this.cmd("SetForegroundColor", treeNodeID, TreeAVL.FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", treeNodeID, TreeAVL.BACKGROUND_COLOR);
            this.cmd("CreateLabel", labelID, "", x - TreeAVL.LABEL_DISPLACE, y - TreeAVL.LABEL_DISPLACE);
            this.cmd("SetForegroundColor", labelID, TreeAVL.HEIGHT_LABEL_COLOR);
            this.cmd("Step");
            const insertElem = new AVLNode(insertedValue, treeNodeID, labelID, x, y);
            insertElem.height = 1;
            this.cmd("SetHighlight", insertElem.graphicID, 1);
            this.insert(insertElem, this.treeRoot);
        }
        this.resizeTree();
        this.cmd("SetText", this.messageID, "");
        this.validateTree();
        return this.commands;
    }

    singleRotateRight(tree) {
        const A = tree.left;
        const B = tree;
        // const t1 = A.left;
        const t2 = A.right;
        // const t3 = B.right;

        this.cmd("SetText", this.messageID, "Single Rotate Right");
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 1);
        this.cmd("Step");

        if (t2 != null) {
            this.cmd("Disconnect", A.graphicID, t2.graphicID);
            this.cmd("Connect", B.graphicID, t2.graphicID, TreeAVL.LINK_COLOR);
            t2.parent = B;
        }
        this.cmd("Disconnect", B.graphicID, A.graphicID);
        this.cmd("Connect", A.graphicID, B.graphicID, TreeAVL.LINK_COLOR);
        A.parent = B.parent;
        if (this.treeRoot === B) {
            this.treeRoot = A;
        } else {
            this.cmd("Disconnect", B.parent.graphicID, B.graphicID, TreeAVL.LINK_COLOR);
            this.cmd("Connect", B.parent.graphicID, A.graphicID, TreeAVL.LINK_COLOR);
            if (B.isLeftChild()) {
                B.parent.left = A;
            } else {
                B.parent.right = A;
            }
        }
        A.right = B;
        B.parent = A;
        B.left = t2;
        this.resetHeight(B);
        this.resetHeight(A);
        this.resizeTree();
    }

    singleRotateLeft(tree) {
        const A = tree;
        const B = tree.right;
        // const t1 = A.left;
        const t2 = B.left;
        // const t3 = B.right;

        this.cmd("SetText", this.messageID, "Single Rotate Left");
        this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 1);
        this.cmd("Step");

        if (t2 != null) {
            this.cmd("Disconnect", B.graphicID, t2.graphicID);
            this.cmd("Connect", A.graphicID, t2.graphicID, TreeAVL.LINK_COLOR);
            t2.parent = A;
        }
        this.cmd("Disconnect", A.graphicID, B.graphicID);
        this.cmd("Connect", B.graphicID, A.graphicID, TreeAVL.LINK_COLOR);
        B.parent = A.parent;
        if (this.treeRoot === A) {
            this.treeRoot = B;
        } else {
            this.cmd("Disconnect", A.parent.graphicID, A.graphicID, TreeAVL.LINK_COLOR);
            this.cmd("Connect", A.parent.graphicID, B.graphicID, TreeAVL.LINK_COLOR);
            if (A.isLeftChild()) {
                A.parent.left = B;
            } else {
                A.parent.right = B;
            }
        }
        B.left = A;
        A.parent = B;
        A.right = t2;
        this.resetHeight(A);
        this.resetHeight(B);
        this.resizeTree();
    }

    getHeight(tree) {
        return tree == null ? 0 : tree.height;
    }

    resetHeight(tree) {
        if (tree != null) {
            const newHeight = Math.max(this.getHeight(tree.left), this.getHeight(tree.right)) + 1;
            if (tree.height !== newHeight) {
                tree.height = Math.max(this.getHeight(tree.left), this.getHeight(tree.right)) + 1;
                this.cmd("SetText", tree.heightLabelID, newHeight);
            }
        }
    }

    doubleRotateRight(tree) {
        const A = tree.left;
        const B = tree.left.right;
        const C = tree;
        // const t1 = A.left;
        const t2 = B.left;
        const t3 = B.right;
        // const t4 = C.right;

        this.cmd("SetText", this.messageID, "Double Rotate Right");
        this.cmd("Disconnect", C.graphicID, A.graphicID);
        this.cmd("Disconnect", A.graphicID, B.graphicID);
        this.cmd("Connect", C.graphicID, A.graphicID, TreeAVL.HIGHLIGHT_LINK_COLOR);
        this.cmd("Connect", A.graphicID, B.graphicID, TreeAVL.HIGHLIGHT_LINK_COLOR);
        this.cmd("Step");

        if (t2 != null) {
            this.cmd("Disconnect", B.graphicID, t2.graphicID);
            t2.parent = A;
            A.right = t2;
            this.cmd("Connect", A.graphicID, t2.graphicID, TreeAVL.LINK_COLOR);
        }
        if (t3 != null) {
            this.cmd("Disconnect", B.graphicID, t3.graphicID);
            t3.parent = C;
            C.left = t2;
            this.cmd("Connect", C.graphicID, t3.graphicID, TreeAVL.LINK_COLOR);
        }
        if (C.parent == null) {
            B.parent = null;
            this.treeRoot = B;
        } else {
            this.cmd("Disconnect", C.parent.graphicID, C.graphicID);
            this.cmd("Connect", C.parent.graphicID, B.graphicID, TreeAVL.LINK_COLOR);
            if (C.isLeftChild()) {
                C.parent.left = B;
            } else {
                C.parent.right = B;
            }
            B.parent = C.parent;
            C.parent = B;
        }
        this.cmd("Disconnect", C.graphicID, A.graphicID);
        this.cmd("Disconnect", A.graphicID, B.graphicID);
        this.cmd("Connect", B.graphicID, A.graphicID, TreeAVL.LINK_COLOR);
        this.cmd("Connect", B.graphicID, C.graphicID, TreeAVL.LINK_COLOR);

        B.left = A;
        A.parent = B;
        B.right = C;
        C.parent = B;
        A.right = t2;
        C.left = t3;
        this.resetHeight(A);
        this.resetHeight(C);
        this.resetHeight(B);
        this.resizeTree();
    }

    doubleRotateLeft(tree) {
        const A = tree;
        const B = tree.right.left;
        const C = tree.right;
        // const t1 = A.left;
        const t2 = B.left;
        const t3 = B.right;
        // const t4 = C.right;

        this.cmd("SetText", this.messageID, "Double Rotate Left");
        this.cmd("Disconnect", A.graphicID, C.graphicID);
        this.cmd("Disconnect", C.graphicID, B.graphicID);
        this.cmd("Connect", A.graphicID, C.graphicID, TreeAVL.HIGHLIGHT_LINK_COLOR);
        this.cmd("Connect", C.graphicID, B.graphicID, TreeAVL.HIGHLIGHT_LINK_COLOR);
        this.cmd("Step");

        if (t2 != null) {
            this.cmd("Disconnect", B.graphicID, t2.graphicID);
            t2.parent = A;
            A.right = t2;
            this.cmd("Connect", A.graphicID, t2.graphicID, TreeAVL.LINK_COLOR);
        }
        if (t3 != null) {
            this.cmd("Disconnect", B.graphicID, t3.graphicID);
            t3.parent = C;
            C.left = t2;
            this.cmd("Connect", C.graphicID, t3.graphicID, TreeAVL.LINK_COLOR);
        }
        if (A.parent == null) {
            B.parent = null;
            this.treeRoot = B;
        } else {
            this.cmd("Disconnect", A.parent.graphicID, A.graphicID);
            this.cmd("Connect", A.parent.graphicID, B.graphicID, TreeAVL.LINK_COLOR);
            if (A.isLeftChild()) {
                A.parent.left = B;
            } else {
                A.parent.right = B;
            }
            B.parent = A.parent;
            A.parent = B;
        }
        this.cmd("Disconnect", A.graphicID, C.graphicID);
        this.cmd("Disconnect", C.graphicID, B.graphicID);
        this.cmd("Connect", B.graphicID, A.graphicID, TreeAVL.LINK_COLOR);
        this.cmd("Connect", B.graphicID, C.graphicID, TreeAVL.LINK_COLOR);

        B.left = A;
        A.parent = B;
        B.right = C;
        C.parent = B;
        A.right = t2;
        C.left = t3;
        this.resetHeight(A);
        this.resetHeight(C);
        this.resetHeight(B);
        this.resizeTree();
    }

    insert(elem, tree) {
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("SetHighlight", elem.graphicID, 1);

        const cmp = this.compare(elem.data, tree.data);
        if (cmp < 0) {
            this.cmd("SetText", this.messageID, `${elem.data} < ${tree.data}: Looking at left subtree`);
        } else {
            this.cmd("SetText", this.messageID, `${elem.data} >= ${tree.data}: Looking at right subtree`);
        }
        this.cmd("Step");
        this.cmd("SetHighlight", tree.graphicID, 0);
        this.cmd("SetHighlight", elem.graphicID, 0);

        if (cmp < 0) {
            if (tree.left == null) {
                this.cmd("SetText", this.messageID, "Found null tree, inserting element");
                this.cmd("SetText", elem.heightLabelID, 1);
                this.cmd("SetHighlight", elem.graphicID, 0);
                tree.left = elem;
                elem.parent = tree;
                this.cmd("Connect", tree.graphicID, elem.graphicID, TreeAVL.LINK_COLOR);

                this.resizeTree();
                this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.left.x, tree.left.y);
                this.cmd("Move", this.highlightID, tree.x, tree.y);
                this.cmd("SetText", this.messageID, "Unwinding Recursion");
                this.cmd("Step");
                this.cmd("Delete", this.highlightID);

                if (tree.height < this.getHeight(tree.left) + 1) {
                    tree.height = this.getHeight(tree.left) + 1;
                    this.cmd("SetText", tree.heightLabelID, tree.height);
                    this.cmd("SetText", this.messageID, "Adjusting height after recursive call");
                    this.cmd("SetForegroundColor", tree.heightLabelID, TreeAVL.HIGHLIGHT_LABEL_COLOR);
                    this.cmd("Step");
                    this.cmd("SetForegroundColor", tree.heightLabelID, TreeAVL.HEIGHT_LABEL_COLOR);
                }
            } else {
                this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.x, tree.y);
                this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
                this.cmd("Step");
                this.cmd("Delete", this.highlightID);
                this.insert(elem, tree.left);

                this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.left.x, tree.left.y);
                this.cmd("Move", this.highlightID, tree.x, tree.y);
                this.cmd("SetText", this.messageID, "Unwinding Recursion");
                this.cmd("Step");
                this.cmd("Delete", this.highlightID);

                if (tree.height < this.getHeight(tree.left) + 1) {
                    tree.height = this.getHeight(tree.left) + 1;
                    this.cmd("SetText", tree.heightLabelID, tree.height);
                    this.cmd("SetText", this.messageID, "Adjusting height after recursive call");
                    this.cmd("SetForegroundColor", tree.heightLabelID, TreeAVL.HIGHLIGHT_LABEL_COLOR);
                    this.cmd("Step");
                    this.cmd("SetForegroundColor", tree.heightLabelID, TreeAVL.HEIGHT_LABEL_COLOR);
                }
                if (this.getHeight(tree.left) > 1 + this.getHeight(tree.right)) {
                    if (elem.data < tree.left.data) {
                        this.singleRotateRight(tree);
                    } else {
                        this.doubleRotateRight(tree);
                    }
                }
            }
        } else if (tree.right == null) {
            this.cmd("SetText", this.messageID, "Found null tree, inserting element");
            this.cmd("SetText", elem.heightLabelID, 1);
            this.cmd("SetHighlight", elem.graphicID, 0);
            tree.right = elem;
            elem.parent = tree;
            this.cmd("Connect", tree.graphicID, elem.graphicID, TreeAVL.LINK_COLOR);
            elem.x = tree.x + TreeAVL.WIDTH_DELTA / 2;
            elem.y = tree.y + TreeAVL.HEIGHT_DELTA;
            this.cmd("Move", elem.graphicID, elem.x, elem.y);

            this.resizeTree();
            this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.right.x, tree.right.y);
            this.cmd("Move", this.highlightID, tree.x, tree.y);
            this.cmd("SetText", this.messageID, "Unwinding Recursion");
            this.cmd("Step");
            this.cmd("Delete", this.highlightID);

            if (tree.height < this.getHeight(tree.right) + 1) {
                tree.height = this.getHeight(tree.right) + 1;
                this.cmd("SetText", tree.heightLabelID, tree.height);
                this.cmd("SetText", this.messageID, "Adjusting height after recursive call");
                this.cmd("SetForegroundColor", tree.heightLabelID, TreeAVL.HIGHLIGHT_LABEL_COLOR);
                this.cmd("Step");
                this.cmd("SetForegroundColor", tree.heightLabelID, TreeAVL.HEIGHT_LABEL_COLOR);
            }
        } else {
            this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.x, tree.y);
            this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
            this.cmd("Step");
            this.cmd("Delete", this.highlightID);
            this.insert(elem, tree.right);

            this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.right.x, tree.right.y);
            this.cmd("Move", this.highlightID, tree.x, tree.y);
            this.cmd("SetText", this.messageID, "Unwinding Recursion");
            this.cmd("Step");
            this.cmd("Delete", this.highlightID);

            if (tree.height < this.getHeight(tree.right) + 1) {
                tree.height = this.getHeight(tree.right) + 1;
                this.cmd("SetText", tree.heightLabelID, tree.height);
                this.cmd("SetText", this.messageID, "Adjusting height after recursive call");
                this.cmd("SetForegroundColor", tree.heightLabelID, TreeAVL.HIGHLIGHT_LABEL_COLOR);
                this.cmd("Step");
                this.cmd("SetForegroundColor", tree.heightLabelID, TreeAVL.HEIGHT_LABEL_COLOR);
            }
            if (this.getHeight(tree.right) > 1 + this.getHeight(tree.left)) {
                if (elem.data >= tree.right.data) {
                    this.singleRotateLeft(tree);
                } else {
                    this.doubleRotateLeft(tree);
                }
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

    treeDelete(tree, valueToDelete) {
        let leftchild = false;
        if (tree != null) {
            if (tree.parent != null) {
                leftchild = tree.parent.left === tree;
            }
            this.cmd("SetHighlight", tree.graphicID, 1);
            const cmp = this.compare(valueToDelete, tree.data);
            if (cmp < 0) {
                this.cmd("SetText", this.messageID, `${valueToDelete} < ${tree.data}: Looking at left subtree`);
            } else if (cmp > 0) {
                this.cmd("SetText", this.messageID, `${valueToDelete} > ${tree.data}: Looking at right subtree`);
            } else {
                this.cmd("SetText", this.messageID, `${valueToDelete} = ${tree.data}: Found node to delete`);
            }
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);

            if (cmp === 0) {
                if (tree.left == null && tree.right == null) {
                    this.cmd("SetText", this.messageID, "Node to delete is a leaf: Delete it");
                    this.cmd("Delete", tree.graphicID);
                    this.cmd("Delete", tree.heightLabelID);
                    if (leftchild && tree.parent != null) {
                        tree.parent.left = null;
                    } else if (tree.parent != null) {
                        tree.parent.right = null;
                    } else {
                        this.treeRoot = null;
                    }
                    this.resizeTree();
                    this.cmd("Step");
                } else if (tree.left == null) {
                    this.cmd("SetText", this.messageID, "Node to delete has no left child: \nSet parent of deleted node to right child of deleted node");
                    if (tree.parent != null) {
                        this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                        this.cmd("Connect", tree.parent.graphicID, tree.right.graphicID, TreeAVL.LINK_COLOR);
                        this.cmd("Step");
                        this.cmd("Delete", tree.graphicID);
                        this.cmd("Delete", tree.heightLabelID);
                        if (leftchild) {
                            tree.parent.left = tree.right;
                        } else {
                            tree.parent.right = tree.right;
                        }
                        tree.right.parent = tree.parent;
                    } else {
                        this.cmd("Delete", tree.graphicID);
                        this.cmd("Delete", tree.heightLabelID);
                        this.treeRoot = tree.right;
                        this.treeRoot.parent = null;
                    }
                    this.resizeTree();
                } else if (tree.right == null) {
                    this.cmd("SetText", this.messageID, "Node to delete has no right child: \nSet parent of deleted node to left child of deleted node");
                    if (tree.parent != null) {
                        this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                        this.cmd("Connect", tree.parent.graphicID, tree.left.graphicID, TreeAVL.LINK_COLOR);
                        this.cmd("Step");
                        this.cmd("Delete", tree.graphicID);
                        this.cmd("Delete", tree.heightLabelID);
                        if (leftchild) {
                            tree.parent.left = tree.left;
                        } else {
                            tree.parent.right = tree.left;
                        }
                        tree.left.parent = tree.parent;
                    } else {
                        this.cmd("Delete", tree.graphicID);
                        this.cmd("Delete", tree.heightLabelID);
                        this.treeRoot = tree.left;
                        this.treeRoot.parent = null;
                    }
                    this.resizeTree();
                } else { // tree.left != null && tree.right != null
                    this.cmd("SetText", this.messageID, "Node to delete has two children: \nFind largest node in left subtree");
                    this.highlightID = this.nextIndex++;
                    this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.x, tree.y);
                    let tmp = tree;
                    tmp = tree.left;
                    this.cmd("Move", this.highlightID, tmp.x, tmp.y);
                    this.cmd("Step");
                    while (tmp.right != null) {
                        tmp = tmp.right;
                        this.cmd("Move", this.highlightID, tmp.x, tmp.y);
                        this.cmd("Step");
                    }
                    this.cmd("SetText", tree.graphicID, " ");
                    const labelID = this.nextIndex++;
                    this.cmd("CreateLabel", labelID, tmp.data, tmp.x, tmp.y);
                    this.cmd("SetForegroundColor", labelID, TreeAVL.HEIGHT_LABEL_COLOR);
                    tree.data = tmp.data;
                    this.cmd("Move", labelID, tree.x, tree.y);
                    this.cmd("SetText", this.messageID, "Copy largest value of left subtree into node to delete");

                    this.cmd("Step");
                    this.cmd("SetHighlight", tree.graphicID, 0);
                    this.cmd("Delete", labelID);
                    this.cmd("SetText", tree.graphicID, tree.data);
                    this.cmd("Delete", this.highlightID);
                    this.cmd("SetText", this.messageID, "Remove node whose value we copied");

                    if (tmp.left == null) {
                        if (tmp.parent !== tree) {
                            tmp.parent.right = null;
                        } else {
                            tree.left = null;
                        }
                        this.cmd("Delete", tmp.graphicID);
                        this.cmd("Delete", tmp.heightLabelID);
                        this.resizeTree();
                    } else {
                        this.cmd("Disconnect", tmp.parent.graphicID, tmp.graphicID);
                        this.cmd("Connect", tmp.parent.graphicID, tmp.left.graphicID, TreeAVL.LINK_COLOR);
                        this.cmd("Step");
                        this.cmd("Delete", tmp.graphicID);
                        this.cmd("Delete", tmp.heightLabelID);
                        if (tmp.parent !== tree) {
                            tmp.parent.right = tmp.left;
                            tmp.left.parent = tmp.parent;
                        } else {
                            tree.left = tmp.left;
                            tmp.left.parent = tree;
                        }
                        this.resizeTree();
                    }
                    tmp = tmp.parent;

                    if (this.getHeight(tmp) !== Math.max(this.getHeight(tmp.left), this.getHeight(tmp.right)) + 1) {
                        tmp.height = Math.max(this.getHeight(tmp.left), this.getHeight(tmp.right)) + 1;
                        this.cmd("SetText", tmp.heightLabelID, tmp.height);
                        this.cmd("SetText", this.messageID, "Adjusting height after recursive call");
                        this.cmd("SetForegroundColor", tmp.heightLabelID, TreeAVL.HIGHLIGHT_LABEL_COLOR);
                        this.cmd("Step");
                        this.cmd("SetForegroundColor", tmp.heightLabelID, TreeAVL.HEIGHT_LABEL_COLOR);
                    }
                    while (tmp !== tree) {
                        const tmpPar = tmp.parent;
                        // TODO: Add extra animation here?
                        if (this.getHeight(tmp.left) - this.getHeight(tmp.right) > 1) {
                            if (this.getHeight(tmp.left.right) > this.getHeight(tmp.left.left)) {
                                this.doubleRotateRight(tmp);
                            } else {
                                this.singleRotateRight(tmp);
                            }
                        }
                        if (tmpPar.right != null) {
                            if (tmpPar === tree) {
                                this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tmpPar.left.x, tmpPar.left.y);
                            } else {
                                this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tmpPar.right.x, tmpPar.right.y);
                            }
                            this.cmd("Move", this.highlightID, tmpPar.x, tmpPar.y);
                            this.cmd("SetText", this.messageID, "Backing up...");

                            if (this.getHeight(tmpPar) !== Math.max(this.getHeight(tmpPar.left), this.getHeight(tmpPar.right)) + 1) {
                                tmpPar.height = Math.max(this.getHeight(tmpPar.left), this.getHeight(tmpPar.right)) + 1;
                                this.cmd("SetText", tmpPar.heightLabelID, tree.height);
                                this.cmd("SetText", this.messageID, "Adjusting height after recursive call");
                                this.cmd("SetForegroundColor", tmpPar.heightLabelID, TreeAVL.HIGHLIGHT_LABEL_COLOR);
                                this.cmd("Step");
                                this.cmd("SetForegroundColor", tmpPar.heightLabelID, TreeAVL.HEIGHT_LABEL_COLOR);
                            }
                            this.cmd("Step");
                            this.cmd("Delete", this.highlightID);
                        }
                        tmp = tmpPar;
                    }
                    if (this.getHeight(tree.right) - this.getHeight(tree.left) > 1) {
                        if (this.getHeight(tree.right.left) > this.getHeight(tree.right.right)) {
                            this.doubleRotateLeft(tree);
                        } else {
                            this.singleRotateLeft(tree);
                        }
                    }
                }
            } else if (cmp < 0) {
                if (tree.left != null) {
                    this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.x, tree.y);
                    this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightID);
                }
                this.treeDelete(tree.left, valueToDelete);
                if (tree.left != null) {
                    this.cmd("SetText", this.messageID, "Unwinding recursion");
                    this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.left.x, tree.left.y);
                    this.cmd("Move", this.highlightID, tree.x, tree.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightID);
                }
                if (this.getHeight(tree.right) - this.getHeight(tree.left) > 1) {
                    if (this.getHeight(tree.right.left) > this.getHeight(tree.right.right)) {
                        this.doubleRotateLeft(tree);
                    } else {
                        this.singleRotateLeft(tree);
                    }
                }
                if (this.getHeight(tree) !== Math.max(this.getHeight(tree.left), this.getHeight(tree.right)) + 1) {
                    tree.height = Math.max(this.getHeight(tree.left), this.getHeight(tree.right)) + 1;
                    this.cmd("SetText", tree.heightLabelID, tree.height);
                    this.cmd("SetText", this.messageID, "Adjusting height after recursive call");
                    this.cmd("SetForegroundColor", tree.heightLabelID, TreeAVL.HIGHLIGHT_LABEL_COLOR);
                    this.cmd("Step");
                    this.cmd("SetForegroundColor", tree.heightLabelID, TreeAVL.HEIGHT_LABEL_COLOR);
                }
            } else {
                if (tree.right != null) {
                    this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.x, tree.y);
                    this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightID);
                }
                this.treeDelete(tree.right, valueToDelete);
                if (tree.right != null) {
                    this.cmd("SetText", this.messageID, "Unwinding recursion");
                    this.cmd("CreateHighlightCircle", this.highlightID, TreeAVL.HIGHLIGHT_COLOR, tree.right.x, tree.right.y);
                    this.cmd("Move", this.highlightID, tree.x, tree.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightID);
                }

                if (this.getHeight(tree.left) - this.getHeight(tree.right) > 1) {
                    if (this.getHeight(tree.left.right) > this.getHeight(tree.left.left)) {
                        this.doubleRotateRight(tree);
                    } else {
                        this.singleRotateRight(tree);
                    }
                }
                if (this.getHeight(tree) !== Math.max(this.getHeight(tree.left), this.getHeight(tree.right)) + 1) {
                    tree.height = Math.max(this.getHeight(tree.left), this.getHeight(tree.right)) + 1;
                    this.cmd("SetText", tree.heightLabelID, tree.height);
                    this.cmd("SetText", this.messageID, "Adjusting height after recursive call");
                    this.cmd("SetForegroundColor", tree.heightLabelID, TreeAVL.HIGHLIGHT_LABEL_COLOR);
                    this.cmd("Step");
                    this.cmd("SetForegroundColor", tree.heightLabelID, TreeAVL.HEIGHT_LABEL_COLOR);
                }
            }
        } else {
            this.cmd("SetText", this.messageID, `Element ${valueToDelete} not found, could not delete`);
            this.cmd("Step");
        }
    }

    validateTree(tree, parent) {
        if (!tree) {
            tree = this.treeRoot;
            if (!tree) return 0;
            // console.log("Validating tree", tree);
        } else if (tree.parent !== parent) console.error("Parent mismatch:", tree, parent);
        if (!tree.graphicID) console.error("Tree missing ID:", tree);
        let leftHeight = 0, rightHeight = 0;
        if (tree.left) leftHeight = this.validateTree(tree.left, tree);
        if (tree.right) rightHeight = this.validateTree(tree.right, tree);
        const height = 1 + Math.max(leftHeight, rightHeight);
        if (height !== this.getHeight(tree)) console.error("Height mismatch:", height, this.getHeight(tree));
        return height;
    }

    resizeTree() {
        let startingPoint = this.startingX;
        this.resizeWidths(this.treeRoot);
        if (this.treeRoot != null) {
            if (this.treeRoot.leftWidth > startingPoint) {
                startingPoint = this.treeRoot.leftWidth;
            } else if (this.treeRoot.rightWidth > startingPoint) {
                startingPoint = Math.max(this.treeRoot.leftWidth, 2 * startingPoint - this.treeRoot.rightWidth);
            }
            this.setNewPositions(this.treeRoot, startingPoint, TreeAVL.STARTING_Y, 0);
            this.animateNewPositions(this.treeRoot);
            this.cmd("Step");
        }
    }

    setNewPositions(tree, xPosition, yPosition, side) {
        if (tree != null) {
            tree.y = yPosition;
            if (side < 0) {
                xPosition = xPosition - tree.rightWidth;
                tree.heightLabelX = xPosition - TreeAVL.LABEL_DISPLACE;
            } else if (side > 0) {
                xPosition = xPosition + tree.leftWidth;
                tree.heightLabelX = xPosition + TreeAVL.LABEL_DISPLACE;
            } else {
                tree.heightLabelX = xPosition - TreeAVL.LABEL_DISPLACE;
            }
            tree.x = xPosition;
            tree.heightLabelY = tree.y - TreeAVL.LABEL_DISPLACE;
            this.setNewPositions(tree.left, xPosition, yPosition + TreeAVL.HEIGHT_DELTA, -1);
            this.setNewPositions(tree.right, xPosition, yPosition + TreeAVL.HEIGHT_DELTA, 1);
        }
    }

    animateNewPositions(tree) {
        if (tree != null) {
            this.cmd("Move", tree.graphicID, tree.x, tree.y);
            this.cmd("Move", tree.heightLabelID, tree.heightLabelX, tree.heightLabelY);
            this.animateNewPositions(tree.left);
            this.animateNewPositions(tree.right);
        }
    }

    resizeWidths(tree) {
        if (tree == null) {
            return 0;
        }
        tree.leftWidth = Math.max(this.resizeWidths(tree.left), TreeAVL.WIDTH_DELTA / 2);
        tree.rightWidth = Math.max(this.resizeWidths(tree.right), TreeAVL.WIDTH_DELTA / 2);
        return tree.leftWidth + tree.rightWidth;
    }
}
