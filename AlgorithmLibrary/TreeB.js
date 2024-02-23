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
/* exported TreeB */
///////////////////////////////////////////////////////////////////////////////


class BTreeNode {
    constructor(id, initialX, initialY) {
        this.widths = [];
        this.keys = [];
        this.children = [];
        this.x = initialX;
        this.y = initialY;
        this.graphicID = id;
        this.numKeys = 0;
        this.isLeaf = true;
        this.parent = null;
        this.leftWidth = 0;
        this.rightWidth = 0;
    }

    toString() {
        return `[${this.keys.join(" ")}]`;
    }
}


class TreeB extends Algorithm {
    MAX_DEGREES = [3, 4, 5, 6, 7];
    MAX_DEGREE_LABELS = ["2/3-tree", "2/3/4-tree", "Max. degree 5", "Max. degree 6", "Max. degree 7"];
    INITIAL_MAX_DEGREE = 3;

    FOREGROUND_COLOR = "#007700";
    BACKGROUND_COLOR = "#EEFFEE";
    HIGHLIGHT_COLOR = "#FF0000";

    LINK_COLOR = this.FOREGROUND_COLOR;
    HIGHLIGHT_CIRCLE_COLOR = this.FOREGROUND_COLOR;
    PRINT_COLOR = this.FOREGROUND_COLOR;

    WIDTH_PER_ELEM = 40;
    NODE_HEIGHT = 30;
    NODE_SPACING = 20;
    HEIGHT_DELTA = this.NODE_HEIGHT + 20;
    STARTING_Y = 50;

    FIRST_PRINT_POS_X = 50;
    PRINT_VERTICAL_GAP = 20;
    PRINT_HORIZONTAL_GAP = 50;

    MESSAGE_X = 10;
    MESSAGE_Y = 10;

    constructor(am, maxDegree) {
        super();
        this.initialMaxDegree = maxDegree || this.INITIAL_MAX_DEGREE;
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
        this.moveLabel1ID = this.nextIndex++;
        this.moveLabel2ID = this.nextIndex++;

        this.initialIndex = this.nextIndex;
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();

        this.updateMaxDegree();
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
        this.addBreakToAlgorithmBar();

        this.maxDegreeSelect = this.addSelectToAlgorithmBar(this.MAX_DEGREES, this.MAX_DEGREE_LABELS);
        this.maxDegreeSelect.value = this.initialMaxDegree;
        this.maxDegreeSelect.onchange = this.maxDegreeChangedHandler.bind(this);
        this.addBreakToAlgorithmBar();

        this.premptiveSplitBox = this.addCheckboxToAlgorithmBar("Preemtive split/merge");
    }

    reset() {
        this.nextIndex = this.initialIndex;
        this.updateMaxDegree();
        this.treeRoot = null;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Information about the type of BTree

    preemptiveSplit() {
        return this.premptiveSplitBox.checked;
    }

    updateMaxDegree() {
        const maxDegree = parseInt(this.maxDegreeSelect.value) || this.initialMaxDegree;
        const preemptiveSplitDisabled = maxDegree % 2 !== 0;
        if (preemptiveSplitDisabled && this.preemptiveSplit()) {
            this.premptiveSplitBox.checked = false;
        }
        this.premptiveSplitBox.disabled = preemptiveSplitDisabled;
    }

    getMaxDegree() {
        return parseInt(this.maxDegreeSelect.value);
    }

    getMaxKeys() {
        return this.getMaxDegree() - 1;
    }

    getMinKeys() {
        return Math.floor((this.getMaxDegree() + 1) / 2) - 1;
    }

    getSplitIndex() {
        return Math.floor((this.getMaxDegree() - 1) / 2);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Callback functions for the algorithm control bar

    maxDegreeChangedHandler(event) {
        this.implementAction(this.clearTree.bind(this));
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

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
        const firstLabel = this.nextIndex;

        this.xPosOfNextLabel = this.FIRST_PRINT_POS_X;
        this.yPosOfNextLabel = this.firstPrintPosY;

        this.printTreeRec(this.treeRoot);
        this.cmd("Step");
        for (let i = firstLabel; i < this.nextIndex; i++) {
            this.cmd("Delete", i);
        }
        this.nextIndex = firstLabel; // Reuse objects. Not necessary.
        this.cmd("SetText", this.messageID, "");
        return this.commands;
    }

    printTreeRec(tree) {
        this.cmd("SetHighlight", tree.graphicID, 1);

        if (tree.isLeaf) {
            for (let i = 0; i < tree.numKeys; i++) {
                const nextLabelID = this.nextIndex++;
                this.cmd("CreateLabel", nextLabelID, tree.keys[i], this.getLabelX(tree, i), tree.y);
                this.cmd("SetForegroundColor", nextLabelID, this.PRINT_COLOR);
                this.cmd("Move", nextLabelID, this.xPosOfNextLabel, this.yPosOfNextLabel);
                this.cmd("Step");
                this.xPosOfNextLabel += this.PRINT_HORIZONTAL_GAP;
                if (this.xPosOfNextLabel > this.printMax) {
                    this.xPosOfNextLabel = this.FIRST_PRINT_POS_X;
                    this.yPosOfNextLabel += this.PRINT_VERTICAL_GAP;
                }
            }
            this.cmd("SetHighlight", tree.graphicID, 0);
        } else {
            this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[0].graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[0].graphicID, 0);
            this.printTreeRec(tree.children[0]);
            for (let i = 0; i < tree.numKeys; i++) {
                this.cmd("SetHighlight", tree.graphicID, 1);
                const nextLabelID = this.nextIndex++;
                this.cmd("CreateLabel", nextLabelID, tree.keys[i], this.getLabelX(tree, i), tree.y);
                this.cmd("SetForegroundColor", nextLabelID, this.PRINT_COLOR);
                this.cmd("Move", nextLabelID, this.xPosOfNextLabel, this.yPosOfNextLabel);
                this.cmd("Step");
                this.xPosOfNextLabel += this.PRINT_HORIZONTAL_GAP;
                if (this.xPosOfNextLabel > this.printMax) {
                    this.xPosOfNextLabel = this.FIRST_PRINT_POS_X;
                    this.yPosOfNextLabel += this.PRINT_VERTICAL_GAP;
                }
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i + 1].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i + 1].graphicID, 0);
                this.printTreeRec(tree.children[i + 1]);
            }
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
        }
    }

    clearTree() {
        this.updateMaxDegree();
        this.commands = [];
        this.deleteTree(this.treeRoot);
        this.treeRoot = null;
        this.nextIndex = this.initialIndex;
        return this.commands;
    }

    deleteTree(tree) {
        if (tree != null) {
            if (!tree.isLeaf) {
                for (let i = 0; i <= tree.numKeys; i++) {
                    this.cmd("Disconnect", tree.graphicID, tree.children[i].graphicID);
                    this.deleteTree(tree.children[i]);
                    tree.children[i] = null;
                }
            }
            this.cmd("Delete", tree.graphicID);
        }
    }

    findElement(findValue) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Finding ${findValue}`);
        const found = this.doFind(this.treeRoot, findValue);
        this.cmd("SetText", this.messageID, `Element ${findValue} ${found ? "found" : "not found"}`);
        return this.commands;
    }

    doFind(tree, value) {
        if (tree != null) {
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("Step");
            let i = 0;
            while (i < tree.numKeys && this.compare(tree.keys[i], value) < 0)
                i++;
            if (i === tree.numKeys || this.compare(tree.keys[i], value) > 0) {
                if (!tree.isLeaf) {
                    let cmpstr = value;
                    if (i > 0) cmpstr = `${tree.keys[i - 1]} < ${cmpstr}`;
                    if (i < tree.numKeys) cmpstr = `${cmpstr} < ${tree.keys[i]}`;
                    this.cmd("SetText", this.messageID, `Searching for ${value}: ${cmpstr} (recurse into child)`);
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 1);
                    this.cmd("Step");
                    this.cmd("SetHighlight", tree.graphicID, 0);
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 0);
                    return this.doFind(tree.children[i], value);
                } else {
                    this.cmd("SetHighlight", tree.graphicID, 0);
                    return false;
                }
            } else {
                this.cmd("SetTextColor", tree.graphicID, this.HIGHLIGHT_COLOR, i);
                this.cmd("SetText", this.messageID, `Element ${value} found`);
                this.cmd("Step");
                this.cmd("SetTextColor", tree.graphicID, this.FOREGROUND_COLOR, i);
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("Step");
                return true;
            }
        } else {
            return false;
        }
    }

    insertElement(insertedValue) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Inserting ${insertedValue}`);
        this.cmd("Step");

        if (this.treeRoot == null) {
            this.treeRoot = new BTreeNode(this.nextIndex++, this.startingX, this.STARTING_Y);
            this.cmd(
                "CreateBTreeNode",
                this.treeRoot.graphicID,
                this.WIDTH_PER_ELEM,
                this.NODE_HEIGHT,
                1,
                this.startingX,
                this.STARTING_Y,
                this.BACKGROUND_COLOR,
                this.FOREGROUND_COLOR,
            );
            this.treeRoot.keys[0] = insertedValue;
            this.treeRoot.numKeys = 1;
            this.cmd("SetText", this.treeRoot.graphicID, insertedValue, 0);
        } else {
            if (this.preemptiveSplit()) {
                if (this.treeRoot.numKeys === this.getMaxKeys()) {
                    this.split(this.treeRoot);
                    this.resizeTree();
                    this.cmd("Step");
                }
                this.insertNotFull(this.treeRoot, insertedValue);
            } else {
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

    insertNotFull(tree, insertValue) {
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("Step");
        if (tree.isLeaf) {
            this.cmd("SetText", this.messageID, `Inserting ${insertValue} into the leaf node ${tree}`);
            tree.numKeys++;
            this.cmd("SetNumElements", tree.graphicID, tree.numKeys);
            let insertIndex = tree.numKeys - 1;
            while (insertIndex > 0 && this.compare(tree.keys[insertIndex - 1], insertValue) > 0) {
                tree.keys[insertIndex] = tree.keys[insertIndex - 1];
                this.cmd("SetText", tree.graphicID, tree.keys[insertIndex], insertIndex);
                insertIndex--;
            }
            tree.keys[insertIndex] = insertValue;
            this.cmd("SetText", tree.graphicID, tree.keys[insertIndex], insertIndex);
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.resizeTree();
        } else {
            let findIndex = 0;
            while (findIndex < tree.numKeys && this.compare(tree.keys[findIndex], insertValue) < 0) {
                findIndex++;
            }
            this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[findIndex].graphicID, 1);
            this.cmd("Step");
            this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[findIndex].graphicID, 0);
            this.cmd("SetHighlight", tree.graphicID, 0);
            if (tree.children[findIndex].numKeys === this.getMaxKeys()) {
                const newTree = this.split(tree.children[findIndex]);
                this.resizeTree();
                this.cmd("Step");
                this.insertNotFull(newTree, insertValue);
            } else {
                this.insertNotFull(tree.children[findIndex], insertValue);
            }
        }
    }

    insert(tree, insertValue) {
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("Step");
        if (tree.isLeaf) {
            this.cmd("SetText", this.messageID, `Inserting ${insertValue} into the leaf node ${tree}`);
            tree.numKeys++;
            this.cmd("SetNumElements", tree.graphicID, tree.numKeys);
            let insertIndex = tree.numKeys - 1;
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
        } else {
            let findIndex = 0;
            while (findIndex < tree.numKeys && this.compare(tree.keys[findIndex], insertValue) < 0)
                findIndex++;
            this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[findIndex].graphicID, 1);
            this.cmd("Step");
            this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[findIndex].graphicID, 0);
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.insert(tree.children[findIndex], insertValue);
        }
    }

    insertRepair(tree) {
        if (tree.numKeys <= this.getMaxKeys()) {
            return;
        } else if (tree.parent == null) {
            this.treeRoot = this.split(tree);
            return;
        } else {
            const newNode = this.split(tree);
            this.insertRepair(newNode);
        }
    }

    split(tree) {
        this.cmd("SetText", this.messageID, `Node ${tree} contains too many keys: splitting it`);
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetHighlight", tree.graphicID, 0);
        const rightNode = new BTreeNode(this.nextIndex++, tree.x + 100, tree.y);
        const risingNode = tree.keys[this.getSplitIndex()];

        let currentParent, parentIndex;
        if (tree.parent != null) {
            currentParent = tree.parent;
            parentIndex = this.getParentIndex(tree);
            this.cmd("SetNumElements", currentParent.graphicID, currentParent.numKeys + 1);
            for (let i = currentParent.numKeys; i > parentIndex; i--) {
                currentParent.children[i + 1] = currentParent.children[i];
                this.cmd("Disconnect", currentParent.graphicID, currentParent.children[i].graphicID);
                this.cmd(
                    "Connect",
                    currentParent.graphicID,
                    currentParent.children[i].graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    0, // Directed
                    "", // Label
                    i + 1, // Connection Point
                );
                currentParent.keys[i] = currentParent.keys[i - 1];
                this.cmd("SetText", currentParent.graphicID, currentParent.keys[i], i);
            }
            currentParent.numKeys++;
            currentParent.keys[parentIndex] = risingNode;
            this.cmd("SetText", currentParent.graphicID, "", parentIndex);
            this.moveLabel1ID = this.nextIndex++;
            this.cmd("CreateLabel", this.moveLabel1ID, risingNode, this.getLabelX(tree, this.getSplitIndex()), tree.y);
            this.cmd("SetForegroundColor", this.moveLabel1ID, this.FOREGROUND_COLOR);
            this.cmd("Move", this.moveLabel1ID, this.getLabelX(currentParent, parentIndex), currentParent.y);
            currentParent.children[parentIndex + 1] = rightNode;
            rightNode.parent = currentParent;
        }

        rightNode.numKeys = tree.numKeys - this.getSplitIndex() - 1;
        this.cmd(
            "CreateBTreeNode",
            rightNode.graphicID,
            this.WIDTH_PER_ELEM,
            this.NODE_HEIGHT,
            rightNode.numKeys,
            tree.x,
            tree.y,
            this.BACKGROUND_COLOR,
            this.FOREGROUND_COLOR,
        );
        for (let i = this.getSplitIndex() + 1; i <= tree.numKeys; i++) {
            const j = i - this.getSplitIndex() - 1;
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
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    0, // Directed
                    "", // Label
                    j, // Connection Point
                );
                tree.children[i].parent = rightNode;
            }
        }
        for (let i = tree.numKeys - 1; i >= this.getSplitIndex(); i--) {
            this.cmd("SetText", tree.graphicID, "", i); // TO MAKE UNDO WORK
            tree.children.pop();
            tree.keys.pop();
            tree.numKeys--;
        }
        this.cmd("SetNumElements", tree.graphicID, this.getSplitIndex());
        const leftNode = tree;

        if (tree.parent != null) {
            this.cmd(
                "Connect",
                currentParent.graphicID,
                rightNode.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                0, // Directed
                "", // Label
                parentIndex + 1, // Connection Point
            );
            this.resizeTree();
            this.cmd("Step");
            this.cmd("Delete", this.moveLabel1ID);
            this.cmd("SetText", currentParent.graphicID, risingNode, parentIndex);
            return tree.parent;
        } else { // if (tree.parent == null)
            this.treeRoot = new BTreeNode(this.nextIndex++, this.startingX, this.STARTING_Y);
            this.cmd(
                "CreateBTreeNode",
                this.treeRoot.graphicID,
                this.WIDTH_PER_ELEM,
                this.NODE_HEIGHT,
                1,
                this.startingX,
                this.STARTING_Y,
                this.BACKGROUND_COLOR,
                this.FOREGROUND_COLOR,
            );
            this.treeRoot.keys[0] = risingNode;
            this.treeRoot.numKeys = 1;
            this.cmd("SetText", this.treeRoot.graphicID, risingNode, 0);
            this.treeRoot.children[0] = leftNode;
            this.treeRoot.children[1] = rightNode;
            leftNode.parent = this.treeRoot;
            rightNode.parent = this.treeRoot;
            this.cmd(
                "Connect",
                this.treeRoot.graphicID,
                leftNode.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                0, // Directed
                "", // Label
                0, // Connection Point
            );
            this.cmd(
                "Connect",
                this.treeRoot.graphicID,
                rightNode.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                0, // Directed
                "", // Label
                1, // Connection Point
            );
            this.treeRoot.isLeaf = false;
            return this.treeRoot;
        }
    }

    deleteElement(deletedValue) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Deleting ${deletedValue}`);
        this.cmd("Step");
        this.cmd("SetText", this.messageID, "");
        this.highlightID = this.nextIndex++;
        if (this.preemptiveSplit()) {
            this.doDeleteNotEmpty(this.treeRoot, deletedValue);
        } else {
            this.doDelete(this.treeRoot, deletedValue);
        }
        if (this.treeRoot && this.treeRoot.numKeys === 0) {
            this.cmd("Step");
            this.cmd("Delete", this.treeRoot.graphicID);
            if (this.treeRoot.isLeaf) {
                this.treeRoot = null;
            } else {
                this.treeRoot = this.treeRoot.children[0];
                this.treeRoot.parent = null;
            }
        }
        this.resizeTree();
        this.validateTree();
        return this.commands;
    }

    doDeleteNotEmpty(tree, val) {
        if (tree != null) {
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("Step");
            let i = 0;
            while (i < tree.numKeys && this.compare(tree.keys[i], val) < 0)
                i++;
            if (i === tree.numKeys) {
                if (!tree.isLeaf) {
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[tree.numKeys].graphicID, 1);
                    this.cmd("Step");
                    this.cmd("SetHighlight", tree.graphicID, 0);
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[tree.numKeys].graphicID, 0);

                    if (tree.children[tree.numKeys].numKeys === this.getMinKeys()) {
                        if (tree.children[tree.numKeys - 1].numKeys > this.getMinKeys()) {
                            const nextNode = this.stealFromLeft(tree.children[tree.numKeys], tree.numKeys);
                            this.doDeleteNotEmpty(nextNode, val);
                        } else {
                            const nextNode = this.mergeRight(tree.children[tree.numKeys - 1]);
                            this.doDeleteNotEmpty(nextNode, val);
                        }
                    } else {
                        this.doDeleteNotEmpty(tree.children[tree.numKeys], val);
                    }
                } else {
                    this.cmd("SetHighlight", tree.graphicID, 0);
                }
            } else if (this.compare(tree.keys[i], val) > 0) {
                if (!tree.isLeaf) {
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 1);
                    this.cmd("Step");
                    this.cmd("SetHighlight", tree.graphicID, 0);
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 0);

                    if (tree.children[i].numKeys > this.getMinKeys()) {
                        this.doDeleteNotEmpty(tree.children[i], val);
                    } else if (tree.children[i + 1].numKeys > this.getMinKeys()) {
                        const nextNode = this.stealFromRight(tree.children[i], i);
                        this.doDeleteNotEmpty(nextNode, val);
                    } else {
                        const nextNode = this.mergeRight(tree.children[i]);
                        this.doDeleteNotEmpty(nextNode, val);
                    }
                } else {
                    this.cmd("SetHighlight", tree.graphicID, 0);
                }
            } else {
                this.cmd("SetTextColor", tree.graphicID, this.HIGHLIGHT_COLOR, i);
                this.cmd("Step");
                if (tree.isLeaf) {
                    this.cmd("SetTextColor", tree.graphicID, this.FOREGROUND_COLOR, i);
                    for (let j = i; j < tree.numKeys - 1; j++) {
                        tree.keys[j] = tree.keys[j + 1];
                        this.cmd("SetText", tree.graphicID, tree.keys[j], j);
                    }
                    tree.keys.pop();
                    tree.numKeys--;
                    this.cmd("SetText", tree.graphicID, "", tree.numKeys);
                    this.cmd("SetNumElements", tree.graphicID, tree.numKeys);
                    this.cmd("SetHighlight", tree.graphicID, 0);
                    this.resizeTree();
                    this.cmd("SetText", this.messageID, "");
                } else {
                    this.cmd("SetText", this.messageID, "Checking to see if tree to left of \nelement to delete has an extra key");
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 1);
                    this.cmd("Step");
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 0);
                    let maxNode = tree.children[i];

                    if (tree.children[i].numKeys === this.getMinKeys()) {
                        this.cmd("SetText", this.messageID,
                            "Tree to left of element to delete does not have an extra key. \nLooking to the right ...");
                        this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i + 1].graphicID, 1);
                        this.cmd("Step");
                        this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i + 1].graphicID, 0);
                        // Trees to left and right of node to delete don't have enough keys
                        // Do a merge, and then recursively delete the element
                        if (tree.children[i + 1].numKeys === this.getMinKeys()) {
                            this.cmd("SetText", this.messageID,
                                "Neither subtree has extra nodes. Merging around the key to delete, \nand recursively deleting ...");
                            this.cmd("Step");
                            this.cmd("SetTextColor", tree.graphicID, this.FOREGROUND_COLOR, i);
                            const nextNode = this.mergeRight(tree.children[i]);
                            this.doDeleteNotEmpty(nextNode, val);
                            return;
                        } else {
                            this.cmd("SetText", this.messageID,
                                "Tree to right of element to delete does have an extra key. \nFinding the smallest key in that subtree ...");
                            this.cmd("Step");

                            let minNode = tree.children[i + 1];
                            while (!minNode.isLeaf) {
                                this.cmd("SetHighlight", minNode.graphicID, 1);
                                this.cmd("Step");
                                this.cmd("SetHighlight", minNode.graphicID, 0);
                                if (minNode.children[0].numKeys === this.getMinKeys()) {
                                    if (minNode.children[1].numKeys === this.getMinKeys()) {
                                        minNode = this.mergeRight(minNode.children[0]);
                                    } else {
                                        minNode = this.stealFromRight(minNode.children[0], 0);
                                    }
                                } else {
                                    minNode = minNode.children[0];
                                }
                            }

                            this.cmd("SetHighlight", minNode.graphicID, 1);
                            tree.keys[i] = minNode.keys[0];
                            this.cmd("SetTextColor", tree.graphicID, this.FOREGROUND_COLOR, i);
                            this.cmd("SetText", tree.graphicID, "", i);
                            this.cmd("SetText", minNode.graphicID, "", 0);

                            this.cmd("CreateLabel", this.moveLabel1ID, minNode.keys[0], this.getLabelX(minNode, 0), minNode.y);
                            this.cmd("Move", this.moveLabel1ID, this.getLabelX(tree, i), tree.y);
                            this.cmd("Step");
                            this.cmd("Delete", this.moveLabel1ID);
                            this.cmd("SetText", tree.graphicID, tree.keys[i], i);
                            for (let j = 1; j < minNode.numKeys; j++) {
                                minNode.keys[j - 1] = minNode.keys[j];
                                this.cmd("SetText", minNode.graphicID, minNode.keys[j - 1], j - 1);
                            }
                            this.cmd("SetText", minNode.graphicID, "", minNode.numKeys - 1);

                            minNode.keys.pop();
                            minNode.numKeys--;
                            this.cmd("SetHighlight", minNode.graphicID, 0);
                            this.cmd("SetHighlight", tree.graphicID, 0);

                            this.cmd("SetNumElements", minNode.graphicID, minNode.numKeys);
                            this.resizeTree();
                            this.cmd("SetText", this.messageID, "");
                        }
                    } else {
                        this.cmd("SetText", this.messageID,
                            "Tree to left of element to delete does have an extra key. \nFinding the largest key in that subtree ...");
                        this.cmd("Step");
                        while (!maxNode.isLeaf) {
                            this.cmd("SetHighlight", maxNode.graphicID, 1);
                            this.cmd("Step");
                            this.cmd("SetHighlight", maxNode.graphicID, 0);
                            if (maxNode.children[maxNode.numKeys].numKeys === this.getMinKeys()) {
                                if (maxNode.children[maxNode.numKeys - 1] > this.getMinKeys()) {
                                    maxNode = this.stealFromLeft(maxNode.children[maxNode.numKeys], maxNode.numKeys);
                                } else {
                                    maxNode = this.mergeRight(maxNode.children[maxNode.numKeys - 1]);
                                }
                            } else {
                                maxNode = maxNode.children[maxNode.numKeys];
                            }
                        }
                        this.cmd("SetHighlight", maxNode.graphicID, 1);
                        tree.keys[i] = maxNode.keys[maxNode.numKeys - 1];
                        this.cmd("SetTextColor", tree.graphicID, this.FOREGROUND_COLOR, i);
                        this.cmd("SetText", tree.graphicID, "", i);
                        this.cmd("SetText", maxNode.graphicID, "", maxNode.numKeys - 1);
                        this.cmd("CreateLabel", this.moveLabel1ID, tree.keys[i], this.getLabelX(maxNode, maxNode.numKeys - 1), maxNode.y);
                        this.cmd("Move", this.moveLabel1ID, this.getLabelX(tree, i), tree.y);
                        this.cmd("Step");
                        this.cmd("Delete", this.moveLabel1ID);
                        this.cmd("SetText", tree.graphicID, tree.keys[i], i);
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

    doDelete(tree, val) {
        if (tree != null) {
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("Step");
            let i = 0;
            while (i < tree.numKeys && this.compare(tree.keys[i], val) < 0)
                i++;
            if (i === tree.numKeys) {
                if (!tree.isLeaf) {
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[tree.numKeys].graphicID, 1);
                    this.cmd("Step");
                    this.cmd("SetHighlight", tree.graphicID, 0);
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[tree.numKeys].graphicID, 0);
                    this.doDelete(tree.children[tree.numKeys], val);
                } else {
                    this.cmd("SetHighlight", tree.graphicID, 0);
                }
            } else if (this.compare(tree.keys[i], val) > 0) {
                if (!tree.isLeaf) {
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 1);
                    this.cmd("Step");
                    this.cmd("SetHighlight", tree.graphicID, 0);
                    this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 0);
                    this.doDelete(tree.children[i], val);
                } else {
                    this.cmd("SetHighlight", tree.graphicID, 0);
                }
            } else {
                this.cmd("SetTextColor", tree.graphicID, this.HIGHLIGHT_COLOR, i);
                this.cmd("Step");
                if (tree.isLeaf) {
                    this.cmd("SetTextColor", tree.graphicID, this.FOREGROUND_COLOR, i);
                    for (let j = i; j < tree.numKeys - 1; j++) {
                        tree.keys[j] = tree.keys[j + 1];
                        this.cmd("SetText", tree.graphicID, tree.keys[j], j);
                    }
                    tree.keys.pop();
                    tree.numKeys--;
                    this.cmd("SetText", tree.graphicID, "", tree.numKeys);
                    this.cmd("SetNumElements", tree.graphicID, tree.numKeys);
                    this.cmd("SetHighlight", tree.graphicID, 0);
                    this.repairAfterDelete(tree);
                } else {
                    let maxNode = tree.children[i];
                    while (!maxNode.isLeaf) {
                        this.cmd("SetHighlight", maxNode.graphicID, 1);
                        this.cmd("Step");
                        this.cmd("SetHighlight", maxNode.graphicID, 0);
                        maxNode = maxNode.children[maxNode.numKeys];
                    }
                    this.cmd("SetHighlight", maxNode.graphicID, 1);
                    tree.keys[i] = maxNode.keys[maxNode.numKeys - 1];
                    this.cmd("SetTextColor", tree.graphicID, this.FOREGROUND_COLOR, i);
                    this.cmd("SetText", tree.graphicID, "", i);
                    this.cmd("SetText", maxNode.graphicID, "", maxNode.numKeys - 1);
                    this.cmd("CreateLabel", this.moveLabel1ID, tree.keys[i], this.getLabelX(maxNode, maxNode.numKeys - 1), maxNode.y);
                    this.cmd("Move", this.moveLabel1ID, this.getLabelX(tree, i), tree.y);
                    this.cmd("Step");
                    this.cmd("Delete", this.moveLabel1ID);
                    this.cmd("SetText", tree.graphicID, tree.keys[i], i);
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

    mergeRight(tree) {
        const parentNode = tree.parent;
        const parentIndex = this.getParentIndex(tree);
        const rightSib = parentNode.children[parentIndex + 1];
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("SetHighlight", parentNode.graphicID, 1);
        this.cmd("SetHighlight", rightSib.graphicID, 1);
        this.cmd("SetText", this.messageID, `Merging nodes: \n${tree} + [${parentNode.keys[parentIndex]}] + ${rightSib}`);
        this.cmd("Step");

        this.cmd("SetNumElements", tree.graphicID, tree.numKeys + rightSib.numKeys + 1);
        tree.x = (tree.x + rightSib.x) / 2;
        this.cmd("SetPosition", tree.graphicID, tree.x, tree.y);

        tree.keys[tree.numKeys] = parentNode.keys[parentIndex];
        const fromParentIndex = tree.numKeys;
        this.cmd("SetText", tree.graphicID, "", tree.numKeys);
        this.cmd("CreateLabel", this.moveLabel1ID, parentNode.keys[parentIndex], this.getLabelX(parentNode, parentIndex), parentNode.y);

        for (let i = 0; i < rightSib.numKeys; i++) {
            const j = tree.numKeys + 1 + i;
            tree.keys[j] = rightSib.keys[i];
            this.cmd("SetText", tree.graphicID, tree.keys[j], j);
            this.cmd("SetText", rightSib.graphicID, "", i);
        }
        if (!tree.isLeaf) {
            for (let i = 0; i <= rightSib.numKeys; i++) {
                const j = tree.numKeys + 1 + i;
                this.cmd("Disconnect", rightSib.graphicID, rightSib.children[i].graphicID);
                tree.children[j] = rightSib.children[i];
                tree.children[j].parent = tree;
                this.cmd(
                    "Connect",
                    tree.graphicID,
                    tree.children[j].graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    0, // Directed
                    "", // Label
                    j, // Connection Point
                );
            }
        }
        this.cmd("Disconnect", parentNode.graphicID, rightSib.graphicID);
        for (let i = parentIndex + 1; i < parentNode.numKeys; i++) {
            this.cmd("Disconnect", parentNode.graphicID, parentNode.children[i + 1].graphicID);
            parentNode.children[i] = parentNode.children[i + 1];
            this.cmd(
                "Connect",
                parentNode.graphicID,
                parentNode.children[i].graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                0, // Directed
                "", // Label
                i, // Connection Point
            );
            parentNode.keys[i - 1] = parentNode.keys[i];
            this.cmd("SetText", parentNode.graphicID, parentNode.keys[i - 1], i - 1);
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

    stealFromRight(tree, parentIndex) {
        // Steal from right sibling
        const parentNode = tree.parent;
        const rightSib = parentNode.children[parentIndex + 1];
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("SetHighlight", parentNode.graphicID, 1);
        this.cmd("SetHighlight", rightSib.graphicID, 1);
        this.cmd("SetText", this.messageID, `Stealing from right sibling: \n${tree} ← [${parentNode.keys[parentIndex]}] ← ${rightSib}`);
        this.cmd("Step");

        tree.numKeys++;
        this.cmd("SetNumElements", tree.graphicID, tree.numKeys);

        this.cmd("SetText", tree.graphicID, "", tree.numKeys - 1);
        this.cmd("SetText", parentNode.graphicID, "", parentIndex);
        this.cmd("SetText", rightSib.graphicID, "", 0);

        const tmpLabel1 = this.nextIndex++;
        const tmpLabel2 = this.nextIndex++;
        this.cmd("CreateLabel", tmpLabel1, rightSib.keys[0], this.getLabelX(rightSib, 0), rightSib.y);
        this.cmd("CreateLabel", tmpLabel2, parentNode.keys[parentIndex], this.getLabelX(parentNode, parentIndex), parentNode.y);
        this.cmd("SetForegroundColor", tmpLabel1, this.FOREGROUND_COLOR);
        this.cmd("SetForegroundColor", tmpLabel2, this.FOREGROUND_COLOR);

        this.cmd("Move", tmpLabel1, this.getLabelX(parentNode, parentIndex), parentNode.y);
        this.cmd("Move", tmpLabel2, this.getLabelX(tree, tree.numKeys - 1), tree.y);
        this.cmd("Step");
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
                this.FOREGROUND_COLOR,
                0, // Curve
                0, // Directed
                "", // Label
                tree.numKeys, // Connection Point
            );
            for (let i = 1; i < rightSib.numKeys + 1; i++) {
                this.cmd("Disconnect", rightSib.graphicID, rightSib.children[i].graphicID);
                rightSib.children[i - 1] = rightSib.children[i];
                this.cmd(
                    "Connect",
                    rightSib.graphicID,
                    rightSib.children[i - 1].graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    0, // Directed
                    "", // Label
                    i - 1, // Connection Point
                );
            }
        }
        for (let i = 1; i < rightSib.numKeys; i++) {
            rightSib.keys[i - 1] = rightSib.keys[i];
            this.cmd("SetText", rightSib.graphicID, rightSib.keys[i - 1], i - 1);
        }
        this.cmd("SetText", rightSib.graphicID, "", rightSib.numKeys - 1);
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

    stealFromLeft(tree, parentIndex) {
        const parentNode = tree.parent;
        // Steal from left sibling
        tree.numKeys++;
        this.cmd("SetNumElements", tree.graphicID, tree.numKeys);
        for (let i = tree.numKeys - 1; i > 0; i--) {
            tree.keys[i] = tree.keys[i - 1];
            this.cmd("SetText", tree.graphicID, tree.keys[i], i);
        }
        const leftSib = parentNode.children[parentIndex - 1];
        this.cmd("SetText", this.messageID, `Stealing from left sibling: \n${leftSib} → [${parentNode.keys[parentIndex]}] → ${tree}`);
        this.cmd("SetText", tree.graphicID, "", 0);
        this.cmd("SetText", parentNode.graphicID, "", parentIndex - 1);
        this.cmd("SetText", leftSib.graphicID, "", leftSib.numKeys - 1);

        const tmpLabel1 = this.nextIndex++;
        const tmpLabel2 = this.nextIndex++;
        this.cmd("CreateLabel", tmpLabel1, leftSib.keys[leftSib.numKeys - 1], this.getLabelX(leftSib, leftSib.numKeys - 1), leftSib.y);
        this.cmd("CreateLabel", tmpLabel2, parentNode.keys[parentIndex - 1], this.getLabelX(parentNode, parentIndex - 1), parentNode.y);
        this.cmd("SetForegroundColor", tmpLabel1, this.FOREGROUND_COLOR);
        this.cmd("SetForegroundColor", tmpLabel2, this.FOREGROUND_COLOR);

        this.cmd("Move", tmpLabel1, this.getLabelX(parentNode, parentIndex - 1), parentNode.y);
        this.cmd("Move", tmpLabel2, this.getLabelX(tree, 0), tree.y);
        this.cmd("Step");
        this.cmd("Delete", tmpLabel1);
        this.cmd("Delete", tmpLabel2);
        if (!tree.isLeaf) {
            for (let i = tree.numKeys; i > 0; i--) {
                this.cmd("Disconnect", tree.graphicID, tree.children[i - 1].graphicID);
                tree.children[i] = tree.children[i - 1];
                this.cmd(
                    "Connect",
                    tree.graphicID,
                    tree.children[i].graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    0, // Directed
                    "", // Label
                    i, // Connection Point
                );
            }
            tree.children[0] = leftSib.children[leftSib.numKeys];
            this.cmd("Disconnect", leftSib.graphicID, leftSib.children[leftSib.numKeys].graphicID);
            this.cmd(
                "Connect",
                tree.graphicID,
                tree.children[0].graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                0, // Directed
                "", // Label
                0, // Connection Point
            );
            leftSib.children[leftSib.numKeys] = null;
            tree.children[0].parent = tree;
        }
        tree.keys[0] = parentNode.keys[parentIndex - 1];
        this.cmd("SetText", tree.graphicID, tree.keys[0], 0);
        parentNode.keys[parentIndex - 1] = leftSib.keys[leftSib.numKeys - 1];
        this.cmd("SetText", parentNode.graphicID, parentNode.keys[parentIndex - 1], parentIndex - 1);
        this.cmd("SetText", leftSib.graphicID, "", leftSib.numKeys - 1);
        leftSib.children.pop();
        leftSib.keys.pop();
        leftSib.numKeys--;
        this.cmd("SetNumElements", leftSib.graphicID, leftSib.numKeys);
        this.resizeTree();
        this.cmd("SetText", this.messageID, "");
        return tree;
    }

    repairAfterDelete(tree) {
        if (tree.numKeys < this.getMinKeys()) {
            if (tree.parent == null) {
                if (tree.numKeys === 0) {
                    this.cmd("Step");
                    this.cmd("Delete", tree.graphicID);
                    this.treeRoot = tree.children[0];
                    if (this.treeRoot != null)
                        this.treeRoot.parent = null;
                    this.resizeTree();
                }
            } else {
                const parentNode = tree.parent;
                const parentIndex = this.getParentIndex(tree);
                if (parentIndex > 0 && parentNode.children[parentIndex - 1].numKeys > this.getMinKeys()) {
                    this.stealFromLeft(tree, parentIndex);
                } else if (parentIndex < parentNode.numKeys && parentNode.children[parentIndex + 1].numKeys > this.getMinKeys()) {
                    this.stealFromRight(tree, parentIndex);
                } else if (parentIndex === 0) {
                    // Merge with right sibling
                    const nextNode = this.mergeRight(tree);
                    this.repairAfterDelete(nextNode.parent);
                } else {
                    // Merge with left sibling
                    const nextNode = this.mergeRight(parentNode.children[parentIndex - 1]);
                    this.repairAfterDelete(nextNode.parent);
                }
            }
        }
    }

    validateTree(tree, parent) {
        if (!tree) {
            tree = this.treeRoot;
            if (!tree) return;
            // console.log("Validating tree", tree);
        } else if (tree.parent !== parent) console.error("Parent mismatch:", tree, parent);
        if (!tree.graphicID) console.error("Tree missing ID:", tree);
        if (tree.keys.length !== tree.numKeys) console.error("N:o keys mismatch", tree);
        if (tree.isLeaf) {
            if (tree.children.length > 0) console.error("Leaf node has children", tree);
        } else {
            if (tree.children.length !== tree.numKeys + 1) console.error("N:o children mismatch", tree);
            for (const child of tree.children) {
                if (child) {
                    this.validateTree(child, tree);
                } else {
                    console.error("Null child", tree);
                }
            }
        }
    }

    getParentIndex(tree) {
        const parent = tree.parent;
        if (!parent) throw new Error("The root node doesn't have a parent index");
        let i = 0;
        while (i <= parent.numKeys && parent.children[i] !== tree)
            i++;
        if (i > parent.numKeys) throw new Error("Couldn't find parent index");
        return i;
    }

    getLabelX(tree, index) {
        return tree.x - this.WIDTH_PER_ELEM * tree.numKeys / 2 + this.WIDTH_PER_ELEM / 2 + index * this.WIDTH_PER_ELEM;
    }

    resizeTree() {
        this.resizeWidths(this.treeRoot);
        this.setNewPositions(this.treeRoot, this.startingX, this.STARTING_Y);
        this.animateNewPositions(this.treeRoot);
    }

    setNewPositions(tree, xPosition, yPosition) {
        if (tree != null) {
            tree.y = yPosition;
            tree.x = xPosition;
            if (!tree.isLeaf) {
                const leftEdge = xPosition - tree.width / 2;
                let priorWidth = 0;
                for (let i = 0; i < tree.numKeys + 1; i++) {
                    this.setNewPositions(
                        tree.children[i],
                        leftEdge + priorWidth + tree.widths[i] / 2,
                        yPosition + this.HEIGHT_DELTA,
                    );
                    priorWidth += tree.widths[i];
                }
            }
        }
    }

    animateNewPositions(tree) {
        if (tree == null) {
            return;
        }
        for (let i = 0; i < tree.numKeys + 1; i++) {
            this.animateNewPositions(tree.children[i]);
        }
        this.cmd("Move", tree.graphicID, tree.x, tree.y);
    }

    resizeWidths(tree) {
        if (tree == null) {
            return 0;
        }
        if (tree.isLeaf) {
            for (let i = 0; i < tree.numKeys + 1; i++) {
                tree.widths[i] = 0;
            }
            tree.width = tree.numKeys * this.WIDTH_PER_ELEM + this.NODE_SPACING;
            return tree.width;
        } else {
            let treeWidth = 0;
            for (let i = 0; i < tree.numKeys + 1; i++) {
                tree.widths[i] = this.resizeWidths(tree.children[i]);
                treeWidth = treeWidth + tree.widths[i];
            }
            treeWidth = Math.max(treeWidth, tree.numKeys * this.WIDTH_PER_ELEM + this.NODE_SPACING);
            tree.width = treeWidth;
            return treeWidth;
        }
    }
}
