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

    doFind(value, node) {
        if (node != null) {
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("Step");
            let i = 0;
            while (i < node.numKeys && this.compare(node.keys[i], value) < 0)
                i++;
            if (i === node.numKeys || this.compare(node.keys[i], value) > 0) {
                if (!node.isLeaf) {
                    let cmpstr = value;
                    if (i > 0) cmpstr = `${node.keys[i - 1]} < ${cmpstr}`;
                    if (i < node.numKeys) cmpstr = `${cmpstr} < ${node.keys[i]}`;
                    this.cmd("SetText", this.messageID, `Searching for ${value}: ${cmpstr} (recurse into child)`);
                    this.cmd("SetEdgeHighlight", node.graphicID, node.children[i].graphicID, 1);
                    this.cmd("Step");
                    this.cmd("SetHighlight", node.graphicID, 0);
                    this.cmd("SetEdgeHighlight", node.graphicID, node.children[i].graphicID, 0);
                    return this.doFind(node.children[i], value);
                } else {
                    this.cmd("SetHighlight", node.graphicID, 0);
                    return false;
                }
            } else if (node.isLeaf) {
                this.cmd("SetTextColor", node.graphicID, this.HIGHLIGHT_COLOR, i);
                this.cmd("SetText", this.messageID, `Element ${value} found`);
                this.cmd("Step");
                this.cmd("SetTextColor", node.graphicID, this.FOREGROUND_COLOR, i);
                this.cmd("SetHighlight", node.graphicID, 0);
                this.cmd("Step");
                return true;
            } else {
                this.cmd("SetEdgeHighlight", node.graphicID, node.children[i + 1].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", node.graphicID, 0);
                this.cmd("SetEdgeHighlight", node.graphicID, node.children[i + 1].graphicID, 0);
                return this.doFind(node.children[i + 1], value);
            }
        } else {
            return false;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Insert a value at a node

    insertAction(value) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Inserting ${value}`);
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
            this.treeRoot.keys[0] = value;
            this.treeRoot.numKeys = 1;
            this.cmd("SetText", this.treeRoot.graphicID, value, 0);
        } else {
            this.doInsert(value, this.treeRoot);
            if (!this.treeRoot.isLeaf) {
                this.resizeTree();
            }
        }
        this.cmd("SetText", this.messageID, "");
        this.validateTree();
        return this.commands;
    }

    doInsert(value, node) {
        this.cmd("SetHighlight", node.graphicID, 1);
        this.cmd("Step");
        if (node.isLeaf) {
            this.cmd("SetText", this.messageID, `Inserting ${value} into the leaf node ${node}`);
            node.numKeys++;
            this.cmd("SetNumElements", node.graphicID, node.numKeys);
            let insertIndex = node.numKeys - 1;
            while (insertIndex > 0 && this.compare(node.keys[insertIndex - 1], value) > 0) {
                node.keys[insertIndex] = node.keys[insertIndex - 1];
                this.cmd("SetText", node.graphicID, node.keys[insertIndex], insertIndex);
                insertIndex--;
            }
            node.keys[insertIndex] = value;
            this.cmd("SetText", node.graphicID, node.keys[insertIndex], insertIndex);
            this.cmd("SetHighlight", node.graphicID, 0);
            if (node.next != null) {
                this.cmd("Disconnect", node.graphicID, node.next.graphicID);
                this.cmd(
                    "Connect",
                    node.graphicID,
                    node.next.graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    1, // Directed
                    "", // Label
                    node.numKeys,
                );
            }
            this.resizeTree();
            this.insertRepair(node);
        } else {
            let findIndex = 0;
            while (findIndex < node.numKeys && this.compare(node.keys[findIndex], value) < 0)
                findIndex++;
            this.cmd("SetEdgeHighlight", node.graphicID, node.children[findIndex].graphicID, 1);
            this.cmd("Step");
            this.cmd("SetEdgeHighlight", node.graphicID, node.children[findIndex].graphicID, 0);
            this.cmd("SetHighlight", node.graphicID, 0);
            this.doInsert(value, node.children[findIndex]);
        }
    }

    insertRepair(node) {
        if (node.numKeys <= this.getMaxKeys()) {
            return;
        } else if (node.parent == null) {
            this.treeRoot = this.split(node);
            return;
        } else {
            const newNode = this.split(node);
            this.insertRepair(newNode);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Split a node

    split(node) {
        this.cmd("SetText", this.messageID, `Node ${node} contains too many keys: splitting it`);
        this.cmd("SetHighlight", node.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetHighlight", node.graphicID, 0);
        const rightNode = new this.BPlusTreeNode(this.nextIndex++, node.x + 100, node.y);
        const risingNode = node.keys[this.getSplitIndex()];

        let currentParent, parentIndex, moveLabelID;
        if (node.parent != null) {
            currentParent = node.parent;
            parentIndex = this.getParentIndex(node);
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
            this.cmd("CreateLabel", moveLabelID, risingNode, this.getLabelX(node, this.getSplitIndex()), node.y);
            this.cmd("Move", moveLabelID, this.getLabelX(currentParent, parentIndex), currentParent.y);
            currentParent.children[parentIndex + 1] = rightNode;
            rightNode.parent = currentParent;
        }

        let rightSplit = this.getSplitIndex();
        if (node.isLeaf) {
            rightNode.next = node.next;
            node.next = rightNode;
        } else {
            rightSplit++;
        }

        rightNode.numKeys = node.numKeys - rightSplit;
        this.cmd(
            "CreateBTreeNode",
            rightNode.graphicID,
            this.WIDTH_PER_ELEM,
            this.NODE_HEIGHT,
            node.numKeys - rightSplit,
            node.x,
            node.y,
            this.BACKGROUND_COLOR,
            this.FOREGROUND_COLOR,
        );
        if (node.isLeaf) {
            if (rightNode.next != null) {
                this.cmd("Disconnect", node.graphicID, rightNode.next.graphicID);
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
                node.graphicID,
                rightNode.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                "", // Label
                this.getSplitIndex(),
            );
        }
        for (let i = rightSplit; i <= node.numKeys; i++) {
            const j = i - rightSplit;
            if (i < node.numKeys) {
                rightNode.keys[j] = node.keys[i];
                this.cmd("SetText", rightNode.graphicID, rightNode.keys[j], j);
            }
            if (node.children[i] != null) {
                rightNode.children[j] = node.children[i];
                rightNode.isLeaf = false;
                this.cmd("Disconnect", node.graphicID, node.children[i].graphicID);
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
                if (node.children[i] != null) {
                    node.children[i].parent = rightNode;
                }
                node.children[i] = null;
            }
        }
        for (let i = node.numKeys - 1; i >= this.getSplitIndex(); i--) {
            this.cmd("SetText", node.graphicID, "", i); // TO MAKE UNDO WORK
            node.children.pop();
            node.keys.pop();
            node.numKeys--;
        }
        this.cmd("SetNumElements", node.graphicID, this.getSplitIndex());
        const leftNode = node;

        if (node.parent != null) {
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
            return node.parent;
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

    deleteAction(value) {
        if (!this.isTreeNode(this.treeRoot)) return [];
        this.commands = [];
        this.cmd("SetText", this.messageID, `Deleting ${value}`);
        this.cmd("Step");
        this.cmd("SetText", this.messageID, "");
        this.doDelete(this.treeRoot, value);
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

    doDelete(node, value) {
        if (node != null) {
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("Step");
            let i = 0;
            while (i < node.numKeys && this.compare(node.keys[i], value) < 0)
                i++;
            if (i === node.numKeys) {
                if (!node.isLeaf) {
                    this.cmd("SetEdgeHighlight", node.graphicID, node.children[node.numKeys].graphicID, 1);
                    this.cmd("Step");
                    this.cmd("SetHighlight", node.graphicID, 0);
                    this.cmd("SetEdgeHighlight", node.graphicID, node.children[node.numKeys].graphicID, 0);
                    this.doDelete(node.children[node.numKeys], value);
                } else {
                    this.cmd("SetHighlight", node.graphicID, 0);
                }
            } else if (!node.isLeaf && this.compare(node.keys[i], value) === 0) {
                this.cmd("SetEdgeHighlight", node.graphicID, node.children[i + 1].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", node.graphicID, 0);
                this.cmd("SetEdgeHighlight", node.graphicID, node.children[i + 1].graphicID, 0);
                this.doDelete(node.children[i + 1], value);
            } else if (!node.isLeaf) {
                this.cmd("SetEdgeHighlight", node.graphicID, node.children[i].graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", node.graphicID, 0);
                this.cmd("SetEdgeHighlight", node.graphicID, node.children[i].graphicID, 0);
                this.doDelete(node.children[i], value);
            } else if (node.isLeaf && this.compare(node.keys[i], value) === 0) {
                this.cmd("SetTextColor", node.graphicID, this.HIGHLIGHT_COLOR, i);
                this.cmd("Step");
                this.cmd("SetTextColor", node.graphicID, this.FOREGROUND_COLOR, i);
                for (let j = i; j < node.numKeys - 1; j++) {
                    node.keys[j] = node.keys[j + 1];
                    this.cmd("SetText", node.graphicID, node.keys[j], j);
                }
                node.keys.pop();
                node.numKeys--;
                this.cmd("SetText", node.graphicID, "", node.numKeys);
                this.cmd("SetNumElements", node.graphicID, node.numKeys);
                this.cmd("SetHighlight", node.graphicID, 0);

                if (node.next != null) {
                    this.cmd("Disconnect", node.graphicID, node.next.graphicID);
                    this.cmd(
                        "Connect",
                        node.graphicID,
                        node.next.graphicID,
                        this.FOREGROUND_COLOR,
                        0, // Curve
                        1, // Directed
                        "", // Label
                        node.numKeys,
                    );
                }

                // Bit of a hack -- if we remove the smallest element in a leaf, then find the *next* smallest element
                // (somewhat tricky if the leaf is now empty!), go up our parent stack, and fix index keys
                if (i === 0 && node.parent != null) {
                    console.log(node.numKeys, node.keys.join(" "));
                    let parentNode = node.parent;
                    let parentIndex = this.getParentIndex(node);
                    let nextSmallest = "";
                    if (node.numKeys > 0) {
                        nextSmallest = node.keys[0];
                    } else if (parentIndex !== parentNode.numKeys) {
                        nextSmallest = parentNode.children[parentIndex + 1].keys[0];
                    }
                    while (parentNode != null) {
                        if (parentIndex > 0 && parentNode.keys[parentIndex - 1] === value) {
                            parentNode.keys[parentIndex - 1] = nextSmallest;
                            this.cmd("SetText", parentNode.graphicID, parentNode.keys[parentIndex - 1], parentIndex - 1);
                        }
                        const grandParent = parentNode.parent;
                        parentIndex = grandParent ? this.getParentIndex(parentNode) : 0;
                        parentNode = grandParent;
                    }
                }
                this.repairAfterDelete(node);
            } else {
                this.cmd("SetHighlight", node.graphicID, 0);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Merge nodes

    mergeRight(node) {
        const parentNode = node.parent;
        const parentIndex = this.getParentIndex(node);
        const rightSib = parentNode.children[parentIndex + 1];
        this.cmd("SetHighlight", node.graphicID, 1);
        this.cmd("SetHighlight", parentNode.graphicID, 1);
        this.cmd("SetHighlight", rightSib.graphicID, 1);
        this.cmd("SetText", this.messageID, `Merging nodes: \n${node} + [${parentNode.keys[parentIndex]}] + ${rightSib}`);
        this.cmd("Step");

        let moveLabelID;
        if (node.isLeaf) {
            this.cmd("SetNumElements", node.graphicID, node.numKeys + rightSib.numKeys);
        } else {
            this.cmd("SetNumElements", node.graphicID, node.numKeys + rightSib.numKeys + 1);
            this.cmd("SetText", node.graphicID, "", node.numKeys);
            moveLabelID = this.nextIndex++;
            this.cmd("CreateLabel", moveLabelID, parentNode.keys[parentIndex], this.getLabelX(parentNode, parentIndex), parentNode.y);
            node.keys[node.numKeys] = parentNode.keys[parentIndex];
        }
        node.x = (node.x + rightSib.x) / 2;
        this.cmd("SetPosition", node.graphicID, node.x, node.y);

        const fromParentIndex = node.numKeys;
        for (let i = 0; i < rightSib.numKeys; i++) {
            let j = node.numKeys + 1 + i;
            if (node.isLeaf) j--;
            node.keys[j] = rightSib.keys[i];
            this.cmd("SetText", node.graphicID, node.keys[j], j);
            this.cmd("SetText", rightSib.graphicID, "", i);
        }
        if (!node.isLeaf) {
            for (let i = 0; i <= rightSib.numKeys; i++) {
                const j = node.numKeys + 1 + i;
                this.cmd("Disconnect", rightSib.graphicID, rightSib.children[i].graphicID);
                node.children[j] = rightSib.children[i];
                node.children[j].parent = node;
                this.cmd("Connect", node.graphicID,
                    node.children[j].graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    0, // Directed
                    "", // Label
                    j, // Connection Point
                );
            }
            node.numKeys = node.numKeys + rightSib.numKeys + 1;
        } else {
            node.numKeys = node.numKeys + rightSib.numKeys;
            node.next = rightSib.next;
            if (rightSib.next != null) {
                this.cmd(
                    "Connect",
                    node.graphicID,
                    node.next.graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    1, // Directed
                    "", // Label
                    node.numKeys,
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
        this.cmd("SetHighlight", node.graphicID, 0);
        this.cmd("SetHighlight", parentNode.graphicID, 0);
        this.cmd("SetHighlight", rightSib.graphicID, 0);
        // this.cmd("Step");
        this.cmd("Delete", rightSib.graphicID);
        if (!node.isLeaf) {
            this.cmd("Move", moveLabelID, this.getLabelX(node, fromParentIndex), node.y);
            this.cmd("Step");
            this.cmd("Delete", moveLabelID);
            this.nextIndex--;
            this.cmd("SetText", node.graphicID, node.keys[fromParentIndex], fromParentIndex);
        }
        // this.resizeTree();
        this.cmd("SetText", this.messageID, "");
        return node;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Steal from sibling

    stealFromRight(node, parentIndex) {
        // Steal from right sibling
        const parentNode = node.parent;
        const rightSib = parentNode.children[parentIndex + 1];
        this.cmd("SetNumElements", node.graphicID, node.numKeys + 1);
        this.cmd("SetHighlight", node.graphicID, 1);
        this.cmd("SetHighlight", parentNode.graphicID, 1);
        this.cmd("SetHighlight", rightSib.graphicID, 1);
        this.cmd("SetText", this.messageID, `Stealing from right sibling: \n${node} ← [${parentNode.keys[parentIndex]}] ← ${rightSib}`);
        this.cmd("Step");

        node.numKeys++;
        this.cmd("SetNumElements", node.graphicID, node.numKeys);

        if (node.isLeaf) {
            this.cmd("Disconnect", node.graphicID, node.next.graphicID);
            this.cmd(
                "Connect",
                node.graphicID,
                node.next.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                "", // Label
                node.numKeys,
            );
        }

        this.cmd("SetText", node.graphicID, "", node.numKeys - 1);
        this.cmd("SetText", parentNode.graphicID, "", parentIndex);
        this.cmd("SetText", rightSib.graphicID, "", 0);

        const moveLabel1ID = this.nextIndex++;
        const moveLabel2ID = this.nextIndex++;
        if (node.isLeaf) {
            this.cmd("CreateLabel", moveLabel1ID, rightSib.keys[1], this.getLabelX(rightSib, 1), rightSib.y);
            this.cmd("CreateLabel", moveLabel2ID, rightSib.keys[0], this.getLabelX(rightSib, 0), rightSib.y);
            node.keys[node.numKeys - 1] = rightSib.keys[0];
            parentNode.keys[parentIndex] = rightSib.keys[1];
        } else {
            this.cmd("CreateLabel", moveLabel1ID, rightSib.keys[0], this.getLabelX(rightSib, 0), rightSib.y);
            this.cmd("CreateLabel", moveLabel2ID, parentNode.keys[parentIndex], this.getLabelX(parentNode, parentIndex), parentNode.y);
            node.keys[node.numKeys - 1] = parentNode.keys[parentIndex];
            parentNode.keys[parentIndex] = rightSib.keys[0];
        }

        this.cmd("Move", moveLabel1ID, this.getLabelX(parentNode, parentIndex), parentNode.y);
        this.cmd("Move", moveLabel2ID, this.getLabelX(node, node.numKeys - 1), node.y);
        this.cmd("Step");
        this.cmd("Delete", moveLabel1ID);
        this.cmd("Delete", moveLabel2ID);
        this.nextIndex -= 2;

        this.cmd("SetText", node.graphicID, node.keys[node.numKeys - 1], node.numKeys - 1);
        this.cmd("SetText", parentNode.graphicID, parentNode.keys[parentIndex], parentIndex);
        if (!node.isLeaf) {
            node.children[node.numKeys] = rightSib.children[0];
            node.children[node.numKeys].parent = node;
            this.cmd("Disconnect", rightSib.graphicID, rightSib.children[0].graphicID);
            this.cmd(
                "Connect",
                node.graphicID,
                node.children[node.numKeys].graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                0, // Directed
                "", // Label
                node.numKeys,
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
        this.cmd("SetHighlight", node.graphicID, 0);
        this.cmd("SetHighlight", parentNode.graphicID, 0);
        this.cmd("SetHighlight", rightSib.graphicID, 0);
        this.resizeTree();
        this.cmd("SetText", this.messageID, "");

        if (node.isLeaf && rightSib.next != null) {
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
        return node;
    }

    stealFromLeft(node, parentIndex) {
        const parentNode = node.parent;
        // Steal from left sibling
        node.numKeys++;
        this.cmd("SetNumElements", node.graphicID, node.numKeys);

        if (node.isLeaf && node.next != null) {
            this.cmd("Disconnect", node.graphicID, node.next.graphicID);
            this.cmd(
                "Connect",
                node.graphicID,
                node.next.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                "", // Label
                node.numKeys,
            );
        }

        for (let i = node.numKeys - 1; i > 0; i--) {
            node.keys[i] = node.keys[i - 1];
            this.cmd("SetText", node.graphicID, node.keys[i], i);
        }
        const leftSib = parentNode.children[parentIndex - 1];
        this.cmd("SetText", this.messageID, `Stealing from left sibling: \n${leftSib} → [${parentNode.keys[parentIndex]}] → ${node}`);

        this.cmd("SetText", node.graphicID, "", 0);
        this.cmd("SetText", parentNode.graphicID, "", parentIndex - 1);
        this.cmd("SetText", leftSib.graphicID, "", leftSib.numKeys - 1);

        const moveLabel1ID = this.nextIndex++;
        const moveLabel2ID = this.nextIndex++;
        if (node.isLeaf) {
            this.cmd("CreateLabel", moveLabel1ID, leftSib.keys[leftSib.numKeys - 1], this.getLabelX(leftSib, leftSib.numKeys - 1), leftSib.y);
            this.cmd("CreateLabel", moveLabel2ID, leftSib.keys[leftSib.numKeys - 1], this.getLabelX(leftSib, leftSib.numKeys - 1), leftSib.y);
            node.keys[0] = leftSib.keys[leftSib.numKeys - 1];
            parentNode.keys[parentIndex - 1] = leftSib.keys[leftSib.numKeys - 1];
        } else {
            this.cmd("CreateLabel", moveLabel1ID, leftSib.keys[leftSib.numKeys - 1], this.getLabelX(leftSib, leftSib.numKeys - 1), leftSib.y);
            this.cmd("CreateLabel", moveLabel2ID, parentNode.keys[parentIndex - 1], this.getLabelX(parentNode, parentIndex - 1), parentNode.y);
            node.keys[0] = parentNode.keys[parentIndex - 1];
            parentNode.keys[parentIndex - 1] = leftSib.keys[leftSib.numKeys - 1];
        }
        this.cmd("Move", moveLabel1ID, this.getLabelX(parentNode, parentIndex - 1), parentNode.y);
        this.cmd("Move", moveLabel2ID, this.getLabelX(node, 0), node.y);
        this.cmd("Step");
        this.cmd("Delete", moveLabel1ID);
        this.cmd("Delete", moveLabel2ID);
        this.nextIndex -= 2;

        if (!node.isLeaf) {
            for (let i = node.numKeys; i > 0; i--) {
                this.cmd("Disconnect", node.graphicID, node.children[i - 1].graphicID);
                node.children[i] = node.children[i - 1];
                this.cmd(
                    "Connect",
                    node.graphicID,
                    node.children[i].graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    0, // Directed
                    "", // Label
                    i, // Connection Point
                );
            }
            node.children[0] = leftSib.children[leftSib.numKeys];
            this.cmd("Disconnect", leftSib.graphicID, leftSib.children[leftSib.numKeys].graphicID);
            this.cmd(
                "Connect",
                node.graphicID,
                node.children[0].graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                0, // Directed
                "", // Label
                0, // Connection Point
            );
            leftSib.children[leftSib.numKeys] = null;
            node.children[0].parent = node;
        }

        this.cmd("SetText", node.graphicID, node.keys[0], 0);
        this.cmd("SetText", parentNode.graphicID, parentNode.keys[parentIndex - 1], parentIndex - 1);
        this.cmd("SetText", leftSib.graphicID, "", leftSib.numKeys - 1);
        leftSib.children.pop();
        leftSib.keys.pop();
        leftSib.numKeys--;
        this.cmd("SetNumElements", leftSib.graphicID, leftSib.numKeys);
        this.resizeTree();
        this.cmd("SetText", this.messageID, "");

        if (node.isLeaf) {
            this.cmd("Disconnect", leftSib.graphicID, node.graphicID);
            this.cmd(
                "Connect",
                leftSib.graphicID,
                node.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                "", // Label
                leftSib.numKeys,
            );
        }
        return node;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Repair after deletion

    repairAfterDelete(node) {
        if (node.numKeys < this.getMinKeys()) {
            if (node.parent == null) {
                if (node.numKeys === 0) {
                    this.cmd("Step");
                    this.cmd("Delete", node.graphicID);
                    this.treeRoot = node.children[0];
                    if (this.treeRoot != null)
                        this.treeRoot.parent = null;
                    this.resizeTree();
                }
            } else {
                const parentNode = node.parent;
                const parentIndex = this.getParentIndex(node);
                if (parentIndex > 0 && parentNode.children[parentIndex - 1].numKeys > this.getMinKeys()) {
                    this.stealFromLeft(node, parentIndex);
                } else if (parentIndex < parentNode.numKeys && parentNode.children[parentIndex + 1].numKeys > this.getMinKeys()) {
                    this.stealFromRight(node, parentIndex);
                } else if (parentIndex === 0) {
                    // Merge with right sibling
                    const nextNode = this.mergeRight(node);
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

    validateTree() {
        if (!this.treeRoot) return;
        super.validateTree();
        this.validateBPlusTree(this.treeRoot, null, Number.MIN_SAFE_INTEGER);
    }

    validateBPlusTree(node, parent, cmpVal) {
        if (!node) return [cmpVal, 0];
        if (!(node instanceof this.BPlusTreeNode)) console.error("Not a B+ tree node:", node);
        if (!node.graphicID) console.error("Tree node missing ID:", node);
        if (!(node.parent === parent || (!node.parent && !parent))) console.error("Parent mismatch:", node, parent);
        if (node.keys.length !== node.numKeys) console.error("N:o keys mismatch", node);
        if (node.numKeys === 0) console.error("Empty tree node", node);
        if (node.numKeys >= this.getMaxDegree()) console.error(`Too high degree, ${node.numKeys+1} > ${this.getMaxDegree()}`, node);
        if (node.isLeaf) {
            const nextLeaf = this.findNextLeaf(node);
            if (node.next !== nextLeaf) console.error("Wrong leaf next pointer", node, nextLeaf);
            if (node.children.length > 0) console.error("Leaf node has children", node);
        } else {
            if (node.next) console.error("Non-leaf node has next pointer");
            if (node.numKeys + 1 !== node.children.length) console.error(`N:o children mismatch, ${node.numKeys} + 1 != ${node.children.length}`, node);
            for (let i = 0; i < node.numKeys; i++) {
                let child = node.children[i + 1];
                while (!child.isLeaf) child = child.children[0];
                if (node.keys[i] !== child.keys[0]) console.error("Non-leaf element not in leaf", node, child);
            }
        }
        let height = 0;
        for (let i = 0; i <= node.numKeys; i++) {
            if (node.isLeaf) {
                if (node.children[i]) console.error(`Leaf has children`, node);
            } else {
                const child = node.children[i];
                if (!child) console.error(`Null child n:o ${i}`, node);
                let childHeight;
                [cmpVal, childHeight] = this.validateBPlusTree(child, node, cmpVal);
                if (height && childHeight !== height) console.error(`Height mismatch, ${height} != ${childHeight}`, node);
                height = childHeight;
            }
            if (i < node.numKeys) {
                const val = node.keys[i];
                if (this.compare(cmpVal, val) > 0) console.error(`Order mismatch, ${cmpVal} > ${val}`, node);
                cmpVal = val;
            }
        }
        return [cmpVal, height + 1];
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Manipulate tree nodes

    removeTreeNode(node) {
        this.cmd("Delete", node.graphicID);
    }

    isTreeNode(node) {
        return node instanceof this.BPlusTreeNode;
    }

    findNextLeaf(node) {
        if (!node.parent) return null;
        const isLastChild = n => n && n.parent && n === n.parent.children[n.parent.numKeys];
        while (isLastChild(node)) node = node.parent;
        if (!node.parent) return null;
        const i = this.getParentIndex(node);
        if (i >= node.parent.numKeys) return null;
        node = node.parent.children[i + 1];
        if (!node) return null;
        while (!node.isLeaf) node = node.children[0];
        return node;
    }

    getParentIndex(node) {
        const parent = node.parent;
        if (!parent) throw new Error("The root node doesn't have a parent index");
        let i = 0;
        while (i <= parent.numKeys && parent.children[i] !== node)
            i++;
        if (i > parent.numKeys) throw new Error("Couldn't find parent index");
        return i;
    }

    getLabelX(node, index) {
        return node.x - this.WIDTH_PER_ELEM * node.numKeys / 2 + this.WIDTH_PER_ELEM / 2 + index * this.WIDTH_PER_ELEM;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Resize the tree

    resizeTree(animate = true) {
        this.resizeWidths(this.treeRoot);
        this.setNewPositions(this.treeRoot, this.getTreeRootX(), this.getTreeRootY());
        const cmd = animate ? "Move" : "SetPosition";
        this.animateNewPositions(this.treeRoot, cmd);
    }

    setNewPositions(node, xPosition, yPosition) {
        if (node != null) {
            node.y = yPosition;
            node.x = xPosition;
            if (!node.isLeaf) {
                const leftEdge = xPosition - node.width / 2;
                let priorWidth = 0;
                for (let i = 0; i < node.numKeys + 1; i++) {
                    this.setNewPositions(
                        node.children[i],
                        leftEdge + priorWidth + node.widths[i] / 2,
                        yPosition + this.NODE_HEIGHT + this.getSpacingY(),
                    );
                    priorWidth += node.widths[i];
                }
            }
        }
    }

    resizeWidths(node) {
        if (node == null) {
            return 0;
        }
        if (node.isLeaf) {
            for (let i = 0; i < node.numKeys + 1; i++) {
                node.widths[i] = 0;
            }
            node.width = node.numKeys * this.WIDTH_PER_ELEM + this.getSpacingX();
            return node.width;
        } else {
            let treeWidth = 0;
            for (let i = 0; i < node.numKeys + 1; i++) {
                node.widths[i] = this.resizeWidths(node.children[i]);
                treeWidth = treeWidth + node.widths[i];
            }
            treeWidth = Math.max(treeWidth, node.numKeys * this.WIDTH_PER_ELEM + this.getSpacingX());
            node.width = treeWidth;
            return treeWidth;
        }
    }
};
