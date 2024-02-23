// Copyright 2011 David Galles, University of San Francisco. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, areobjectVertexLocalPosition
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
/* exported GeoRotateScale3D */
///////////////////////////////////////////////////////////////////////////////


class GeoRotateScale3D extends Geometric {
    XAxisYPos = 300;
    XAxisStart = 100;
    XAxisEnd = 700;

    MATRIX_START_X = 10;
    MATRIX_START_Y = 10;
    MATRIX_MULTIPLY_SPACING = 10;
    EQUALS_SPACING = 30;

    AXIS_SIZE = 200;

    AXIS_ALPHA = 0.7;

    YAxisXPos = 400;
    YAxisStart = 100;
    YAxisEnd = 500;

    MATRIX_ELEM_WIDTH = 50;
    MATRIX_ELEM_HEIGHT = 20;

    OBJECTS = [
        [[100, 100, 100], [-100, 100, 100], [-100, -100, 100], [100, -100, 100],
            [100, -100, -100], [100, 100, -100], [-100, 100, -100], [-100, -100, -100],
        ], // Cube
        [[10, 10, 100], [-10, 10, 100], [-10, 10, -100], [100, 10, -100], [100, 10, -80], [10, 10, -80],
            [10, -10, -80], [10, -10, 100], [-10, -10, 100], [-10, -10, -100], [100, -10, -100], [100, -10, -80],
        ], // L
        [[0, 0, 141], [-134, 0, 44], [-83, 0, -114], [83, 0, -114], [134, 0, 44]], // Pentagon
        [[0, 0, 141], [-35, 0, 48], [-134, 0, 44], [-57, 0, -19], [-83, 0, -114],
            [0, 0, -60], [83, 0, -114], [57, 0, -19], [134, 0, 44], [35, 0, 48],
        ], // Star
    ];

    EXTRA_CONNECTIONS = [
        [[3, 0], [5, 0], [6, 1], [7, 2], [4, 7]], // Cube
        [[5, 0], [6, 11], [0, 7], [1, 8], [2, 9], [3, 10], [4, 11]], // L
        [[4, 0]], // Pentagon
        [[9, 0]], // Star
    ];

    CAMERA_Z_ROT = this.toRadians(-10);
    CAMERA_X_ROT = this.toRadians(10);

    CAMERA_TRANS_ANGLE = this.toRadians(30);
    L = 0.5;

    CAMERA_TRANSFORM = [[1, 0, 0],
        [this.L * Math.cos(this.CAMERA_TRANS_ANGLE), 0, this.L * Math.sin(this.CAMERA_TRANS_ANGLE)],
        [0, 0, 1]];

    CAMERA_TRANSFORM2 = [[Math.cos(this.CAMERA_Z_ROT), Math.sin(this.CAMERA_Z_ROT), 0],
        [-Math.sin(this.CAMERA_Z_ROT), Math.cos(this.CAMERA_Z_ROT), 0],
        [0, 0, 1]];

    CAMERA_TRANSFORM1 = [[1, 0, 0],
        [0, Math.cos(this.CAMERA_X_ROT), Math.sin(this.CAMERA_X_ROT)],
        [0, -Math.sin(this.CAMERA_X_ROT), Math.cos(this.CAMERA_X_ROT)],
    ];

    AXIS_COLOR = "#0000FF";
    VERTEX_FOREGORUND_COLOR = "#000000";
    VERTEX_BACKGROUND_COLOR = this.VERTEX_FOREGORUND_COLOR;
    EDGE_COLOR = "#000000";

    TRANSFORMED_VERTEX_FOREGORUND_COLOR = "#66FF66";
    TRANSFORMED_VERTEX_BACKGROUND_COLOR = this.VERTEX_FOREGORUND_COLOR;
    TRANSFORMED_EDGE_COLOR = "#66FF66";

    VECTOR_COLOR = "#FF0000";

    VERTEX_WIDTH = 3;
    VERTEX_HEIGHT = this.VERTEX_WIDTH;

    constructor(am) {
        super();
        this.init(am);
    }

    init(am) {
        super.init(am);
        this.cameraTransform = this.CAMERA_TRANSFORM;
        // this.cameraTransform = this.multiply(RotateScale3D.CAMERA_TRANSFORM1, RotateScale3D.CAMERA_TRANSFORM2);
        this.rowMajor = true;
        this.posYUp = true;
        this.rotateFirst = true;
        this.addControls();
        this.currentShape = 0;

        this.commands = [];
        this.nextIndex = 0;

        this.setupAxis();

        this.savedNextIndex = this.nextIndex;
        this.setupObject();
        this.setupObjectGraphic();

        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
        this.clearHistory();
    }

    setupAxis() {
        this.xAxisMinID = this.nextIndex++;
        this.xAxisMaxID = this.nextIndex++;
        this.yAxisMinID = this.nextIndex++;
        this.yAxisMaxID = this.nextIndex++;

        this.zAxisMinID = this.nextIndex++;
        this.zAxisMaxID = this.nextIndex++;

        this.xAxisLabel = this.nextIndex++;
        this.yAxisLabel = this.nextIndex++;
        this.zAxisLabel = this.nextIndex++;

        this.originID = this.nextIndex++;

        let point = this.worldToScreenSpace([0, 0, 0]);

        this.cmd("CreateRectangle", this.originID, "", 0, 0, point[0], point[1]);

        point = this.worldToScreenSpace([-this.AXIS_SIZE, 0, 0]);
        this.cmd("CreateRectangle", this.xAxisMinID, "", 0, 0, point[0], point[1]);
        this.cmd("SetAlpha", this.xAxisMinID, 0);

        point = this.worldToScreenSpace([this.AXIS_SIZE, 0, 0]);
        this.cmd("CreateRectangle", this.xAxisMaxID, "", 0, 0, point[0], point[1]);
        this.cmd("SetAlpha", this.xAxisMaxID, 0);

        this.cmd("Connect", this.xAxisMinID, this.xAxisMaxID, this.AXIS_COLOR, 0, 1, "");
        this.cmd("Connect", this.xAxisMaxID, this.xAxisMinID, this.AXIS_COLOR, 0, 1, "");
        this.cmd("SetEdgeAlpha", this.xAxisMaxID, this.xAxisMinID, this.AXIS_ALPHA);
        this.cmd("SetEdgeAlpha", this.xAxisMinID, this.xAxisMaxID, this.AXIS_ALPHA);

        point = this.worldToScreenSpace([0, -this.AXIS_SIZE, 0]);
        this.cmd("CreateRectangle", this.yAxisMinID, "", 0, 0, point[0], point[1]);
        this.cmd("SetAlpha", this.yAxisMinID, 0);

        point = this.worldToScreenSpace([0, this.AXIS_SIZE, 0]);
        this.cmd("CreateRectangle", this.yAxisMaxID, "", 0, 0, point[0], point[1]);
        this.cmd("SetAlpha", this.yAxisMaxID, 0);

        this.cmd("Connect", this.yAxisMinID, this.yAxisMaxID, this.AXIS_COLOR, 0, 1, "");
        this.cmd("Connect", this.yAxisMaxID, this.yAxisMinID, this.AXIS_COLOR, 0, 1, "");
        this.cmd("SetEdgeAlpha", this.yAxisMaxID, this.yAxisMinID, this.AXIS_ALPHA);
        this.cmd("SetEdgeAlpha", this.yAxisMinID, this.yAxisMaxID, this.AXIS_ALPHA);

        point = this.worldToScreenSpace([0, 0, -this.AXIS_SIZE]);
        this.cmd("CreateRectangle", this.zAxisMinID, "", 0, 0, point[0], point[1]);
        this.cmd("SetAlpha", this.zAxisMinID, 0);

        point = this.worldToScreenSpace([0, 0, this.AXIS_SIZE]);
        this.cmd("CreateRectangle", this.zAxisMaxID, "", 0, 0, point[0], point[1]);
        this.cmd("SetAlpha", this.zAxisMaxID, 0);

        this.cmd("Connect", this.zAxisMinID, this.zAxisMaxID, this.AXIS_COLOR, 0, 1, "");
        this.cmd("Connect", this.zAxisMaxID, this.zAxisMinID, this.AXIS_COLOR, 0, 1, "");

        this.cmd("SetEdgeAlpha", this.zAxisMaxID, this.zAxisMinID, this.AXIS_ALPHA);
        this.cmd("SetEdgeAlpha", this.zAxisMinID, this.zAxisMaxID, this.AXIS_ALPHA);

        point = this.worldToScreenSpace([this.AXIS_SIZE, 0, -10]);
        this.cmd("CreateLabel", this.xAxisLabel, "+x", point[0], point[1]);

        point = this.worldToScreenSpace([+10, this.AXIS_SIZE, 0]);
        this.cmd("CreateLabel", this.yAxisLabel, "+y", point[0], point[1]);

        point = this.worldToScreenSpace([+10, 0, this.AXIS_SIZE]);
        this.cmd("CreateLabel", this.zAxisLabel, "+z", point[0], point[1]);

        this.cmd("SetForegroundColor", this.yAxisLabel, this.AXIS_COLOR);
        this.cmd("SetForegroundColor", this.xAxisLabel, this.AXIS_COLOR);
        this.cmd("SetForegroundColor", this.zAxisLabel, this.AXIS_COLOR);
    }

    setupObject() {
        this.objectVertexPosition = this.OBJECTS[this.currentShape].slice(0);
        this.extraConnections = this.EXTRA_CONNECTIONS[this.currentShape].slice(0);
    }

    worldToScreenSpace(point) {
        const transformedPoint = this.multiply([point], this.cameraTransform)[0];
        const worldSpace = new Array(2);
        worldSpace[0] = transformedPoint[0] + this.YAxisXPos;
        worldSpace[1] = this.XAxisYPos - transformedPoint[2];

        return worldSpace;
    }

    moveObjectToNewPosition() {
        for (let i = 0; i < this.objectVertexID.length; i++) {
            const point = this.worldToScreenSpace(this.objectVertexPosition[i]);
            this.cmd("Move", this.objectVertexID[i], point[0], point[1]);
        }
    }

    setupObjectGraphic() {
        this.objectVertexID = new Array(this.objectVertexPosition.length);

        for (let i = 0; i < this.objectVertexPosition.length; i++) {
            this.objectVertexID[i] = this.nextIndex++;
            const point = this.worldToScreenSpace(this.objectVertexPosition[i]);

            this.cmd("CreateRectangle", this.objectVertexID[i], "", this.VERTEX_WIDTH, this.VERTEX_HEIGHT, point[0], point[1]);
            this.cmd("SetForegroundColor", this.objectVertexID[i], this.VERTEX_FOREGORUND_COLOR);
            this.cmd("SetBackgroundColor", this.objectVertexID[i], this.VERTEX_BACKGROUND_COLOR);
        }
        for (let i = 1; i < this.objectVertexID.length; i++) {
            this.cmd("Connect", this.objectVertexID[i - 1], this.objectVertexID[i], this.EDGE_COLOR, 0, 0, "");
        }

        for (let i = 0; i < this.extraConnections.length; i++) {
            this.cmd("Connect", this.objectVertexID[this.extraConnections[i][0]], this.objectVertexID[this.extraConnections[i][1]], this.EDGE_COLOR, 0, 0, "");
        }
    }

    addControls() {
        this.addLabelToAlgorithmBar("X Angle");

        this.rotationFieldX = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.rotationFieldX, "float", this.rotateCallback.bind(this));

        this.addLabelToAlgorithmBar("Y Angle");

        this.rotationFieldY = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.rotationFieldY, "float", this.rotateCallback.bind(this));

        this.addLabelToAlgorithmBar("Z Angle");

        this.rotationFieldZ = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.rotationFieldZ, "float", this.rotateCallback.bind(this));

        const rotateButton = this.addButtonToAlgorithmBar("Rotate");
        rotateButton.onclick = this.rotateCallback.bind(this);

        this.addLabelToAlgorithmBar("Scale X");

        this.scaleXField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.scaleXField, "float", this.scaleCallback.bind(this));

        this.addLabelToAlgorithmBar("Scale Y");

        this.scaleYField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.scaleYField, "float", this.scaleCallback.bind(this));

        this.addLabelToAlgorithmBar("Scale Z");

        this.scaleZField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.scaleZField, "float", this.scaleCallback.bind(this));

        const scaleButton = this.addButtonToAlgorithmBar("Scale");
        scaleButton.onclick = this.scaleCallback.bind(this);

        const radioButtonList = this.addRadioButtonGroupToAlgorithmBar(
            ["Row Major", "Column Major"],
            "RankType",
        );
        this.rowMajorButton = radioButtonList[0];
        this.rowMajorButton.onclick = this.changeRowColMajorCallback.bind(this, true);

        this.colMajorButton = radioButtonList[1];
        this.colMajorButton.onclick = this.changeRowColMajorCallback.bind(this, false);

        this.rowMajorButton.checked = this.rowMajor;
        this.colMajorButton.checked = !this.rowMajor;

        const changeShapeButton = this.addButtonToAlgorithmBar("Change Shape");
        changeShapeButton.onclick = this.changeShapeCallback.bind(this);
    }

    reset() {
        this.rowMajor = true;
        this.posYUp = true;
        this.rotateFirst = true;
        this.currentShape = 0;
        this.rowMajorButton.checked = this.rowMajor;

        this.nextIndex = this.savedNextIndex;
        this.setupObject();
        this.setupObjectGraphic();
    }

    changePosYCallback(posYUp) {
        if (this.posYUp !== posYUp) {
            this.implementAction(this.changePosY.bind(this), posYUp);
        }
    }

    changePosY(posYUp) {
        this.commands = [];
        this.posYUp = posYUp;
        if (this.posYUpButton.checked !== this.posYUp) {
            this.posYUpButton.checked = this.posYUp;
        }
        if (this.posYDownButton.checked === this.posYUp) {
            this.posYDownButton.checked = !this.posYUp;
        }
        if (this.posYUp) {
            this.cmd("Move", this.yAxisLabel, this.YAxisXPos + 10, this.YAxisStart + 10);
        } else {
            this.cmd("Move", this.yAxisLabel, this.YAxisXPos + 10, this.YAxisEnd - 10);
        }

        this.moveObjectToNewPosition();

        // Move +y on axis up/down
        return this.commands;
    }

    changeRowColMajorCallback(rowMajor) {
        if (this.rowMajor !== rowMajor) {
            this.implementAction(this.changeRowCol.bind(this), rowMajor);
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
        return this.commands;
    }

    fixNumber(value, defaultVal) {
        value = parseFloat(value);
        if (isNaN(value)) value = defaultVal;
        return value;
    }

    rotateCallback() {
        this.rotationFieldX.value = this.fixNumber(this.rotationFieldX.value, 0);
        this.rotationFieldY.value = this.fixNumber(this.rotationFieldY.value, 0);
        this.rotationFieldZ.value = this.fixNumber(this.rotationFieldZ.value, 0);
        this.implementAction(this.rotate.bind(this), `${this.rotationFieldZ.value};${this.rotationFieldY.value};${this.rotationFieldX.value}`);
    }

    scaleCallback() {
        this.scaleXField.value = this.fixNumber(this.scaleXField.value, 1);
        this.scaleYField.value = this.fixNumber(this.scaleYField.value, 1);
        this.scaleZField.value = this.fixNumber(this.scaleZField.value, 1);
        this.implementAction(this.scale.bind(this), `${this.scaleXField.value};${this.scaleYField.value};${this.scaleZField.value}`);
    }

    changeShapeCallback() {
        this.implementAction(this.changeShape.bind(this), 0);
    }

    changeShape() {
        this.commands = [];

        for (let i = 0; i < this.objectVertexID.length; i++) {
            this.cmd("Delete", this.objectVertexID[i]);
        }
        this.currentShape++;
        if (this.currentShape >= this.OBJECTS.length) {
            this.currentShape = 0;
        }
        this.setupObject();
        this.setupObjectGraphic();
        return this.commands;
    }

    rotateScaleOrderCallback(rotateFirst) {
        if (this.rotateFirst !== rotateFirst) {
            this.implementAction(this.rotateScaleOrder.bind(this), rotateFirst);
        }
    }

    rotateScaleOrder(rotateFirst) {
        this.commands = [];
        this.rotateFirst = rotateFirst;
        if (this.rotateScaleButton.checked !== this.rotateFirst) {
            this.rotateScaleButton.checked = this.rotateFirst;
        }
        if (this.scaleRotateButton.checked === this.rotateFirst) {
            this.scaleRotateButton.checked = !this.rotateFirst;
        }
        return this.commands;
    }

    scale(input) {
        // const oldNextIndex = this.nextIndex;
        this.commands = [];
        const inputs = input.split(";");
        const scaleX = parseFloat(inputs[0]);
        const scaleY = parseFloat(inputs[1]);
        const scaleZ = parseFloat(inputs[2]);

        let xpos = this.MATRIX_START_X;
        const ypos = this.MATRIX_START_Y;

        xpos += 3 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING;

        const transformMatrix = this.createMatrix([[scaleX, 0, 0],
            [0, scaleY, 0],
            [0, 0, scaleZ]], xpos, ypos);
        this.transformPoints(transformMatrix);
        this.deleteMatrix(transformMatrix);
        // this.nextIndex = oldNextIndex
        return this.commands;
    }

    transformPoints(transformMatrix) {
        const explainID = this.nextIndex++;
        const equalID = this.nextIndex++;

        let xyz;
        if (this.rowMajor) {
            xyz = this.createMatrix([["x", "y", "z"]], this.MATRIX_START_X, this.MATRIX_START_Y);
            this.cmd("CreateLabel", explainID, "", this.MATRIX_START_X + 6 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING + this.EQUALS_SPACING,
                this.MATRIX_START_Y + 1.5 * this.MATRIX_ELEM_HEIGHT, 0);
            this.cmd("CreateLabel", equalID, "=", this.MATRIX_START_X + 6 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING + this.EQUALS_SPACING / 2,
                this.MATRIX_START_Y + 0.5 * this.MATRIX_ELEM_HEIGHT);
        } else {
            xyz = this.createMatrix([["x"], ["y"], ["z"]], this.MATRIX_START_X + 6 * this.MATRIX_ELEM_WIDTH + 2 * this.MATRIX_MULTIPLY_SPACING,
                this.MATRIX_START_Y);
            this.cmd("CreateLabel", explainID, "", this.MATRIX_START_X + 7 * this.MATRIX_ELEM_WIDTH + 2 * this.MATRIX_MULTIPLY_SPACING + this.EQUALS_SPACING,
                this.MATRIX_START_Y + 3 * this.MATRIX_ELEM_HEIGHT + 2, 0);
            this.cmd("CreateLabel", equalID, "=", this.MATRIX_START_X + 7 * this.MATRIX_ELEM_WIDTH + 2 * this.MATRIX_MULTIPLY_SPACING + this.EQUALS_SPACING / 2,
                this.MATRIX_START_Y + 1.5 * this.MATRIX_ELEM_HEIGHT);
        }
        this.cmd("Step");

        const transformedObjectID = new Array(this.objectVertexID.length);

        for (let i = 0; i < this.objectVertexID.length; i++) {
            this.cmd("Connect", this.originID, this.objectVertexID[i], this.VECTOR_COLOR, 0, 1, "");
            if (this.rowMajor) {
                xyz.data = [this.objectVertexPosition[i].slice(0)];
            } else {
                xyz.data[0][0] = this.objectVertexPosition[i][0];
                xyz.data[1][0] = this.objectVertexPosition[i][1];
                xyz.data[2][0] = this.objectVertexPosition[i][2];
            }
            this.resetMatrixLabels(xyz);
            this.cmd("Step");

            let output;
            if (this.rowMajor) {
                output = this.createMatrix([["", "", ""]],
                    this.MATRIX_START_X + 6 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING + this.EQUALS_SPACING,
                    this.MATRIX_START_Y);
                this.multiplyMatrix(xyz, transformMatrix, output, explainID);
            } else {
                output = this.createMatrix([[""], [""], [""]],
                    this.MATRIX_START_X + 7 * this.MATRIX_ELEM_WIDTH + 2 * this.MATRIX_MULTIPLY_SPACING + this.EQUALS_SPACING,
                    this.MATRIX_START_Y);

                this.multiplyMatrix(transformMatrix, xyz, output, explainID);
            }

            transformedObjectID[i] = this.nextIndex++;
            let point;
            if (this.rowMajor) {
                point = this.worldToScreenSpace(output.data[0]);
            } else {
                point = this.worldToScreenSpace([output.data[0][0], output.data[1][0], output.data[2][0]]);
            }

            this.cmd("CreateRectangle", transformedObjectID[i], "", this.VERTEX_WIDTH, this.VERTEX_HEIGHT, point[0], point[1]);
            this.cmd("SetForegroundColor", transformedObjectID[i], this.TRANSFORMED_VERTEX_FOREGORUND_COLOR);
            this.cmd("SetBackgroundColor", transformedObjectID[i], this.TRANSFORMED_VERTEX_BACKGROUND_COLOR);
            this.cmd("Connect", this.originID, transformedObjectID[i], this.TRANSFORMED_EDGE_COLOR, 0, 1, "");
            this.cmd("Step");
            this.cmd("Disconnect", this.originID, transformedObjectID[i]);

            if (i > 0) {
                this.cmd("Connect", transformedObjectID[i - 1], transformedObjectID[i], this.TRANSFORMED_EDGE_COLOR, 0, 0, "");
            }
            for (let j = 0; j < this.extraConnections.length; j++) {
                if ((this.extraConnections[j][0] === i && this.extraConnections[j][1] < i) ||
                  (this.extraConnections[j][1] === i && this.extraConnections[j][0] < i)) {
                    this.cmd("Connect", transformedObjectID[this.extraConnections[j][0]], transformedObjectID[this.extraConnections[j][1]], this.TRANSFORMED_EDGE_COLOR, 0, 0, "");
                }
            }

            this.cmd("Disconnect", this.originID, this.objectVertexID[i]);
            if (this.rowMajor) {
                this.objectVertexPosition[i] = output.data[0];
            } else {
                this.objectVertexPosition[i][0] = output.data[0][0];
                this.objectVertexPosition[i][1] = output.data[1][0];
            }
            this.deleteMatrix(output);
        }
        this.cmd("Step");

        this.cmd("Connect", transformedObjectID[0], transformedObjectID[transformedObjectID.length - 1], this.TRANSFORMED_EDGE_COLOR, 0, 0, "");

        this.cmd("Step", "B");
        this.moveObjectToNewPosition();
        this.cmd("Step", "C");

        for (let i = 0; i < transformedObjectID.length; i++) {
            this.cmd("Delete", transformedObjectID[i]);
        }

        this.deleteMatrix(xyz);
        this.cmd("Delete", explainID);
        this.cmd("Delete", equalID);
    }

    rotate(input) {
        // const oldNextIndex = this.nextIndex;
        this.commands = [];
        const inputs = input.split(";");
        const rotateAngle1 = this.toRadians(parseFloat(inputs[0]));
        const rotateAngle2 = this.toRadians(parseFloat(inputs[1]));
        const rotateAngle3 = this.toRadians(parseFloat(inputs[2]));

        let xpos = this.MATRIX_START_X;
        const ypos = this.MATRIX_START_Y;

        xpos += 3 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING;

        let matrix1Data = [["cos \u0398z", "sin \u0398z", 0],
            ["-sin \u0398z", "cos \u0398z", 0],
            [0, 0, 1]];
        const matrix2Data = [["cos \u0398y", 0, "sin \u0398y"],
            [0, 1, 0],
            ["-sin \u0398y", 0, "cos \u0398y"]];

        let matrix3Data = [[1, 0, 0],
            [0, "cos \u0398x", "sin \u0398x"],
            [0, "-sin \u0398x", "cos \u0398x"]];
        if (!this.rowMajor) {
            const tmp = matrix1Data;
            matrix1Data = matrix3Data;
            matrix3Data = tmp;
        }

        const firstMat = this.createMatrix(matrix1Data, xpos, ypos);
        xpos += firstMat.data[0].length * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING;

        const secondMat = this.createMatrix(matrix2Data, xpos, ypos);
        xpos += secondMat.data[0].length * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING;

        const thirdMat = this.createMatrix(matrix3Data, xpos, ypos);
        xpos += secondMat.data[0].length * this.MATRIX_ELEM_WIDTH;

        if (!this.rowMajor) {
            firstMat.transpose();
            secondMat.transpose();
            thirdMat.transpose();
            this.resetMatrixLabels(firstMat);
            this.resetMatrixLabels(secondMat);
            this.resetMatrixLabels(thirdMat);
        }

        this.cmd("Step");

        firstMat.data = [[`cos ${inputs[0]}`, `sin ${inputs[0]}`, 0],
            [`-sin ${inputs[0]}`, `cos ${inputs[0]}`, 0],
            [0, 0, 1]];
        secondMat.data = [[`cos ${inputs[1]}`, 0, `sin ${inputs[1]}`],
            [0, 1, 0],
            [`-sin ${inputs[1]}`, 0, `cos ${inputs[1]}`]];

        thirdMat.data = [[1, 0, 0],
            [0, `cos ${inputs[2]}`, `sin ${inputs[2]}`],
            [0, `-sin ${inputs[2]}`, `cos ${inputs[2]}`]];

        if (!this.rowMajor) {
            const tmp = firstMat.data;
            firstMat.data = thirdMat.data;
            thirdMat.data = tmp;
            firstMat.transpose();
            secondMat.transpose();
            thirdMat.transpose();
        }

        this.resetMatrixLabels(firstMat);
        this.resetMatrixLabels(secondMat);
        this.resetMatrixLabels(thirdMat);

        this.cmd("Step");

        firstMat.data = [[Math.cos(rotateAngle1), Math.sin(rotateAngle1), 0],
            [-Math.sin(rotateAngle1), Math.cos(rotateAngle1), 0],
            [0, 0, 1]];
        secondMat.data = [[Math.cos(rotateAngle2), 0, Math.sin(rotateAngle2)],
            [0, 1, 0],
            [-Math.sin(rotateAngle2), 0, Math.cos(rotateAngle2)]];
        thirdMat.data = [[1, 0, 0],
            [0, Math.cos(rotateAngle3), Math.sin(rotateAngle3)],
            [0, -Math.sin(rotateAngle3), Math.cos(rotateAngle3)]];

        if (!this.rowMajor) {
            const tmp = firstMat.data;
            firstMat.data = thirdMat.data;
            thirdMat.data = tmp;
            firstMat.transpose();
            secondMat.transpose();
            thirdMat.transpose();
        }

        this.resetMatrixLabels(firstMat);
        this.resetMatrixLabels(secondMat);
        this.resetMatrixLabels(thirdMat);

        this.cmd("Step");

        this.setMatrixAlpha(firstMat, 0.3);

        const paren1 = this.nextIndex++;
        const paren2 = this.nextIndex++;
        const paren3 = this.nextIndex++;
        const paren4 = this.nextIndex++;
        this.cmd("step");

        let parenX = xpos - 6 * this.MATRIX_ELEM_WIDTH - this.MATRIX_MULTIPLY_SPACING - 2;

        this.cmd("CreateRectangle", paren1, "", 0, 0, parenX, this.MATRIX_START_Y, "center", "center");
        this.cmd("CreateRectangle", paren2, "", 0, 0, parenX, this.MATRIX_START_Y + 3 * this.MATRIX_ELEM_HEIGHT, "center", "center");
        this.cmd("Connect", paren1, paren2, "#000000", 0.2, 0, "");

        parenX = xpos;

        this.cmd("CreateRectangle", paren3, "", 0, 0, parenX, this.MATRIX_START_Y, "center", "center");
        this.cmd("CreateRectangle", paren4, "", 0, 0, parenX, this.MATRIX_START_Y + 3 * this.MATRIX_ELEM_HEIGHT, "center", "center");

        this.cmd("Connect", paren3, paren4, "#000000", -0.2, 0, "");

        this.cmd("Step");
        const tmpMat = this.createMatrix([["", "", ""], ["", "", ""], ["", "", ""]], xpos + this.EQUALS_SPACING, ypos);

        const explainID = this.nextIndex++;
        this.cmd("CreateLabel", explainID, "", xpos + this.EQUALS_SPACING, ypos + this.MATRIX_ELEM_HEIGHT * 3 + 5, 0);

        const equalID = this.nextIndex++;
        this.cmd("CreateLabel", equalID, "=", xpos + this.EQUALS_SPACING / 2, ypos + this.MATRIX_ELEM_HEIGHT * 1.5);
        this.multiplyMatrix(secondMat, thirdMat, tmpMat, explainID);

        this.cmd("Step");
        this.deleteMatrix(secondMat);
        this.deleteMatrix(thirdMat);
        this.cmd("Delete", paren1);
        this.cmd("Delete", paren2);
        this.cmd("Delete", paren3);
        this.cmd("Delete", paren4);
        this.cmd("Delete", equalID);
        this.cmd("Delete", explainID);

        this.moveMatrix(tmpMat, this.MATRIX_START_X + 6 * this.MATRIX_ELEM_WIDTH + 2 * this.MATRIX_MULTIPLY_SPACING, ypos);

        this.cmd("Step");

        this.setMatrixAlpha(firstMat, 1);
        xpos = this.MATRIX_START_X + 9 * this.MATRIX_ELEM_WIDTH + 2 * this.MATRIX_MULTIPLY_SPACING;

        const transformMatrix = this.createMatrix([["", "", ""], ["", "", ""], ["", "", ""]], xpos + this.EQUALS_SPACING, ypos);

        this.cmd("CreateLabel", explainID, "", xpos + this.EQUALS_SPACING, ypos + this.MATRIX_ELEM_HEIGHT * 3 + 5, 0);
        this.cmd("CreateLabel", equalID, "=", xpos + this.EQUALS_SPACING / 2, ypos + this.MATRIX_ELEM_HEIGHT * 1.5);

        this.multiplyMatrix(firstMat, tmpMat, transformMatrix, explainID);

        this.deleteMatrix(firstMat);
        this.deleteMatrix(tmpMat);
        this.cmd("Delete", equalID);
        this.cmd("Delete", explainID);

        this.moveMatrix(transformMatrix, this.MATRIX_START_X + 3 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING, ypos);
        this.cmd("Step");

        this.transformPoints(transformMatrix);

        // this.nextIndex = oldNextIndex
        this.deleteMatrix(transformMatrix);

        return this.commands;
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
    }

    deleteMatrix(mat) {
        this.cmd("Delete", mat.leftBrack1);
        this.cmd("Delete", mat.leftBrack2);
        this.cmd("Delete", mat.leftBrack3);
        this.cmd("Delete", mat.rightBrack1);
        this.cmd("Delete", mat.rightBrack2);
        this.cmd("Delete", mat.rightBrack3);

        for (let i = 0; i < mat.data.length; i++) {
            for (let j = 0; j < mat.data[i].length; j++) {
                this.cmd("Delete", mat.dataID[i][j]);
            }
        }
    }

    setMatrixAlpha(mat, alpha) {
        this.cmd("SetAlpha", mat.leftBrack1, alpha);
        this.cmd("SetAlpha", mat.leftBrack2, alpha);
        this.cmd("SetAlpha", mat.leftBrack3, alpha);
        this.cmd("SetAlpha", mat.rightBrack1, alpha);
        this.cmd("SetAlpha", mat.rightBrack2, alpha);
        this.cmd("SetAlpha", mat.rightBrack3, alpha);

        for (let i = 0; i < mat.data.length; i++) {
            for (let j = 0; j < mat.data[i].length; j++) {
                this.cmd("SetAlpha", mat.dataID[i][j], alpha);
            }
        }
    }

    // Multiply two (data only!) matrices (not complete matrix object with graphics, just
    // the data
    multiply(lhs, rhs) {
        const resultMat = new Array(lhs.length);

        for (let i = 0; i < lhs.length; i++) {
            resultMat[i] = new Array(rhs[0].length);
        }
        for (let i = 0; i < lhs.length; i++) {
            for (let j = 0; j < rhs[0].length; j++) {
                let value = 0;
                for (let k = 0; k < rhs.length; k++) {
                    value = value + lhs[i][k] * rhs[k][j];
                }
                resultMat[i][j] = value;
            }
        }
        return resultMat;
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
