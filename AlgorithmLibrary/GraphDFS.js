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
/* globals Graph */
/* exported GraphDFS */
///////////////////////////////////////////////////////////////////////////////


class GraphDFS extends Graph {
    AUX_ARRAY_WIDTH = 25;
    AUX_ARRAY_HEIGHT = 25;
    AUX_ARRAY_START_Y = 50;

    VISITED_START_X = 475;
    PARENT_START_X = 400;

    HIGHLIGHT_CIRCLE_COLOR = "#000000";
    DFS_TREE_COLOR = "#0000FF";

    constructor(am, dir) {
        super();
        this.init(am, dir);
    }

    addControls() {
        this.addLabelToAlgorithmBar("Start Vertex: ");
        this.startField = this.addControlToAlgorithmBar("Text", "", {maxlength: 2, size: 2});
        this.addReturnSubmit(this.startField, "int", this.startCallback.bind(this));
        this.startButton = this.addButtonToAlgorithmBar("Run DFS");
        this.startButton.onclick = this.startCallback.bind(this);
        super.addControls();
    }

    init(am, dir) {
        this.showEdgeCosts = false;
        super.init(am, dir); // TODO:  add no edge label flag to this?
    }

    setup() {
        super.setup();
        this.messageID = [];
        this.commands = [];
        this.visitedID = new Array(this.size);
        this.visitedIndexID = new Array(this.size);
        this.parentID = new Array(this.size);
        this.parentIndexID = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            this.visitedID[i] = this.nextIndex++;
            this.visitedIndexID[i] = this.nextIndex++;
            this.parentID[i] = this.nextIndex++;
            this.parentIndexID[i] = this.nextIndex++;
            this.cmd("CreateRectangle", this.visitedID[i], "f", this.AUX_ARRAY_WIDTH, this.AUX_ARRAY_HEIGHT, this.VISITED_START_X, this.AUX_ARRAY_START_Y + i * this.AUX_ARRAY_HEIGHT);
            this.cmd("CreateLabel", this.visitedIndexID[i], i, this.VISITED_START_X - this.AUX_ARRAY_WIDTH, this.AUX_ARRAY_START_Y + i * this.AUX_ARRAY_HEIGHT);
            this.cmd("SetForegroundColor", this.visitedIndexID[i], this.VERTEX_INDEX_COLOR);
            this.cmd("CreateRectangle", this.parentID[i], "", this.AUX_ARRAY_WIDTH, this.AUX_ARRAY_HEIGHT, this.PARENT_START_X, this.AUX_ARRAY_START_Y + i * this.AUX_ARRAY_HEIGHT);
            this.cmd("CreateLabel", this.parentIndexID[i], i, this.PARENT_START_X - this.AUX_ARRAY_WIDTH, this.AUX_ARRAY_START_Y + i * this.AUX_ARRAY_HEIGHT);
            this.cmd("SetForegroundColor", this.parentIndexID[i], this.VERTEX_INDEX_COLOR);
        }
        this.cmd("CreateLabel", this.nextIndex++, "Parent", this.PARENT_START_X - this.AUX_ARRAY_WIDTH, this.AUX_ARRAY_START_Y - this.AUX_ARRAY_HEIGHT * 1.5, 0);
        this.cmd("CreateLabel", this.nextIndex++, "Visited", this.VISITED_START_X - this.AUX_ARRAY_WIDTH, this.AUX_ARRAY_START_Y - this.AUX_ARRAY_HEIGHT * 1.5, 0);
        this.animationManager.setAllLayers([0, this.currentLayer]);
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
        this.highlightCircleL = this.nextIndex++;
        this.highlightCircleAL = this.nextIndex++;
        this.highlightCircleAM = this.nextIndex++;
    }

    startCallback(event) {
        const startValue = this.normalizeNumber(this.startField.value);
        if (startValue !== "" && startValue < this.size) {
            this.startField.value = "";
            this.implementAction(this.doDFS.bind(this), startValue);
        }
    }

    doDFS(startVetex) {
        this.visited = new Array(this.size);
        this.commands = [];
        if (this.messageID != null) {
            for (let i = 0; i < this.messageID.length; i++) {
                this.cmd("Delete", this.messageID[i]);
            }
        }
        this.rebuildEdges();
        this.messageID = [];
        for (let i = 0; i < this.size; i++) {
            this.cmd("SetText", this.visitedID[i], "f");
            this.cmd("SetText", this.parentID[i], "");
            this.visited[i] = false;
        }
        const vertex = parseInt(startVetex);
        this.cmd("CreateHighlightCircle", this.highlightCircleL, this.HIGHLIGHT_CIRCLE_COLOR, this.xPosLogical[vertex], this.yPosLogical[vertex]);
        this.cmd("SetLayer", this.highlightCircleL, 1);
        this.cmd("CreateHighlightCircle", this.highlightCircleAL, this.HIGHLIGHT_CIRCLE_COLOR, this.adjListXStart - this.adjListWidth, this.adjListYStart + vertex * this.adjListHeight);
        this.cmd("SetLayer", this.highlightCircleAL, 2);

        this.cmd("CreateHighlightCircle", this.highlightCircleAM, this.HIGHLIGHT_CIRCLE_COLOR, this.adjMatrixXStart - this.adjMatrixWidth, this.adjMatrixYStart + vertex * this.adjMatrixHeight);
        this.cmd("SetLayer", this.highlightCircleAM, 3);

        this.messageY = 30;
        this.dfsVisit(vertex, 10);
        this.cmd("Delete", this.highlightCircleL);
        this.cmd("Delete", this.highlightCircleAL);
        this.cmd("Delete", this.highlightCircleAM);
        return this.commands;
    }

    dfsVisit(startVertex, messageX) {
        let nextMessage = this.nextIndex++;
        this.messageID.push(nextMessage);

        this.cmd("CreateLabel", nextMessage, `DFS(${String(startVertex)})`, messageX, this.messageY, 0);
        this.messageY = this.messageY + 20;
        if (!this.visited[startVertex]) {
            this.visited[startVertex] = true;
            this.cmd("SetText", this.visitedID[startVertex], "T");
            this.cmd("Step");
            for (let neighbor = 0; neighbor < this.size; neighbor++) {
                if (this.adjMatrix[startVertex][neighbor] > 0) {
                    this.highlightEdge(startVertex, neighbor, 1);
                    this.cmd("SetHighlight", this.visitedID[neighbor], 1);
                    if (this.visited[neighbor]) {
                        nextMessage = this.nextIndex;
                        this.cmd("CreateLabel", nextMessage, `Vertex ${String(neighbor)} already visited.`, messageX, this.messageY, 0);
                    }
                    this.cmd("Step");
                    this.highlightEdge(startVertex, neighbor, 0);
                    this.cmd("SetHighlight", this.visitedID[neighbor], 0);
                    if (this.visited[neighbor]) {
                        this.cmd("Delete", nextMessage);
                    }

                    if (!this.visited[neighbor]) {
                        this.cmd("Disconnect", this.circleID[startVertex], this.circleID[neighbor]);
                        this.cmd("Connect", this.circleID[startVertex], this.circleID[neighbor], this.DFS_TREE_COLOR, this.curve[startVertex][neighbor], 1, "");
                        this.cmd("Move", this.highlightCircleL, this.xPosLogical[neighbor], this.yPosLogical[neighbor]);
                        this.cmd("Move", this.highlightCircleAL, this.adjListXStart - this.adjListWidth, this.adjListYStart + neighbor * this.adjListHeight);
                        this.cmd("Move", this.highlightCircleAM, this.adjMatrixXStart - this.adjMatrixWidth, this.adjMatrixYStart + neighbor * this.adjMatrixHeight);

                        this.cmd("SetText", this.parentID[neighbor], startVertex);
                        this.cmd("Step");
                        this.dfsVisit(neighbor, messageX + 20);
                        nextMessage = this.nextIndex;
                        this.cmd("CreateLabel", nextMessage, `Returning from recursive call: DFS(${String(neighbor)})`, messageX + 20, this.messageY, 0);

                        this.cmd("Move", this.highlightCircleAL, this.adjListXStart - this.adjListWidth, this.adjListYStart + startVertex * this.adjListHeight);
                        this.cmd("Move", this.highlightCircleL, this.xPosLogical[startVertex], this.yPosLogical[startVertex]);
                        this.cmd("Move", this.highlightCircleAM, this.adjMatrixXStart - this.adjMatrixWidth, this.adjMatrixYStart + startVertex * this.adjMatrixHeight);
                        this.cmd("Step");
                        this.cmd("Delete", nextMessage);
                    }
                    this.cmd("Step");
                }
            }
        }
    }

    reset() {
        this.messageID = [];
    }
}
