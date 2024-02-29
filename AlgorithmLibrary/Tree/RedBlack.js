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


Algorithm.Tree.RedBlack = class RedBlackTree extends Algorithm.Tree.BST {
    FOREGROUND_RED = "darkred";
    BACKGROUND_RED = "pink";
    FOREGROUND_BLACK = "black";
    BACKGROUND_BLACK = "lightgrey";
    BACKGROUND_DOUBLE_BLACK = "dimgrey";

    LINK_COLOR = this.FOREGROUND_BLACK;

    NULL_LEAF_SIZE = this.NODE_SIZE / 2;
    NULL_LEAF_ADJUST = (this.NULL_LEAF_SIZE - this.NODE_SIZE) / 2;


    addControls() {
        super.addControls();
        this.addBreakToAlgorithmBar();
        this.showNullLeaves = this.addCheckboxToAlgorithmBar("Show Null Leaves");
        this.showNullLeaves.onclick = this.showNullLeavesCallback.bind(this);
        this.showNullLeaves.checked = false;
    }

    showNullLeavesCallback() {
        this.animationManager.setAllLayers(
            this.showNullLeaves.checked ? [0, 1] : [0],
        );
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Rebalance after insertion

    postInsert(insertResult) {
        this.resizeTree();
        this.fixDoubleRed(insertResult.node);
        if (this.getBlackLevel(this.treeRoot) === 0) {
            this.cmd("SetText", this.messageID, "Root of the tree is red: Color it black");
            this.cmd("Step");
            this.setBlackLevel(this.treeRoot, 1);
        }
    }

    fixDoubleRed(node) {
        if (!node.parent) return;
        if (this.getBlackLevel(node.parent) > 0) return;
        if (!node.parent.parent) return;

        const pibling = node.parent.getSibling();
        if (this.getBlackLevel(pibling) === 0) {
            this.cmd("SetText", this.messageID, ["Node, parent and parent's sibling are all red:", "Push blackness down from grandparent"]);
            this.cmd("Step");
            this.setBlackLevel(pibling, 1);
            this.setBlackLevel(node.parent, 1);
            this.setBlackLevel(pibling.parent, 0);
            this.cmd("Step");
            this.fixDoubleRed(pibling.parent);
            return;
        }

        let side = node.isLeftChild() ? "left" : "right";
        let rotate = node.parent.isLeftChild() ? "left" : "right";
        if (side !== rotate) {
            this.cmd("SetText", this.messageID, `Node is a red ${side} child of a red ${rotate} child: Rotate ${rotate}`);
            this.cmd("Step");
            if (rotate === "right") this.singleRotateRight(node.parent);
            else if (rotate === "left") this.singleRotateLeft(node.parent);
            node = node[rotate];
        }

        side = node.isLeftChild() ? "left" : "right";
        rotate = side === "left" ? "right" : "left";
        this.cmd("SetText", this.messageID, `Node is a red ${side} child of a red ${side} child: Rotate ${rotate}`);
        this.cmd("Step");
        if (rotate === "right") this.singleRotateRight(node.parent.parent);
        else if (rotate === "left") this.singleRotateLeft(node.parent.parent);
        this.setBlackLevel(node.parent, 1);
        this.setBlackLevel(node.parent[rotate], 0);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Rebalance after deletion

    postDelete(deletedResult) {
        const deleted = deletedResult.deleted;
        const node = deletedResult.node;
        const leaf = !this.isTreeNode(deleted.left) && !this.isTreeNode(deleted.right);
        if (leaf) {
            const isLeftChild = !node.left;
            const needFix = this.getBlackLevel(deleted) > 0;
            if (needFix) {
                this.fixNullLeaf(node, isLeftChild);
            } else {
                this.attachNullLeaf(node, isLeftChild);
            }
        } else {
            const needFix = this.getBlackLevel(deleted) > 0 && this.getBlackLevel(node) > 0;
            if (needFix) {
                this.cmd("SetText", this.messageID, "Black node removed: Increasing child's blackness level");
                this.increaseBlackLevel(node);
                this.fixDoubleBlack(node);
            } else if (this.getBlackLevel(node) === 0) {
                this.cmd("SetText", this.messageID, "Color node black");
                this.setBlackLevel(node, 1);
            }
        }
        this.resizeTree();
    }

    fixDoubleBlack(node) {
        if (this.getBlackLevel(node) === 0) return;
        const parent = node.parent;
        if (parent) {
            this.fixDoubleBlackChild(parent, parent.left === node);
        } else {
            this.cmd("SetText", this.messageID, "Double black node is root: Make it single black");
            this.cmd("Step");
            this.setBlackLevel(node, 1);
        }
    }

    fixDoubleBlackChild(parent, isLeftChild) {
        const doubleBlackNode = isLeftChild ? parent.left : parent.right;
        const sibling = isLeftChild ? parent.right : parent.left;
        const dir = isLeftChild ? "left" : "right";
        const sibDir = isLeftChild ? "right" : "left";
        if (this.getBlackLevel(sibling) > 0 && this.getBlackLevel(sibling.left) > 0 && this.getBlackLevel(sibling.right) > 0) {
            this.cmd("SetText", this.messageID, "Double black node has a black sibling with 2 black children: Push up black level");
            this.cmd("Step");
            this.setBlackLevel(sibling, 0);
            if (doubleBlackNode) {
                this.setBlackLevel(doubleBlackNode, 1);
            }
            if (this.getBlackLevel(parent) === 0) {
                this.setBlackLevel(parent, 1);
            } else {
                this.setBlackLevel(parent, 2);
                this.cmd("SetText", this.messageID, "Pushing up black level created another double black node");
                this.cmd("Step");
                this.fixDoubleBlack(parent);
            }
        } else if (this.getBlackLevel(sibling) === 0) {
            this.cmd("SetText", this.messageID, "Double black node has red sibling: Rotate tree to make sibling black");
            this.cmd("Step");
            const newParent = isLeftChild ? this.singleRotateLeft(parent) : this.singleRotateRight(parent);
            this.setBlackLevel(newParent, 1);
            this.setBlackLevel(newParent[dir], 0);
            this.cmd("Step");
            this.fixDoubleBlack(newParent[dir][dir]);
        } else if (this.getBlackLevel(sibling[sibDir]) > 0) {
            this.cmd("SetText", this.messageID, [
                `Double black node is a ${dir} child, and has a black sibling whose ${sibDir} child is black:`,
                `Rotate ${sibDir} to make opposite child red`,
            ]);
            this.cmd("Step");
            const newSibling = isLeftChild ? this.singleRotateRight(sibling) : this.singleRotateLeft(sibling);
            this.setBlackLevel(newSibling, 1);
            this.setBlackLevel(newSibling[sibDir], 0);
            this.cmd("Step");
            this.fixDoubleBlackChild(parent, isLeftChild);
        } else {
            this.cmd("SetText", this.messageID, [
                `Double black node is a ${dir} child, and has a black sibling whose ${sibDir} child is red:`,
                `One ${dir} rotation can fix double-blackness`,
            ]);
            this.cmd("Step");
            const oldBlackLevel = this.getBlackLevel(parent);
            const newParent = isLeftChild ? this.singleRotateLeft(parent) : this.singleRotateRight(parent);
            if (oldBlackLevel === 0) {
                this.setBlackLevel(newParent, 0);
                this.setBlackLevel(newParent[dir], 1);
            }
            this.setBlackLevel(newParent[sibDir], 1);
            if (newParent[dir][dir]) {
                this.setBlackLevel(newParent[dir][dir], 1);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Handle phantom leafs

    attachNullLeaves(node) {
        this.attachNullLeaf(node, true);
        this.attachNullLeaf(node, false);
    }

    attachNullLeaf(node, isLeftChild) {
        // Add phantom leaf to the left or right
        const nullLeafID = this.nextIndex++;
        const side = isLeftChild ? -1 : +1;
        const x = node.x + side * this.NODE_SIZE / 2;
        const y = node.y + this.NODE_SIZE + this.getSpacingY() + this.NULL_LEAF_ADJUST;
        const nullLeaf = super.createTreeNode(nullLeafID, x, y, "");
        nullLeaf.parent = node;
        nullLeaf.phantomLeaf = true;
        this.setBlackLevel(nullLeaf, 1);
        this.cmd("SetWidth", nullLeafID, this.NULL_LEAF_SIZE);
        this.cmd("SetLayer", nullLeafID, 1);
        this.cmd("Connect", node.graphicID, nullLeafID, this.LINK_COLOR);
        if (side < 0) {
            node.left = nullLeaf;
        } else {
            node.right = nullLeaf;
        }
        return nullLeaf;
    }

    fixNullLeaf(tree, isLeftChild) {
        this.cmd("SetText", this.messageID, "Coloring 'null leaf' double black");
        const nullLeaf = this.attachNullLeaf(tree, isLeftChild);
        this.setBlackLevel(nullLeaf, 2);
        this.resizeTree();
        this.fixDoubleBlackChild(tree, isLeftChild);
        this.setBlackLevel(nullLeaf, 1);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Modify the black level

    getBlackLevel(node) {
        return node == null ? 1 : node.blackLevel;
    }

    increaseBlackLevel(node) {
        node.blackLevel++;
        this.fixNodeColor(node);
    }

    setBlackLevel(node, level) {
        node.blackLevel = level;
        this.fixNodeColor(node);
    }

    fixNodeColor(node) {
        const fgColor = (
            node.blackLevel === 0 ? this.FOREGROUND_RED :
            /* blackLevel >= 1 */ this.FOREGROUND_BLACK
        );
        const bgColor = (
            node.blackLevel === 0 ? this.BACKGROUND_RED :
            node.blackLevel === 1 ? this.BACKGROUND_BLACK :
            /* blackLevel > 1 */ this.BACKGROUND_DOUBLE_BLACK
        );
        this.cmd("SetForegroundColor", node.graphicID, fgColor);
        this.cmd("SetBackgroundColor", node.graphicID, bgColor);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Validate the tree

    validateTree() {
        if (!this.treeRoot) return;
        super.validateTree();
        if (this.treeRoot.blackLevel !== 1) console.error("Tree root is not black", this.treeRoot);
        this.validateRedBlack(this.treeRoot);
    }

    validateRedBlack(node) {
        if (!node) return 0;
        if (isNaN(node.blackLevel)) console.error(`Black level not a number, ${node.blackLevel}`, node);
        if (node.blackLevel > 1) console.error("Double-black node:", node);
        if (node.blackLevel === 0) {
            if (node.phantomLeaf) console.error("Red phantom leaf:", node.parent);
            if (node.parent && node.parent.blackLevel === 0) console.error("Red node has red child:", node.parent);
        }
        let leftPath = 0;
        if (node.left) leftPath = this.validateRedBlack(node.left);
        if (node.right) {
            const rightPath = this.validateRedBlack(node.right);
            if (rightPath !== leftPath) console.error(`Different black path lengths, ${leftPath} != ${rightPath}:`, node);
        }
        return leftPath + node.blackLevel;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Resize the tree

    resizeWidths(node) {
        if (!node) return 0;
        super.resizeWidths(node);
        if (node.phantomLeaf) {
            node.leftWidth += this.NULL_LEAF_ADJUST;
            node.rightWidth += this.NULL_LEAF_ADJUST;
        }
        node.width = node.leftWidth + node.rightWidth;
        return node.width;
    }

    setNewPositions(node, x, y) {
        node.y = y;
        node.x = x;
        if (node.phantomLeaf) {
            node.y += this.NULL_LEAF_ADJUST;
        }
        const nextY = y + this.NODE_SIZE + this.getSpacingY();
        if (node.left) this.setNewPositions(node.left, x - node.leftWidth + node.left.leftWidth, nextY);
        if (node.right) this.setNewPositions(node.right, x + node.rightWidth - node.right.rightWidth, nextY);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Manipulate tree nodes

    createTreeNode(elemID, x, y, value) {
        const node = super.createTreeNode(elemID, x, y, value);
        node.phantomLeaf = false;
        this.setBlackLevel(node, 0);
        this.attachNullLeaves(node);
        return node;
    }

    removeTreeNode(node) {
        super.removeTreeNode(node);
    }
};
