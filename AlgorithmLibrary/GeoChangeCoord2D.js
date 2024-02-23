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
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL David Galles OR
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
/* globals Geometric, Matrix */
/* exported GeoChangeCoord2D */
///////////////////////////////////////////////////////////////////////////////


class GeoChangeCoord2D extends Geometric {
    XAxisYPos = 300;
    XAxisStart = 100;
    XAxisEnd = 700;

    MATRIX_ELEM_WIDTH = 50;
    MATRIX_ELEM_HEIGHT = 15;

    MATRIX_MULTIPLY_SPACING = 10;
    EQUALS_SPACING = 30;

    ROBOT_MATRIX_START_X = 10 + 2 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING;
    ROBOT_MATRIX_START_Y = 30;

    HAND_MATRIX_START_X = 10 + 2 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING;
    HAND_MATRIX_START_Y = 10 + 25 + 20 + 3 * this.MATRIX_ELEM_HEIGHT;

    ROBOT_POSITION_START_X = this.ROBOT_MATRIX_START_X + 4 * this.MATRIX_ELEM_WIDTH + 100;
    HAND_POSITION_START_X = this.HAND_MATRIX_START_X + 4 * this.MATRIX_ELEM_WIDTH + 100;

    ROBOT_POSITION_START_Y = this.ROBOT_MATRIX_START_Y;
    HAND_POSITION_START_Y = this.HAND_MATRIX_START_Y;

    YAxisXPos = 400;
    YAxisStart = 100;
    YAxisEnd = 500;

    ROBOT_POINTS = [
        [-15, 100], [15, 100], [15, 80], [30, 80], [30, -10], [15, -10], [15, -100], [0, -100],
        [0, -30], [0, -100], [-15, -100], [-15, -10], [-30, -10], [-30, 80], [-15, 80],
    ];

    HAND_POINTS = [[0, 0], [-10, 0], [-10, 10], [-6, 10], [-6, 6], [6, 6], [6, 10], [10, 10], [10, 0]];

    ROBOT_HAND_ATTACH_POINT = [0, 40];

    ROBOT_MATRIX_VALUES = [
        [[Math.cos(Math.PI / 8), Math.sin(Math.PI / 8)], [-Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)]],
        [[Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)], [-Math.sin(Math.PI / 4), Math.cos(Math.PI / 4)]],
        [[Math.cos(0), Math.sin(0)], [-Math.sin(0), Math.cos(0)]],
        [[Math.cos(3 * Math.PI / 4), Math.sin(3 * Math.PI / 4)], [-Math.sin(3 * Math.PI / 4), Math.cos(3 * Math.PI / 4)]],
    ];

    ROBOT_POSITION_VALUES = [[75, 50], [200, 100], [100, 100], [100, 200]];

    HAND_MATRIX_VALUES = [
        [[Math.cos(-Math.PI / 6), Math.sin(-Math.PI / 6)], [-Math.sin(-Math.PI / 6), Math.cos(-Math.PI / 6)]],
        [[Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)], [-Math.sin(Math.PI / 4), Math.cos(-Math.PI / 4)]],
        [[Math.cos(0), Math.sin(0)], [-Math.sin(0), Math.cos(0)]],
        [[Math.cos(Math.PI / 2), Math.sin(Math.PI / 2)], [-Math.sin(Math.PI / 2), Math.cos(Math.PI / 2)]],
    ];

    HAND_POSITION_VALUES = [[80, 30], [30, 90], [100, 100], [-50, -20]];

    AXIS_CENTER = [[750, 470], [750, 150], [100, 550]];

    AXIS_COLOR_0 = "#990000";
    AXIS_COLOR_1 = "#009900";
    AXIS_COLOR_2 = "#000099";

    LOCAL_VERTEX_FOREGORUND_COLOR = "#000000";
    LOCAL_VERTEX_BACKGROUND_COLOR = this.LOCAL_VERTEX_FOREGORUND_COLOR;
    LOCAL_EDGE_COLOR = "#000000";

    GLOBAL_VERTEX_FOREGORUND_COLOR = "#00FF00";
    GLOBAL_VERTEX_BACKGROUND_COLOR = this.GLOBAL_VERTEX_FOREGORUND_COLOR;
    GLOBAL_EDGE_COLOR = "#00FF00";

    TRANSFORMED_VERTEX_FOREGORUND_COLOR = "#66FF66";
    TRANSFORMED_VERTEX_BACKGROUND_COLOR = this.VERTEX_FOREGORUND_COLOR;
    TRANSFORMED_EDGE_COLOR = "#66FF66";

    TRANSFORMED_POINT_COLORS = ["#990000", "#009900", "#000099"];

    VECTOR_COLOR = "#FF0000";

    VERTEX_WIDTH = 3;
    VERTEX_HEIGHT = this.VERTEX_WIDTH;

    constructor(am) {
        super();
        this.init(am);
    }

    init(am) {
        super.init(am);
        this.rowMajor = true;
        this.posYUp = true;
        this.rotateFirst = true;
        this.addControls();
        this.currentShape = 0;

        this.commands = [];
        this.nextIndex = 0;

        this.PositionIndex = 0;

        this.RobotPositionValues = this.ROBOT_POSITION_VALUES[this.PositionIndex];
        this.RobotMatrixValues = this.ROBOT_MATRIX_VALUES[this.PositionIndex];
        this.HandPositionValues = this.HAND_POSITION_VALUES[this.PositionIndex];
        this.HandMatrixValues = this.HAND_MATRIX_VALUES[this.PositionIndex];

        this.setupAxis();

        this.robotLabel1ID = this.nextIndex++;
        this.handLabel1ID = this.nextIndex++;
        this.robotLabel2ID = this.nextIndex++;
        this.handLabel2ID = this.nextIndex++;

        this.cmd("CreateLabel", this.robotLabel1ID, "Robot Space to World Space\n(Orientation)", this.ROBOT_MATRIX_START_X, this.ROBOT_MATRIX_START_Y - 25, 0);
        this.cmd("SetForegroundColor", this.robotLabel1ID, "#0000FF");

        this.cmd("CreateLabel", this.robotLabel2ID, "Robot Space to World Space\n(Position)", this.ROBOT_POSITION_START_X, this.ROBOT_MATRIX_START_Y - 25, 0);
        this.cmd("SetForegroundColor", this.robotLabel2ID, "#0000FF");

        this.RobotMatrix = this.createMatrix(this.RobotMatrixValues, this.ROBOT_MATRIX_START_X, this.ROBOT_MATRIX_START_Y);
        this.resetMatrixLabels(this.RobotMatrix);
        this.HandMatrix = this.createMatrix(this.HandMatrixValues, this.HAND_MATRIX_START_X, this.HAND_MATRIX_START_Y);
        this.resetMatrixLabels(this.HandMatrix);

        this.cmd("CreateLabel", this.handLabel1ID, "Hand Space to Robot Space\n(Orientation)", this.HAND_MATRIX_START_X, this.HAND_MATRIX_START_Y - 25, 0);
        this.cmd("SetForegroundColor", this.handLabel1ID, "#0000FF");

        this.cmd("CreateLabel", this.handLabel2ID, "Hand Space to Robot Space\n(Position)", this.HAND_POSITION_START_X, this.HAND_MATRIX_START_Y - 25, 0);
        this.cmd("SetForegroundColor", this.handLabel2ID, "#0000FF");

        this.RobotPosition = this.createMatrix([this.RobotPositionValues], this.ROBOT_POSITION_START_X, this.ROBOT_POSITION_START_Y);
        this.resetMatrixLabels(this.RobotMatrix);
        this.HandPosition = this.createMatrix([this.HandPositionValues], this.HAND_POSITION_START_X, this.HAND_POSITION_START_Y);
        this.resetMatrixLabels(this.HandMatrix);

        this.RobotPointWorldIDs = new Array(this.ROBOT_POINTS.length);
        this.RobotPointRobotIDs = new Array(this.ROBOT_POINTS.length);
        this.HandPointWorldIDs = new Array(this.HAND_POINTS.length);
        this.HandPointRobotIDs = new Array(this.HAND_POINTS.length);
        this.HandPointHandIDs = new Array(this.HAND_POINTS.length);
        this.RobotHandAttachRobotID = this.nextIndex++;
        this.RobotHandAttachWorldID = this.nextIndex++;
        for (let i = 0; i < this.ROBOT_POINTS.length; i++) {
            this.RobotPointWorldIDs[i] = this.nextIndex++;
            this.RobotPointRobotIDs[i] = this.nextIndex++;
        }
        for (let i = 0; i < this.HAND_POINTS.length; i++) {
            this.HandPointWorldIDs[i] = this.nextIndex++;
            this.HandPointRobotIDs[i] = this.nextIndex++;
            this.HandPointHandIDs[i] = this.nextIndex++;
        }

        this.savedNextIndex = this.nextIndex;
        this.setupObjects();
        this.setupObjectGraphic();

        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
        this.clearHistory();
        this.animationManager.setAllLayers([0, 1]);
        this.lastLocalToGlobal = true;
        this.oldIDs = [];
    }

    addAxis(origin, x1, x2, y1, y2, color) {
        const idArray = [];
        const originID = this.nextIndex++;
        idArray.push(originID);
        this.cmd("CreateRectangle", originID, "", 0, 0, origin[0], origin[1]);
        this.cmd("SetAlpha", originID, 0);

        let axisID = this.nextIndex++;
        this.cmd("CreateRectangle", axisID, "", 0, 0, x1[0], x1[1]);
        this.cmd("SetAlpha", axisID, 0);
        this.cmd("Connect", originID, axisID, color, 0, 1, "");
        idArray.push(axisID);

        axisID = this.nextIndex++;
        this.cmd("CreateRectangle", axisID, "", 0, 0, x2[0], x2[1]);
        this.cmd("SetAlpha", axisID, 0);
        this.cmd("Connect", originID, axisID, color, 0, 1, "");
        idArray.push(axisID);

        axisID = this.nextIndex++;
        this.cmd("CreateRectangle", axisID, "", 0, 0, y1[0], y1[1]);
        this.cmd("SetAlpha", axisID, 0);
        this.cmd("Connect", originID, axisID, color, 0, 1, "");
        idArray.push(axisID);

        axisID = this.nextIndex++;
        this.cmd("CreateRectangle", axisID, "", 0, 0, y2[0], y2[1]);
        this.cmd("SetAlpha", axisID, 0);
        this.cmd("Connect", originID, axisID, color, 0, 1, "");
        idArray.push(axisID);

        let labelID = this.nextIndex++;
        this.cmd("CreateLabel", labelID, "+y", y2[0] - 10, y2[1] + 10);
        this.cmd("SetForegroundColor", labelID, color);
        idArray.push(labelID);

        labelID = this.nextIndex++;
        this.cmd("CreateLabel", labelID, "+x", x2[0] - 10, x2[1] + 10);
        this.cmd("SetForegroundColor", labelID, color);
        idArray.push(labelID);
        return idArray;
    }

    transformPoint(point, matrix, position) {
        return this.add(this.multiply([point], matrix), [position])[0];
    }

    setupExtraAxes() {
        const robotOrigin = this.RobotPositionValues;
        let x1 = this.transformPoint([-150, 0], this.RobotMatrixValues, this.RobotPositionValues);
        let x2 = this.transformPoint([150, 0], this.RobotMatrixValues, this.RobotPositionValues);
        let y1 = this.transformPoint([0, -150], this.RobotMatrixValues, this.RobotPositionValues);
        let y2 = this.transformPoint([0, 150], this.RobotMatrixValues, this.RobotPositionValues);

        this.otherAxes = [];

        let tmpAxis = this.addAxis(this.worldToScreenSpace(robotOrigin, 2),
            this.worldToScreenSpace(x1, 2),
            this.worldToScreenSpace(x2, 2),
            this.worldToScreenSpace(y1, 2),
            this.worldToScreenSpace(y2, 2),
            this.AXIS_COLOR_1);

        this.otherAxes.push(tmpAxis);

        for (let i = 0; i < tmpAxis.length; i++) {
            this.cmd("SetLayer", tmpAxis[i], 1);
        }
        this.setAxisAlpha(tmpAxis, 0.5);

        let handOrigin = this.HandPositionValues;
        x1 = this.transformPoint([-150, 0], this.HandMatrixValues, this.HandPositionValues);
        x2 = this.transformPoint([150, 0], this.HandMatrixValues, this.HandPositionValues);
        y1 = this.transformPoint([0, -150], this.HandMatrixValues, this.HandPositionValues);
        y2 = this.transformPoint([0, 150], this.HandMatrixValues, this.HandPositionValues);

        tmpAxis = this.addAxis(this.worldToScreenSpace(handOrigin, 1),
            this.worldToScreenSpace(x1, 1),
            this.worldToScreenSpace(x2, 1),
            this.worldToScreenSpace(y1, 1),
            this.worldToScreenSpace(y2, 1),
            this.AXIS_COLOR_0);

        for (let i = 0; i < tmpAxis.length; i++) {
            this.cmd("SetLayer", tmpAxis[i], 1);
        }
        this.setAxisAlpha(tmpAxis, 0.5);

        this.otherAxes.push(tmpAxis);

        handOrigin = this.transformPoint(handOrigin, this.RobotMatrixValues, this.RobotPositionValues);
        x1 = this.transformPoint(x1, this.RobotMatrixValues, this.RobotPositionValues);
        x2 = this.transformPoint(x2, this.RobotMatrixValues, this.RobotPositionValues);
        y1 = this.transformPoint(y1, this.RobotMatrixValues, this.RobotPositionValues);
        y2 = this.transformPoint(y2, this.RobotMatrixValues, this.RobotPositionValues);

        tmpAxis = this.addAxis(this.worldToScreenSpace(handOrigin, 2),
            this.worldToScreenSpace(x1, 2),
            this.worldToScreenSpace(x2, 2),
            this.worldToScreenSpace(y1, 2),
            this.worldToScreenSpace(y2, 2),
            this.AXIS_COLOR_0);
        for (let i = 0; i < tmpAxis.length; i++) {
            this.cmd("SetLayer", tmpAxis[i], 1);
        }

        this.setAxisAlpha(tmpAxis, 0.5);

        this.otherAxes.push(tmpAxis);
    }

    setupAxis() {
        this.axisHand = this.addAxis(this.worldToScreenSpace([0, 0], 0),
            this.worldToScreenSpace([-150, 0], 0),
            this.worldToScreenSpace([150, 0], 0),
            this.worldToScreenSpace([0, -150], 0),
            this.worldToScreenSpace([0, 150], 0),
            this.AXIS_COLOR_0);
        this.setAxisAlpha(this.axisHand, 0.5);

        this.axisRobot = this.addAxis(this.worldToScreenSpace([0, 0], 1),
            this.worldToScreenSpace([-150, 0], 1),
            this.worldToScreenSpace([150, 0], 1),
            this.worldToScreenSpace([0, -150], 1),
            this.worldToScreenSpace([0, 150], 1),
            this.AXIS_COLOR_1);
        this.setAxisAlpha(this.axisRobot, 0.5);

        this.axisWorld = this.addAxis(this.worldToScreenSpace([0, 0], 2),
            this.worldToScreenSpace([-50, 0], 2),
            this.worldToScreenSpace([400, 0], 2),
            this.worldToScreenSpace([0, -50], 2),
            this.worldToScreenSpace([0, 400], 2),
            this.AXIS_COLOR_2);
        this.setAxisAlpha(this.axisWorld, 0.5);

        this.setupExtraAxes();
    }

    setAxisAlpha(axisList, newAlpha) {
        for (let i = 0; i < axisList.length; i++) {
            this.cmd("SetAlpha", axisList[i], newAlpha);
            if (i > 0) {
                this.cmd("SetEdgeAlpha", axisList[0], axisList[i], newAlpha);
            }
        }
    }

    setupObjects() {
        let point;
        for (let i = 0; i < this.ROBOT_POINTS.length; i++) {
            point = this.worldToScreenSpace(this.ROBOT_POINTS[i], 1);
            this.cmd("CreateRectangle", this.RobotPointRobotIDs[i], "", 0, 0, point[0], point[1]);
            if (i > 0) {
                this.cmd("Connect", this.RobotPointRobotIDs[i - 1], this.RobotPointRobotIDs[i], "#000000", 0, 0);
            }

            point = this.transformPoint(this.ROBOT_POINTS[i], this.RobotMatrixValues, this.RobotPositionValues);
            point = this.worldToScreenSpace(point, 2);

            this.cmd("CreateRectangle", this.RobotPointWorldIDs[i], "", 0, 0, point[0], point[1]);
            if (i > 0) {
                this.cmd("Connect", this.RobotPointWorldIDs[i - 1], this.RobotPointWorldIDs[i], "#000000", 0, 0);
            }
        }
        this.cmd("Connect", this.RobotPointRobotIDs[this.RobotPointRobotIDs.length - 1], this.RobotPointRobotIDs[0], "#000000", 0, 0);
        this.cmd("Connect", this.RobotPointWorldIDs[this.RobotPointWorldIDs.length - 1], this.RobotPointWorldIDs[0], "#000000", 0, 0);

        for (let i = 0; i < this.HAND_POINTS.length; i++) {
            point = this.worldToScreenSpace(this.HAND_POINTS[i], 0);
            this.cmd("CreateRectangle", this.HandPointHandIDs[i], "", 0, 0, point[0], point[1]);
            if (i > 0) {
                this.cmd("Connect", this.HandPointHandIDs[i - 1], this.HandPointHandIDs[i], "#000000", 0, 0);
            }

            point = this.transformPoint(this.HAND_POINTS[i], this.HandMatrixValues, this.HandPositionValues);
            const point2 = this.worldToScreenSpace(point, 1);

            this.cmd("CreateRectangle", this.HandPointRobotIDs[i], "", 0, 0, point2[0], point2[1]);
            if (i > 0) {
                this.cmd("Connect", this.HandPointRobotIDs[i - 1], this.HandPointRobotIDs[i], "#000000", 0, 0);
            }

            point = this.transformPoint(point, this.RobotMatrixValues, this.RobotPositionValues);
            point = this.worldToScreenSpace(point, 2);

            this.cmd("CreateRectangle", this.HandPointWorldIDs[i], "", 0, 0, point[0], point[1]);
            if (i > 0) {
                this.cmd("Connect", this.HandPointWorldIDs[i - 1], this.HandPointWorldIDs[i], "#000000", 0, 0);
            }
        }

        this.cmd("Connect", this.HandPointHandIDs[this.HandPointHandIDs.length - 1], this.HandPointHandIDs[0], "#000000", 0, 0);
        this.cmd("Connect", this.HandPointRobotIDs[this.HandPointRobotIDs.length - 1], this.HandPointRobotIDs[0], "#000000", 0, 0);
        this.cmd("Connect", this.HandPointWorldIDs[this.HandPointWorldIDs.length - 1], this.HandPointWorldIDs[0], "#000000", 0, 0);

        point = this.worldToScreenSpace(this.ROBOT_HAND_ATTACH_POINT, 1);
        this.cmd("CreateRectangle", this.RobotHandAttachRobotID, "", 0, 0, point[0], point[1]);
        this.cmd("Connect", this.RobotHandAttachRobotID, this.HandPointRobotIDs[0], "#000000", 0, 0);

        point = this.transformPoint(this.ROBOT_HAND_ATTACH_POINT, this.RobotMatrixValues, this.RobotPositionValues);
        point = this.worldToScreenSpace(point, 2);
        this.cmd("CreateRectangle", this.RobotHandAttachWorldID, "", 0, 0, point[0], point[1]);
        this.cmd("Connect", this.RobotHandAttachWorldID, this.HandPointWorldIDs[0], "#000000", 0, 0);
    }

    worldToScreenSpace(point, space) {
        return [point[0] + this.AXIS_CENTER[space][0],
            -point[1] + this.AXIS_CENTER[space][1]];
    }

    removeOldIDs() {
        for (let i = 0; i < this.oldIDs.length; i++) {
            this.cmd("Delete", this.oldIDs[i]);
        }
        this.oldIDs = [];
    }

    setupObjectGraphic() {
    }

    addControls() {
        this.addLabelToAlgorithmBar("x");

        this.xField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.xField, "float", this.transformPointCallback.bind(this));

        this.addLabelToAlgorithmBar("y");

        this.yField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.yField, "float", this.transformPointCallback.bind(this));

        const transformButton = this.addControlToAlgorithmBar("Button", "Transform Point");
        transformButton.onclick = this.transformPointCallback.bind(this);

        const transformTypeButtonList = this.addRadioButtonGroupToAlgorithmBar(
            ["Hand Space -> World Space", "World Space -> Hand Space"],
            "Transform Type",
        );
        this.handToWorldButton = transformTypeButtonList[0];
        this.handToWorldButton.onclick = this.transformTypeChangedCallback.bind(this, false);

        this.worldToHandButton = transformTypeButtonList[1];
        this.worldToHandButton.onclick = this.transformTypeChangedCallback.bind(this, true);

        this.worldToHandButton.checked = this.lastLocalToGlobal;
        this.handToWorldButton.checked = !this.lastLocalToGlobal;

        const rankTypeButtonList = this.addRadioButtonGroupToAlgorithmBar(
            ["Row Major", "Column Major"],
            "RankType",
        );
        this.rowMajorButton = rankTypeButtonList[0];
        this.rowMajorButton.onclick = this.changeRowColMajorCallback.bind(this, true);

        this.colMajorButton = rankTypeButtonList[1];
        this.colMajorButton.onclick = this.changeRowColMajorCallback.bind(this, false);

        this.rowMajorButton.checked = this.rowMajor;
        this.colMajorButton.checked = !this.rowMajor;

        this.showAxisBox = this.addCheckboxToAlgorithmBar("Show all axes");
        this.showAxisBox.onclick = this.showAllAxesCallback.bind(this);
        this.showAxisBox.checked = true;

        const moveObjectsButton = this.addControlToAlgorithmBar("Button", "Move Objects");
        moveObjectsButton.onclick = this.moveObjectsCallback.bind(this);
    }

    showAllAxesCallback() {
        if (this.showAxisBox.checked) {
            this.animationManager.setAllLayers([0, 1]);
        } else {
            this.animationManager.setAllLayers([0]);
        }
    }

    reset() {
        this.rowMajor = true;
        this.rowMajorButton.checked = this.rowMajor;
        this.nextIndex = this.savedNextIndex;
    }

    transformTypeChangedCallback(globalToLocal) {
        if (this.lastLocalToGlobal === globalToLocal) {
            this.implementAction(this.changeTransformType.bind(this, globalToLocal));
        }
    }

    changeRowColMajorCallback(rowMajor) {
        if (this.rowMajor !== rowMajor) {
            this.implementAction(this.changeRowCol.bind(this), rowMajor);
        }
    }

    transposeVisual(matrix) {
        if (matrix.data.length === matrix.data[0].length) {
            const matrixSize = matrix.data.length;
            const moveLabels = [];
            for (let i = 1; i < matrixSize; i++) {
                for (let j = 0; j <= i; j++) {
                    this.cmd("SetText", matrix.dataID[i][j], "");
                    this.cmd("SetText", matrix.dataID[j][i], "");
                    const moveLabel1 = this.nextIndex++;
                    const moveLabel2 = this.nextIndex++;
                    moveLabels.push(moveLabel1);
                    moveLabels.push(moveLabel2);
                    this.cmd("CreateLabel", moveLabel1,
                        matrix.data[i][j], matrix.x + this.MATRIX_ELEM_WIDTH / 2 + i * this.MATRIX_ELEM_WIDTH,
                        matrix.y + this.MATRIX_ELEM_HEIGHT / 2 + j * this.MATRIX_ELEM_HEIGHT);
                    this.cmd("CreateLabel", moveLabel2,
                        matrix.data[j][i], matrix.x + this.MATRIX_ELEM_WIDTH / 2 + j * this.MATRIX_ELEM_WIDTH,
                        matrix.y + this.MATRIX_ELEM_HEIGHT / 2 + i * this.MATRIX_ELEM_HEIGHT);
                    this.cmd("Move", moveLabel1, matrix.x + this.MATRIX_ELEM_WIDTH / 2 + j * this.MATRIX_ELEM_WIDTH,
                        matrix.y + this.MATRIX_ELEM_HEIGHT / 2 + i * this.MATRIX_ELEM_HEIGHT);
                    this.cmd("Move", moveLabel2, matrix.x + this.MATRIX_ELEM_WIDTH / 2 + i * this.MATRIX_ELEM_WIDTH,
                        matrix.y + this.MATRIX_ELEM_HEIGHT / 2 + j * this.MATRIX_ELEM_HEIGHT);
                    const tmp = matrix.data[i][j];
                    matrix.data[i][j] = matrix.data[j][i];
                    matrix.data[j][i] = tmp;
                }
            }
            this.cmd("Step");
            for (let i = 0; i < moveLabels.length; i++) {
                this.cmd("Delete", moveLabels[i]);
            }
            this.resetMatrixLabels(matrix);
            return matrix;
        } else {
            const savedData = matrix.data;
            const newData = new Array(savedData[0].length);
            for (let i = 0; i < savedData[0].length; i++) {
                newData[i] = [];
            }
            for (let i = 0; i < savedData.length; i++) {
                for (let j = 0; j < savedData[0].length; j++) {
                    newData[j][i] = savedData[i][j];
                }
            }
            const newMatrix = this.createMatrix(newData, matrix.x, matrix.y);
            this.deleteMatrix(matrix);
            return newMatrix;
        }
    }

    changeRowCol(rowMajor) {
        this.commands = [];
        this.rowMajor = rowMajor;
        if (this.rowMajorButton.checked !== this.rowMajor) {
            this.rowMajorButton.checked = this.rowMajor;
        }
        if (this.colMajorButton.checked === this.rowMajor) {
            this.colMajorButton.checked = !this.rowMajor;
        }
        this.removeOldIDs();
        this.RobotMatrix = this.transposeVisual(this.RobotMatrix);
        this.RobotPosition = this.transposeVisual(this.RobotPosition);
        this.HandMatrix = this.transposeVisual(this.HandMatrix);
        this.HandPosition = this.transposeVisual(this.HandPosition);
        return this.commands;
    }

    fixNumber(value, defaultVal) {
        value = parseFloat(value);
        if (isNaN(value)) value = defaultVal;
        return value;
    }

    transformPointCallback() {
        this.xField.value = this.fixNumber(this.xField.value, 0);
        this.yField.value = this.fixNumber(this.yField.value, 0);
        this.implementAction(this.doPointTransform.bind(this), `${this.xField.value};${this.yField.value}`);
    }

    doPointTransform(params) {
        if (this.lastLocalToGlobal) {
            return this.localToGlobal(params);
        } else {
            return this.globalToLocal(params);
        }
    }

    rotatePoint(point, matrix, xPos, yPos, fromSpace, toSpace) {
        const descriptLabel = this.nextIndex++;
        // this.oldIDs.push(descriptLabel);
        this.cmd("CreateLabel", descriptLabel, "", xPos + 2 * this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING,
            yPos + 2 * this.MATRIX_ELEM_HEIGHT + 3, 0);

        let inertialPositionMatrix;
        if (this.rowMajor) {
            inertialPositionMatrix = this.createMatrix([["", ""]], xPos + 2 * this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING,
                yPos);
        } else {
            inertialPositionMatrix = this.createMatrix([[""], [""]],
                xPos + 3 * this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING + this.MATRIX_MULTIPLY_SPACING,
                yPos);
        }
        const equalLabel1 = this.nextIndex++;
        this.oldIDs.push(equalLabel1);

        let opX, opY;
        if (this.rowMajor) {
            opX = xPos + 2 * this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING / 2;
            opY = yPos + this.MATRIX_ELEM_HEIGHT / 2;
        } else {
            opX = xPos + 3 * this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING / 2 + this.MATRIX_MULTIPLY_SPACING;
            opY = yPos + this.MATRIX_ELEM_HEIGHT;
        }
        this.cmd("CreateLabel", equalLabel1, "=", opX, opY);
        if (this.rowMajor) {
            this.multiplyMatrix(point, matrix, inertialPositionMatrix, descriptLabel);
        } else {
            this.multiplyMatrix(matrix, point, inertialPositionMatrix, descriptLabel);
        }
        this.addMatrixIDsToList(inertialPositionMatrix, this.oldIDs);
        this.cmd("Delete", descriptLabel);
        const inertialPositionID = this.nextIndex++;
        let logicalPoint;
        if (this.rowMajor) {
            logicalPoint = inertialPositionMatrix.data[0].slice(0);
        } else {
            logicalPoint = [inertialPositionMatrix.data[0][0], inertialPositionMatrix.data[1][0]];
        }
        const screenPoint = this.worldToScreenSpace(logicalPoint, fromSpace);

        this.cmd("CreateCircle", inertialPositionID, "", screenPoint[0], screenPoint[1]);
        this.cmd("SetWidth", inertialPositionID, this.VERTEX_WIDTH);

        const originID = this.nextIndex++;
        this.oldIDs.push(originID);
        const origin = this.worldToScreenSpace([0, 0], fromSpace);

        this.cmd("CreateRectangle", originID, "", 0, 0, origin[0], origin[1]);
        this.cmd("Connect", originID, inertialPositionID, this.TRANSFORMED_POINT_COLORS[toSpace], 0, 1, "");
        return [inertialPositionMatrix, inertialPositionID, originID];
    }

    translatePoint(point, transVector, xPos, yPos, fromSpace, toSpace, pointID) {
        const logicalPoint = new Array(2);

        let robotPositionMatrix;
        if (this.rowMajor) {
            logicalPoint[0] = point.data[0][0] + transVector.data[0][0];
            logicalPoint[1] = point.data[0][1] + transVector.data[0][1];
            robotPositionMatrix = this.createMatrix([["", ""]], xPos + 2 * this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING,
                yPos);
        } else {
            logicalPoint[0] = point.data[0][0] + transVector.data[0][0];
            logicalPoint[1] = point.data[1][0] + transVector.data[1][0];
            robotPositionMatrix = this.createMatrix([[""], [""]], xPos + this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING,
                yPos);
        }

        const addLabel1 = this.nextIndex++;
        const equalLabel3 = this.nextIndex++;
        this.oldIDs.push(addLabel1);
        this.oldIDs.push(equalLabel3);

        let opX, opY, op2X, op2Y;
        if (this.rowMajor) {
            opX = xPos + 2 * this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING / 2;
            opY = yPos + this.MATRIX_ELEM_HEIGHT / 2;
            op2X = xPos - this.EQUALS_SPACING / 2;
            op2Y = yPos + this.MATRIX_ELEM_HEIGHT / 2;
        } else {
            opX = xPos + this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING / 2;
            opY = yPos + this.MATRIX_ELEM_HEIGHT;
            op2X = xPos - this.EQUALS_SPACING / 2;
            op2Y = yPos + this.MATRIX_ELEM_HEIGHT;
        }
        this.cmd("CreateLabel", equalLabel3, "=", opX, opY);
        this.cmd("CreateLabel", addLabel1, "+", op2X, op2Y);

        this.addMatrix(point, transVector, robotPositionMatrix);
        this.addMatrixIDsToList(robotPositionMatrix, this.oldIDs);

        const screenPoint = this.worldToScreenSpace(logicalPoint, fromSpace);

        const robotPositionID = this.nextIndex++;

        this.cmd("CreateCircle", robotPositionID, "", screenPoint[0], screenPoint[1]);
        this.cmd("SetWidth", robotPositionID, this.VERTEX_WIDTH);

        this.cmd("Connect", pointID, robotPositionID, this.TRANSFORMED_POINT_COLORS[toSpace], 0, 1, "");
        this.cmd("Step");

        const originID = this.nextIndex++;
        this.oldIDs.push(originID);
        const origin = this.worldToScreenSpace([0, 0], fromSpace);

        this.cmd("CreateCircle", originID, "", origin[0], origin[1]);
        this.cmd("SetWidth", originID, 0);
        this.cmd("SetAlpha", originID, 0);

        this.cmd("Connect", originID, robotPositionID, this.TRANSFORMED_POINT_COLORS[toSpace], 0, 1, "");

        return [robotPositionMatrix, robotPositionID, originID];
    }

    addMultiply(position, transVector, rotMatrix, transX, transY, rotX, rotY, initialPointID, fromSpace, toSpace) {
        const translateMatrixAndPointID = this.translatePoint(position, transVector, transX, transY, fromSpace, toSpace, initialPointID);
        const newPosition = translateMatrixAndPointID[0];
        const pointID = translateMatrixAndPointID[1];
        // const originID = translateMatrixAndPointID[2];

        this.cmd("Step");

        this.cmd("Disconnect", initialPointID, pointID);

        if (this.rowMajor) {
            this.moveMatrix(newPosition, rotX - 2 * this.MATRIX_ELEM_WIDTH - this.MATRIX_MULTIPLY_SPACING, transY);
        } else {
            this.moveMatrix(newPosition, rotX + 2 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING, transY);
        }

        const rotateMatrixAndPointID = this.rotatePoint(newPosition, rotMatrix, rotX, rotY, fromSpace, toSpace);
        this.cmd("Delete", pointID);
        this.cmd("Step");

        const robotPositionMatrix = rotateMatrixAndPointID[0];
        const robotPositionID = rotateMatrixAndPointID[1];
        const movingOriginID = rotateMatrixAndPointID[2];

        const origin = this.worldToScreenSpace([0, 0], toSpace);
        this.cmd("Move", movingOriginID, origin[0], origin[1]);

        let logicalPoint;
        if (this.rowMajor) {
            logicalPoint = robotPositionMatrix.data[0].slice(0);
        } else {
            logicalPoint = [robotPositionMatrix.data[0][0], robotPositionMatrix.data[1][0]];
        }
        const screenPoint = this.worldToScreenSpace(logicalPoint, toSpace);
        this.cmd("Move", robotPositionID, screenPoint[0], screenPoint[1]);
        this.cmd("Step");

        this.oldIDs.push(robotPositionID);
        return [robotPositionMatrix, robotPositionID];
    }

    multiplyAdd(position, rotMatrix, transVector, rotX, rotY, transX, transY, fromSpace, toSpace) {
        const rotateMatrixAndPointID = this.rotatePoint(position, rotMatrix, rotX, rotY, fromSpace, toSpace);
        const inertialPositionMatrix = rotateMatrixAndPointID[0];
        const inertialPositionID = rotateMatrixAndPointID[1];
        this.cmd("Step");

        if (this.rowMajor) {
            this.moveMatrix(inertialPositionMatrix, transX - 2 * this.MATRIX_ELEM_WIDTH - this.EQUALS_SPACING, transY);
        } else {
            this.moveMatrix(inertialPositionMatrix, transX - this.MATRIX_ELEM_WIDTH - this.EQUALS_SPACING, transY);
        }

        const translateMatrixAndPointID = this.translatePoint(inertialPositionMatrix, transVector, transX, transY, fromSpace, toSpace, inertialPositionID);
        const robotPositionMatrix = translateMatrixAndPointID[0];
        const robotPositionID = translateMatrixAndPointID[1];
        const movingOriginID = translateMatrixAndPointID[2];

        this.oldIDs.push(robotPositionID);

        let logicalPoint;
        if (this.rowMajor) {
            logicalPoint = robotPositionMatrix.data[0].slice(0);
        } else {
            logicalPoint = [robotPositionMatrix.data[0][0], robotPositionMatrix.data[1][0]];
        }
        this.cmd("Step");

        this.cmd("Delete", inertialPositionID);
        const origin = this.worldToScreenSpace([0, 0], toSpace);
        this.cmd("Move", movingOriginID, origin[0], origin[1]);
        const screenPoint = this.worldToScreenSpace(logicalPoint, toSpace);
        this.cmd("Move", robotPositionID, screenPoint[0], screenPoint[1]);

        this.cmd("Step");
        return robotPositionMatrix;
    }

    localToGlobal(params) {
        this.commands = [];
        this.removeOldIDs();

        const paramList = params.split(";");
        const x = parseFloat(paramList[0]);
        const y = parseFloat(paramList[1]);

        const screenPoint = this.worldToScreenSpace([x, y], 0);

        const pointInHandSpaceID = this.nextIndex++;
        this.oldIDs.push(pointInHandSpaceID);

        this.cmd("CreateCircle", pointInHandSpaceID, "", screenPoint[0], screenPoint[1]);
        this.cmd("SetWidth", pointInHandSpaceID, this.VERTEX_WIDTH);

        this.cmd("Connect", this.axisHand[0], pointInHandSpaceID, this.TRANSFORMED_POINT_COLORS[0], 0, 1, "");

        let initialPointMatrix;
        if (this.rowMajor) {
            initialPointMatrix = this.createMatrix([[x, y]], this.HAND_MATRIX_START_X - 2 * this.MATRIX_ELEM_WIDTH - this.MATRIX_MULTIPLY_SPACING, this.HAND_MATRIX_START_Y);
        } else {
            initialPointMatrix = this.createMatrix([[x], [y]], this.HAND_MATRIX_START_X + 2 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING, this.HAND_MATRIX_START_Y);
        }
        this.addMatrixIDsToList(initialPointMatrix, this.oldIDs);
        this.cmd("Step");

        const robotPositionMatrix = this.multiplyAdd(initialPointMatrix, this.HandMatrix, this.HandPosition,
            this.HAND_MATRIX_START_X, this.HAND_MATRIX_START_Y,
            this.HAND_POSITION_START_X, this.HAND_POSITION_START_Y,
            0, 1);

        if (this.rowMajor) {
            this.moveMatrix(robotPositionMatrix, this.ROBOT_MATRIX_START_X - 2 * this.MATRIX_ELEM_WIDTH - this.MATRIX_MULTIPLY_SPACING,
                this.ROBOT_MATRIX_START_Y);
        } else {
            this.moveMatrix(robotPositionMatrix, this.ROBOT_MATRIX_START_X + 2 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING,
                this.ROBOT_MATRIX_START_Y);
        }

        this.multiplyAdd(robotPositionMatrix, this.RobotMatrix, this.RobotPosition,
            this.ROBOT_MATRIX_START_X, this.ROBOT_MATRIX_START_Y,
            this.ROBOT_POSITION_START_X, this.ROBOT_POSITION_START_Y,
            1, 2);

        return this.commands;
    }

    changeTransformType(globalToLocal) {
        this.commands = [];
        this.lastLocalToGlobal = !globalToLocal;
        this.removeOldIDs();
        if (globalToLocal) {
            this.cmd("SetText", this.robotLabel1ID, "World Space to Robot Space\n(Orientation)");
        } else {
            this.cmd("SetText", this.robotLabel1ID, "Robot Space to World Space\n(Orientation)");
        }
        this.cmd("Step");
        this.RobotMatrix = this.transposeVisual(this.RobotMatrix);

        if (globalToLocal) {
            this.cmd("SetText", this.robotLabel2ID, "World Space to Robot Space\n(Position)");
        } else {
            this.cmd("SetText", this.robotLabel2ID, "Robot Space to World Space\n(Position)");
        }
        this.cmd("Step");
        this.negateMatrixVisual(this.RobotPosition);
        this.cmd("Step");

        if (globalToLocal) {
            this.cmd("SetText", this.handLabel1ID, "Robot Space to Hand Space\n(Orientation)");
        } else {
            this.cmd("SetText", this.handLabel1ID, "Hand Space to Robot Space\n(Orientation)");
        }

        this.cmd("Step");
        this.HandMatrix = this.transposeVisual(this.HandMatrix);

        if (globalToLocal) {
            this.cmd("SetText", this.handLabel2ID, "Robot Space to Hand Space\n(Position)");
        } else {
            this.cmd("SetText", this.handLabel2ID, "Hand Space to Robot Space\n(Position)");
        }
        this.cmd("Step");
        this.negateMatrixVisual(this.HandPosition);
        this.cmd("Step");

        if (globalToLocal) {
            this.cmd("Move", this.robotLabel1ID, this.ROBOT_POSITION_START_X, this.ROBOT_POSITION_START_Y - 25);
            this.moveMatrix(this.RobotMatrix, this.ROBOT_POSITION_START_X, this.ROBOT_POSITION_START_Y);

            this.cmd("Move", this.robotLabel2ID, this.ROBOT_MATRIX_START_X + this.EQUALS_SPACING, this.ROBOT_MATRIX_START_Y - 25);
            this.moveMatrix(this.RobotPosition, this.ROBOT_MATRIX_START_X + this.EQUALS_SPACING, this.ROBOT_MATRIX_START_Y);

            this.cmd("Move", this.handLabel1ID, this.HAND_POSITION_START_X, this.HAND_POSITION_START_Y - 25);
            this.moveMatrix(this.HandMatrix, this.HAND_POSITION_START_X, this.HAND_POSITION_START_Y);

            this.cmd("Move", this.handLabel2ID, this.HAND_MATRIX_START_X + this.EQUALS_SPACING, this.HAND_MATRIX_START_Y - 25);
            this.moveMatrix(this.HandPosition, this.HAND_MATRIX_START_X + this.EQUALS_SPACING, this.HAND_MATRIX_START_Y);
        } else {
            this.cmd("Move", this.robotLabel1ID, this.ROBOT_MATRIX_START_X, this.ROBOT_MATRIX_START_Y - 25);
            this.moveMatrix(this.RobotMatrix, this.ROBOT_MATRIX_START_X, this.ROBOT_MATRIX_START_Y);

            this.cmd("Move", this.robotLabel2ID, this.ROBOT_POSITION_START_X, this.ROBOT_POSITION_START_Y - 25);
            this.moveMatrix(this.RobotPosition, this.ROBOT_POSITION_START_X, this.ROBOT_POSITION_START_Y);

            this.cmd("Move", this.handLabel1ID, this.HAND_MATRIX_START_X, this.HAND_MATRIX_START_Y - 25);
            this.moveMatrix(this.HandMatrix, this.HAND_MATRIX_START_X, this.HAND_MATRIX_START_Y);

            this.cmd("Move", this.handLabel2ID, this.HAND_POSITION_START_X, this.HAND_POSITION_START_Y - 25);
            this.moveMatrix(this.HandPosition, this.HAND_POSITION_START_X, this.HAND_POSITION_START_Y);
        }
        return this.commands;
    }

    negateMatrixVisual(matrix) {
        for (let i = 0; i < matrix.data.length; i++) {
            for (let j = 0; j < matrix.data[i].length; j++) {
                matrix.data[i][j] = -matrix.data[i][j];
            }
        }
        this.resetMatrixLabels(matrix);
    }

    globalToLocal(params) {
        this.commands = [];
        this.removeOldIDs();

        const paramList = params.split(";");
        const x = parseFloat(paramList[0]);
        const y = parseFloat(paramList[1]);

        const screenPoint = this.worldToScreenSpace([x, y], 2);

        const pointInWorldSpaceID = this.nextIndex++;
        this.oldIDs.push(pointInWorldSpaceID);
        this.cmd("CreateCircle", pointInWorldSpaceID, "", screenPoint[0], screenPoint[1]);
        this.cmd("SetWidth", pointInWorldSpaceID, this.VERTEX_WIDTH);
        this.cmd("Connect", this.axisWorld[0], pointInWorldSpaceID, this.TRANSFORMED_POINT_COLORS[2], 0, 1, "");

        let initialPointMatrix;
        if (this.rowMajor) {
            initialPointMatrix = this.createMatrix([[x, y]], this.ROBOT_MATRIX_START_X - 2 * this.MATRIX_ELEM_WIDTH,
                this.ROBOT_MATRIX_START_Y);
        } else {
            initialPointMatrix = this.createMatrix([[x], [y]], this.ROBOT_MATRIX_START_X - this.MATRIX_ELEM_WIDTH,
                this.ROBOT_MATRIX_START_Y);
        }
        this.addMatrixIDsToList(initialPointMatrix, this.oldIDs);
        this.cmd("Step");

        const positionAndID = this.addMultiply(initialPointMatrix, this.RobotPosition, this.RobotMatrix,
            this.ROBOT_MATRIX_START_X + this.EQUALS_SPACING, this.ROBOT_MATRIX_START_Y,
            this.ROBOT_POSITION_START_X, this.ROBOT_POSITION_START_Y,
            pointInWorldSpaceID,
            2, 1);

        const robotPositionMatrix = positionAndID[0];
        const newPositionID = positionAndID[1];

        if (this.rowMajor) {
            this.moveMatrix(robotPositionMatrix, this.HAND_MATRIX_START_X - 2 * this.MATRIX_ELEM_WIDTH,
                this.HAND_MATRIX_START_Y);
        } else {
            this.moveMatrix(robotPositionMatrix, this.HAND_MATRIX_START_X - this.MATRIX_ELEM_WIDTH,
                this.HAND_MATRIX_START_Y);
        }
        this.addMultiply(robotPositionMatrix, this.HandPosition, this.HandMatrix,
            this.HAND_MATRIX_START_X + this.EQUALS_SPACING, this.HAND_MATRIX_START_Y,
            this.HAND_POSITION_START_X, this.HAND_POSITION_START_Y,
            newPositionID,
            1, 0);
        return this.commands;
    }

    moveObjectsCallback() {
        this.implementAction(this.moveObjects.bind(this), 0);
    }

    moveObjects() {
        this.commands = [];
        this.removeOldIDs();

        for (let i = 0; i < this.otherAxes.length; i++) {
            for (let j = 0; j < this.otherAxes[i].length; j++) {
                this.cmd("Delete", this.otherAxes[i][j]);
            }
        }
        for (let i = 0; i < this.ROBOT_POINTS.length; i++) {
            this.cmd("Delete", this.RobotPointRobotIDs[i]);
            this.cmd("Delete", this.RobotPointWorldIDs[i]);
        }
        for (let i = 0; i < this.HAND_POINTS.length; i++) {
            this.cmd("Delete", this.HandPointHandIDs[i]);
            this.cmd("Delete", this.HandPointRobotIDs[i]);
            this.cmd("Delete", this.HandPointWorldIDs[i]);
        }
        this.cmd("Delete", this.RobotHandAttachRobotID);
        this.cmd("Delete", this.RobotHandAttachWorldID);
        this.PositionIndex++;
        if (this.PositionIndex >= this.ROBOT_POSITION_VALUES.length) {
            this.PositionIndex = 0;
        }

        this.RobotPositionValues = this.ROBOT_POSITION_VALUES[this.PositionIndex];
        this.RobotMatrixValues = this.ROBOT_MATRIX_VALUES[this.PositionIndex];
        this.HandPositionValues = this.HAND_POSITION_VALUES[this.PositionIndex];
        this.HandMatrixValues = this.HAND_MATRIX_VALUES[this.PositionIndex];

        this.setupExtraAxes();
        this.setupObjects();

        this.RobotPosition.data = [this.RobotPositionValues];
        this.RobotMatrix.data = this.RobotMatrixValues;
        this.HandPosition.data = [this.HandPositionValues];
        this.HandMatrix.data = this.HandMatrixValues;
        if (!this.rowMajor) {
            this.RobotPosition.transpose();
            this.RobotMatrix.transpose();
            this.HandPosition.transpose();
            this.HandMatrix.transpose();
        }
        this.resetMatrixLabels(this.RobotMatrix);
        this.resetMatrixLabels(this.RobotPosition);
        this.resetMatrixLabels(this.HandMatrix);
        this.resetMatrixLabels(this.HandPosition);
        return this.commands;
    }

    addMatrix(mat1, mat2, mat3) {
        for (let i = 0; i < mat1.data.length; i++) {
            for (let j = 0; j < mat1.data[i].length; j++) {
                this.cmd("SetHighlight", mat1.dataID[i][j], 1);
                this.cmd("SetHighlight", mat2.dataID[i][j], 1);
                this.cmd("Step");
                mat3.data[i][j] = this.standardize(mat1.data[i][j] + mat2.data[i][j]);
                this.cmd("SetHighlight", mat1.dataID[i][j], 0);
                this.cmd("SetHighlight", mat2.dataID[i][j], 0);
                this.cmd("SetText", mat3.dataID[i][j], mat3.data[i][j]);
                this.cmd("Step");
            }
        }
    }

    multiplyMatrix(mat1, mat2, mat3, explainID) {
        for (let i = 0; i < mat1.data.length; i++) {
            for (let j = 0; j < mat2.data[0].length; j++) {
                let explainText = "";
                let value = 0;
                for (let k = 0; k < mat2.data.length; k++) {
                    this.cmd("SetHighlight", mat1.dataID[i][k], 1);
                    this.cmd("SetHighlight", mat2.dataID[k][j], 1);
                    if (explainText !== "") {
                        explainText = `${explainText} + `;
                    }
                    value = value + mat1.data[i][k] * mat2.data[k][j];
                    explainText = `${explainText + String(mat1.data[i][k])} * ${String(mat2.data[k][j])}`;
                    this.cmd("SetText", explainID, explainText);
                    this.cmd("Step");
                    this.cmd("SetHighlight", mat1.dataID[i][k], 0);
                    this.cmd("SetHighlight", mat2.dataID[k][j], 0);
                }
                value = this.standardize(value);
                explainText += ` = ${String(value)}`;
                this.cmd("SetText", explainID, explainText);
                mat3.data[i][j] = value;
                this.cmd("SetText", mat3.dataID[i][j], value);
                this.cmd("Step");
            }
        }
        this.cmd("SetText", explainID, "");
    }

    standardize(lab) {
        const newLab = Math.round(lab * 1000) / 1000;
        if (isNaN(newLab)) {
            return lab;
        } else {
            return newLab;
        }
    }

    resetMatrixLabels(mat) {
        for (let i = 0; i < mat.data.length; i++) {
            for (let j = 0; j < mat.data[i].length; j++) {
                mat.data[i][j] = this.standardize(mat.data[i][j]);
                this.cmd("SetText", mat.dataID[i][j], mat.data[i][j]);
            }
        }
    }

    moveMatrix(mat, x, y) {
        const height = mat.data.length;
        let width = 0;
        for (let i = 0; i < mat.data.length; i++) {
            width = Math.max(width, mat.data[i].length);
        }

        this.cmd("Move", mat.leftBrack1, x, y);
        this.cmd("Move", mat.leftBrack2, x, y);
        this.cmd("Move", mat.leftBrack3, x, y + height * this.MATRIX_ELEM_HEIGHT);

        this.cmd("Move", mat.rightBrack1, x + width * this.MATRIX_ELEM_WIDTH, y);
        this.cmd("Move", mat.rightBrack2, x + width * this.MATRIX_ELEM_WIDTH, y);
        this.cmd("Move", mat.rightBrack3, x + width * this.MATRIX_ELEM_WIDTH, y + height * this.MATRIX_ELEM_HEIGHT);

        for (let i = 0; i < mat.data.length; i++) {
            for (let j = 0; j < mat.data[i].length; j++) {
                this.cmd("Move", mat.dataID[i][j],
                    x + j * this.MATRIX_ELEM_WIDTH + this.MATRIX_ELEM_WIDTH / 2,
                    y + i * this.MATRIX_ELEM_HEIGHT + this.MATRIX_ELEM_HEIGHT / 2);
            }
        }
        mat.x = x;
        mat.y = y;
    }

    addMatrixIDsToList(mat, list) {
        list.push(mat.leftBrack1);
        list.push(mat.leftBrack2);
        list.push(mat.leftBrack3);
        list.push(mat.rightBrack1);
        list.push(mat.rightBrack2);
        list.push(mat.rightBrack3);
        for (let i = 0; i < mat.data.length; i++) {
            for (let j = 0; j < mat.data[i].length; j++) {
                list.push(mat.dataID[i][j]);
            }
        }
    }

    deleteMatrix(mat) {
        const IDList = [];
        this.addMatrixIDsToList(mat, IDList);
        for (let i = 0; i < IDList.length; i++) {
            this.cmd("Delete", IDList[i]);
        }
    }

    aplyFunctionToMatrixElems(mat, command, value) {
        this.cmd(command, mat.leftBrack1, value);
        this.cmd(command, mat.leftBrack2, value);
        this.cmd(command, mat.leftBrack3, value);
        this.cmd(command, mat.rightBrack1, value);
        this.cmd(command, mat.rightBrack2, value);
        this.cmd(command, mat.rightBrack3, value);
        for (let i = 0; i < mat.data.length; i++) {
            for (let j = 0; j < mat.data[i].length; j++) {
                this.cmd(command, mat.dataID[i][j], value);
            }
        }
    }

    createMatrix(contents, x, y) {
        const mat = new Matrix(contents, x, y);
        mat.leftBrack1 = this.nextIndex++;
        mat.leftBrack2 = this.nextIndex++;
        mat.leftBrack3 = this.nextIndex++;
        mat.rightBrack1 = this.nextIndex++;
        mat.rightBrack2 = this.nextIndex++;
        mat.rightBrack3 = this.nextIndex++;

        const height = mat.data.length;
        let width = 0;

        mat.dataID = new Array(mat.data.length);
        for (let i = 0; i < mat.data.length; i++) {
            width = Math.max(width, mat.data[i].length);
            mat.dataID[i] = new Array(mat.data[i].length);
            for (let j = 0; j < mat.data[i].length; j++) {
                mat.dataID[i][j] = this.nextIndex++;
            }
        }

        this.cmd("CreateRectangle", mat.leftBrack1, "", 5, 1, x, y, "left", "center");
        this.cmd("CreateRectangle", mat.leftBrack2, "", 1, height * this.MATRIX_ELEM_HEIGHT, x, y, "center", "top");
        this.cmd("CreateRectangle", mat.leftBrack3, "", 5, 1, x, y + height * this.MATRIX_ELEM_HEIGHT, "left", "center");

        this.cmd("CreateRectangle", mat.rightBrack1, "", 5, 1, x + width * this.MATRIX_ELEM_WIDTH, y, "right", "center");
        this.cmd("CreateRectangle", mat.rightBrack2, "", 1, height * this.MATRIX_ELEM_HEIGHT, x + width * this.MATRIX_ELEM_WIDTH, y, "center", "top");
        this.cmd("CreateRectangle", mat.rightBrack3, "", 5, 1, x + width * this.MATRIX_ELEM_WIDTH, y + height * this.MATRIX_ELEM_HEIGHT, "right", "center");

        for (let i = 0; i < mat.data.length; i++) {
            for (let j = 0; j < mat.data[i].length; j++) {
                this.cmd("CreateLabel", mat.dataID[i][j], mat.data[i][j],
                    x + j * this.MATRIX_ELEM_WIDTH + this.MATRIX_ELEM_WIDTH / 2,
                    y + i * this.MATRIX_ELEM_HEIGHT + this.MATRIX_ELEM_HEIGHT / 2);
            }
        }
        return mat;
    }
}
