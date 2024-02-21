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
/* exported HeapSkew */
///////////////////////////////////////////////////////////////////////////////


class SkewHeapNode {
    constructor(val, id, initialX, initialY) {
        this.data = val;
        this.x = (initialX == null) ? 0 : initialX;
        this.y = (initialY == null) ? 0 : initialY;

        this.graphicID = id;
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
                this.parent.left = null;
            }
        }
    }
}


class HeapSkew extends Algorithm {
    static LINK_COLOR = "#007700";
    static HIGHLIGHT_CIRCLE_COLOR = "#007700";
    static FOREGROUND_COLOR = "#007700";
    static BACKGROUND_COLOR = "#EEFFEE";

    static WIDTH_DELTA = 50;
    static HEIGHT_DELTA = 50;
    static STARTING_Y = 90;

    static INSERT_X = 50;
    static INSERT_Y = 45;
    static BACKGROUND_ALPHA = 0.5;

    static MESSAGE_X = 20;
    static MESSAGE_Y = 10;

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
        this.cmd("CreateLabel", 0, "", HeapSkew.MESSAGE_X, HeapSkew.MESSAGE_Y, 0);
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

            this.cmd("SetText", HeapSkew.MESSAGE_ID, "Remove root element, leaving two subtrees");
            if (this.treeRoot.left != null) {
                this.cmd("Disconnect", this.treeRoot.graphicID, this.treeRoot.left.graphicID);
            }
            if (this.treeRoot.right != null) {
                this.cmd("Disconnect", this.treeRoot.graphicID, this.treeRoot.right.graphicID);
            }
            const oldElem = this.treeRoot.graphicID;
            this.cmd("Move", this.treeRoot.graphicID, HeapSkew.INSERT_X, HeapSkew.INSERT_Y);
            this.cmd("Step");
            this.cmd("SetText", HeapSkew.MESSAGE_ID, "Merge the two subtrees");

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
                this.cmd("CreateHighlightCircle", this.highlightLeft, HeapSkew.HIGHLIGHT_CIRCLE_COLOR, this.treeRoot.x, this.treeRoot.y);

                this.cmd("CreateHighlightCircle", this.highlightRight, HeapSkew.HIGHLIGHT_CIRCLE_COLOR, secondTree.x, secondTree.y);
                this.treeRoot = this.merge(this.treeRoot, secondTree);
                this.secondaryRoot = null;
            }
            this.resizeTrees();
            this.cmd("Delete", oldElem);
            this.cmd("SetText", HeapSkew.MESSAGE_ID, "");
        }
        // Clear for real
        return this.commands;
    }

    insertElement(insertedValue) {
        this.commands = [];
        this.cmd("SetText", HeapSkew.MESSAGE_ID, "Create a heap with one node, merge with existing heap.");

        this.secondaryRoot = new SkewHeapNode(insertedValue, this.nextIndex++, HeapSkew.INSERT_X, HeapSkew.INSERT_Y);
        this.cmd("CreateCircle", this.secondaryRoot.graphicID, insertedValue, this.secondaryRoot.x, this.secondaryRoot.y);
        this.cmd("SetForegroundColor", this.secondaryRoot.graphicID, HeapSkew.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", this.secondaryRoot.graphicID, HeapSkew.BACKGROUND_COLOR);

        if (this.treeRoot != null) {
            this.resizeTrees();
            this.highlightLeft = this.nextIndex++;
            this.highlightRight = this.nextIndex++;
            this.cmd("CreateHighlightCircle", this.highlightLeft, HeapSkew.HIGHLIGHT_CIRCLE_COLOR, this.treeRoot.x, this.treeRoot.y);
            this.cmd("CreateHighlightCircle", this.highlightRight, HeapSkew.HIGHLIGHT_CIRCLE_COLOR, this.secondaryRoot.x, this.secondaryRoot.y);

            const rightTree = this.secondaryRoot;
            this.secondaryRoot = null;

            this.treeRoot = this.merge(this.treeRoot, rightTree);

            this.resizeTrees();
        } else {
            this.treeRoot = this.secondaryRoot;
            this.secondaryRoot = null;
            this.resizeTrees();
        }
        this.cmd("SetText", HeapSkew.MESSAGE_ID, "");
        return this.commands;
    }

    merge(tree1, tree2) {
        if (tree1 == null) {
            this.cmd("SetText", HeapSkew.MESSAGE_ID, "Merging right heap with empty heap, return right heap");
            this.cmd("Step");
            this.cmd("Delete", this.highlightRight);
            this.cmd("Delete", this.highlightLeft);
            return tree2;
        }
        if (tree2 == null) {
            this.cmd("SetText", HeapSkew.MESSAGE_ID, "Merging left heap with empty heap, return left heap");
            this.cmd("Step");
            this.cmd("Delete", this.highlightRight);
            this.cmd("Delete", this.highlightLeft);
            return tree1;
        }
        this.cmd("SetHighlight", tree1.graphicID, 1);
        this.cmd("SetHighlight", tree2.graphicID, 1);
        if (tree2.data < tree1.data) {
            this.cmd("SetText", HeapSkew.MESSAGE_ID, "Min element is in right heap.  Recursively merge right subtree of right heap with left heap");
            const tmp = tree1;
            tree1 = tree2;
            tree2 = tmp;
            const tmpR = this.highlightRight;
            this.highlightRight = this.highlightLeft;
            this.highlightLeft = tmpR;
        } else {
            this.cmd("SetText", HeapSkew.MESSAGE_ID, "Min element is in left heap.  Recursively merge right subtree of left heap with right heap");
        }
        this.cmd("Step");
        this.cmd("SetHighlight", tree1.graphicID, 0);
        this.cmd("SetHighlight", tree2.graphicID, 0);
        if (tree1.right == null) {
            this.cmd("Move", this.highlightLeft, tree1.x + HeapSkew.WIDTH_DELTA / 2, tree1.y + HeapSkew.HEIGHT_DELTA);
        } else {
            this.cmd("Move", this.highlightLeft, tree1.right.x, tree1.right.y);
        }
        this.cmd("Step");
        if (tree1.right != null) {
            this.cmd("Disconnect", tree1.graphicID, tree1.right.graphicID, HeapSkew.LINK_COLOR);
        }
        const next = tree1.right;
        this.cmd("SetAlpha", tree1.graphicID, HeapSkew.BACKGROUND_ALPHA);
        if (tree1.left != null) {
            this.cmd("SetEdgeAlpha", tree1.graphicID, tree1.left.graphicID, HeapSkew.BACKGROUND_ALPHA);
            this.setTreeAlpha(tree1.left, HeapSkew.BACKGROUND_ALPHA);
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
        this.cmd("SetText", HeapSkew.MESSAGE_ID, "Reconnecting tree after merge");

        this.cmd("Connect", tree1.graphicID, tree1.right.graphicID, HeapSkew.LINK_COLOR);
        this.cmd("SetAlpha", tree1.graphicID, 1);

        this.resizeTrees();
        if (tree1.left != null) {
            this.cmd("SetEdgeAlpha", tree1.graphicID, tree1.left.graphicID, 1);
            this.setTreeAlpha(tree1.left, 1);
            this.cmd("Step");
        }

        this.cmd("SetHighlight", tree1.graphicID, 1);
        this.cmd("SetText", HeapSkew.MESSAGE_ID, "Swapping subtrees after merge ...");
        this.cmd("Step");
        this.cmd("SetHighlight", tree1.graphicID, 0);
        const tmp = tree1.left;
        tree1.left = tree1.right;
        tree1.right = tmp;
        this.resizeTrees();
        return tree1;
    }

    setTreeAlpha(tree, newAlpha) {
        if (tree != null) {
            this.cmd("SetAlpha", tree.graphicID, newAlpha);
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
        tree.leftWidth = Math.max(this.resizeWidths(tree.left), HeapSkew.WIDTH_DELTA / 2);
        tree.rightWidth = Math.max(this.resizeWidths(tree.right), HeapSkew.WIDTH_DELTA / 2);
        return tree.leftWidth + tree.rightWidth;
    }

    resizeTrees() {
        this.resizeWidths(this.treeRoot);
        this.resizeWidths(this.secondaryRoot);

        if (this.treeRoot != null) {
            const startingPoint = this.treeRoot.leftWidth;
            this.setNewPositions(this.treeRoot, startingPoint, HeapSkew.STARTING_Y, 0);
            this.animateNewPositions(this.treeRoot);
            if (this.secondaryRoot != null) {
                const secondTreeStart = this.treeRoot.leftWidth + this.treeRoot.rightWidth + this.secondaryRoot.leftWidth + 50;
                this.setNewPositions(this.secondaryRoot, secondTreeStart, HeapSkew.STARTING_Y, 0);
                this.animateNewPositions(this.secondaryRoot);
            }
            this.cmd("Step");
        } else if (this.secondaryRoot != null) {
            const startingPoint = this.secondaryRoot.leftWidth;
            this.setNewPositions(this.secondaryRoot, startingPoint, HeapSkew.STARTING_Y, 0);
            this.animateNewPositions(this.secondaryRoot);
        }
    }

    setNewPositions(tree, xPosition, yPosition, side) {
        if (tree != null) {
            tree.y = yPosition;
            if (side === -1) {
                xPosition = xPosition - tree.rightWidth;
            } else if (side === 1) {
                xPosition = xPosition + tree.leftWidth;
            } else {
                // ???            tree.heightLabelX = xPosition - SkewHeap.NPL_OFFSET_Y;
            }
            tree.x = xPosition;
            this.setNewPositions(tree.left, xPosition, yPosition + HeapSkew.HEIGHT_DELTA, -1);
            this.setNewPositions(tree.right, xPosition, yPosition + HeapSkew.HEIGHT_DELTA, 1);
        }
    }

    animateNewPositions(tree) {
        if (tree != null) {
            this.cmd("Move", tree.graphicID, tree.x, tree.y);
            this.animateNewPositions(tree.left);
            this.animateNewPositions(tree.right);
        }
    }
}
