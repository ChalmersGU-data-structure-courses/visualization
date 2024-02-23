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

///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals Algorithm */
/* exported TreeBST */
///////////////////////////////////////////////////////////////////////////////


class BSTNode {
    constructor(val, id, initialX, initialY) {
        this.data = val;
        this.x = initialX;
        this.y = initialY;
        this.graphicID = id;
        this.left = null;
        this.right = null;
        this.parent = null;
        this.leftWidth = 0;
        this.rightWidth = 0;
    }
}


class TreeBST extends Algorithm {
    FOREGROUND_COLOR = "#007700";
    BACKGROUND_COLOR = "#EEFFEE";

    LINK_COLOR = this.FOREGROUND_COLOR;
    HIGHLIGHT_CIRCLE_COLOR = this.FOREGROUND_COLOR;
    PRINT_COLOR = this.FOREGROUND_COLOR;

    NODE_SIZE = 40;
    WIDTH_DELTA = this.NODE_SIZE + 10;
    HEIGHT_DELTA = this.NODE_SIZE + 10;
    STARTING_Y = 50;

    FIRST_PRINT_POS_X = 50;
    PRINT_VERTICAL_GAP = 20;
    PRINT_HORIZONTAL_GAP = 50;

    MESSAGE_X = 10;
    MESSAGE_Y = 10;

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
        this.cmd("CreateLabel", this.messageID, "", this.MESSAGE_X, this.MESSAGE_Y, 0);

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
        this.firstPrintPosY = h - 3 * this.PRINT_VERTICAL_GAP;
        this.printMax = w - this.PRINT_HORIZONTAL_GAP;

        this.implementAction(() => {
            this.commands = [];
            this.resizeTree();
            return this.commands;
        });
    }

    addControls() {
        this.insertField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.insertField, "ALPHANUM", this.insertCallback.bind(this));
        this.insertButton = this.addButtonToAlgorithmBar("Insert");
        this.insertButton.onclick = this.insertCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.deleteField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.deleteField, "ALPHANUM", this.deleteCallback.bind(this));
        this.deleteButton = this.addButtonToAlgorithmBar("Delete");
        this.deleteButton.onclick = this.deleteCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.findField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.findField, "ALPHANUM", this.findCallback.bind(this));
        this.findButton = this.addButtonToAlgorithmBar("Find");
        this.findButton.onclick = this.findCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.printButton = this.addButtonToAlgorithmBar("Print");
        this.printButton.onclick = this.printCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.clearButton = this.addButtonToAlgorithmBar("Clear");
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
        this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, this.treeRoot.x, this.treeRoot.y);
        const firstLabel = this.nextIndex;

        this.xPosOfNextLabel = this.FIRST_PRINT_POS_X;
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
        this.cmd("SetForegroundColor", nextLabelID, this.PRINT_COLOR);
        this.cmd("Move", nextLabelID, this.xPosOfNextLabel, this.yPosOfNextLabel);
        this.cmd("Step");

        this.xPosOfNextLabel += this.PRINT_HORIZONTAL_GAP;
        if (this.xPosOfNextLabel > this.printMax) {
            this.xPosOfNextLabel = this.FIRST_PRINT_POS_X;
            this.yPosOfNextLabel += this.PRINT_VERTICAL_GAP;
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
                    this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
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
                    this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
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

        if (this.treeRoot == null) {
            const x = this.startingX, y = this.STARTING_Y;
            this.cmd("CreateCircle", treeNodeID, insertedValue, x, y);
            this.cmd("SetWidth", treeNodeID, this.NODE_SIZE);
            this.cmd("SetForegroundColor", treeNodeID, this.FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", treeNodeID, this.BACKGROUND_COLOR);
            this.cmd("Step");
            this.treeRoot = new BSTNode(insertedValue, treeNodeID, x, y);
        } else {
            const x = this.STARTING_Y, y = 2 * this.STARTING_Y;
            this.cmd("CreateCircle", treeNodeID, insertedValue, x, y);
            this.cmd("SetWidth", treeNodeID, this.NODE_SIZE);
            this.cmd("SetForegroundColor", treeNodeID, this.FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", treeNodeID, this.BACKGROUND_COLOR);
            this.cmd("Step");
            const insertElem = new BSTNode(insertedValue, treeNodeID, x, y);
            this.cmd("SetHighlight", insertElem.graphicID, 1);
            this.insert(insertElem, this.treeRoot);
        }
        this.resizeTree();
        this.cmd("SetText", this.messageID, "");
        this.validateTree();
        return this.commands;
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
                this.cmd("SetHighlight", elem.graphicID, 0);
                tree.left = elem;
                elem.parent = tree;
                this.cmd("Connect", tree.graphicID, elem.graphicID, this.LINK_COLOR);
            } else {
                this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
                this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
                this.cmd("Step");
                this.cmd("Delete", this.highlightID);
                this.insert(elem, tree.left);
            }
        } else if (tree.right == null) {
            this.cmd("SetText", this.messageID, "Found null tree, inserting element");
            this.cmd("SetHighlight", elem.graphicID, 0);
            tree.right = elem;
            elem.parent = tree;
            this.cmd("Connect", tree.graphicID, elem.graphicID, this.LINK_COLOR);
            elem.x = tree.x + this.WIDTH_DELTA / 2;
            elem.y = tree.y + this.HEIGHT_DELTA;
            this.cmd("Move", elem.graphicID, elem.x, elem.y);
        } else {
            this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
            this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
            this.cmd("Step");
            this.cmd("Delete", this.highlightID);
            this.insert(elem, tree.right);
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
                        this.cmd("Connect", tree.parent.graphicID, tree.right.graphicID, this.LINK_COLOR);
                        this.cmd("Step");
                        this.cmd("Delete", tree.graphicID);
                        if (leftchild) {
                            tree.parent.left = tree.right;
                        } else {
                            tree.parent.right = tree.right;
                        }
                        tree.right.parent = tree.parent;
                    } else {
                        this.cmd("Delete", tree.graphicID);
                        this.treeRoot = tree.right;
                        this.treeRoot.parent = null;
                    }
                    this.resizeTree();
                } else if (tree.right == null) {
                    this.cmd("SetText", this.messageID, "Node to delete has no right child: \nSet parent of deleted node to left child of deleted node");
                    if (tree.parent != null) {
                        this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                        this.cmd("Connect", tree.parent.graphicID, tree.left.graphicID, this.LINK_COLOR);
                        this.cmd("Step");
                        this.cmd("Delete", tree.graphicID);
                        if (leftchild) {
                            tree.parent.left = tree.left;
                        } else {
                            tree.parent.right = tree.left;
                        }
                        tree.left.parent = tree.parent;
                    } else {
                        this.cmd("Delete", tree.graphicID);
                        this.treeRoot = tree.left;
                        this.treeRoot.parent = null;
                    }
                    this.resizeTree();
                } else { // tree.left != null && tree.right != null
                    this.cmd("SetText", this.messageID, "Node to delete has two children: \nFind largest node in left subtree");
                    this.highlightID = this.nextIndex++;
                    this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
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
                        this.resizeTree();
                    } else {
                        this.cmd("Disconnect", tmp.parent.graphicID, tmp.graphicID);
                        this.cmd("Connect", tmp.parent.graphicID, tmp.left.graphicID, this.LINK_COLOR);
                        this.cmd("Step");
                        this.cmd("Delete", tmp.graphicID);
                        if (tmp.parent !== tree) {
                            tmp.parent.right = tmp.left;
                            tmp.left.parent = tmp.parent;
                        } else {
                            tree.left = tmp.left;
                            tmp.left.parent = tree;
                        }
                        this.resizeTree();
                    }
                }
            } else if (cmp < 0) {
                if (tree.left != null) {
                    this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
                    this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightID);
                }
                this.treeDelete(tree.left, valueToDelete);
            } else {
                if (tree.right != null) {
                    this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
                    this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightID);
                }
                this.treeDelete(tree.right, valueToDelete);
            }
        } else {
            this.cmd("SetText", this.messageID, `Element ${valueToDelete} not found, could not delete`);
            this.cmd("Step");
        }
    }

    validateTree(tree, parent) {
        if (!tree) {
            tree = this.treeRoot;
            if (!tree) return;
            // console.log("Validating tree", tree);
        } else if (tree.parent !== parent) console.error("Parent mismatch:", tree, parent);
        if (!tree.graphicID) console.error("Tree missing ID:", tree);
        if (tree.left) this.validateTree(tree.left, tree);
        if (tree.right) this.validateTree(tree.right, tree);
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
            this.setNewPositions(this.treeRoot, startingPoint, this.STARTING_Y, 0);
            this.animateNewPositions(this.treeRoot);
            this.cmd("Step");
        }
    }

    setNewPositions(tree, xPosition, yPosition, side) {
        if (tree != null) {
            tree.y = yPosition;
            if (side < 0) {
                xPosition = xPosition - tree.rightWidth;
            } else if (side > 0) {
                xPosition = xPosition + tree.leftWidth;
            }
            tree.x = xPosition;
            this.setNewPositions(tree.left, xPosition, yPosition + this.HEIGHT_DELTA, -1);
            this.setNewPositions(tree.right, xPosition, yPosition + this.HEIGHT_DELTA, 1);
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
        tree.leftWidth = Math.max(this.resizeWidths(tree.left), this.WIDTH_DELTA / 2);
        tree.rightWidth = Math.max(this.resizeWidths(tree.right), this.WIDTH_DELTA / 2);
        return tree.leftWidth + tree.rightWidth;
    }
}
