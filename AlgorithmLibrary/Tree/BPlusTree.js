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
///////////////////////////////////////////////////////////////////////////////


Algorithm.Tree.BPlusTree = class BPlusTree extends Algorithm.Tree {
    MAX_DEGREES = [3, 4, 5, 6, 7];
    MAX_DEGREE_LABELS = ["2/3-tree", "2/3/4-tree", "Max. degree 5", "Max. degree 6", "Max. degree 7"];
    INITIAL_MAX_DEGREE = 3;

    HIGHLIGHT_COLOR = "red";

    WIDTH_PER_ELEM = this.NODE_SIZE;
    NODE_HEIGHT = this.NODE_SIZE * 3/4;
    NEW_NODE_Y = this.NEW_NODE_X;

    INSERT_MANY_VALUES = false;


    BPlusTreeNode = class BPlusTreeNode {
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
            // Could use children for next pointer, but I got lazy ...
            this.next = null;
        }

        toString() {
            return `[${this.keys.join(" ")}]`;
        }

        getChildren() {
            return this.children;
        }
    };


    constructor(am) {
        super();
        if (am) this.init(am);
    }

    addControls() {
        super.addControls();
        if (this.MAX_DEGREES?.length > 1) {
            this.addBreakToAlgorithmBar();
            this.addLabelToAlgorithmBar("Max degree:");
            this.maxDegreeSelect = this.addSelectToAlgorithmBar(this.MAX_DEGREES, this.MAX_DEGREE_LABELS);
            this.maxDegreeSelect.value = this.INITIAL_MAX_DEGREE;
            this.maxDegreeSelect.onchange = this.resetAll.bind(this);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Information about the type of BPlusTree

    getMaxDegree() {
        return parseInt(this.maxDegreeSelect.value) || this.INITIAL_MAX_DEGREE;
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
    // Print the values in the tree

    doPrint(node) {
        while (!node.isLeaf) {
            this.cmd("Move", this.highlightID, this.getLabelX(node, 0), node.y);
            this.cmd("Step");
            node = node.children[0];
        }

        while (node) {
            for (let i = 0; i < node.numKeys; i++) {
                this.cmd("Move", this.highlightID, this.getLabelX(node, i), node.y);
                this.cmd("Step");
                const nextLabelID = this.nextIndex++;
                this.cmd("CreateLabel", nextLabelID, node.keys[i], this.getLabelX(node, i), node.y);
                this.cmd("SetForegroundColor", nextLabelID, this.PRINT_COLOR);
                this.printPosX += this.PRINT_HORIZONTAL_GAP;
                if (this.printPosX > this.getCanvasWidth() - this.PRINT_HORIZONTAL_GAP) {
                    this.printPosX = this.FIRST_PRINT_POS_X;
                    this.printPosY += this.PRINT_VERTICAL_GAP;
                }
                this.cmd("Move", nextLabelID, this.printPosX, this.printPosY);
                this.cmd("Step");
            }
            node = node.next;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Find a value in the tree

    doFind(value, tree) {
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
            } else if (tree.isLeaf) {
                this.cmd("SetTextColor", tree.graphicID, this.HIGHLIGHT_COLOR, i);
                this.cmd("SetText", this.messageID, `Element ${value} found`);
                this.cmd("Step");
                this.cmd("SetTextColor", tree.graphicID, this.FOREGROUND_COLOR, i);
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("Step");
                return true;
            } else {
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i + 1].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i + 1].graphicID, 0);
                return this.doFind(tree.children[i + 1], value);
            }
        } else {
            return false;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Insert a value at a node

    insertAction(insertedValue) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Inserting ${insertedValue}`);
        this.cmd("Step");

        if (this.treeRoot == null) {
            this.treeRoot = new this.BPlusTreeNode(this.nextIndex++, this.getTreeRootX(), this.getTreeRootY());
            this.cmd(
                "CreateBTreeNode",
                this.treeRoot.graphicID,
                this.WIDTH_PER_ELEM,
                this.NODE_HEIGHT,
                1,
                this.getTreeRootX(), 
                this.getTreeRootY(),
                this.BACKGROUND_COLOR,
                this.FOREGROUND_COLOR,
            );
            this.treeRoot.keys[0] = insertedValue;
            this.treeRoot.numKeys = 1;
            this.cmd("SetText", this.treeRoot.graphicID, insertedValue, 0);
        } else {
            this.doInsert(insertedValue, this.treeRoot);
            if (!this.treeRoot.isLeaf) {
                this.resizeTree();
            }
        }
        this.cmd("SetText", this.messageID, "");
        this.validateTree();
        return this.commands;
    }

    doInsert(insertValue, tree) {
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
            if (tree.next != null) {
                this.cmd("Disconnect", tree.graphicID, tree.next.graphicID);
                this.cmd(
                    "Connect",
                    tree.graphicID,
                    tree.next.graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    1, // Directed
                    "", // Label
                    tree.numKeys,
                );
            }
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
            this.doInsert(insertValue, tree.children[findIndex]);
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

    ///////////////////////////////////////////////////////////////////////////////
    // Split a node

    split(tree) {
        this.cmd("SetText", this.messageID, `Node ${tree} contains too many keys: splitting it`);
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetHighlight", tree.graphicID, 0);
        const rightNode = new this.BPlusTreeNode(this.nextIndex++, tree.x + 100, tree.y);
        const risingNode = tree.keys[this.getSplitIndex()];

        let currentParent, parentIndex, moveLabelID;
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
                    i + 1, // Connection point
                );
                currentParent.keys[i] = currentParent.keys[i - 1];
                this.cmd("SetText", currentParent.graphicID, currentParent.keys[i], i);
            }
            currentParent.numKeys++;
            currentParent.keys[parentIndex] = risingNode;
            this.cmd("SetText", currentParent.graphicID, "", parentIndex);
            moveLabelID = this.nextIndex++;
            this.cmd("CreateLabel", moveLabelID, risingNode, this.getLabelX(tree, this.getSplitIndex()), tree.y);
            this.cmd("Move", moveLabelID, this.getLabelX(currentParent, parentIndex), currentParent.y);
            currentParent.children[parentIndex + 1] = rightNode;
            rightNode.parent = currentParent;
        }

        let rightSplit = this.getSplitIndex();
        if (tree.isLeaf) {
            rightNode.next = tree.next;
            tree.next = rightNode;
        } else {
            rightSplit++;
        }

        rightNode.numKeys = tree.numKeys - rightSplit;
        this.cmd(
            "CreateBTreeNode",
            rightNode.graphicID,
            this.WIDTH_PER_ELEM,
            this.NODE_HEIGHT,
            tree.numKeys - rightSplit,
            tree.x,
            tree.y,
            this.BACKGROUND_COLOR,
            this.FOREGROUND_COLOR,
        );
        if (tree.isLeaf) {
            if (rightNode.next != null) {
                this.cmd("Disconnect", tree.graphicID, rightNode.next.graphicID);
                this.cmd(
                    "Connect",
                    rightNode.graphicID,
                    rightNode.next.graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    1, // Directed
                    "", // Label
                    rightNode.numKeys,
                );
            }
            this.cmd(
                "Connect",
                tree.graphicID,
                rightNode.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                "", // Label
                this.getSplitIndex(),
            );
        }
        for (let i = rightSplit; i <= tree.numKeys; i++) {
            const j = i - rightSplit;
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
                if (tree.children[i] != null) {
                    tree.children[i].parent = rightNode;
                }
                tree.children[i] = null;
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
            this.cmd("Delete", moveLabelID);
            this.nextIndex--;
            this.cmd("SetText", currentParent.graphicID, risingNode, parentIndex);
            return tree.parent;
        } else { // if (tree.parent == null)
            this.treeRoot = new this.BPlusTreeNode(this.nextIndex++, this.NEW_NODE_X, this.NEW_NODE_Y);
            this.cmd(
                "CreateBTreeNode",
                this.treeRoot.graphicID,
                this.WIDTH_PER_ELEM,
                this.NODE_HEIGHT,
                1,
                this.NEW_NODE_X,
                this.NEW_NODE_Y,
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
                this.treeRoot.graphicID, rightNode.graphicID,
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

    ///////////////////////////////////////////////////////////////////////////////
    // Delete a node

    deleteAction(deletedValue) {
        if (!this.isTreeNode(this.treeRoot)) return [];
        this.commands = [];
        this.cmd("SetText", this.messageID, `Deleting ${deletedValue}`);
        this.cmd("Step");
        this.cmd("SetText", this.messageID, "");
        this.doDelete(this.treeRoot, deletedValue);
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
            } else if (!tree.isLeaf && this.compare(tree.keys[i], val) === 0) {
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i + 1].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i + 1].graphicID, 0);
                this.doDelete(tree.children[i + 1], val);
            } else if (!tree.isLeaf) {
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetEdgeHighlight", tree.graphicID, tree.children[i].graphicID, 0);
                this.doDelete(tree.children[i], val);
            } else if (tree.isLeaf && this.compare(tree.keys[i], val) === 0) {
                this.cmd("SetTextColor", tree.graphicID, this.HIGHLIGHT_COLOR, i);
                this.cmd("Step");
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

                if (tree.next != null) {
                    this.cmd("Disconnect", tree.graphicID, tree.next.graphicID);
                    this.cmd(
                        "Connect",
                        tree.graphicID,
                        tree.next.graphicID,
                        this.FOREGROUND_COLOR,
                        0, // Curve
                        1, // Directed
                        "", // Label
                        tree.numKeys,
                    );
                }

                // Bit of a hack -- if we remove the smallest element in a leaf, then find the *next* smallest element
                // (somewhat tricky if the leaf is now empty!), go up our parent stack, and fix index keys
                if (i === 0 && tree.parent != null) {
                    console.log(tree.numKeys, tree.keys.join(" "));
                    let parentNode = tree.parent;
                    let parentIndex = this.getParentIndex(tree);
                    let nextSmallest = "";
                    if (tree.numKeys > 0) {
                        nextSmallest = tree.keys[0];
                    } else if (parentIndex !== parentNode.numKeys) {
                        nextSmallest = parentNode.children[parentIndex + 1].keys[0];
                    }
                    while (parentNode != null) {
                        if (parentIndex > 0 && parentNode.keys[parentIndex - 1] === val) {
                            parentNode.keys[parentIndex - 1] = nextSmallest;
                            this.cmd("SetText", parentNode.graphicID, parentNode.keys[parentIndex - 1], parentIndex - 1);
                        }
                        const grandParent = parentNode.parent;
                        parentIndex = grandParent ? this.getParentIndex(parentNode) : 0;
                        parentNode = grandParent;
                    }
                }
                this.repairAfterDelete(tree);
            } else {
                this.cmd("SetHighlight", tree.graphicID, 0);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Merge nodes

    mergeRight(tree) {
        const parentNode = tree.parent;
        const parentIndex = this.getParentIndex(tree);
        const rightSib = parentNode.children[parentIndex + 1];
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("SetHighlight", parentNode.graphicID, 1);
        this.cmd("SetHighlight", rightSib.graphicID, 1);
        this.cmd("SetText", this.messageID, `Merging nodes: \n${tree} + [${parentNode.keys[parentIndex]}] + ${rightSib}`);
        this.cmd("Step");

        let moveLabelID;
        if (tree.isLeaf) {
            this.cmd("SetNumElements", tree.graphicID, tree.numKeys + rightSib.numKeys);
        } else {
            this.cmd("SetNumElements", tree.graphicID, tree.numKeys + rightSib.numKeys + 1);
            this.cmd("SetText", tree.graphicID, "", tree.numKeys);
            moveLabelID = this.nextIndex++;
            this.cmd("CreateLabel", moveLabelID, parentNode.keys[parentIndex], this.getLabelX(parentNode, parentIndex), parentNode.y);
            tree.keys[tree.numKeys] = parentNode.keys[parentIndex];
        }
        tree.x = (tree.x + rightSib.x) / 2;
        this.cmd("SetPosition", tree.graphicID, tree.x, tree.y);

        const fromParentIndex = tree.numKeys;
        for (let i = 0; i < rightSib.numKeys; i++) {
            let j = tree.numKeys + 1 + i;
            if (tree.isLeaf) j--;
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
                this.cmd("Connect", tree.graphicID,
                    tree.children[j].graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    0, // Directed
                    "", // Label
                    j, // Connection Point
                );
            }
            tree.numKeys = tree.numKeys + rightSib.numKeys + 1;
        } else {
            tree.numKeys = tree.numKeys + rightSib.numKeys;
            tree.next = rightSib.next;
            if (rightSib.next != null) {
                this.cmd(
                    "Connect",
                    tree.graphicID,
                    tree.next.graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    1, // Directed
                    "", // Label
                    tree.numKeys,
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
        this.cmd("SetHighlight", rightSib.graphicID, 0);
        // this.cmd("Step");
        this.cmd("Delete", rightSib.graphicID);
        if (!tree.isLeaf) {
            this.cmd("Move", moveLabelID, this.getLabelX(tree, fromParentIndex), tree.y);
            this.cmd("Step");
            this.cmd("Delete", moveLabelID);
            this.nextIndex--;
            this.cmd("SetText", tree.graphicID, tree.keys[fromParentIndex], fromParentIndex);
        }
        // this.resizeTree();
        this.cmd("SetText", this.messageID, "");
        return tree;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Steal from sibling

    stealFromRight(tree, parentIndex) {
        // Steal from right sibling
        const parentNode = tree.parent;
        const rightSib = parentNode.children[parentIndex + 1];
        this.cmd("SetNumElements", tree.graphicID, tree.numKeys + 1);
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("SetHighlight", parentNode.graphicID, 1);
        this.cmd("SetHighlight", rightSib.graphicID, 1);
        this.cmd("SetText", this.messageID, `Stealing from right sibling: \n${tree} ← [${parentNode.keys[parentIndex]}] ← ${rightSib}`);
        this.cmd("Step");

        tree.numKeys++;
        this.cmd("SetNumElements", tree.graphicID, tree.numKeys);

        if (tree.isLeaf) {
            this.cmd("Disconnect", tree.graphicID, tree.next.graphicID);
            this.cmd(
                "Connect",
                tree.graphicID,
                tree.next.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                "", // Label
                tree.numKeys,
            );
        }

        this.cmd("SetText", tree.graphicID, "", tree.numKeys - 1);
        this.cmd("SetText", parentNode.graphicID, "", parentIndex);
        this.cmd("SetText", rightSib.graphicID, "", 0);

        const moveLabel1ID = this.nextIndex++;
        const moveLabel2ID = this.nextIndex++;
        if (tree.isLeaf) {
            this.cmd("CreateLabel", moveLabel1ID, rightSib.keys[1], this.getLabelX(rightSib, 1), rightSib.y);
            this.cmd("CreateLabel", moveLabel2ID, rightSib.keys[0], this.getLabelX(rightSib, 0), rightSib.y);
            tree.keys[tree.numKeys - 1] = rightSib.keys[0];
            parentNode.keys[parentIndex] = rightSib.keys[1];
        } else {
            this.cmd("CreateLabel", moveLabel1ID, rightSib.keys[0], this.getLabelX(rightSib, 0), rightSib.y);
            this.cmd("CreateLabel", moveLabel2ID, parentNode.keys[parentIndex], this.getLabelX(parentNode, parentIndex), parentNode.y);
            tree.keys[tree.numKeys - 1] = parentNode.keys[parentIndex];
            parentNode.keys[parentIndex] = rightSib.keys[0];
        }

        this.cmd("Move", moveLabel1ID, this.getLabelX(parentNode, parentIndex), parentNode.y);
        this.cmd("Move", moveLabel2ID, this.getLabelX(tree, tree.numKeys - 1), tree.y);
        this.cmd("Step");
        this.cmd("Delete", moveLabel1ID);
        this.cmd("Delete", moveLabel2ID);
        this.nextIndex -= 2;

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
                tree.numKeys,
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

        if (tree.isLeaf && rightSib.next != null) {
            this.cmd("Disconnect", rightSib.graphicID, rightSib.next.graphicID);
            this.cmd(
                "Connect",
                rightSib.graphicID,
                rightSib.next.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                "", // Label
                rightSib.numKeys,
            );
        }
        return tree;
    }

    stealFromLeft(tree, parentIndex) {
        const parentNode = tree.parent;
        // Steal from left sibling
        tree.numKeys++;
        this.cmd("SetNumElements", tree.graphicID, tree.numKeys);

        if (tree.isLeaf && tree.next != null) {
            this.cmd("Disconnect", tree.graphicID, tree.next.graphicID);
            this.cmd(
                "Connect",
                tree.graphicID,
                tree.next.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                "", // Label
                tree.numKeys,
            );
        }

        for (let i = tree.numKeys - 1; i > 0; i--) {
            tree.keys[i] = tree.keys[i - 1];
            this.cmd("SetText", tree.graphicID, tree.keys[i], i);
        }
        const leftSib = parentNode.children[parentIndex - 1];
        this.cmd("SetText", this.messageID, `Stealing from left sibling: \n${leftSib} → [${parentNode.keys[parentIndex]}] → ${tree}`);

        this.cmd("SetText", tree.graphicID, "", 0);
        this.cmd("SetText", parentNode.graphicID, "", parentIndex - 1);
        this.cmd("SetText", leftSib.graphicID, "", leftSib.numKeys - 1);

        const moveLabel1ID = this.nextIndex++;
        const moveLabel2ID = this.nextIndex++;
        if (tree.isLeaf) {
            this.cmd("CreateLabel", moveLabel1ID, leftSib.keys[leftSib.numKeys - 1], this.getLabelX(leftSib, leftSib.numKeys - 1), leftSib.y);
            this.cmd("CreateLabel", moveLabel2ID, leftSib.keys[leftSib.numKeys - 1], this.getLabelX(leftSib, leftSib.numKeys - 1), leftSib.y);
            tree.keys[0] = leftSib.keys[leftSib.numKeys - 1];
            parentNode.keys[parentIndex - 1] = leftSib.keys[leftSib.numKeys - 1];
        } else {
            this.cmd("CreateLabel", moveLabel1ID, leftSib.keys[leftSib.numKeys - 1], this.getLabelX(leftSib, leftSib.numKeys - 1), leftSib.y);
            this.cmd("CreateLabel", moveLabel2ID, parentNode.keys[parentIndex - 1], this.getLabelX(parentNode, parentIndex - 1), parentNode.y);
            tree.keys[0] = parentNode.keys[parentIndex - 1];
            parentNode.keys[parentIndex - 1] = leftSib.keys[leftSib.numKeys - 1];
        }
        this.cmd("Move", moveLabel1ID, this.getLabelX(parentNode, parentIndex - 1), parentNode.y);
        this.cmd("Move", moveLabel2ID, this.getLabelX(tree, 0), tree.y);
        this.cmd("Step");
        this.cmd("Delete", moveLabel1ID);
        this.cmd("Delete", moveLabel2ID);
        this.nextIndex -= 2;

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

        this.cmd("SetText", tree.graphicID, tree.keys[0], 0);
        this.cmd("SetText", parentNode.graphicID, parentNode.keys[parentIndex - 1], parentIndex - 1);
        this.cmd("SetText", leftSib.graphicID, "", leftSib.numKeys - 1);
        leftSib.children.pop();
        leftSib.keys.pop();
        leftSib.numKeys--;
        this.cmd("SetNumElements", leftSib.graphicID, leftSib.numKeys);
        this.resizeTree();
        this.cmd("SetText", this.messageID, "");

        if (tree.isLeaf) {
            this.cmd("Disconnect", leftSib.graphicID, tree.graphicID);
            this.cmd(
                "Connect",
                leftSib.graphicID,
                tree.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                "", // Label
                leftSib.numKeys,
            );
        }
        return tree;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Repair after deletion

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

    ///////////////////////////////////////////////////////////////////////////////
    // Validate the tree

    validateTree(tree, parent) {
        if (!tree) {
            tree = this.treeRoot;
            if (!tree) return;
            // console.log("Validating tree", tree);
        } else if (tree.parent !== parent) console.error("Parent mismatch:", tree, parent);
        if (!tree.graphicID) console.error("Tree missing ID:", tree);
        if (tree.keys.length !== tree.numKeys) console.error("N:o keys mismatch", tree);
        if (tree.isLeaf) {
            const nextLeaf = this.findNextLeaf(tree);
            if (tree.next !== nextLeaf) console.error("Wrong leaf next pointer", tree, nextLeaf);
            if (tree.children.length > 0) console.error("Leaf node has children", tree);
        } else {
            if (tree.next) console.error("Non-leaf node has next pointer");
            for (let i = 0; i < tree.numKeys; i++) {
                let child = tree.children[i + 1];
                while (!child.isLeaf) child = child.children[0];
                if (tree.keys[i] !== child.keys[0]) console.error("Non-leaf element missing not in leaf", tree, child);
            }
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

    ///////////////////////////////////////////////////////////////////////////////
    // Manipulate tree nodes

    removeTreeNode(node) {
        this.cmd("Delete", node.graphicID);
    }

    isTreeNode(node) {
        return node instanceof this.BPlusTreeNode;
    }

    findNextLeaf(tree) {
        if (!tree.parent) return null;
        const isLastChild = n => n && n.parent && n === n.parent.children[n.parent.numKeys];
        while (isLastChild(tree)) tree = tree.parent;
        if (!tree.parent) return null;
        const i = this.getParentIndex(tree);
        if (i >= tree.parent.numKeys) return null;
        tree = tree.parent.children[i + 1];
        if (!tree) return null;
        while (!tree.isLeaf) tree = tree.children[0];
        return tree;
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

    ///////////////////////////////////////////////////////////////////////////////
    // Resize the tree

    resizeTree(animate = true) {
        this.resizeWidths(this.treeRoot);
        this.setNewPositions(this.treeRoot, this.getTreeRootX(), this.getTreeRootY());
        const cmd = animate ? "Move" : "SetPosition";
        this.animateNewPositions(this.treeRoot, cmd);
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
                        yPosition + this.NODE_HEIGHT + this.getSpacingY(),
                    );
                    priorWidth += tree.widths[i];
                }
            }
        }
    }

    resizeWidths(tree) {
        if (tree == null) {
            return 0;
        }
        if (tree.isLeaf) {
            for (let i = 0; i < tree.numKeys + 1; i++) {
                tree.widths[i] = 0;
            }
            tree.width = tree.numKeys * this.WIDTH_PER_ELEM + this.getSpacingX();
            return tree.width;
        } else {
            let treeWidth = 0;
            for (let i = 0; i < tree.numKeys + 1; i++) {
                tree.widths[i] = this.resizeWidths(tree.children[i]);
                treeWidth = treeWidth + tree.widths[i];
            }
            treeWidth = Math.max(treeWidth, tree.numKeys * this.WIDTH_PER_ELEM + this.getSpacingX());
            tree.width = treeWidth;
            return treeWidth;
        }
    }
};
