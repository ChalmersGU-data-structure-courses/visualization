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


Algorithm.Tree = class Tree extends Algorithm {
    FOREGROUND_COLOR = "darkgreen";
    BACKGROUND_COLOR = "lightyellow";

    LINK_COLOR = this.FOREGROUND_COLOR;
    HIGHLIGHT_CIRCLE_COLOR = this.FOREGROUND_COLOR;
    PRINT_COLOR = "blue";

    TREE_ROOT_Y = 50;
    NEW_NODE_X = this.TREE_ROOT_Y;
    NEW_NODE_Y = 2 * this.TREE_ROOT_Y;

    NODE_SIZE = 40;
    NODE_SPACING_X = 20;
    NODE_SPACING_Y = this.NODE_SPACING_X;
    HIGHLIGHT_CIRCLE_WIDTH = this.NODE_SIZE;

    MESSAGE_X = 20;
    MESSAGE_Y = 20;
    MESSAGE_SPACING = 30;

    FIRST_PRINT_POS_X = 50;
    FIRST_PRINT_POS_Y = 3 * this.MESSAGE_Y;

    ALLOW_DUPLICATES = false;

    INSERT_MANY_VALUES = [
        "A B C D E F G H J K",
        "Z Y X V T S P O M L",
        "A L G O R I T H M",
        "C O M P L E X I T Y",
        "R E C U R S I O N",
        5,
    ];

    ALLOWED_CHARS = "ALPHANUM";
    INPUT_LEN = 4;
    INPUT_MANY_LEN = 20;
    INPUT_MAX_LEN = 10;


    constructor(am) {
        super();
        if (am) this.init(am);
    }

    init(am) {
        super.init(am);
        this.addControls();
        this.resetAll();
    }

    resetAll() {
        this.animationManager.resetAll();
        this.commands = [];
        this.nextIndex = 0;
        this.resetAction();
        this.initialIndex = this.nextIndex;
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    resetAction() {
        this.messageID = this.nextIndex++;
        this.cmd("CreateLabel", this.messageID, "", this.MESSAGE_X, this.MESSAGE_Y, 0);
        this.highlightID = this.nextIndex++;
        this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, 0, 0);
        this.cmd("SetWidth", this.highlightID, this.HIGHLIGHT_CIRCLE_WIDTH);
        this.cmd("SetHighlight", this.highlightID, true);
        this.cmd("SetAlpha", this.highlightID, 0);
        this.treeRoot = null;
    }

    sizeChanged() {
        this.implementAction(() => {
            this.commands = [];
            this.resizeTree(false);
            return this.commands;
        });
    }

    addControls() {
        const attrs = {};
        attrs.maxlength = this.INPUT_LEN;
        attrs.size = Math.min(this.INPUT_LEN, this.INPUT_MAX_LEN);
        let allowed = this.ALLOWED_CHARS;
        if (this.INSERT_MANY_VALUES?.length > 1) {
            const insertManyTexts = this.INSERT_MANY_VALUES.map(
                (v) => isNaN(v) ? v : `${v} random numbers`,
            );
            this.insertSelect = this.addSelectToAlgorithmBar(
                ["", ...this.INSERT_MANY_VALUES],
                ["Insert many values:", ...insertManyTexts],
            );
            this.insertSelect.value = "";
            this.insertSelect.onchange = this.insertSelectCallback.bind(this);
            allowed += "+";
            attrs.maxlength = this.INPUT_MANY_LEN;
            attrs.size = Math.min(this.INPUT_MANY_LEN, this.INPUT_MAX_LEN);
        }
        this.insertField = this.addControlToAlgorithmBar("Text", "", attrs);
        this.addReturnSubmit(this.insertField, allowed, this.insertCallback.bind(this));
        this.insertButton = this.addButtonToAlgorithmBar("Insert");
        this.insertButton.onclick = this.insertCallback.bind(this);

        attrs.maxlength = this.INPUT_LEN;
        attrs.size = Math.min(this.INPUT_LEN, this.INPUT_MAX_LEN);

        this.addBreakToAlgorithmBar();
        this.deleteField = this.addControlToAlgorithmBar("Text", "", attrs);
        this.addReturnSubmit(this.deleteField, this.ALLOWED_CHARS, this.deleteCallback.bind(this));
        this.deleteButton = this.addButtonToAlgorithmBar("Delete");
        this.deleteButton.onclick = this.deleteCallback.bind(this);

        this.addBreakToAlgorithmBar();
        this.findField = this.addControlToAlgorithmBar("Text", "", attrs);
        this.addReturnSubmit(this.findField, this.ALLOWED_CHARS, this.findCallback.bind(this));
        this.findButton = this.addButtonToAlgorithmBar("Find");
        this.findButton.onclick = this.findCallback.bind(this);

        this.addBreakToAlgorithmBar();
        this.printButton = this.addButtonToAlgorithmBar("Print");
        this.printButton.onclick = this.printCallback.bind(this);

        this.addBreakToAlgorithmBar();
        this.clearButton = this.addButtonToAlgorithmBar("Clear");
        this.clearButton.onclick = this.clearCallback.bind(this);
    }

    reset() {
        this.nextIndex = this.initialIndex;
        this.treeRoot = null;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Callback functions for the algorithm control bar

    insertSelectCallback() {
        let selected = this.insertSelect.value;
        if (!isNaN(selected)) selected = Array.from(
            {length: selected},
            (_) => 10 + Math.floor(90 * Math.random()),
        ).join(" ");
        this.insertField.value = selected;
        this.insertSelect.value = "";
    }

    insertCallback() {
        const insertField = this.insertField.value.trim();
        this.insertField.value = "";
        if (insertField === "") return;
        const values = insertField.split(/\s+/).map((v) => this.normalizeNumber(v));
        this.implementAction(this.insertAction.bind(this), ...values);
    }

    deleteCallback() {
        const value = this.normalizeNumber(this.deleteField.value);
        this.deleteField.value = "";
        if (value === "") return;
        this.implementAction(this.deleteAction.bind(this), value);
    }

    findCallback() {
        const value = this.normalizeNumber(this.findField.value);
        this.findField.value = "";
        if (value === "") return;
        this.implementAction(this.findAction.bind(this), value);
    }

    printCallback() {
        this.implementAction(this.printAction.bind(this));
    }

    clearCallback() {
        this.implementAction(this.clearAction.bind(this));
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Print the values in the tree

    printAction() {
        if (!this.isTreeNode(this.treeRoot)) return [];
        this.commands = [];
        this.cmd("SetText", this.messageID, "Printing tree");
        const firstLabel = this.nextIndex++;
        this.cmd("CreateLabel", firstLabel, "Output:  ", this.FIRST_PRINT_POS_X, this.getCanvasHeight() - this.FIRST_PRINT_POS_Y);
        this.cmd("Step");
        this.cmd("SetAlpha", this.highlightID, 1);
        this.cmd("SetPosition", this.highlightID, this.treeRoot.x, this.treeRoot.y);
        this.doPrint(this.treeRoot);
        this.cmd("SetAlpha", this.highlightID, 0);
        this.cmd("Step");
        for (let i = firstLabel; i < this.nextIndex; i++) {
            this.cmd("Delete", i);
        }
        this.nextIndex = firstLabel; // Reuse objects. Not necessary.
        this.cmd("SetText", this.messageID, "");
        return this.commands;
    }

    printOneLabel(label, fromID, toID = null) {
        const nextLabelID = this.nextIndex++;
        if (!toID) toID = nextLabelID - 1;
        this.cmd("CreateLabel", nextLabelID, `${label}  `, 0, 0);
        this.cmd("AlignMiddle", nextLabelID, fromID);
        this.cmd("SetForegroundColor", nextLabelID, this.PRINT_COLOR);
        this.cmd("MoveToAlignRight", nextLabelID, toID);
        return nextLabelID;
    }

    doPrint(tree) {
        console.error("Tree.doPrint: must be overridden!");
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Delete the whole tree

    clearAction() {
        this.commands = [];
        if (this.treeRoot) {
            this.doClear(this.treeRoot);
            this.treeRoot = null;
        }
        this.nextIndex = this.initialIndex;
        return this.commands;
    }

    doClear(tree) {
        for (const child of tree.getChildren()) {
            if (child) this.doClear(child);
        }
        this.removeTreeNode(tree);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Find a value in the tree

    findAction(value) {
        if (!this.isTreeNode(this.treeRoot)) return [];
        this.commands = [];
        this.cmd("SetText", this.messageID, `Searching for ${value}`);
        this.cmd("Step");
        const searchResult = this.doFind(this.treeRoot, value);
        this.postFind(searchResult);
        this.resizeTree();
        this.validateTree();
        this.cmd("SetText", this.messageID, `${value} ${searchResult.found ? "found" : "not found"}`);
        return this.commands;
    }

    doFind(node, value) {
        console.error("Tree.doFind: must be overridden!");
    }

    postFind(searchResult) {
        // BST's do not do any post-processing
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Insert one or more values into the tree

    insertAction(...values) {
        this.commands = [];
        if (values.length > 1) {
            this.cmd("SetText", this.messageID, `Inserting ${values.length} values: ${values.join(", ")}`);
            this.cmd("Step");
        }
        for (const value of values) {
            this.cmd("SetText", this.messageID, `Inserting ${value}`);
            this.cmd("Step");
            if (!this.isTreeNode(this.treeRoot)) {
                const elemID = this.nextIndex++;
                const elem = this.createTreeNode(elemID, this.getTreeRootX(), this.getTreeRootY(), value);
                this.treeRoot = elem;
                this.cmd("Step");
                this.postInsert({node: elem});
            } else {
                let node = this.treeRoot, found = false;
                if (!this.INSERT_TOPDOWN) {
                    const searchResult = this.doFind(this.treeRoot, value);
                    node = searchResult.node, found = searchResult.found;
                }
                if (found && !this.ALLOW_DUPLICATES) {
                    this.cmd("SetText", this.messageID, `Node ${node} already exists`);
                    this.cmd("Step");
                } else {
                    const insertResult = this.doInsert(node, value);
                    this.postInsert(insertResult);
                }
            }
            this.resizeTree();
            this.validateTree();
        }
        this.cmd("SetText", this.messageID, "");
        return this.commands;
    }

    doInsert(node, value) {
        console.error("Tree.doInsert: must be overridden!");
    }

    postInsert(insertResult) {
        // BST's do not do any post-processing
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Delete a value from the tree

    deleteAction(value) {
        if (!this.isTreeNode(this.treeRoot)) return [];
        this.commands = [];
        this.cmd("SetText", this.messageID, `Deleting ${value}`);
        this.cmd("Step");
        let node = this.treeRoot, found = true;
        if (!this.DELETE_TOPDOWN) {
            const searchResult = this.doFind(this.treeRoot, value);
            node = searchResult.node, found = searchResult.found;
        }
        if (!found) {
            this.cmd("SetText", this.messageID, `Node ${value} doesn't exist`);
            this.cmd("Step");
        } else {
            const deleteResult = this.doDelete(node, value);
            this.postDelete(deleteResult);
        }
        this.resizeTree();
        this.validateTree();
        this.cmd("SetText", this.messageID, "");
        return this.commands;
    }

    doDelete(node, value) {
        console.error("Tree.doDelete: must be overridden!");
    }

    postDelete(deleteResult) {
        // BST's do not do any post-processing
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Calculate canvas positions and sizes

    getTreeRootX() {
        return this.getCanvasWidth() / 2;
    }

    getTreeRootY() {
        return this.TREE_ROOT_Y;
    }

    getSpacingX() {
        return this.NODE_SPACING_X * this.getCanvasWidth() / 1000;
    }

    getSpacingY() {
        return this.NODE_SPACING_Y * this.getCanvasWidth() / 1000;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Validate the tree

    validateTree() {
        // console.log("Validating tree", this.treeRoot);
        // This should be overridden by subclasses
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Resize the tree

    resizeTree(animate = true) {
        if (!this.treeRoot) return;
        this.resizeWidths(this.treeRoot);
        let startingX = this.getTreeRootX();
        if (this.treeRoot.leftWidth && this.treeRoot.rightWidth) {
            if (this.treeRoot.leftWidth > startingX) {
                startingX = this.treeRoot.leftWidth;
            } else if (this.treeRoot.rightWidth > startingX) {
                startingX = Math.max(this.treeRoot.leftWidth, 2 * startingX - this.treeRoot.rightWidth);
            }
        }
        this.setNewPositions(this.treeRoot, startingX, this.getTreeRootY());
        const cmd = animate ? "Move" : "SetPosition";
        this.animateNewPositions(this.treeRoot, cmd);
    }

    resizeWidths(node) {
        console.error("Tree.resizeWidths: must be overridden!");
    }

    setNewPositions(node, x, y) {
        console.error("Tree.setNewPositions: must be overridden!");
    }

    animateNewPositions(node, cmd) {
        if (!node) return;
        for (const child of node.getChildren()) {
            this.animateNewPositions(child, cmd);
        }
        this.cmd(cmd, node.graphicID, node.x, node.y);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Manipluate tree nodes (must be overridden)

    createTreeNode(elemID, x, y, value) {
        console.error("Tree.createTreeNode: must be overridden!");
    }

    removeTreeNode(node) {
        console.error("Tree.removeTreeNode: must be overridden!");
    }

    isTreeNode(node) {
        console.error("Tree.isTreeNode: must be overridden!");
    }
};
