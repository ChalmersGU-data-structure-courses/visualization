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


Algorithm.Tree.BST = class BST extends Algorithm.Tree {

    ///////////////////////////////////////////////////////////////////////////////
    // Printing the values in the tree

    doPrint(tree) {
        this.cmd("Move", this.highlightID, tree.x, tree.y);
        this.cmd("Step");
        if (tree.left) {
            this.doPrint(tree.left);
            this.cmd("Move", this.highlightID, tree.x, tree.y);
            this.cmd("Step");
        }

        const nextLabelID = this.nextIndex++;
        this.cmd("CreateLabel", nextLabelID, tree.data, tree.x, tree.y);
        this.cmd("SetForegroundColor", nextLabelID, this.PRINT_COLOR);
        this.cmd("Move", nextLabelID, this.printPosX, this.printPosY);
        this.cmd("Step");
        this.printPosX += this.PRINT_HORIZONTAL_GAP;
        if (this.printPosX > this.getCanvasWidth() - this.PRINT_HORIZONTAL_GAP) {
            this.printPosX = this.FIRST_PRINT_POS_X;
            this.printPosY += this.PRINT_VERTICAL_GAP;
        }

        if (tree.right) {
            this.doPrint(tree.right);
            this.cmd("Move", this.highlightID, tree.x, tree.y);
            this.cmd("Step");
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Deleting the tree

    doClear(tree) {
        for (const child of [tree.left, tree.right]) {
            if (child) {
                this.doClear(child);
            }
        }
        this.removeTreeNode(tree);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Finding a value in the tree

    doFind(value, tree) {
        if (!tree) return false;
        this.cmd("SetHighlight", tree.graphicID, 1);
        const cmp = this.compare(value, tree.data);

        if (cmp === 0) {
            this.cmd("SetText", this.messageID, `${value} = ${tree.data}: Element found`);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            return [true, tree];
        }

        const cmpStr = cmp < 0 ? "<" : ">";
        const dirStr = cmp < 0 ? "left" : "right";
        const child = cmp < 0 ? tree.left : tree.right;
        if (child) {
            this.cmd("SetText", this.messageID, `${value} ${cmpStr} ${tree.data}: Look into ${dirStr} child`);
            this.cmd("SetEdgeHighlight", tree.graphicID, child.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, tree.x, tree.y);
            this.cmd("Move", this.highlightID, child.x, child.y);
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("SetEdgeHighlight", tree.graphicID, child.graphicID, 0);
            this.cmd("SetText", this.messageID, "");
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
            return this.doFind(value, child);
        } else {
            this.cmd("SetText", this.messageID, `${value} ${cmpStr} ${tree.data}: Element not found`);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            return [false, tree];
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Inserting one or more values into the tree

    doInsert(elem, tree) {
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("SetHighlight", elem.graphicID, 1);
        const value = elem.data;
        const cmp = this.compare(value, tree.data);
        if (cmp === 0 && !this.ALLOW_DUPLICATES) {
            this.cmd("SetText", this.messageID, `${value} = ${tree.data}: Element already exists`);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.removeTreeNode(elem);
            return [false, tree];
        }

        const cmpStr = cmp === 0 ? "=" : cmp < 0 ? "<" : ">";
        const dirStr = cmp < 0 ? "left" : "right";
        const child = cmp < 0 ? tree.left : tree.right;
        let inserted = true, node = elem;
        if (child) {
            this.cmd("SetText", this.messageID, `${value} ${cmpStr} ${tree.data}: Look into ${dirStr} child`);
            this.cmd("SetEdgeHighlight", tree.graphicID, child.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, tree.x, tree.y);
            this.cmd("Move", this.highlightID, child.x, child.y);
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("SetEdgeHighlight", tree.graphicID, child.graphicID, 0);
            this.cmd("SetText", this.messageID, "");
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
            [inserted, node] = this.doInsert(elem, child);
            this.resizeTree();
        } else {
            this.cmd("SetText", this.messageID, `${value} ${cmpStr} ${tree.data}: Inserting element as ${dirStr} child`);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("SetHighlight", elem.graphicID, 0);
            this.cmd("Connect", tree.graphicID, elem.graphicID, this.LINK_COLOR);
            if (cmp < 0) tree.left = elem;
            else tree.right = elem;
            elem.parent = tree;
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, elem.x, elem.y);
            this.resizeTree();
            this.cmd("Move", this.highlightID, elem.x, elem.y);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
        }
        // Rebalancing is not done by BSTs, but by other data structures such as AVL trees:
        this.rebalance(tree, cmp);
        return [inserted, node];
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Deleting a value from the tree

    doDelete(value, tree) {
        if (!tree) {
            this.cmd("SetText", this.messageID, `Element ${value} not found, could not delete`);
            this.cmd("Step");
            return [false, tree];
        }
        const cmp = this.compare(value, tree.data);

        if (cmp === 0) {
            this.cmd("SetText", this.messageID, `${value} = ${tree.data}: Found node to delete`);
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            return this.doDeleteNode(tree);
        }

        const cmpStr = cmp < 0 ? "<" : ">";
        const dirStr = cmp < 0 ? "left" : "right";
        const child = cmp < 0 ? tree.left : tree.right;
        this.cmd("SetText", this.messageID, `${value} ${cmpStr} ${tree.data}: Look into ${dirStr} child`);
        if (child) {
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("SetEdgeHighlight", tree.graphicID, child.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, tree.x, tree.y);
            this.cmd("Move", this.highlightID, child.x, child.y);
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("SetEdgeHighlight", tree.graphicID, child.graphicID, 0);
            this.cmd("SetText", this.messageID, "");
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
        }
        let [deleted, node] = this.doDelete(value, child);
        if (!node) node = tree;
        // Rebalancing is not done by BSTs, but by other data structures such as AVL trees:
        this.rebalance(tree, cmp);
        return [deleted, node];
    }

    doDeleteNode(tree) {
        if (!tree.left && !tree.right) {
            this.cmd("SetText", this.messageID, `Node ${tree.data} is a leaf: We can delete it`);
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.removeTreeNode(tree);
            const parent = tree.parent;
            if (parent) {
                tree.reassignParent(null);
                tree.parent = null;
            } else {
                this.treeRoot = null;
            }
            return [true, parent];
        }

        if (!(tree.left && tree.right)) {
            const child = tree.left || tree.right;
            this.cmd("SetText", this.messageID, `Node ${tree.data} has only one child ${child.data} - replace it with its child`);
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, tree.x, tree.y);
            this.cmd("Step");
            if (tree.parent) {
                this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                this.cmd("Connect", tree.parent.graphicID, child.graphicID, this.LINK_COLOR);
                tree.reassignParent(child);
            } else {
                this.treeRoot = child;
            }
            child.parent = tree.parent;
            this.removeTreeNode(tree);
            this.cmd("SetPosition", this.highlightID, child.x, child.y);
            this.resizeTree();
            this.cmd("Move", this.highlightID, child.x, child.y);
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
            return [true, child];
        }

        let prenode = tree.left;
        this.cmd("SetText", this.messageID, `Node has two children, ${prenode.data} and ${tree.right.data} - find rightmost node in left subtree`);
        this.cmd("SetAlpha", this.highlightID, 1);
        this.cmd("SetPosition", this.highlightID, tree.x, tree.y);
        this.cmd("SetHighlight", tree.graphicID, 1);
        while (true) {
            this.cmd("Move", this.highlightID, prenode.x, prenode.y);
            this.cmd("Step");
            if (!prenode.right) break;
            prenode = prenode.right;
        }
        const labelID = this.nextIndex++;
        this.cmd("CreateLabel", labelID, prenode.data, prenode.x, prenode.y);
        this.cmd("SetForegroundColor", labelID, this.FOREGROUND_COLOR);
        tree.data = prenode.data;
        this.cmd("SetText", tree.graphicID, "");
        this.cmd("SetText", prenode.graphicID, "");
        this.cmd("Move", labelID, tree.x, tree.y);
        this.cmd("Move", this.highlightID, tree.x, tree.y);
        this.cmd("SetText", this.messageID, `Copy largest value ${prenode.data} of left subtree into node to delete`);
        this.cmd("SetHighlight", tree.graphicID, 0);
        this.cmd("Step");
        this.cmd("Delete", labelID);
        this.cmd("SetText", tree.graphicID, tree.data);
        this.cmd("SetAlpha", this.highlightID, 0);
        this.cmd("SetText", this.messageID, "Remove node whose value we copied");

        let parent = prenode.parent;
        if (prenode.left) {
            this.cmd("Disconnect", parent.graphicID, prenode.graphicID);
            this.cmd("Connect", parent.graphicID, prenode.left.graphicID, this.LINK_COLOR);
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, prenode.left.x, prenode.left.y);
            this.cmd("Step");
            prenode.left.parent = parent;
            prenode.reassignParent(prenode.left);
            this.removeTreeNode(prenode);
            this.resizeTree();
            this.cmd("Move", this.highlightID, prenode.left.x, prenode.left.y);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
        } else {
            prenode.reassignParent(null);
            this.removeTreeNode(prenode);
        }
        // Rebalancing is not done by BSTs, but by other data structures such as AVL trees:
        while (true) {
            if (parent === tree) break;
            this.rebalance(parent, 1);
            parent = parent.parent;
        }
        this.rebalance(tree, -1);
        return [true, tree];
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Rebalancing the tree (do nothing for BSTs)

    rebalance(node, cmp) {
        // BST's are not rebalancing, so do nothing
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Validating the tree

    validateTree() {
        // console.log("Validating tree", this.treeRoot);
        this.validateBST(this.treeRoot, null, Number.MIN_SAFE_INTEGER);
    }

    validateBST(tree, parent, cmpVal) {
        if (!tree) return cmpVal;
        if (!(tree.parent === parent || (!tree.parent && !parent))) {
            console.error("Parent mismatch:", tree, parent);
        }
        if (!tree.graphicID) {
            console.error("Tree node missing ID:", tree);
        }
        if (tree.left) {
            cmpVal = this.validateBST(tree.left, tree, cmpVal);
        }
        if (this.compare(cmpVal, tree.data) > 0) {
            console.error(`Order mismatch, ${cmpVal} > ${tree.data}`, tree);
        }
        if (tree.right) {
            cmpVal = this.validateBST(tree.right, tree, tree.data);
        }
        return cmpVal;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Resizing the tree

    resizeTree(animate = true) {
        if (!this.treeRoot) return;
        this.resizeWidths(this.treeRoot);
        let startingX = this.getStartingX();
        if (this.treeRoot.leftWidth > startingX) {
            startingX = this.treeRoot.leftWidth;
        } else if (this.treeRoot.rightWidth > startingX) {
            startingX = Math.max(this.treeRoot.leftWidth, 2 * startingX - this.treeRoot.rightWidth);
        }
        this.setNewPositions(this.treeRoot, startingX, this.getStartingY());
        const cmd = animate ? "Move" : "SetPosition";
        this.animateNewPositions(this.treeRoot, cmd);
    }

    resizeWidths(tree) {
        if (!tree) return 0;
        tree.width = this.resizeWidths(tree.left) + this.getSpacingX() + this.resizeWidths(tree.right);
        tree.width = Math.max(tree.width, this.NODE_SIZE);
        const left = tree.left?.leftWidth || 0;
        const right = tree.right?.rightWidth || 0;
        const mid = tree.width - left - right;
        tree.leftWidth = mid / 2 + left;
        tree.rightWidth = mid / 2 + right;
        return tree.width;
    }

    setNewPositions(tree, x, y) {
        tree.y = y;
        tree.x = x;
        const nextY = y + this.NODE_SIZE + this.getSpacingY();
        if (tree.left) this.setNewPositions(tree.left, x - tree.leftWidth + tree.left.leftWidth, nextY);
        if (tree.right) this.setNewPositions(tree.right, x + tree.rightWidth - tree.right.rightWidth, nextY);
    }

    animateNewPositions(tree, cmd) {
        if (!tree) return;
        this.animateNewPositions(tree.left, cmd);
        this.animateNewPositions(tree.right, cmd);
        this.cmd(cmd, tree.graphicID, tree.x, tree.y);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Creating and removing tree nodes

    createTreeNode(elemID, x, y, value) {
        const node = new this.TreeNode(elemID, x, y, value);
        this.cmd("CreateCircle", elemID, value, x, y);
        this.cmd("SetWidth", elemID, this.NODE_SIZE);
        this.cmd("SetForegroundColor", elemID, this.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", elemID, this.BACKGROUND_COLOR);
        return node;
    }

    removeTreeNode(node) {
        this.cmd("Delete", node.graphicID);
    }


    TreeNode = class TreeNode {
        constructor(id, x, y, data) {
            this.graphicID = id;
            this.x = x;
            this.y = y;
            this.parent = null;
            this.data = data;
            this.left = null;
            this.right = null;
        }

        reassignParent(newChild) {
            if (this.parent?.left === this) this.parent.left = newChild;
            if (this.parent?.right === this) this.parent.right = newChild;
        }

        isLeftChild() {
            return this.parent?.left === this;
        }

        isRightChild() {
            return this.parent?.right === this;
        }

        deepString() {
            let s = "";
            if (this.left) s += `(${this.left.deepString()}) `;
            s += this.data;
            if (this.right) s += ` (${this.right.deepString()})`;
            return s;
        }
    };
};

