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

    STARTING_Y = 50;

    NODE_SIZE = 40;
    NODE_SPACING = 20;

    FIRST_PRINT_POS_X = 50;
    PRINT_VERTICAL_GAP = 20;
    PRINT_HORIZONTAL_GAP = 50;

    MESSAGE_X = 10;
    MESSAGE_Y = 10;

    ALLOW_DUPLICATES = true;

    INSERT_MANY_VALUES = [
        "A L G O R I T H M",
        "C O M P L E X I T Y",
        "R E C U R S I O N",
        "A B C D E F G H J K",
    ];


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

        this.messageID = this.nextIndex++;
        this.cmd("CreateLabel", this.messageID, "", this.MESSAGE_X, this.MESSAGE_Y, 0);

        this.highlightID = this.nextIndex++;
        this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, 0, 0);
        this.cmd("SetHighlight", this.highlightID, true);
        this.cmd("SetAlpha", this.highlightID, 0);

        this.treeRoot = null;

        this.initialIndex = this.nextIndex;
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    sizeChanged() {
        this.implementAction(() => {
            this.commands = [];
            this.resizeTree(false);
            return this.commands;
        });
    }

    addControls() {
        if (this.INSERT_MANY_VALUES?.length > 1) {
            this.insertSelect = this.addSelectToAlgorithmBar(
                ["", ...this.INSERT_MANY_VALUES],
                ["Insert...", ...this.INSERT_MANY_VALUES],
            );
            this.insertSelect.value = "";
            this.insertSelect.onchange = (event) => {
                this.insertField.value = this.insertSelect.value;
                this.insertSelect.value = "";
            };
        }
        this.insertField = this.addControlToAlgorithmBar("Text", "", {maxlength: 20, size: 15});
        this.addReturnSubmit(this.insertField, "ALPHANUM+", this.insertCallback.bind(this));
        this.insertButton = this.addButtonToAlgorithmBar("Insert");
        this.insertButton.onclick = this.insertCallback.bind(this);

        this.addBreakToAlgorithmBar();
        this.deleteField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.deleteField, "ALPHANUM", this.deleteCallback.bind(this));
        this.deleteButton = this.addButtonToAlgorithmBar("Delete");
        this.deleteButton.onclick = this.deleteCallback.bind(this);

        this.addBreakToAlgorithmBar();
        this.findField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.findField, "ALPHANUM", this.findCallback.bind(this));
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

    insertCallback() {
        if (this.insertField.value.trim() === "") return;
        const values = this.insertField.value.trim().split(/\s+/).map(v => this.normalizeNumber(v));
        this.insertField.value = "";
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
    // Printing the values in the tree

    printAction() {
        if (!this.treeRoot) return [];
        this.commands = [];
        this.cmd("SetText", this.messageID, "Printing tree");
        this.cmd("Step");
        this.cmd("SetAlpha", this.highlightID, 1);
        this.cmd("SetPosition", this.highlightID, this.treeRoot.x, this.treeRoot.y);
        const firstLabel = this.nextIndex;

        this.printPosX = this.FIRST_PRINT_POS_X;
        this.printPosY = this.getCanvasHeight() - 3 * this.PRINT_VERTICAL_GAP;

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

    doPrint(tree) {
        console.error("Tree.doPrint: must be overridden!");
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Deleting the tree

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
        console.error("Tree.doClear: must be overridden!");
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Finding a value in the tree

    findAction(value) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Searching for ${value}`);
        this.cmd("Step");
        const [found, node] = this.doFind(value, this.treeRoot);
        this.postFind(found, node);
        this.cmd("SetAlpha", this.highlightID, 0);
        this.cmd("SetText", this.messageID, `${value} ${found ? "found" : "not found"}`);
        this.validateTree();
        return this.commands;
    }

    doFind(value, tree) {
        console.error("Tree.doFind: must be overridden!");
    }

    postFind(found, node) {
        // BST's do not do any post-processing
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Inserting one or more values into the tree

    insertAction(...values) {
        this.commands = [];
        if (values.length > 1) {
            this.cmd("SetText", this.messageID, `Inserting ${values.length} values: ${values.join(", ")}`);
            this.cmd("Step");
        }
        for (const value of values) {
            this.cmd("SetText", this.messageID, `Inserting ${value}`);
            const x = this.STARTING_Y, y = 2 * this.STARTING_Y;
            const elemID = this.nextIndex++;
            const elem = this.createTreeNode(elemID, x, y, value);
            this.cmd("Step");
            if (this.treeRoot == null) {
                this.treeRoot = elem;
            } else {
                const [inserted, node] = this.doInsert(elem, this.treeRoot);
                this.postInsert(inserted, node);
            }
            this.cmd("SetAlpha", this.highlightID, 0);
            this.cmd("SetText", this.messageID, "");
            this.resizeTree();
            this.cmd("Step");
            this.validateTree();
        }
        return this.commands;
    }

    doInsert(elem, tree) {
        console.error("Tree.doInsert: must be overridden!");
    }

    postInsert(inserted, node) {
        // BST's do not do any post-processing
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Deleting a value from the tree

    deleteAction(value) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Deleting ${value}`);
        this.cmd("Step");
        const [deleted, node] = this.doDelete(value, this.treeRoot);
        this.postDelete(deleted, node);
        this.cmd("SetAlpha", this.highlightID, 0);
        this.cmd("SetText", this.messageID, "");
        this.resizeTree();
        this.validateTree();
        return this.commands;
    }

    doDelete(value, tree) {
        console.error("Tree.doDelete: must be overridden!");
    }

    postDelete(deleted, node) {
        // BST's do not do any post-processing
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Calculating canvas positions and sizes

    getStartingX() {
        return this.getCanvasWidth() / 2;
    }

    getStartingY() {
        return this.STARTING_Y;
    }

    getSpacingX() {
        return this.NODE_SPACING * this.getCanvasWidth() / 1000;
    }

    getSpacingY() {
        return this.getSpacingX();
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Validating the tree

    validateTree(tree, parent = null) {
        console.error("Tree.validateTree: must be overridden!");
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Resizing the tree (must be overridden)

    resizeTree(animate = true) {
        console.error("Tree.resizeTree: must be overridden!");
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Creating and removing tree nodes (must be overridden)

    createTreeNode(elemID, x, y, value) {
        console.error("Tree.createTreeNode: must be overridden!");
    }

    removeTreeNode(node) {
        console.error("Tree.removeTreeNode: must be overridden!");
    }
};
