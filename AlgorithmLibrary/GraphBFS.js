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


class GraphBFS extends Graph {
    static AUX_ARRAY_WIDTH = 25;
    static AUX_ARRAY_HEIGHT = 25;
    static AUX_ARRAY_START_Y = 50;

    static VISITED_START_X = 475;
    static PARENT_START_X = 400;

    static HIGHLIGHT_CIRCLE_COLOR = "#000000";
    static BFS_TREE_COLOR = "#0000FF";
    static BFS_QUEUE_HEAD_COLOR = "#0000FF";

    static QUEUE_START_X = 30;
    static QUEUE_START_Y = 50;
    static QUEUE_SPACING = 30;

    constructor(am, dir) {
        super(am);
        this.init(am, dir);
    }

    addControls() {
        this.addLabelToAlgorithmBar("Start Vertex: ");
        this.startField = this.addControlToAlgorithmBar("Text", "", { maxlength: 2, size: 2 });
        this.addReturnSubmit(this.startField, "int", this.startCallback.bind(this));
        this.startButton = this.addControlToAlgorithmBar("Button", "Run BFS");
        this.startButton.onclick = this.startCallback.bind(this);
        super.addControls();
    }

    init(am, dir) {
        this.showEdgeCosts = false;
        super.init(am, dir); // TODO:  add no edge label flag to this?
    }

    setup() {
        super.setup();
        this.messageID = new Array();
        this.commands = new Array();
        this.visitedID = new Array(this.size);
        this.visitedIndexID = new Array(this.size);
        this.parentID = new Array(this.size);
        this.parentIndexID = new Array(this.size);

        for (var i = 0; i < this.size; i++) {
            this.visitedID[i] = this.nextIndex++;
            this.visitedIndexID[i] = this.nextIndex++;
            this.parentID[i] = this.nextIndex++;
            this.parentIndexID[i] = this.nextIndex++;
            this.cmd("CreateRectangle", this.visitedID[i], "f", GraphBFS.AUX_ARRAY_WIDTH, GraphBFS.AUX_ARRAY_HEIGHT, GraphBFS.VISITED_START_X, GraphBFS.AUX_ARRAY_START_Y + i * GraphBFS.AUX_ARRAY_HEIGHT);
            this.cmd("CreateLabel", this.visitedIndexID[i], i, GraphBFS.VISITED_START_X - GraphBFS.AUX_ARRAY_WIDTH, GraphBFS.AUX_ARRAY_START_Y + i * GraphBFS.AUX_ARRAY_HEIGHT);
            this.cmd("SetForegroundColor", this.visitedIndexID[i], GraphBFS.VERTEX_INDEX_COLOR);
            this.cmd("CreateRectangle", this.parentID[i], "", GraphBFS.AUX_ARRAY_WIDTH, GraphBFS.AUX_ARRAY_HEIGHT, GraphBFS.PARENT_START_X, GraphBFS.AUX_ARRAY_START_Y + i * GraphBFS.AUX_ARRAY_HEIGHT);
            this.cmd("CreateLabel", this.parentIndexID[i], i, GraphBFS.PARENT_START_X - GraphBFS.AUX_ARRAY_WIDTH, GraphBFS.AUX_ARRAY_START_Y + i * GraphBFS.AUX_ARRAY_HEIGHT);
            this.cmd("SetForegroundColor", this.parentIndexID[i], GraphBFS.VERTEX_INDEX_COLOR);
        }
        this.cmd("CreateLabel", this.nextIndex++, "Parent", GraphBFS.PARENT_START_X - GraphBFS.AUX_ARRAY_WIDTH, GraphBFS.AUX_ARRAY_START_Y - GraphBFS.AUX_ARRAY_HEIGHT * 1.5, 0);
        this.cmd("CreateLabel", this.nextIndex++, "Visited", GraphBFS.VISITED_START_X - GraphBFS.AUX_ARRAY_WIDTH, GraphBFS.AUX_ARRAY_START_Y - GraphBFS.AUX_ARRAY_HEIGHT * 1.5, 0);
        this.cmd("CreateLabel", this.nextIndex++, "BFS Queue", GraphBFS.QUEUE_START_X, GraphBFS.QUEUE_START_Y - 30, 0);
        this.animationManager.setAllLayers([0, this.currentLayer]);
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
        this.highlightCircleL = this.nextIndex++;
        this.highlightCircleAL = this.nextIndex++;
        this.highlightCircleAM = this.nextIndex++;
    }

    startCallback(event) {
        var startValue = this.normalizeNumber(this.startField.value);
        if (startValue !== "" && startValue < this.size) {
            this.startField.value = "";
            this.implementAction(this.doBFS.bind(this), startValue);
        }
    }

    doBFS(startVetex) {
        this.visited = new Array(this.size);
        this.commands = new Array();
        this.queue = new Array(this.size);
        var head = 0;
        var tail = 0;
        var queueID = new Array(this.size);
        var queueSize = 0;

        if (this.messageID != null) {
            for (var i = 0; i < this.messageID.length; i++) {
                this.cmd("Delete", this.messageID[i]);
            }
        }

        this.rebuildEdges();
        this.messageID = new Array();
        for (i = 0; i < this.size; i++) {
            this.cmd("SetText", this.visitedID[i], "f");
            this.cmd("SetText", this.parentID[i], "");
            this.visited[i] = false;
            queueID[i] = this.nextIndex++;
        }
        var vertex = parseInt(startVetex);
        this.visited[vertex] = true;
        this.queue[tail] = vertex;
        this.cmd("CreateLabel", queueID[tail], vertex, GraphBFS.QUEUE_START_X + queueSize * GraphBFS.QUEUE_SPACING, GraphBFS.QUEUE_START_Y);
        queueSize = queueSize + 1;
        tail = (tail + 1) % (this.size);

        while (queueSize > 0) {
            vertex = this.queue[head];
            this.cmd("CreateHighlightCircle", this.highlightCircleL, GraphBFS.HIGHLIGHT_CIRCLE_COLOR, this.x_pos_logical[vertex], this.y_pos_logical[vertex]);
            this.cmd("SetLayer", this.highlightCircleL, 1);
            this.cmd("CreateHighlightCircle", this.highlightCircleAL, GraphBFS.HIGHLIGHT_CIRCLE_COLOR, this.adj_list_x_start - this.adj_list_width, this.adj_list_y_start + vertex * this.adj_list_height);
            this.cmd("SetLayer", this.highlightCircleAL, 2);
            this.cmd("CreateHighlightCircle", this.highlightCircleAM, GraphBFS.HIGHLIGHT_CIRCLE_COLOR, this.adj_matrix_x_start - this.adj_matrix_width, this.adj_matrix_y_start + vertex * this.adj_matrix_height);
            this.cmd("SetLayer", this.highlightCircleAM, 3);
            this.cmd("SetTextColor", queueID[head], GraphBFS.BFS_QUEUE_HEAD_COLOR);

            for (var neighbor = 0; neighbor < this.size; neighbor++) {
                if (this.adj_matrix[vertex][neighbor] > 0) {
                    this.highlightEdge(vertex, neighbor, 1);
                    this.cmd("SetHighlight", this.visitedID[neighbor], 1);
                    this.cmd("Step");
                    if (!this.visited[neighbor]) {
                        this.visited[neighbor] = true;
                        this.cmd("SetText", this.visitedID[neighbor], "T");
                        this.cmd("SetText", this.parentID[neighbor], vertex);
                        this.highlightEdge(vertex, neighbor, 0);
                        this.cmd("Disconnect", this.circleID[vertex], this.circleID[neighbor]);
                        this.cmd("Connect", this.circleID[vertex], this.circleID[neighbor], GraphBFS.BFS_TREE_COLOR, this.curve[vertex][neighbor], 1, "");
                        this.queue[tail] = neighbor;
                        this.cmd("CreateLabel", queueID[tail], neighbor, GraphBFS.QUEUE_START_X + queueSize * GraphBFS.QUEUE_SPACING, GraphBFS.QUEUE_START_Y);
                        tail = (tail + 1) % (this.size);
                        queueSize = queueSize + 1;
                    }
                    else {
                        this.highlightEdge(vertex, neighbor, 0);
                    }
                    this.cmd("SetHighlight", this.visitedID[neighbor], 0);
                    this.cmd("Step");
                }
            }
            this.cmd("Delete", queueID[head]);
            head = (head + 1) % (this.size);
            queueSize = queueSize - 1;
            for (i = 0; i < queueSize; i++) {
                var nextQueueIndex = (i + head) % this.size;
                this.cmd("Move", queueID[nextQueueIndex], GraphBFS.QUEUE_START_X + i * GraphBFS.QUEUE_SPACING, GraphBFS.QUEUE_START_Y);
            }

            this.cmd("Delete", this.highlightCircleL);
            this.cmd("Delete", this.highlightCircleAM);
            this.cmd("Delete", this.highlightCircleAL);
        }

        return this.commands;
    }

    reset() {
        this.messageID = new Array();
    }
}
