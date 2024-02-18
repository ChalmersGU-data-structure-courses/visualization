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


class GraphToposortIndegree extends Graph {

    static INDEGREE_ARRAY_ELEM_WIDTH = 25;
    static INDEGREE_ARRAY_ELEM_HEIGHT = 25;
    static INDEGREE_ARRAY_START_X = 50;
    static INDEGREE_ARRAY_START_Y = 60;


    static STACK_START_X = GraphToposortIndegree.INDEGREE_ARRAY_START_X + 100;
    static STACK_START_Y = GraphToposortIndegree.INDEGREE_ARRAY_START_Y;
    static STACK_HEIGHT = GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT;


    static TOPO_ARRAY_START_X = GraphToposortIndegree.STACK_START_X + 150;
    static TOPO_ARRAY_START_Y = GraphToposortIndegree.INDEGREE_ARRAY_START_Y;
    static TOPO_HEIGHT = GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT;


    static MESSAGE_LABEL_1_X = 70;
    static MESSAGE_LABEL_1_Y = 10;

    static MESSAGE_LABEL_2_X = 70;
    static MESSAGE_LABEL_2_Y = 40;

    static HIGHLIGHT_CIRCLE_COLOR = "#000000";
    static MESSAGE_COLOR = "#0000FF";


    constructor(am) {
        super(am)
        this.init(am);
    }

    addControls() {
        this.startButton = this.addControlToAlgorithmBar("Button", "Do Topological Sort");
        this.startButton.onclick = this.startCallback.bind(this);
        super.addControls(false);
    }

    init(am) {
        this.showEdgeCosts = false;
        super.init(am, true, true); // TODO:  add no edge label flag to this?
    }

    setup() {
        super.setup();
        this.messageID = new Array();
        this.animationManager.setAllLayers([0, this.currentLayer]);

        this.messageID = new Array();
        this.commands = new Array();
        this.indegreeID = new Array(this.size);
        this.setIndexID = new Array(this.size);
        this.indegree = new Array(this.size);
        this.orderID = new Array(this.size);

        for (var i = 0; i < this.size; i++) {
            this.indegreeID[i] = this.nextIndex++;
            this.setIndexID[i] = this.nextIndex++;
            this.orderID[i] = this.nextIndex++;
            this.cmd("CreateLabel", this.orderID[i], "", 0, 0); // HACK!!
            this.cmd("CreateRectangle", this.indegreeID[i], " ", GraphToposortIndegree.INDEGREE_ARRAY_ELEM_WIDTH, GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT, GraphToposortIndegree.INDEGREE_ARRAY_START_X, GraphToposortIndegree.INDEGREE_ARRAY_START_Y + i * GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT);
            this.cmd("CreateLabel", this.setIndexID[i], i, GraphToposortIndegree.INDEGREE_ARRAY_START_X - GraphToposortIndegree.INDEGREE_ARRAY_ELEM_WIDTH, GraphToposortIndegree.INDEGREE_ARRAY_START_Y + i * GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT);
            this.cmd("SetForegroundColor", this.setIndexID[i], Graph.VERTEX_INDEX_COLOR);
        }
        this.cmd("CreateLabel", this.nextIndex++, "Indegree", GraphToposortIndegree.INDEGREE_ARRAY_START_X - 1 * GraphToposortIndegree.INDEGREE_ARRAY_ELEM_WIDTH, GraphToposortIndegree.INDEGREE_ARRAY_START_Y - GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT * 1.5, 0);

        this.message1ID = this.nextIndex++;
        this.message2ID = this.nextIndex++;
        this.cmd("CreateLabel", this.message1ID, "", GraphToposortIndegree.MESSAGE_LABEL_1_X, GraphToposortIndegree.MESSAGE_LABEL_1_Y, 0);
        this.cmd("SetTextColor", this.message1ID, GraphToposortIndegree.MESSAGE_COLOR);
        this.cmd("CreateLabel", this.message2ID, "", GraphToposortIndegree.MESSAGE_LABEL_2_X, GraphToposortIndegree.MESSAGE_LABEL_2_Y);
        this.cmd("SetTextColor", this.message2ID, GraphToposortIndegree.MESSAGE_COLOR);

        this.stackLabelID = this.nextIndex++;
        this.topoLabelID = this.nextIndex++;
        this.cmd("CreateLabel", this.stackLabelID, "", GraphToposortIndegree.STACK_START_X, GraphToposortIndegree.STACK_START_Y - GraphToposortIndegree.STACK_HEIGHT);
        this.cmd("CreateLabel", this.topoLabelID, "", GraphToposortIndegree.TOPO_ARRAY_START_X, GraphToposortIndegree.TOPO_ARRAY_START_Y - GraphToposortIndegree.TOPO_HEIGHT);

        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();

        this.highlightCircleL = this.nextIndex++;
        this.highlightCircleAL = this.nextIndex++;
        this.highlightCircleAM = this.nextIndex++;

        this.initialIndex = this.nextIndex;
    }

    startCallback(event) {
        this.implementAction(this.doTopoSort.bind(this), "");
    }

    doTopoSort(ignored) {
        this.commands = new Array();
        var stack = new Array(this.size);
        var stackID = new Array(this.size);
        var stackTop = 0;

        var vertex;
        for (var vertex = 0; vertex < this.size; vertex++) {
            this.cmd("SetText", this.indegreeID[vertex], "0");
            this.indegree[vertex] = 0;
            stackID[vertex] = this.nextIndex++;
            this.cmd("Delete", this.orderID[vertex]);
        }

        this.cmd("SetText", this.message1ID, "Calculate this.indegree of all verticies by going through every edge of the graph");
        this.cmd("SetText", this.topoLabelID, "");
        this.cmd("SetText", this.stackLabelID, "");
        for (vertex = 0; vertex < this.size; vertex++) {
            var adjListIndex = 0;
            var neighbor;
            for (neighbor = 0; neighbor < this.size; neighbor++)
                if (this.adj_matrix[vertex][neighbor] >= 0) {
                    adjListIndex++;
                    this.highlightEdge(vertex, neighbor, 1);
                    this.cmd("Step");

                    this.cmd("CreateHighlightCircle", this.highlightCircleL, GraphToposortIndegree.HIGHLIGHT_CIRCLE_COLOR, this.x_pos_logical[neighbor], this.y_pos_logical[neighbor]);
                    this.cmd("SetLayer", this.highlightCircleL, 1);
                    this.cmd("CreateHighlightCircle", this.highlightCircleAL, GraphToposortIndegree.HIGHLIGHT_CIRCLE_COLOR, this.adj_list_x_start + adjListIndex * (this.adj_list_width + this.adj_list_spacing), this.adj_list_y_start + vertex * this.adj_list_height);
                    this.cmd("SetLayer", this.highlightCircleAL, 2);
                    this.cmd("CreateHighlightCircle", this.highlightCircleAM, GraphToposortIndegree.HIGHLIGHT_CIRCLE_COLOR, this.adj_matrix_x_start + neighbor * this.adj_matrix_width, this.adj_matrix_y_start - this.adj_matrix_height);
                    this.cmd("SetLayer", this.highlightCircleAM, 3);

                    this.cmd("Move", this.highlightCircleL, GraphToposortIndegree.INDEGREE_ARRAY_START_X - GraphToposortIndegree.INDEGREE_ARRAY_ELEM_WIDTH, GraphToposortIndegree.INDEGREE_ARRAY_START_Y + neighbor * GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT);

                    this.cmd("Move", this.highlightCircleAL, GraphToposortIndegree.INDEGREE_ARRAY_START_X - GraphToposortIndegree.INDEGREE_ARRAY_ELEM_WIDTH, GraphToposortIndegree.INDEGREE_ARRAY_START_Y + neighbor * GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT);
                    this.cmd("Move", this.highlightCircleAM, GraphToposortIndegree.INDEGREE_ARRAY_START_X - GraphToposortIndegree.INDEGREE_ARRAY_ELEM_WIDTH, GraphToposortIndegree.INDEGREE_ARRAY_START_Y + neighbor * GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT);

                    this.cmd("Step");
                    this.indegree[neighbor] = this.indegree[neighbor] + 1;
                    this.cmd("SetText", this.indegreeID[neighbor], this.indegree[neighbor]);
                    this.cmd("SetTextColor", this.indegreeID[neighbor], "#FF0000");
                    this.cmd("Step");
                    this.cmd("Delete", this.highlightCircleL);
                    this.cmd("Delete", this.highlightCircleAL);
                    this.cmd("Delete", this.highlightCircleAM);
                    this.cmd("SetTextColor", this.indegreeID[neighbor], Graph.EDGE_COLOR);
                    this.highlightEdge(vertex, neighbor, 0);
                }
        }
        this.cmd("SetText", this.message1ID, "Collect all vertices with 0 this.indegree onto a stack");
        this.cmd("SetText", this.stackLabelID, "Zero Indegree Vertices");

        for (vertex = 0; vertex < this.size; vertex++) {
            this.cmd("SetHighlight", this.indegreeID[vertex], 1);
            this.cmd("Step");
            if (this.indegree[vertex] == 0) {
                stack[stackTop] = vertex;
                this.cmd("CreateLabel", stackID[stackTop], vertex, GraphToposortIndegree.INDEGREE_ARRAY_START_X - GraphToposortIndegree.INDEGREE_ARRAY_ELEM_WIDTH, GraphToposortIndegree.INDEGREE_ARRAY_START_Y + vertex * GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT);
                this.cmd("Move", stackID[stackTop], GraphToposortIndegree.STACK_START_X, GraphToposortIndegree.STACK_START_Y + stackTop * GraphToposortIndegree.STACK_HEIGHT);
                this.cmd("Step");
                stackTop++;
            }
            this.cmd("SetHighlight", this.indegreeID[vertex], 0);

        }
        this.cmd("SetText", this.topoLabelID, "Topological Order");

        var nextInOrder = 0;
        while (stackTop > 0) {
            stackTop--;
            var nextElem = stack[stackTop];
            this.cmd("SetText", this.message1ID, "Pop off top vertex with this.indegree 0, add to topological sort");
            this.cmd("CreateLabel", this.orderID[nextInOrder], nextElem, GraphToposortIndegree.STACK_START_X, GraphToposortIndegree.STACK_START_Y + stackTop * GraphToposortIndegree.STACK_HEIGHT);
            this.cmd("Delete", stackID[stackTop]);
            this.cmd("Step");
            this.cmd("Move", this.orderID[nextInOrder], GraphToposortIndegree.TOPO_ARRAY_START_X, GraphToposortIndegree.TOPO_ARRAY_START_Y + nextInOrder * GraphToposortIndegree.TOPO_HEIGHT);
            this.cmd("Step");
            this.cmd("SetText", this.message1ID, "Find all neigbors of vertex " + String(nextElem) + ", decrease their this.indegree.  If this.indegree becomes 0, add to stack");
            this.cmd("SetHighlight", this.circleID[nextElem], 1);
            this.cmd("Step");

            adjListIndex = 0;

            for (vertex = 0; vertex < this.size; vertex++) {
                if (this.adj_matrix[nextElem][vertex] >= 0) {
                    adjListIndex++;
                    this.highlightEdge(nextElem, vertex, 1);
                    this.cmd("Step");

                    this.cmd("CreateHighlightCircle", this.highlightCircleL, GraphToposortIndegree.HIGHLIGHT_CIRCLE_COLOR, this.x_pos_logical[vertex], this.y_pos_logical[vertex]);
                    this.cmd("SetLayer", this.highlightCircleL, 1);
                    this.cmd("CreateHighlightCircle", this.highlightCircleAL, GraphToposortIndegree.HIGHLIGHT_CIRCLE_COLOR, this.adj_list_x_start + adjListIndex * (this.adj_list_width + this.adj_list_spacing), this.adj_list_y_start + nextElem * this.adj_list_height);
                    this.cmd("SetLayer", this.highlightCircleAL, 2);
                    this.cmd("CreateHighlightCircle", this.highlightCircleAM, GraphToposortIndegree.HIGHLIGHT_CIRCLE_COLOR, this.adj_matrix_x_start + vertex * this.adj_matrix_width, this.adj_matrix_y_start - this.adj_matrix_height);
                    this.cmd("SetLayer", this.highlightCircleAM, 3);

                    this.cmd("Move", this.highlightCircleL, GraphToposortIndegree.INDEGREE_ARRAY_START_X - GraphToposortIndegree.INDEGREE_ARRAY_ELEM_WIDTH, GraphToposortIndegree.INDEGREE_ARRAY_START_Y + vertex * GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT);

                    this.cmd("Move", this.highlightCircleAL, GraphToposortIndegree.INDEGREE_ARRAY_START_X - GraphToposortIndegree.INDEGREE_ARRAY_ELEM_WIDTH, GraphToposortIndegree.INDEGREE_ARRAY_START_Y + vertex * GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT);
                    this.cmd("Move", this.highlightCircleAM, GraphToposortIndegree.INDEGREE_ARRAY_START_X - GraphToposortIndegree.INDEGREE_ARRAY_ELEM_WIDTH, GraphToposortIndegree.INDEGREE_ARRAY_START_Y + vertex * GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT);

                    this.cmd("Step");
                    this.indegree[vertex] = this.indegree[vertex] - 1;
                    this.cmd("SetText", this.indegreeID[vertex], this.indegree[vertex]);
                    this.cmd("SetTextColor", this.indegreeID[vertex], "#FF0000");
                    this.cmd("Step");
                    if (this.indegree[vertex] == 0) {
                        stack[stackTop] = vertex;
                        this.cmd("CreateLabel", stackID[stackTop], vertex, GraphToposortIndegree.INDEGREE_ARRAY_START_X - GraphToposortIndegree.INDEGREE_ARRAY_ELEM_WIDTH, GraphToposortIndegree.INDEGREE_ARRAY_START_Y + vertex * GraphToposortIndegree.INDEGREE_ARRAY_ELEM_HEIGHT);
                        this.cmd("Move", stackID[stackTop], GraphToposortIndegree.STACK_START_X, GraphToposortIndegree.STACK_START_Y + stackTop * GraphToposortIndegree.STACK_HEIGHT);
                        this.cmd("Step");
                        stackTop++;
                    }
                    this.cmd("Delete", this.highlightCircleL);
                    this.cmd("Delete", this.highlightCircleAL);
                    this.cmd("Delete", this.highlightCircleAM);
                    this.cmd("SetTextColor", this.indegreeID[vertex], Graph.EDGE_COLOR);
                    this.highlightEdge(nextElem, vertex, 0);

                }
            }
            this.cmd("SetHighlight", this.circleID[nextElem], 0);
            nextInOrder++;
        }

        this.cmd("SetText", this.message1ID, "");
        this.cmd("SetText", this.stackLabelID, "");
        return this.commands;
    }

    setup_large() {
        this.d_x_pos = GraphToposortIndegree.D_X_POS_LARGE;
        this.d_y_pos = GraphToposortIndegree.D_Y_POS_LARGE;
        this.f_x_pos = GraphToposortIndegree.F_X_POS_LARGE;
        this.f_y_pos = GraphToposortIndegree.F_Y_POS_LARGE;
        super.setup_large();
    }
 
    setup_small() {
        this.d_x_pos = GraphToposortIndegree.D_X_POS_SMALL;
        this.d_y_pos = GraphToposortIndegree.D_Y_POS_SMALL;
        this.f_x_pos = GraphToposortIndegree.F_X_POS_SMALL;
        this.f_y_pos = GraphToposortIndegree.F_Y_POS_SMALL;
        super.setup_small();
    }

    dfsVisit(startVertex, messageX, printCCNum) {
        var nextMessage = this.nextIndex++;
        this.messageID.push(nextMessage);
        this.cmd("CreateLabel", nextMessage, "DFS(" + String(startVertex) + ")", messageX, this.messageY, 0);

        this.messageY = this.messageY + 20;
        if (!this.visited[startVertex]) {
            this.d_times[startVertex] = this.currentTime++;
            this.cmd("CreateLabel", this.d_timesID_L[startVertex], "d = " + String(this.d_times[startVertex]), this.d_x_pos[startVertex], this.d_y_pos[startVertex]);
            this.cmd("CreateLabel", this.d_timesID_AL[startVertex], "d = " + String(this.d_times[startVertex]), this.adj_list_x_start - 2 * this.adj_list_width, this.adj_list_y_start + startVertex * this.adj_list_height - 1 / 4 * this.adj_list_height);
            this.cmd("SetLayer", this.d_timesID_L[startVertex], 1);
            this.cmd("SetLayer", this.d_timesID_AL[startVertex], 2);

            this.visited[startVertex] = true;
            this.cmd("Step");
            for (var neighbor = 0; neighbor < this.size; neighbor++) {
                if (this.adj_matrix[startVertex][neighbor] > 0) {
                    this.highlightEdge(startVertex, neighbor, 1);
                    if (this.visited[neighbor]) {
                        nextMessage = this.nextIndex;
                        this.cmd("CreateLabel", nextMessage, "Vertex " + String(neighbor) + " already this.visited.", messageX, this.messageY, 0);
                    }
                    this.cmd("Step");
                    this.highlightEdge(startVertex, neighbor, 0);
                    if (this.visited[neighbor]) {
                        this.cmd("Delete", nextMessage, "DNM");
                    }

                    if (!this.visited[neighbor]) {
                        this.cmd("Disconnect", this.circleID[startVertex], this.circleID[neighbor]);
                        this.cmd("Connect", this.circleID[startVertex], this.circleID[neighbor], GraphToposortIndegree.DFS_TREE_COLOR, this.curve[startVertex][neighbor], 1, "");
                        this.cmd("Move", this.highlightCircleL, this.x_pos_logical[neighbor], this.y_pos_logical[neighbor]);
                        this.cmd("Move", this.highlightCircleAL, this.adj_list_x_start - this.adj_list_width, this.adj_list_y_start + neighbor * this.adj_list_height);
                        this.cmd("Move", this.highlightCircleAM, this.adj_matrix_x_start - this.adj_matrix_width, this.adj_matrix_y_start + neighbor * this.adj_matrix_height);

                        this.cmd("Step");
                        this.dfsVisit(neighbor, messageX + 10, printCCNum);
                        nextMessage = this.nextIndex;
                        this.cmd("CreateLabel", nextMessage, "Returning from recursive call: DFS(" + String(neighbor) + ")", messageX + 20, this.messageY, 0);

                        this.cmd("Move", this.highlightCircleAL, this.adj_list_x_start - this.adj_list_width, this.adj_list_y_start + startVertex * this.adj_list_height);
                        this.cmd("Move", this.highlightCircleL, this.x_pos_logical[startVertex], this.y_pos_logical[startVertex]);
                        this.cmd("Move", this.highlightCircleAM, this.adj_matrix_x_start - this.adj_matrix_width, this.adj_matrix_y_start + startVertex * this.adj_matrix_height);
                        this.cmd("Step");
                        this.cmd("Delete", nextMessage, 18);
                    }
                    this.cmd("Step");
                }
            }

            this.f_times[startVertex] = this.currentTime++;
            this.cmd("CreateLabel", this.f_timesID_L[startVertex], "f = " + String(this.f_times[startVertex]), this.f_x_pos[startVertex], this.f_y_pos[startVertex]);
            this.cmd("CreateLabel", this.f_timesID_AL[startVertex], "f = " + String(this.f_times[startVertex]), this.adj_list_x_start - 2 * this.adj_list_width, this.adj_list_y_start + startVertex * this.adj_list_height + 1 / 4 * this.adj_list_height);

            this.cmd("SetLayer", this.f_timesID_L[startVertex], 1);
            this.cmd("SetLayer", this.f_timesID_AL[startVertex], 2);

            this.cmd("Step");

            var i;
            for (i = this.topoOrderArrayL.length; i > 0; i--) {
                this.topoOrderArrayL[i] = this.topoOrderArrayL[i - 1];
                this.topoOrderArrayAL[i] = this.topoOrderArrayAL[i - 1];
                this.topoOrderArrayAM[i] = this.topoOrderArrayAM[i - 1];
            }

            var nextVertexLabel = this.nextIndex++;
            this.messageID.push(nextVertexLabel);
            this.cmd("CreateLabel", nextVertexLabel, startVertex, this.x_pos_logical[startVertex], this.y_pos_logical[startVertex]);
            this.cmd("SetLayer", nextVertexLabel, 1);
            this.topoOrderArrayL[0] = nextVertexLabel;

            nextVertexLabel = this.nextIndex++;
            this.messageID.push(nextVertexLabel);
            this.cmd("CreateLabel", nextVertexLabel, startVertex, this.adj_list_x_start - this.adj_list_width, this.adj_list_y_start + startVertex * this.adj_list_height);
            this.cmd("SetLayer", nextVertexLabel, 2);
            this.topoOrderArrayAL[0] = nextVertexLabel;

            nextVertexLabel = this.nextIndex++;
            this.messageID.push(nextVertexLabel);
            this.cmd("CreateLabel", nextVertexLabel, startVertex, this.adj_matrix_x_start - this.adj_matrix_width, this.adj_matrix_y_start + startVertex * this.adj_matrix_height);
            this.cmd("SetLayer", nextVertexLabel, 3);
            this.topoOrderArrayAM[0] = nextVertexLabel;

            for (i = 0; i < this.topoOrderArrayL.length; i++) {
                this.cmd("Move", this.topoOrderArrayL[i], GraphToposortIndegree.ORDERING_INITIAL_X,
                    GraphToposortIndegree.ORDERING_INITIAL_Y + i * GraphToposortIndegree.ORDERING_DELTA_Y);
                this.cmd("Move", this.topoOrderArrayAL[i], GraphToposortIndegree.ORDERING_INITIAL_X,
                    GraphToposortIndegree.ORDERING_INITIAL_Y + i * GraphToposortIndegree.ORDERING_DELTA_Y);
                this.cmd("Move", this.topoOrderArrayAM[i], GraphToposortIndegree.ORDERING_INITIAL_X,
                    GraphToposortIndegree.ORDERING_INITIAL_Y + i * GraphToposortIndegree.ORDERING_DELTA_Y);

            }
            this.cmd("Step");
        }
    }

    reset() {
        this.nextIndex = this.oldNextIndex;
        this.messageID = new Array();
        this.nextIndex = this.initialIndex;
    }

}
