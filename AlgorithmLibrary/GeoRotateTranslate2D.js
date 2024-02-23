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
/* exported GeoRotateTranslate2D */
///////////////////////////////////////////////////////////////////////////////


class GeoRotateTranslate2D extends Geometric {
    XAxisYPos = 300;
    XAxisStart = 100;
    XAxisEnd = 700;

    MATRIX_ELEM_WIDTH = 50;
    MATRIX_ELEM_HEIGHT = 20;

    MATRIX_MULTIPLY_SPACING = 10;
    EQUALS_SPACING = 30;
    MATRIX_START_X = 10 + 3 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING;
    MATRIX_START_Y = 10;

    YAxisXPos = 400;
    YAxisStart = 100;
    YAxisEnd = 500;

    OBJECTS = [
        [[100, 100], [-100, 100], [-100, -100], [100, -100]], // Square
        [[10, 100], [-10, 100], [-10, -100], [100, -100], [100, -80], [10, -80]], // L
        [[0, 141], [-134, 44], [-83, -114], [83, -114], [134, 44]], // Pentagon
        [[0, 141], [-35, 48], [-134, 44], [-57, -19], [-83, -114], [0, -60], [83, -114], [57, -19], [134, 44], [35, 48]], // Star
    ];

    AXIS_COLOR = "#9999FF";

    LOCAL_VERTEX_FOREGORUND_COLOR = "#000000";
    LOCAL_VERTEX_BACKGROUND_COLOR = this.LOCAL_VERTEX_FOREGORUND_COLOR;
    LOCAL_EDGE_COLOR = "#000000";

    GLOBAL_VERTEX_FOREGORUND_COLOR = "#00FF00";
    GLOBAL_VERTEX_BACKGROUND_COLOR = this.GLOBAL_VERTEX_FOREGORUND_COLOR;
    GLOBAL_EDGE_COLOR = "#00FF00";

    TRANSFORMED_VERTEX_FOREGORUND_COLOR = "#66FF66";
    TRANSFORMED_VERTEX_BACKGROUND_COLOR = this.TRANSFORMED_VERTEX_FOREGORUND_COLOR;
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
        this.rowMajor = true;
        this.posYUp = true;
        this.rotateFirst = true;
        this.addControls();
        this.currentShape = 0;

        this.commands = [];
        this.nextIndex = 0;

        this.setupAxis();

        this.transformMatrix = this.createMatrix([[1, 0, 0], [0, 1, 0], [0, 0, 1]], this.MATRIX_START_X, this.MATRIX_START_Y);

        this.savedNextIndex = this.nextIndex;
        this.setupObject();
        this.setupObjectGraphic();

        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
        this.clearHistory();
    }

    setupAxis() {
        this.xAxisLeft = this.nextIndex++;
        this.xAxisRight = this.nextIndex++;
        this.yAxisTop = this.nextIndex++;
        this.yAxisBottom = this.nextIndex++;

        this.xAxisLabel = this.nextIndex++;
        this.yAxisLabel = this.nextIndex++;

        this.originID = this.nextIndex++;

        this.cmd("CreateRectangle", this.originID, "", 0, 0, this.YAxisXPos, this.XAxisYPos);

        this.cmd("CreateRectangle", this.xAxisLeft, "", 0, 0, this.XAxisStart, this.XAxisYPos);
        this.cmd("SetAlpha", this.xAxisLeft, 0);
        this.cmd("CreateRectangle", this.xAxisRight, "", 0, 0, this.XAxisEnd, this.XAxisYPos);
        this.cmd("SetAlpha", this.xAxisRight, 0);
        this.cmd("Connect", this.xAxisLeft, this.xAxisRight, this.AXIS_COLOR, 0, 1, "");
        this.cmd("Connect", this.xAxisRight, this.xAxisLeft, this.AXIS_COLOR, 0, 1, "");

        this.cmd("CreateRectangle", this.yAxisTop, "", 0, 0, this.YAxisXPos, this.YAxisStart);
        this.cmd("SetAlpha", this.yAxisTop, 0);
        this.cmd("CreateRectangle", this.yAxisBottom, "", 0, 0, this.YAxisXPos, this.YAxisEnd);
        this.cmd("SetAlpha", this.yAxisBottom, 0);
        this.cmd("Connect", this.yAxisTop, this.yAxisBottom, this.AXIS_COLOR, 0, 1, "");
        this.cmd("Connect", this.yAxisBottom, this.yAxisTop, this.AXIS_COLOR, 0, 1, "");
        if (this.posYUp) {
            this.cmd("CreateLabel", this.yAxisLabel, "+y", this.YAxisXPos + 10, this.YAxisStart + 10);
        } else {
            this.cmd("CreateLabel", this.yAxisLabel, "+y", this.YAxisXPos + 10, this.YAxisEnd - 10);
        }
        this.cmd("CreateLabel", this.xAxisLabel, "+x", this.XAxisEnd - 10, this.XAxisYPos - 10);
        this.cmd("SetForegroundColor", this.yAxisLabel, this.AXIS_COLOR);
        this.cmd("SetForegroundColor", this.xAxisLabel, this.AXIS_COLOR);
    }

    setupObject() {
        this.objectVertexLocalPosition = new Array(this.OBJECTS[this.currentShape].length);
        this.objectVertexWorldPosition = new Array(this.OBJECTS[this.currentShape].length);
        for (let i = 0; i < this.OBJECTS[this.currentShape].length; i++) {
            this.objectVertexLocalPosition[i] = this.OBJECTS[this.currentShape][i].slice(0);
            this.objectVertexWorldPosition[i] = this.OBJECTS[this.currentShape][i].slice(0);
        }
    }

    worldToScreenSpace(point) {
        const transformedPoint = new Array(2);
        transformedPoint[0] = point[0] + this.YAxisXPos;
        if (this.posYUp) {
            transformedPoint[1] = this.XAxisYPos - point[1];
        } else {
            transformedPoint[1] = this.XAxisYPos + point[1];
        }
        return transformedPoint;
    }

    setupObjectGraphic() {
        this.objectVertexLocalID = new Array(this.objectVertexLocalPosition.length);
        this.objectVertexWorldID = new Array(this.objectVertexWorldPosition.length);
        for (let i = 0; i < this.objectVertexLocalPosition.length; i++) {
            this.objectVertexLocalID[i] = this.nextIndex++;
        }
        for (let i = 0; i < this.objectVertexWorldPosition.length; i++) {
            this.objectVertexWorldID[i] = this.nextIndex++;
        }

        let point = this.worldToScreenSpace(this.objectVertexLocalPosition[0]);
        let xLocal = point[0];
        let yLocal = point[1];
        point = this.worldToScreenSpace(this.objectVertexWorldPosition[0]);
        let xGlobal = point[0];
        let yGlobal = point[1];

        for (let i = 0; i < this.objectVertexLocalPosition.length; i++) {
            point = this.worldToScreenSpace(this.objectVertexLocalPosition[i]);

            xLocal = Math.min(xLocal, point[0]);
            yLocal = Math.max(yLocal, point[1]);

            this.cmd("CreateRectangle", this.objectVertexLocalID[i], "", this.VERTEX_WIDTH, this.VERTEX_HEIGHT, point[0], point[1]);
            this.cmd("SetForegroundColor", this.objectVertexLocalID[i], this.LOCAL_VERTEX_FOREGORUND_COLOR);
            this.cmd("SetBackgroundColor", this.objectVertexLocalID[i], this.LOCAL_VERTEX_BACKGROUND_COLOR);

            point = this.worldToScreenSpace(this.objectVertexWorldPosition[i]);

            xGlobal = Math.min(xGlobal, point[0]);
            yGlobal = Math.min(yGlobal, point[1]);

            this.cmd("CreateRectangle", this.objectVertexWorldID[i], "", this.VERTEX_WIDTH, this.VERTEX_HEIGHT, point[0], point[1]);
            this.cmd("SetForegroundColor", this.objectVertexWorldID[i], this.GLOBAL_VERTEX_FOREGORUND_COLOR);
            this.cmd("SetBackgroundColor", this.objectVertexWorldID[i], this.GLOBAL_VERTEX_BACKGROUND_COLOR);
        }
        for (let i = 1; i < this.objectVertexLocalID.length; i++) {
            this.cmd("Connect", this.objectVertexLocalID[i - 1], this.objectVertexLocalID[i], this.LOCAL_EDGE_COLOR, 0, 0, "");
            this.cmd("Connect", this.objectVertexWorldID[i - 1], this.objectVertexWorldID[i], this.GLOBAL_EDGE_COLOR, 0, 0, "");
        }
        this.cmd("Connect", this.objectVertexLocalID[this.objectVertexLocalID.length - 1], this.objectVertexLocalID[0], this.LOCAL_EDGE_COLOR, 0, 0, "");
        this.cmd("Connect", this.objectVertexWorldID[this.objectVertexWorldID.length - 1], this.objectVertexWorldID[0], this.GLOBAL_EDGE_COLOR, 0, 0, "");
        this.localLabelID = this.nextIndex++;
        this.globalLabelID = this.nextIndex++;

        this.cmd("CreateLabel", this.localLabelID, "Local Space", xLocal, yLocal + 2, 0);
        this.cmd("SetForegroundColor", this.localLabelID, this.LOCAL_VERTEX_FOREGORUND_COLOR);

        // const labelPos = this.worldToScreenSpace([xGlobal, yGlobal]);

        this.cmd("CreateLabel", this.globalLabelID, "World Space", xGlobal, yGlobal - 12, 0);
        this.cmd("SetForegroundColor", this.globalLabelID, this.GLOBAL_VERTEX_FOREGORUND_COLOR);
    }

    addControls() {
        this.addLabelToAlgorithmBar("Rotation Angle");

        this.rotationField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.rotationField, "float", this.transformCallback.bind(this));

        this.addLabelToAlgorithmBar("Translate X");

        this.scaleXField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.scaleXField, "float", this.transformCallback.bind(this));

        this.addLabelToAlgorithmBar("Translate Y");

        this.scaleYField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.scaleYField, "float", this.transformCallback.bind(this));

        const transformButton = this.addControlToAlgorithmBar("Button", "Transform");
        transformButton.onclick = this.transformCallback.bind(this);

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

        const yAxisButtonList = this.addRadioButtonGroupToAlgorithmBar(
            ["+y Up", "+y Down"],
            "yAxisDirection",
        );
        this.posYUpButton = yAxisButtonList[0];
        this.posYUpButton.onclick = this.changePosYCallback.bind(this, true);

        this.posYDownButton = yAxisButtonList[1];
        this.posYDownButton.onclick = this.changePosYCallback.bind(this, false);

        this.posYUpButton.checked = this.posYUp;
        this.posYDownButton.checked = !this.posYUp;

        const changeShapeButton = this.addControlToAlgorithmBar("Button", "Change Shape");
        changeShapeButton.onclick = this.changeShapeCallback.bind(this);
    }

    reset() {
        this.rowMajor = true;
        this.posYUp = true;
        this.rotateFirst = true;
        this.currentShape = 0;
        this.rowMajorButton.checked = this.rowMajor;
        this.posYUpButton.checked = this.posYUp;
        this.transformMatrix.data = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
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

        this.moveObjectToNewPosition(this.objectVertexLocalPosition, this.objectVertexLocalID, this.localLabelID, false);
        this.moveObjectToNewPosition(this.objectVertexWorldPosition, this.objectVertexWorldID, this.globalLabelID, true);

        return this.commands;
    }

    moveObjectToNewPosition(objectLocations, objectIDs, labelID, top) {
        let point = this.worldToScreenSpace(objectLocations[0]);
        let labelX = point[0];
        let labelY = point[1];

        for (let i = 0; i < objectLocations.length; i++) {
            point = this.worldToScreenSpace(objectLocations[i]);
            this.cmd("Move", objectIDs[i], point[0], point[1]);

            labelX = Math.min(labelX, point[0]);
            if (top) {
                labelY = Math.min(labelY, point[1]);
            } else {
                labelY = Math.max(labelY, point[1]);
            }
        }
        if (top) {
            this.cmd("Move", labelID, labelX, labelY - 12);
        } else {
            this.cmd("Move", labelID, labelX, labelY + 2);
        }
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

        this.transformMatrix.transpose();
        this.resetMatrixLabels(this.transformMatrix);

        return this.commands;
    }

    fixNumber(value, defaultVal) {
        value = parseFloat(value);
        if (isNaN(value)) value = defaultVal;
        return value;
    }

    transformCallback() {
        this.rotationField.value = this.fixNumber(this.rotationField.value, 0);
        this.scaleXField.value = this.fixNumber(this.scaleXField.value, 0);
        this.scaleYField.value = this.fixNumber(this.scaleYField.value, 0);
        this.implementAction(this.transform.bind(this), `${this.rotationField.value};${this.scaleXField.value};${this.scaleYField.value}`);
    }

    changeShapeCallback() {
        this.implementAction(this.changeShape.bind(this), 0);
    }

    changeShape() {
        this.commands = [];

        for (let i = 0; i < this.objectVertexLocalID.length; i++) {
            this.cmd("Delete", this.objectVertexLocalID[i]);
            this.cmd("Delete", this.objectVertexWorldID[i]);
        }
        this.cmd("Delete", this.localLabelID);
        this.cmd("Delete", this.globalLabelID);
        this.currentShape++;
        if (this.currentShape >= this.OBJECTS.length) {
            this.currentShape = 0;
        }
        this.transformMatrix.data = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.resetMatrixLabels(this.transformMatrix);
        this.setupObject();
        this.setupObjectGraphic();
        return this.commands;
    }

    transform(input) {
        this.commands = [];

        const inputs = input.split(";");
        const rotateDegree = parseFloat(inputs[0]);
        const deltaX = parseFloat(inputs[1]);
        const deltaY = parseFloat(inputs[2]);
        const rotateRadians = this.toRadians(rotateDegree);

        let deltaMatrix;
        if (this.rowMajor) {
            deltaMatrix = this.createMatrix([["cos \u0398", "sin \u0398", 0], ["-sin \u0398", "cos \u0398", 0], ["\u0394x", "\u0394y", "1"]],
                this.MATRIX_START_X + 3 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING,
                this.MATRIX_START_Y);
        } else {
            deltaMatrix = this.createMatrix([["cos \u0398", "-sin \u0398", "\u0394x"], ["sin \u0398", "cos \u0398", "\u0394y"], [0, 0, 1]],
                this.MATRIX_START_X - 3 * this.MATRIX_ELEM_WIDTH - this.MATRIX_MULTIPLY_SPACING,
                this.MATRIX_START_Y);
        }
        this.cmd("Step");

        if (this.rowMajor) {
            deltaMatrix.data = [[`cos ${inputs[0]}`, `sin ${inputs[0]}`, 0], [`-sin ${inputs[0]}`, `cos ${inputs[0]}`, 0], ["\u0394x", "\u0394y", "1"]];
        } else {
            deltaMatrix.data = [[`cos ${inputs[0]}`, `-sin ${inputs[0]}`, "\u0394 x"], [`sin ${inputs[0]}`, `cos ${inputs[0]}`, "\u0394y"], [0, 0, 1]];
        }
        this.resetMatrixLabels(deltaMatrix);
        this.cmd("Step");

        if (this.rowMajor) {
            deltaMatrix.data = [[Math.cos(rotateRadians), Math.sin(rotateRadians), 0], [-Math.sin(rotateRadians), Math.cos(rotateRadians), 0], [deltaX, deltaY, 1]];
        } else {
            deltaMatrix.data = [[Math.cos(rotateRadians), -Math.sin(rotateRadians), deltaX], [Math.sin(rotateRadians), Math.cos(rotateRadians), deltaY], [0, 0, 1]];
        }
        this.resetMatrixLabels(deltaMatrix);
        this.cmd("Step");

        const equalLabel = this.nextIndex++;

        const explainID = this.nextIndex++;

        let resultXPos;
        if (this.rowMajor) {
            resultXPos = this.MATRIX_START_X + 6 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING;
        } else {
            resultXPos = this.MATRIX_START_X + 3 * this.MATRIX_ELEM_WIDTH;
        }
        const resultMatrix = this.createMatrix([["", "", ""], ["", "", ""], ["", "", ""]],
            resultXPos + this.EQUALS_SPACING,
            this.MATRIX_START_Y);
        this.cmd("CreateLabel", equalLabel, "=", resultXPos + this.EQUALS_SPACING / 2,
            this.MATRIX_START_Y + 1.5 * this.MATRIX_ELEM_HEIGHT);

        this.cmd("CreateLabel", explainID, "", resultXPos + this.EQUALS_SPACING, this.MATRIX_START_Y + 3 * this.MATRIX_ELEM_HEIGHT + 5, 0);

        this.cmd("Step"); // TODO:  Remove this?
        if (this.rowMajor) {
            this.multiplyMatrix(this.transformMatrix, deltaMatrix, resultMatrix, explainID);
        } else {
            this.multiplyMatrix(deltaMatrix, this.transformMatrix, resultMatrix, explainID);
        }

        this.setMatrixAlpha(this.transformMatrix, 0);
        this.transformMatrix.data = resultMatrix.data;
        this.resetMatrixLabels(this.transformMatrix);
        this.moveMatrix(resultMatrix, this.MATRIX_START_X, this.MATRIX_START_Y);
        this.deleteMatrix(deltaMatrix);
        this.cmd("Delete", equalLabel);
        this.cmd("SetText", explainID, "");
        this.cmd("Step");
        this.deleteMatrix(resultMatrix);
        this.setMatrixAlpha(this.transformMatrix, 1);

        const transformedObjectID = new Array(this.objectVertexLocalPosition.length);

        let xy;
        if (this.rowMajor) {
            xy = this.createMatrix([["x", "y", 1]], this.MATRIX_START_X - 3 * this.MATRIX_ELEM_WIDTH - this.MATRIX_MULTIPLY_SPACING,
                this.MATRIX_START_Y);
        } else {
            xy = this.createMatrix([["x"], ["y"], [1]], this.MATRIX_START_X + 3 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING,
                this.MATRIX_START_Y);
        }
        this.cmd("Step");

        let equalX, equalY;
        if (this.rowMajor) {
            equalX = this.MATRIX_START_X + 3 * this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING / 2;
            equalY = this.MATRIX_START_Y + 0.5 * this.MATRIX_ELEM_HEIGHT;
            this.cmd("SetPosition", explainID, equalX + this.EQUALS_SPACING / 2, this.MATRIX_START_Y + this.MATRIX_ELEM_HEIGHT + 10);
        } else {
            equalX = this.MATRIX_START_X + 4 * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING + this.EQUALS_SPACING / 2;
            equalY = this.MATRIX_START_Y + 1.5 * this.MATRIX_ELEM_HEIGHT;
            this.cmd("SetPosition", explainID, equalX + this.EQUALS_SPACING / 2, this.MATRIX_START_Y + 3 * this.MATRIX_ELEM_HEIGHT + 10);
        }
        for (let i = 0; i < this.objectVertexLocalPosition.length; i++) {
            this.cmd("Connect", this.originID, this.objectVertexLocalID[i], this.VECTOR_COLOR, 0, 1, "");
            if (this.rowMajor) {
                xy.data[0][0] = this.objectVertexLocalPosition[i][0];
                xy.data[0][1] = this.objectVertexLocalPosition[i][1];
                xy.data[0][2] = 1;
            } else {
                xy.data[0][0] = this.objectVertexLocalPosition[i][0];
                xy.data[1][0] = this.objectVertexLocalPosition[i][1];
                xy.data[2][0] = 1;
            }
            this.resetMatrixLabels(xy);
            this.cmd("Step");

            this.cmd("CreateLabel", equalLabel, "=", equalX, equalY);
            let output;
            if (this.rowMajor) {
                output = this.createMatrix([["", "", ""]], equalX + this.EQUALS_SPACING / 2, this.MATRIX_START_Y);
                this.multiplyMatrix(xy, this.transformMatrix, output, explainID);
            } else {
                output = this.createMatrix([[""], [""], [""]], equalX + this.EQUALS_SPACING / 2, this.MATRIX_START_Y);
                this.multiplyMatrix(this.transformMatrix, xy, output, explainID);
            }

            transformedObjectID[i] = this.nextIndex++;
            let point;
            if (this.rowMajor) {
                point = this.worldToScreenSpace([output.data[0][0], output.data[0][1]]);
            } else {
                point = this.worldToScreenSpace([output.data[0][0], output.data[1][0]]);
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

            this.cmd("Disconnect", this.originID, this.objectVertexLocalID[i]);
            if (this.rowMajor) {
                this.objectVertexWorldPosition[i][0] = output.data[0][0];
                this.objectVertexWorldPosition[i][1] = output.data[0][1];
            } else {
                this.objectVertexWorldPosition[i][0] = output.data[0][0];
                this.objectVertexWorldPosition[i][1] = output.data[1][0];
            }
            this.cmd("Delete", equalLabel);
            this.deleteMatrix(output);
        }
        this.cmd("Step");
        this.cmd("Connect", transformedObjectID[transformedObjectID.length - 1], transformedObjectID[0], this.TRANSFORMED_EDGE_COLOR, 0, 0, "");

        this.cmd("Step", "B");
        this.moveObjectToNewPosition(this.objectVertexWorldPosition, this.objectVertexWorldID, this.globalLabelID, true);
        this.cmd("Step");

        for (let i = 0; i < transformedObjectID.length; i++) {
            this.cmd("Delete", transformedObjectID[i]);
        }

        this.deleteMatrix(xy);
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
