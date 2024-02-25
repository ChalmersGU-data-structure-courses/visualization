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
///////////////////////////////////////////////////////////////////////////////


Algorithm.Tree.Splay = class SplayTree extends Algorithm.Tree.BST {

    ///////////////////////////////////////////////////////////////////////////////
    // After finding or inserting we splay the last visited node up to the top

    postFind(found, node) {
        this.splayUp(node);
    }

    postInsert(found, node) {
        this.splayUp(node);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Deleting a value from the tree

    deleteAction(value) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Finding ${value} and splaying to rooot`);
        this.cmd("Step");
        const [found, node] = this.doFind(value, this.treeRoot);
        this.postFind(found, node);
        if (found) this.doDeleteRoot();
        this.validateTree();
        return this.commands;
    }

    doDeleteRoot() {
        this.cmd("SetText", this.messageID, "Removing root, leaving left and right trees");
        this.cmd("Step");
        if (!this.treeRoot.right) {
            this.cmd("SetText", this.messageID, "No right tree, make left tree the root");
            this.cmd("Delete", this.treeRoot.graphicID);
            this.cmd("Step");
            this.treeRoot = this.treeRoot.left;
            this.treeRoot.parent = null;
        } else if (!this.treeRoot.left) {
            this.cmd("SetText", this.messageID, "No left tree, make right tree the root");
            this.cmd("Delete", this.treeRoot.graphicID);
            this.cmd("Step");
            this.treeRoot = this.treeRoot.right;
            this.treeRoot.parent = null;
        } else {
            this.cmd("SetText", this.messageID, "Splay largest element in left tree to root");
            const right = this.treeRoot.right;
            const left = this.treeRoot.left;
            const oldGraphicID = this.treeRoot.graphicID;
            this.cmd("Disconnect", oldGraphicID, left.graphicID);
            this.cmd("Disconnect", oldGraphicID, right.graphicID);
            this.cmd("SetAlpha", oldGraphicID, 0);
            this.cmd("Step");

            left.parent = null;
            const largestLeft = this.findMax(left);
            this.splayUp(largestLeft);
            this.cmd("SetText", this.messageID, "Left tree now has no right subtree, connect left and right trees");
            this.cmd("Step");
            this.cmd("Connect", largestLeft.graphicID, right.graphicID, this.LINK_COLOR);
            largestLeft.parent = null;
            largestLeft.right = right;
            right.parent = largestLeft;
            this.treeRoot = largestLeft;
            this.cmd("Delete", oldGraphicID);
        }
        this.resizeTree();
    }

    findMax(tree) {
        if (!tree.right) return tree;
        this.cmd("SetAlpha", this.highlightID, 1);
        this.cmd("SetPosition", this.highlightID, tree.x, tree.y);
        this.cmd("Step");
        while (tree.right) {
            tree = tree.right;
            this.cmd("Move", this.highlightID, tree.x, tree.y);
            this.cmd("Step");
        }
        this.cmd("SetAlpha", this.highlightID, 0);
        return tree;
    }

    splayUp(node) {
        if (!node.parent) return;
        if (node.isLeftChild()) {
            if (!node.parent.parent) {
                this.singleRotateRight(node.parent);
            } else if (node.parent.isRightChild()) {
                this.doubleRotateLeft(node.parent.parent);
                this.splayUp(node);
            } else {
                this.zigZigRight(node.parent.parent);
                this.splayUp(node);
            }
        } else { // node.isRightChild()
            if (!node.parent.parent) {
                this.singleRotateLeft(node.parent);
            } else if (node.parent.isLeftChild()) {
                this.doubleRotateRight(node.parent.parent);
                this.splayUp(node);
            } else {
                this.zigZigLeft(node.parent.parent);
                this.splayUp(node);
            }
        }
    }
};
