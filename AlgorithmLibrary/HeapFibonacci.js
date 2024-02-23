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
/* exported HeapFibonacci */
///////////////////////////////////////////////////////////////////////////////


class FibonacciNode {
    constructor(val, id, initialX, initialY) {
        this.data = val;
        this.x = initialX;
        this.y = initialY;
        this.graphicID = id;
        this.degree = 0;
        this.leftChild = null;
        this.rightSib = null;
        this.parent = null;
        this.internalGraphicID = -1;
        this.degreeID = -1;
    }
}


class HeapFibonacci extends Algorithm {
    LINK_COLOR = "#007700";
    FOREGROUND_COLOR = "#007700";
    BACKGROUND_COLOR = "#EEFFEE";
    INDEX_COLOR = "#0000FF";

    DEGREE_OFFSET_X = -20;
    DEGREE_OFFSET_Y = -20;

    DELETE_LAB_X = 30;
    DELETE_LAB_Y = 50;

    NODE_WIDTH = 60;
    NODE_HEIGHT = 70;

    STARTING_X = 70;

    INSERT_X = 30;
    INSERT_Y = 25;

    STARTING_Y = 100;
    MAX_DEGREE = 7;
    DEGREE_ARRAY_ELEM_WIDTH = 30;
    DEGREE_ARRAY_ELEM_HEIGHT = 30;
    DEGREE_ARRAY_START_X = 500;
    INDEGREE_ARRAY_START_Y = 50;

    TMP_PTR_Y = 60;

    constructor(am) {
        super();
        this.init(am);
    }

    init(am) {
        super.init(am);
        this.addControls();
        this.treeRoot = null;
        this.currentLayer = 1;
        this.animationManager.setAllLayers([0, this.currentLayer]);
        this.minID = 0;
        this.nextIndex = 1;
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

        const radioButtonList = this.addRadioButtonGroupToAlgorithmBar(
            ["Logical Representation", "Internal Representation"],
            "BQueueRep",
        );

        radioButtonList[0].onclick = this.representationChangedHandler.bind(this, true);
        radioButtonList[1].onclick = this.representationChangedHandler.bind(this, false);
        radioButtonList[0].checked = true;
    }

    representationChangedHandler(logicalRep, event) {
        if (logicalRep) {
            this.animationManager.setAllLayers([0, 1]);
            this.currentLayer = 1;
        } else {
            this.animationManager.setAllLayers([0, 2]);
            this.currentLayer = 2;
        }
    }

    setPositions(tree, xPosition, yPosition) {
        if (tree != null) {
            if (tree.degree === 0) {
                tree.x = xPosition;
                tree.y = yPosition;
                return this.setPositions(tree.rightSib, xPosition + this.NODE_WIDTH, yPosition);
            } else if (tree.degree === 1) {
                tree.x = xPosition;
                tree.y = yPosition;
                this.setPositions(tree.leftChild, xPosition, yPosition + this.NODE_HEIGHT);
                return this.setPositions(tree.rightSib, xPosition + this.NODE_WIDTH, yPosition);
            } else {
                const treeWidth = Math.pow(2, tree.degree - 1);
                tree.x = xPosition + (treeWidth - 1) * this.NODE_WIDTH;
                tree.y = yPosition;
                this.setPositions(tree.leftChild, xPosition, yPosition + this.NODE_HEIGHT);
                return this.setPositions(tree.rightSib, xPosition + treeWidth * this.NODE_WIDTH, yPosition);
            }
        }
        return xPosition;
    }

    moveTree(tree) {
        if (tree != null) {
            this.cmd("Move", tree.graphicID, tree.x, tree.y);
            this.cmd("Move", tree.internalGraphicID, tree.x, tree.y);
            this.cmd("Move", tree.degreeID, tree.x + this.DEGREE_OFFSET_X, tree.y + this.DEGREE_OFFSET_Y);

            this.moveTree(tree.leftChild);
            this.moveTree(tree.rightSib);
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
        this.implementAction(this.clear.bind(this), "");
    }

    clear() {
        this.commands = [];

        this.deleteTree(this.treeRoot);

        this.cmd("Delete", this.minID);
        this.nextIndex = 1;
        this.treeRoot = null;
        this.minElement = null;
        return this.commands;
    }

    deleteTree(tree) {
        if (tree != null) {
            this.cmd("Delete", tree.graphicID);
            this.cmd("Delete", tree.internalGraphicID);
            this.cmd("Delete", tree.degreeID);
            this.deleteTree(tree.leftChild);
            this.deleteTree(tree.rightSib);
        }
    }

    reset() {
        this.treeRoot = null;
        this.nextIndex = 1;
    }

    removeSmallestCallback(event) {
        this.implementAction(this.removeSmallest.bind(this), "");
    }

    removeSmallest(dummy) {
        this.commands = [];

        if (this.treeRoot != null) {
            let prev;
            if (this.minElement === this.treeRoot) {
                this.treeRoot = this.treeRoot.rightSib;
                prev = null;
            } else {
                prev = this.treeRoot;
                while (prev.rightSib !== this.minElement) {
                    prev = prev.rightSib;
                }
                prev.rightSib = prev.rightSib.rightSib;
            }
            const moveLabel = this.nextIndex++;
            this.cmd("SetText", this.minElement.graphicID, "");
            this.cmd("SetText", this.minElement.internalGraphicID, "");
            this.cmd("CreateLabel", moveLabel, this.minElement.data, this.minElement.x, this.minElement.y);
            this.cmd("Move", moveLabel, this.DELETE_LAB_X, this.DELETE_LAB_Y);
            this.cmd("Step");
            this.cmd("Delete", this.minID);
            const childList = this.minElement.leftChild;
            if (this.treeRoot == null) {
                this.cmd("Delete", this.minElement.graphicID);
                this.cmd("Delete", this.minElement.internalGraphicID);
                this.cmd("Delete", this.minElement.degreeID);
                this.treeRoot = childList;
                this.minElement = null;
                if (this.treeRoot != null) {
                    for (let tmp = this.treeRoot; tmp != null; tmp = tmp.rightSib) {
                        if (this.minElement == null || this.compare(this.minElement.data, tmp.data) > 0) {
                            this.minElement = tmp;
                        }
                    }
                    this.cmd("CreateLabel", this.minID, "Min element", this.minElement.x, this.TMP_PTR_Y);
                    this.cmd("Connect", this.minID,
                        this.minElement.graphicID,
                        this.FOREGROUND_COLOR,
                        0, // Curve
                        1, // Directed
                        ""); // Label
                    this.cmd("Connect", this.minID,
                        this.minElement.internalGraphicID,
                        this.FOREGROUND_COLOR,
                        0, // Curve
                        1, // Directed
                        ""); // Label
                }

                this.SetAllTreePositions(this.treeRoot, []);
                this.MoveAllTrees(this.treeRoot, []);
                this.cmd("Delete", moveLabel);
                return this.commands;
            } else if (childList == null) {
                if (prev != null && prev.rightSib != null) {
                    this.cmd("Connect", prev.internalGraphicID,
                        prev.rightSib.internalGraphicID,
                        this.FOREGROUND_COLOR,
                        0.15, // Curve
                        1, // Directed
                        ""); // Label
                    this.cmd("Connect", prev.rightSib.internalGraphicID,
                        prev.internalGraphicID,
                        this.FOREGROUND_COLOR,
                        0.15, // Curve
                        1, // Directed
                        ""); // Label
                }
            } else {
                let tmp = childList;
                while (tmp.rightSib != null) {
                    tmp.parent = null;
                    tmp = tmp.rightSib;
                }
                tmp.parent = null;

                // TODO:  Add in implementation links
                if (prev == null) {
                    this.cmd("Connect", tmp.internalGraphicID,
                        this.treeRoot.internalGraphicID,
                        this.FOREGROUND_COLOR,
                        0.15, // Curve
                        1, // Directed
                        ""); // Label
                    this.cmd("Connect", this.treeRoot.internalGraphicID,
                        tmp.internalGraphicID,
                        this.FOREGROUND_COLOR,
                        0.15, // Curve
                        1, // Directed
                        ""); // Label

                    tmp.rightSib = this.treeRoot;
                    this.treeRoot = childList;
                } else {
                    this.cmd("Connect", prev.internalGraphicID,
                        childList.internalGraphicID,
                        this.FOREGROUND_COLOR,
                        0.15, // Curve
                        1, // Directed
                        ""); // Label
                    this.cmd("Connect", childList.internalGraphicID,
                        prev.internalGraphicID,
                        this.FOREGROUND_COLOR,
                        0.15, // Curve
                        1, // Directed
                        ""); // Label

                    if (prev.rightSib != null) {
                        this.cmd("Connect", prev.rightSib.internalGraphicID,
                            tmp.internalGraphicID,
                            this.FOREGROUND_COLOR,
                            0.15, // Curve
                            1, // Directed
                            ""); // Label
                        this.cmd("Connect", tmp.internalGraphicID,
                            prev.rightSib.internalGraphicID,
                            this.FOREGROUND_COLOR,
                            0.15, // Curve
                            1, // Directed
                            ""); // Label
                    }
                    tmp.rightSib = prev.rightSib;
                    prev.rightSib = childList;
                }
            }
            this.cmd("Delete", this.minElement.graphicID);
            this.cmd("Delete", this.minElement.internalGraphicID);
            this.cmd("Delete", this.minElement.degreeID);

            this.SetAllTreePositions(this.treeRoot, []);
            this.MoveAllTrees(this.treeRoot, []);
            this.fixAfterRemoveMin();
            this.cmd("Delete", moveLabel);
        }
        return this.commands;
    }

    insertElement(insertedValue) {
        this.commands = [];

        const insertNode = new FibonacciNode(insertedValue, this.nextIndex++, this.INSERT_X, this.INSERT_Y);
        insertNode.internalGraphicID = this.nextIndex++;
        insertNode.degreeID = this.nextIndex++;
        this.cmd("CreateCircle", insertNode.graphicID, insertedValue, this.INSERT_X, this.INSERT_Y);
        this.cmd("SetForegroundColor", insertNode.graphicID, this.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", insertNode.graphicID, this.BACKGROUND_COLOR);
        this.cmd("SetLayer", insertNode.graphicID, 1);
        this.cmd("CreateCircle", insertNode.internalGraphicID, insertedValue, this.INSERT_X, this.INSERT_Y);
        this.cmd("SetForegroundColor", insertNode.internalGraphicID, this.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", insertNode.internalGraphicID, this.BACKGROUND_COLOR);
        this.cmd("SetLayer", insertNode.internalGraphicID, 2);
        this.cmd("CreateLabel", insertNode.degreeID, insertNode.degree, insertNode.x + this.DEGREE_OFFSET_X, insertNode.y + this.DEGREE_OFFSET_Y);
        this.cmd("SetTextColor", insertNode.degreeID, "#0000FF");
        this.cmd("SetLayer", insertNode.degreeID, 2);
        this.cmd("Step");

        if (this.treeRoot == null) {
            this.treeRoot = insertNode;
            this.setPositions(this.treeRoot, this.STARTING_X, this.STARTING_Y);
            this.moveTree(this.treeRoot);
            this.cmd("CreateLabel", this.minID, "Min element", this.treeRoot.x, this.TMP_PTR_Y);
            this.minElement = this.treeRoot;
            this.cmd("Connect", this.minID,
                this.minElement.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                ""); // Label

            this.cmd("Connect", this.minID,
                this.minElement.internalGraphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                ""); // Label
        } else if (this.minElement === this.treeRoot) {
            insertNode.rightSib = this.treeRoot;
            this.treeRoot = insertNode;

            this.cmd("Connect", this.treeRoot.internalGraphicID,
                this.treeRoot.rightSib.internalGraphicID,
                this.FOREGROUND_COLOR,
                0.15, // Curve
                1, // Directed
                ""); // Label

            this.cmd("Connect", this.treeRoot.rightSib.internalGraphicID,
                this.treeRoot.internalGraphicID,
                this.FOREGROUND_COLOR,
                0.15, // Curve
                1, // Directed
                ""); // Label

            this.cmd("Step");
            this.setPositions(this.treeRoot, this.STARTING_X, this.STARTING_Y);
            if (this.compare(this.minElement.data, insertNode.data) > 0) {
                this.cmd("Disconnect", this.minID, this.minElement.graphicID);
                this.cmd("Disconnect", this.minID, this.minElement.internalGraphicID);
                this.minElement = insertNode;
                this.cmd("Connect", this.minID,
                    this.minElement.graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    1, // Directed
                    ""); // Label

                this.cmd("Connect", this.minID,
                    this.minElement.internalGraphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    1, // Directed
                    ""); // Label
            }
            this.cmd("Move", this.minID, this.minElement.x, this.TMP_PTR_Y);
            this.moveTree(this.treeRoot);
        } else {
            let prev = this.treeRoot;
            while (prev.rightSib !== this.minElement) {
                prev = prev.rightSib;
            }

            this.cmd("Disconnect", prev.internalGraphicID, prev.rightSib.internalGraphicID);
            this.cmd("Disconnect", prev.rightSib.internalGraphicID, prev.internalGraphicID);

            insertNode.rightSib = prev.rightSib;
            prev.rightSib = insertNode;

            this.cmd("Connect", prev.internalGraphicID,
                prev.rightSib.internalGraphicID,
                this.FOREGROUND_COLOR,
                0.15, // Curve
                1, // Directed
                ""); // Label

            this.cmd("Connect", prev.rightSib.internalGraphicID,
                prev.internalGraphicID,
                this.FOREGROUND_COLOR,
                0.15, // Curve
                1, // Directed
                ""); // Label

            if (prev.rightSib.rightSib != null) {
                this.cmd("Connect", prev.rightSib.internalGraphicID,
                    prev.rightSib.rightSib.internalGraphicID,
                    this.FOREGROUND_COLOR,
                    0.15, // Curve
                    1, // Directed
                    ""); // Label

                this.cmd("Connect", prev.rightSib.rightSib.internalGraphicID,
                    prev.rightSib.internalGraphicID,
                    this.FOREGROUND_COLOR,
                    0.15, // Curve
                    1, // Directed
                    ""); // Label
            }

            this.cmd("Step");
            this.setPositions(this.treeRoot, this.STARTING_X, this.STARTING_Y);
            if (this.compare(this.minElement.data, insertNode.data) > 0) {
                this.cmd("Disconnect", this.minID, this.minElement.graphicID);
                this.cmd("Disconnect", this.minID, this.minElement.internalGraphicID);
                this.minElement = insertNode;
                this.cmd("Connect", this.minID,
                    this.minElement.graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    1, // Directed
                    ""); // Label

                this.cmd("Connect", this.minID,
                    this.minElement.internalGraphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    1, // Directed
                    ""); // Label
            }
            this.cmd("Move", this.minID, this.minElement.x, this.TMP_PTR_Y);
            this.moveTree(this.treeRoot);
        }
        return this.commands;
    }

    fixAfterRemoveMin() {
        if (this.treeRoot == null)
            return;
        const degreeArray = new Array(this.MAX_DEGREE);
        const degreeGraphic = new Array(this.MAX_DEGREE);
        const indexID = new Array(this.MAX_DEGREE);
        const tmpPtrID = this.nextIndex++;

        for (let i = 0; i <= this.MAX_DEGREE; i++) {
            degreeArray[i] = null;
            degreeGraphic[i] = this.nextIndex++;
            indexID[i] = this.nextIndex++;
            this.cmd("CreateRectangle",
                degreeGraphic[i],
                " ",
                this.DEGREE_ARRAY_ELEM_WIDTH,
                this.DEGREE_ARRAY_ELEM_HEIGHT,
                this.DEGREE_ARRAY_START_X + i * this.DEGREE_ARRAY_ELEM_WIDTH,
                this.INDEGREE_ARRAY_START_Y);
            this.cmd("SetNull", degreeGraphic[i], 1);
            this.cmd("CreateLabel", indexID[i], i, this.DEGREE_ARRAY_START_X + i * this.DEGREE_ARRAY_ELEM_WIDTH,
                this.INDEGREE_ARRAY_START_Y - this.DEGREE_ARRAY_ELEM_HEIGHT);
            this.cmd("SetTextColor", indexID[i], this.INDEX_COLOR);
        }
        let tmp = this.treeRoot;
        // When remving w/ 1 tree.this.treeRoot == null?
        this.cmd("CreateLabel", tmpPtrID, "NextElem", this.treeRoot.x, this.TMP_PTR_Y);
        while (this.treeRoot != null) {
            tmp = this.treeRoot;
            this.cmd("Connect", tmpPtrID,
                tmp.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                ""); // Label
            this.cmd("Connect", tmpPtrID,
                tmp.internalGraphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                ""); // Label

            this.treeRoot = this.treeRoot.rightSib;
            if (tmp.rightSib != null) {
                this.cmd("Disconnect", tmp.internalGraphicID, tmp.rightSib.internalGraphicID);
                this.cmd("Disconnect", tmp.rightSib.internalGraphicID, tmp.internalGraphicID);
            }

            this.cmd("Step");
            tmp.rightSib = null;
            while (degreeArray[tmp.degree] != null) {
                this.cmd("SetEdgeHighlight", tmpPtrID, tmp.graphicID, 1);
                this.cmd("SetEdgeHighlight", tmpPtrID, tmp.internalGraphicID, 1);

                this.cmd("SetEdgeHighlight", degreeGraphic[tmp.degree], degreeArray[tmp.degree].graphicID, 1);
                this.cmd("SetEdgeHighlight", degreeGraphic[tmp.degree], degreeArray[tmp.degree].internalGraphicID, 1);
                this.cmd("Step");
                this.cmd("Disconnect", tmpPtrID, tmp.graphicID);
                this.cmd("Disconnect", tmpPtrID, tmp.internalGraphicID);

                this.cmd("Disconnect", degreeGraphic[tmp.degree], degreeArray[tmp.degree].graphicID);
                this.cmd("Disconnect", degreeGraphic[tmp.degree], degreeArray[tmp.degree].internalGraphicID);
                this.cmd("SetNull", degreeGraphic[tmp.degree], 1);
                const tmp2 = degreeArray[tmp.degree];
                degreeArray[tmp.degree] = null;
                tmp = this.combineTrees(tmp, tmp2);
                this.cmd("Connect", tmpPtrID,
                    tmp.graphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    1, // Directed
                    ""); // Label
                this.cmd("Connect", tmpPtrID,
                    tmp.internalGraphicID,
                    this.FOREGROUND_COLOR,
                    0, // Curve
                    1, // Directed
                    ""); // Label
                this.SetAllTreePositions(this.treeRoot, degreeArray, tmp);
                this.cmd("Move", tmpPtrID, tmp.x, this.TMP_PTR_Y);
                this.MoveAllTrees(this.treeRoot, degreeArray, tmp);
            }
            this.cmd("Disconnect", tmpPtrID, tmp.graphicID);
            this.cmd("Disconnect", tmpPtrID, tmp.internalGraphicID);

            degreeArray[tmp.degree] = tmp;
            this.cmd("SetNull", degreeGraphic[tmp.degree], 0);
            this.cmd("Connect", degreeGraphic[tmp.degree],
                tmp.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                ""); // Label
            this.cmd("Connect", degreeGraphic[tmp.degree],
                tmp.internalGraphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                ""); // Label
            this.cmd("Step");
            this.SetAllTreePositions(this.treeRoot, degreeArray);
            this.MoveAllTrees(this.treeRoot, degreeArray);
        }
        this.minElement = null;
        for (let i = this.MAX_DEGREE; i >= 0; i--) {
            if (degreeArray[i] != null) {
                degreeArray[i].rightSib = this.treeRoot;
                if (this.minElement == null || this.compare(this.minElement.data, degreeArray[i].data) > 0) {
                    this.minElement = degreeArray[i];
                }
                this.treeRoot = degreeArray[i];
                if (this.treeRoot.rightSib != null) {
                    this.cmd("Connect", this.treeRoot.internalGraphicID,
                        this.treeRoot.rightSib.internalGraphicID,
                        this.FOREGROUND_COLOR,
                        0.15, // Curve
                        1, // Directed
                        ""); // Label
                    this.cmd("Connect", this.treeRoot.rightSib.internalGraphicID,
                        this.treeRoot.internalGraphicID,
                        this.FOREGROUND_COLOR,
                        0.15, // Curve
                        1, // Directed
                        ""); // Label
                }
            }

            this.cmd("Delete", degreeGraphic[i]);
            this.cmd("Delete", indexID[i]);
        }
        if (this.minElement != null) {
            this.cmd("CreateLabel", this.minID, "Min element", this.minElement.x, this.TMP_PTR_Y);
            this.cmd("Connect", this.minID,
                this.minElement.graphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                ""); // Label
            this.cmd("Connect", this.minID,
                this.minElement.internalGraphicID,
                this.FOREGROUND_COLOR,
                0, // Curve
                1, // Directed
                ""); // Label
        }
        this.cmd("Delete", tmpPtrID);
    }

    MoveAllTrees(tree, treeList, tree2) {
        if (tree2 != null) {
            this.moveTree(tree2);
        }
        if (tree != null) {
            this.moveTree(tree);
        }
        for (let i = 0; i < treeList.length; i++) {
            if (treeList[i] != null) {
                this.moveTree(treeList[i]);
            }
        }
        this.cmd("Step");
    }

    SetAllTreePositions(tree, treeList, tree2) {
        let leftSize = this.STARTING_X;
        if (tree2 != null) {
            leftSize = this.setPositions(tree2, leftSize, this.STARTING_Y); //  + this.NODE_WIDTH;
        }
        if (tree != null) {
            leftSize = this.setPositions(tree, leftSize, this.STARTING_Y); // + this.NODE_WIDTH;
        }
        for (let i = 0; i < treeList.length; i++) {
            if (treeList[i] != null) {
                leftSize = this.setPositions(treeList[i], leftSize, this.STARTING_Y); // + this.NODE_WIDTH;
            }
        }
    }

    combineTrees(tree1, tree2) {
        if (this.compare(tree2.data, tree1.data) < 0) {
            const tmp = tree2;
            tree2 = tree1;
            tree1 = tmp;
        }
        if (tree1.degree !== tree2.degree) {
            return null;
        }
        tree2.rightSib = tree1.leftChild;
        tree2.parent = tree1;
        tree1.leftChild = tree2;
        tree1.degree++;

        if (tree1.leftChild.rightSib != null) {
            this.cmd("Disconnect", tree1.internalGraphicID, tree1.leftChild.rightSib.internalGraphicID);
            this.cmd("Connect", tree1.leftChild.internalGraphicID,
                tree1.leftChild.rightSib.internalGraphicID,
                this.FOREGROUND_COLOR,
                0.3, // Curve
                1, // Directed
                ""); // Label
            this.cmd("Connect", tree1.leftChild.rightSib.internalGraphicID,
                tree1.leftChild.internalGraphicID,
                this.FOREGROUND_COLOR,
                0.3, // Curve
                1, // Directed
                ""); // Label
        }

        this.cmd("Connect", tree1.internalGraphicID,
            tree1.leftChild.internalGraphicID,
            this.FOREGROUND_COLOR,
            0.15, // Curve
            1, // Directed
            ""); // Label

        this.cmd("Connect", tree1.leftChild.internalGraphicID,
            tree1.internalGraphicID,
            this.FOREGROUND_COLOR,
            0.0, // Curve
            1, // Directed
            ""); // Label

        this.cmd("SetText", tree1.degreeID, tree1.degree);
        this.cmd("Connect", tree1.graphicID,
            tree2.graphicID,
            this.FOREGROUND_COLOR,
            0, // Curve
            0, // Directed
            ""); // Label

        // TODO:  Add all the internal links &etc
        return tree1;
    }
}
