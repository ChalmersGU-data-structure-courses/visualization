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
/* exported HeapLeftist */
///////////////////////////////////////////////////////////////////////////////


class LeftistHeapNode {
    constructor(val, id, nplID, initialX, initialY) {
        this.data = val;
        this.x = (initialX == null) ? 0 : initialX;
        this.y = (initialY == null) ? 0 : initialY;
        this.npX = initialX - HeapLeftist.NPL_OFFSET_X;
        this.npY = initialY - HeapLeftist.NPL_OFFSET_Y;

        this.graphicID = id;
        this.nplID = nplID;
        this.npl = 0;
        this.left = null;
        this.right = null;
        this.leftWidth = 0;
        this.rightWidth = 0;
        this.parent = null;
    }

    disconnectFromParent() {
        if (this.parent != null) {
            if (this.parent.right === this) {
                this.parent.right = null;
            } else if (this.parent.left === this) {
                this.parent.left == null;
            }
        }
    }
}


class HeapLeftist extends Algorithm {
    static LINK_COLOR = "#007700";
    static HIGHLIGHT_CIRCLE_COLOR = "#007700";
    static FOREGROUND_COLOR = "#007700";
    static BACKGROUND_COLOR = "#EEFFEE";

    static WIDTH_DELTA = 50;
    static HEIGHT_DELTA = 50;
    static STARTING_Y = 85;

    static INSERT_X = 50;
    static INSERT_Y = 45;
    static BACKGROUND_ALPHA = 0.5;

    static MESSAGE_X = 20;
    static MESSAGE_Y = 10;

    static NPL_OFFSET_X = 20;
    static NPL_OFFSET_Y = 20;
    static NPL_COLOR = "#0000FF";

    static MESSAGE_ID = 0;

    constructor(am) {
        super();
        this.init(am);
    }

    init(am) {
        super.init(am);
        this.addControls();
        this.treeRoot = null;
        this.secondaryRoot = null;
        this.animationManager.setAllLayers([0, 1]);
        this.nextIndex = 1;
        this.commands = [];
        this.cmd("CreateLabel", 0, "", HeapLeftist.MESSAGE_X, HeapLeftist.MESSAGE_Y, 0);
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
        this.commands = [];
    }

    addControls() {
        this.insertField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.insertField, "int", this.insertCallback.bind(this));

        this.insertButton = this.addControlToAlgorithmBar("Button", "Insert");
        this.insertButton.onclick = this.insertCallback.bind(this);

        this.removeSmallestButton = this.addControlToAlgorithmBar("Button", "Remove Smallest");
        this.removeSmallestButton.onclick = this.removeSmallestCallback.bind(this);

        this.clearHeapButton = this.addControlToAlgorithmBar("Button", "Clear Heap");
        this.clearHeapButton.onclick = this.clearCallback.bind(this);

        this.showNPLBox = this.addCheckboxToAlgorithmBar("Show Null Path Lengths");
        this.showNPLBox.checked = true;
        this.showNPLBox.onclick = this.NPLChangedHandler.bind(this);
    }

    NPLChangedHandler(logicalRep, event) {
        if (this.showNPLBox.checked) {
            this.animationManager.setAllLayers([0, 1]);
        } else {
            this.animationManager.setAllLayers([0]);
        }
    }

    insertCallback(event) {
        const insertedValue = this.normalizeNumber(this.insertField.value);
        if (insertedValue !== "") {
            this.insertField.value = "";
            this.implementAction(this.insertElement.bind(this), insertedValue);
        }
    }

    clearCallback(event) {
        this.implementAction(this.clear.bind(this, ""));
    }

    clear(ignored) {
        this.commands = [];
        this.clearTree(this.treeRoot);
        this.treeRoot = null;
        this.nexIndex = 1;
        return this.commands;
    }

    clearTree(tree) {
        if (tree != null) {
            this.cmd("Delete", tree.graphicID);
            this.cmd("Delete", tree.nplID);
            this.clearTree(tree.left);
            this.clearTree(tree.right);
        }
    }

    reset() {
        this.treeRoot = null;
        this.secondaryRoot = null;
        this.nextIndex = 1;
    }

    removeSmallestCallback(event) {
        this.implementAction(this.removeSmallest.bind(this), "");
    }

    removeSmallest(dummy) {
        this.commands = [];

        if (this.treeRoot != null) {
            this.highlightLeft = this.nextIndex++;
            this.highlightRight = this.nextIndex++;

            this.cmd("SetText", HeapLeftist.MESSAGE_ID, "Remove root element, leaving two subtrees");
            if (this.treeRoot.left != null) {
                this.cmd("Disconnect", this.treeRoot.graphicID, this.treeRoot.left.graphicID);
            }
            if (this.treeRoot.right != null) {
                this.cmd("Disconnect", this.treeRoot.graphicID, this.treeRoot.right.graphicID);
            }
            const oldElem = this.treeRoot.graphicID;
            this.cmd("Delete", this.treeRoot.nplID);
            this.cmd("Move", this.treeRoot.graphicID, HeapLeftist.INSERT_X, HeapLeftist.INSERT_Y);
            this.cmd("Step");
            this.cmd("SetText", HeapLeftist.MESSAGE_ID, "Merge the two subtrees");

            if (this.treeRoot.left == null) {
                this.treeRoot = null;
            } else if (this.treeRoot.right == null) {
                this.treeRoot = this.treeRoot.left;
                this.resizeTrees();
            } else {
                const secondTree = this.treeRoot.right;
                this.secondaryRoot = secondTree;
                this.treeRoot = this.treeRoot.left;
                this.resizeTrees();
                // this.secondaryRoot = null;
                this.cmd("CreateHighlightCircle", this.highlightLeft, HeapLeftist.HIGHLIGHT_CIRCLE_COLOR, this.treeRoot.x, this.treeRoot.y);

                this.cmd("CreateHighlightCircle", this.highlightRight, HeapLeftist.HIGHLIGHT_CIRCLE_COLOR, secondTree.x, secondTree.y);
                this.treeRoot = this.merge(this.treeRoot, secondTree);
                this.secondaryRoot = null;
            }
            this.resizeTrees();
            this.cmd("Delete", oldElem);
            this.cmd("SetText", HeapLeftist.MESSAGE_ID, "");
        }
        // Clear for real
        return this.commands;
    }

    insertElement(insertedValue) {
        this.commands = [];
        this.cmd("SetText", HeapLeftist.MESSAGE_ID, "Create a heap with one node, merge with existing heap.");

        this.secondaryRoot = new LeftistHeapNode(insertedValue, this.nextIndex++, this.nextIndex++, HeapLeftist.INSERT_X, HeapLeftist.INSERT_Y);
        this.cmd("CreateCircle", this.secondaryRoot.graphicID, insertedValue, this.secondaryRoot.x, this.secondaryRoot.y);
        this.cmd("CreateLabel", this.secondaryRoot.nplID, 0, HeapLeftist.INSERT_X - HeapLeftist.NPL_OFFSET_X, HeapLeftist.INSERT_Y - HeapLeftist.NPL_OFFSET_Y);
        this.cmd("SetForegroundColor", this.secondaryRoot.nplID, HeapLeftist.NPL_COLOR);
        this.cmd("SetLayer", this.secondaryRoot.nplID, 1);
        this.cmd("SetForegroundColor", this.secondaryRoot.graphicID, HeapLeftist.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", this.secondaryRoot.graphicID, HeapLeftist.BACKGROUND_COLOR);

        if (this.treeRoot != null) {
            this.resizeTrees();
            this.highlightLeft = this.nextIndex++;
            this.highlightRight = this.nextIndex++;
            this.cmd("CreateHighlightCircle", this.highlightLeft, HeapLeftist.HIGHLIGHT_CIRCLE_COLOR, this.treeRoot.x, this.treeRoot.y);
            this.cmd("CreateHighlightCircle", this.highlightRight, HeapLeftist.HIGHLIGHT_CIRCLE_COLOR, this.secondaryRoot.x, this.secondaryRoot.y);

            const rightTree = this.secondaryRoot;
            this.secondaryRoot = null;
            this.treeRoot = this.merge(this.treeRoot, rightTree);
            this.resizeTrees();
        } else {
            this.treeRoot = this.secondaryRoot;
            this.secondaryRoot = null;
            this.resizeTrees();
        }
        this.cmd("SetText", HeapLeftist.MESSAGE_ID, "");
        return this.commands;
    }

    merge(tree1, tree2) {
        if (tree1 == null) {
            this.cmd("SetText", HeapLeftist.MESSAGE_ID, "Merging right heap with empty heap, return right heap");
            this.cmd("Step");
            this.cmd("Delete", this.highlightRight);
            this.cmd("Delete", this.highlightLeft);
            return tree2;
        }
        if (tree2 == null) {
            this.cmd("SetText", HeapLeftist.MESSAGE_ID, "Merging left heap with empty heap, return left heap");
            this.cmd("Step");
            this.cmd("Delete", this.highlightRight);
            this.cmd("Delete", this.highlightLeft);
            return tree1;
        }

        this.cmd("SetHighlight", tree1.graphicID, 1);
        this.cmd("SetHighlight", tree2.graphicID, 1);
        if (this.compare(tree2.data, tree1.data) < 0) {
            this.cmd("SetText", HeapLeftist.MESSAGE_ID, "Min element is in right heap.  Recursively merge right subtree of right heap with left heap");
            const tmp = tree1;
            tree1 = tree2;
            tree2 = tmp;
            const tmpR = this.highlightRight;
            this.highlightRight = this.highlightLeft;
            this.highlightLeft = tmpR;
        } else {
            this.cmd("SetText", HeapLeftist.MESSAGE_ID, "Min element is in left heap.  Recursively merge right subtree of left heap with right heap");
        }
        this.cmd("Step");
        this.cmd("SetHighlight", tree1.graphicID, 0);
        this.cmd("SetHighlight", tree2.graphicID, 0);
        if (tree1.right == null) {
            this.cmd("Move", this.highlightLeft, tree1.x + HeapLeftist.WIDTH_DELTA / 2, tree1.y + HeapLeftist.HEIGHT_DELTA);
        } else {
            this.cmd("Move", this.highlightLeft, tree1.right.x, tree1.right.y);
        }
        this.cmd("Step");
        if (tree1.right != null) {
            this.cmd("Disconnect", tree1.graphicID, tree1.right.graphicID, HeapLeftist.LINK_COLOR);
        }
        const next = tree1.right;
        this.cmd("SetAlpha", tree1.graphicID, HeapLeftist.BACKGROUND_ALPHA);
        this.cmd("SetAlpha", tree1.nplID, HeapLeftist.BACKGROUND_ALPHA);
        if (tree1.left != null) {
            this.cmd("SetEdgeAlpha", tree1.graphicID, tree1.left.graphicID, HeapLeftist.BACKGROUND_ALPHA);
            this.setTreeAlpha(tree1.left, HeapLeftist.BACKGROUND_ALPHA);
        }
        this.cmd("Step");
        tree1.right = this.merge(next, tree2);
        if (this.secondaryRoot === tree1.right) {
            this.secondaryRoot = null;
        }
        if (this.treeRoot === tree1.right) {
            this.treeRoot = null;
        }
        if (tree1.right.parent !== tree1) {
            tree1.right.disconnectFromParent();
        }
        tree1.right.parent = tree1;
        this.cmd("SetText", HeapLeftist.MESSAGE_ID, "Reconnecting tree after merge");

        this.cmd("Connect", tree1.graphicID, tree1.right.graphicID, HeapLeftist.LINK_COLOR);
        this.cmd("SetAlpha", tree1.graphicID, 1);
        this.cmd("SetAlpha", tree1.nplID, 1);

        this.resizeTrees();
        if (tree1.left != null) {
            this.cmd("SetEdgeAlpha", tree1.graphicID, tree1.left.graphicID, 1);
            this.setTreeAlpha(tree1.left, 1);
            this.cmd("Step");
        }

        if (tree1.left == null || (tree1.left.npl < tree1.right.npl)) {
            this.cmd("SetHighlight", tree1.graphicID, 1);
            this.cmd("SetText", HeapLeftist.MESSAGE_ID, "Right subtree has larger Null Path Length than left subtree.  Swapping ...");
            this.cmd("Step");
            this.cmd("SetHighlight", tree1.graphicID, 0);
            const tmp = tree1.left;
            tree1.left = tree1.right;
            tree1.right = tmp;
            this.resizeTrees();
        } else {
            this.cmd("SetHighlight", tree1.graphicID, 1);
            this.cmd("SetText", HeapLeftist.MESSAGE_ID, "Left subtree has Null Path Length at least as large as right subtree.  No swap required ...");
            this.cmd("Step");
            this.cmd("SetHighlight", tree1.graphicID, 0);
        }
        if (tree1.right == null) {
            tree1.npl = 0;
        } else {
            tree1.npl = Math.min(tree1.left.npl, tree1.right.npl) + 1;
        }
        this.cmd("SetText", tree1.nplID, tree1.npl);

        return tree1;
    }

    setTreeAlpha(tree, newAlpha) {
        if (tree != null) {
            this.cmd("SetAlpha", tree.graphicID, newAlpha);
            this.cmd("SetAlpha", tree.nplID, newAlpha);
            if (tree.left != null) {
                this.cmd("SetEdgeAlpha", tree.graphicID, tree.left.graphicID, newAlpha);
                this.setTreeAlpha(tree.left, newAlpha);
            }
            if (tree.right != null) {
                this.cmd("SetEdgeAlpha", tree.graphicID, tree.right.graphicID, newAlpha);
                this.setTreeAlpha(tree.right, newAlpha);
            }
        }
    }

    resizeWidths(tree) {
        if (tree == null) {
            return 0;
        }
        tree.leftWidth = Math.max(this.resizeWidths(tree.left), HeapLeftist.WIDTH_DELTA / 2);
        tree.rightWidth = Math.max(this.resizeWidths(tree.right), HeapLeftist.WIDTH_DELTA / 2);
        return tree.leftWidth + tree.rightWidth;
    }

    resizeTrees() {
        this.resizeWidths(this.treeRoot);
        this.resizeWidths(this.secondaryRoot);

        if (this.treeRoot != null) {
            const startingPoint = this.treeRoot.leftWidth;
            this.setNewPositions(this.treeRoot, startingPoint, HeapLeftist.STARTING_Y, 0);
            this.animateNewPositions(this.treeRoot);
            if (this.secondaryRoot != null) {
                const secondTreeStart = this.treeRoot.leftWidth + this.treeRoot.rightWidth + this.secondaryRoot.leftWidth + 50;
                this.setNewPositions(this.secondaryRoot, secondTreeStart, HeapLeftist.STARTING_Y, 0);
                this.animateNewPositions(this.secondaryRoot);
            }

            this.cmd("Step");
        } else if (this.secondaryRoot != null) {
            const startingPoint = this.secondaryRoot.leftWidth;
            this.setNewPositions(this.secondaryRoot, startingPoint, HeapLeftist.STARTING_Y, 0);
            this.animateNewPositions(this.secondaryRoot);
        }
    }

    setNewPositions(tree, xPosition, yPosition, side) {
        if (tree != null) {
            tree.y = yPosition;
            if (side === -1) {
                xPosition = xPosition - tree.rightWidth;
                tree.npX = xPosition - HeapLeftist.NPL_OFFSET_X;
            } else if (side === 1) {
                xPosition = xPosition + tree.leftWidth;
                tree.npX = xPosition + HeapLeftist.NPL_OFFSET_X;
            } else {
                tree.heightLabelX = xPosition - HeapLeftist.NPL_OFFSET_Y;
                tree.npX = xPosition + HeapLeftist.NPL_OFFSET_X;
            }
            tree.x = xPosition;
            tree.npY = tree.y - HeapLeftist.NPL_OFFSET_Y;
            this.setNewPositions(tree.left, xPosition, yPosition + HeapLeftist.HEIGHT_DELTA, -1);
            this.setNewPositions(tree.right, xPosition, yPosition + HeapLeftist.HEIGHT_DELTA, 1);
        }
    }

    animateNewPositions(tree) {
        if (tree != null) {
            this.cmd("Move", tree.graphicID, tree.x, tree.y);
            this.cmd("Move", tree.nplID, tree.npX, tree.npY);
            this.animateNewPositions(tree.left);
            this.animateNewPositions(tree.right);
        }
    }
}
