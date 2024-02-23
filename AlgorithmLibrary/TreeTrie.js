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
/* exported TreeTrie */
///////////////////////////////////////////////////////////////////////////////


class TrieNode {
    constructor(val, id, initialX, initialY) {
        this.wordRemainder = val;
        this.x = initialX;
        this.y = initialY;
        this.graphicID = id;
        this.children = new Array(26);
        this.childWidths = new Array(26);
        for (let i = 0; i < 26; i++) {
            this.children[i] = null;
            this.childWidths[i] = 0;
        }
        this.width = 0;
        this.parent = null;
    }
}


class TreeTrie extends Algorithm {
    FOREGROUND_COLOR = "#007700";
    BACKGROUND_COLOR = "#EEFFEE";

    LINK_COLOR = this.FOREGROUND_COLOR;
    HIGHLIGHT_CIRCLE_COLOR = this.FOREGROUND_COLOR;
    PRINT_COLOR = this.FOREGROUND_COLOR;
    TRUE_COLOR = this.BACKGROUND_COLOR;
    FALSE_COLOR = "#FFFFFF";

    NODE_WIDTH = 30;

    WIDTH_DELTA = 50;
    HEIGHT_DELTA = 50;
    STARTING_Y = 80;
    LeftMargin = 300;
    NEW_NODE_Y = 100;
    NEW_NODE_X = 50;
    FIRST_PRINT_POS_X = 50;
    PRINT_VERTICAL_GAP = 20;
    PRINT_HORIZONTAL_GAP = 50;

    constructor(am) {
        super();
        this.init(am);
    }

    init(am) {
        super.init(am);
        this.addControls();

        this.nextIndex = 0;
        this.commands = [];
        this.cmd("CreateLabel", 0, "", 20, 10, 0);
        this.cmd("CreateLabel", 1, "", 20, 10, 0);
        this.cmd("CreateLabel", 2, "", 20, 30, 0);
        this.nextIndex = 3;
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();

        this.sizeChanged();
    }

    sizeChanged() {
        const w = this.getCanvasWidth();
        const h = this.getCanvasHeight();

        this.startingX = w / 2;
        this.firstPrintPosY = h - 2 * this.PRINT_VERTICAL_GAP;
        this.printMax = w - 10;

        this.implementAction(() => {
            this.commands = [];
            this.resizeTree();
            return this.commands;
        });
    }

    addControls() {
        this.insertField = this.addControlToAlgorithmBar("Text", "", {maxlength: 12, size: 12});
        this.addReturnSubmit(this.insertField, "ALPHA", this.insertCallback.bind(this));
        this.insertButton = this.addButtonToAlgorithmBar("Insert");
        this.insertButton.onclick = this.insertCallback.bind(this);

        this.deleteField = this.addControlToAlgorithmBar("Text", "", {maxlength: 12, size: 12});
        this.addReturnSubmit(this.deleteField, "ALPHA", this.deleteCallback.bind(this));
        this.deleteButton = this.addButtonToAlgorithmBar("Delete");
        this.deleteButton.onclick = this.deleteCallback.bind(this);

        this.findField = this.addControlToAlgorithmBar("Text", "", {maxlength: 12, size: 12});
        this.addReturnSubmit(this.findField, "ALPHA", this.findCallback.bind(this));
        this.findButton = this.addButtonToAlgorithmBar("Find");
        this.findButton.onclick = this.findCallback.bind(this);

        this.printButton = this.addButtonToAlgorithmBar("Print");
        this.printButton.onclick = this.printCallback.bind(this);
    }

    reset() {
        this.nextIndex = 3;
        this.root = null;
    }

    insertCallback(event) {
        const insertedValue = this.insertField.value;
        if (insertedValue !== "") {
            this.insertField.value = "";
            this.implementAction(this.add.bind(this), insertedValue);
        }
    }

    deleteCallback(event) {
        const deletedValue = this.deleteField.value;
        if (deletedValue !== "") {
            this.deleteField.value = "";
            this.implementAction(this.deleteElement.bind(this), deletedValue);
        }
    }

    printCallback(event) {
        this.implementAction(this.printTree.bind(this), "");
    }

    findCallback(event) {
        const findValue = this.findField.value;
        if (findValue !== "") {
            this.findField.value = "";
            this.implementAction(this.findElement.bind(this), findValue);
        }
    }

    printTree(unused) {
        this.commands = [];
        if (this.root != null) {
            this.highlightID = this.nextIndex++;
            this.printLabel1 = this.nextIndex++;
            this.printLabel2 = this.nextIndex++;
            const firstLabel = this.nextIndex++;
            this.cmd("CreateLabel", firstLabel, "Output: ", this.FIRST_PRINT_POS_X, this.firstPrintPosY);
            this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, this.root.x, this.root.y);
            this.cmd("SetWidth", this.highlightID, this.NODE_WIDTH);
            this.cmd("CreateLabel", this.printLabel1, "Current String: ", 20, 10, 0);
            this.cmd("CreateLabel", this.printLabel2, "", 20, 10, 0);
            this.cmd("AlignRight", this.printLabel2, this.printLabel1);
            this.xPosOfNextLabel = this.FIRST_PRINT_POS_X;
            this.yPosOfNextLabel = this.firstPrintPosY;
            this.printTreeRec(this.root, "");

            this.cmd("Delete", this.highlightID);
            this.cmd("Delete", this.printLabel1);
            this.cmd("Delete", this.printLabel2);
            this.cmd("Step");

            for (let i = firstLabel; i < this.nextIndex; i++) {
                this.cmd("Delete", i);
            }
            this.nextIndex = this.highlightID; /// Reuse objects.  Not necessary.
        }
        return this.commands;
    }

    printTreeRec(tree, stringSoFar) {
        if (tree.isword) {
            const nextLabelID = this.nextIndex++;
            this.cmd("CreateLabel", nextLabelID, `${stringSoFar}  `, 20, 10, 0);
            this.cmd("SetForegroundColor", nextLabelID, this.PRINT_COLOR);
            this.cmd("AlignRight", nextLabelID, this.printLabel1, this.PRINT_COLOR);
            this.cmd("MoveToAlignRight", nextLabelID, nextLabelID - 1);
            this.cmd("Step");

            this.xPosOfNextLabel += this.PRINT_HORIZONTAL_GAP;
            if (this.xPosOfNextLabel > this.printMax) {
                this.xPosOfNextLabel = this.FIRST_PRINT_POS_X;
                this.yPosOfNextLabel += this.PRINT_VERTICAL_GAP;
            }
        }
        for (let i = 0; i < 26; i++) {
            if (tree.children[i] != null) {
                const stringSoFar2 = stringSoFar + tree.children[i].wordRemainder;
                const nextLabelID = this.nextIndex++;
                const fromx = (tree.children[i].x + tree.x) / 2 + this.NODE_WIDTH / 2;
                const fromy = (tree.children[i].y + tree.y) / 2;
                this.cmd("CreateLabel", nextLabelID, tree.children[i].wordRemainder, fromx, fromy, 0);
                this.cmd("MoveToAlignRight", nextLabelID, this.printLabel2);
                this.cmd("Move", this.highlightID, tree.children[i].x, tree.children[i].y);
                this.cmd("Step");
                this.cmd("Delete", nextLabelID);
                this.nextIndex--;
                this.cmd("SetText", this.printLabel2, stringSoFar2);

                this.printTreeRec(tree.children[i], stringSoFar2);
                this.cmd("Move", this.highlightID, tree.x, tree.y);
                this.cmd("SetText", this.printLabel2, stringSoFar);
                this.cmd("Step");
            }
        }
    }

    findElement(word) {
        this.commands = [];
        this.cmd("SetText", 0, "Finding: ");
        this.cmd("SetText", 1, `"${word}"`);
        this.cmd("AlignRight", 1, 0);
        this.cmd("Step");

        const node = this.doFind(this.root, word);
        if (node != null) {
            this.cmd("SetText", 0, `Found "${word}"`);
        } else {
            this.cmd("SetText", 0, `"${word}" not Found`);
        }
        this.cmd("SetText", 1, "");
        this.cmd("SetText", 2, "");
        return this.commands;
    }

    doFind(tree, s) {
        if (tree == null) {
            return null;
        }
        this.cmd("SetHighlight", tree.graphicID, 1);

        if (s.length === 0) {
            if (tree.isword) {
                this.cmd("SetText", 2, "Reached the end of the string \nCurrent node is True\nWord is in the tree");
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                return tree;
            } else {
                this.cmd("SetText", 2, "Reached the end of the string \nCurrent node is False\nWord is Not the tree");
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                return null;
            }
        } else {
            this.cmd("SetHighlightIndex", 1, 1);
            const index = s.charCodeAt(0) - "A".charCodeAt(0);
            if (tree.children[index] == null) {
                this.cmd("SetText", 2, `Child ${s.charAt(0)} does not exist\nWord is Not the tree`);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                return null;
            }
            this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
            this.cmd("SetWidth", this.highlightID, this.NODE_WIDTH);
            this.cmd("SetText", 2, `Making recursive call to ${s.charAt(0)} child, passing in ${s.substring(1)}`);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("SetHighlightIndex", 1, -1);
            this.cmd("SetText", 1, `"${s.substring(1)}"`);
            this.cmd("Move", this.highlightID, tree.children[index].x, tree.children[index].y);
            this.cmd("Step");
            this.cmd("Delete", this.highlightID);
            return this.doFind(tree.children[index], s.substring(1));
        }
    }

    insertElement(insertedValue) {
        this.cmd("SetText", 0, "");
        return this.commands;
    }

    deleteElement(word) {
        this.commands = [];
        this.cmd("SetText", 0, "Deleting: ");
        this.cmd("SetText", 1, `"${word}"`);
        this.cmd("AlignRight", 1, 0);
        this.cmd("Step");

        const node = this.doFind(this.root, word);
        if (node != null) {
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("SetText", 2, `Found "${word}", setting value in tree to False`);
            this.cmd("step");
            this.cmd("SetBackgroundColor", node.graphicID, this.FALSE_COLOR);
            node.isword = false;
            this.cmd("SetHighlight", node.graphicID, 0);
            this.cleanupAfterDelete(node);
            this.resizeTree();
        } else {
            this.cmd("SetText", 2, `"${word}" not in tree, nothing to delete`);
            this.cmd("step");
            this.cmd("SetHighlightIndex", 1, -1);
        }

        this.cmd("SetText", 0, "");
        this.cmd("SetText", 1, "");
        this.cmd("SetText", 2, "");
        return this.commands;
    }

    numChildren(tree) {
        if (tree == null) {
            return 0;
        }
        let children = 0;
        for (let i = 0; i < 26; i++) {
            if (tree.children[i] != null) {
                children++;
            }
        }
        return children;
    }

    cleanupAfterDelete(tree) {
        const children = this.numChildren(tree);
        if (children === 0 && !tree.isword) {
            this.cmd("SetText", 2, "Deletion left us with a \"False\" leaf\nRemoving false leaf");
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            if (tree.parent != null) {
                let index = 0;
                while (tree.parent.children[index] !== tree) {
                    index++;
                }
                this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                this.cmd("Delete", tree.graphicID, 0);
                tree.parent.children[index] = null;
                this.cleanupAfterDelete(tree.parent);
            } else {
                this.cmd("Delete", tree.graphicID, 0);
                this.root = null;
            }
        }
    }

    resizeTree() {
        this.resizeWidths(this.root);
        if (this.root != null) {
            const startingPoint = this.root.width / 2 + 1 + this.LeftMargin;
            this.setNewPositions(this.root, startingPoint, this.STARTING_Y);
            this.animateNewPositions(this.root);
            this.cmd("Step");
        }
    }

    add(word) {
        this.commands = [];
        this.cmd("SetText", 0, "Inserting; ");
        this.cmd("SetText", 1, `"${word}"`);
        this.cmd("AlignRight", 1, 0);
        this.cmd("Step");
        if (this.root == null) {
            this.cmd("CreateCircle", this.nextIndex, "", this.NEW_NODE_X, this.NEW_NODE_Y);
            this.cmd("SetForegroundColor", this.nextIndex, this.FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", this.nextIndex, this.FALSE_COLOR);
            this.cmd("SetWidth", this.nextIndex, this.NODE_WIDTH);
            this.cmd("SetText", 2, "Creating a new root");
            this.root = new TrieNode("", this.nextIndex, this.NEW_NODE_X, this.NEW_NODE_Y);
            this.cmd("Step");
            this.resizeTree();
            this.cmd("SetText", 2, "");
            this.highlightID = this.nextIndex++;
            this.nextIndex++;
        }
        this.addR(word.toUpperCase(), this.root);
        this.cmd("SetText", 0, "");
        this.cmd("SetText", 1, "");
        this.cmd("SetText", 2, "");
        return this.commands;
    }

    addR(s, tree) {
        this.cmd("SetHighlight", tree.graphicID, 1);

        if (s.length === 0) {
            this.cmd("SetText", 2, "Reached the end of the string \nSet current node to true");
            this.cmd("Step");
            // this.cmd("SetText", tree.graphicID, "T");
            this.cmd("SetBackgroundColor", tree.graphicID, this.TRUE_COLOR);
            this.cmd("SetHighlight", tree.graphicID, 0);
            tree.isword = true;
            return;
        } else {
            this.cmd("SetHighlightIndex", 1, 1);
            const index = s.charCodeAt(0) - "A".charCodeAt(0);
            if (tree.children[index] == null) {
                this.cmd("CreateCircle", this.nextIndex, s.charAt(0), this.NEW_NODE_X, this.NEW_NODE_Y);
                this.cmd("SetForegroundColor", this.nextIndex, this.FOREGROUND_COLOR);
                this.cmd("SetBackgroundColor", this.nextIndex, this.FALSE_COLOR);
                this.cmd("SetWidth", this.nextIndex, this.NODE_WIDTH);
                this.cmd("SetText", 2, `Child ${s.charAt(0)} does not exist.  Creating ... `);
                tree.children[index] = new TrieNode(s.charAt(0), this.nextIndex, this.NEW_NODE_X, this.NEW_NODE_Y);
                tree.children[index].parent = tree;
                this.cmd("Connect", tree.graphicID, tree.children[index].graphicID, this.FOREGROUND_COLOR, 0, false, s.charAt(0));

                this.cmd("Step");
                this.resizeTree();
                this.cmd("SetText", 2, "");
                this.nextIndex++;
                this.highlightID = this.nextIndex++;
            }
            this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
            this.cmd("SetWidth", this.highlightID, this.NODE_WIDTH);
            this.cmd("SetText", 2, `Making recursive call to ${s.charAt(0)} child, passing in "${s.substring(1)}"`);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("SetHighlightIndex", 1, -1);
            this.cmd("SetText", 1, `"${s.substring(1)}"`);

            this.cmd("Move", this.highlightID, tree.children[index].x, tree.children[index].y);
            this.cmd("Step");
            this.cmd("Delete", this.highlightID);
            this.addR(s.substring(1), tree.children[index]);
        }
    }

    setNewPositions(tree, xPosition, yPosition) {
        if (tree != null) {
            tree.x = xPosition;
            tree.y = yPosition;
            let newX = xPosition - tree.width / 2;
            const newY = yPosition + this.HEIGHT_DELTA;
            for (let i = 0; i < 26; i++) {
                if (tree.children[i] != null) {
                    this.setNewPositions(tree.children[i], newX + tree.children[i].width / 2, newY);
                    newX = newX + tree.children[i].width;
                }
            }
        }
    }

    animateNewPositions(tree) {
        if (tree != null) {
            this.cmd("Move", tree.graphicID, tree.x, tree.y);
            for (let i = 0; i < 26; i++) {
                this.animateNewPositions(tree.children[i]);
            }
        }
    }

    resizeWidths(tree) {
        if (tree == null) {
            return 0;
        }
        let size = 0;
        for (let i = 0; i < 26; i++) {
            tree.childWidths[i] = this.resizeWidths(tree.children[i]);
            size += tree.childWidths[i];
        }
        tree.width = Math.max(size, this.NODE_WIDTH + 4);
        return tree.width;
    }
}
