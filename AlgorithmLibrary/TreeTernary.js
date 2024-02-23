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

///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals Algorithm */
/* exported TreeTernary */
///////////////////////////////////////////////////////////////////////////////


class TernaryNode {
    constructor(val, id, initialX, initialY) {
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
}


class TreeTernary extends Algorithm {
    FOREGROUND_COLOR = "#007700";
    BACKGROUND_COLOR = "#CCFFCC";

    CENTER_LINK_COLOR = this.FOREGROUND_COLOR;
    SIDE_LINK_COLOR = "#8888AA";
    HIGHLIGHT_CIRCLE_COLOR = this.FOREGROUND_COLOR;
    PRINT_COLOR = this.FOREGROUND_COLOR;
    TRUE_COLOR = this.BACKGROUND_COLOR;
    FALSE_COLOR = "#FFFFFF";

    NODE_WIDTH = 30;

    WIDTH_DELTA = 50;
    HEIGHT_DELTA = 50;
    STARTING_Y = 20;
    LEFT_MARGIN = 300;
    NEW_NODE_Y = 100;
    NEW_NODE_X = 50;
    FIRST_PRINT_POS_X = 50;
    PRINT_VERTICAL_GAP = 20;
    PRINT_HORIZONTAL_GAP = 50;

    constructor(am) {
        super();
        this.init(am);
    }

    init(am) {
        super.init(am);
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

    sizeChanged() {
        const w = this.getCanvasWidth();
        const h = this.getCanvasHeight();

        this.startingX = w / 2;
        this.firstPrintPosY = h - 2 * this.PRINT_VERTICAL_GAP;
        this.printMax = w - 10;

        this.implementAction(() => {
            this.commands = [];
            this.resizeTree();
            return this.commands;
        });
    }

    addControls() {
        this.insertField = this.addControlToAlgorithmBar("Text", "", {maxlength: 12, size: 12});
        this.addReturnSubmit(this.insertField, "ALPHA", this.insertCallback.bind(this));
        this.insertButton = this.addButtonToAlgorithmBar("Insert");
        this.insertButton.onclick = this.insertCallback.bind(this);

        this.deleteField = this.addControlToAlgorithmBar("Text", "", {maxlength: 12, size: 12});
        this.addReturnSubmit(this.deleteField, "ALPHA", this.deleteCallback.bind(this));
        this.deleteButton = this.addButtonToAlgorithmBar("Delete");
        this.deleteButton.onclick = this.deleteCallback.bind(this);

        this.findField = this.addControlToAlgorithmBar("Text", "", {maxlength: 12, size: 12});
        this.addReturnSubmit(this.findField, "ALPHA", this.findCallback.bind(this));
        this.findButton = this.addButtonToAlgorithmBar("Find");
        this.findButton.onclick = this.findCallback.bind(this);

        this.printButton = this.addButtonToAlgorithmBar("Print");
        this.printButton.onclick = this.printCallback.bind(this);
    }

    reset() {
        this.nextIndex = 3;
        this.root = null;
    }

    insertCallback(event) {
        const insertedValue = this.insertField.value;
        if (insertedValue !== "") {
            this.insertField.value = "";
            this.implementAction(this.add.bind(this), insertedValue);
        }
    }

    deleteCallback(event) {
        const deletedValue = this.deleteField.value;
        if (deletedValue !== "") {
            this.deleteField.value = "";
            this.implementAction(this.deleteElement.bind(this), deletedValue);
        }
    }

    cleanupAfterDelete(tree) {
        if (tree == null) {
            return;
        } else if (tree.center != null) {
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("SetText", 2, "Cleaning up after delete ...\nTree has center child, no more cleanup required");
            this.cmd("Step");
            this.cmd("SetText", 2, "");
            this.cmd("SetHighlight", tree.graphicID, 0);
            return;
        } else if (tree.center == null && tree.right == null && tree.left == null && tree.isword) {
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("SetText", 2, "Cleaning up after delete ...\nLeaf at end of word, no more cleanup required");
            this.cmd("Step");
            this.cmd("SetText", 2, "");
            this.cmd("SetHighlight", tree.graphicID, 0);
            return;
        } else if (tree.center == null && tree.left == null && tree.right == null) {
            this.cmd("SetText", 2, "Cleaning up after delete ...");
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("Step");
            if (tree.parent == null) {
                this.root = null;
            } else if (tree.parent.left === tree) {
                this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                tree.parent.left = null;
            } else if (tree.parent.right === tree) {
                this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                tree.parent.right = null;
            } else if (tree.parent.center === tree) {
                this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                tree.parent.center = null;
                tree.parent.charAt = " ";
                this.cmd("SetText", tree.parent.graphicID, " ");
            }
            this.cmd("Delete", tree.graphicID);
            this.cleanupAfterDelete(tree.parent);
        } else if ((tree.left == null && tree.center == null) || (tree.right == null && tree.center == null)) {
            let child = null;
            if (tree.left != null) {
                child = tree.left;
            } else {
                child = tree.right;
            }
            this.cmd("Disconnect", tree.graphicID, child.graphicID);
            if (tree.parent == null) {
                this.cmd("Delete", tree.graphicID);
                this.root = child;
                child.parent = null;
            } else if (tree.parent.left === tree) {
                this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                this.cmd("Connect", tree.parent.graphicID, child.graphicID, this.SIDE_LINK_COLOR, 0.0001, false, `<${tree.parent.nextChar}`);
                tree.parent.left = child;
                child.parent = tree.parent;
                this.cmd("Step");
                this.cmd("Delete", tree.graphicID);
            } else if (tree.parent.right === tree) {
                this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                this.cmd("Connect", tree.parent.graphicID, child.graphicID, this.SIDE_LINK_COLOR, -0.0001, false, `>${tree.parent.nextChar}`);
                tree.parent.right = child;
                child.parent = tree.parent;
                this.cmd("Step");
                this.cmd("Delete", tree.graphicID);
            } else if (tree.parent.center === tree) {
                this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                this.cmd("Connect", tree.parent.graphicID, child.graphicID, this.CENTER_LINK_COLOR, 0.0001, false, `=${tree.parent.nextChar}`);
                child.parent = tree.parent;
                tree.parent.center = child;
                this.cmd("Step");
                this.cmd("Delete", tree.graphicID);
            } else {
                throw ("What??");
            }
        } else if (tree.left != null && tree.center == null && tree.right != null) {
            let node = tree.left;
            this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
            this.cmd("SetWidth", this.highlightID, this.NODE_WIDTH);
            this.cmd("Move", this.highlightID, node.x, node.y);
            this.cmd("Step");
            while (node.right != null) {
                node = node.right;
                this.cmd("Move", this.highlightID, node.x, node.y);
                this.cmd("Step");
            }
            if (tree.left !== node) {
                this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
                node.parent.right = node.left;
                if (node.left != null) {
                    node.left.parent = node.parent;
                    this.cmd("Disconnect", node.graphicID, node.left.graphicID);
                    this.cmd("Connect", node.parent.graphicID, node.left.graphicID, this.CENTER_LINK_COLOR, -0.0001, false, `>${node.parent.nextChar}`);
                }
                this.cmd("Disconnect", tree.graphicID, tree.right.graphicID);
                this.cmd("Disconnect", tree.graphicID, tree.left.graphicID);
                node.right = tree.right;
                node.left = tree.left;
                tree.right.parent = node;
                tree.left.parent = node;
                this.cmd("Connect", node.graphicID, node.left.graphicID, this.SIDE_LINK_COLOR, 0.0001, false, `<${node.nextChar}`);
                this.cmd("Connect", node.graphicID, node.right.graphicID, this.SIDE_LINK_COLOR, -0.0001, false, `>${node.nextChar}`);
            } else {
                this.cmd("Disconnect", tree.graphicID, tree.left.graphicID);
                this.cmd("Disconnect", tree.graphicID, tree.right.graphicID);
                node.right = tree.right;
                node.right.parent = node;
                this.cmd("Connect", node.graphicID, node.right.graphicID, this.SIDE_LINK_COLOR, -0.0001, false, `>${node.nextChar}`);
            }
            this.cmd("Delete", this.highlightID);
            this.cmd("Delete", tree.graphicID);
            this.cmd("Step");
            node.parent = tree.parent;
            if (node.parent == null) {
                this.root = node;
            } else {
                this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                if (tree.parent.left === tree) {
                    tree.parent.left = node;
                    node.parent = tree.parent;
                    this.cmd("Connect", node.parent.graphicID, node.graphicID, this.SIDE_LINK_COLOR, 0.0001, false, `<${node.parent.nextChar}`);
                } else if (tree.parent.right === tree) {
                    tree.parent.right = node;
                    node.parent = tree.parent;
                    this.cmd("Connect", node.parent.graphicID, node.graphicID, this.SIDE_LINK_COLOR, -0.0001, false, `>${node.parent.nextChar}`);
                } else if (tree.parent.center === tree) {
                    tree.parent.center = node;
                    node.parent = tree.parent;
                    this.cmd("Connect", node.parent.graphicID, node.graphicID, this.CENTER_LINK_COLOR, 0.0001, false, `=${node.parent.nextChar}`);
                }
            }
        }
    }

    deleteElement(word) {
        this.commands = [];
        this.cmd("SetText", 0, "Deleting: ");
        this.cmd("SetText", 1, `"${word}"`);
        this.cmd("AlignRight", 1, 0);
        this.cmd("Step");

        const node = this.doFind(this.root, word);
        if (node != null) {
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("SetText", 2, `Found "${word}", setting value in tree to False`);
            this.cmd("Step");
            this.cmd("SetBackgroundColor", node.graphicID, this.FALSE_COLOR);
            node.isword = false;
            this.cmd("SetHighlight", node.graphicID, 0);
            this.cleanupAfterDelete(node);
            this.resizeTree();
        } else {
            this.cmd("SetText", 2, `"${word}" not in tree, nothing to delete`);
            this.cmd("Step");
            this.cmd("SetHighlightIndex", 1, -1);
        }
        this.cmd("SetText", 0, "");
        this.cmd("SetText", 1, "");
        this.cmd("SetText", 2, "");
        return this.commands;
    }

    printCallback(event) {
        this.implementAction(this.printTree.bind(this), "");
    }

    printTree(unused) {
        this.commands = [];

        if (this.root != null) {
            this.highlightID = this.nextIndex++;
            this.printLabel1 = this.nextIndex++;
            this.printLabel2 = this.nextIndex++;
            const firstLabel = this.nextIndex++;
            this.cmd("CreateLabel", firstLabel, "Output: ", this.FIRST_PRINT_POS_X, this.firstPrintPosY);
            this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, this.root.x, this.root.y);
            this.cmd("SetWidth", this.highlightID, this.NODE_WIDTH);
            this.cmd("CreateLabel", this.printLabel1, "Current String: ", 20, 10, 0);
            this.cmd("CreateLabel", this.printLabel2, "", 20, 10, 0);
            this.cmd("AlignRight", this.printLabel2, this.printLabel1);
            this.xPosOfNextLabel = this.FIRST_PRINT_POS_X;
            this.yPosOfNextLabel = this.firstPrintPosY;
            this.printTreeRec(this.root, "");

            // this.cmd("SetText", this.printLabel1, "About to delete");
            // this.cmd("Step")
            this.cmd("Delete", this.highlightID);
            this.cmd("Delete", this.printLabel1);
            this.cmd("Delete", this.printLabel2);
            this.cmd("Step");

            for (let i = firstLabel; i < this.nextIndex; i++) {
                this.cmd("Delete", i);
            }
            this.nextIndex = this.highlightID; /// Reuse objects.  Not necessary.
        }
        return this.commands;
    }

    printTreeRec(tree, stringSoFar) {
        if (tree.isword) {
            const nextLabelID = this.nextIndex++;
            this.cmd("CreateLabel", nextLabelID, `${stringSoFar}  `, 20, 10, 0);
            this.cmd("SetForegroundColor", nextLabelID, this.PRINT_COLOR);
            this.cmd("AlignRight", nextLabelID, this.printLabel1, this.PRINT_COLOR);
            this.cmd("MoveToAlignRight", nextLabelID, nextLabelID - 1);
            this.cmd("Step");

            this.xPosOfNextLabel += this.PRINT_HORIZONTAL_GAP;
            if (this.xPosOfNextLabel > this.printMax) {
                this.xPosOfNextLabel = this.FIRST_PRINT_POS_X;
                this.yPosOfNextLabel += this.PRINT_VERTICAL_GAP;
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
            const nextLabelID = this.nextIndex;
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

    findCallback(event) {
        const findValue = this.findField.value;
        if (findValue !== "") {
            this.findField.value = "";
            this.implementAction(this.findElement.bind(this), findValue);
        }
    }

    findElement(word) {
        this.commands = [];

        this.commands = [];
        this.cmd("SetText", 0, "Finding: ");
        this.cmd("SetText", 1, `"${word}"`);
        this.cmd("AlignRight", 1, 0);
        this.cmd("Step");

        const node = this.doFind(this.root, word);
        if (node != null) {
            this.cmd("SetText", 0, `Found "${word}"`);
        } else {
            this.cmd("SetText", 0, `"${word}" not Found`);
        }

        this.cmd("SetText", 1, "");
        this.cmd("SetText", 2, "");

        return this.commands;
    }

    doFind(tree, s) {
        if (tree == null) {
            this.cmd("SetText", 2, "Reached null tree\nWord is not in the tree");
            this.cmd("Step");
            return null;
        }
        this.cmd("SetHighlight", tree.graphicID, 1);

        if (s.length === 0) {
            if (tree.isword) {
                this.cmd("SetText", 2, "Reached the end of the string \nCurrent node is True\nWord is in the tree");
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                return tree;
            } else {
                this.cmd("SetText", 2, "Reached the end of the string \nCurrent node is False\nWord is Not the tree");
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                return null;
            }
        } else {
            this.cmd("SetHighlightIndex", 1, 1);

            let child = null;
            if (tree.nextChar === " ") {
                this.cmd("SetText", 2, "Reached a leaf without a character, still have characeters left in search string \nString is not in the tree");
                this.cmd("Step");
                this.cmd("SetHighlightIndex", 1, -1);
                this.cmd("SetHighlight", tree.graphicID, 0);
                return null;
            }

            if (tree.nextChar === s.charAt(0)) {
                this.cmd("SetText", 2, "Next character in string  matches character at current node\nRecursively look at center child, \nremoving first letter from search string");
                this.cmd("Step");
                s = s.substring(1);
                child = tree.center;
            } else if (tree.nextChar > s.charAt(0)) {
                this.cmd("SetText", 2, "Next character in string < Character at current node\nRecursively look at left node, \nleaving search string as it is");
                this.cmd("Step");
                child = tree.left;
            } else {
                this.cmd("SetText", 2, "Next character in string > Character at current node\nRecursively look at left right, \nleaving search string as it is");
                this.cmd("Step");
                child = tree.right;
            }
            if (child != null) {
                this.cmd("SetText", 1, `"${s}"`);
                this.cmd("SetHighlightIndex", 1, -1);

                this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
                this.cmd("SetWidth", this.highlightID, this.NODE_WIDTH);
                this.cmd("SetHighlight", tree.graphicID, 0);

                this.cmd("Move", this.highlightID, child.x, child.y);
                this.cmd("Step");
                this.cmd("Delete", this.highlightID);
            } else {
                this.cmd("SetHighlight", tree.graphicID, 0);
            }
            return this.doFind(child, s);
        }
    }

    insertElement(insertedValue) {
        this.cmd("SetText", 0, "");
        return this.commands;
    }

    insert(elem, tree) {
    }

    resizeTree() {
        this.resizeWidths(this.root);
        if (this.root != null) {
            let startingPoint = this.LEFT_MARGIN;
            if (this.root.left == null) {
                startingPoint += this.NODE_WIDTH / 2;
            } else {
                startingPoint += this.root.left.width;
            }
            // const startingPoint = this.root.width / 2 + 1 + this.LEFT_MARGIN;
            this.setNewPositions(this.root, startingPoint, this.STARTING_Y);
            this.animateNewPositions(this.root);
            this.cmd("Step");
        }
    }

    add(word) {
        this.commands = [];
        this.cmd("SetText", 0, "Inserting; ");
        this.cmd("SetText", 1, `"${word}"`);
        this.cmd("AlignRight", 1, 0);
        this.cmd("Step");
        if (this.root == null) {
            this.cmd("CreateCircle", this.nextIndex, " ", this.NEW_NODE_X, this.NEW_NODE_Y);
            this.cmd("SetForegroundColor", this.nextIndex, this.FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", this.nextIndex, this.FALSE_COLOR);
            this.cmd("SetWidth", this.nextIndex, this.NODE_WIDTH);
            this.cmd("SetText", 2, "Creating a new root");
            this.root = new TernaryNode(" ", this.nextIndex, this.NEW_NODE_X, this.NEW_NODE_Y);
            this.cmd("Step");
            this.resizeTree();
            this.cmd("SetText", 2, "");
            this.nextIndex++;
            this.highlightID = this.nextIndex++;
        }
        this.addR(word.toUpperCase(), this.root);
        this.cmd("SetText", 0, "");
        this.cmd("SetText", 1, "");
        this.cmd("SetText", 2, "");
        return this.commands;
    }

    createIfNotExtant(tree, child, label) {
        if (child == null) {
            this.cmd("CreateCircle", this.nextIndex, " ", this.NEW_NODE_X, this.NEW_NODE_Y);
            this.cmd("SetForegroundColor", this.nextIndex, this.FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", this.nextIndex, this.FALSE_COLOR);
            this.cmd("SetWidth", this.nextIndex, this.NODE_WIDTH);
            this.cmd("SetText", 2, "Creating a new node");
            child = new TernaryNode(" ", this.nextIndex, this.NEW_NODE_X, this.NEW_NODE_Y);
            this.cmd("Step");
            let dir = 0.0001;
            if (label.charAt(0) === ">") {
                dir = -0.0001;
            }
            let color = this.FOREGROUND_COLOR;
            if (label.charAt(0) === "=") {
                color = this.CENTER_LINK_COLOR;
            } else {
                color = this.SIDE_LINK_COLOR;
            }
            this.cmd("Connect", tree.graphicID, this.nextIndex, color, dir, false, label);
            this.cmd("SetText", 2, "");
            this.nextIndex++;
            this.highlightID = this.nextIndex++;
        }
        return child;
    }

    addR(s, tree) {
        this.cmd("SetHighlight", tree.graphicID, 1);
        if (s.length === 0) {
            this.cmd("SetText", 2, "Reached the end of the string \nSet current node to true");
            this.cmd("Step");
            this.cmd("SetBackgroundColor", tree.graphicID, this.TRUE_COLOR);
            this.cmd("SetHighlight", tree.graphicID, 0);
            tree.isword = true;
            return;
        } else {
            this.cmd("SetHighlightIndex", 1, 1);
            if (tree.nextChar === " ") {
                tree.nextChar = s.charAt(0);
                this.cmd("SetText", 2, `No character for this node, setting to ${s.charAt(0)}`);
                this.cmd("SetText", tree.graphicID, s.charAt(0));
                this.cmd("Step");
                if (tree.center == null) {
                    tree.center = this.createIfNotExtant(tree, tree.center, `=${s.charAt(0)}`);
                    tree.center.parent = tree;
                    this.resizeTree();
                }
                this.cmd("SetHighlightIndex", 1, -1);
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetText", 1, `"${s.substring(1)}"`);

                this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
                this.cmd("SetWidth", this.highlightID, this.NODE_WIDTH);
                this.cmd("Move", this.highlightID, tree.center.x, tree.center.y);
                this.cmd("Step");
                this.cmd("Delete", this.highlightID);

                this.addR(s.substring(1), tree.center);
            } else if (tree.nextChar === s.charAt(0)) {
                this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
                this.cmd("SetWidth", this.highlightID, this.NODE_WIDTH);
                this.cmd("SetText", 2, `Making recursive call to center child, passing in "${s.substring(1)}"`);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetHighlightIndex", 1, -1);
                this.cmd("SetText", 1, `"${s.substring(1)}"`);
                this.cmd("Move", this.highlightID, tree.center.x, tree.center.y);
                this.cmd("Step");
                this.cmd("Delete", this.highlightID);
                this.addR(s.substring(1), tree.center);
            } else {
                let child = null;
                let label = "";
                if (tree.nextChar > s.charAt(0)) {
                    label = `<${tree.nextChar}`;
                    this.cmd("SetText", 2, `Next character in stirng is < value stored at current node \n Making recursive call to left child passing in "${s}"`);
                    tree.left = this.createIfNotExtant(tree, tree.left, label);
                    tree.left.parent = tree;
                    this.resizeTree();
                    child = tree.left;
                } else {
                    label = `>${tree.nextChar}`;
                    this.cmd("SetText", 2, `Next character in stirng is > value stored at current node \n Making recursive call to right child passing in "${s}"`);
                    tree.right = this.createIfNotExtant(tree, tree.right, label);
                    tree.right.parent = tree;
                    child = tree.right;
                    this.resizeTree();
                }
                this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
                this.cmd("SetWidth", this.highlightID, this.NODE_WIDTH);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetHighlightIndex", 1, -1);
                // this.cmd("SetText", 1, "\"" + s.substring(1) + "\"");
                this.cmd("Move", this.highlightID, child.x, child.y);
                this.cmd("Step");
                this.cmd("Delete", this.highlightID);
                this.addR(s, child);
            }
        }
    }

    setNewPositions(tree, xLeft, yPosition) {
        if (tree != null) {
            tree.x = xLeft + this.NODE_WIDTH / 2;
            tree.y = yPosition;
            const newYPos = yPosition + this.HEIGHT_DELTA;
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

    animateNewPositions(tree) {
        if (tree != null) {
            this.cmd("Move", tree.graphicID, tree.x, tree.y);
            this.animateNewPositions(tree.left);
            this.animateNewPositions(tree.center);
            this.animateNewPositions(tree.right);
        }
    }

    resizeWidths(tree) {
        if (tree == null) {
            return 0;
        }
        tree.leftWidth = (this.resizeWidths(tree.left));
        tree.centerWidth = (this.resizeWidths(tree.center));
        tree.rightWidth = (this.resizeWidths(tree.right));
        tree.width = Math.max(tree.leftWidth + tree.centerWidth + tree.rightWidth, this.NODE_WIDTH + 4);
        return tree.width;
    }
}
