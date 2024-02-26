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


Algorithm.Tree.Radix = class RadixTree extends Algorithm.Tree {
    NODE_WIDTH = 60;

    LINK_COLOR = "#007700";
    HIGHLIGHT_CIRCLE_COLOR = "#007700";
    FOREGROUND_COLOR = "#007700";
    BACKGROUND_COLOR = "#CCFFCC";
    PRINT_COLOR = this.FOREGROUND_COLOR;
    FALSE_COLOR = "#FFFFFF";
    WIDTH_DELTA = 50;
    HEIGHT_DELTA = 80;
    STARTING_Y = 80;
    LeftMargin = 300;
    NEW_NODE_Y = 100;
    NEW_NODE_X = 50;
    FIRST_PRINT_POS_X = 50;
    PRINT_VERTICAL_GAP = 20;
    PRINT_HORIZONTAL_GAP = 50;


    RadixNode = class RadixNode {
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
            this.isword = false;
        }
    };


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

    findIndexDifference(s1, s2, id, wordIndex) {
        let index = 0;
        this.cmd("SetText", 2, "Comparing next letter in search term \n to next letter in prefix of current node");

        while (index < s1.length && index < s2.length) {
            this.cmd("SetHighlightIndex", 1, index);
            this.cmd("SetHighlightIndex", id, index);
            this.cmd("Step");
            this.cmd("SetHighlightIndex", 1, -1);
            this.cmd("SetHighlightIndex", id, -1);

            if (s1.charAt(index) === s2.charAt(index)) {
                index++;
            } else {
                break;
            }
        }
        return index;
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
        let deletedValue = this.deleteField.value.toUpperCase();
        deletedValue = deletedValue.replace(/[^a-z]/gi, "");
        if (deletedValue !== "") {
            this.deleteField.value = "";
            this.implementAction(this.deleteElement.bind(this), deletedValue);
        }
    }

    printCallback(event) {
        this.implementAction(this.printTree.bind(this), "");
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

            // this.cmd("SetText", this.printLabel1, "About to delete");
            // this.cmd("Step")
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
        if (tree.wordRemainder !== "") {
            stringSoFar = stringSoFar + tree.wordRemainder;
            const nextLabelID = this.nextIndex++;
            this.cmd("CreateLabel", nextLabelID, tree.wordRemainder, tree.x, tree.y, 0);
            this.cmd("MoveToAlignRight", nextLabelID, this.printLabel2);
            this.cmd("Step");
            this.cmd("Delete", nextLabelID);
            this.nextIndex--;
            this.cmd("SetText", this.printLabel2, stringSoFar);
        }
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
                this.cmd("Move", this.highlightID, tree.children[i].x, tree.children[i].y);
                this.cmd("Step");
                this.printTreeRec(tree.children[i], stringSoFar);
                this.cmd("Move", this.highlightID, tree.x, tree.y);
                this.cmd("SetText", this.printLabel2, stringSoFar);
                this.cmd("Step");
            }
        }
    }

    findCallback(event) {
        let findValue = this.findField.value.toUpperCase();
        findValue = findValue.replace(/[^a-z]/gi, "");
        this.findField.value = "";
        this.implementAction(this.findElement.bind(this), findValue);
    }

    findElement(findValue) {
        this.commands = [];
        this.cmd("SetText", 0, "Seaching for: ");
        this.cmd("SetText", 1, findValue);
        this.cmd("AlignRight", 1, 0);
        this.cmd("Step");
        this.highlightID = this.nextIndex++;

        const res = this.doFind(this.root, findValue);
        if (res) {
            this.cmd("SetText", 0, `String ${findValue} found`);
        } else {
            this.cmd("SetText", 0, `String ${findValue} not found`);
        }
        this.cmd("SetText", 1, "");
        this.cmd("SetText", 2, "");

        return this.commands;
    }

    doFind(tree, value) {
        if (tree == null) {
            this.cmd("SetText", 2, "Empty tree found.   String not in the tree");
            this.cmd("step");
            return null;
        }
        this.cmd("SetHighlight", tree.graphicID, 1);

        const remain = tree.wordRemainder;
        const indexDifference = this.findIndexDifference(value, remain, tree.graphicID, 0);

        if (indexDifference === remain.length) {
            this.cmd("SetText", 2, "Reached the end of the prefix stored at this node");
            this.cmd("Step");

            if (value.length > indexDifference) {
                this.cmd("SetText", 2, `Recusively search remaining string  \nin the '${value.charAt(indexDifference)}' child`);
                this.cmd("Step");
                this.cmd("SetHighlight", tree.graphicID, 0);
                this.cmd("SetText", 1, value.substring(indexDifference));

                const index = value.charCodeAt(indexDifference) - "A".charCodeAt(0);
                const noChild = tree.children[index] == null;

                if (noChild) {
                    this.cmd("SetText", 2, `Child '${value.charAt(indexDifference)}' does not exit.  \nString is not in the tree.`);
                    this.cmd("Step");
                    return null;
                } else {
                    this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
                    this.cmd("SetWidth", this.highlightID, this.NODE_WIDTH);

                    this.cmd("Step");
                    this.cmd("Move", this.highlightID, tree.children[index].x, tree.children[index].y);
                    this.cmd("Step");

                    this.cmd("Delete", this.highlightID);
                }

                return this.doFind(tree.children[index], value.substring(indexDifference));
            }

            this.cmd("SetText", 2, "Reached the end of the string.  Check if current node is \"True\"");
            this.cmd("Step");
            this.cmd("SetText", 2, "");

            if (tree.isword) {
                this.cmd("SetText", 2, "Node is \"True\", string is in tree");
                this.cmd("Step");
                this.cmd("SetText", 2, "");
                this.cmd("SetHighlight", tree.graphicID, 0);
                return tree;
            } else {
                this.cmd("SetText", 2, "Node is \"False\", string is not in tree");
                this.cmd("Step");
                this.cmd("SetText", 2, "");
                this.cmd("SetHighlight", tree.graphicID, 0);
                return null;
            }
        } else {
            this.cmd("SetText", 2, "Reached end of search string, \nStill characters remaining at node\nString not in tree");
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("SetText", 2, "");
            return null;
        }
    }

    deleteElement(deletedValue) {
        this.commands = [];
        this.cmd("SetText", 0, "Deleting: ");
        this.cmd("SetText", 1, deletedValue);
        this.cmd("AlignRight", 1, 0);

        const node = this.doFind(this.root, deletedValue);

        if (node == null) {
            this.cmd("SetText", 2, "String not in the tree, nothing to delete");
            this.cmd("Step");
            this.cmd("SetText", 0, "");
            this.cmd("SetText", 1, "");
            this.cmd("SetText", 2, "");
        } else {
            node.isword = false;
            this.cmd("SetText", 2, "Found string to delete, setting node to \"False\"");
            this.cmd("Step");
            this.cmd("SetBackgroundColor", node.graphicID, this.FALSE_COLOR);
            this.cmd("Step");
            this.cleanupAfterDelete(node);
            this.cmd("SetText", 0, "");
            this.cmd("SetText", 1, "");
            this.cmd("SetText", 2, "");
        }

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

    isLeaf(tree) {
        if (tree == null) {
            return false;
        }
        for (let i = 0; i < 26; i++) {
            if (tree.children[i] != null) {
                return false;
            }
        }
        return true;
    }

    getParentIndex(tree) {
        if (tree.parent == null) {
            return -1;
        }
        const par = tree.parent;
        for (let i = 0; i < 26; i++) {
            if (par.children[i] === tree) {
                return i;
            }
        }
        return -1;
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
        } else if (children === 1 && !tree.isword) {
            let childIndex = -1;
            for (let i = 0; i < 26; i++) {
                if (tree.children[i] != null) {
                    childIndex = i;
                    break;
                }
            }
            this.cmd("SetText", 2, "Deletion left us with a \"False\" node\nContaining one child.  Combining ...");
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID, 0);

            const child = tree.children[childIndex];
            child.wordRemainder = tree.wordRemainder + child.wordRemainder;
            this.cmd("SetText", child.graphicID, child.wordRemainder);
            this.cmd("Disconnect", tree.graphicID, child.graphicID);

            if (tree.parent == null) {
                child.parent = null;
                this.root = child;
                this.cmd("Delete", tree.graphicID);
            } else {
                const parIndex = this.getParentIndex(tree);
                this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
                tree.parent.children[parIndex] = child;
                child.parent = tree.parent;
                this.cmd("Connect", tree.parent.graphicID, child.graphicID, this.FOREGROUND_COLOR, 0, false, child.wordRemainder.charAt(0));
                this.cmd("Delete", tree.graphicID);
            }
            this.resizeTree();
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
        this.cmd("SetText", 1, word);
        this.cmd("AlignRight", 1, 0);
        this.cmd("Step");
        this.highlightID = this.nextIndex++;
        this.root = this.addR(word.toUpperCase(), this.root, this.LEFT_MARGIN + this.NODE_WIDTH / 2 + 1, this.STARTING_Y, 0);
        this.resizeTree();
        this.cmd("SetText", 0, "");
        this.cmd("SetText", 1, "");

        return this.commands;
    }

    addR(s, rt, startX, startY, wordIndex) {
        if (rt == null) {
            this.cmd("CreateCircle", this.nextIndex, s, this.NEW_NODE_X, this.NEW_NODE_Y);
            this.cmd("SetForegroundColor", this.nextIndex, this.FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", this.nextIndex, this.BACKGROUND_COLOR);
            this.cmd("SetWidth", this.nextIndex, this.NODE_WIDTH);
            this.cmd("SetText", 2, `Reached an empty tree.  Creating a node containing ${s}`);
            this.cmd("Step");
            this.cmd("SetText", 2, "");
            rt = new this.RadixNode(s, this.nextIndex, startX, startY);
            this.nextIndex++;
            rt.isword = true;
            return rt;
        }

        this.cmd("SetHighlight", rt.graphicID, 1);

        const indexDifference = this.findIndexDifference(s, rt.wordRemainder, rt.graphicID, wordIndex);

        // this.cmd("CreateHighlightCircle", this.highlightID, BST.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
        // this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
        // this.cmd("Step");
        if (indexDifference === rt.wordRemainder.length) {
            this.cmd("SetText", 2, "Reached the end of the prefix stored at this node");
            this.cmd("Step");

            if (s.length > indexDifference) {
                this.cmd("SetText", 2, `Recusively insert remaining string  \ninto the '${s.charAt(indexDifference)}' child`);
                this.cmd("Step");
                this.cmd("SetHighlight", rt.graphicID, 0);
                this.cmd("SetText", 1, s.substring(indexDifference));

                // TODO: HIGHLIGHT CIRCLE!
                const index = s.charCodeAt(indexDifference) - "A".charCodeAt(0);
                const noChild = rt.children[index] == null;

                if (noChild) {
                    this.cmd("SetText", 2, `Child '${s.charAt(indexDifference)}' does not exit.  Creating ...`);
                    this.cmd("Step");
                } else {
                    this.cmd("CreateHighlightCircle", this.highlightID, this.HIGHLIGHT_CIRCLE_COLOR, rt.x, rt.y);
                    this.cmd("SetWidth", this.highlightID, this.NODE_WIDTH);

                    this.cmd("Step");
                    this.cmd("Move", this.highlightID, rt.children[index].x, rt.children[index].y);
                    this.cmd("Step");

                    this.cmd("Delete", this.highlightID);
                    // DO HIGHILIGHT CIRCLE THING HERE
                }

                const connect = rt.children[index] == null;
                rt.children[index] = this.addR(s.substring(indexDifference), rt.children[index], rt.x, rt.y, wordIndex + indexDifference);
                rt.children[index].parent = rt;
                if (connect) {
                    this.cmd("Connect", rt.graphicID, rt.children[index].graphicID, this.FOREGROUND_COLOR, 0, false, s.charAt(indexDifference));
                }
                return rt;
            }
            this.cmd("SetText", 2, "Reached the end of the string.  Set Current node to \"True\"");
            this.cmd("Step");
            this.cmd("SetText", 2, "");

            this.cmd("SetBackgroundColor", rt.graphicID, this.BACKGROUND_COLOR);
            this.cmd("Step");
            this.cmd("SetHighlight", rt.graphicID, 0);

            rt.isword = true;
            return rt;
        }

        const firstRemainder = rt.wordRemainder.substring(0, indexDifference);
        const secondRemainder = rt.wordRemainder.substring(indexDifference);

        this.cmd("SetText", 2, "Reached a mismatch in prefix. \nCreate a new node with common prefix");

        this.cmd("CreateCircle", this.nextIndex, firstRemainder, this.NEW_NODE_X, this.NEW_NODE_Y);
        this.cmd("SetForegroundColor", this.nextIndex, this.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", this.nextIndex, this.FALSE_COLOR);
        this.cmd("SetWidth", this.nextIndex, this.NODE_WIDTH);
        this.cmd("Step");

        const newNode = new this.RadixNode(firstRemainder, this.nextIndex, 0, 0);
        this.nextIndex++;

        newNode.wordRemainder = firstRemainder;

        let index = rt.wordRemainder.charCodeAt(indexDifference) - "A".charCodeAt(0);
        newNode.parent = rt.parent;
        newNode.children[index] = rt;
        if (rt.parent != null) {
            this.cmd("Disconnect", rt.parent.graphicID, rt.graphicID);
            this.cmd("Connect", rt.parent.graphicID, newNode.graphicID, this.FOREGROUND_COLOR, 0, false, newNode.wordRemainder.charAt(0));
            const childIndex = newNode.wordRemainder.charCodeAt(0) - "A".charCodeAt(0);
            rt.parent.children[childIndex] = newNode;
            rt.parent = newNode;
        } else {
            this.root = newNode;
        }
        this.cmd("SetHighlight", rt.graphicID, 0);

        rt.parent = newNode;

        this.cmd("SetText", 2, "Connect new node to the old, and reset prefix stored at previous node");

        this.cmd("Connect", newNode.graphicID, newNode.children[index].graphicID, this.FOREGROUND_COLOR, 0, false, rt.wordRemainder.charAt(indexDifference));
        rt.wordRemainder = secondRemainder;
        this.cmd("SetText", rt.graphicID, rt.wordRemainder);
        this.cmd("Step");

        this.resizeTree();

        if (indexDifference === s.length) {
            newNode.isword = true;
            this.cmd("SetBackgroundColor", newNode.graphicID, this.BACKGROUND_COLOR);
        } else {
            this.cmd("SetBackgroundColor", newNode.graphicID, this.FALSE_COLOR);
            index = s.charCodeAt(indexDifference) - "A".charCodeAt(0);
            this.cmd("SetText", 1, s.substring(indexDifference));

            newNode.children[index] = this.addR(s.substring(indexDifference), null, rt.x, rt.y, indexDifference + wordIndex);
            newNode.children[index].parent = newNode;
            this.cmd("Connect", newNode.graphicID, newNode.children[index].graphicID, this.FOREGROUND_COLOR, 0, false, s.charAt(indexDifference));
        }
        return newNode;
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
};