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

function GraphToposortDFS(am)
{
    // call superclass' constructor, which calls init
    GraphToposortDFS.superclass.constructor.call(this, am);
}
GraphToposortDFS.inheritFrom(Graph);



GraphToposortDFS.ORDERING_INITIAL_X = 300;
GraphToposortDFS.ORDERING_INITIAL_Y = 70;
GraphToposortDFS.ORDERING_DELTA_Y = 20;

GraphToposortDFS.D_X_POS_SMALL = [760, 685, 915, 610, 910, 685, 915, 760];
GraphToposortDFS.F_X_POS_SMALL = [760, 685, 915, 610, 910, 685, 915, 760];



GraphToposortDFS.D_Y_POS_SMALL = [18, 118, 118, 218, 218, 318, 318, 418];
GraphToposortDFS.F_Y_POS_SMALL = [32, 132, 132, 232, 232, 332, 332, 432];

GraphToposortDFS.D_X_POS_LARGE = [560, 660, 760, 860,
                             610, 710, 810,
                             560, 660, 760, 860,
                             610, 710, 810,
                             560, 660, 760, 860];

GraphToposortDFS.F_X_POS_LARGE = [560, 660, 760, 860,
                             610, 710, 810,
                             560, 660, 760, 860,
                             610, 710, 810,
                             560, 660, 760, 860];



GraphToposortDFS.D_Y_POS_LARGE = [ 37,  37,  37, 37,
                             137, 137, 137,
                             237, 237, 237, 237,
                             337, 337, 337,
                             437, 437, 437, 437];

GraphToposortDFS.F_Y_POS_LARGE = [ 62,  62,  62,  62,
                             162, 162, 162,
                             262, 262, 262, 262,
                             362, 362, 362,
                             462,  462, 462, 462];


GraphToposortDFS.HIGHLIGHT_CIRCLE_COLOR = "#000000";
GraphToposortDFS.DFS_TREE_COLOR = "#0000FF";



GraphToposortDFS.prototype.addControls = function()
{
    this.startButton = this.addControlToAlgorithmBar("Button", "Do Topological Sort");
    this.startButton.onclick = this.startCallback.bind(this);
    GraphToposortDFS.superclass.addControls.call(this, false);
}


GraphToposortDFS.prototype.init = function(am)
{
    this.showEdgeCosts = false;
    GraphToposortDFS.superclass.init.call(this, am, true, true); // TODO:  add no edge label flag to this?
    // Setup called in base class init function
}


GraphToposortDFS.prototype.setup = function()
{
    GraphToposortDFS.superclass.setup.call(this);
    this.messageID = new Array();
    this.animationManager.setAllLayers([0, this.currentLayer]);

    this.highlightCircleL = this.nextIndex++;
    this.highlightCircleAL = this.nextIndex++;
    this.highlightCircleAM= this.nextIndex++
    this.initialIndex = this.nextIndex;

    this.old_adj_matrix = new Array(this.size);
    this.old_adj_list_list = new Array(this.size);
    this.old_adj_list_index = new Array(this.size);
    this.old_adj_list_edges = new Array(this.size);
    for (var i = 0; i < this.size; i++) {
        this.old_adj_matrix[i] = new Array(this.size);
        this.old_adj_list_index[i] = this.adj_list_index[i];
        this.old_adj_list_list[i] = this.adj_list_list[i];
        this.old_adj_list_edges[i] = new Array(this.size);
        for (var j = 0; j < this.size; j++) {
            this.old_adj_matrix[i][j] = this.adj_matrix[i][j];
            if (this.adj_matrix[i][j] > 0) {
                this.old_adj_list_edges[i][j] = this.adj_list_edges[i][j];
            }

        }
    }
}


GraphToposortDFS.prototype.startCallback = function(event)
{
            this.implementAction(this.doTopoSort.bind(this),"");
}



GraphToposortDFS.prototype.doTopoSort = function(ignored)
{
    this.visited = new Array(this.size);
    this.commands = new Array();
    this.topoOrderArrayL = new Array();
    this.topoOrderArrayAL = new Array();
    this.topoOrderArrayAM = new Array();
    var i;
    if (this.messageID != null) {
        for (i = 0; i < this.messageID.length; i++) {
            this.cmd("Delete", this.messageID[i], 1);
        }
    }
    this.rebuildEdges(); // HMMM.. do I want this?
    this.messageID = new Array();

    var headerID = this.nextIndex++;
    this.messageID.push(headerID);
    this.cmd("CreateLabel", headerID, "Topological Order",  GraphToposortDFS.ORDERING_INITIAL_X, GraphToposortDFS.ORDERING_INITIAL_Y - 1.5*GraphToposortDFS.ORDERING_DELTA_Y);


    headerID = this.nextIndex++;
    this.messageID.push(headerID);
    this.cmd("CreateRectangle", headerID, "", 100, 0, GraphToposortDFS.ORDERING_INITIAL_X, GraphToposortDFS.ORDERING_INITIAL_Y - GraphToposortDFS.ORDERING_DELTA_Y,"center","center");



    this.d_timesID_L = new Array(this.size);
    this.f_timesID_L = new Array(this.size);
    this.d_timesID_AL = new Array(this.size);
    this.f_timesID_AL = new Array(this.size);
    this.d_times = new Array(this.size);
    this.f_times = new Array(this.size);
    this.currentTime = 1
    for (i = 0; i < this.size; i++) {
        this.d_timesID_L[i] = this.nextIndex++;
        this.f_timesID_L[i] = this.nextIndex++;
        this.d_timesID_AL[i] = this.nextIndex++;
        this.f_timesID_AL[i] = this.nextIndex++;
    }

    this.messageY = 30;
    var vertex;
    for (vertex = 0; vertex < this.size; vertex++) {
        if (!this.visited[vertex]) {
            this.cmd("CreateHighlightCircle", this.highlightCircleL, GraphToposortDFS.HIGHLIGHT_CIRCLE_COLOR, this.x_pos_logical[vertex], this.y_pos_logical[vertex]);
            this.cmd("SetLayer", this.highlightCircleL, 1);
            this.cmd("CreateHighlightCircle", this.highlightCircleAL, GraphToposortDFS.HIGHLIGHT_CIRCLE_COLOR,this.adj_list_x_start - this.adj_list_width, this.adj_list_y_start + vertex*this.adj_list_height);
            this.cmd("SetLayer", this.highlightCircleAL, 2);

            this.cmd("CreateHighlightCircle", this.highlightCircleAM, GraphToposortDFS.HIGHLIGHT_CIRCLE_COLOR,this.adj_matrix_x_start - this.adj_matrix_width, this.adj_matrix_y_start + vertex*this.adj_matrix_height);
            this.cmd("SetLayer", this.highlightCircleAM, 3);

            if (vertex > 0) {
                var breakID = this.nextIndex++;
                this.messageID.push(breakID);
                this.cmd("CreateRectangle", breakID, "", 200, 0, 10, this.messageY,"left","bottom");
                this.messageY = this.messageY + 20;
            }
            this.dfsVisit(vertex, 10, false);
            this.cmd("Delete", this.highlightCircleL, 2);
            this.cmd("Delete", this.highlightCircleAL, 3);
            this.cmd("Delete", this.highlightCircleAM, 4);
        }
    }

    return this.commands

}


GraphToposortDFS.prototype.setup_large = function()
{
    this.d_x_pos = GraphToposortDFS.D_X_POS_LARGE;
    this.d_y_pos = GraphToposortDFS.D_Y_POS_LARGE;
    this.f_x_pos = GraphToposortDFS.F_X_POS_LARGE;
    this.f_y_pos = GraphToposortDFS.F_Y_POS_LARGE;

    GraphToposortDFS.superclass.setup_large.call(this);
}
GraphToposortDFS.prototype.setup_small = function()
{

    this.d_x_pos = GraphToposortDFS.D_X_POS_SMALL;
    this.d_y_pos = GraphToposortDFS.D_Y_POS_SMALL;
    this.f_x_pos = GraphToposortDFS.F_X_POS_SMALL;
    this.f_y_pos = GraphToposortDFS.F_Y_POS_SMALL;

    GraphToposortDFS.superclass.setup_small.call(this);
}

GraphToposortDFS.prototype.dfsVisit = function(startVertex, messageX, printCCNum)
{
    var nextMessage = this.nextIndex++;
    this.messageID.push(nextMessage);
    this.cmd("CreateLabel",nextMessage, "DFS(" +  String(startVertex) +  ")", messageX, this.messageY, 0);

    this.messageY = this.messageY + 20;
    if (!this.visited[startVertex]) {
        this.d_times[startVertex] = this.currentTime++;
        this.cmd("CreateLabel", this.d_timesID_L[startVertex], "d = " + String(this.d_times[startVertex]), this.d_x_pos[startVertex], this.d_y_pos[startVertex]);
        this.cmd("CreateLabel", this.d_timesID_AL[startVertex], "d = " + String(this.d_times[startVertex]), this.adj_list_x_start - 2*this.adj_list_width, this.adj_list_y_start + startVertex*this.adj_list_height - 1/4*this.adj_list_height);
        this.cmd("SetLayer",  this.d_timesID_L[startVertex], 1);
        this.cmd("SetLayer",  this.d_timesID_AL[startVertex], 2);

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
                    this.cmd("Connect", this.circleID[startVertex], this.circleID[neighbor], GraphToposortDFS.DFS_TREE_COLOR, this.curve[startVertex][neighbor], 1, "");
                    this.cmd("Move", this.highlightCircleL, this.x_pos_logical[neighbor], this.y_pos_logical[neighbor]);
                    this.cmd("Move", this.highlightCircleAL, this.adj_list_x_start - this.adj_list_width, this.adj_list_y_start + neighbor*this.adj_list_height);
                    this.cmd("Move", this.highlightCircleAM, this.adj_matrix_x_start - this.adj_matrix_width, this.adj_matrix_y_start + neighbor*this.adj_matrix_height);

                    this.cmd("Step");
                    this.dfsVisit(neighbor, messageX + 10, printCCNum);
                    nextMessage = this.nextIndex;
                    this.cmd("CreateLabel", nextMessage, "Returning from recursive call: DFS(" + String(neighbor) + ")", messageX + 20, this.messageY, 0);

                    this.cmd("Move", this.highlightCircleAL, this.adj_list_x_start - this.adj_list_width, this.adj_list_y_start + startVertex*this.adj_list_height);
                    this.cmd("Move", this.highlightCircleL, this.x_pos_logical[startVertex], this.y_pos_logical[startVertex]);
                    this.cmd("Move", this.highlightCircleAM, this.adj_matrix_x_start - this.adj_matrix_width, this.adj_matrix_y_start + startVertex*this.adj_matrix_height);
                    this.cmd("Step");
                    this.cmd("Delete", nextMessage, 18);
                }
                this.cmd("Step");



            }

        }


        this.f_times[startVertex] = this.currentTime++;
        this.cmd("CreateLabel", this.f_timesID_L[startVertex],"f = " + String(this.f_times[startVertex]), this.f_x_pos[startVertex], this.f_y_pos[startVertex]);
        this.cmd("CreateLabel", this.f_timesID_AL[startVertex], "f = " + String(this.f_times[startVertex]), this.adj_list_x_start - 2*this.adj_list_width, this.adj_list_y_start + startVertex*this.adj_list_height + 1/4*this.adj_list_height);

        this.cmd("SetLayer",  this.f_timesID_L[startVertex], 1);
        this.cmd("SetLayer",  this.f_timesID_AL[startVertex], 2);

        this.cmd("Step");

        var i;
        for (i = this.topoOrderArrayL.length; i > 0; i--) {
            this.topoOrderArrayL[i] = this.topoOrderArrayL[i-1];
            this.topoOrderArrayAL[i] = this.topoOrderArrayAL[i-1];
            this.topoOrderArrayAM[i] = this.topoOrderArrayAM[i-1];
        }

        var nextVertexLabel = this.nextIndex++;
        this.messageID.push(nextVertexLabel);
        this.cmd("CreateLabel", nextVertexLabel, startVertex, this.x_pos_logical[startVertex],  this.y_pos_logical[startVertex]);
        this.cmd("SetLayer", nextVertexLabel, 1);
        this.topoOrderArrayL[0] = nextVertexLabel;

        nextVertexLabel = this.nextIndex++;
        this.messageID.push(nextVertexLabel);
        this.cmd("CreateLabel", nextVertexLabel, startVertex,this.adj_list_x_start - this.adj_list_width, this.adj_list_y_start + startVertex*this.adj_list_height);
        this.cmd("SetLayer", nextVertexLabel, 2);
        this.topoOrderArrayAL[0] = nextVertexLabel;

        nextVertexLabel = this.nextIndex++;
        this.messageID.push(nextVertexLabel);
        this.cmd("CreateLabel", nextVertexLabel, startVertex,this.adj_matrix_x_start - this.adj_matrix_width, this.adj_matrix_y_start + startVertex*this.adj_matrix_height);
        this.cmd("SetLayer", nextVertexLabel, 3);
        this.topoOrderArrayAM[0] = nextVertexLabel;

        for (i = 0; i < this.topoOrderArrayL.length; i++) {
            this.cmd("Move", this.topoOrderArrayL[i], GraphToposortDFS.ORDERING_INITIAL_X,
                     GraphToposortDFS.ORDERING_INITIAL_Y + i * GraphToposortDFS.ORDERING_DELTA_Y);
            this.cmd("Move", this.topoOrderArrayAL[i], GraphToposortDFS.ORDERING_INITIAL_X,
                     GraphToposortDFS.ORDERING_INITIAL_Y + i * GraphToposortDFS.ORDERING_DELTA_Y);
            this.cmd("Move", this.topoOrderArrayAM[i], GraphToposortDFS.ORDERING_INITIAL_X,
                     GraphToposortDFS.ORDERING_INITIAL_Y + i * GraphToposortDFS.ORDERING_DELTA_Y);

        }
        this.cmd("Step");



    }

}


GraphToposortDFS.prototype.reset = function()
{
    // TODO:  Fix undo messing with setup vars.
    this.messageID = new Array();
    this.nextIndex = this.initialIndex;
    for (var i = 0; i < this.size; i++) {
        this.adj_list_list[i] = this.old_adj_list_list[i];
        this.adj_list_index[i] = this.old_adj_list_index[i];

        for (var j = 0; j < this.size; j++) {
            this.adj_matrix[i][j] = this.old_adj_matrix[i][j];
            if (this.adj_matrix[i][j] > 0) {
                this.adj_list_edges[i][j] = this.old_adj_list_edges[i][j];
            }
        }
    }

}



var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new GraphToposortDFS(animManag);
}