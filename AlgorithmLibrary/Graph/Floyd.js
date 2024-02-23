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
// THIS SOFTWARE IS PROVIDED BY David Galles ``AS IS'' AND ANY EXPRESS OR IMPLIED
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


Algorithm.Graph.Floyd = class Floyd extends Algorithm.Graph {
    SMALL_COST_TABLE_WIDTH = 30;
    SMALL_COST_TABLE_HEIGHT = 30;
    SMALL_COST_TABLE_START_X = 40;
    SMALL_COST_TABLE_START_Y = 70;

    SMALL_PATH_TABLE_WIDTH = 30;
    SMALL_PATH_TABLE_HEIGHT = 30;
    SMALL_PATH_TABLE_START_X = 330;
    SMALL_PATH_TABLE_START_Y = 70;

    SMALL_NODE_1_X_POS = 50;
    SMALL_NODE_1_Y_POS = 400;
    SMALL_NODE_2_X_POS = 150;
    SMALL_NODE_2_Y_POS = 350;
    SMALL_NODE_3_X_POS = 250;
    SMALL_NODE_3_Y_POS = 400;

    SMALL_MESSAGE_X = 400;
    SMALL_MESSAGE_Y = 350;

    LARGE_COST_TABLE_WIDTH = 20;
    LARGE_COST_TABLE_HEIGHT = 20;
    LARGE_COST_TABLE_START_X = 40;
    LARGE_COST_TABLE_START_Y = 50;

    LARGE_PATH_TABLE_WIDTH = 20;
    LARGE_PATH_TABLE_HEIGHT = 20;
    LARGE_PATH_TABLE_START_X = 500;
    LARGE_PATH_TABLE_START_Y = 50;

    LARGE_NODE_1_X_POS = 50;
    LARGE_NODE_1_Y_POS = 500;
    LARGE_NODE_2_X_POS = 150;
    LARGE_NODE_2_Y_POS = 450;
    LARGE_NODE_3_X_POS = 250;
    LARGE_NODE_3_Y_POS = 500;

    LARGE_MESSAGE_X = 300;
    LARGE_MESSAGE_Y = 450;

    constructor(am, dir) {
        super();
        this.init(am, dir);
    }

    addControls() {
        this.startButton = this.addButtonToAlgorithmBar("Run Floyd-Warshall");
        this.startButton.onclick = this.startCallback.bind(this);
        super.addControls();
        this.smallGraphButton.onclick = this.smallGraphCallback.bind(this);
        this.largeGraphButton.onclick = this.largeGraphCallback.bind(this);
    }

    init(am, dir) {
        this.showEdgeCosts = true;
        super.init(am, dir); // TODO:  add no edge label flag to this?
    }

    reset() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.costTable[i][j] = this.adjMatrix[i][j];
                if (this.costTable[i][j] >= 0) {
                    this.pathTable[i][j] = i;
                } else {
                    this.pathTable[i][j] = -1;
                }
            }
        }
    }

    smallGraphCallback(event) {
        if (this.size !== this.SMALL_SIZE) {
            this.animationManager.resetAll();
            this.animationManager.setAllLayers([0, this.currentLayer]);
            this.logicalButton.disabled = false;
            this.adjacencyListButton.disabled = false;
            this.adjacencyMatrixButton.disabled = false;
            this.setupSmall();
        }
    }

    largeGraphCallback(event) {
        if (this.size !== this.LARGE_SIZE) {
            this.animationManager.resetAll();
            // this.animationManager.setAllLayers([0]);
            this.logicalButton.disabled = true;
            this.adjacencyListButton.disabled = true;
            this.adjacencyMatrixButton.disabled = true;
            this.setupLarge();
        }
    }

    getCostLabel(value, alwaysUseINF) {
        alwaysUseINF = alwaysUseINF == null ? false : alwaysUseINF;
        if (value >= 0) {
            return String(value);
        } else if (this.size === this.SMALL_SIZE || alwaysUseINF) {
            return "INF";
        } else {
            return "";
        }
    }

    setupSmall() {
        this.costTableWidth = this.SMALL_COST_TABLE_WIDTH;
        this.costTableHeight = this.SMALL_COST_TABLE_HEIGHT;
        this.costTableStartX = this.SMALL_COST_TABLE_START_X;
        this.costTableStartY = this.SMALL_COST_TABLE_START_Y;

        this.pathTableWidth = this.SMALL_PATH_TABLE_WIDTH;
        this.pathTableHeight = this.SMALL_PATH_TABLE_HEIGHT;
        this.pathTableStartX = this.SMALL_PATH_TABLE_START_X;
        this.pathTableStartY = this.SMALL_PATH_TABLE_START_Y;

        this.node1xPos = this.SMALL_NODE_1_X_POS;
        this.node1yPos = this.SMALL_NODE_1_Y_POS;
        this.node2xPos = this.SMALL_NODE_2_X_POS;
        this.node2yPos = this.SMALL_NODE_2_Y_POS;
        this.node3xPos = this.SMALL_NODE_3_X_POS;
        this.node3yPos = this.SMALL_NODE_3_Y_POS;

        this.messageX = this.SMALL_MESSAGE_X;
        this.messageY = this.SMALL_MESSAGE_Y;
        super.setupSmall();
    }

    setupLarge() {
        this.costTableWidth = this.LARGE_COST_TABLE_WIDTH;
        this.costTableHeight = this.LARGE_COST_TABLE_HEIGHT;
        this.costTableStartX = this.LARGE_COST_TABLE_START_X;
        this.costTableStartY = this.LARGE_COST_TABLE_START_Y;

        this.pathTableWidth = this.LARGE_PATH_TABLE_WIDTH;
        this.pathTableHeight = this.LARGE_PATH_TABLE_HEIGHT;
        this.pathTableStartX = this.LARGE_PATH_TABLE_START_X;
        this.pathTableStartY = this.LARGE_PATH_TABLE_START_Y;

        this.node1xPos = this.LARGE_NODE_1_X_POS;
        this.node1yPos = this.LARGE_NODE_1_Y_POS;
        this.node2xPos = this.LARGE_NODE_2_X_POS;
        this.node2yPos = this.LARGE_NODE_2_Y_POS;
        this.node3xPos = this.LARGE_NODE_3_X_POS;
        this.node3yPos = this.LARGE_NODE_3_Y_POS;

        this.messageX = this.LARGE_MESSAGE_X;
        this.messageY = this.LARGE_MESSAGE_Y;

        super.setupLarge();
    }

    setup() {
        super.setup();
        this.commands = [];

        this.costTable = new Array(this.size);
        this.pathTable = new Array(this.size);
        this.costTableID = new Array(this.size);
        this.pathTableID = new Array(this.size);
        this.pathIndexXID = new Array(this.size);
        this.pathIndexYID = new Array(this.size);
        this.costIndexXID = new Array(this.size);
        this.costIndexYID = new Array(this.size);

        this.node1ID = this.nextIndex++;
        this.node2ID = this.nextIndex++;
        this.node3ID = this.nextIndex++;

        for (let i = 0; i < this.size; i++) {
            this.costTable[i] = new Array(this.size);
            this.pathTable[i] = new Array(this.size);
            this.costTableID[i] = new Array(this.size);
            this.pathTableID[i] = new Array(this.size);
        }

        const costTableHeader = this.nextIndex++;
        const pathTableHeader = this.nextIndex++;

        this.cmd("CreateLabel", costTableHeader, "Cost Table", this.costTableStartX, this.costTableStartY - 2 * this.costTableHeight, 0);
        this.cmd("CreateLabel", pathTableHeader, "Path Table", this.pathTableStartX, this.pathTableStartY - 2 * this.pathTableHeight, 0);

        for (let i = 0; i < this.size; i++) {
            this.pathIndexXID[i] = this.nextIndex++;
            this.pathIndexYID[i] = this.nextIndex++;
            this.costIndexXID[i] = this.nextIndex++;
            this.costIndexYID[i] = this.nextIndex++;
            this.cmd("CreateLabel", this.pathIndexXID[i], i, this.pathTableStartX + i * this.pathTableWidth, this.pathTableStartY - this.pathTableHeight);
            this.cmd("SetTextColor", this.pathIndexXID[i], "#0000FF");
            this.cmd("CreateLabel", this.pathIndexYID[i], i, this.pathTableStartX - this.pathTableWidth, this.pathTableStartY + i * this.pathTableHeight);
            this.cmd("SetTextColor", this.pathIndexYID[i], "#0000FF");

            this.cmd("CreateLabel", this.costIndexXID[i], i, this.costTableStartX + i * this.costTableWidth, this.costTableStartY - this.costTableHeight);
            this.cmd("SetTextColor", this.costIndexXID[i], "#0000FF");
            this.cmd("CreateLabel", this.costIndexYID[i], i, this.costTableStartX - this.costTableWidth, this.costTableStartY + i * this.costTableHeight);
            this.cmd("SetTextColor", this.costIndexYID[i], "#0000FF");
            for (let j = 0; j < this.size; j++) {
                this.costTable[i][j] = this.adjMatrix[i][j];
                if (this.costTable[i][j] >= 0) {
                    this.pathTable[i][j] = i;
                } else {
                    this.pathTable[i][j] = -1;
                }
                this.costTableID[i][j] = this.nextIndex++;
                this.pathTableID[i][j] = this.nextIndex++;
                this.cmd("CreateRectangle", this.costTableID[i][j], this.getCostLabel(this.costTable[i][j], true), this.costTableWidth, this.costTableHeight, this.costTableStartX + j * this.costTableWidth, this.costTableStartY + i * this.costTableHeight);
                this.cmd("CreateRectangle", this.pathTableID[i][j], this.pathTable[i][j], this.pathTableWidth, this.pathTableHeight, this.pathTableStartX + j * this.pathTableWidth, this.pathTableStartY + i * this.pathTableHeight);
            }
        }
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
        if (this.size === this.LARGE_SIZE) {
            this.animationManager.setAllLayers([0]);
        }
    }

    startCallback(event) {
        this.implementAction(this.doFloydWarshall.bind(this), "");
    }

    doFloydWarshall(ignored) {
        this.commands = [];

        const oldIndex = this.nextIndex;
        const messageID = this.nextIndex++;
        const moveLabel1ID = this.nextIndex++;
        const moveLabel2ID = this.nextIndex++;

        this.cmd("CreateCircle", this.node1ID, "", this.node1xPos, this.node1yPos);
        this.cmd("CreateCircle", this.node2ID, "", this.node2xPos, this.node2yPos);
        this.cmd("CreateCircle", this.node3ID, "", this.node3xPos, this.node3yPos);
        this.cmd("CreateLabel", messageID, "", this.messageX, this.messageY, 0);

        for (let k = 0; k < this.size; k++) {
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (i !== j && j !== k && i !== k) {
                        this.cmd("SetText", this.node1ID, i);
                        this.cmd("SetText", this.node2ID, k);
                        this.cmd("SetText", this.node3ID, j);
                        this.cmd("Connect", this.node1ID, this.node2ID, "#009999", -0.1, 1, this.getCostLabel(this.costTable[i][k], true));
                        this.cmd("Connect", this.node2ID, this.node3ID, "#9900CC", -0.1, 1, this.getCostLabel(this.costTable[k][j], true));
                        this.cmd("Connect", this.node1ID, this.node3ID, "#CC0000", 0, 1, this.getCostLabel(this.costTable[i][j], true));
                        this.cmd("SetHighlight", this.costTableID[i][k], 1);
                        this.cmd("SetHighlight", this.costTableID[k][j], 1);
                        this.cmd("SetHighlight", this.costTableID[i][j], 1);
                        this.cmd("SetTextColor", this.costTableID[i][k], "#009999");
                        this.cmd("SetTextColor", this.costTableID[k][j], "#9900CC");
                        this.cmd("SetTextColor", this.costTableID[i][j], "#CC0000");
                        if (this.costTable[i][k] >= 0 && this.costTable[k][j] >= 0) {
                            if (this.costTable[i][j] < 0 || this.costTable[i][k] + this.costTable[k][j] < this.costTable[i][j]) {
                                this.cmd("SetText", messageID, `${this.getCostLabel(this.costTable[i][k], true)} + ${this.getCostLabel(this.costTable[k][j], true)} < ${this.getCostLabel(this.costTable[i][j], true)}`);
                                this.cmd("Step");
                                this.costTable[i][j] = this.costTable[i][k] + this.costTable[k][j];
                                this.cmd("SetText", this.pathTableID[i][j], "");
                                this.cmd("SetText", this.costTableID[i][j], "");
                                this.cmd("CreateLabel", moveLabel1ID, this.pathTable[k][j], this.pathTableStartX + j * this.pathTableWidth, this.pathTableStartY + k * this.pathTableHeight);
                                this.cmd("Move", moveLabel1ID, this.pathTableStartX + j * this.pathTableWidth, this.pathTableStartY + i * this.pathTableHeight);
                                this.cmd("CreateLabel", moveLabel2ID, this.costTable[i][j], this.messageX, this.messageY);
                                this.cmd("SetHighlight", moveLabel2ID, 1);
                                this.cmd("Move", moveLabel2ID, this.costTableStartX + j * this.costTableWidth, this.costTableStartY + i * this.costTableHeight);
                                this.pathTable[i][j] = this.pathTable[k][j];
                                this.cmd("Step");
                                this.cmd("SetText", this.costTableID[i][j], this.costTable[i][j]);
                                this.cmd("SetText", this.pathTableID[i][j], this.pathTable[i][j]);
                                this.cmd("Delete", moveLabel1ID);
                                this.cmd("Delete", moveLabel2ID);
                            } else {
                                this.cmd("SetText", messageID, `!(${this.getCostLabel(this.costTable[i][k], true)} + ${this.getCostLabel(this.costTable[k][j], true)} < ${this.getCostLabel(this.costTable[i][j], true)})`);
                                this.cmd("Step");
                            }
                        } else {
                            this.cmd("SetText", messageID, `!(${this.getCostLabel(this.costTable[i][k], true)} + ${this.getCostLabel(this.costTable[k][j], true)} < ${this.getCostLabel(this.costTable[i][j], true)})`);
                            this.cmd("Step");
                        }
                        this.cmd("SetTextColor", this.costTableID[i][k], "#000000");
                        this.cmd("SetTextColor", this.costTableID[k][j], "#000000");
                        this.cmd("SetTextColor", this.costTableID[i][j], "#000000");
                        this.cmd("Disconnect", this.node1ID, this.node2ID);
                        this.cmd("Disconnect", this.node2ID, this.node3ID);
                        this.cmd("Disconnect", this.node1ID, this.node3ID);
                        this.cmd("SetHighlight", this.costTableID[i][k], 0);
                        this.cmd("SetHighlight", this.costTableID[k][j], 0);
                        this.cmd("SetHighlight", this.costTableID[i][j], 0);
                    }
                }
            }
        }
        this.cmd("Delete", this.node1ID);
        this.cmd("Delete", this.node2ID);
        this.cmd("Delete", this.node3ID);
        this.cmd("Delete", messageID);
        this.nextIndex = oldIndex;
        return this.commands;
    }
};
