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


class GraphDijkstraPrim extends Graph {
    static TABLE_ENTRY_WIDTH = 50;
    static TABLE_ENTRY_HEIGHT = 25;
    static TABLE_START_X = 50;
    static TABLE_START_Y = 80;

    static MESSAGE_LABEL_1_X = 20;
    static MESSAGE_LABEL_1_Y = 10;

    static HIGHLIGHT_CIRCLE_COLOR = "#000000";

    constructor(am, runningDijkstra, dir) {
        super();
        this.init(am, runningDijkstra, dir);
    }

    addControls() {
        this.addLabelToAlgorithmBar("Start Vertex: ");
        this.startField = this.addControlToAlgorithmBar("Text", "", { maxlength: 2, size: 2 });
        this.addReturnSubmit(this.startField, "int", this.startCallback.bind(this));
        this.startButton = this.addControlToAlgorithmBar(
            "Button",
            this.runningDijkstra ? "Run Dijkstra" : "Run Prim"
        );
        this.startButton.onclick = this.startCallback.bind(this);
        super.addControls(this.runningDijkstra);
    }

    init(am, runningDijkstra, dir) {
        this.runningDijkstra = runningDijkstra;
        this.showEdgeCosts = true;
        super.init(am, dir); // TODO:  add no edge label flag to this?
    }

    setup() {
        super.setup();
        this.message1ID = this.nextIndex++;

        this.commands = new Array();
        this.cmd("CreateLabel", this.message1ID, "", GraphDijkstraPrim.MESSAGE_LABEL_1_X, GraphDijkstraPrim.MESSAGE_LABEL_1_Y, 0);

        this.vertexID = new Array(this.size);
        this.knownID = new Array(this.size);
        this.distanceID = new Array(this.size);
        this.pathID = new Array(this.size);
        this.known = new Array(this.size);
        this.distance = new Array(this.size);
        this.path = new Array(this.size);

        this.messageID = null;

        for (var i = 0; i < this.size; i++) {
            this.vertexID[i] = this.nextIndex++;
            this.knownID[i] = this.nextIndex++;
            this.distanceID[i] = this.nextIndex++;
            this.pathID[i] = this.nextIndex++;
            this.cmd("CreateRectangle", this.vertexID[i], i, GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_ENTRY_HEIGHT, GraphDijkstraPrim.TABLE_START_X, GraphDijkstraPrim.TABLE_START_Y + i * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
            this.cmd("CreateRectangle", this.knownID[i], "", GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_ENTRY_HEIGHT, GraphDijkstraPrim.TABLE_START_X + GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y + i * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
            this.cmd("CreateRectangle", this.distanceID[i], "", GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_ENTRY_HEIGHT, GraphDijkstraPrim.TABLE_START_X + 2 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y + i * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
            this.cmd("CreateRectangle", this.pathID[i], "", GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_ENTRY_HEIGHT, GraphDijkstraPrim.TABLE_START_X + 3 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y + i * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
            this.cmd("SetTextColor", this.vertexID[i], GraphDijkstraPrim.VERTEX_INDEX_COLOR);

        }
        this.cmd("CreateLabel", this.nextIndex++, "Vertex", GraphDijkstraPrim.TABLE_START_X, GraphDijkstraPrim.TABLE_START_Y - GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
        this.cmd("CreateLabel", this.nextIndex++, "Known", GraphDijkstraPrim.TABLE_START_X + GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y - GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
        this.cmd("CreateLabel", this.nextIndex++, "Cost", GraphDijkstraPrim.TABLE_START_X + 2 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y - GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
        this.cmd("CreateLabel", this.nextIndex++, "Path", GraphDijkstraPrim.TABLE_START_X + 3 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y - GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);

        this.animationManager.setAllLayers([0, this.currentLayer]);
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
        this.comparisonMessageID = this.nextIndex++;
    }

    findCheapestUnknown() {
        var bestIndex = -1;
        this.cmd("SetText", this.message1ID, "Finding Cheapest Uknown Vertex");

        for (var i = 0; i < this.size; i++) {
            if (!this.known[i]) {
                this.cmd("SetHighlight", this.distanceID[i], 1);
            }

            if (!this.known[i] && this.distance[i] != -1 && (bestIndex == -1 ||
                (this.distance[i] < this.distance[bestIndex]))) {
                bestIndex = i;
            }
        }
        if (bestIndex == -1) {
            var x = 3;
            x = x + 2;
        }
        this.cmd("Step");
        for (var i = 0; i < this.size; i++) {
            if (!this.known[i]) {
                this.cmd("SetHighlight", this.distanceID[i], 0);
            }

        }
        return bestIndex;
    }

    doDijkstraPrim(startVertex) {
        this.commands = new Array();

        if (!this.runningDijkstra) {
            this.recolorGraph();
        }

        var current = parseInt(startVertex);

        for (var i = 0; i < this.size; i++) {
            this.known[i] = false;
            this.distance[i] = -1;
            this.path[i] = -1;
            this.cmd("SetText", this.knownID[i], "F");
            this.cmd("SetText", this.distanceID[i], "INF");
            this.cmd("SetText", this.pathID[i], "-1");
            this.cmd("SetTextColor", this.knownID[i], "#000000");

        }
        if (this.messageID != null) {
            for (i = 0; i < this.messageID.length; i++) {
                this.cmd("Delete", this.messageID[i]);
            }
        }
        this.messageID = new Array();

        this.distance[current] = 0;
        this.cmd("SetText", this.distanceID[current], 0);

        for (i = 0; i < this.size; i++) {
            current = this.findCheapestUnknown();
            if (current < 0) {
                break;
            }
            this.cmd("SetText", this.message1ID, "Cheapest Unknown Vertex: " + current); // Gotta love Auto Conversion
            this.cmd("SetHighlight", this.distanceID[current], 1);

            this.cmd("SetHighlight", this.circleID[current], 1);
            this.cmd("Step");
            this.cmd("SetHighlight", this.distanceID[current], 0);
            this.cmd("SetText", this.message1ID, "Setting known field to True");
            this.cmd("SetHighlight", this.knownID[current], 1);
            this.known[current] = true;
            this.cmd("SetText", this.knownID[current], "T");
            this.cmd("SetTextColor", this.knownID[current], "#AAAAAA");
            this.cmd("Step");
            this.cmd("SetHighlight", this.knownID[current], 0);
            this.cmd("SetText", this.message1ID, "Updating neighbors of vertex " + current); // Gotta love Auto Conversion
            for (var neighbor = 0; neighbor < this.size; neighbor++) {
                if (this.adj_matrix[current][neighbor] >= 0) {
                    this.highlightEdge(current, neighbor, 1);
                    if (this.known[neighbor]) {

                        this.cmd("CreateLabel", this.comparisonMessageID, "Vertex " + String(neighbor) + " known",
                            GraphDijkstraPrim.TABLE_START_X + 5 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y + neighbor * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
                        this.cmd("SetHighlight", this.knownID[neighbor], 1);
                    }
                    else {
                        this.cmd("SetHighlight", this.distanceID[current], 1);
                        this.cmd("SetHighlight", this.distanceID[neighbor], 1);
                        var distString = String(this.distance[neighbor]);
                        if (this.distance[neighbor] < 0) {
                            distString = "INF";
                        }
                        if (this.runningDijkstra) {
                            if (this.distance[neighbor] < 0 || this.distance[neighbor] > this.distance[current] + this.adj_matrix[current][neighbor]) {
                                this.cmd("CreateLabel", this.comparisonMessageID, distString + " > " + String(this.distance[current]) + " + " + String(this.adj_matrix[current][neighbor]),
                                    GraphDijkstraPrim.TABLE_START_X + 4.3 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y + neighbor * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
                            }
                            else {
                                this.cmd("CreateLabel", this.comparisonMessageID, "!(" + String(this.distance[neighbor]) + " > " + String(this.distance[current]) + " + " + String(this.adj_matrix[current][neighbor]) + ")",
                                    GraphDijkstraPrim.TABLE_START_X + 4.3 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y + neighbor * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
                            }
                        }
                        else {
                            if (this.distance[neighbor] < 0 || this.distance[neighbor] > this.adj_matrix[current][neighbor]) {
                                this.cmd("CreateLabel", this.comparisonMessageID, distString + " > " + String(this.adj_matrix[current][neighbor]),
                                    GraphDijkstraPrim.TABLE_START_X + 4.3 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y + neighbor * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
                            }
                            else {
                                this.cmd("CreateLabel", this.comparisonMessageID, "!(" + String(this.distance[neighbor]) + " > " + String(this.adj_matrix[current][neighbor]) + ")",
                                    GraphDijkstraPrim.TABLE_START_X + 4.3 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y + neighbor * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
                            }
                        }
                    }
                    this.cmd("Step");
                    this.cmd("Delete", this.comparisonMessageID);
                    this.highlightEdge(current, neighbor, 0);
                    if (this.known[neighbor]) {
                        this.cmd("SetHighlight", this.knownID[neighbor], 0);
                    }
                    else {
                        this.cmd("SetHighlight", this.distanceID[current], 0);
                        this.cmd("SetHighlight", this.distanceID[neighbor], 0);
                        var compare;
                        if (this.runningDijkstra) {
                            compare = this.distance[current] + this.adj_matrix[current][neighbor];
                        }
                        else {
                            compare = this.adj_matrix[current][neighbor];
                        }
                        if (this.distance[neighbor] < 0 || this.distance[neighbor] > compare) {
                            this.distance[neighbor] = compare;
                            this.path[neighbor] = current;
                            this.cmd("SetText", this.distanceID[neighbor], this.distance[neighbor]);
                            this.cmd("SetText", this.pathID[neighbor], this.path[neighbor]);
                        }
                    }
                }
            }
            this.cmd("SetHighlight", this.circleID[current], 0);
        }
        // Running Dijkstra's algorithm, create the paths
        if (this.runningDijkstra) {
            this.cmd("SetText", this.message1ID, "Finding Paths in Table");
            this.createPaths();
        }
        // Running Prim's algorithm, highlight the tree
        else {
            this.cmd("SetText", this.message1ID, "Creating tree from table");
            this.highlightTree();
        }
        this.cmd("SetText", this.message1ID, "");
        return this.commands;
    }

    createPaths() {
        for (var vertex = 0; vertex < this.size; vertex++) {
            var nextLabelID = this.nextIndex++;
            if (this.distance[vertex] < 0) {
                this.cmd("CreateLabel", nextLabelID, "No Path", GraphDijkstraPrim.TABLE_START_X + 4.3 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y + vertex * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
                this.messageID.push(nextLabelID);
            }
            else {
                this.cmd("CreateLabel", nextLabelID, vertex, GraphDijkstraPrim.TABLE_START_X + 4.3 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y + vertex * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
                this.messageID.push(nextLabelID);
                var pathList = [nextLabelID];
                var nextInPath = vertex;
                while (nextInPath >= 0) {
                    this.cmd("SetHighlight", this.pathID[nextInPath], 1);
                    this.cmd("Step");
                    if (this.path[nextInPath] != -1) {
                        nextLabelID = this.nextIndex++;
                        this.cmd("CreateLabel", nextLabelID, this.path[nextInPath], GraphDijkstraPrim.TABLE_START_X + 3 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y + nextInPath * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
                        this.cmd("Move", nextLabelID, GraphDijkstraPrim.TABLE_START_X + 4.3 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH, GraphDijkstraPrim.TABLE_START_Y + vertex * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
                        this.messageID.push(nextLabelID);
                        for (var i = pathList.length - 1; i >= 0; i--) {
                            this.cmd("Move", pathList[i], GraphDijkstraPrim.TABLE_START_X + 4.3 * GraphDijkstraPrim.TABLE_ENTRY_WIDTH + (pathList.length - i) * 17, GraphDijkstraPrim.TABLE_START_Y + vertex * GraphDijkstraPrim.TABLE_ENTRY_HEIGHT);
                        }
                        this.cmd("Step");
                        pathList.push(nextLabelID);
                    }
                    this.cmd("SetHighlight", this.pathID[nextInPath], 0);
                    nextInPath = this.path[nextInPath];
                }
            }
        }
    }

    highlightTree() {
        for (var vertex = 0; vertex < this.size; vertex++) {
            if (this.path[vertex] >= 0) {
                this.cmd("SetHighlight", this.vertexID[vertex], 1);
                this.cmd("SetHighlight", this.pathID[vertex], 1);
                this.highlightEdge(vertex, this.path[vertex], 1);
                this.highlightEdge(this.path[vertex], vertex, 1);
                this.cmd("Step");
                this.cmd("SetHighlight", this.vertexID[vertex], 0);
                this.cmd("SetHighlight", this.pathID[vertex], 0);
                this.highlightEdge(vertex, this.path[vertex], 0);
                this.highlightEdge(this.path[vertex], vertex, 0);
                this.setEdgeColor(vertex, this.path[vertex], "#FF0000");
                this.setEdgeColor(this.path[vertex], vertex, "#FF0000");
            }
        }
    }

    reset() {
        this.messageID = new Array();
    }

    startCallback(event) {
        var startValue = this.normalizeNumber(this.startField.value);
        if (startValue !== "" && startValue < this.size) {
            this.startField.value = "";
            this.implementAction(this.doDijkstraPrim.bind(this), startValue);
        }
    }
}


class GraphDijkstra extends GraphDijkstraPrim {
    constructor(am) {
        super(am, true, true);
    }
}

class GraphPrim extends GraphDijkstraPrim {
    constructor(am) {
        super(am, false, false);
    }
}

