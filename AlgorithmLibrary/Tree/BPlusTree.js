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


Algorithm.Tree.BPlusTree = class BPlusTree extends Algorithm.Tree.BTree {
    USE_PREEMPTIVE_SPLIT = false;
    INSERT_TOPDOWN = true;
    DELETE_TOPDOWN = true;

    NEW_NODE_Y = this.NEW_NODE_X;

    constructor(am) {
        super();
        if (am) this.init(am);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Print the values in the tree

    doPrint(node) {
        this.cmd("SetWidth", this.highlightID, this.NODE_HEIGHT);
        while (!node.isLeaf()) {
            this.cmd("Move", this.highlightID, this.getLabelX(node, 0), node.y);
            this.cmd("Step");
            node = node.getLeft();
        }

        while (node) {
            for (let i = 0; i < node.numLabels(); i++) {
                this.cmd("Move", this.highlightID, this.getLabelX(node, i), node.y);
                this.cmd("Step");
                this.printOneLabel(node.labels[i], this.getLabelX(node, i), node.y);
                this.cmd("Step");
            }
            node = node.next;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Find a value in the tree

    doFind(node, value) {
        return this.btreeFind(node, value, true);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Insert a value at a node

    doInsertBottomup() {
        console.error("BPlusTree.doInsertBottomup: This should not be called");
    }

    doInsertTopdown(node, value) {
        if (node === this.treeRoot) {
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, this.getLabelX(node, 0), node.y);
        }
        const nodeID = node.graphicID;
        this.cmd("Move", this.highlightID, this.getLabelX(node, 0), node.y);
        let index = 0;
        while (index < node.numLabels() && this.compare(node.labels[index], value) < 0) {
            index++;
        }
        if (index > 0) this.cmd("Step");
        this.cmd("Move", this.highlightID, this.getLabelX(node, Math.min(index, node.numLabels() - 1)), node.y);

        if (!this.ALLOW_DUPLICATES && this.compare(node.labels[index], value) === 0) {
            this.cmd("SetText", this.messageID, `Node ${node} already exists`);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
            return;
        }

        if (!node.isLeaf()) {
            this.cmd("Step");
            this.doInsertTopdown(node.children[index], value);
            return;
        }

        this.cmd("SetText", this.messageID, `Inserting ${value} into the leaf node ${node}`);
        this.cmd("Step");
        this.cmd("SetNumElements", nodeID, node.numLabels() + 1);
        node.labels.splice(index, 0, value);
        for (let i = 0; i < node.numLabels(); i++) {
            this.cmd("SetText", nodeID, node.labels[i], i);
        }
        if (node.next != null) {
            this.cmd("Disconnect", nodeID, node.next.graphicID);
            this.cmd("Connect", nodeID, node.next.graphicID, this.FOREGROUND_COLOR, 0, true, "", node.numLabels());
        }
        this.cmd("Move", this.highlightID, this.getLabelX(node, index), node.y);
        this.cmd("Step");
        this.cmd("SetAlpha", this.highlightID, 0);
        this.resizeTree();
        this.insertRepair(node);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Delete a node

    doDeleteBottomup() {
        console.error("BPlusTree.doDeleteBottumup: This should not be called");
    }

    doDeleteTopdown(node, value, foundParent = null) {
        if (!node) return;
        const nodeID = node.graphicID;
        this.cmd("SetHighlight", nodeID, 1);
        this.cmd("Step");
        let i = 0;
        while (i < node.numLabels() && this.compare(node.labels[i], value) < 0)
            i++;
        if (i === node.numLabels()) {
            if (!node.isLeaf()) {
                this.cmd("SetEdgeHighlight", nodeID, node.getRight().graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", nodeID, 0);
                this.cmd("SetEdgeHighlight", nodeID, node.getRight().graphicID, 0);
                this.doDeleteTopdown(node.getRight(), value, foundParent);
            } else {
                this.cmd("SetHighlight", nodeID, 0);
            }
        } else if (!node.isLeaf() && this.compare(node.labels[i], value) === 0) {
            this.cmd("SetEdgeHighlight", nodeID, node.children[i + 1].graphicID, 1);
            this.cmd("Step");
            // Keep this node highlighted until we find a leaf
            // this.cmd("SetHighlight", nodeID, 0);
            this.cmd("SetEdgeHighlight", nodeID, node.children[i + 1].graphicID, 0);
            this.doDeleteTopdown(node.children[i + 1], value, node);
        } else if (!node.isLeaf()) {
            this.cmd("SetEdgeHighlight", nodeID, node.children[i].graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", nodeID, 0);
            this.cmd("SetEdgeHighlight", nodeID, node.children[i].graphicID, 0);
            this.doDeleteTopdown(node.children[i], value, foundParent);
        } else if (node.isLeaf() && this.compare(node.labels[i], value) === 0) {
            this.cmd("SetTextColor", nodeID, this.HIGHLIGHT_COLOR, i);
            this.cmd("Step");
            this.cmd("SetTextColor", nodeID, this.FOREGROUND_COLOR, i);
            for (let j = i; j < node.numLabels() - 1; j++) {
                node.labels[j] = node.labels[j + 1];
                this.cmd("SetText", nodeID, node.labels[j], j);
            }
            node.labels.pop();
            this.cmd("SetText", nodeID, "", node.numLabels());
            this.cmd("SetNumElements", nodeID, node.numLabels());
            this.cmd("SetHighlight", nodeID, 0);

            if (node.next != null) {
                this.cmd("Disconnect", nodeID, node.next.graphicID);
                this.cmd("Connect", nodeID, node.next.graphicID, this.FOREGROUND_COLOR, 0, true, "", node.numLabels());
            }

            // Bit of a hack -- if we remove the smallest element in a leaf, then find the *next* smallest element
            // (somewhat tricky if the leaf is now empty!), go to the found parent, and fix index keys
            if (i === 0 && node.parent != null) {
                if (!foundParent) console.error(`Didn't find leaf in tree: ${node.labels[0]}`);
                let nextSmallest = "";
                if (node.numLabels() > 0) {
                    nextSmallest = node.labels[0];
                } else if (node.next) {
                    nextSmallest = node.next.labels[0];
                }
                for (let j = 0; j < foundParent.numLabels(); j++) {
                    if (foundParent.labels[j] === value) {
                        foundParent.labels[j] = nextSmallest;
                        this.cmd("SetText", foundParent.graphicID, nextSmallest, j);
                        break;
                    }
                }
                this.cmd("Step");
                this.cmd("SetHighlight", foundParent.graphicID, 0);
            }
            this.repairAfterDelete(node);
        } else {
            this.cmd("SetHighlight", nodeID, 0);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Merge nodes

    mergeRightX(node) {
        const parentNode = node.parent;
        const parentIndex = this.getParentIndex(node);
        const rightSib = parentNode.children[parentIndex + 1];
        this.cmd("SetHighlight", node.graphicID, 1);
        this.cmd("SetHighlight", parentNode.graphicID, 1);
        this.cmd("SetHighlight", rightSib.graphicID, 1);
        this.cmd("SetText", this.messageID, ["Merging nodes:", `${node} + [${parentNode.keys[parentIndex]}] + ${rightSib}`]);
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
                this.cmd("Connect", node.graphicID, node.children[j].graphicID, this.FOREGROUND_COLOR, 0, 0, "", j);
            }
            node.numKeys = node.numKeys + rightSib.numKeys + 1;
        } else {
            node.numKeys = node.numKeys + rightSib.numKeys;
            node.next = rightSib.next;
            if (rightSib.next != null) {
                this.cmd("Connect", node.graphicID, node.next.graphicID, this.FOREGROUND_COLOR, 0, 1, "", node.numKeys);
            }
        }
        this.cmd("Disconnect", parentNode.graphicID, rightSib.graphicID);
        for (let i = parentIndex + 1; i < parentNode.numKeys; i++) {
            this.cmd("Disconnect", parentNode.graphicID, parentNode.children[i + 1].graphicID);
            parentNode.children[i] = parentNode.children[i + 1];
            this.cmd("Connect", parentNode.graphicID, parentNode.children[i].graphicID, this.FOREGROUND_COLOR, 0, 0, "", i);
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

    stealFromRightX(node, parentIndex) {
        // Steal from right sibling
        const parentNode = node.parent;
        const rightSib = parentNode.children[parentIndex + 1];
        let nodeNumKeys = node.numLabels();
        let rightNumKeys = rightSib.numLabels();
        this.cmd("SetNumElements", node.graphicID, nodeNumKeys + 1);
        this.cmd("SetHighlight", node.graphicID, 1);
        this.cmd("SetHighlight", parentNode.graphicID, 1);
        this.cmd("SetHighlight", rightSib.graphicID, 1);
        this.cmd("SetText", this.messageID, ["Stealing from right sibling:", `${node} ← [${parentNode.labels[parentIndex]}] ← ${rightSib}`]);
        this.cmd("Step");

        nodeNumKeys++;
        this.cmd("SetNumElements", node.graphicID, nodeNumKeys);

        if (node.isLeaf) {
            this.cmd("Disconnect", node.graphicID, node.next.graphicID);
            this.cmd("Connect", node.graphicID, node.next.graphicID, this.FOREGROUND_COLOR, 0, 1, "", nodeNumKeys);
        }

        this.cmd("SetText", node.graphicID, "", nodeNumKeys - 1);
        this.cmd("SetText", parentNode.graphicID, "", parentIndex);
        this.cmd("SetText", rightSib.graphicID, "", 0);

        const moveLabel1ID = this.nextIndex++;
        const moveLabel2ID = this.nextIndex++;
        if (node.isLeaf) {
            this.cmd("CreateLabel", moveLabel1ID, rightSib.labels[1], this.getLabelX(rightSib, 1), rightSib.y);
            this.cmd("CreateLabel", moveLabel2ID, rightSib.labels[0], this.getLabelX(rightSib, 0), rightSib.y);
            node.labels[nodeNumKeys - 1] = rightSib.labels[0];
            parentNode.labels[parentIndex] = rightSib.labels[1];
        } else {
            this.cmd("CreateLabel", moveLabel1ID, rightSib.labels[0], this.getLabelX(rightSib, 0), rightSib.y);
            this.cmd("CreateLabel", moveLabel2ID, parentNode.labels[parentIndex], this.getLabelX(parentNode, parentIndex), parentNode.y);
            node.labels[nodeNumKeys - 1] = parentNode.labels[parentIndex];
            parentNode.labels[parentIndex] = rightSib.labels[0];
        }

        this.cmd("Move", moveLabel1ID, this.getLabelX(parentNode, parentIndex), parentNode.y);
        this.cmd("Move", moveLabel2ID, this.getLabelX(node, nodeNumKeys - 1), node.y);
        this.cmd("Step");
        this.cmd("Delete", moveLabel1ID);
        this.cmd("Delete", moveLabel2ID);
        this.nextIndex -= 2;

        this.cmd("SetText", node.graphicID, node.labels[nodeNumKeys - 1], nodeNumKeys - 1);
        this.cmd("SetText", parentNode.graphicID, parentNode.labels[parentIndex], parentIndex);
        if (!node.isLeaf) {
            node.children[nodeNumKeys] = rightSib.children[0];
            node.children[nodeNumKeys].parent = node;
            this.cmd("Disconnect", rightSib.graphicID, rightSib.children[0].graphicID);
            this.cmd("Connect", node.graphicID, node.children[nodeNumKeys].graphicID, this.FOREGROUND_COLOR, 0, 0, "", nodeNumKeys);
            for (let i = 1; i < rightNumKeys + 1; i++) {
                this.cmd("Disconnect", rightSib.graphicID, rightSib.children[i].graphicID);
                rightSib.children[i - 1] = rightSib.children[i];
                this.cmd("Connect", rightSib.graphicID, rightSib.children[i - 1].graphicID, this.FOREGROUND_COLOR, 0, 0, "", i - 1);
            }
        }
        for (let i = 1; i < rightNumKeys; i++) {
            rightSib.labels[i - 1] = rightSib.labels[i];
            this.cmd("SetText", rightSib.graphicID, rightSib.labels[i - 1], i - 1);
        }
        this.cmd("SetText", rightSib.graphicID, "", rightNumKeys - 1);
        rightSib.children.pop();
        rightSib.labels.pop();
        rightNumKeys--;
        this.cmd("SetNumElements", rightSib.graphicID, rightNumKeys);
        this.cmd("Step");
        this.cmd("SetHighlight", node.graphicID, 0);
        this.cmd("SetHighlight", parentNode.graphicID, 0);
        this.cmd("SetHighlight", rightSib.graphicID, 0);
        this.resizeTree();
        this.cmd("SetText", this.messageID, "");

        if (node.isLeaf && rightSib.next != null) {
            this.cmd("Disconnect", rightSib.graphicID, rightSib.next.graphicID);
            this.cmd("Connect", rightSib.graphicID, rightSib.next.graphicID, this.FOREGROUND_COLOR, 0, 1, "", rightNumKeys);
        }
        return node;
    }

    stealFromLeftX(node, parentIndex) {
        const parentNode = node.parent;
        // Steal from left sibling
        node.numKeys++;
        this.cmd("SetNumElements", node.graphicID, node.numKeys);

        if (node.isLeaf && node.next != null) {
            this.cmd("Disconnect", node.graphicID, node.next.graphicID);
            this.cmd("Connect", node.graphicID, node.next.graphicID, this.FOREGROUND_COLOR, 0, 1, "", node.numKeys);
        }

        for (let i = node.numKeys - 1; i > 0; i--) {
            node.keys[i] = node.keys[i - 1];
            this.cmd("SetText", node.graphicID, node.keys[i], i);
        }
        const leftSib = parentNode.children[parentIndex - 1];
        this.cmd("SetText", this.messageID, ["Stealing from left sibling:", `${leftSib} → [${parentNode.keys[parentIndex]}] → ${node}`]);

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
                this.cmd("Connect", node.graphicID, node.children[i].graphicID, this.FOREGROUND_COLOR, 0, 0, "", i);
            }
            node.children[0] = leftSib.children[leftSib.numKeys];
            this.cmd("Disconnect", leftSib.graphicID, leftSib.children[leftSib.numKeys].graphicID);
            this.cmd("Connect", node.graphicID, node.children[0].graphicID, this.FOREGROUND_COLOR, 0, 0, "", 0);
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
            this.cmd("Connect", leftSib.graphicID, node.graphicID, this.FOREGROUND_COLOR, 0, 1, "", leftSib.numKeys);
        }
        return node;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Repair after deletion

    repairAfterDeleteX(node) {
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
        this.validateBPlusTree(this.treeRoot);
    }

    validateBPlusTree(node) {
        if (node.isLeaf()) {
            const nextLeaf = this.findNextLeaf(node);
            if (node.next !== nextLeaf) console.error("Wrong leaf next pointer", node, nextLeaf);
            let i = 0, parent = node;
            while (i === 0) {
                i = this.getParentIndex(parent);
                parent = parent.parent;
            }
            if (i && i > 0) {
                if (node.labels[0] !== parent.labels[i - 1]) console.error("Leaf first label not in ancestor", node, parent);
            }
        } else {
            if (node.next) console.error("Non-leaf node has next pointer");
            for (let i = 1; i < node.numChildren(); i++) {
                let leaf = node.children[i];
                while (!leaf.isLeaf()) leaf = leaf.getLeft();
                if (node.labels[i - 1] !== leaf.labels[0]) console.error("Non-leaf element not in leaf", node, leaf);
            }
            for (const child of node.getChildren()) {
                this.validateBPlusTree(child);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Manipulate tree nodes

    createTreeNode(elemID, x, y, value) {
        const node = super.createTreeNode(elemID, x, y, value);
        node.next = null;
        return node;
    }

    findNextLeaf(node) {
        if (!node.parent) return null;
        const isLastChild = (n) => n && n === n.parent?.getRight();
        while (isLastChild(node)) node = node.parent;
        if (!node.parent) return null;
        const i = this.getParentIndex(node);
        if (i >= node.parent.numLabels()) return null;
        node = node.parent.children[i + 1];
        while (!node.isLeaf()) node = node.getLeft();
        return node;
    }
};
