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
/* globals Algorithm */
///////////////////////////////////////////////////////////////////////////////


Algorithm.Geometric.RotateScale2D = class RotateScale2D extends Algorithm.Geometric {
    XAxisYPos = 300;
    XAxisStart = 100;
    XAxisEnd = 700;

    MATRIX_START_X = 10;
    MATRIX_START_Y = 10;
    MATRIX_MULTIPLY_SPACING = 10;
    EQUALS_SPACING = 30;

    YAxisXPos = 400;
    YAxisStart = 100;
    YAxisEnd = 500;

    MATRIX_ELEM_WIDTH = 50;
    MATRIX_ELEM_HEIGHT = 20;

    OBJECTS = [
        [[100, 100], [-100, 100], [-100, -100], [100, -100]], // Square
        [[10, 100], [-10, 100], [-10, -100], [100, -100], [100, -80], [10, -80]], // L
        [[0, 141], [-134, 44], [-83, -114], [83, -114], [134, 44]], // Pentagon
        [[0, 141], [-35, 48], [-134, 44], [-57, -19], [-83, -114], [0, -60], [83, -114], [57, -19], [134, 44], [35, 48]], // Star
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
        this.objectVertexPosition = this.OBJECTS[this.currentShape].slice(0);
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
        this.cmd("Connect", this.objectVertexID[this.objectVertexID.length - 1], this.objectVertexID[0], this.EDGE_COLOR, 0, 0, "");
    }

    addControls() {
        this.addLabelToAlgorithmBar("Rotation Angle");

        this.rotationField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.rotationField, "float", this.transformCallback.bind(this));

        this.addLabelToAlgorithmBar("Scale X");

        this.scaleXField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.scaleXField, "float", this.transformCallback.bind(this));

        this.addLabelToAlgorithmBar("Scale Y");

        this.scaleYField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
        this.addReturnSubmit(this.scaleYField, "float", this.transformCallback.bind(this));

        const transformButton = this.addButtonToAlgorithmBar("Transform");
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

        const rotateScaleButtonList = this.addRadioButtonGroupToAlgorithmBar(
            ["Rotate, then scale", "Scale, then rotate"],
            "RotateFirst",
        );
        this.rotateScaleButton = rotateScaleButtonList[0];
        this.rotateScaleButton.onclick = this.rotateScaleOrderCallback.bind(this, true);

        this.scaleRotateButton = rotateScaleButtonList[1];
        this.scaleRotateButton.onclick = this.rotateScaleOrderCallback.bind(this, false);

        this.rotateScaleButton.checked = this.rotateFirst;
        this.scaleRotateButton.checked = !this.rotateFirst;

        const changeShapeButton = this.addButtonToAlgorithmBar("Change Shape");
        changeShapeButton.onclick = this.changeShapeCallback.bind(this);
    }

    reset() {
        this.rowMajor = true;
        this.posYUp = true;
        this.rotateFirst = true;
        this.currentShape = 0;
        this.rowMajorButton.checked = this.rowMajor;
        this.posYUpButton.checked = this.posYUp;
        this.rotateScaleButton.checked = this.rotateFirst;

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

    transformCallback() {
        this.rotationField.value = this.fixNumber(this.rotationField.value, 0);
        this.scaleXField.value = this.fixNumber(this.scaleXField.value, 1);
        this.scaleYField.value = this.fixNumber(this.scaleYField.value, 1);
        this.implementAction(this.transform.bind(this), `${this.rotationField.value};${this.scaleXField.value};${this.scaleYField.value}`);
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

    transform(input) {
        const oldNextIndex = this.nextIndex;
        this.commands = [];
        const inputs = input.split(";");
        const rotateDegree = this.toRadians(parseFloat(inputs[0]));
        const scaleX = parseFloat(inputs[1]);
        const scaleY = parseFloat(inputs[2]);

        let xpos = this.MATRIX_START_X;
        const ypos = this.MATRIX_START_Y;
        if (!this.rowMajor) {
            xpos += 2 * this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING;
        }

        let xy;
        if (this.rowMajor) {
            xy = this.createMatrix([["x", "y"]], xpos, ypos);
            xpos += xy.data[0].length * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING;
        }

        let matrixData;
        if (this.rotateFirst) {
            if (this.rowMajor) {
                matrixData = [["cos \u0398", "sin \u0398"], ["-sin \u0398", "cos \u0398"]];
            } else {
                matrixData = [["ScaleX", "0"], ["0", "ScaleY"]];
            }
        } else if (this.rowMajor) {
            matrixData = [["ScaleX", "0"], ["0", "ScaleY"]];
        } else {
            matrixData = [["cos \u0398", "-sin \u0398"], ["sin \u0398", "cos \u0398"]];
        }

        const firstMat = this.createMatrix(matrixData, xpos, ypos);

        xpos += firstMat.data[0].length * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING;

        if (this.rotateFirst) {
            if (this.rowMajor) {
                matrixData = [["ScaleX", "0"], ["0", "ScaleY"]];
            } else {
                matrixData = [["cos \u0398", "-sin \u0398"], ["sin \u0398", "cos \u0398"]];
            }
        } else if (this.rowMajor) {
            matrixData = [["cos \u0398", "sin \u0398"], ["-sin \u0398", "cos \u0398"]];
        } else {
            matrixData = [["ScaleX", "0"], ["0", "ScaleY"]];
        }

        const secondMat = this.createMatrix(matrixData, xpos, ypos);
        xpos += secondMat.data[0].length * this.MATRIX_ELEM_WIDTH;

        if (!this.rowMajor) {
            xpos += this.MATRIX_MULTIPLY_SPACING;
            xy = this.createMatrix([["x"], ["y"]], xpos, ypos);
            xpos += xy.data[0].length * this.MATRIX_ELEM_WIDTH;
        }

        this.cmd("Step");

        let rotMat, scaleMat;
        if ((this.rotateFirst && this.rowMajor) || (!this.rotateFirst && !this.rowMajor)) {
            rotMat = firstMat;
            scaleMat = secondMat;
        } else {
            rotMat = secondMat;
            scaleMat = firstMat;
        }

        if (this.rowMajor) {
            rotMat.data = [[`cos ${inputs[0]}`, `sin ${inputs[0]}`], [`-sin ${inputs[0]}`, `cos ${inputs[0]}`]];
        } else {
            rotMat.data = [[`cos ${inputs[0]}`, `-sin ${inputs[0]}`], [`sin ${inputs[0]}`, `cos ${inputs[0]}`]];
        }
        this.resetMatrixLabels(rotMat);

        scaleMat.data = [[scaleX, 0], [0, scaleY]];
        this.resetMatrixLabels(scaleMat);

        this.cmd("Step");

        if (this.rowMajor) {
            rotMat.data = [[Math.cos(rotateDegree), Math.sin(rotateDegree)], [-Math.sin(rotateDegree), Math.cos(rotateDegree)]];
        } else {
            rotMat.data = [[Math.cos(rotateDegree), -Math.sin(rotateDegree)], [Math.sin(rotateDegree), Math.cos(rotateDegree)]];
        }
        this.resetMatrixLabels(rotMat);
        this.cmd("Step");
        this.setMatrixAlpha(xy, 0.3);

        const equalID = this.nextIndex++;

        let equalXPos;
        if (this.rowMajor) {
            equalXPos = xpos + this.EQUALS_SPACING / 2;
        } else {
            equalXPos = this.MATRIX_START_X + 2 * this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING / 2;
        }

        this.cmd("CreateLabel", equalID, "=", equalXPos, ypos + rotMat.data.length / 2 * this.MATRIX_ELEM_HEIGHT);

        xpos += this.EQUALS_SPACING;

        const paren1 = this.nextIndex++;
        const paren2 = this.nextIndex++;
        const paren3 = this.nextIndex++;
        const paren4 = this.nextIndex++;

        let parenX = 2 * this.MATRIX_ELEM_WIDTH + this.MATRIX_START_X + this.MATRIX_MULTIPLY_SPACING - 2;
        if (!this.rowMajor) {
            parenX += this.EQUALS_SPACING - this.MATRIX_MULTIPLY_SPACING;
        }

        this.cmd("CreateRectangle", paren1, "", 0, 0, parenX, this.MATRIX_START_Y, "center", "center");
        this.cmd("CreateRectangle", paren2, "", 0, 0, parenX, this.MATRIX_START_Y + 2 * this.MATRIX_ELEM_HEIGHT, "center", "center");
        this.cmd("Connect", paren1, paren2, "#000000", 0.2, 0, "");

        parenX = 6 * this.MATRIX_ELEM_WIDTH + this.MATRIX_START_X + 2 * this.MATRIX_MULTIPLY_SPACING + 2;
        if (!this.rowMajor) {
            parenX += this.EQUALS_SPACING - this.MATRIX_MULTIPLY_SPACING;
        }

        this.cmd("CreateRectangle", paren3, "", 0, 0, parenX, this.MATRIX_START_Y, "center", "center");
        this.cmd("CreateRectangle", paren4, "", 0, 0, parenX, this.MATRIX_START_Y + 2 * this.MATRIX_ELEM_HEIGHT, "center", "center");

        this.cmd("Connect", paren3, paren4, "#000000", -0.2, 0, "");

        this.cmd("Step");

        let tmpMat;
        if (this.rowMajor) {
            tmpMat = this.createMatrix([["", ""], ["", ""]], xpos, ypos);
        } else {
            tmpMat = this.createMatrix([["", ""], ["", ""]], this.MATRIX_START_X, this.MATRIX_START_Y);
        }
        const explainID = this.nextIndex++;
        if (this.rowMajor) {
            this.cmd("CreateLabel", explainID, "", 6 * this.MATRIX_ELEM_WIDTH + 2 * this.MATRIX_MULTIPLY_SPACING +
            this.EQUALS_SPACING + this.MATRIX_START_X, 20 + 2 * this.MATRIX_ELEM_HEIGHT, 0);
        } else {
            this.cmd("CreateLabel", explainID, "", this.MATRIX_START_X, 20 + 2 * this.MATRIX_ELEM_HEIGHT, 0);
        }
        this.cmd("Step");
        this.multiplyMatrix(firstMat, secondMat, tmpMat, explainID);

        this.deleteMatrix(firstMat);
        this.deleteMatrix(secondMat);
        this.cmd("Delete", paren1);
        this.cmd("Delete", paren2);
        this.cmd("Delete", paren3);
        this.cmd("Delete", paren4);
        this.cmd("Delete", equalID);

        if (this.rowMajor) {
            this.moveMatrix(tmpMat, xy.data[0].length * this.MATRIX_ELEM_WIDTH + this.MATRIX_MULTIPLY_SPACING + this.MATRIX_START_X,
                this.MATRIX_START_Y);
            xpos = (this.MATRIX_START_X + xy.data[0].length * this.MATRIX_ELEM_WIDTH +
            this.MATRIX_MULTIPLY_SPACING + tmpMat.data[0].length * this.MATRIX_ELEM_WIDTH);
            this.cmd("SetPosition", explainID, 4 * this.MATRIX_ELEM_WIDTH + 1 * this.MATRIX_MULTIPLY_SPACING +
            this.EQUALS_SPACING + this.MATRIX_START_X, 20 + 2 * this.MATRIX_ELEM_HEIGHT, 0);
        } else {
            this.moveMatrix(tmpMat, this.MATRIX_START_X + 4 * this.MATRIX_ELEM_WIDTH + this.EQUALS_SPACING + this.MATRIX_MULTIPLY_SPACING,
                this.MATRIX_START_Y);
            xpos = (this.MATRIX_START_X + 7 * this.MATRIX_ELEM_WIDTH +
            2 * this.MATRIX_MULTIPLY_SPACING + this.EQUALS_SPACING);

            this.cmd("SetPosition", explainID, 7 * this.MATRIX_ELEM_WIDTH + 2 * this.EQUALS_SPACING + 3 * this.MATRIX_MULTIPLY_SPACING, this.MATRIX_START_Y + 10 + 2 * this.MATRIX_ELEM_HEIGHT);
        }
        this.setMatrixAlpha(xy, 1);
        this.cmd("Step");

        const transformedObjectID = new Array(this.objectVertexID.length);

        for (let i = 0; i < this.objectVertexID.length; i++) {
            this.cmd("Connect", this.originID, this.objectVertexID[i], this.VECTOR_COLOR, 0, 1, "");
            if (this.rowMajor) {
                xy.data = [this.objectVertexPosition[i].slice(0)];
            } else {
                xy.data[0][0] = this.objectVertexPosition[i][0];
                xy.data[1][0] = this.objectVertexPosition[i][1];
            }
            this.resetMatrixLabels(xy);
            this.cmd("Step");
            this.cmd("CreateLabel", equalID, "=", xpos + this.EQUALS_SPACING / 2, ypos + tmpMat.data.length / 2 * this.MATRIX_ELEM_HEIGHT);
            let output;
            if (this.rowMajor) {
                output = this.createMatrix([["", ""]], xpos + this.EQUALS_SPACING, ypos);
                this.multiplyMatrix(xy, tmpMat, output, explainID);
            } else {
                output = this.createMatrix([[""], [""]], xpos + this.EQUALS_SPACING, ypos);
                this.multiplyMatrix(tmpMat, xy, output, explainID);
            }

            transformedObjectID[i] = this.nextIndex++;
            let point;
            if (this.rowMajor) {
                point = this.worldToScreenSpace(output.data[0]);
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

            this.cmd("Disconnect", this.originID, this.objectVertexID[i]);
            if (this.rowMajor) {
                this.objectVertexPosition[i] = output.data[0];
            } else {
                this.objectVertexPosition[i][0] = output.data[0][0];
                this.objectVertexPosition[i][1] = output.data[1][0];
            }
            this.cmd("Delete", equalID);
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

        this.deleteMatrix(xy);
        this.deleteMatrix(tmpMat);
        this.cmd("Delete", explainID);

        this.nextIndex = oldNextIndex;

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
        const mat = new this.Matrix(contents, x, y);
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
};
