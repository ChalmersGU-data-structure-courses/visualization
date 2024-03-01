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


Algorithm.Tree.Trie = class Trie extends Algorithm.Tree {
    BACKGROUND_COLOR = "white";
    TRUE_COLOR = "#CCEE99"; // Light green
    FALSE_COLOR = this.BACKGROUND_COLOR;

    NODE_SIZE = 30;
    HIGHLIGHT_CIRCLE_WIDTH = this.NODE_SIZE;
    NODE_SPACING_X = 10;
    NODE_SPACING_Y = 20;
    NEW_NODE_Y = 3 * this.TREE_ROOT_Y;

    INSERT_MANY_VALUES = [
        "I TOO TEND TO INGEST TEA IN INNS",
        "SHE TOOK SOME SMALL TOYS TO TOWN",
        "OVER THERE IS THE ODD ONE OUT",
    ];

    ALLOWED_CHARS = "ALPHA";
    INPUT_LEN = 10;
    INPUT_MANY_LEN = 40;
    INPUT_MAX_LEN = 10;


    constructor(am) {
        super();
        if (am) this.init(am);
    }

    resetAction() {
        super.resetAction();
        this.messageExtraID = this.nextIndex++;
        this.cmd("CreateLabel", this.messageExtraID, "", this.MESSAGE_X, this.MESSAGE_Y, 0);
        this.messageNextID = this.nextIndex++;
        this.cmd("CreateLabel", this.messageNextID, "", this.MESSAGE_X, this.MESSAGE_Y + this.MESSAGE_SPACING, 0);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Print the values in the tree

    printAction() {
        if (!this.treeRoot) return [];
        this.commands = [];
        this.cmd("SetText", this.messageID, "Printing tree");
        const firstLabel = this.nextIndex++;
        this.cmd("CreateLabel", firstLabel, "Output:  ", this.FIRST_PRINT_POS_X, this.getCanvasHeight() - this.FIRST_PRINT_POS_Y);
        this.cmd("Step");
        this.cmd("SetAlpha", this.highlightID, 1);
        this.cmd("SetPosition", this.highlightID, this.getTreeRootX(), this.getTreeRootY());
        this.cmd("SetText", this.messageID, "Current String:  ");
        this.cmd("SetText", this.messageExtraID, "");
        this.cmd("AlignRight", this.messageExtraID, this.messageID);
        this.cmd("SetForegroundColor", this.messageExtraID, this.PRINT_COLOR);
        this.doPrint(this.treeRoot, "");
        this.cmd("SetAlpha", this.highlightID, 0);
        this.cmd("Step");
        for (let i = firstLabel; i < this.nextIndex; i++) {
            this.cmd("Delete", i);
        }
        this.cmd("SetForegroundColor", this.messageExtraID, this.FOREGROUND_COLOR);
        this.nextIndex = firstLabel;
        return this.commands;
    }

    doPrint(node, stringSoFar) {
        if (node.value) {
            stringSoFar += node.value;
            const nextLabelID = this.printOneLabel(node.value, this.highlightID, this.messageExtraID);
            this.cmd("Step");
            this.cmd("Delete", nextLabelID);
            this.nextIndex--;
            this.cmd("SetText", this.messageExtraID, stringSoFar);
        }
        if (node.isword) {
            this.printOneLabel(stringSoFar, this.messageID);
            this.cmd("Step");
        }
        for (const child of node.getChildren()) {
            this.cmd("Move", this.highlightID, child.x, child.y);
            this.cmd("Step");
            this.doPrint(child, stringSoFar);
            this.cmd("Move", this.highlightID, node.x, node.y);
            this.cmd("SetText", this.messageExtraID, stringSoFar);
            this.cmd("Step");
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Find a value in the tree

    findAction(word) {
        this.commands = [];
        this.cmd("SetText", this.messageID, "Finding: ");
        this.cmd("SetText", this.messageExtraID, `"${word}"`);
        this.cmd("AlignRight", this.messageExtraID, this.messageID);
        this.cmd("Step");
        const node = this.doFind(this.treeRoot, word);
        this.cmd("SetText", this.messageID, `${word} ${node ? "found" : "not found"}`);
        this.cmd("SetText", this.messageExtraID, "");
        this.cmd("SetText", this.messageNextID, "");
        return this.commands;
    }

    doFind(node, suffix) {
        if (!node) return null;
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
            const child = node.children[this.getIndex(suffix)];
            if (!child) {
                this.cmd("SetText", this.messageNextID, [`Child ${suffix.charAt(0)} does not exist`, "Word is NOT the tree"]);
                this.cmd("Step");
                this.cmd("SetHighlight", node.graphicID, 0);
                return null;
            }
            this.cmd("SetAlpha", this.highlightID, 1);
            this.cmd("SetPosition", this.highlightID, node.x, node.y);
            this.cmd("SetText", this.messageNextID, [`Making recursive call to ${suffix.charAt(0)} child,`, `passing in "${suffix.substring(1)}"`]);
            this.cmd("Step");
            this.cmd("SetHighlight", node.graphicID, 0);
            this.cmd("SetHighlightIndex", this.messageExtraID, -1);
            this.cmd("SetText", this.messageExtraID, `"${suffix.substring(1)}"`);
            this.cmd("Move", this.highlightID, child.x, child.y);
            this.cmd("Step");
            this.cmd("SetAlpha", this.highlightID, 0);
            return this.doFind(child, suffix.substring(1));
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Delete a node from the tree

    deleteAction(word) {
        this.commands = [];
        this.cmd("SetText", this.messageID, "Deleting: ");
        this.cmd("SetText", this.messageExtraID, `"${word}"`);
        this.cmd("AlignRight", this.messageExtraID, this.messageID);
        this.cmd("Step");

        const node = this.doFind(this.treeRoot, word);
        if (node) {
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("SetText", this.messageNextID, `Found "${word}", setting value in tree to False`);
            this.cmd("Step");
            this.cmd("SetBackgroundColor", node.graphicID, this.FALSE_COLOR);
            node.isword = false;
            this.cmd("SetHighlight", node.graphicID, 0);
            this.cleanupAfterDelete(node);
            this.resizeTree();
            this.cmd("Step");
        } else {
            this.cmd("SetText", this.messageNextID, `"${word}" not in tree, nothing to delete`);
            this.cmd("step");
            this.cmd("SetHighlightIndex", this.messageExtraID, -1);
        }

        this.cmd("SetText", this.messageID, "");
        this.cmd("SetText", this.messageExtraID, "");
        this.cmd("SetText", this.messageNextID, "");
        return this.commands;
    }

    cleanupAfterDelete(node) {
        if (!node.isLeaf() || node.isword) return;
        this.cmd("SetText", this.messageNextID, ["Deletion left us with a \"False\" leaf", "Removing false leaf"]);
        this.cmd("SetHighlight", node.graphicID, 1);
        this.cmd("Step");
        this.cmd("SetHighlight", node.graphicID, 0);
        if (node.parent) {
            const index = this.getParentIndex(node);
            this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
            this.removeTreeNode(node);
            node.parent.children[index] = null;
            this.cleanupAfterDelete(node.parent);
        } else {
            this.removeTreeNode(node);
            this.treeRoot = null;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Insert one or more values into the tree

    insertAction(...values) {
        this.commands = [];
        if (values.length > 1) {
            this.cmd("SetText", this.messageID, `Inserting ${values.length} words: ${values.join(", ")}`);
            this.cmd("Step");
        }
        for (const word of values) {
            this.cmd("SetText", this.messageID, "Inserting; ");
            this.cmd("SetText", this.messageExtraID, `"${word}"`);
            this.cmd("AlignRight", this.messageExtraID, this.messageID);
            this.cmd("Step");
            if (this.treeRoot == null) {
                this.cmd("SetText", this.messageNextID, "Creating a new root");
                const rootID = this.nextIndex++;
                this.treeRoot = this.createTreeNode(rootID, this.getTreeRootX(), this.getTreeRootY(), "");
                this.cmd("Step");
                this.cmd("SetText", this.messageNextID, "");
            }
            this.doInsert(word, this.treeRoot);
            this.cmd("SetText", this.messageID, "");
            this.cmd("SetText", this.messageExtraID, "");
            this.cmd("SetText", this.messageNextID, "");
        }
        return this.commands;
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
        let child = node.children[this.getIndex(s)];
        if (!child) {
            this.cmd("SetText", this.messageNextID, `Child ${s.charAt(0)} does not exist, creating it`);
            const nodeID = this.nextIndex++;
            child = this.createTreeNode(nodeID, this.NEW_NODE_X, this.NEW_NODE_Y, s.charAt(0));
            node.children[this.getIndex(s)] = child;
            child.parent = node;
            this.cmd("Connect", node.graphicID, nodeID, this.FOREGROUND_COLOR, 0, true, s.charAt(0));
            this.cmd("Step");
            this.resizeTree();
            this.cmd("Step");
            this.cmd("SetText", this.messageNextID, "");
        }
        this.cmd("SetAlpha", this.highlightID, 1);
        this.cmd("SetPosition", this.highlightID, node.x, node.y);
        this.cmd("SetText", this.messageNextID, [`Making recursive call to ${s.charAt(0)} child,`, `passing in "${s.substring(1)}"`]);
        this.cmd("Step");
        this.cmd("SetHighlight", node.graphicID, 0);
        this.cmd("SetHighlightIndex", this.messageExtraID, -1);
        this.cmd("SetText", this.messageExtraID, `"${s.substring(1)}"`);

        this.cmd("Move", this.highlightID, child.x, child.y);
        this.cmd("Step");
        this.cmd("SetAlpha", this.highlightID, 0);
        this.doInsert(s.substring(1), child);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Resize the tree

    setNewPositions(node, x, y) {
        if (!node) return;
        node.x = x;
        node.y = y;
        let newX = x - node.width / 2;
        const newY = y + this.NODE_SIZE + this.getSpacingY();
        for (const child of node.getChildren()) {
            this.setNewPositions(child, newX + child.width / 2, newY);
            newX += child.width + this.getSpacingX();
        }
    }

    resizeWidths(node) {
        if (!node) return 0;
        if (node.isLeaf()) {
            node.width = this.NODE_SIZE + this.getSpacingX();
        } else {
            node.width = 0;
            for (const child of node.getChildren()) {
                node.width += this.resizeWidths(child);
            }
            node.width += (node.numChildren() - 1) * this.getSpacingX();
        }
        return node.width;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Manipluate tree nodes

    createTreeNode(elemID, x, y, value) {
        const node = new this.TrieNode(value, elemID, x, y);
        this.cmd("CreateCircle", elemID, value, x, y);
        this.cmd("SetWidth", elemID, this.NODE_SIZE);
        this.cmd("SetForegroundColor", elemID, this.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", elemID, this.BACKGROUND_COLOR);
        return node;
    }

    removeTreeNode(node) {
        this.cmd("Delete", node.graphicID);
    }

    getIndex(s, offset = 0) {
        return s.charCodeAt(offset) - "A".charCodeAt(0);
    }

    getParentIndex(node) {
        const parent = node.parent;
        if (!parent) return -1;
        for (let i = 0; i < parent.children.length; i++) {
            if (parent.children[i] === node) {
                return i;
            }
        }
        return -1;
    }

    TrieNode = class TrieNode {
        constructor(value, id, x, y) {
            this.graphicID = id;
            this.value = value;
            this.x = x;
            this.y = y;
            this.children = new Array(26);
            for (let i = 0; i < 26; i++) {
                this.children[i] = null;
            }
            this.parent = null;
            this.isword = false;
        }

        getChildren() {
            return this.children.filter((c) => c != null);
        }

        numChildren() {
            return this.getChildren().length;
        }

        isLeaf() {
            return this.numChildren() === 0;
        }
    };
};
