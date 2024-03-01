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
    INSERT_TOPDOWN = false;
    DELETE_TOPDOWN = false;

    ///////////////////////////////////////////////////////////////////////////////
    // Print the values in the tree

    doPrint(node) {
        this.cmd("Move", this.highlightID, node.x, node.y);
        this.cmd("Step");
        if (this.isTreeNode(node.left)) {
            this.doPrint(node.left);
            this.cmd("Move", this.highlightID, node.x, node.y);
            this.cmd("Step");
        }
        this.printOneLabel(node.data, node.graphicID);
        this.cmd("Step");
        if (this.isTreeNode(node.right)) {
            this.doPrint(node.right);
            this.cmd("Move", this.highlightID, node.x, node.y);
            this.cmd("Step");
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Find a value in the tree

    doFind(node, value) {
        const cmp = this.compare(value, node.data);
        if (cmp === 0) {
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", node.graphicID, 0);
            return {found: true, node: node};
        }

        const cmpStr = cmp < 0 ? "<" : ">";
        const dirStr = cmp < 0 ? "left" : "right";
        const child = cmp < 0 ? node.left : node.right;
        if (!this.isTreeNode(child)) {
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", node.graphicID, 0);
            return {found: false, node: node};
        }

        this.cmd("SetText", this.messageID, `${value} ${cmpStr} ${node.data}: Look into ${dirStr} child`);
        this.cmd("SetHighlight", node.graphicID, 1);
        this.cmd("SetEdgeHighlight", node.graphicID, child.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetHighlight", node.graphicID, 0);
        this.cmd("SetEdgeHighlight", node.graphicID, child.graphicID, 0);
        this.cmd("SetAlpha", this.highlightID, 1);
        this.cmd("SetPosition", this.highlightID, node.x, node.y);
        this.cmd("Move", this.highlightID, child.x, child.y);
        this.cmd("SetText", this.messageID, "");
        this.cmd("Step");
        this.cmd("SetAlpha", this.highlightID, 0);
        return this.doFind(child, value);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Insert a value just below a node

    doInsert(parent, value) {
        const cmp = this.compare(value, parent.data);
        const cmpStr = cmp === 0 ? "=" : cmp < 0 ? "<" : ">";
        const dirStr = cmp < 0 ? "left" : "right";
        const child = cmp < 0 ? parent.left : parent.right;
        this.cmd("SetText", this.messageID, `${value} ${cmpStr} ${parent.data}: Inserting element as ${dirStr} child`);

        const elemID = this.nextIndex++;
        const elem = this.createTreeNode(elemID, this.NEW_NODE_X, this.NEW_NODE_Y, value);
        this.cmd("SetHighlight", elem.graphicID, 1);
        this.cmd("SetHighlight", parent.graphicID, 1);
        this.cmd("Step");

        if (child) this.removeTreeNode(child);
        this.cmd("SetHighlight", parent.graphicID, 0);
        this.cmd("SetHighlight", elem.graphicID, 0);
        this.cmd("Connect", parent.graphicID, elem.graphicID, this.LINK_COLOR);
        if (cmp < 0) parent.left = elem;
        else parent.right = elem;
        elem.parent = parent;
        this.cmd("SetAlpha", this.highlightID, 1);
        this.cmd("SetPosition", this.highlightID, elem.x, elem.y);
        this.resizeTree();
        this.cmd("Move", this.highlightID, elem.x, elem.y);
        this.cmd("Step");
        this.cmd("SetAlpha", this.highlightID, 0);
        return {node: elem};
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Delete a node from the tree

    doDelete(node) {
        const parent = node.parent;
        if (!(this.isTreeNode(node.left) || this.isTreeNode(node.right))) {
            this.cmd("SetText", this.messageID, `Node ${node.data} is a leaf: We can delete it`);
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", node.graphicID, 0);
            if (node.left) {
                this.removeTreeNode(node.left);
                node.left = null;
            }
            if (node.right) {
                this.removeTreeNode(node.right);
                node.right = null;
            }
            this.removeTreeNode(node);
            if (this.isTreeNode(parent)) {
                node.reassignParent(null);
                node.parent = null;
            } else {
                this.treeRoot = null;
            }
            return {deleted: node, node: parent};
        }

        if (!(this.isTreeNode(node.left) && this.isTreeNode(node.right))) {
            const child = this.isTreeNode(node.left) ? node.left : node.right;
            this.cmd("SetText", this.messageID, `Node ${node.data} has only one child ${child.data} - replace it with its child`);
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, node.x, node.y);
            this.cmd("Step");
            const chibling = child.getSibling();
            if (chibling) {
                this.removeTreeNode(chibling);
                chibling.reassignParent(null);
            }
            if (this.isTreeNode(parent)) {
                this.cmd("Disconnect", parent.graphicID, node.graphicID);
                this.cmd("Connect", parent.graphicID, child.graphicID, this.LINK_COLOR);
                node.reassignParent(child);
            } else {
                this.treeRoot = child;
            }
            child.parent = parent;
            this.removeTreeNode(node);
            this.cmd("SetPosition", this.highlightID, child.x, child.y);
            this.resizeTree();
            this.cmd("Move", this.highlightID, child.x, child.y);
            this.cmd("SetHighlight", node.graphicID, 0);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
            return {deleted: node, node: child};
        }

        let prenode = node.left;
        this.cmd("SetText", this.messageID, `Node has two children, ${prenode} and ${node.right} - find rightmost node in left subtree`);
        this.cmd("SetAlpha", this.highlightID, 1);
        this.cmd("SetPosition", this.highlightID, node.x, node.y);
        this.cmd("SetHighlight", node.graphicID, 1);
        while (true) {
            this.cmd("Move", this.highlightID, prenode.x, prenode.y);
            this.cmd("Step");
            if (!this.isTreeNode(prenode.right)) break;
            prenode = prenode.right;
        }
        const labelID = this.nextIndex++;
        this.cmd("CreateLabel", labelID, prenode.data, prenode.x, prenode.y);
        this.cmd("SetForegroundColor", labelID, this.FOREGROUND_COLOR);
        node.data = prenode.data;
        prenode.data = "";
        this.cmd("SetText", node.graphicID, "");
        this.cmd("SetText", prenode.graphicID, "");
        this.cmd("Move", labelID, node.x, node.y);
        this.cmd("Move", this.highlightID, node.x, node.y);
        this.cmd("SetText", this.messageID, `Copy largest value ${prenode.data} of left subtree into node to delete`);
        this.cmd("SetHighlight", node.graphicID, 0);
        this.cmd("Step");

        this.cmd("Delete", labelID);
        this.cmd("SetText", node.graphicID, node.data);
        this.cmd("SetAlpha", this.highlightID, 0);

        this.cmd("SetText", this.messageID, "Remove node whose value we copied");
        return this.doDelete(prenode);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Validate the tree

    validateTree() {
        if (!this.treeRoot) return;
        super.validateTree();
        this.validateBST(this.treeRoot, null, Number.MIN_SAFE_INTEGER);
    }

    validateBST(node, parent, cmpVal) {
        if (!node) return cmpVal;
        if (!(node instanceof this.TreeNode)) console.error("Not a tree node:", node);
        if (!node.graphicID) console.error("Tree node missing ID:", node);
        if (node.parent !== parent && (node.parent || parent)) console.error("Parent mismatch:", node, parent);
        if (this.isTreeNode(node.left)) cmpVal = this.validateBST(node.left, node, cmpVal);
        if (this.compare(cmpVal, node.data) > 0) console.error(`Order mismatch, ${cmpVal} > ${node.data}`, node);
        cmpVal = node.data;
        if (this.isTreeNode(node.right)) cmpVal = this.validateBST(node.right, node, cmpVal);
        return cmpVal;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Resize the tree

    resizeWidths(node) {
        if (!node) return 0;
        node.width = Math.max(
            this.NODE_SIZE,
            this.resizeWidths(node.left) + this.getSpacingX() + this.resizeWidths(node.right),
        );
        const left = node.left?.leftWidth || 0;
        const right = node.right?.rightWidth || 0;
        const mid = node.width - left - right;
        node.leftWidth = mid / 2 + left;
        node.rightWidth = mid / 2 + right;
        return node.width;
    }

    setNewPositions(node, x, y) {
        node.y = y;
        node.x = x;
        const nextY = y + this.NODE_SIZE + this.getSpacingY();
        if (node.left) this.setNewPositions(node.left, x - node.leftWidth + node.left.leftWidth, nextY);
        if (node.right) this.setNewPositions(node.right, x + node.rightWidth - node.right.rightWidth, nextY);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Manipulate tree nodes

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

    isTreeNode(node) {
        return node instanceof this.TreeNode && !node.phantomLeaf;
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

        getChildren() {
            return [this.left, this.right];
        }

        isLeftChild() {
            return this.parent?.left === this;
        }

        isRightChild() {
            return this.parent?.right === this;
        }

        getSibling() {
            const parent = this.parent;
            if (!parent) return null;
            return this === parent.left ? parent.right : parent.left;
        }

        toString() {
            return this.data;
        }

        deepString() {
            let s = "";
            if (this.left) s += `(${this.left.deepString()}) `;
            s += this.data;
            if (this.right) s += ` (${this.right.deepString()})`;
            return s;
        }
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Rotate the tree
    // These are not used by BST, but by self-balancing subclasses
    // The following rotations are implemented:
    //  - Single Rotate Left/Right (also known as Zig)
    //  - Double Rotate Left/Right (also known as Zig-Zag)
    //  - Zig-Zig Left/Right

    resetHeight(node) {
        // BSTs do not store the height in the nodes, so do nothing
    }

    singleRotateLeft(node) {
        const A = node;
        const B = node.right;
        // const t1 = A.left;
        const t2 = B.left;
        // const t3 = B.right;

        this.cmd("SetText", this.messageID, "Single Rotate Left");
        this.cmd("SetHighlight", A.graphicID, 1);
        this.cmd("SetHighlight", B.graphicID, 1);
        this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 0);

        if (t2) {
            this.cmd("Disconnect", B.graphicID, t2.graphicID);
            this.cmd("Connect", A.graphicID, t2.graphicID, this.LINK_COLOR);
            t2.parent = A;
        }
        this.cmd("Disconnect", A.graphicID, B.graphicID);
        this.cmd("Connect", B.graphicID, A.graphicID, this.LINK_COLOR);
        B.parent = A.parent;
        if (!A.parent) {
            this.treeRoot = B;
        } else {
            this.cmd("Disconnect", A.parent.graphicID, A.graphicID, this.LINK_COLOR);
            this.cmd("Connect", A.parent.graphicID, B.graphicID, this.LINK_COLOR);
            A.reassignParent(B);
        }
        B.left = A;
        A.parent = B;
        A.right = t2;
        this.resetHeight(A);
        this.resetHeight(B);
        this.resizeTree();
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 0);
        this.cmd("SetHighlight", A.graphicID, 0);
        this.cmd("SetHighlight", B.graphicID, 0);
        return B;
    }

    singleRotateRight(node) {
        const A = node.left;
        const B = node;
        // const t1 = A.left;
        const t2 = A.right;
        // const t3 = B.right;

        this.cmd("SetText", this.messageID, "Single Rotate Right");
        this.cmd("SetHighlight", A.graphicID, 1);
        this.cmd("SetHighlight", B.graphicID, 1);
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 0);

        if (t2) {
            this.cmd("Disconnect", A.graphicID, t2.graphicID);
            this.cmd("Connect", B.graphicID, t2.graphicID, this.LINK_COLOR);
            t2.parent = B;
        }
        this.cmd("Disconnect", B.graphicID, A.graphicID);
        this.cmd("Connect", A.graphicID, B.graphicID, this.LINK_COLOR);
        A.parent = B.parent;
        if (!B.parent) {
            this.treeRoot = A;
        } else {
            this.cmd("Disconnect", B.parent.graphicID, B.graphicID, this.LINK_COLOR);
            this.cmd("Connect", B.parent.graphicID, A.graphicID, this.LINK_COLOR);
            B.reassignParent(A);
        }
        A.right = B;
        B.parent = A;
        B.left = t2;
        this.resetHeight(B);
        this.resetHeight(A);
        this.resizeTree();
        this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 0);
        this.cmd("SetHighlight", A.graphicID, 0);
        this.cmd("SetHighlight", B.graphicID, 0);
        return A;
    }

    doubleRotateLeft(node) {
        const A = node;
        const B = node.right.left;
        const C = node.right;
        // const t1 = A.left;
        const t2 = B.left;
        const t3 = B.right;
        // const t4 = C.right;

        this.cmd("SetText", this.messageID, "Double Rotate Left");
        this.cmd("SetHighlight", A.graphicID, 1);
        this.cmd("SetHighlight", B.graphicID, 1);
        this.cmd("SetHighlight", C.graphicID, 1);
        this.cmd("SetEdgeHighlight", A.graphicID, C.graphicID, 1);
        this.cmd("SetEdgeHighlight", C.graphicID, B.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", A.graphicID, C.graphicID, 0);
        this.cmd("SetEdgeHighlight", C.graphicID, B.graphicID, 0);

        if (t2) {
            this.cmd("Disconnect", B.graphicID, t2.graphicID);
            t2.parent = A;
            A.right = t2;
            this.cmd("Connect", A.graphicID, t2.graphicID, this.LINK_COLOR);
        }
        if (t3) {
            this.cmd("Disconnect", B.graphicID, t3.graphicID);
            t3.parent = C;
            C.left = t2;
            this.cmd("Connect", C.graphicID, t3.graphicID, this.LINK_COLOR);
        }
        if (!A.parent) {
            B.parent = null;
            this.treeRoot = B;
        } else {
            this.cmd("Disconnect", A.parent.graphicID, A.graphicID);
            this.cmd("Connect", A.parent.graphicID, B.graphicID, this.LINK_COLOR);
            A.reassignParent(B);
            B.parent = A.parent;
            A.parent = B;
        }
        this.cmd("Disconnect", A.graphicID, C.graphicID);
        this.cmd("Disconnect", C.graphicID, B.graphicID);
        this.cmd("Connect", B.graphicID, A.graphicID, this.LINK_COLOR);
        this.cmd("Connect", B.graphicID, C.graphicID, this.LINK_COLOR);

        A.parent = B;
        A.right = t2;
        B.left = A;
        B.right = C;
        C.parent = B;
        C.left = t3;
        this.resetHeight(A);
        this.resetHeight(C);
        this.resetHeight(B);
        this.resizeTree();
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 1);
        this.cmd("SetEdgeHighlight", B.graphicID, C.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 0);
        this.cmd("SetEdgeHighlight", B.graphicID, C.graphicID, 0);
        this.cmd("SetHighlight", A.graphicID, 0);
        this.cmd("SetHighlight", B.graphicID, 0);
        this.cmd("SetHighlight", C.graphicID, 0);
        return B;
    }

    doubleRotateRight(node) {
        const A = node.left;
        const B = node.left.right;
        const C = node;
        // const t1 = A.left;
        const t2 = B.left;
        const t3 = B.right;
        // const t4 = C.right;

        this.cmd("SetText", this.messageID, "Double Rotate Right");
        this.cmd("SetHighlight", A.graphicID, 1);
        this.cmd("SetHighlight", B.graphicID, 1);
        this.cmd("SetHighlight", C.graphicID, 1);
        this.cmd("SetEdgeHighlight", C.graphicID, A.graphicID, 1);
        this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", C.graphicID, A.graphicID, 0);
        this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 0);

        if (t2) {
            this.cmd("Disconnect", B.graphicID, t2.graphicID);
            t2.parent = A;
            A.right = t2;
            this.cmd("Connect", A.graphicID, t2.graphicID, this.LINK_COLOR);
        }
        if (t3) {
            this.cmd("Disconnect", B.graphicID, t3.graphicID);
            t3.parent = C;
            C.left = t2;
            this.cmd("Connect", C.graphicID, t3.graphicID, this.LINK_COLOR);
        }
        if (!C.parent) {
            B.parent = null;
            this.treeRoot = B;
        } else {
            this.cmd("Disconnect", C.parent.graphicID, C.graphicID);
            this.cmd("Connect", C.parent.graphicID, B.graphicID, this.LINK_COLOR);
            C.reassignParent(B);
            B.parent = C.parent;
            C.parent = B;
        }
        this.cmd("Disconnect", C.graphicID, A.graphicID);
        this.cmd("Disconnect", A.graphicID, B.graphicID);
        this.cmd("Connect", B.graphicID, A.graphicID, this.LINK_COLOR);
        this.cmd("Connect", B.graphicID, C.graphicID, this.LINK_COLOR);

        A.parent = B;
        A.right = t2;
        B.left = A;
        B.right = C;
        C.parent = B;
        C.left = t3;
        this.resetHeight(A);
        this.resetHeight(C);
        this.resetHeight(B);
        this.resizeTree();
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 1);
        this.cmd("SetEdgeHighlight", B.graphicID, C.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 0);
        this.cmd("SetEdgeHighlight", B.graphicID, C.graphicID, 0);
        this.cmd("SetHighlight", A.graphicID, 0);
        this.cmd("SetHighlight", B.graphicID, 0);
        this.cmd("SetHighlight", C.graphicID, 0);
        return B;
    }

    zigZigLeft(node) {
        const A = node;
        const B = node.right;
        const C = node.right.right;
        // const t1 = A.left;
        const t2 = B.left;
        const t3 = C.left;
        // const t4 = C.right;

        this.cmd("SetText", this.messageID, "Zig-Zig Left");
        this.cmd("SetHighlight", A.graphicID, 1);
        this.cmd("SetHighlight", B.graphicID, 1);
        this.cmd("SetHighlight", C.graphicID, 1);
        this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 1);
        this.cmd("SetEdgeHighlight", B.graphicID, C.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 0);
        this.cmd("SetEdgeHighlight", B.graphicID, C.graphicID, 0);

        if (A.parent) {
            this.cmd("Disconnect", A.parent.graphicID, A.graphicID);
            this.cmd("Connect", A.parent.graphicID, C.graphicID, this.LINK_COLOR);
            A.reassignParent(C);
        } else {
            this.treeRoot = C;
        }
        if (t2) {
            this.cmd("Disconnect", B.graphicID, t2.graphicID);
            this.cmd("Connect", A.graphicID, t2.graphicID, this.LINK_COLOR);
            t2.parent = A;
        }
        if (t3) {
            this.cmd("Disconnect", C.graphicID, t3.graphicID);
            this.cmd("Connect", B.graphicID, t3.graphicID, this.LINK_COLOR);
            t3.parent = B;
        }
        this.cmd("Disconnect", A.graphicID, B.graphicID);
        this.cmd("Disconnect", B.graphicID, C.graphicID);
        this.cmd("Connect", C.graphicID, B.graphicID, this.LINK_COLOR);
        this.cmd("Connect", B.graphicID, A.graphicID, this.LINK_COLOR);

        C.parent = A.parent;
        C.left = B;
        B.parent = C;
        B.right = t3;
        B.left = A;
        A.parent = B;
        A.right = t2;
        this.resetHeight(A);
        this.resetHeight(B);
        this.resetHeight(C);
        this.resizeTree();
        this.cmd("SetEdgeHighlight", C.graphicID, B.graphicID, 1);
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", C.graphicID, B.graphicID, 0);
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 0);
        this.cmd("SetHighlight", A.graphicID, 0);
        this.cmd("SetHighlight", B.graphicID, 0);
        this.cmd("SetHighlight", C.graphicID, 0);
        return C;
    }

    zigZigRight(node) {
        const A = node.left.left;
        const B = node.left;
        const C = node;
        // const t1 = A.left;
        const t2 = A.right;
        const t3 = B.right;
        // const t4 = C.right;

        this.cmd("SetText", this.messageID, "Zig-Zig Right");
        this.cmd("SetHighlight", A.graphicID, 1);
        this.cmd("SetHighlight", B.graphicID, 1);
        this.cmd("SetHighlight", C.graphicID, 1);
        this.cmd("SetEdgeHighlight", C.graphicID, B.graphicID, 1);
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", C.graphicID, B.graphicID, 0);
        this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 0);

        if (C.parent) {
            this.cmd("Disconnect", C.parent.graphicID, C.graphicID);
            this.cmd("Connect", C.parent.graphicID, A.graphicID, this.LINK_COLOR);
            C.reassignParent(A);
        } else {
            this.treeRoot = A;
        }
        if (t2) {
            this.cmd("Disconnect", A.graphicID, t2.graphicID);
            this.cmd("Connect", B.graphicID, t2.graphicID, this.LINK_COLOR);
            t2.parent = B;
        }
        if (t3) {
            this.cmd("Disconnect", B.graphicID, t3.graphicID);
            this.cmd("Connect", C.graphicID, t3.graphicID, this.LINK_COLOR);
            t3.parent = C;
        }
        this.cmd("Disconnect", C.graphicID, B.graphicID);
        this.cmd("Disconnect", B.graphicID, A.graphicID);
        this.cmd("Connect", A.graphicID, B.graphicID, this.LINK_COLOR);
        this.cmd("Connect", B.graphicID, C.graphicID, this.LINK_COLOR);

        A.parent = C.parent;
        A.right = B;
        B.parent = A;
        B.left = t2;
        B.right = C;
        C.parent = B;
        C.left = t3;
        this.resetHeight(A);
        this.resetHeight(B);
        this.resetHeight(C);
        this.resizeTree();
        this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 1);
        this.cmd("SetEdgeHighlight", B.graphicID, C.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 0);
        this.cmd("SetEdgeHighlight", B.graphicID, C.graphicID, 0);
        this.cmd("SetHighlight", A.graphicID, 0);
        this.cmd("SetHighlight", B.graphicID, 0);
        this.cmd("SetHighlight", C.graphicID, 0);
        return A;
    }
};

