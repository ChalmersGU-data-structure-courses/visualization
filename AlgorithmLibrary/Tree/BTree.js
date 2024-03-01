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


Algorithm.Tree.BTree = class BTree extends Algorithm.Tree {
    MAX_DEGREES = [3, 4, 5, 6, 7];
    MAX_DEGREE_LABELS = ["2/3-tree", "2/3/4-tree", "Max. degree 5", "Max. degree 6", "Max. degree 7"];
    INITIAL_MAX_DEGREE = 3;

    USE_PREEMPTIVE_SPLIT = true;
    INSERT_TOPDOWN = false;
    DELETE_TOPDOWN = false;

    HIGHLIGHT_COLOR = "red";
    HIGHLIGHT_CIRCLE_COLOR = this.HIGHLIGHT_COLOR;

    WIDTH_PER_ELEM = this.NODE_SIZE;
    NODE_HEIGHT = this.NODE_SIZE * 3 / 4;
    HIGHLIGHT_CIRCLE_WIDTH = this.NODE_HEIGHT;

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
        if (this.USE_PREEMPTIVE_SPLIT) {
            this.addBreakToAlgorithmBar();
            this.preemptiveSplitBox = this.addCheckboxToAlgorithmBar("Preemtive split/merge");
            this.preemptiveSplitBox.onclick = this.updateMaxDegree.bind(this);
        }
    }

    resetAll() {
        super.resetAll();
        this.updateMaxDegree();
    }

    reset() {
        this.nextIndex = this.initialIndex;
        this.updateMaxDegree();
        this.treeRoot = null;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Information about the type of BTree

    updateMaxDegree() {
        if (!this.USE_PREEMPTIVE_SPLIT) return;
        const preemptiveSplitDisabled = this.getMaxDegree() % 2 !== 0;
        if (preemptiveSplitDisabled) {
            this.preemptiveSplitBox.checked = false;
        }
        this.preemptiveSplitBox.disabled = preemptiveSplitDisabled;
        this.INSERT_TOPDOWN = this.DELETE_TOPDOWN = this.preemptiveSplitBox.checked;
    }

    getMaxDegree() {
        return parseInt(this.maxDegreeSelect?.value) || this.INITIAL_MAX_DEGREE;
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
        this.cmd("Move", this.highlightID, this.getLabelX(node, 0), node.y);
        this.cmd("Step");
        if (node.isLeaf()) {
            this.printOneLabel(node.labels[0], this.highlightID);
            this.cmd("Step");
            for (let i = 1; i < node.numLabels(); i++) {
                const labelX = this.getLabelX(node, i);
                this.cmd("Move", this.highlightID, labelX, node.y);
                this.cmd("Step");
                this.printOneLabel(node.labels[i], this.highlightID);
                this.cmd("Step");
            }
        } else {
            for (let i = 0; i < node.numChildren(); i++) {
                const labelX = this.getLabelX(node, Math.min(i, node.numLabels() - 1));
                if (!node.isLeaf()) {
                    this.doPrint(node.children[i]);
                    this.cmd("Move", this.highlightID, labelX, node.y);
                    this.cmd("Step");
                }
                if (i < node.numLabels()) {
                    this.printOneLabel(node.labels[i], this.highlightID);
                    this.cmd("Step");
                }
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Find a value in the tree

    doFind(node, value) {
        return this.btreeFind(node, value, false);
    }

    btreeFind(node, value, findLeaf = false) {
        if (node === this.treeRoot) {
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, this.getLabelX(node, 0), node.y);
        }
        const nodeID = node.graphicID;
        let i = 0;
        let cmpStr = value;
        while (i < node.numLabels()) {
            this.cmd("Move", this.highlightID, this.getLabelX(node, i), node.y);
            this.cmd("Step");
            const lbl = node.labels[i];
            const cmp = this.compare(value, lbl);
            if (cmp === 0) {
                cmpStr = `${lbl} = ${value}`;
                break;
            } else if (cmp < 0) {
                cmpStr = `${cmpStr} < ${lbl}`;
                break;
            }
            cmpStr = `${lbl} < ${value}`;
            i++;
        }

        const found = i < node.numLabels() && this.compare(node.labels[i], value) === 0;
        if (node.isLeaf() || (found && !findLeaf)) {
            if (found) this.cmd("SetTextColor", nodeID, this.HIGHLIGHT_COLOR, i);
            this.cmd("Step");
            this.cmd("SetTextColor", nodeID, this.FOREGROUND_COLOR, i);
            this.cmd("SetAlpha", this.highlightID, 0);
            return {found: found, node: node};
        }

        if (found) i++;
        const child = node.children[i];
        this.cmd("SetText", this.messageID, `${cmpStr}: Look into ${node.getOrdinal(i)} child`);
        this.cmd("Step");
        return this.doFind(child, value, findLeaf);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Insert a value at a node

    doInsert(node, value) {
        if (this.INSERT_TOPDOWN) {
            this.doInsertTopdown(this.treeRoot, value);
        } else {
            this.doInsertBottomup(node, value);
        }
    }

    doInsertBottomup(node, value) {
        if (!node.isLeaf()) console.error("Not a leaf node:", node);
        this.cmd("SetText", this.messageID, `Inserting ${value} into the leaf node ${node}`);
        const nodeID = node.graphicID;
        const elemID = this.nextIndex++;
        const elem = this.createTreeNode(elemID, this.NEW_NODE_X, this.NEW_NODE_Y, value);
        this.cmd("SetHighlight", elem.graphicID, 1);
        this.cmd("SetHighlight", nodeID, 1);
        this.cmd("Step");

        let i = 0;
        while (i < node.numLabels()) {
            if (this.compare(value, node.labels[i]) < 0) break;
            i++;
        }

        node.labels.splice(i, 0, "");
        this.cmd("SetNumElements", nodeID, node.numLabels());
        for (let j = i; j < node.numLabels(); j++) {
            this.cmd("SetText", nodeID, node.labels[j], j);
        }
        this.cmd("Move", elemID, this.getLabelX(node, Math.min(i, node.numLabels() - 1)), node.y);
        this.cmd("Step");
        node.labels[i] = value;
        this.cmd("SetText", nodeID, value, i);
        this.cmd("SetHighlight", nodeID, 0);
        this.removeTreeNode(elem);
        this.resizeTree();
        this.insertRepair(node);
    }

    insertRepair(node) {
        if (node.numLabels() > this.getMaxKeys()) {
            if (!node.parent) {
                this.treeRoot = this.split(node);
            } else {
                const newNode = this.split(node);
                this.insertRepair(newNode);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Insert using preemptive splitting

    doInsertTopdown(node, value) {
        if (node === this.treeRoot) {
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, this.getLabelX(node, 0), node.y);
            this.cmd("SetText", this.messageID, `Inserting ${value} using preemptive split`);
        }
        if (node.numLabels() === this.getMaxKeys()) {
            this.cmd("SetAlpha", this.highlightID, 0);
            node = this.split(node);
            this.resizeTree();
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, this.getLabelX(node, 0), node.y);
        }
        this.cmd("Move", this.highlightID, this.getLabelX(node, 0), node.y);
        this.cmd("Step");
        const nodeID = node.graphicID;
        let i = 0;
        while (i < node.numLabels() && this.compare(node.labels[i], value) < 0) {
            i++;
        }
        let i0 = i;
        if (this.compare(node.labels[i], value) === 0) {
            if (!this.ALLOW_DUPLICATES) {
                this.cmd("Move", this.highlightID, this.getLabelX(node, i), node.y);
                this.cmd("SetText", this.messageID, `Node ${node} ${i} already exists`);
                this.cmd("Step");
                this.cmd("SetAlpha", this.highlightID, 0);
                return;
            }
        } else {
            i0 -= 0.5;
        }
        if (i0 !== 0) {
            this.cmd("Move", this.highlightID, this.getLabelX(node, i0), node.y);
            this.cmd("Step");
        }

        if (!node.isLeaf()) {
            this.doInsertTopdown(node.children[i], value);
        } else {
            this.cmd("SetText", this.messageID, `Inserting ${value} into the leaf node ${node}`);
            this.cmd("Step");
            node.labels.splice(i, 0, value);
            this.cmd("SetNumElements", nodeID, node.numLabels());
            for (let j = i; j < node.numLabels(); j++) {
                this.cmd("SetText", nodeID, node.labels[j], j);
            }
            this.cmd("Move", this.highlightID, this.getLabelX(node, i), node.y);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
            this.resizeTree();
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Split a node

    split(node) {
        const nodeID = node.graphicID;
        this.cmd("SetText", this.messageID, `Node ${node} contains too many keys: splitting it`);
        this.cmd("SetHighlight", nodeID, 1);
        this.cmd("Step");
        this.cmd("SetHighlight", nodeID, 0);
        this.cmd("SetText", this.messageID, "");

        const risingLabel = node.labels[this.getSplitIndex()];
        const risingLabelX = this.getLabelX(node, this.getSplitIndex());

        const rightNodeID = this.nextIndex++;
        const rightNode = this.createTreeNode(rightNodeID, node.x, node.y, "");

        let rightSplit = this.getSplitIndex() + 1;
        if (!node.isLeaf()) {
            rightNode.children = [];
        } else if (node.isBPlusLeaf()) {
            rightNode.next = node.next;
            node.next = rightNode;
            rightSplit--;
        }

        rightNode.labels.length = node.numLabels() - rightSplit;
        this.cmd("SetNumElements", rightNodeID, rightNode.numLabels());

        if (node.isBPlusLeaf()) {
            if (rightNode.next) {
                this.cmd("Disconnect", nodeID, rightNode.next.graphicID);
                this.cmd("Connect", rightNodeID, rightNode.next.graphicID, this.FOREGROUND_COLOR, 0, true, "", rightNode.numLabels());
            }
            this.cmd("Connect", nodeID, rightNodeID, this.FOREGROUND_COLOR, 0, true, "", this.getSplitIndex());
        }

        for (let i = rightSplit; i < node.numLabels(); i++) {
            const j = i - rightSplit;
            rightNode.labels[j] = node.labels[i];
            this.cmd("SetText", rightNodeID, rightNode.labels[j], j);
        }
        if (!node.isLeaf()) {
            for (let i = rightSplit; i < node.numChildren(); i++) {
                const j = i - rightSplit;
                const child = node.children[i];
                rightNode.children[j] = child;
                this.cmd("Disconnect", nodeID, child.graphicID);
                this.cmd("Connect", rightNodeID, child.graphicID, this.FOREGROUND_COLOR, 0, false, "", j);
                child.parent = rightNode;
            }
        }
        for (let i = node.numLabels() - 1; i >= this.getSplitIndex(); i--) {
            this.cmd("SetText", nodeID, "", i); // TO MAKE UNDO WORK
            node.labels.pop();
            if (!node.isLeaf()) node.children.pop();
        }
        this.cmd("SetNumElements", nodeID, this.getSplitIndex());

        const parent = node.parent;
        if (node.parent) {
            const parentID = parent.graphicID;
            const parentIndex = this.getParentIndex(node);
            const risingLabelID = this.nextIndex++;
            this.cmd("SetNumElements", parentID, parent.numLabels() + 1);
            for (let i = parent.numLabels(); i > parentIndex; i--) {
                parent.children[i + 1] = parent.children[i];
                this.cmd("Disconnect", parentID, parent.children[i].graphicID);
                this.cmd("Connect", parentID, parent.children[i].graphicID, this.FOREGROUND_COLOR, 0, false, "", i + 1);
                parent.labels[i] = parent.labels[i - 1];
                this.cmd("SetText", parentID, parent.labels[i], i);
            }
            parent.labels[parentIndex] = risingLabel;
            this.cmd("SetText", parentID, "", parentIndex);
            this.cmd("CreateLabel", risingLabelID, risingLabel, risingLabelX, node.y);
            this.cmd("SetForegroundColor", risingLabelID, this.FOREGROUND_COLOR);
            this.cmd("Move", risingLabelID, this.getLabelX(parent, parentIndex), parent.y);
            parent.children[parentIndex + 1] = rightNode;
            rightNode.parent = parent;
            this.cmd("Connect", parentID, rightNodeID, this.FOREGROUND_COLOR, 0, false, "", parentIndex + 1);
            this.resizeTree();
            this.cmd("Step");
            this.cmd("Delete", risingLabelID);
            this.nextIndex--;
            this.cmd("SetText", parentID, risingLabel, parentIndex);
            return parent;
        }

        const rootID = this.nextIndex++;
        this.treeRoot = this.createTreeNode(rootID, this.getTreeRootX(), this.getTreeRootY(), risingLabel);
        this.treeRoot.children = [node, rightNode];
        node.parent = this.treeRoot;
        rightNode.parent = this.treeRoot;
        this.cmd("Connect", rootID, nodeID, this.FOREGROUND_COLOR, 0, false, "", 0);
        this.cmd("Connect", rootID, rightNodeID, this.FOREGROUND_COLOR, 0, false, "", 1);
        return this.treeRoot;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Delete a node

    doDelete(node, value) {
        if (this.DELETE_TOPDOWN) {
            this.doDeleteTopdown(this.treeRoot, value);
        } else {
            this.doDeleteBottomup(node, value);
        }
        if (this.treeRoot.numLabels() === 0) {
            this.cmd("Step");
            this.removeTreeNode(this.treeRoot);
            if (this.treeRoot.isLeaf()) {
                this.treeRoot = null;
            } else {
                this.treeRoot = this.treeRoot.getLeft();
                this.treeRoot.parent = null;
            }
            this.resizeTree();
        }
    }

    doDeleteBottomup(node, value) {
        const nodeID = node.graphicID;
        let i = 0;
        while (i < node.numLabels() && this.compare(node.labels[i], value) < 0) {
            i++;
        }
        if (this.compare(node.labels[i], value) !== 0) {
            console.error("Couldn't find the value!");
            return;
        }

        this.cmd("SetTextColor", nodeID, this.HIGHLIGHT_COLOR, i);
        this.cmd("SetHighlight", nodeID, 1);
        this.cmd("Step");
        this.cmd("SetHighlight", nodeID, 0);
        if (node.isLeaf()) {
            this.cmd("SetTextColor", nodeID, this.FOREGROUND_COLOR, i);
            node.labels.splice(i, 1);
            this.cmd("SetNumElements", nodeID, node.numLabels());
            for (let j = i; j < node.numLabels(); j++) {
                this.cmd("SetText", nodeID, node.labels[j], j);
            }
            this.repairAfterDelete(node);
        } else {
            let maxNode = node.children[i];
            while (!maxNode.isLeaf()) {
                this.cmd("SetHighlight", maxNode.graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", maxNode.graphicID, 0);
                maxNode = maxNode.getRight();
            }
            this.cmd("SetHighlight", maxNode.graphicID, 1);
            node.labels[i] = maxNode.labels[maxNode.numLabels() - 1];
            this.cmd("SetTextColor", nodeID, this.FOREGROUND_COLOR, i);
            this.cmd("SetText", nodeID, "", i);
            this.cmd("SetText", maxNode.graphicID, "", maxNode.numLabels() - 1);
            const moveLabelID = this.nextIndex++;
            this.cmd("CreateLabel", moveLabelID, node.labels[i], this.getLabelX(maxNode, maxNode.numLabels() - 1), maxNode.y);
            this.cmd("SetForegroundColor", moveLabelID, this.FOREGROUND_COLOR);
            this.cmd("Move", moveLabelID, this.getLabelX(node, i), node.y);
            this.cmd("Step");
            this.cmd("Delete", moveLabelID);
            this.nextIndex--;
            this.cmd("SetText", nodeID, node.labels[i], i);
            maxNode.labels.pop();
            this.cmd("SetNumElements", maxNode.graphicID, maxNode.numLabels());
            this.cmd("SetHighlight", maxNode.graphicID, 0);
            this.cmd("SetHighlight", nodeID, 0);
            this.repairAfterDelete(maxNode);
        }
    }

    repairAfterDelete(node) {
        if (node.numLabels() >= this.getMinKeys()) return;
        const parent = node.parent;
        if (!parent) return;

        const i = this.getParentIndex(node);
        if (i > 0 && parent.children[i - 1].numLabels() > this.getMinKeys()) {
            // Steal from left sibling
            this.stealFromLeft(node, i);
        } else if (i < parent.numLabels() && parent.children[i + 1].numLabels() > this.getMinKeys()) {
            // Steal from right sibling
            this.stealFromRight(node, i);
        } else if (i === 0) {
            // Merge with right sibling
            const nextNode = this.mergeRight(node);
            this.repairAfterDelete(nextNode.parent);
        } else {
            // Merge with left sibling
            const nextNode = this.mergeRight(parent.children[i - 1]);
            this.repairAfterDelete(nextNode.parent);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Merge nodes

    mergeRight(node) {
        const nodeID = node.graphicID;
        const parent = node.parent;
        const parentID = parent.graphicID;
        const parentIndex = this.getParentIndex(node);
        const rightSib = parent.children[parentIndex + 1];
        this.cmd("SetText", this.messageID, ["Merging nodes:", `${node} + [${parent.labels[parentIndex]}] + ${rightSib}`]);
        this.cmd("SetHighlight", nodeID, 1);
        this.cmd("SetHighlight", parentID, 1);
        this.cmd("SetHighlight", rightSib.graphicID, 1);
        this.cmd("Step");

        node.x = (node.x + rightSib.x) / 2;
        this.cmd("SetPosition", nodeID, node.x, node.y);

        const fromParentIndex = node.numLabels();
        const moveLabelID = this.nextIndex++;
        if (!node.isBPlusLeaf()) {
            this.cmd("CreateLabel", moveLabelID, parent.labels[parentIndex], this.getLabelX(parent, parentIndex), parent.y);
            this.cmd("SetForegroundColor", moveLabelID, this.FOREGROUND_COLOR);
            node.labels[node.numLabels()] = parent.labels[parentIndex];
        }
        this.cmd("SetNumElements", nodeID, node.numLabels() + rightSib.numLabels());

        node.labels.push(...rightSib.labels);
        for (let i = 0; i < node.numLabels(); i++) {
            this.cmd("SetText", nodeID, node.labels[i], i);
        }
        if (!node.isLeaf()) {
            node.children.push(...rightSib.children);
            for (let i = 0; i < node.numChildren(); i++) {
                const child = node.children[i];
                child.parent = node;
                this.cmd("Connect", nodeID, child.graphicID, this.FOREGROUND_COLOR, 0, false, "", i);
            }
        } else if (node.isBPlusLeaf()) {
            node.next = rightSib.next;
            if (rightSib.next != null) {
                this.cmd("Connect", nodeID, node.next.graphicID, this.FOREGROUND_COLOR, 0, true, "", node.numLabels());
            }
        }

        parent.labels.splice(parentIndex, 1);
        parent.children.splice(parentIndex + 1, 1);
        this.cmd("SetNumElements", parentID, parent.numLabels());
        for (let i = 0; i < parent.numLabels(); i++) {
            this.cmd("SetText", parentID, parent.labels[i], i);
        }
        for (let i = 0; i < parent.numChildren(); i++) {
            this.cmd("Disconnect", parentID, parent.children[i].graphicID);
            this.cmd("Connect", parentID, parent.children[i].graphicID, this.FOREGROUND_COLOR, 0, false, "", i);
        }

        this.cmd("SetHighlight", nodeID, 0);
        this.cmd("SetHighlight", parentID, 0);
        rightSib.parent = rightSib.children = null;
        this.removeTreeNode(rightSib);
        if (!node.isBPlusLeaf()) {
            this.cmd("Move", moveLabelID, this.getLabelX(node, fromParentIndex), node.y);
            this.cmd("Step");
            this.cmd("SetText", nodeID, node.labels[fromParentIndex], fromParentIndex);
            this.cmd("Delete", moveLabelID);
        }
        this.nextIndex--;
        this.cmd("SetText", this.messageID, "");
        return node;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Steal from sibling

    stealFromRight(node, parentIndex) {
        const nodeID = node.graphicID;
        const parent = node.parent;
        const parentID = parent.graphicID;
        const rightSib = parent.children[parentIndex + 1];
        this.cmd("SetHighlight", nodeID, 1);
        this.cmd("SetHighlight", parentID, 1);
        this.cmd("SetHighlight", rightSib.graphicID, 1);

        let leftLabel = parent.labels[parentIndex];
        let leftLabelX = this.getLabelX(parent, parentIndex);
        let leftLabelY = parent.y;
        let rightLabel = rightSib.labels[0];
        let rightLabelX = this.getLabelX(rightSib, 0);
        const rightLabelY = rightSib.y;
        if (node.isBPlusLeaf()) {
            leftLabel = rightLabel;
            leftLabelX = rightLabelX;
            leftLabelY = rightLabelY;
            rightLabel = rightSib.labels[1];
            rightLabelX = this.getLabelX(rightSib, 1);
        }
        this.cmd("SetText", this.messageID, [
            "Stealing from right sibling:",
            `${node} ← [${leftLabel}] ← [${rightLabel}] / ${node.isBPlusLeaf()}`,
        ]);
        this.cmd("Step");

        if (node.isBPlusLeaf()) {
            this.cmd("Disconnect", nodeID, rightSib.graphicID);
            this.cmd("Connect", nodeID, rightSib.graphicID, this.FOREGROUND_COLOR, 0, true, "", node.numLabels() + 1);
        }

        node.labels.push(leftLabel);
        parent.labels[parentIndex] = rightLabel;
        rightSib.labels.shift();

        const leftLabelID = this.nextIndex++;
        const rightLabelID = this.nextIndex++;
        this.cmd("CreateLabel", leftLabelID, leftLabel, leftLabelX, leftLabelY);
        this.cmd("CreateLabel", rightLabelID, rightLabel, rightLabelX, rightLabelY);
        this.cmd("SetForegroundColor", leftLabelID, this.FOREGROUND_COLOR);
        this.cmd("SetForegroundColor", rightLabelID, this.FOREGROUND_COLOR);

        this.cmd("SetNumElements", nodeID, node.numLabels());
        this.cmd("SetText", nodeID, "", node.numLabels() - 1);
        this.cmd("SetText", parentID, "", parentIndex);
        this.cmd("SetText", rightSib.graphicID, "", 0);

        if (!rightSib.isLeaf()) {
            const moveChild = rightSib.children.shift();
            node.children.push(moveChild);
            moveChild.parent = node;
            this.cmd("Disconnect", rightSib.graphicID, moveChild.graphicID);
            this.cmd("Connect", nodeID, moveChild.graphicID, this.FOREGROUND_COLOR, 0, false, "", node.numLabels());
            for (let i = 0; i < rightSib.numChildren(); i++) {
                const child = rightSib.children[i];
                this.cmd("Disconnect", rightSib.graphicID, child.graphicID);
                this.cmd("Connect", rightSib.graphicID, child.graphicID, this.FOREGROUND_COLOR, 0, false, "", i);
            }
        }

        this.cmd("Move", leftLabelID, this.getLabelX(node, node.numLabels() - 1), node.y);
        this.cmd("Move", rightLabelID, this.getLabelX(parent, parentIndex), parent.y);
        this.cmd("Step");
        this.cmd("Delete", leftLabelID);
        this.cmd("Delete", rightLabelID);
        this.nextIndex -= 2;

        this.cmd("SetText", nodeID, leftLabel, node.numLabels() - 1);
        this.cmd("SetText", parentID, rightLabel, parentIndex);
        this.cmd("SetNumElements", rightSib.graphicID, rightSib.numLabels());
        for (let i = 0; i < rightSib.numLabels(); i++) {
            this.cmd("SetText", rightSib.graphicID, rightSib.labels[i], i);
        }

        if (node.isBPlusLeaf() && rightSib.next) {
            this.cmd("Disconnect", rightSib.graphicID, rightSib.next.graphicID);
            this.cmd("Connect", rightSib.graphicID, rightSib.next.graphicID, this.FOREGROUND_COLOR, 0, true, "", rightSib.numLabels());
        }

        this.cmd("Step");
        this.cmd("SetHighlight", nodeID, 0);
        this.cmd("SetHighlight", parentID, 0);
        this.cmd("SetHighlight", rightSib.graphicID, 0);
        this.resizeTree();
        this.cmd("SetText", this.messageID, "");
        return node;
    }

    stealFromLeft(node, parentIndex) {
        parentIndex--;
        const nodeID = node.graphicID;
        const parent = node.parent;
        const parentID = parent.graphicID;
        const leftSib = parent.children[parentIndex];
        this.cmd("SetHighlight", nodeID, 1);
        this.cmd("SetHighlight", parentID, 1);
        this.cmd("SetHighlight", leftSib.graphicID, 1);

        let rightLabel = parent.labels[parentIndex];
        let rightLabelX = this.getLabelX(parent, parentIndex);
        let rightLabelY = parent.y;
        const leftLabel = leftSib.labels[leftSib.numLabels() - 1];
        const leftLabelX = this.getLabelX(leftSib, leftSib.numLabels() - 1);
        const leftLabelY = leftSib.y;
        if (node.isBPlusLeaf()) {
            rightLabel = leftLabel;
            rightLabelX = leftLabelX;
            rightLabelY = leftLabelY;
        }
        this.cmd("SetText", this.messageID, ["Stealing from left sibling:", `[${leftLabel}] → [${rightLabel}] → ${node}`]);
        this.cmd("Step");

        if (!node.isLeaf()) {
            const moveChild = leftSib.children.pop();
            node.children.unshift(moveChild);
            moveChild.parent = node;
            this.cmd("Disconnect", leftSib.graphicID, moveChild.graphicID);
            this.cmd("Connect", nodeID, moveChild.graphicID, this.FOREGROUND_COLOR, 0, false, "", 0);
            for (let i = 0; i < node.numChildren(); i++) {
                const child = node.children[i];
                this.cmd("Disconnect", nodeID, child.graphicID);
                this.cmd("Connect", nodeID, child.graphicID, this.FOREGROUND_COLOR, 0, false, "", i);
            }
        }

        node.labels.unshift(rightLabel);
        parent.labels[parentIndex] = leftLabel;
        leftSib.labels.pop();

        const rightLabelID = this.nextIndex++;
        const leftLabelID = this.nextIndex++;
        this.cmd("CreateLabel", rightLabelID, rightLabel, rightLabelX, rightLabelY);
        this.cmd("CreateLabel", leftLabelID, leftLabel, leftLabelX, leftLabelY);
        this.cmd("SetForegroundColor", rightLabelID, this.FOREGROUND_COLOR);
        this.cmd("SetForegroundColor", leftLabelID, this.FOREGROUND_COLOR);

        if (node.isBPlusLeaf()) {
            this.cmd("Disconnect", nodeID, node.next.graphicID);
            this.cmd("Connect", nodeID, node.next.graphicID, this.FOREGROUND_COLOR, 0, true, "", node.numLabels());
        }

        this.cmd("SetNumElements", nodeID, node.numLabels());
        this.cmd("SetText", nodeID, "", 0);
        this.cmd("SetText", parentID, "", parentIndex);
        this.cmd("SetText", leftSib.graphicID, "", leftSib.numLabels());

        this.cmd("Move", rightLabelID, this.getLabelX(node, 0), node.y);
        this.cmd("Move", leftLabelID, this.getLabelX(parent, parentIndex), parent.y);
        this.cmd("Step");
        this.cmd("Delete", rightLabelID);
        this.cmd("Delete", leftLabelID);
        this.nextIndex -= 2;

        this.cmd("SetText", nodeID, rightLabel, 0);
        this.cmd("SetText", parentID, leftLabel, parentIndex);
        this.cmd("SetNumElements", leftSib.graphicID, leftSib.numLabels());
        for (let i = 0; i < node.numLabels(); i++) {
            this.cmd("SetText", nodeID, node.labels[i], i);
        }

        if (node.isBPlusLeaf()) {
            this.cmd("Disconnect", leftSib.graphicID, nodeID);
            this.cmd("Connect", leftSib.graphicID, nodeID, this.FOREGROUND_COLOR, 0, true, "", leftSib.numLabels());
        }

        this.cmd("Step");
        this.cmd("SetHighlight", nodeID, 0);
        this.cmd("SetHighlight", parentID, 0);
        this.cmd("SetHighlight", leftSib.graphicID, 0);
        this.resizeTree();
        this.cmd("SetText", this.messageID, "");
        return node;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Delete using preemptive split/merge

    doDeleteTopdown(node, value) {
        if (!node) return;
        if (node === this.treeRoot) {
            this.cmd("SetText", this.messageID, `Deleting ${value} using preemptive split/merge`);
            this.cmd("Step");
        }
        const nodeID = node.graphicID;
        let i = 0;
        while (i < node.numLabels() && this.compare(node.labels[i], value) < 0) {
            i++;
        }

        if (node.isLeaf()) {
            this.cmd("SetHighlight", nodeID, 1);
            this.cmd("SetTextColor", nodeID, this.HIGHLIGHT_COLOR, i);
            this.cmd("Step");
            this.cmd("SetTextColor", nodeID, this.FOREGROUND_COLOR, i);
            this.cmd("SetHighlight", nodeID, 0);
            for (let j = i; j < node.numLabels() - 1; j++) {
                node.labels[j] = node.labels[j + 1];
                this.cmd("SetText", nodeID, node.labels[j], j);
            }
            node.labels.pop();
            this.cmd("SetText", nodeID, "", node.numLabels());
            this.cmd("SetNumElements", nodeID, node.numLabels());
            this.resizeTree();
            this.cmd("SetText", this.messageID, "");
            return;
        }

        if (i === node.numLabels()) {
            this.cmd("SetHighlight", nodeID, 1);
            this.cmd("SetEdgeHighlight", nodeID, node.getRight().graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", nodeID, 0);
            this.cmd("SetEdgeHighlight", nodeID, node.getRight().graphicID, 0);
            if (node.getRight().numLabels() === this.getMinKeys()) {
                if (node.children[node.numLabels() - 1].numLabels() > this.getMinKeys()) {
                    const nextNode = this.stealFromLeft(node.getRight(), node.numLabels() - 1);
                    this.doDeleteTopdown(nextNode, value);
                } else {
                    const nextNode = this.mergeRight(node.children[node.numLabels() - 1]);
                    this.doDeleteTopdown(nextNode, value);
                }
            } else {
                this.doDeleteTopdown(node.getRight(), value);
            }
            return;
        }

        if (this.compare(node.labels[i], value) > 0) {
            this.cmd("SetHighlight", nodeID, 1);
            this.cmd("SetEdgeHighlight", nodeID, node.children[i].graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", nodeID, 0);
            this.cmd("SetEdgeHighlight", nodeID, node.children[i].graphicID, 0);
            if (node.children[i].numLabels() > this.getMinKeys()) {
                this.doDeleteTopdown(node.children[i], value);
            } else if (node.children[i + 1].numLabels() > this.getMinKeys()) {
                const nextNode = this.stealFromRight(node.children[i], i);
                this.doDeleteTopdown(nextNode, value);
            } else {
                const nextNode = this.mergeRight(node.children[i]);
                this.doDeleteTopdown(nextNode, value);
            }
            return;
        }

        this.cmd("SetHighlight", nodeID, 1);
        this.cmd("SetTextColor", nodeID, this.HIGHLIGHT_COLOR, i);
        this.cmd("Step");
        this.cmd("SetText", this.messageID, ["Checking to see if tree to left of", "element to delete has an extra key"]);
        this.cmd("SetEdgeHighlight", nodeID, node.children[i].graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", nodeID, node.children[i].graphicID, 0);
        let maxNode = node.children[i];

        if (node.children[i].numLabels() === this.getMinKeys()) {
            this.cmd("SetText", this.messageID, [
                "Tree to left of element to delete does not have an extra key.",
                "Looking to the right ...",
            ]);
            this.cmd("SetEdgeHighlight", nodeID, node.children[i + 1].graphicID, 1);
            this.cmd("Step");
            this.cmd("SetEdgeHighlight", nodeID, node.children[i + 1].graphicID, 0);
            // Trees to left and right of node to delete don't have enough keys
            // Do a merge, and then recursively delete the element
            if (node.children[i + 1].numLabels() === this.getMinKeys()) {
                this.cmd("SetText", this.messageID, [
                    "Neither subtree has extra nodes. Merging around the key to delete,",
                    "and recursively deleting ...",
                ]);
                this.cmd("Step");
                this.cmd("SetTextColor", nodeID, this.FOREGROUND_COLOR, i);
                const nextNode = this.mergeRight(node.children[i]);
                this.doDeleteTopdown(nextNode, value);
                return;
            } else {
                this.cmd("SetText", this.messageID, [
                    "Tree to right of element to delete does have an extra key.",
                    "Finding the smallest key in that subtree ...",
                ]);
                this.cmd("Step");

                let minNode = node.children[i + 1];
                while (!minNode.isLeaf()) {
                    this.cmd("SetHighlight", minNode.graphicID, 1);
                    this.cmd("Step");
                    this.cmd("SetHighlight", minNode.graphicID, 0);
                    if (minNode.getLeft().numLabels() === this.getMinKeys()) {
                        if (minNode.children[1].numLabels() === this.getMinKeys()) {
                            minNode = this.mergeRight(minNode.getLeft());
                        } else {
                            minNode = this.stealFromRight(minNode.getLeft(), 0);
                        }
                    } else {
                        minNode = minNode.getLeft();
                    }
                }

                this.cmd("SetHighlight", minNode.graphicID, 1);
                node.labels[i] = minNode.labels[0];
                this.cmd("SetTextColor", nodeID, this.FOREGROUND_COLOR, i);
                this.cmd("SetText", nodeID, "", i);
                this.cmd("SetText", minNode.graphicID, "", 0);

                const moveLabelID = this.nextIndex++;
                this.cmd("CreateLabel", moveLabelID, minNode.labels[0], this.getLabelX(minNode, 0), minNode.y);
                this.cmd("Move", moveLabelID, this.getLabelX(node, i), node.y);
                this.cmd("Step");
                this.cmd("Delete", moveLabelID);
                this.nextIndex--;
                this.cmd("SetText", nodeID, node.labels[i], i);
                for (let j = 1; j < minNode.numLabels(); j++) {
                    minNode.labels[j - 1] = minNode.labels[j];
                    this.cmd("SetText", minNode.graphicID, minNode.labels[j - 1], j - 1);
                }
                this.cmd("SetText", minNode.graphicID, "", minNode.numLabels() - 1);

                minNode.labels.pop();
                this.cmd("SetHighlight", minNode.graphicID, 0);
                this.cmd("SetHighlight", nodeID, 0);

                this.cmd("SetNumElements", minNode.graphicID, minNode.numLabels());
                this.resizeTree();
                this.cmd("SetText", this.messageID, "");
            }
        } else {
            this.cmd("SetText", this.messageID, [
                "Tree to left of element to delete does have an extra key.",
                "Finding the largest key in that subtree ...",
            ]);
            this.cmd("Step");
            while (!maxNode.isLeaf()) {
                this.cmd("SetHighlight", maxNode.graphicID, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", maxNode.graphicID, 0);
                if (maxNode.getRight().numLabels() === this.getMinKeys()) {
                    if (maxNode.children[maxNode.numLabels() - 1] > this.getMinKeys()) {
                        maxNode = this.stealFromLeft(maxNode.getRight(), maxNode.numLabels() - 1);
                    } else {
                        maxNode = this.mergeRight(maxNode.children[maxNode.numLabels() - 1]);
                    }
                } else {
                    maxNode = maxNode.getRight();
                }
            }
            this.cmd("SetHighlight", maxNode.graphicID, 1);
            node.labels[i] = maxNode.labels[maxNode.numLabels() - 1];
            this.cmd("SetTextColor", nodeID, this.FOREGROUND_COLOR, i);
            this.cmd("SetText", nodeID, "", i);
            this.cmd("SetText", maxNode.graphicID, "", maxNode.numLabels() - 1);
            const moveLabelID = this.nextIndex++;
            this.cmd("CreateLabel", moveLabelID, node.labels[i], this.getLabelX(maxNode, maxNode.numLabels() - 1), maxNode.y);
            this.cmd("Move", moveLabelID, this.getLabelX(node, i), node.y);
            this.cmd("Step");
            this.cmd("Delete", moveLabelID);
            this.nextIndex--;
            this.cmd("SetText", nodeID, node.labels[i], i);
            maxNode.labels.pop();
            this.cmd("SetHighlight", maxNode.graphicID, 0);
            this.cmd("SetHighlight", nodeID, 0);

            this.cmd("SetNumElements", maxNode.graphicID, maxNode.numLabels());
            this.resizeTree();
            this.cmd("SetText", this.messageID, "");
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Validate the tree

    validateTree() {
        if (!this.treeRoot) return;
        super.validateTree();
        this.validateBTree(this.treeRoot, null, Number.MIN_SAFE_INTEGER);
    }

    validateBTree(node, parent, cmpVal) {
        if (!node) return [cmpVal, 0];
        if (!(node instanceof this.BTreeNode)) console.error("Not a B-tree node:", node);
        if (!node.graphicID) console.error("Tree node missing ID:", node);
        if (!(node.parent === parent || (!node.parent && !parent))) console.error("Parent mismatch:", node, parent);
        if (node.labels.length !== node.numLabels()) console.error("N:o labels mismatch", node);
        if (node.numLabels() === 0) console.error("Empty tree node", node);
        if (node.numLabels() >= this.getMaxDegree()) console.error(`Too high degree, ${node.numLabels() + 1} > ${this.getMaxDegree()}`, node);

        let height = 0;
        if (node.isLeaf()) {
            if (node.children) console.error("Leaf node has children", node);
            for (let i = 0; i < node.numLabels(); i++) {
                const val = node.labels[i];
                if (this.compare(cmpVal, val) > 0) console.error(`Order mismatch, ${cmpVal} > ${val}`, node);
                cmpVal = val;
            }
        } else {
            if (node.numLabels() + 1 !== node.numChildren()) console.error(`N:o children mismatch, ${node.numLabels()} + 1 != ${node.numChildren()}`, node);
            for (let i = 0; i <= node.numLabels(); i++) {
                const child = node.children[i];
                if (!child) console.error(`Null child n:o ${i}`, node);
                let childHeight;
                [cmpVal, childHeight] = this.validateBTree(child, node, cmpVal);
                if (height && childHeight !== height) console.error(`Height mismatch, ${height} != ${childHeight}`, node);
                height = childHeight;
                if (i < node.numLabels()) {
                    const val = node.labels[i];
                    if (this.compare(cmpVal, val) > 0) console.error(`Order mismatch, ${cmpVal} > ${val}`, node);
                    cmpVal = val;
                }
            }
        }
        return [cmpVal, height + 1];
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Resize the tree

    resizeWidths(node) {
        if (!node) return 0;
        let left = 0, right = 0;
        node.childWidths = 0;
        node.width = node.numLabels() * this.WIDTH_PER_ELEM;
        if (!node.isLeaf()) {
            for (const child of node.getChildren()) {
                node.childWidths += this.resizeWidths(child);
            }
            node.width = Math.max(node.width, node.childWidths + node.numLabels() * this.getSpacingX());
            left = node.getLeft().leftWidth || 0;
            right = node.getRight().rightWidth || 0;
        }
        const mid = node.width - left - right;
        node.leftWidth = mid / 2 + left;
        node.rightWidth = mid / 2 + right;
        return node.width;
    }

    setNewPositions(node, x, y) {
        node.y = y;
        node.x = x;
        if (node.isLeaf()) return;
        x -= node.leftWidth;
        const spacing = (node.width - node.childWidths) / node.numLabels();
        const nextY = y + this.NODE_HEIGHT + this.getSpacingY();
        for (const child of node.getChildren()) {
            this.setNewPositions(child, x + child.leftWidth, nextY);
            x += child.width + spacing;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Manipulate tree nodes

    createTreeNode(elemID, x, y, value) {
        const node = new this.BTreeNode(elemID, x, y, [value]);
        this.cmd(
            "CreateBTreeNode", elemID, this.WIDTH_PER_ELEM, this.NODE_HEIGHT,
            1, x, y, this.BACKGROUND_COLOR, this.FOREGROUND_COLOR,
        );
        this.cmd("SetText", elemID, value, 0);
        return node;
    }

    removeTreeNode(node) {
        this.cmd("Delete", node.graphicID);
    }

    isTreeNode(node) {
        return node instanceof this.BTreeNode;
    }

    getParentIndex(node) {
        if (!node.parent) return null;
        for (let i = 0; i < node.parent.numChildren(); i++) {
            if (node.parent.children[i] === node) return i;
        }
        return null;
    }

    getLabelX(node, index) {
        return node.x + this.WIDTH_PER_ELEM * (index + (1 - node.numLabels()) / 2);
    }

    BTreeNode = class BTreeNode {
        constructor(id, x, y, labels = 0) {
            this.graphicID = id;
            this.x = x;
            this.y = y;
            this.width = 0;
            this.parent = null;
            if (typeof labels == "number") labels = new Array(labels);
            this.labels = labels;
            this.children = null;
            for (let i = 0; i < this.labels.length; i++) {
                if (this.labels[i] == null) this.labels[i] = "";
            }
        }

        getValue() {
            return this.labels.join(" ");
        }

        toString() {
            return `[${this.getValue()}]`;
        }

        deepString() {
            if (this.isLeaf()) return this.toString();
            let s = this.children[0];
            for (let i = 0; i < this.numLabels(); i++) {
                s += ` ${this.labels[i]} ${this.children[i + 1].deepString()}`;
            }
            return `(${s})`;
        }

        numLabels() {
            return this.labels.length;
        }

        numChildren() {
            return this.children?.length || 0;
        }

        getChildren() {
            return this.children || [];
        }

        isLeaf() {
            return this.children == null;
        }

        isBPlusLeaf() {
            return this.isLeaf() && "next" in this;
        }

        getLeft() {
            return this.children[0];
        }

        getRight() {
            return this.children[this.children.length - 1];
        }

        getOrdinal(i) {
            const n = this.numChildren();
            if (n === 1) {
                return "only";
            } else if (n <= 3) {
                return (
                    i === 0 ? "left" :
                    i === n - 1 ? "right" :
                    "middle"
                );
            } else {
                return (
                    i === 0 ? "first" :
                    i === 1 ? "second" :
                    i === n - 1 ? "last" :
                    `${i}rd`
                );
            }
        }
    };
};

Algorithm.Tree.TwoThreeTree = class TwoThreeTree extends Algorithm.Tree.BTree {
    MAX_DEGREES = null;
    INITIAL_MAX_DEGREE = 3;
    USE_PREEMPTIVE_SPLIT = false;

    constructor(am) {
        super();
        if (am) this.init(am);
    }
};
