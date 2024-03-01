// Copyright 2016 David Galles, University of San Francisco. All rights reserved.
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
// WARRANTIES, INCLUDING, BUT NOT LIIBTED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
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


Algorithm.Tree.Ternary = class TernaryTree extends Algorithm.Tree.Trie {
    CENTER_LINK_COLOR = this.FOREGROUND_COLOR;
    SIDE_LINK_COLOR = "#8888AA";

    CURVE = 0.01;


    constructor(am) {
        super();
        this.init(am);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Delete a node from the tree

    cleanupAfterDelete(node) {
        if (!node) return;
        if (node.center) {
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("SetText", this.messageNextID, ["Cleaning up after delete ...", "Tree has center child, no more cleanup required"]);
            this.cmd("Step");
            this.cmd("SetText", this.messageNextID, "");
            this.cmd("SetHighlight", node.graphicID, 0);
            return;
        }
        if (node.isLeaf() && node.isword) {
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("SetText", this.messageNextID, ["Cleaning up after delete ...", "Leaf at end of word, no more cleanup required"]);
            this.cmd("Step");
            this.cmd("SetText", this.messageNextID, "");
            this.cmd("SetHighlight", node.graphicID, 0);
            return;
        }
        if (node.isLeaf()) {
            this.cmd("SetText", this.messageNextID, "Cleaning up after delete ...");
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("Step");
            if (!node.parent) {
                this.treeRoot = null;
            } else if (node.parent.left === node) {
                this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
                node.parent.left = null;
            } else if (node.parent.right === node) {
                this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
                node.parent.right = null;
            } else if (node.parent.center === node) {
                this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
                node.parent.center = null;
                node.parent.value = "";
                this.cmd("SetText", node.parent.graphicID, "");
            }
            this.removeTreeNode(node);
            this.cleanupAfterDelete(node.parent);
        } else if ((!node.left && !node.center) || (!node.right && !node.center)) {
            const child = node.left || node.right;
            this.cmd("Disconnect", node.graphicID, child.graphicID);
            if (node.parent == null) {
                this.cmd("Delete", node.graphicID);
                this.treeRoot = child;
                child.parent = null;
            } else if (node.parent.left === node) {
                this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
                this.cmd("Connect", node.parent.graphicID, child.graphicID, this.SIDE_LINK_COLOR, this.CURVE, true, `<${node.parent.value}`);
                node.parent.left = child;
                child.parent = node.parent;
                this.cmd("Step");
                this.cmd("Delete", node.graphicID);
            } else if (node.parent.right === node) {
                this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
                this.cmd("Connect", node.parent.graphicID, child.graphicID, this.SIDE_LINK_COLOR, -this.CURVE, true, `>${node.parent.value}`);
                node.parent.right = child;
                child.parent = node.parent;
                this.cmd("Step");
                this.cmd("Delete", node.graphicID);
            } else if (node.parent.center === node) {
                this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
                this.cmd("Connect", node.parent.graphicID, child.graphicID, this.CENTER_LINK_COLOR, this.CURVE, true, `=${node.parent.value}`);
                child.parent = node.parent;
                node.parent.center = child;
                this.cmd("Step");
                this.cmd("Delete", node.graphicID);
            }
        } else if (node.left && !node.center && node.right) {
            let child = node.left;
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, node.x, node.y);
            this.cmd("Move", this.highlightID, child.x, child.y);
            this.cmd("Step");
            while (child.right) {
                child = child.right;
                this.cmd("Move", this.highlightID, child.x, child.y);
                this.cmd("Step");
            }
            if (node.left !== child) {
                this.cmd("Disconnect", child.parent.graphicID, child.graphicID);
                child.parent.right = child.left;
                if (child.left) {
                    child.left.parent = child.parent;
                    this.cmd("Disconnect", child.graphicID, child.left.graphicID);
                    this.cmd("Connect", child.parent.graphicID, child.left.graphicID, this.CENTER_LINK_COLOR, -this.CURVE, true, `>${child.parent.value}`);
                }
                this.cmd("Disconnect", node.graphicID, node.right.graphicID);
                this.cmd("Disconnect", node.graphicID, node.left.graphicID);
                child.right = node.right;
                child.left = node.left;
                node.right.parent = child;
                node.left.parent = child;
                this.cmd("Connect", child.graphicID, child.left.graphicID, this.SIDE_LINK_COLOR, this.CURVE, true, `<${child.value}`);
                this.cmd("Connect", child.graphicID, child.right.graphicID, this.SIDE_LINK_COLOR, -this.CURVE, true, `>${child.value}`);
            } else {
                this.cmd("Disconnect", node.graphicID, node.left.graphicID);
                this.cmd("Disconnect", node.graphicID, node.right.graphicID);
                child.right = node.right;
                child.right.parent = child;
                this.cmd("Connect", child.graphicID, child.right.graphicID, this.SIDE_LINK_COLOR, -this.CURVE, true, `>${child.value}`);
            }
            this.cmd("SetAlpha", this.highlightID, 0);
            this.removeTreeNode(node);
            this.cmd("Step");
            child.parent = node.parent;
            if (!child.parent) {
                this.treeRoot = child;
            } else {
                this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
                if (node.parent.left === node) {
                    node.parent.left = child;
                    child.parent = node.parent;
                    this.cmd("Connect", child.parent.graphicID, child.graphicID, this.SIDE_LINK_COLOR, this.CURVE, true, `<${child.parent.value}`);
                } else if (node.parent.right === node) {
                    node.parent.right = child;
                    child.parent = node.parent;
                    this.cmd("Connect", child.parent.graphicID, child.graphicID, this.SIDE_LINK_COLOR, -this.CURVE, true, `>${child.parent.value}`);
                } else if (node.parent.center === node) {
                    node.parent.center = child;
                    child.parent = node.parent;
                    this.cmd("Connect", child.parent.graphicID, child.graphicID, this.CENTER_LINK_COLOR, this.CURVE, true, `=${child.parent.value}`);
                }
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Print the values in the tree

    doPrint(node, stringSoFar) {
        if (node.isword) {
            this.printOneLabel(stringSoFar, this.messageID);
            this.cmd("Step");
        }
        if (node.left) {
            this.cmd("Move", this.highlightID, node.left.x, node.left.y);
            this.cmd("Step");
            this.doPrint(node.left, stringSoFar);
            this.cmd("Move", this.highlightID, node.x, node.y);
            this.cmd("Step");
        }
        if (node.center) {
            const nextLabelID = this.printOneLabel(node.value, this.highlightID, this.messageExtraID);
            this.cmd("Move", this.highlightID, node.center.x, node.center.y);
            this.cmd("Step");
            this.cmd("Delete", nextLabelID);
            this.nextIndex--;
            const stringSoFar2 = stringSoFar + node.value;
            this.cmd("SetText", this.messageExtraID, stringSoFar2);
            this.doPrint(node.center, stringSoFar2);
            this.cmd("Move", this.highlightID, node.x, node.y);
            this.cmd("SetText", this.messageExtraID, stringSoFar);
            this.cmd("Step");
        }
        if (node.right) {
            this.cmd("Move", this.highlightID, node.right.x, node.right.y);
            this.cmd("Step");
            this.doPrint(node.right, stringSoFar);
            this.cmd("Move", this.highlightID, node.x, node.y);
            this.cmd("Step");
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Find a value in the tree

    doFind(node, suffix) {
        if (!node) {
            this.cmd("SetText", this.messageNextID, ["Reached null tree", "Word is not in the tree"]);
            this.cmd("Step");
            return null;
        }
        this.cmd("SetHighlight", node.graphicID, 1);
        if (suffix.length === 0) {
            const found = Boolean(node.isword);
            this.cmd("SetText", this.messageNextID, [
                "Reached the end of the string",
                `Current node is ${found}`,
                `Word ${found ? "is" : "is NOT"} in the tree`,
            ]);
            this.cmd("Step");
            this.cmd("SetHighlight", node.graphicID, 0);
            return found ? node : null;
        } else {
            this.cmd("SetHighlightIndex", this.messageExtraID, 1);
            let child = null;
            if (node.value === "") {
                this.cmd("SetText", this.messageNextID, [
                    "Reached a leaf without a character, still have characters left in search string",
                    "String is not in the tree",
                ]);
                this.cmd("Step");
                this.cmd("SetHighlightIndex", this.messageExtraID, -1);
                this.cmd("SetHighlight", node.graphicID, 0);
                return null;
            }

            if (node.value === suffix.charAt(0)) {
                this.cmd("SetText", this.messageNextID, [
                    "Next character in string matches character at current node",
                    "Recursively look at center child,",
                    "removing first letter from search string",
                ]);
                suffix = suffix.substring(1);
                child = node.center;
            } else if (node.value > suffix.charAt(0)) {
                this.cmd("SetText", this.messageNextID, [
                    "Next character in string < Character at current node",
                    "Recursively look at left node,",
                    "leaving search string as it is",
                ]);
                child = node.left;
            } else {
                this.cmd("SetText", this.messageNextID, [
                    "Next character in string > Character at current node",
                    "Recursively look at left right,",
                    "leaving search string as it is",
                ]);
                child = node.right;
            }
            this.cmd("Step");
            if (child) {
                this.cmd("SetText", this.messageExtraID, `"${suffix}"`);
                this.cmd("SetHighlightIndex", this.messageExtraID, -1);
                this.cmd("SetAlpha", this.highlightID, 1);
                this.cmd("SetPosition", this.highlightID, node.x, node.y);
                this.cmd("Move", this.highlightID, child.x, child.y);
                this.cmd("SetHighlight", node.graphicID, 0);
                this.cmd("Step");
                this.cmd("SetAlpha", this.highlightID, 0);
            } else {
                this.cmd("SetHighlight", node.graphicID, 0);
            }
            return this.doFind(child, suffix);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Insert one or more values into the tree

    createIfNotExtant(node, child, label) {
        if (!child) {
            const childID = this.nextIndex++;
            child = this.createTreeNode(childID, this.NEW_NODE_X, this.NEW_NODE_Y, "");
            this.cmd("SetText", this.messageNextID, "Creating a new node");
            this.cmd("Step");
            const dir = label.charAt(0) === ">" ? -this.CURVE : this.CURVE;
            const color = label.charAt(0) === "=" ? this.CENTER_LINK_COLOR : this.SIDE_LINK_COLOR;
            this.cmd("Connect", node.graphicID, childID, color, dir, true, label);
            this.cmd("SetText", this.messageNextID, "");
        }
        return child;
    }

    doInsert(s, node) {
        this.cmd("SetHighlight", node.graphicID, 1);
        if (s.length === 0) {
            this.cmd("SetText", this.messageNextID, ["Reached the end of the string", "Set current node to true"]);
            this.cmd("Step");
            this.cmd("SetBackgroundColor", node.graphicID, this.TRUE_COLOR);
            this.cmd("SetHighlight", node.graphicID, 0);
            node.isword = true;
            return;
        }

        this.cmd("SetHighlightIndex", this.messageExtraID, 1);
        if (node.value === "") {
            node.value = s.charAt(0);
            this.cmd("SetText", this.messageNextID, `No character for this node, setting to ${s.charAt(0)}`);
            this.cmd("SetText", node.graphicID, s.charAt(0));
            this.cmd("Step");
            if (!node.center) {
                node.center = this.createIfNotExtant(node, node.center, `=${s.charAt(0)}`);
                node.center.parent = node;
                this.resizeTree();
            }
            this.cmd("SetHighlightIndex", this.messageExtraID, -1);
            this.cmd("SetHighlight", node.graphicID, 0);
            this.cmd("SetText", this.messageExtraID, `"${s.substring(1)}"`);
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, node.x, node.y);
            this.cmd("Move", this.highlightID, node.center.x, node.center.y);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
            this.doInsert(s.substring(1), node.center);
        } else if (node.value === s.charAt(0)) {
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, node.x, node.y);
            this.cmd("SetText", this.messageNextID, `Making recursive call to center child, passing in "${s.substring(1)}"`);
            this.cmd("Step");
            this.cmd("SetHighlight", node.graphicID, 0);
            this.cmd("SetHighlightIndex", this.messageExtraID, -1);
            this.cmd("SetText", this.messageExtraID, `"${s.substring(1)}"`);
            this.cmd("Move", this.highlightID, node.center.x, node.center.y);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
            this.doInsert(s.substring(1), node.center);
        } else {
            let child = null;
            let label = "";
            if (node.value > s.charAt(0)) {
                label = `<${node.value}`;
                this.cmd("SetText", this.messageNextID, [
                    "Next character in string is < value stored at current node",
                    `Making recursive call to left child passing in "${s}"`,
                ]);
                node.left = this.createIfNotExtant(node, node.left, label);
                node.left.parent = node;
                this.resizeTree();
                child = node.left;
            } else {
                label = `>${node.value}`;
                this.cmd("SetText", this.messageNextID, [
                    "Next character in string is > value stored at current node",
                    `Making recursive call to right child passing in "${s}"`,
                ]);
                node.right = this.createIfNotExtant(node, node.right, label);
                node.right.parent = node;
                this.resizeTree();
                child = node.right;
            }
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, node.x, node.y);
            this.cmd("Step");
            this.cmd("SetHighlight", node.graphicID, 0);
            this.cmd("SetHighlightIndex", this.messageExtraID, -1);
            this.cmd("Move", this.highlightID, child.x, child.y);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
            this.doInsert(s, child);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Manipluate tree nodes

    createTreeNode(elemID, x, y, value) {
        const node = new this.TernaryNode(value, elemID, x, y);
        this.cmd("CreateCircle", elemID, value, x, y);
        this.cmd("SetWidth", elemID, this.NODE_SIZE);
        this.cmd("SetForegroundColor", elemID, this.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", elemID, this.BACKGROUND_COLOR);
        return node;
    }

    removeTreeNode(node) {
        this.cmd("Delete", node.graphicID);
    }

    TernaryNode = class TernaryNode {
        constructor(val, id, x, y) {
            this.graphicID = id;
            this.value = val;
            this.x = x;
            this.y = y;
            this.left = null;
            this.center = null;
            this.right = null;
            this.parent = null;
            this.isword = false;
        }

        getChildren() {
            return [this.left, this.center, this.right].filter((c) => c != null);
        }

        numChildren() {
            return this.getChildren().length;
        }

        isLeaf() {
            return this.numChildren() === 0;
        }
    };
};
