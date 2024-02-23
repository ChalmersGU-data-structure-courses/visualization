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


Algorithm.Graph.ToposortDFS = class ToposortDFS extends Algorithm.Graph {
    ORDERING_INITIAL_X = 300;
    ORDERING_INITIAL_Y = 70;
    ORDERING_DELTA_Y = 20;

    D_X_POS_SMALL = [760, 685, 915, 610, 910, 685, 915, 760];
    F_X_POS_SMALL = [760, 685, 915, 610, 910, 685, 915, 760];

    D_Y_POS_SMALL = [18, 118, 118, 218, 218, 318, 318, 418];
    F_Y_POS_SMALL = [32, 132, 132, 232, 232, 332, 332, 432];

    D_X_POS_LARGE = [
        560, 660, 760, 860,
        610, 710, 810,
        560, 660, 760, 860,
        610, 710, 810,
        560, 660, 760, 860,
    ];

    F_X_POS_LARGE = [
        560, 660, 760, 860,
        610, 710, 810,
        560, 660, 760, 860,
        610, 710, 810,
        560, 660, 760, 860,
    ];

    D_Y_POS_LARGE = [
        37, 37, 37, 37,
        137, 137, 137,
        237, 237, 237, 237,
        337, 337, 337,
        437, 437, 437, 437,
    ];

    F_Y_POS_LARGE = [
        62, 62, 62, 62,
        162, 162, 162,
        262, 262, 262, 262,
        362, 362, 362,
        462, 462, 462, 462,
    ];

    HIGHLIGHT_CIRCLE_COLOR = "#000000";
    DFS_TREE_COLOR = "#0000FF";

    constructor(am) {
        super();
        this.init(am);
    }

    addControls() {
        this.startButton = this.addButtonToAlgorithmBar("Do Topological Sort");
        this.startButton.onclick = this.startCallback.bind(this);
        super.addControls(false);
    }

    init(am) {
        this.showEdgeCosts = false;
        super.init(am, true, true); // TODO:  add no edge label flag to this?
    }

    setup() {
        super.setup();
        this.messageID = [];
        this.animationManager.setAllLayers([0, this.currentLayer]);

        this.highlightCircleL = this.nextIndex++;
        this.highlightCircleAL = this.nextIndex++;
        this.highlightCircleAM = this.nextIndex++;
        this.initialIndex = this.nextIndex;

        this.oldAdjMatrix = new Array(this.size);
        this.oldAdjListList = new Array(this.size);
        this.oldAdjListIndex = new Array(this.size);
        this.oldAdjListEdges = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            this.oldAdjMatrix[i] = new Array(this.size);
            this.oldAdjListIndex[i] = this.adjListIndex[i];
            this.oldAdjListList[i] = this.adjListList[i];
            this.oldAdjListEdges[i] = new Array(this.size);
            for (let j = 0; j < this.size; j++) {
                this.oldAdjMatrix[i][j] = this.adjMatrix[i][j];
                if (this.adjMatrix[i][j] > 0) {
                    this.oldAdjListEdges[i][j] = this.adjListEdges[i][j];
                }
            }
        }
    }

    startCallback(event) {
        this.implementAction(this.doTopoSort.bind(this), "");
    }

    doTopoSort(ignored) {
        this.visited = new Array(this.size);
        this.commands = [];
        this.topoOrderArrayL = [];
        this.topoOrderArrayAL = [];
        this.topoOrderArrayAM = [];

        if (this.messageID != null) {
            for (let i = 0; i < this.messageID.length; i++) {
                this.cmd("Delete", this.messageID[i], 1);
            }
        }
        this.rebuildEdges(); // HMMM.. do I want this?
        this.messageID = [];

        let headerID = this.nextIndex++;
        this.messageID.push(headerID);
        this.cmd("CreateLabel", headerID, "Topological Order", this.ORDERING_INITIAL_X, this.ORDERING_INITIAL_Y - 1.5 * this.ORDERING_DELTA_Y);

        headerID = this.nextIndex++;
        this.messageID.push(headerID);
        this.cmd("CreateRectangle", headerID, "", 100, 0, this.ORDERING_INITIAL_X, this.ORDERING_INITIAL_Y - this.ORDERING_DELTA_Y, "center", "center");

        this.dTimesIDL = new Array(this.size);
        this.fTimesIDL = new Array(this.size);
        this.dTimesIDAL = new Array(this.size);
        this.fTimesIDAL = new Array(this.size);
        this.dTimes = new Array(this.size);
        this.fTimes = new Array(this.size);
        this.currentTime = 1;
        for (let i = 0; i < this.size; i++) {
            this.dTimesIDL[i] = this.nextIndex++;
            this.fTimesIDL[i] = this.nextIndex++;
            this.dTimesIDAL[i] = this.nextIndex++;
            this.fTimesIDAL[i] = this.nextIndex++;
        }

        this.messageY = 30;

        for (let vertex = 0; vertex < this.size; vertex++) {
            if (!this.visited[vertex]) {
                this.cmd("CreateHighlightCircle", this.highlightCircleL, this.HIGHLIGHT_CIRCLE_COLOR, this.xPosLogical[vertex], this.yPosLogical[vertex]);
                this.cmd("SetLayer", this.highlightCircleL, 1);
                this.cmd("CreateHighlightCircle", this.highlightCircleAL, this.HIGHLIGHT_CIRCLE_COLOR, this.adjListXStart - this.adjListWidth, this.adjListYStart + vertex * this.adjListHeight);
                this.cmd("SetLayer", this.highlightCircleAL, 2);

                this.cmd("CreateHighlightCircle", this.highlightCircleAM, this.HIGHLIGHT_CIRCLE_COLOR, this.adjMatrixXStart - this.adjMatrixWidth, this.adjMatrixYStart + vertex * this.adjMatrixHeight);
                this.cmd("SetLayer", this.highlightCircleAM, 3);

                if (vertex > 0) {
                    const breakID = this.nextIndex++;
                    this.messageID.push(breakID);
                    this.cmd("CreateRectangle", breakID, "", 200, 0, 10, this.messageY, "left", "bottom");
                    this.messageY = this.messageY + 20;
                }
                this.dfsVisit(vertex, 10, false);
                this.cmd("Delete", this.highlightCircleL, 2);
                this.cmd("Delete", this.highlightCircleAL, 3);
                this.cmd("Delete", this.highlightCircleAM, 4);
            }
        }
        return this.commands;
    }

    setupLarge() {
        this.dXPos = this.D_X_POS_LARGE;
        this.dYPos = this.D_Y_POS_LARGE;
        this.fXPos = this.F_X_POS_LARGE;
        this.fYPos = this.F_Y_POS_LARGE;
        super.setupLarge();
    }

    setupSmall() {
        this.dXPos = this.D_X_POS_SMALL;
        this.dYPos = this.D_Y_POS_SMALL;
        this.fXPos = this.F_X_POS_SMALL;
        this.fYPos = this.F_Y_POS_SMALL;
        super.setupSmall();
    }

    dfsVisit(startVertex, messageX, printCCNum) {
        let nextMessage = this.nextIndex++;
        this.messageID.push(nextMessage);
        this.cmd("CreateLabel", nextMessage, `DFS(${String(startVertex)})`, messageX, this.messageY, 0);

        this.messageY = this.messageY + 20;
        if (!this.visited[startVertex]) {
            this.dTimes[startVertex] = this.currentTime++;
            this.cmd("CreateLabel", this.dTimesIDL[startVertex], `d = ${String(this.dTimes[startVertex])}`, this.dXPos[startVertex], this.dYPos[startVertex]);
            this.cmd("CreateLabel", this.dTimesIDAL[startVertex], `d = ${String(this.dTimes[startVertex])}`, this.adjListXStart - 2 * this.adjListWidth, this.adjListYStart + startVertex * this.adjListHeight - 1 / 4 * this.adjListHeight);
            this.cmd("SetLayer", this.dTimesIDL[startVertex], 1);
            this.cmd("SetLayer", this.dTimesIDAL[startVertex], 2);

            this.visited[startVertex] = true;
            this.cmd("Step");
            for (let neighbor = 0; neighbor < this.size; neighbor++) {
                if (this.adjMatrix[startVertex][neighbor] > 0) {
                    this.highlightEdge(startVertex, neighbor, 1);
                    if (this.visited[neighbor]) {
                        nextMessage = this.nextIndex;
                        this.cmd("CreateLabel", nextMessage, `Vertex ${String(neighbor)} already this.visited.`, messageX, this.messageY, 0);
                    }
                    this.cmd("Step");
                    this.highlightEdge(startVertex, neighbor, 0);
                    if (this.visited[neighbor]) {
                        this.cmd("Delete", nextMessage, "DNM");
                    }

                    if (!this.visited[neighbor]) {
                        this.cmd("Disconnect", this.circleID[startVertex], this.circleID[neighbor]);
                        this.cmd("Connect", this.circleID[startVertex], this.circleID[neighbor], this.DFS_TREE_COLOR, this.curve[startVertex][neighbor], 1, "");
                        this.cmd("Move", this.highlightCircleL, this.xPosLogical[neighbor], this.yPosLogical[neighbor]);
                        this.cmd("Move", this.highlightCircleAL, this.adjListXStart - this.adjListWidth, this.adjListYStart + neighbor * this.adjListHeight);
                        this.cmd("Move", this.highlightCircleAM, this.adjMatrixXStart - this.adjMatrixWidth, this.adjMatrixYStart + neighbor * this.adjMatrixHeight);

                        this.cmd("Step");
                        this.dfsVisit(neighbor, messageX + 10, printCCNum);
                        nextMessage = this.nextIndex;
                        this.cmd("CreateLabel", nextMessage, `Returning from recursive call: DFS(${String(neighbor)})`, messageX + 20, this.messageY, 0);

                        this.cmd("Move", this.highlightCircleAL, this.adjListXStart - this.adjListWidth, this.adjListYStart + startVertex * this.adjListHeight);
                        this.cmd("Move", this.highlightCircleL, this.xPosLogical[startVertex], this.yPosLogical[startVertex]);
                        this.cmd("Move", this.highlightCircleAM, this.adjMatrixXStart - this.adjMatrixWidth, this.adjMatrixYStart + startVertex * this.adjMatrixHeight);
                        this.cmd("Step");
                        this.cmd("Delete", nextMessage, 18);
                    }
                    this.cmd("Step");
                }
            }

            this.fTimes[startVertex] = this.currentTime++;
            this.cmd("CreateLabel", this.fTimesIDL[startVertex], `f = ${String(this.fTimes[startVertex])}`, this.fXPos[startVertex], this.fYPos[startVertex]);
            this.cmd("CreateLabel", this.fTimesIDAL[startVertex], `f = ${String(this.fTimes[startVertex])}`, this.adjListXStart - 2 * this.adjListWidth, this.adjListYStart + startVertex * this.adjListHeight + 1 / 4 * this.adjListHeight);

            this.cmd("SetLayer", this.fTimesIDL[startVertex], 1);
            this.cmd("SetLayer", this.fTimesIDAL[startVertex], 2);

            this.cmd("Step");

            for (let i = this.topoOrderArrayL.length; i > 0; i--) {
                this.topoOrderArrayL[i] = this.topoOrderArrayL[i - 1];
                this.topoOrderArrayAL[i] = this.topoOrderArrayAL[i - 1];
                this.topoOrderArrayAM[i] = this.topoOrderArrayAM[i - 1];
            }

            let nextVertexLabel = this.nextIndex++;
            this.messageID.push(nextVertexLabel);
            this.cmd("CreateLabel", nextVertexLabel, startVertex, this.xPosLogical[startVertex], this.yPosLogical[startVertex]);
            this.cmd("SetLayer", nextVertexLabel, 1);
            this.topoOrderArrayL[0] = nextVertexLabel;

            nextVertexLabel = this.nextIndex++;
            this.messageID.push(nextVertexLabel);
            this.cmd("CreateLabel", nextVertexLabel, startVertex, this.adjListXStart - this.adjListWidth, this.adjListYStart + startVertex * this.adjListHeight);
            this.cmd("SetLayer", nextVertexLabel, 2);
            this.topoOrderArrayAL[0] = nextVertexLabel;

            nextVertexLabel = this.nextIndex++;
            this.messageID.push(nextVertexLabel);
            this.cmd("CreateLabel", nextVertexLabel, startVertex, this.adjMatrixXStart - this.adjMatrixWidth, this.adjMatrixYStart + startVertex * this.adjMatrixHeight);
            this.cmd("SetLayer", nextVertexLabel, 3);
            this.topoOrderArrayAM[0] = nextVertexLabel;

            for (let i = 0; i < this.topoOrderArrayL.length; i++) {
                this.cmd("Move", this.topoOrderArrayL[i], this.ORDERING_INITIAL_X,
                    this.ORDERING_INITIAL_Y + i * this.ORDERING_DELTA_Y);
                this.cmd("Move", this.topoOrderArrayAL[i], this.ORDERING_INITIAL_X,
                    this.ORDERING_INITIAL_Y + i * this.ORDERING_DELTA_Y);
                this.cmd("Move", this.topoOrderArrayAM[i], this.ORDERING_INITIAL_X,
                    this.ORDERING_INITIAL_Y + i * this.ORDERING_DELTA_Y);
            }
            this.cmd("Step");
        }
    }

    reset() {
        // TODO:  Fix undo messing with setup vars.
        this.messageID = [];
        this.nextIndex = this.initialIndex;
        for (let i = 0; i < this.size; i++) {
            this.adjListList[i] = this.oldAdjListList[i];
            this.adjListIndex[i] = this.oldAdjListIndex[i];

            for (let j = 0; j < this.size; j++) {
                this.adjMatrix[i][j] = this.oldAdjMatrix[i][j];
                if (this.adjMatrix[i][j] > 0) {
                    this.adjListEdges[i][j] = this.oldAdjListEdges[i][j];
                }
            }
        }
    }
};
