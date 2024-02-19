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


class GraphKruskal extends Graph {
    static HIGHLIGHT_CIRCLE_COLOR = "#000000";

    static SET_ARRAY_ELEM_WIDTH = 25;
    static SET_ARRAY_ELEM_HEIGHT = 25;
    static SET_ARRAY_START_X = 50;
    static SET_ARRAY_START_Y = 130;

    static EDGE_LIST_ELEM_WIDTH = 40;
    static EDGE_LIST_ELEM_HEIGHT = 40;
    static EDGE_LIST_COLUMN_WIDTH = 100;
    static EDGE_LIST_MAX_PER_COLUMN = 10;

    static EDGE_LIST_START_X = 150;
    static EDGE_LIST_START_Y = 130;


    static FIND_LABEL_1_X = 30;
    static FIND_LABEL_2_X = 100;
    static FIND_LABEL_1_Y = 30;
    static FIND_LABEL_2_Y = GraphKruskal.FIND_LABEL_1_Y;

    static MESSAGE_LABEL_X = 30;
    static MESSAGE_LABEL_Y = 50;

    static HIGHLIGHT_CIRCLE_COLOR_1 = "#FFAAAA";
    static HIGHLIGHT_CIRCLE_COLOR_2 = "#FF0000";

    constructor(am) {
        super();
        this.init(am);
    }

    addControls() {
        this.startButton = this.addControlToAlgorithmBar("Button", "Run Kruskal");
        this.startButton.onclick = this.startCallback.bind(this);
        super.addControls(false);
    }

    init(am) {
        this.showEdgeCosts = true;
        super.init(am, false, false); // TODO:  add no edge label flag to this?
    }

    setup() {
        super.setup();
        this.messageID = new Array();
        this.commands = new Array();
        this.setID = new Array(this.size);
        this.setIndexID = new Array(this.size);
        this.setData = new Array(this.size);

        for (var i = 0; i < this.size; i++) {
            this.setID[i] = this.nextIndex++;
            this.setIndexID[i] = this.nextIndex++;
            this.cmd("CreateRectangle", this.setID[i], "-1", GraphKruskal.SET_ARRAY_ELEM_WIDTH, GraphKruskal.SET_ARRAY_ELEM_HEIGHT, GraphKruskal.SET_ARRAY_START_X, GraphKruskal.SET_ARRAY_START_Y + i * GraphKruskal.SET_ARRAY_ELEM_HEIGHT);
            this.cmd("CreateLabel", this.setIndexID[i], i, GraphKruskal.SET_ARRAY_START_X - GraphKruskal.SET_ARRAY_ELEM_WIDTH, GraphKruskal.SET_ARRAY_START_Y + i * GraphKruskal.SET_ARRAY_ELEM_HEIGHT);
            this.cmd("SetForegroundColor", this.setIndexID[i], Graph.VERTEX_INDEX_COLOR);
        }
        this.cmd("CreateLabel", this.nextIndex++, "Disjoint Set", GraphKruskal.SET_ARRAY_START_X - 1 * GraphKruskal.SET_ARRAY_ELEM_WIDTH, GraphKruskal.SET_ARRAY_START_Y - GraphKruskal.SET_ARRAY_ELEM_HEIGHT * 1.5, 0);
        this.animationManager.setAllLayers([0, this.currentLayer]);
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    startCallback(event) {
        this.implementAction(this.doKruskal.bind(this), "");
    }

    disjointSetFind(valueToFind, highlightCircleID) {
        this.cmd("SetTextColor", this.setID[valueToFind], "#FF0000");
        this.cmd("Step");
        while (this.setData[valueToFind] >= 0) {
            this.cmd("SetTextColor", this.setID[valueToFind], "#000000");
            this.cmd("Move", highlightCircleID, GraphKruskal.SET_ARRAY_START_X - GraphKruskal.SET_ARRAY_ELEM_WIDTH, GraphKruskal.SET_ARRAY_START_Y + this.setData[valueToFind] * GraphKruskal.SET_ARRAY_ELEM_HEIGHT);
            this.cmd("Step");
            valueToFind = this.setData[valueToFind];
            this.cmd("SetTextColor", this.setID[valueToFind], "#FF0000");
            this.cmd("Step");
        }
        this.cmd("SetTextColor", this.setID[valueToFind], "#000000");
        return valueToFind;
    }

    doKruskal(ignored) {
        this.commands = new Array();

        this.edgesListLeftID = new Array();
        this.edgesListRightID = new Array();
        this.edgesListLeft = new Array();
        this.edgesListRight = new Array();

        for (var i = 0; i < this.size; i++) {
            this.setData[i] = -1;
            this.cmd("SetText", this.setID[i], "-1");
        }

        this.recolorGraph();

        // Create Edge List
        var top;
        for (var i = 0; i < this.size; i++) {
            for (var j = i + 1; j < this.size; j++) {
                if (this.adj_matrix[i][j] >= 0) {
                    this.edgesListLeftID.push(this.nextIndex++);
                    this.edgesListRightID.push(this.nextIndex++);
                    top = this.edgesListLeftID.length - 1;
                    this.edgesListLeft.push(i);
                    this.edgesListRight.push(j);
                    this.cmd("CreateLabel", this.edgesListLeftID[top], i, GraphKruskal.EDGE_LIST_START_X + Math.floor(top / GraphKruskal.EDGE_LIST_MAX_PER_COLUMN) * GraphKruskal.EDGE_LIST_COLUMN_WIDTH,
                        GraphKruskal.EDGE_LIST_START_Y + (top % GraphKruskal.EDGE_LIST_MAX_PER_COLUMN) * GraphKruskal.EDGE_LIST_ELEM_HEIGHT);
                    this.cmd("CreateLabel", this.edgesListRightID[top], j, GraphKruskal.EDGE_LIST_START_X + GraphKruskal.EDGE_LIST_ELEM_WIDTH + Math.floor(top / GraphKruskal.EDGE_LIST_MAX_PER_COLUMN) * GraphKruskal.EDGE_LIST_COLUMN_WIDTH,
                        GraphKruskal.EDGE_LIST_START_Y + (top % GraphKruskal.EDGE_LIST_MAX_PER_COLUMN) * GraphKruskal.EDGE_LIST_ELEM_HEIGHT);
                    this.cmd("Connect", this.edgesListLeftID[top], this.edgesListRightID[top], Graph.EDGE_COLOR, 0, 0, this.adj_matrix[i][j]);
                }
            }
        }
        this.cmd("Step");

        // Sort edge list based on edge cost
        var edgeCount = this.edgesListLeftID.length;
        var tmpLeftID;
        var tmpRightID;
        var tmpLeft;
        var tmpRight;
        for (var i = 1; i < edgeCount; i++) {
            tmpLeftID = this.edgesListLeftID[i];
            tmpRightID = this.edgesListRightID[i];
            tmpLeft = this.edgesListLeft[i];
            tmpRight = this.edgesListRight[i];
            var j = i;
            while (j > 0 && this.adj_matrix[this.edgesListLeft[j - 1]][this.edgesListRight[j - 1]] > this.adj_matrix[tmpLeft][tmpRight]) {
                this.edgesListLeft[j] = this.edgesListLeft[j - 1];
                this.edgesListRight[j] = this.edgesListRight[j - 1];
                this.edgesListLeftID[j] = this.edgesListLeftID[j - 1];
                this.edgesListRightID[j] = this.edgesListRightID[j - 1];
                j = j - 1;
            }
            this.edgesListLeft[j] = tmpLeft;
            this.edgesListRight[j] = tmpRight;
            this.edgesListLeftID[j] = tmpLeftID;
            this.edgesListRightID[j] = tmpRightID;
        }
        for (var i = 0; i < edgeCount; i++) {
            this.cmd("Move", this.edgesListLeftID[i], GraphKruskal.EDGE_LIST_START_X + Math.floor(i / GraphKruskal.EDGE_LIST_MAX_PER_COLUMN) * GraphKruskal.EDGE_LIST_COLUMN_WIDTH,
                GraphKruskal.EDGE_LIST_START_Y + (i % GraphKruskal.EDGE_LIST_MAX_PER_COLUMN) * GraphKruskal.EDGE_LIST_ELEM_HEIGHT);
            this.cmd("Move", this.edgesListRightID[i], GraphKruskal.EDGE_LIST_START_X + GraphKruskal.EDGE_LIST_ELEM_WIDTH + Math.floor(i / GraphKruskal.EDGE_LIST_MAX_PER_COLUMN) * GraphKruskal.EDGE_LIST_COLUMN_WIDTH,
                GraphKruskal.EDGE_LIST_START_Y + (i % GraphKruskal.EDGE_LIST_MAX_PER_COLUMN) * GraphKruskal.EDGE_LIST_ELEM_HEIGHT);

        }

        this.cmd("Step");

        var findLabelLeft = this.nextIndex++;
        var findLabelRight = this.nextIndex++;
        var highlightCircle1 = this.nextIndex++;
        var highlightCircle2 = this.nextIndex++;
        var moveLabelID = this.nextIndex++;
        var messageLabelID = this.nextIndex++;

        var edgesAdded = 0;
        var nextListIndex = 0;
        this.cmd("CreateLabel", findLabelLeft, "", GraphKruskal.FIND_LABEL_1_X, GraphKruskal.FIND_LABEL_1_Y, 0);
        this.cmd("CreateLabel", findLabelRight, "", GraphKruskal.FIND_LABEL_2_X, GraphKruskal.FIND_LABEL_2_Y, 0);

        while (edgesAdded < this.size - 1 && nextListIndex < edgeCount) {
            this.cmd("SetEdgeHighlight", this.edgesListLeftID[nextListIndex], this.edgesListRightID[nextListIndex], 1);

            this.highlightEdge(this.edgesListLeft[nextListIndex], this.edgesListRight[nextListIndex], 1);
            this.highlightEdge(this.edgesListRight[nextListIndex], this.edgesListLeft[nextListIndex], 1);

            this.cmd("SetText", findLabelLeft, "find(" + String(this.edgesListLeft[nextListIndex]) + ") = ");

            this.cmd("CreateHighlightCircle", highlightCircle1, GraphKruskal.HIGHLIGHT_CIRCLE_COLOR_1, GraphKruskal.EDGE_LIST_START_X + Math.floor(nextListIndex / GraphKruskal.EDGE_LIST_MAX_PER_COLUMN) * GraphKruskal.EDGE_LIST_COLUMN_WIDTH,
                GraphKruskal.EDGE_LIST_START_Y + (nextListIndex % GraphKruskal.EDGE_LIST_MAX_PER_COLUMN) * GraphKruskal.EDGE_LIST_ELEM_HEIGHT, 15);
            this.cmd("Move", highlightCircle1, GraphKruskal.SET_ARRAY_START_X - GraphKruskal.SET_ARRAY_ELEM_WIDTH, GraphKruskal.SET_ARRAY_START_Y + this.edgesListLeft[nextListIndex] * GraphKruskal.SET_ARRAY_ELEM_HEIGHT);
            this.cmd("Step");

            var left = this.disjointSetFind(this.edgesListLeft[nextListIndex], highlightCircle1);
            this.cmd("SetText", findLabelLeft, "find(" + String(this.edgesListLeft[nextListIndex]) + ") = " + String(left));

            this.cmd("SetText", findLabelRight, "find(" + String(this.edgesListRight[nextListIndex]) + ") = ");

            this.cmd("CreateHighlightCircle", highlightCircle2, GraphKruskal.HIGHLIGHT_CIRCLE_COLOR_2, GraphKruskal.EDGE_LIST_START_X + GraphKruskal.EDGE_LIST_ELEM_WIDTH + Math.floor(nextListIndex / GraphKruskal.EDGE_LIST_MAX_PER_COLUMN) * GraphKruskal.EDGE_LIST_COLUMN_WIDTH,
                GraphKruskal.EDGE_LIST_START_Y + (nextListIndex % GraphKruskal.EDGE_LIST_MAX_PER_COLUMN) * GraphKruskal.EDGE_LIST_ELEM_HEIGHT, 15);

            this.cmd("Move", highlightCircle2, GraphKruskal.SET_ARRAY_START_X - GraphKruskal.SET_ARRAY_ELEM_WIDTH, GraphKruskal.SET_ARRAY_START_Y + this.edgesListRight[nextListIndex] * GraphKruskal.SET_ARRAY_ELEM_HEIGHT);
            this.cmd("Step");

            var right = this.disjointSetFind(this.edgesListRight[nextListIndex], highlightCircle2);
            this.cmd("SetText", findLabelRight, "find(" + String(this.edgesListRight[nextListIndex]) + ") = " + String(right));

            this.cmd("Step");

            if (left != right) {
                this.cmd("CreateLabel", messageLabelID, "Vertices in different trees.  Add edge to tree: Union(" + String(left) + "," + String(right) + ")", GraphKruskal.MESSAGE_LABEL_X, GraphKruskal.MESSAGE_LABEL_Y, 0);
                this.cmd("Step");
                this.highlightEdge(this.edgesListLeft[nextListIndex], this.edgesListRight[nextListIndex], 1);
                this.highlightEdge(this.edgesListRight[nextListIndex], this.edgesListLeft[nextListIndex], 1);
                edgesAdded++;
                this.setEdgeColor(this.edgesListLeft[nextListIndex], this.edgesListRight[nextListIndex], "#FF0000");
                this.setEdgeColor(this.edgesListRight[nextListIndex], this.edgesListLeft[nextListIndex], "#FF0000");
                if (this.setData[left] < this.setData[right]) {
                    this.cmd("SetText", this.setID[right], "");
                    this.cmd("CreateLabel", moveLabelID, this.setData[right], GraphKruskal.SET_ARRAY_START_X, GraphKruskal.SET_ARRAY_START_Y + right * GraphKruskal.SET_ARRAY_ELEM_HEIGHT);
                    this.cmd("Move", moveLabelID, GraphKruskal.SET_ARRAY_START_X, GraphKruskal.SET_ARRAY_START_Y + left * GraphKruskal.SET_ARRAY_ELEM_HEIGHT);
                    this.cmd("Step");
                    this.cmd("Delete", moveLabelID);
                    this.setData[left] = this.setData[left] + this.setData[right];
                    this.setData[right] = left;
                }
                else {
                    this.cmd("SetText", this.setID[left], "");
                    this.cmd("CreateLabel", moveLabelID, this.setData[left], GraphKruskal.SET_ARRAY_START_X, GraphKruskal.SET_ARRAY_START_Y + left * GraphKruskal.SET_ARRAY_ELEM_HEIGHT);
                    this.cmd("Move", moveLabelID, GraphKruskal.SET_ARRAY_START_X, GraphKruskal.SET_ARRAY_START_Y + right * GraphKruskal.SET_ARRAY_ELEM_HEIGHT);
                    this.cmd("Step");
                    this.cmd("Delete", moveLabelID);
                    this.setData[right] = this.setData[right] + this.setData[left];
                    this.setData[left] = right;
                }
                this.cmd("SetText", this.setID[left], this.setData[left]);
                this.cmd("SetText", this.setID[right], this.setData[right]);
            }
            else {
                this.cmd("CreateLabel", messageLabelID, "Vertices in the same tree.  Skip edge", GraphKruskal.MESSAGE_LABEL_X, GraphKruskal.MESSAGE_LABEL_Y, 0);
                this.cmd("Step");

            }

            this.highlightEdge(this.edgesListLeft[nextListIndex], this.edgesListRight[nextListIndex], 0);
            this.highlightEdge(this.edgesListRight[nextListIndex], this.edgesListLeft[nextListIndex], 0);

            this.cmd("Delete", messageLabelID);
            this.cmd("Delete", highlightCircle1);
            this.cmd("Delete", highlightCircle2);


            this.cmd("Delete", this.edgesListLeftID[nextListIndex]);
            this.cmd("Delete", this.edgesListRightID[nextListIndex]);
            this.cmd("SetText", findLabelLeft, "");
            this.cmd("SetText", findLabelRight, "");
            nextListIndex++;

        }
        this.cmd("Delete", findLabelLeft);
        this.cmd("Delete", findLabelRight);

        return this.commands;
    }

    reset() {
        this.messageID = new Array();
    }
}
