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
/* exported Graph */
///////////////////////////////////////////////////////////////////////////////

// TODO:  UNDO (all the way) is BROKEN.  Redo reset ...


class Graph extends Algorithm {
    LARGE_ALLOWED = [
        [false, true, true, false, true, false, false, true, false, false, false, false, false, false, true, false, false, false],
        [true, false, true, false, true, true, false, false, false, false, false, false, false, false, false, false, false, false],
        [true, true, false, true, false, true, true, false, false, false, false, false, false, false, false, false, false, false],
        [false, false, true, false, false, false, true, false, false, false, true, false, false, false, false, false, false, true],
        [true, true, false, false, false, true, false, true, true, false, false, false, false, false, false, false, false, false],
        [false, true, true, false, true, false, true, false, true, true, false, false, false, false, false, false, false, false],
        [false, false, true, true, false, true, false, false, false, true, true, false, false, false, false, false, false, false],
        [true, false, false, false, true, false, false, false, true, false, false, true, false, false, true, false, false, false],
        [false, false, false, false, true, true, false, true, false, true, false, true, true, false, false, false, false, false],
        [false, false, false, false, false, true, true, false, true, false, true, false, true, true, false, false, false, false],
        [false, false, false, true, false, false, true, false, false, true, false, false, false, true, false, false, false, true],
        [false, false, false, false, false, false, false, true, true, false, false, false, true, false, true, true, false, false],
        [false, false, false, false, false, false, false, false, true, true, false, true, false, true, false, true, true, false],
        [false, false, false, false, false, false, false, false, false, true, true, false, true, false, false, false, true, true],
        [false, false, false, false, false, false, false, true, false, false, false, true, false, false, false, true, false, false],
        [false, false, false, false, false, false, false, false, false, false, false, true, true, false, true, false, true, true],
        [false, false, false, false, false, false, false, false, false, false, false, false, true, true, false, true, false, true],
        [false, false, false, false, false, false, false, false, false, false, true, false, false, true, false, true, true, false],
    ];

    LARGE_CURVE = [
        [0, 0, -0.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.25, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.25],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [-0.25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.4],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0.25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.4, 0, 0],
    ];

    LARGE_X_POS_LOGICAL = [
        600, 700, 800, 900,
        650, 750, 850,
        600, 700, 800, 900,
        650, 750, 850,
        600, 700, 800, 900,
    ];

    LARGE_Y_POS_LOGICAL = [
        50, 50, 50, 50,
        150, 150, 150,
        250, 250, 250, 250,
        350, 350, 350,
        450, 450, 450, 450,
    ];

    SMALL_ALLLOWED = [
        [false, true, true, true, true, false, false, false],
        [true, false, true, true, false, true, true, false],
        [true, true, false, false, true, true, true, false],
        [true, true, false, false, false, true, false, true],
        [true, false, true, false, false, false, true, true],
        [false, true, true, true, false, false, true, true],
        [false, true, true, false, true, true, false, true],
        [false, false, false, true, true, true, true, false],
    ];

    SMALL_CURVE = [
        [0, 0.001, 0, 0.5, -0.5, 0, 0, 0],
        [0, 0, 0, 0.001, 0, 0.001, -0.2, 0],
        [0, 0.001, 0, 0, 0, 0.2, 0, 0],
        [-0.5, 0, 0, 0, 0, 0.001, 0, 0.5],
        [0.5, 0, 0, 0, 0, 0, 0, -0.5],
        [0, 0, -0.2, 0, 0, 0, 0.001, 0.001],
        [0, 0.2, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, -0.5, 0.5, 0, 0, 0],
    ];

    SMALL_X_POS_LOGICAL = [800, 725, 875, 650, 950, 725, 875, 800];
    SMALL_Y_POS_LOGICAL = [25, 125, 125, 225, 225, 325, 325, 425];

    SMALL_ADJ_MATRIX_X_START = 700;
    SMALL_ADJ_MATRIX_Y_START = 40;
    SMALL_ADJ_MATRIX_WIDTH = 30;
    SMALL_ADJ_MATRIX_HEIGHT = 30;

    SMALL_ADJ_LIST_X_START = 600;
    SMALL_ADJ_LIST_Y_START = 30;

    SMALL_ADJ_LIST_ELEM_WIDTH = 50;
    SMALL_ADJ_LIST_ELEM_HEIGHT = 30;

    SMALL_ADJ_LIST_HEIGHT = 36;
    SMALL_ADJ_LIST_WIDTH = 36;

    SMALL_ADJ_LIST_SPACING = 10;

    LARGE_ADJ_MATRIX_X_START = 575;
    LARGE_ADJ_MATRIX_Y_START = 30;
    LARGE_ADJ_MATRIX_WIDTH = 23;
    LARGE_ADJ_MATRIX_HEIGHT = 23;

    LARGE_ADJ_LIST_X_START = 600;
    LARGE_ADJ_LIST_Y_START = 30;

    LARGE_ADJ_LIST_ELEM_WIDTH = 50;
    LARGE_ADJ_LIST_ELEM_HEIGHT = 26;

    LARGE_ADJ_LIST_HEIGHT = 30;
    LARGE_ADJ_LIST_WIDTH = 30;

    LARGE_ADJ_LIST_SPACING = 10;

    VERTEX_INDEX_COLOR = "#0000FF";
    EDGE_COLOR = "#000000";

    SMALL_SIZE = 8;
    LARGE_SIZE = 18;

    HIGHLIGHT_COLOR = "#0000FF";


    constructor(am, directed, dag) {
        super();
        if (am) this.init(am, directed, dag);
    }

    init(am, directed = true, dag = false) {
        super.init(am);

        this.directed = directed;
        this.isDAG = dag;

        this.currentLayer = 1;
        this.currentLayer = 1;
        this.addControls();

        this.nextIndex = 0;
        this.setupSmall();
    }

    addControls(addDirection = true) {
        this.newGraphButton = this.addControlToAlgorithmBar("Button", "New Graph");
        this.newGraphButton.onclick = this.newGraphCallback.bind(this);

        if (addDirection) {
            const radioButtonList = this.addRadioButtonGroupToAlgorithmBar(["Directed Graph", "Undirected Graph"], "GraphType");
            this.directedGraphButton = radioButtonList[0];
            this.directedGraphButton.onclick = this.directedGraphCallback.bind(this, true);
            this.undirectedGraphButton = radioButtonList[1];
            this.undirectedGraphButton.onclick = this.directedGraphCallback.bind(this, false);
            this.directedGraphButton.checked = this.directed;
            this.undirectedGraphButton.checked = !this.directed;
        }

        const graphSizeButtonList = this.addRadioButtonGroupToAlgorithmBar(["Small Graph", "Large Graph"], "GraphSize");
        this.smallGraphButton = graphSizeButtonList[0];
        this.smallGraphButton.onclick = this.smallGraphCallback.bind(this);
        this.largeGraphButton = graphSizeButtonList[1];
        this.largeGraphButton.onclick = this.largeGraphCallback.bind(this);
        this.smallGraphButton.checked = true;

        const graphReprButtonList = this.addRadioButtonGroupToAlgorithmBar(
            ["Logical Representation", "Adjacency List Representation", "Adjacency Matrix Representation"],
            "GraphRepresentation",
        );
        this.logicalButton = graphReprButtonList[0];
        this.logicalButton.onclick = this.graphRepChangedCallback.bind(this, 1);
        this.adjacencyListButton = graphReprButtonList[1];
        this.adjacencyListButton.onclick = this.graphRepChangedCallback.bind(this, 2);
        this.adjacencyMatrixButton = graphReprButtonList[2];
        this.adjacencyMatrixButton.onclick = this.graphRepChangedCallback.bind(this, 3);
        this.logicalButton.checked = true;
    }

    directedGraphCallback(newDirected, event) {
        if (newDirected !== this.directed) {
            this.directed = newDirected;
            this.animationManager.resetAll();
            this.setup();
        }
    }

    smallGraphCallback(event) {
        if (this.size !== this.SMALL_SIZE) {
            this.animationManager.resetAll();
            this.setupSmall();
        }
    }

    largeGraphCallback(event) {
        if (this.size !== this.LARGE_SIZE) {
            this.animationManager.resetAll();
            this.setupLarge();
        }
    }

    newGraphCallback(event) {
        this.animationManager.resetAll();
        this.setup();
    }

    graphRepChangedCallback(newLayer, event) {
        this.animationManager.setAllLayers([0, newLayer]);
        this.currentLayer = newLayer;
    }

    recolorGraph() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.adjMatrix[i][j] >= 0) {
                    this.setEdgeColor(i, j, this.EDGE_COLOR);
                }
            }
        }
    }

    highlightEdge(i, j, highlightVal) {
        this.cmd("SetHighlight", this.adjListEdges[i][j], highlightVal);
        this.cmd("SetHighlight", this.adjMatrixID[i][j], highlightVal);
        this.cmd("SetEdgeHighlight", this.circleID[i], this.circleID[j], highlightVal);
        if (!this.directed) {
            this.cmd("SetEdgeHighlight", this.circleID[j], this.circleID[i], highlightVal);
        }
    }

    setEdgeColor(i, j, color) {
        this.cmd("SetForegroundColor", this.adjListEdges[i][j], color);
        this.cmd("SetTextColor", this.adjMatrixID[i][j], color);
        this.cmd("SetEdgeColor", this.circleID[i], this.circleID[j], color);
        if (!this.directed) {
            this.cmd("SetEdgeColor", this.circleID[j], this.circleID[i], color);
        }
    }

    clearEdges() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.adjMatrix[i][j] >= 0) {
                    this.cmd("Disconnect", this.circleID[i], this.circleID[j]);
                }
            }
        }
    }

    rebuildEdges() {
        this.clearEdges();
        this.buildEdges();
    }

    buildEdges() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.adjMatrix[i][j] >= 0) {
                    let edgeLabel;
                    if (this.showEdgeCosts) {
                        edgeLabel = String(this.adjMatrix[i][j]);
                    } else {
                        edgeLabel = "";
                    }
                    if (this.directed) {
                        this.cmd("Connect", this.circleID[i], this.circleID[j], this.EDGE_COLOR, this.adjustCurveForDirectedEdges(this.curve[i][j], this.adjMatrix[j][i] >= 0), 1, edgeLabel);
                    } else if (i < j) {
                        this.cmd("Connect", this.circleID[i], this.circleID[j], this.EDGE_COLOR, this.curve[i][j], 0, edgeLabel);
                    }
                }
            }
        }
    }

    setupSmall() {
        this.allowed = this.SMALL_ALLLOWED;
        this.curve = this.SMALL_CURVE;
        this.xPosLogical = this.SMALL_X_POS_LOGICAL;
        this.yPosLogical = this.SMALL_Y_POS_LOGICAL;
        this.adjMatrixXStart = this.SMALL_ADJ_MATRIX_X_START;
        this.adjMatrixYStart = this.SMALL_ADJ_MATRIX_Y_START;
        this.adjMatrixWidth = this.SMALL_ADJ_MATRIX_WIDTH;
        this.adjMatrixHeight = this.SMALL_ADJ_MATRIX_HEIGHT;
        this.adjListXStart = this.SMALL_ADJ_LIST_X_START;
        this.adjListYStart = this.SMALL_ADJ_LIST_Y_START;
        this.adjListElemWidth = this.SMALL_ADJ_LIST_ELEM_WIDTH;
        this.adjListElemHeight = this.SMALL_ADJ_LIST_ELEM_HEIGHT;
        this.adjListHeight = this.SMALL_ADJ_LIST_HEIGHT;
        this.adjListWidth = this.SMALL_ADJ_LIST_WIDTH;
        this.adjListSpacing = this.SMALL_ADJ_LIST_SPACING;
        this.size = this.SMALL_SIZE;
        this.setup();
    }

    setupLarge() {
        this.allowed = this.LARGE_ALLOWED;
        this.curve = this.LARGE_CURVE;
        this.xPosLogical = this.LARGE_X_POS_LOGICAL;
        this.yPosLogical = this.LARGE_Y_POS_LOGICAL;
        this.adjMatrixXStart = this.LARGE_ADJ_MATRIX_X_START;
        this.adjMatrixYStart = this.LARGE_ADJ_MATRIX_Y_START;
        this.adjMatrixWidth = this.LARGE_ADJ_MATRIX_WIDTH;
        this.adjMatrixHeight = this.LARGE_ADJ_MATRIX_HEIGHT;
        this.adjListXStart = this.LARGE_ADJ_LIST_X_START;
        this.adjListYStart = this.LARGE_ADJ_LIST_Y_START;
        this.adjListElemWidth = this.LARGE_ADJ_LIST_ELEM_WIDTH;
        this.adjListElemHeight = this.LARGE_ADJ_LIST_ELEM_HEIGHT;
        this.adjListHeight = this.LARGE_ADJ_LIST_HEIGHT;
        this.adjListWidth = this.LARGE_ADJ_LIST_WIDTH;
        this.adjListSpacing = this.LARGE_ADJ_LIST_SPACING;
        this.size = this.LARGE_SIZE;
        this.setup();
    }

    adjustCurveForDirectedEdges(curve, bidirectional) {
        if (!bidirectional || Math.abs(curve) > 0.01) {
            return curve;
        } else {
            return 0.1;
        }
    }

    setup() {
        this.commands = [];
        this.circleID = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            this.circleID[i] = this.nextIndex++;
            this.cmd("CreateCircle", this.circleID[i], i, this.xPosLogical[i], this.yPosLogical[i]);
            this.cmd("SetTextColor", this.circleID[i], this.VERTEX_INDEX_COLOR, 0);

            this.cmd("SetLayer", this.circleID[i], 1);
        }

        this.adjMatrix = new Array(this.size);
        this.adjMatrixID = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            this.adjMatrix[i] = new Array(this.size);
            this.adjMatrixID[i] = new Array(this.size);
        }

        let edgePercent;
        if (this.size === this.SMALL_SIZE) {
            if (this.directed) {
                edgePercent = 0.4;
            } else {
                edgePercent = 0.5;
            }
        } else if (this.directed) {
            edgePercent = 0.35;
        } else {
            edgePercent = 0.6;
        }

        if (this.directed) {
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    this.adjMatrixID[i][j] = this.nextIndex++;
                    if ((this.allowed[i][j]) && Math.random() <= edgePercent && (i < j || Math.abs(this.curve[i][j]) < 0.01 || this.adjMatrixID[j][i] === -1) && (!this.isDAG || (i < j))) {
                        if (this.showEdgeCosts) {
                            this.adjMatrix[i][j] = Math.floor(Math.random() * 9) + 1;
                        } else {
                            this.adjMatrix[i][j] = 1;
                        }
                    } else {
                        this.adjMatrix[i][j] = -1;
                    }
                }
            }
            this.buildEdges();
        } else {
            for (let i = 0; i < this.size; i++) {
                for (let j = i + 1; j < this.size; j++) {
                    this.adjMatrixID[i][j] = this.nextIndex++;
                    this.adjMatrixID[j][i] = this.nextIndex++;

                    if ((this.allowed[i][j]) && Math.random() <= edgePercent) {
                        if (this.showEdgeCosts) {
                            this.adjMatrix[i][j] = Math.floor(Math.random() * 9) + 1;
                        } else {
                            this.adjMatrix[i][j] = 1;
                        }
                        this.adjMatrix[j][i] = this.adjMatrix[i][j];
                        let edgeLabel;
                        if (this.showEdgeCosts) {
                            edgeLabel = String(this.adjMatrix[i][j]);
                        } else {
                            edgeLabel = "";
                        }
                        this.cmd("Connect", this.circleID[i], this.circleID[j], this.EDGE_COLOR, this.curve[i][j], 0, edgeLabel);
                    } else {
                        this.adjMatrix[i][j] = -1;
                        this.adjMatrix[j][i] = -1;
                    }
                }
            }

            this.buildEdges();

            for (let i = 0; i < this.size; i++) {
                this.adjMatrix[i][i] = -1;
            }
        }

        // Craate Adj List
        this.buildAdjList();

        // Create Adj Matrix
        this.buildAdjMatrix();

        this.animationManager.setAllLayers([0, this.currentLayer]);
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
        this.clearHistory();
    }

    buildAdjMatrix() {
        this.adjMatrixIndexX = new Array(this.size);
        this.adjMatrixIndexY = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            this.adjMatrixIndexX[i] = this.nextIndex++;
            this.adjMatrixIndexY[i] = this.nextIndex++;
            this.cmd("CreateLabel", this.adjMatrixIndexX[i], i, this.adjMatrixXStart + i * this.adjMatrixWidth, this.adjMatrixYStart - this.adjMatrixHeight);
            this.cmd("SetForegroundColor", this.adjMatrixIndexX[i], this.VERTEX_INDEX_COLOR);
            this.cmd("CreateLabel", this.adjMatrixIndexY[i], i, this.adjMatrixXStart - this.adjMatrixWidth, this.adjMatrixYStart + i * this.adjMatrixHeight);
            this.cmd("SetForegroundColor", this.adjMatrixIndexY[i], this.VERTEX_INDEX_COLOR);
            this.cmd("SetLayer", this.adjMatrixIndexX[i], 3);
            this.cmd("SetLayer", this.adjMatrixIndexY[i], 3);

            for (let j = 0; j < this.size; j++) {
                this.adjMatrixID[i][j] = this.nextIndex++;
                let lab;
                if (this.adjMatrix[i][j] < 0) {
                    lab = "";
                } else {
                    lab = String(this.adjMatrix[i][j]);
                }
                this.cmd("CreateRectangle", this.adjMatrixID[i][j], lab, this.adjMatrixWidth, this.adjMatrixHeight,
                    this.adjMatrixXStart + j * this.adjMatrixWidth, this.adjMatrixYStart + i * this.adjMatrixHeight);
                this.cmd("SetLayer", this.adjMatrixID[i][j], 3);
            }
        }
    }

    removeAdjList() {
        for (let i = 0; i < this.size; i++) {
            this.cmd("Delete", this.adjListList[i], "RAL1");
            this.cmd("Delete", this.adjListIndex[i], "RAL2");
            for (let j = 0; j < this.size; j++) {
                if (this.adjMatrix[i][j] > 0) {
                    this.cmd("Delete", this.adjListEdges[i][j], "RAL3");
                }
            }
        }
    }

    buildAdjList() {
        this.adjListIndex = new Array(this.size);
        this.adjListList = new Array(this.size);
        this.adjListEdges = new Array(this.size);

        for (let i = 0; i < this.size; i++) {
            this.adjListIndex[i] = this.nextIndex++;
            this.adjListEdges[i] = new Array(this.size);
            this.adjListIndex[i] = this.nextIndex++;
            this.adjListList[i] = this.nextIndex++;
            this.cmd("CreateRectangle", this.adjListList[i], "", this.adjListWidth, this.adjListHeight, this.adjListXStart, this.adjListYStart + i * this.adjListHeight);
            this.cmd("SetLayer", this.adjListList[i], 2);
            this.cmd("CreateLabel", this.adjListIndex[i], i, this.adjListXStart - this.adjListWidth, this.adjListYStart + i * this.adjListHeight);
            this.cmd("SetForegroundColor", this.adjListIndex[i], this.VERTEX_INDEX_COLOR);
            this.cmd("SetLayer", this.adjListIndex[i], 2);
            let lastElem = this.adjListList[i];
            let nextXPos = this.adjListXStart + this.adjListWidth + this.adjListSpacing;
            let hasEdges = false;
            for (let j = 0; j < this.size; j++) {
                if (this.adjMatrix[i][j] > 0) {
                    hasEdges = true;
                    this.adjListEdges[i][j] = this.nextIndex++;
                    this.cmd("CreateLinkedList", this.adjListEdges[i][j], j, this.adjListElemWidth, this.adjListElemHeight,
                        nextXPos, this.adjListYStart + i * this.adjListHeight, 0.25, 0, 1, 2);
                    this.cmd("SetNull", this.adjListEdges[i][j], 1);
                    this.cmd("SetText", this.adjListEdges[i][j], this.adjMatrix[i][j], 1);
                    this.cmd("SetTextColor", this.adjListEdges[i][j], this.VERTEX_INDEX_COLOR, 0);
                    this.cmd("SetLayer", this.adjListEdges[i][j], 2);

                    nextXPos = nextXPos + this.adjListElemWidth + this.adjListSpacing;
                    this.cmd("Connect", lastElem, this.adjListEdges[i][j]);
                    this.cmd("SetNull", lastElem, 0);
                    lastElem = this.adjListEdges[i][j];
                }
            }
            if (!hasEdges) {
                this.cmd("SetNull", this.adjListList[i], 1);
            }
        }
    }
}
