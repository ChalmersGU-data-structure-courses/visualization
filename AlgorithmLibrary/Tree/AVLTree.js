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


Algorithm.Tree.AVL = class AVLTree extends Algorithm.Tree.BST {
    HIGHLIGHT_LABEL_COLOR = "red";
    HEIGHT_LABEL_COLOR = this.FOREGROUND_COLOR;

    LABEL_DISPLACE = this.NODE_SIZE / 2;

    ///////////////////////////////////////////////////////////////////////////////
    // Rebalancing the tree

    rebalance(node, cmp) {
        if (!node) return;
        this.cmd("SetAlpha", this.highlightID, 1);
        const child = cmp < 0 ? node.left : node.right;
        if (child) {
            this.cmd("SetPosition", this.highlightID, child.x, child.y);
            this.cmd("Move", this.highlightID, node.x, node.y);
        } else {
            this.cmd("SetPosition", this.highlightID, node.x, node.y);
        }
        this.cmd("SetText", this.messageID, "Unwinding Recursion");
        this.cmd("Step");

        const height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
        if (height !== node.height) {
            node.height = height;
            this.cmd("SetText", node.labelID, height);
            this.cmd("SetText", this.messageID, "Adjusting height after recursive call");
            this.cmd("SetForegroundColor", node.labelID, this.HIGHLIGHT_LABEL_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", node.labelID, this.HEIGHT_LABEL_COLOR);
        }
        this.cmd("SetAlpha", this.highlightID, 0);

        const leftHeight = this.getHeight(node.left);
        const rightHeight = this.getHeight(node.right);
        if (leftHeight > 1 + rightHeight) {
            if (this.getHeight(node.left.left) >= this.getHeight(node.left.right)) {
                this.singleRotateRight(node);
            } else {
                this.doubleRotateRight(node);
            }
        } else if (rightHeight > 1 + leftHeight) {
            if (this.getHeight(node.right.left) <= this.getHeight(node.right.right)) {
                this.singleRotateLeft(node);
            } else {
                this.doubleRotateLeft(node);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Getting and setting the height

    getHeight(tree) {
        return tree ? tree.height : 0;
    }

    resetHeight(tree) {
        if (!tree) return;
        const newHeight = Math.max(this.getHeight(tree.left), this.getHeight(tree.right)) + 1;
        if (tree.height === newHeight) return;
        tree.height = newHeight;
        this.cmd("SetText", tree.labelID, newHeight);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Validating the tree

    validateTree() {
        super.validateTree();
        this.validateAVL(this.treeRoot);
    }

    validateAVL(tree) {
        if (!tree) return 0;
        if (!tree.labelID) {
            console.error("Tree node missing label ID:", tree);
        }
        const leftHeight = this.validateAVL(tree.left);
        const rightHeight = this.validateAVL(tree.right);
        const height = 1 + Math.max(leftHeight, rightHeight);
        if (height !== this.getHeight(tree)) {
            console.error(`Height mismatch, ${height} != ${this.getHeight(tree)}`, tree);
        }
        if (Math.abs(leftHeight - rightHeight) > 1) {
            console.error(`AVL imbalance, ${leftHeight} != ${rightHeight} +-1`, tree);
        }
        return height;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Resizing the tree

    animateNewPositions(tree, cmd, side = +1) {
        if (!tree) return;
        this.animateNewPositions(tree.left, cmd, -1);
        this.animateNewPositions(tree.right, cmd, +1);
        this.cmd(cmd, tree.graphicID, tree.x, tree.y);
        this.cmd(cmd, tree.labelID, tree.x + side * this.LABEL_DISPLACE, tree.y - this.LABEL_DISPLACE);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Creating and removing tree nodes

    createTreeNode(elemID, x, y, value) {
        const node = super.createTreeNode(elemID, x, y, value);
        node.height = 1;
        node.labelID = this.nextIndex++;
        this.cmd("CreateLabel", node.labelID, 1, x + this.LABEL_DISPLACE, y - this.LABEL_DISPLACE);
        this.cmd("SetForegroundColor", node.labelID, this.HEIGHT_LABEL_COLOR);
        return node;
    }

    removeTreeNode(node) {
        super.removeTreeNode(node);
        this.cmd("Delete", node.labelID);
    }
};
