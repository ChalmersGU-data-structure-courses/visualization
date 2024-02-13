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



function GeoRotateTranslate2D(am)
{
    this.init(am);
}
GeoRotateTranslate2D.inheritFrom(Algorithm);


GeoRotateTranslate2D.XAxisYPos = 300;
GeoRotateTranslate2D.XAxisStart = 100;
GeoRotateTranslate2D.XAxisEnd = 700;

GeoRotateTranslate2D.MATRIX_ELEM_WIDTH = 50;
GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT = 20;


GeoRotateTranslate2D.MATRIX_MULTIPLY_SPACING = 10;
GeoRotateTranslate2D.EQUALS_SPACING = 30;
GeoRotateTranslate2D.MATRIX_START_X = 10 + 3 * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH + GeoRotateTranslate2D.MATRIX_MULTIPLY_SPACING;
GeoRotateTranslate2D.MATRIX_START_Y = 10;



GeoRotateTranslate2D.YAxisXPos = 400;
GeoRotateTranslate2D.YAxisStart = 100;
GeoRotateTranslate2D.YAxisEnd = 500;


GeoRotateTranslate2D.OBJECTS = [
                         [[100, 100], [-100, 100], [-100,-100], [100, -100]], // Square
                         [[10, 100], [-10, 100], [-10,-100], [100, -100], [100, -80], [10,-80]], // L
                         [[0, 141], [-134, 44], [-83, -114 ], [83, -114], [134,44]], // Pentagon
                         [[0, 141], [-35,48],[-134, 44], [-57, -19], [-83, -114 ], [0, -60],[83,-114], [57, -19], [134,44], [35, 48]], // Star
                         ]


GeoRotateTranslate2D.AXIS_COLOR = "#9999FF"

GeoRotateTranslate2D.LOCAL_VERTEX_FOREGORUND_COLOR = "#000000";
GeoRotateTranslate2D.LOCAL_VERTEX_BACKGROUND_COLOR = GeoRotateTranslate2D.LOCAL_VERTEX_FOREGORUND_COLOR;
GeoRotateTranslate2D.LOCAL_EDGE_COLOR = "#000000";

GeoRotateTranslate2D.GLOBAL_VERTEX_FOREGORUND_COLOR = "#00FF00";
GeoRotateTranslate2D.GLOBAL_VERTEX_BACKGROUND_COLOR = GeoRotateTranslate2D.GLOBAL_VERTEX_FOREGORUND_COLOR;
GeoRotateTranslate2D.GLOBAL_EDGE_COLOR = "#00FF00";



GeoRotateTranslate2D.TRANSFORMED_VERTEX_FOREGORUND_COLOR = "#66FF66";
GeoRotateTranslate2D.TRANSFORMED_VERTEX_BACKGROUND_COLOR = GeoRotateTranslate2D.TRANSFORMED_VERTEX_FOREGORUND_COLOR;
GeoRotateTranslate2D.TRANSFORMED_EDGE_COLOR = "#66FF66";




GeoRotateTranslate2D.VECTOR_COLOR = "#FF0000";

GeoRotateTranslate2D.VERTEX_WIDTH = 3;
GeoRotateTranslate2D.VERTEX_HEIGHT = GeoRotateTranslate2D.VERTEX_WIDTH;

GeoRotateTranslate2D.prototype.init = function(am)
{
    GeoRotateTranslate2D.superclass.init.call(this, am);
    this.rowMajor = true;
    this.posYUp = true;
    this.rotateFirst = true;
    this.addControls();
    this.currentShape = 0;

    this.commands = [];
    this.nextIndex = 0;

    this.setupAxis();


    this.transformMatrix = this.createMatrix([[1, 0, 0], [ 0, 1, 0], [0, 0, 1]], GeoRotateTranslate2D.MATRIX_START_X, GeoRotateTranslate2D.MATRIX_START_Y);

    this.savedNextIndex = this.nextIndex;
    this.setupObject();
    this.setupObjectGraphic();

    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
    this.clearHistory();


}

GeoRotateTranslate2D.prototype.setupAxis = function()
{
    this.xAxisLeft = this.nextIndex++;
    this.xAxisRight = this.nextIndex++;
    this.yAxisTop = this.nextIndex++;
    this.yAxisBottom = this.nextIndex++;

    this.xAxisLabel = this.nextIndex++;
    this.yAxisLabel = this.nextIndex++;

    this.originID = this.nextIndex++;

    this.cmd("CreateRectangle", this.originID, "", 0, 0, GeoRotateTranslate2D.YAxisXPos, GeoRotateTranslate2D.XAxisYPos);


    this.cmd("CreateRectangle", this.xAxisLeft, "", 0, 0, GeoRotateTranslate2D.XAxisStart, GeoRotateTranslate2D.XAxisYPos);
    this.cmd("SetAlpha", this.xAxisLeft, 0);
    this.cmd("CreateRectangle", this.xAxisRight, "", 0, 0,  GeoRotateTranslate2D.XAxisEnd, GeoRotateTranslate2D.XAxisYPos);
    this.cmd("SetAlpha", this.xAxisRight, 0);
    this.cmd("Connect", this.xAxisLeft, this.xAxisRight, GeoRotateTranslate2D.AXIS_COLOR, 0, 1, "");
    this.cmd("Connect", this.xAxisRight, this.xAxisLeft, GeoRotateTranslate2D.AXIS_COLOR, 0, 1, "");


    this.cmd("CreateRectangle", this.yAxisTop, "", 0, 0,  GeoRotateTranslate2D.YAxisXPos, GeoRotateTranslate2D.YAxisStart);
    this.cmd("SetAlpha", this.yAxisTop, 0);
    this.cmd("CreateRectangle", this.yAxisBottom, "", 0, 0, GeoRotateTranslate2D.YAxisXPos, GeoRotateTranslate2D.YAxisEnd);
    this.cmd("SetAlpha", this.yAxisBottom, 0);
    this.cmd("Connect", this.yAxisTop, this.yAxisBottom, GeoRotateTranslate2D.AXIS_COLOR, 0, 1, "");
    this.cmd("Connect", this.yAxisBottom, this.yAxisTop, GeoRotateTranslate2D.AXIS_COLOR, 0, 1, "");
    if (this.posYUp) {
        this.cmd("CreateLabel", this.yAxisLabel, "+y", GeoRotateTranslate2D.YAxisXPos + 10, GeoRotateTranslate2D.YAxisStart + 10);
    }
    else {
        this.cmd("CreateLabel", this.yAxisLabel, "+y", GeoRotateTranslate2D.YAxisXPos + 10, GeoRotateTranslate2D.YAxisEnd - 10);
    }
    this.cmd("CreateLabel", this.xAxisLabel, "+x", GeoRotateTranslate2D.XAxisEnd - 10, GeoRotateTranslate2D.XAxisYPos - 10);
    this.cmd("SetForegroundColor", this.yAxisLabel, GeoRotateTranslate2D.AXIS_COLOR);
    this.cmd("SetForegroundColor", this.xAxisLabel, GeoRotateTranslate2D.AXIS_COLOR);
}


GeoRotateTranslate2D.prototype.setupObject = function()
{
    var i = 0;
    this.objectVertexLocalPosition = new Array(GeoRotateTranslate2D.OBJECTS[this.currentShape].length);
    this.objectVertexWorldPosition = new Array(GeoRotateTranslate2D.OBJECTS[this.currentShape].length);
    for (i = 0; i < GeoRotateTranslate2D.OBJECTS[this.currentShape].length; i++) {
        this.objectVertexLocalPosition[i] = GeoRotateTranslate2D.OBJECTS[this.currentShape][i].slice(0)
        this.objectVertexWorldPosition[i] = GeoRotateTranslate2D.OBJECTS[this.currentShape][i].slice(0);

    }
}


GeoRotateTranslate2D.prototype.worldToScreenSpace = function(point)
{
    var transformedPoint = new Array(2);
    transformedPoint[0] = point[0] + GeoRotateTranslate2D.YAxisXPos;
    if (this.posYUp) {
        transformedPoint[1] = GeoRotateTranslate2D.XAxisYPos - point[1];
    }
    else {
        transformedPoint[1] = GeoRotateTranslate2D.XAxisYPos + point[1];

    }
    return transformedPoint;
}








GeoRotateTranslate2D.prototype.setupObjectGraphic = function()
{
    var i;

    this.objectVertexLocalID = new Array(this.objectVertexLocalPosition.length);
    this.objectVertexWorldID = new Array(this.objectVertexWorldPosition.length);
    for (i= 0; i < this.objectVertexLocalPosition.length; i++) {
        this.objectVertexLocalID[i] = this.nextIndex++;
    }
    for (i= 0; i < this.objectVertexWorldPosition.length; i++) {
        this.objectVertexWorldID[i] = this.nextIndex++;
    }


    var point = this.worldToScreenSpace(this.objectVertexLocalPosition[0])
    var xLocal = point[0];
    var yLocal = point[1];
    point = this.worldToScreenSpace(this.objectVertexWorldPosition[0])
    var xGlobal = point[0];
    var yGlobal = point[1];

    for (i = 0; i < this.objectVertexLocalPosition.length; i++) {
        point = this.worldToScreenSpace(this.objectVertexLocalPosition[i]);

        xLocal = Math.min(xLocal, point[0]);
        yLocal = Math.max(yLocal, point[1]);


        this.cmd("CreateRectangle", this.objectVertexLocalID[i], "", GeoRotateTranslate2D.VERTEX_WIDTH, GeoRotateTranslate2D.VERTEX_HEIGHT, point[0], point[1]);
        this.cmd("SetForegroundColor", this.objectVertexLocalID[i], GeoRotateTranslate2D.LOCAL_VERTEX_FOREGORUND_COLOR);
        this.cmd("SetBackgroundColor", this.objectVertexLocalID[i], GeoRotateTranslate2D.LOCAL_VERTEX_BACKGROUND_COLOR);



        point = this.worldToScreenSpace(this.objectVertexWorldPosition[i]);

        xGlobal = Math.min(xGlobal, point[0]);
        yGlobal = Math.min(yGlobal, point[1]);

        this.cmd("CreateRectangle", this.objectVertexWorldID[i], "", GeoRotateTranslate2D.VERTEX_WIDTH, GeoRotateTranslate2D.VERTEX_HEIGHT, point[0], point[1]);
        this.cmd("SetForegroundColor", this.objectVertexWorldID[i], GeoRotateTranslate2D.GLOBAL_VERTEX_FOREGORUND_COLOR);
        this.cmd("SetBackgroundColor", this.objectVertexWorldID[i], GeoRotateTranslate2D.GLOBAL_VERTEX_BACKGROUND_COLOR);

    }
    for (i = 1; i < this.objectVertexLocalID.length; i++) {
        this.cmd("Connect", this.objectVertexLocalID[i-1], this.objectVertexLocalID[i], GeoRotateTranslate2D.LOCAL_EDGE_COLOR, 0, 0, "");
        this.cmd("Connect", this.objectVertexWorldID[i-1], this.objectVertexWorldID[i], GeoRotateTranslate2D.GLOBAL_EDGE_COLOR, 0, 0, "");
    }
    this.cmd("Connect", this.objectVertexLocalID[this.objectVertexLocalID.length - 1], this.objectVertexLocalID[0], GeoRotateTranslate2D.LOCAL_EDGE_COLOR, 0, 0, "");
    this.cmd("Connect", this.objectVertexWorldID[this.objectVertexWorldID.length - 1], this.objectVertexWorldID[0], GeoRotateTranslate2D.GLOBAL_EDGE_COLOR, 0, 0, "");
    this.localLabelID = this.nextIndex++;
    this.globalLabelID = this.nextIndex++;


    this.cmd("CreateLabel", this.localLabelID, "Local Space", xLocal, yLocal + 2, 0);
    this.cmd("SetForegroundColor", this.localLabelID, GeoRotateTranslate2D.LOCAL_VERTEX_FOREGORUND_COLOR);

    labelPos = this.worldToScreenSpace([xGlobal, yGlobal]);

    this.cmd("CreateLabel", this.globalLabelID, "World Space", xGlobal, yGlobal - 12, 0);
    this.cmd("SetForegroundColor", this.globalLabelID, GeoRotateTranslate2D.GLOBAL_VERTEX_FOREGORUND_COLOR);



}

GeoRotateTranslate2D.prototype.addControls = function()
{
    this.addLabelToAlgorithmBar("Rotation Angle");

    this.rotationField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
    this.addReturnSubmit(this.rotationField, "float", this.transformCallback.bind(this));

    this.addLabelToAlgorithmBar("Translate X");

    this.scaleXField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
    this.addReturnSubmit(this.scaleXField, "float", this.transformCallback.bind(this));

    this.addLabelToAlgorithmBar("Translate Y");

    this.scaleYField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
    this.addReturnSubmit(this.scaleYField, "float", this.transformCallback.bind(this));

    var transformButton = this.addControlToAlgorithmBar("Button", "Transform");
    transformButton.onclick = this.transformCallback.bind(this);

    var radioButtonList = this.addRadioButtonGroupToAlgorithmBar(
        ["Row Major", "Column Major"],
        "RankType"
    );
    this.rowMajorButton = radioButtonList[0];
    this.rowMajorButton.onclick = this.changeRowColMajorCallback.bind(this, true);

    this.colMajorButton = radioButtonList[1];
    this.colMajorButton.onclick = this.changeRowColMajorCallback.bind(this, false);

    this.rowMajorButton.checked = this.rowMajor;
    this.colMajorButton.checked = !this.rowMajor;

    var radioButtonList = this.addRadioButtonGroupToAlgorithmBar(
        ["+y Up", "+y Down"],
        "yAxisDirection"
    );
    this.posYUpButton = radioButtonList[0];
    this.posYUpButton.onclick = this.changePosYCallback.bind(this, true);

    this.posYDownButton = radioButtonList[1];
    this.posYDownButton.onclick = this.changePosYCallback.bind(this, false);

    this.posYUpButton.checked = this.posYUp;
    this.posYDownButton.checked = !this.posYUp;

    var changeShapeButton = this.addControlToAlgorithmBar("Button", "Change Shape");
    changeShapeButton.onclick = this.changeShapeCallback.bind(this);
}






GeoRotateTranslate2D.prototype.reset = function()
{
    this.rowMajor = true;
    this.posYUp = true;
    this.rotateFirst = true;
    this.currentShape = 0;
    this.rowMajorButton.checked = this.rowMajor;
    this.posYUpButton.checked = this.posYUp;
    this.transformMatrix.data = [[1,0,0],[0,1,0],[0,0,1]];
    this.nextIndex = this.savedNextIndex;
    this.setupObject();
    this.setupObjectGraphic();
}


GeoRotateTranslate2D.prototype.changePosYCallback = function(posYUp)
{
    if (this.posYUp != posYUp) {
        this.implementAction(this.changePosY.bind(this),  posYUp);
    }
}

GeoRotateTranslate2D.prototype.changePosY = function(posYUp)
{
    this.commands = new Array();
    this.posYUp= posYUp;
    if (this.posYUpButton.checked != this.posYUp) {
        this.posYUpButton.checked = this.posYUp;
    }
    if (this.posYDownButton.checked == this.posYUp) {
        this.posYDownButton.checked = !this.posYUp;
    }
    if (this.posYUp) {
        this.cmd("Move", this.yAxisLabel,  GeoRotateTranslate2D.YAxisXPos + 10, GeoRotateTranslate2D.YAxisStart + 10);
    }
    else {
        this.cmd("Move", this.yAxisLabel,  GeoRotateTranslate2D.YAxisXPos + 10, GeoRotateTranslate2D.YAxisEnd - 10);

    }

    this.moveObjectToNewPosition(this.objectVertexLocalPosition, this.objectVertexLocalID, this.localLabelID, false);
    this.moveObjectToNewPosition(this.objectVertexWorldPosition, this.objectVertexWorldID, this.globalLabelID, true);


    return this.commands;
}


GeoRotateTranslate2D.prototype.moveObjectToNewPosition = function(objectLocations, objectIDs, labelID, top)
{
    var point = this.worldToScreenSpace(objectLocations[0])
    var labelX = point[0];
    var labelY = point[1];

    for (var i = 0; i < objectLocations.length; i++) {
        point = this.worldToScreenSpace(objectLocations[i]);
        this.cmd("Move", objectIDs[i], point[0], point[1]);

        labelX = Math.min(labelX, point[0]);
        if (top) {
            labelY = Math.min(labelY, point[1]);
        }
        else {
            labelY = Math.max(labelY, point[1]);

        }
    }
    if (top) {
        this.cmd("Move", labelID, labelX, labelY - 12);
    }
    else {
        this.cmd("Move", labelID, labelX, labelY + 2);
    }
}

GeoRotateTranslate2D.prototype.changeRowColMajorCallback = function(rowMajor)
{
    if (this.rowMajor != rowMajor) {
        this.implementAction(this.changeRowCol.bind(this),  rowMajor);
    }
}

GeoRotateTranslate2D.prototype.changeRowCol = function(rowMajor)
{
    this.commands = new Array();
    this.rowMajor= rowMajor;
    if (this.rowMajorButton.checked != this.rowMajor) {
        this.rowMajorButton.checked = this.rowMajor;
    }
    if (this.colMajorButton.checked == this.rowMajor) {
        this.colMajorButton.checked = !this.rowMajor;
    }

    this.transformMatrix.transpose();
    this.resetMatrixLabels(this.transformMatrix);


    return this.commands;
}


GeoRotateTranslate2D.prototype.fixNumber = function(value, defaultVal)
{
    value = parseFloat(value);
    if (isNaN(value)) value = defaultVal;
    return value;
}


GeoRotateTranslate2D.prototype.transformCallback = function()
{
    this.rotationField.value = this.fixNumber(this.rotationField.value, 0);
    this.scaleXField.value = this.fixNumber(this.scaleXField.value, 0);
    this.scaleYField.value = this.fixNumber(this.scaleYField.value, 0);
    this.implementAction(this.transform.bind(this), this.rotationField.value + ";" + this.scaleXField.value + ";" + this.scaleYField.value);
}


GeoRotateTranslate2D.prototype.changeShapeCallback = function()
{
    this.implementAction(this.changeShape.bind(this), 0);
}

GeoRotateTranslate2D.prototype.changeShape = function()
{
    this.commands = [];
    var i;
    for (i = 0; i < this.objectVertexLocalID.length; i++) {
        this.cmd("Delete", this.objectVertexLocalID[i]);
        this.cmd("Delete", this.objectVertexWorldID[i]);
    }
    this.cmd("Delete", this.localLabelID);
    this.cmd("Delete", this.globalLabelID);
    this.currentShape++;
    if (this.currentShape >= GeoRotateTranslate2D.OBJECTS.length) {
        this.currentShape = 0;
    }
    this.transformMatrix.data = [[1,0,0],[0,1,0],[0,0,1]];
    this.resetMatrixLabels(this.transformMatrix);
    this.setupObject();
    this.setupObjectGraphic();
    return this.commands;
}


function toRadians(degrees)
{
    return (degrees * 2 * Math.PI) / 360.0;
}

GeoRotateTranslate2D.prototype.transform = function(input)
{
    this.commands = [];

    var inputs = input.split(";");
    var rotateDegree = parseFloat(inputs[0]);
    var deltaX = parseFloat(inputs[1]);
    var deltaY = parseFloat(inputs[2]);
    var rotateRadians = toRadians(rotateDegree);


    var deltaMatrix;
    if (this.rowMajor) {
        deltaMatrix = this.createMatrix([["cos \u0398", "sin \u0398", 0], ["-sin \u0398", "cos \u0398", 0],["\u0394x", "\u0394y", "1"]],
                                        GeoRotateTranslate2D.MATRIX_START_X +3 * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH + GeoRotateTranslate2D.MATRIX_MULTIPLY_SPACING,
                                        GeoRotateTranslate2D.MATRIX_START_Y);
    }
    else {
        deltaMatrix = this.createMatrix([["cos \u0398", "-sin \u0398", "\u0394x"], ["sin \u0398", "cos \u0398", "\u0394y"],[0, 0, 1]],
                                        GeoRotateTranslate2D.MATRIX_START_X -3 * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH - GeoRotateTranslate2D.MATRIX_MULTIPLY_SPACING,
                                        GeoRotateTranslate2D.MATRIX_START_Y);
    }
    this.cmd("Step");

    if (this.rowMajor) {
        deltaMatrix.data = [["cos " + inputs[0], "sin " + inputs[0], 0], ["-sin " + inputs[0], "cos " + inputs[0], 0],["\u0394x", "\u0394y", "1"]]
    }
    else {
        deltaMatrix.data = [["cos " + inputs[0], "-sin " + inputs[0], "\u0394 x"], ["sin " + inputs[0], "cos " + inputs[0], "\u0394y"],[0, 0, 1]];
    }
    this.resetMatrixLabels(deltaMatrix);
    this.cmd("Step");

    if (this.rowMajor) {
        deltaMatrix.data = [[Math.cos(rotateRadians), Math.sin(rotateRadians), 0], [-Math.sin(rotateRadians), Math.cos(rotateRadians), 0],[deltaX, deltaY, 1]]
    }
    else {
        deltaMatrix.data = [[Math.cos(rotateRadians), -Math.sin(rotateRadians), deltaX], [Math.sin(rotateRadians), Math.cos(rotateRadians), deltaY],[0,0, 1]]
    }
    this.resetMatrixLabels(deltaMatrix);
    this.cmd("Step");

    var equalLabel = this.nextIndex++;
    var resultMatrix;
    var explainID = this.nextIndex++;
    var resultXPos;

    if (this.rowMajor) {
        resultXPos = GeoRotateTranslate2D.MATRIX_START_X +6 * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH + GeoRotateTranslate2D.MATRIX_MULTIPLY_SPACING;
    }
    else {
        resultXPos = GeoRotateTranslate2D.MATRIX_START_X +3 * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH;
    }
    resultMatrix = this.createMatrix([["", "", ""],["", "", ""],["", "", ""]],
                                     resultXPos + GeoRotateTranslate2D.EQUALS_SPACING,
                                     GeoRotateTranslate2D.MATRIX_START_Y);
    this.cmd("CreateLabel", equalLabel, "=", resultXPos + GeoRotateTranslate2D.EQUALS_SPACING / 2,
             GeoRotateTranslate2D.MATRIX_START_Y + 1.5 * GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT);

    this.cmd("CreateLabel", explainID, "",  resultXPos + GeoRotateTranslate2D.EQUALS_SPACING, GeoRotateTranslate2D.MATRIX_START_Y + 3 * GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT + 5, 0);


    this.cmd("Step"); // TODO:  Remove this?
    if (this.rowMajor) {
        this.multiplyMatrix(this.transformMatrix, deltaMatrix, resultMatrix, explainID);
    }
    else {
        this.multiplyMatrix(deltaMatrix, this.transformMatrix, resultMatrix, explainID);
    }

    this.setMatrixAlpha(this.transformMatrix, 0);
    this.transformMatrix.data = resultMatrix.data;
    this.resetMatrixLabels(this.transformMatrix);
    this.moveMatrix(resultMatrix, GeoRotateTranslate2D.MATRIX_START_X, GeoRotateTranslate2D.MATRIX_START_Y);
    this.deleteMatrix(deltaMatrix);
    this.cmd("Delete", equalLabel);
    this.cmd("SetText", explainID, "");
    this.cmd("Step");
    this.deleteMatrix(resultMatrix);
    this.setMatrixAlpha(this.transformMatrix, 1);
    var i;

    var transformedObjectID = new Array(this.objectVertexLocalPosition.length);

    var xy;

    if (this.rowMajor) {
        xy = this.createMatrix([["x", "y", 1]], GeoRotateTranslate2D.MATRIX_START_X - 3 * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH - GeoRotateTranslate2D.MATRIX_MULTIPLY_SPACING,
                               GeoRotateTranslate2D.MATRIX_START_Y);
    }
    else {
        xy = this.createMatrix([["x"], ["y"], [1]], GeoRotateTranslate2D.MATRIX_START_X + 3 * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH + GeoRotateTranslate2D.MATRIX_MULTIPLY_SPACING,
                               GeoRotateTranslate2D.MATRIX_START_Y);

    }
    this.cmd("Step");
    var equalX;
    var equalY;

    if (this.rowMajor) {
        equalX = GeoRotateTranslate2D.MATRIX_START_X + 3*GeoRotateTranslate2D.MATRIX_ELEM_WIDTH + GeoRotateTranslate2D.EQUALS_SPACING / 2;
        equalY = GeoRotateTranslate2D.MATRIX_START_Y + 0.5 * GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT;
        this.cmd("SetPosition", explainID, equalX + GeoRotateTranslate2D.EQUALS_SPACING / 2, GeoRotateTranslate2D.MATRIX_START_Y + GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT + 10);
    }
    else {
        equalX = GeoRotateTranslate2D.MATRIX_START_X + 4*GeoRotateTranslate2D.MATRIX_ELEM_WIDTH + GeoRotateTranslate2D.MATRIX_MULTIPLY_SPACING + GeoRotateTranslate2D.EQUALS_SPACING / 2;
        equalY = GeoRotateTranslate2D.MATRIX_START_Y + 1.5 * GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT;
        this.cmd("SetPosition", explainID, equalX + GeoRotateTranslate2D.EQUALS_SPACING / 2, GeoRotateTranslate2D.MATRIX_START_Y + 3 * GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT + 10);
    }
    for (i = 0; i < this.objectVertexLocalPosition.length; i++) {
        this.cmd("Connect", this.originID, this.objectVertexLocalID[i], GeoRotateTranslate2D.VECTOR_COLOR, 0, 1, "");
        if (this.rowMajor) {
            xy.data[0][0] = this.objectVertexLocalPosition[i][0];
            xy.data[0][1] = this.objectVertexLocalPosition[i][1];
            xy.data[0][2] = 1;
        }
        else {
            xy.data[0][0] = this.objectVertexLocalPosition[i][0];
            xy.data[1][0] = this.objectVertexLocalPosition[i][1];
            xy.data[2][0] = 1;
        }
        this.resetMatrixLabels(xy);
        this.cmd("Step");

        this.cmd("CreateLabel", equalLabel, "=", equalX, equalY);
        if (this.rowMajor) {
            output = this.createMatrix([["","", ""]],  equalX + GeoRotateTranslate2D.EQUALS_SPACING / 2, GeoRotateTranslate2D.MATRIX_START_Y);
            this.multiplyMatrix(xy, this.transformMatrix, output, explainID);
        }
        else {
            output = this.createMatrix([[""],[""], [""]],   equalX + GeoRotateTranslate2D.EQUALS_SPACING / 2, GeoRotateTranslate2D.MATRIX_START_Y)
            this.multiplyMatrix(this.transformMatrix, xy, output, explainID);
        }

        transformedObjectID[i] = this.nextIndex++;
        var point;
        if (this.rowMajor) {
            point = this.worldToScreenSpace([output.data[0][0], output.data[0][1]]);
        }
        else {
            point = this.worldToScreenSpace([output.data[0][0], output.data[1][0]]);
        }

        this.cmd("CreateRectangle", transformedObjectID[i], "", GeoRotateTranslate2D.VERTEX_WIDTH, GeoRotateTranslate2D.VERTEX_HEIGHT, point[0], point[1]);
        this.cmd("SetForegroundColor", transformedObjectID[i], GeoRotateTranslate2D.TRANSFORMED_VERTEX_FOREGORUND_COLOR);
        this.cmd("SetBackgroundColor", transformedObjectID[i], GeoRotateTranslate2D.TRANSFORMED_VERTEX_BACKGROUND_COLOR);
        this.cmd("Connect", this.originID, transformedObjectID[i], GeoRotateTranslate2D.TRANSFORMED_EDGE_COLOR, 0, 1, "");
        this.cmd("Step");
        this.cmd("Disconnect", this.originID, transformedObjectID[i]);

        if (i > 0) {
            this.cmd("Connect", transformedObjectID[i-1], transformedObjectID[i], GeoRotateTranslate2D.TRANSFORMED_EDGE_COLOR, 0, 0, "");
        }

        this.cmd("Disconnect", this.originID, this.objectVertexLocalID[i]);
        if (this.rowMajor) {
            this.objectVertexWorldPosition[i][0] = output.data[0][0];
            this.objectVertexWorldPosition[i][1] = output.data[0][1];
        }
        else {
            this.objectVertexWorldPosition[i][0] = output.data[0][0];
            this.objectVertexWorldPosition[i][1] = output.data[1][0];
        }
        this.cmd("Delete", equalLabel);
        this.deleteMatrix(output);
    }
    this.cmd("Step");
    this.cmd("Connect", transformedObjectID[transformedObjectID.length-1], transformedObjectID[0], GeoRotateTranslate2D.TRANSFORMED_EDGE_COLOR, 0, 0, "");

    this.cmd("Step","B");
    this.moveObjectToNewPosition(this.objectVertexWorldPosition, this.objectVertexWorldID, this.globalLabelID, true);
    this.cmd("Step");

    for (i = 0; i < transformedObjectID.length; i++) {
        this.cmd("Delete", transformedObjectID[i]);
    }


    this.deleteMatrix(xy);
    return this.commands;
}


GeoRotateTranslate2D.prototype.multiplyMatrix = function(mat1, mat2, mat3, explainID)
{
    var i;
    var j;
    var explainText = "";
    for (i = 0; i < mat1.data.length; i++) {
        for (j = 0; j < mat2.data[0].length; j++) {
            var explainText = "";
            var value = 0;
            for (k = 0; k < mat2.data.length; k++) {
                this.cmd("SetHighlight", mat1.dataID[i][k], 1);
                this.cmd("SetHighlight", mat2.dataID[k][j], 1);
                if (explainText != "") {
                        explainText = explainText + " + ";
                }
                value = value + mat1.data[i][k] * mat2.data[k][j];
                explainText = explainText + String(mat1.data[i][k]) + " * " + String(mat2.data[k][j]);
                this.cmd("SetText", explainID, explainText);
                this.cmd("Step");
                this.cmd("SetHighlight", mat1.dataID[i][k], 0);
                this.cmd("SetHighlight", mat2.dataID[k][j], 0);
            }
            value = this.standardize(value);
            explainText += " = " + String(value);
            this.cmd("SetText", explainID, explainText);
            mat3.data[i][j] = value;
            this.cmd("SetText", mat3.dataID[i][j], value);
            this.cmd("Step");
        }
    }
    this.cmd("SetText", explainID, "");


}

GeoRotateTranslate2D.prototype.standardize = function(lab)
{
    var newLab = Math.round(lab * 1000) / 1000;
    if (isNaN(newLab)) {
        return lab;
    }
    else {
        return newLab;
    }
}


GeoRotateTranslate2D.prototype.resetMatrixLabels = function(mat)
{
    var i,j;
    for (i = 0; i < mat.data.length; i++) {
        for (j = 0; j < mat.data[i].length; j++) {
            mat.data[i][j] = this.standardize(mat.data[i][j]);
            this.cmd("SetText", mat.dataID[i][j], mat.data[i][j]);
        }
    }
}



GeoRotateTranslate2D.prototype.moveMatrix = function(mat, x, y)
{
    var height = mat.data.length;
    var width = 0;

    var i, j;
    for (i = 0; i < mat.data.length; i++) {
        width = Math.max(width, mat.data[i].length);
    }


    this.cmd("Move", mat.leftBrack1, x, y);
    this.cmd("Move", mat.leftBrack2, x, y);
    this.cmd("Move", mat.leftBrack3, x, y + height * GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT);

    this.cmd("Move", mat.rightBrack1,  x + width * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH, y);
    this.cmd("Move", mat.rightBrack2,   x + width * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH, y);
    this.cmd("Move", mat.rightBrack3,  x+ width * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH, y + height * GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT);

    for (i = 0; i < mat.data.length; i++) {
        for (j = 0; j < mat.data[i].length; j++) {
            this.cmd("Move", mat.dataID[i][j],
                     x + j*GeoRotateTranslate2D.MATRIX_ELEM_WIDTH + GeoRotateTranslate2D.MATRIX_ELEM_WIDTH / 2,
                     y + i*GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT + GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT / 2);
        }
    }
}

GeoRotateTranslate2D.prototype.deleteMatrix = function(mat)
{
    this.cmd("Delete",mat.leftBrack1);
    this.cmd("Delete",mat.leftBrack2);
    this.cmd("Delete",mat.leftBrack3);
    this.cmd("Delete",mat.rightBrack1);
    this.cmd("Delete",mat.rightBrack2);
    this.cmd("Delete",mat.rightBrack3);
    var i,j;
    for (i = 0; i < mat.data.length; i++) {
        for (j = 0; j < mat.data[i].length; j++) {
            this.cmd("Delete", mat.dataID[i][j]);
        }
    }
}

GeoRotateTranslate2D.prototype.setMatrixAlpha = function(mat, alpha)
{
    this.cmd("SetAlpha",mat.leftBrack1, alpha);
    this.cmd("SetAlpha",mat.leftBrack2, alpha);
    this.cmd("SetAlpha",mat.leftBrack3, alpha);
    this.cmd("SetAlpha",mat.rightBrack1, alpha);
    this.cmd("SetAlpha",mat.rightBrack2, alpha);
    this.cmd("SetAlpha",mat.rightBrack3, alpha);
    var i,j;
    for (i = 0; i < mat.data.length; i++) {
        for (j = 0; j < mat.data[i].length; j++) {
            this.cmd("SetAlpha", mat.dataID[i][j], alpha);
        }
    }
}


GeoRotateTranslate2D.prototype.createMatrix = function(contents, x, y)
{
    var mat = new Matrix(contents, x, y);
    mat.leftBrack1 = this.nextIndex++;
    mat.leftBrack2 = this.nextIndex++;
    mat.leftBrack3 = this.nextIndex++;
    mat.rightBrack1 = this.nextIndex++;
    mat.rightBrack2 = this.nextIndex++;
    mat.rightBrack3 = this.nextIndex++;

    var height = mat.data.length;
    var width = 0;

    var i, j;
    mat.dataID = new Array(mat.data.length);
    for (i = 0; i < mat.data.length; i++) {
        width = Math.max(width, mat.data[i].length);
        mat.dataID[i] = new Array(mat.data[i].length);
        for (j = 0; j < mat.data[i].length; j++) {
            mat.dataID[i][j] = this.nextIndex++;
        }
    }

    this.cmd("CreateRectangle", mat.leftBrack1, "", 5, 1,  x, y, "left","center");
    this.cmd("CreateRectangle", mat.leftBrack2, "", 1, height * GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT,  x, y, "center","top");
    this.cmd("CreateRectangle", mat.leftBrack3, "", 5, 1,  x, y + height * GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT , "left","center");

    this.cmd("CreateRectangle", mat.rightBrack1, "", 5, 1,  x + width * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH, y, "right","center");
    this.cmd("CreateRectangle", mat.rightBrack2, "", 1, height * GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT,  x + width * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH, y, "center","top");
    this.cmd("CreateRectangle", mat.rightBrack3, "", 5, 1,  x+ width * GeoRotateTranslate2D.MATRIX_ELEM_WIDTH, y + height * GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT , "right","center");

    for (i = 0; i < mat.data.length; i++) {
        for (j = 0; j < mat.data[i].length; j++) {
            this.cmd("CreateLabel", mat.dataID[i][j], mat.data[i][j],
                     x + j*GeoRotateTranslate2D.MATRIX_ELEM_WIDTH + GeoRotateTranslate2D.MATRIX_ELEM_WIDTH / 2,
                     y + i*GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT + GeoRotateTranslate2D.MATRIX_ELEM_HEIGHT / 2);
        }
    }
    return mat;
}

var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new GeoRotateTranslate2D(animManag);
}

function Matrix(contents, x, y)
{
    this.data = contents;
    this.x = x;
    this.y = y;
}

Matrix.prototype.transpose = function()
{
    var newData = new Array(this.data[0].length);
    var i,j;
    for (i = 0; i < this.data[0].length; i++) {
        newData[i] = new Array(this.data.length);
    }
    for (i = 0; i < this.data.length; i++) {
        for (j = 0; j < this.data[i].length; j++) {
            newData[j][i] = this.data[i][j];
        }
    }
    this.data = newData;
}


