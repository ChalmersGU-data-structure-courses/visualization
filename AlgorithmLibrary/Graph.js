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

// TODO:  UNDO (all the way) is BROKEN.  Redo reset ...


class Graph extends Algorithm {
    static LARGE_ALLOWED = [
        [false, true, true, false, true, false, false, true, false, false, false, false, false, false, true, false, false, false],
        [true, false, true, false, true, true,  false, false, false, false, false, false, false, false, false, false, false, false],
        [true, true, false, true,  false, true, true,  false, false, false, false, false, false, false, false, false, false, false],
        [false, false, true, false, false,false, true, false, false, false, true, false, false,  false, false, false, false, true],
        [true, true, false, false,  false, true, false, true, true, false, false, false, false, false, false, false,  false,  false],
        [false, true, true, false, true, false, true,   false, true, true, false, false, false, false, false, false,  false,  false],
        [false, false, true, true, false, true, false, false, false, true, true, false, false, false, false, false,  false,  false],
        [true, false, false, false, true, false, false, false, true, false, false, true, false, false, true, false, false, false],
        [false, false, false, false, true, true, false, true, false, true, false, true, true, false,   false, false, false, false],
        [false, false, false, false, false, true, true, false, true, false, true, false, true, true,  false,  false, false, false],
        [false, false, false, true, false,  false, true, false, false, true, false, false, false, true, false, false, false, true],
        [false, false, false, false, false, false, false, true, true, false, false, false, true, false, true, true, false, false],
        [false, false, false, false, false, false, false, false, true, true, false, true, false, true, false, true, true, false],
        [false, false, false, false, false, false, false, false, false, true, true, false, true, false, false, false, true, true],
        [false, false, false, false, false, false, false, true, false, false, false, true, false, false, false, true, false, false],
        [false, false, false, false, false, false, false, false, false, false, false, true, true, false, true, false, true, true],
        [false, false, false, false, false, false, false, false, false, false, false, false, true, true, false, true, false, true],
        [false, false, false, false, false, false, false, false, false, false, true, false, false, true, false, true, true, false],
    ];

    static LARGE_CURVE  = [
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

    static LARGE_X_POS_LOGICAL = [
        600, 700, 800, 900,
        650, 750, 850,
        600, 700, 800, 900,
        650, 750, 850,
        600, 700, 800, 900,
    ];

    static LARGE_Y_POS_LOGICAL = [
        50, 50, 50, 50,
        150, 150, 150,
        250, 250, 250, 250,
        350, 350, 350,
        450,  450, 450, 450,
    ];

    static SMALL_ALLLOWED = [
        [false, true,  true,  true,  true,  false, false, false],
        [true,  false, true,  true,  false, true,  true,  false],
        [true,  true,  false, false, true,  true,  true,  false],
        [true,  true,  false, false, false, true,  false, true],
        [true,  false, true,  false, false,  false, true,  true],
        [false, true,  true,  true,  false, false, true,  true],
        [false, true,  true,  false, true,  true,  false, true],
        [false, false, false, true,  true,  true,  true,  false],
    ];

    static SMALL_CURVE = [
        [0, 0.001, 0, 0.5, -0.5, 0, 0, 0],
        [0, 0, 0, 0.001, 0, 0.001, -0.2, 0],
        [0, 0.001, 0, 0, 0, 0.2, 0, 0],
        [-0.5, 0, 0, 0, 0, 0.001, 0, 0.5],
        [0.5, 0, 0, 0, 0, 0, 0, -0.5],
        [0, 0, -0.2, 0, 0, 0, 0.001, 0.001],
        [0, 0.2, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, -0.5, 0.5, 0, 0, 0],
    ];

    static SMALL_X_POS_LOGICAL = [800, 725, 875, 650, 950, 725, 875, 800];
    static SMALL_Y_POS_LOGICAL = [25, 125, 125, 225, 225, 325, 325, 425];


    static SMALL_ADJ_MATRIX_X_START = 700;
    static SMALL_ADJ_MATRIX_Y_START = 40;
    static SMALL_ADJ_MATRIX_WIDTH = 30;
    static SMALL_ADJ_MATRIX_HEIGHT = 30;

    static SMALL_ADJ_LIST_X_START = 600;
    static SMALL_ADJ_LIST_Y_START = 30;

    static SMALL_ADJ_LIST_ELEM_WIDTH = 50;
    static SMALL_ADJ_LIST_ELEM_HEIGHT = 30;

    static SMALL_ADJ_LIST_HEIGHT = 36;
    static SMALL_ADJ_LIST_WIDTH = 36;

    static SMALL_ADJ_LIST_SPACING = 10;


    static LARGE_ADJ_MATRIX_X_START = 575;
    static LARGE_ADJ_MATRIX_Y_START = 30;
    static LARGE_ADJ_MATRIX_WIDTH = 23;
    static LARGE_ADJ_MATRIX_HEIGHT = 23;

    static LARGE_ADJ_LIST_X_START = 600;
    static LARGE_ADJ_LIST_Y_START = 30;

    static LARGE_ADJ_LIST_ELEM_WIDTH = 50;
    static LARGE_ADJ_LIST_ELEM_HEIGHT = 26;

    static LARGE_ADJ_LIST_HEIGHT = 30;
    static LARGE_ADJ_LIST_WIDTH = 30;

    static LARGE_ADJ_LIST_SPACING = 10;


    static VERTEX_INDEX_COLOR ="#0000FF";
    static EDGE_COLOR = "#000000";

    static SMALL_SIZE = 8;
    static LARGE_SIZE = 18;

    static HIGHLIGHT_COLOR = "#0000FF";


    init(am, directed = true, dag = false) {
        super.init(am);

        this.directed = directed;
        this.isDAG = dag;

        this.currentLayer = 1;
        this.currentLayer = 1;
        this.addControls();

        this.nextIndex = 0;
        this.setup_small();
    }

    addControls(addDirection = true) {
        this.newGraphButton = this.addControlToAlgorithmBar("Button", "New Graph");
        this.newGraphButton.onclick = this.newGraphCallback.bind(this);

        if (addDirection) {
            var radioButtonList = this.addRadioButtonGroupToAlgorithmBar(["Directed Graph", "Undirected Graph"], "GraphType");
            this.directedGraphButton = radioButtonList[0];
            this.directedGraphButton.onclick = this.directedGraphCallback.bind(this, true);
            this.undirectedGraphButton = radioButtonList[1];
            this.undirectedGraphButton.onclick = this.directedGraphCallback.bind(this, false);
            this.directedGraphButton.checked = this.directed;
            this.undirectedGraphButton.checked = !this.directed;
        }

        var radioButtonList = this.addRadioButtonGroupToAlgorithmBar(["Small Graph", "Large Graph"], "GraphSize");
        this.smallGraphButton = radioButtonList[0];
        this.smallGraphButton.onclick = this.smallGraphCallback.bind(this);
        this.largeGraphButton = radioButtonList[1];
        this.largeGraphButton.onclick = this.largeGraphCallback.bind(this);
        this.smallGraphButton.checked = true;

        var radioButtonList = this.addRadioButtonGroupToAlgorithmBar(
            ["Logical Representation", "Adjacency List Representation", "Adjacency Matrix Representation"],
            "GraphRepresentation"
        );
        this.logicalButton = radioButtonList[0];
        this.logicalButton.onclick = this.graphRepChangedCallback.bind(this, 1);
        this.adjacencyListButton = radioButtonList[1];
        this.adjacencyListButton.onclick = this.graphRepChangedCallback.bind(this, 2);
        this.adjacencyMatrixButton = radioButtonList[2];
        this.adjacencyMatrixButton.onclick = this.graphRepChangedCallback.bind(this, 3);
        this.logicalButton.checked = true;
    }

    directedGraphCallback(newDirected, event) {
        if (newDirected != this.directed) {
            this.directed = newDirected;
            this.animationManager.resetAll();
            this.setup();
        }
    }

    smallGraphCallback(event) {
        if (this.size != Graph.SMALL_SIZE) {
            this.animationManager.resetAll();
            this.setup_small();
        }
    }

    largeGraphCallback(event) {
        if (this.size != Graph.LARGE_SIZE) {
            this.animationManager.resetAll();
            this.setup_large();
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
        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                if (this.adj_matrix[i][j] >= 0) {
                    this.setEdgeColor(i, j, Graph.EDGE_COLOR);
                }
            }
        }
    }

    highlightEdge(i, j, highlightVal) {
        this.cmd("SetHighlight", this.adj_list_edges[i][j], highlightVal);
        this.cmd("SetHighlight", this.adj_matrixID[i][j], highlightVal);
        this.cmd("SetEdgeHighlight", this.circleID[i], this.circleID[j], highlightVal);
        if (!this.directed) {
            this.cmd("SetEdgeHighlight", this.circleID[j], this.circleID[i], highlightVal);
        }
    }

    setEdgeColor(i, j, color) {
        this.cmd("SetForegroundColor", this.adj_list_edges[i][j], color);
        this.cmd("SetTextColor", this.adj_matrixID[i][j], color);
        this.cmd("SetEdgeColor", this.circleID[i], this.circleID[j], color);
        if (!this.directed) {
            this.cmd("SetEdgeColor", this.circleID[j], this.circleID[i], color);
        }
    }

    clearEdges() {
        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                if (this.adj_matrix[i][j] >= 0) {
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
        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                if (this.adj_matrix[i][j] >= 0) {
                    var edgeLabel;
                    if (this.showEdgeCosts) {
                        edgeLabel = String(this.adj_matrix[i][j]);
                    }
                    else {
                        edgeLabel = "";
                    }
                    if (this.directed) {
                        this.cmd("Connect", this.circleID[i], this.circleID[j], Graph.EDGE_COLOR, this.adjustCurveForDirectedEdges(this.curve[i][j], this.adj_matrix[j][i] >= 0), 1, edgeLabel);
                    }
                    else if (i < j) {
                        this.cmd("Connect", this.circleID[i], this.circleID[j], Graph.EDGE_COLOR, this.curve[i][j], 0, edgeLabel);
                    }
                }
            }
        }
    }

    setup_small() {
        this.allowed = Graph.SMALL_ALLLOWED;
        this.curve = Graph.SMALL_CURVE;
        this.x_pos_logical = Graph.SMALL_X_POS_LOGICAL;
        this.y_pos_logical = Graph.SMALL_Y_POS_LOGICAL;
        this.adj_matrix_x_start = Graph.SMALL_ADJ_MATRIX_X_START;
        this.adj_matrix_y_start = Graph.SMALL_ADJ_MATRIX_Y_START;
        this.adj_matrix_width = Graph.SMALL_ADJ_MATRIX_WIDTH;
        this.adj_matrix_height = Graph.SMALL_ADJ_MATRIX_HEIGHT;
        this.adj_list_x_start = Graph.SMALL_ADJ_LIST_X_START;
        this.adj_list_y_start = Graph.SMALL_ADJ_LIST_Y_START;
        this.adj_list_elem_width = Graph.SMALL_ADJ_LIST_ELEM_WIDTH;
        this.adj_list_elem_height = Graph.SMALL_ADJ_LIST_ELEM_HEIGHT;
        this.adj_list_height = Graph.SMALL_ADJ_LIST_HEIGHT;
        this.adj_list_width = Graph.SMALL_ADJ_LIST_WIDTH;
        this.adj_list_spacing = Graph.SMALL_ADJ_LIST_SPACING;
        this.size = Graph.SMALL_SIZE;
        this.setup();
    }

    setup_large() {
        this.allowed = Graph.LARGE_ALLOWED;
        this.curve = Graph.LARGE_CURVE;
        this.x_pos_logical = Graph.LARGE_X_POS_LOGICAL;
        this.y_pos_logical = Graph.LARGE_Y_POS_LOGICAL;
        this.adj_matrix_x_start = Graph.LARGE_ADJ_MATRIX_X_START;
        this.adj_matrix_y_start = Graph.LARGE_ADJ_MATRIX_Y_START;
        this.adj_matrix_width = Graph.LARGE_ADJ_MATRIX_WIDTH;
        this.adj_matrix_height = Graph.LARGE_ADJ_MATRIX_HEIGHT;
        this.adj_list_x_start = Graph.LARGE_ADJ_LIST_X_START;
        this.adj_list_y_start = Graph.LARGE_ADJ_LIST_Y_START;
        this.adj_list_elem_width = Graph.LARGE_ADJ_LIST_ELEM_WIDTH;
        this.adj_list_elem_height = Graph.LARGE_ADJ_LIST_ELEM_HEIGHT;
        this.adj_list_height = Graph.LARGE_ADJ_LIST_HEIGHT;
        this.adj_list_width = Graph.LARGE_ADJ_LIST_WIDTH;
        this.adj_list_spacing = Graph.LARGE_ADJ_LIST_SPACING;
        this.size = Graph.LARGE_SIZE;
        this.setup();
    }

    adjustCurveForDirectedEdges(curve, bidirectional) {
        if (!bidirectional || Math.abs(curve) > 0.01) {
            return curve;
        }
        else {
            return 0.1;
        }
    }

    setup() {
        this.commands = new Array();
        this.circleID = new Array(this.size);
        for (var i = 0; i < this.size; i++) {
            this.circleID[i] = this.nextIndex++;
            this.cmd("CreateCircle", this.circleID[i], i, this.x_pos_logical[i], this.y_pos_logical[i]);
            this.cmd("SetTextColor", this.circleID[i], Graph.VERTEX_INDEX_COLOR, 0);

            this.cmd("SetLayer", this.circleID[i], 1);
        }

        this.adj_matrix = new Array(this.size);
        this.adj_matrixID = new Array(this.size);
        for (i = 0; i < this.size; i++) {
            this.adj_matrix[i] = new Array(this.size);
            this.adj_matrixID[i] = new Array(this.size);
        }

        var edgePercent;
        if (this.size == Graph.SMALL_SIZE) {
            if (this.directed) {
                edgePercent = 0.4;
            }
            else {
                edgePercent = 0.5;
            }

        }
        else {
            if (this.directed) {
                edgePercent = 0.35;
            }
            else {
                edgePercent = 0.6;
            }

        }

        var lowerBound = 0;

        if (this.directed) {
            for (i = 0; i < this.size; i++) {
                for (var j = 0; j < this.size; j++) {
                    this.adj_matrixID[i][j] = this.nextIndex++;
                    if ((this.allowed[i][j]) && Math.random() <= edgePercent && (i < j || Math.abs(this.curve[i][j]) < 0.01 || this.adj_matrixID[j][i] == -1) && (!this.isDAG || (i < j))) {
                        if (this.showEdgeCosts) {
                            this.adj_matrix[i][j] = Math.floor(Math.random() * 9) + 1;
                        }
                        else {
                            this.adj_matrix[i][j] = 1;
                        }

                    }
                    else {
                        this.adj_matrix[i][j] = -1;
                    }

                }
            }
            this.buildEdges();
        }
        else {
            for (i = 0; i < this.size; i++) {
                for (j = i + 1; j < this.size; j++) {
                    this.adj_matrixID[i][j] = this.nextIndex++;
                    this.adj_matrixID[j][i] = this.nextIndex++;

                    if ((this.allowed[i][j]) && Math.random() <= edgePercent) {
                        if (this.showEdgeCosts) {
                            this.adj_matrix[i][j] = Math.floor(Math.random() * 9) + 1;
                        }
                        else {
                            this.adj_matrix[i][j] = 1;
                        }
                        this.adj_matrix[j][i] = this.adj_matrix[i][j];
                        if (this.showEdgeCosts) {
                            var edgeLabel = String(this.adj_matrix[i][j]);
                        }
                        else {
                            edgeLabel = "";
                        }
                        this.cmd("Connect", this.circleID[i], this.circleID[j], Graph.EDGE_COLOR, this.curve[i][j], 0, edgeLabel);
                    }
                    else {
                        this.adj_matrix[i][j] = -1;
                        this.adj_matrix[j][i] = -1;
                    }

                }
            }

            this.buildEdges();

            for (i = 0; i < this.size; i++) {
                this.adj_matrix[i][i] = -1;
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
        this.adj_matrix_index_x = new Array(this.size);
        this.adj_matrix_index_y = new Array(this.size);
        for (var i = 0; i < this.size; i++) {
            this.adj_matrix_index_x[i] = this.nextIndex++;
            this.adj_matrix_index_y[i] = this.nextIndex++;
            this.cmd("CreateLabel", this.adj_matrix_index_x[i], i, this.adj_matrix_x_start + i * this.adj_matrix_width, this.adj_matrix_y_start - this.adj_matrix_height);
            this.cmd("SetForegroundColor", this.adj_matrix_index_x[i], Graph.VERTEX_INDEX_COLOR);
            this.cmd("CreateLabel", this.adj_matrix_index_y[i], i, this.adj_matrix_x_start - this.adj_matrix_width, this.adj_matrix_y_start + i * this.adj_matrix_height);
            this.cmd("SetForegroundColor", this.adj_matrix_index_y[i], Graph.VERTEX_INDEX_COLOR);
            this.cmd("SetLayer", this.adj_matrix_index_x[i], 3);
            this.cmd("SetLayer", this.adj_matrix_index_y[i], 3);

            for (var j = 0; j < this.size; j++) {
                this.adj_matrixID[i][j] = this.nextIndex++;
                if (this.adj_matrix[i][j] < 0) {
                    var lab = "";
                }
                else {
                    lab = String(this.adj_matrix[i][j]);
                }
                this.cmd("CreateRectangle", this.adj_matrixID[i][j], lab, this.adj_matrix_width, this.adj_matrix_height,
                    this.adj_matrix_x_start + j * this.adj_matrix_width, this.adj_matrix_y_start + i * this.adj_matrix_height);
                this.cmd("SetLayer", this.adj_matrixID[i][j], 3);
            }
        }
    }

    removeAdjList() {
        for (var i = 0; i < this.size; i++) {
            this.cmd("Delete", this.adj_list_list[i], "RAL1");
            this.cmd("Delete", this.adj_list_index[i], "RAL2");
            for (var j = 0; j < this.size; j++) {
                if (this.adj_matrix[i][j] > 0) {
                    this.cmd("Delete", this.adj_list_edges[i][j], "RAL3");
                }
            }
        }

    }

    buildAdjList() {
        this.adj_list_index = new Array(this.size);
        this.adj_list_list = new Array(this.size);
        this.adj_list_edges = new Array(this.size);

        for (var i = 0; i < this.size; i++) {
            this.adj_list_index[i] = this.nextIndex++;
            this.adj_list_edges[i] = new Array(this.size);
            this.adj_list_index[i] = this.nextIndex++;
            this.adj_list_list[i] = this.nextIndex++;
            this.cmd("CreateRectangle", this.adj_list_list[i], "", this.adj_list_width, this.adj_list_height, this.adj_list_x_start, this.adj_list_y_start + i * this.adj_list_height);
            this.cmd("SetLayer", this.adj_list_list[i], 2);
            this.cmd("CreateLabel", this.adj_list_index[i], i, this.adj_list_x_start - this.adj_list_width, this.adj_list_y_start + i * this.adj_list_height);
            this.cmd("SetForegroundColor", this.adj_list_index[i], Graph.VERTEX_INDEX_COLOR);
            this.cmd("SetLayer", this.adj_list_index[i], 2);
            var lastElem = this.adj_list_list[i];
            var nextXPos = this.adj_list_x_start + this.adj_list_width + this.adj_list_spacing;
            var hasEdges = false;
            for (var j = 0; j < this.size; j++) {
                if (this.adj_matrix[i][j] > 0) {
                    hasEdges = true;
                    this.adj_list_edges[i][j] = this.nextIndex++;
                    this.cmd("CreateLinkedList", this.adj_list_edges[i][j], j, this.adj_list_elem_width, this.adj_list_elem_height,
                        nextXPos, this.adj_list_y_start + i * this.adj_list_height, 0.25, 0, 1, 2);
                    this.cmd("SetNull", this.adj_list_edges[i][j], 1);
                    this.cmd("SetText", this.adj_list_edges[i][j], this.adj_matrix[i][j], 1);
                    this.cmd("SetTextColor", this.adj_list_edges[i][j], Graph.VERTEX_INDEX_COLOR, 0);
                    this.cmd("SetLayer", this.adj_list_edges[i][j], 2);

                    nextXPos = nextXPos + this.adj_list_elem_width + this.adj_list_spacing;
                    this.cmd("Connect", lastElem, this.adj_list_edges[i][j]);
                    this.cmd("SetNull", lastElem, 0);
                    lastElem = this.adj_list_edges[i][j];
                }
            }
            if (!hasEdges) {
                this.cmd("SetNull", this.adj_list_list[i], 1);
            }
        }
    }
}
