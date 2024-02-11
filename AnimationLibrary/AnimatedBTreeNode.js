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


function AnimatedBTreeNode(id, widthPerElem, h, numElems, fillColor, edgeColor, highlightColor)
{
    AnimatedBTreeNode.superclass.constructor.call(this);

    this.objectID = id;
    this.widthPerElement = widthPerElem;
    this.nodeHeight = h;
    this.numLabels = numElems;
    this.backgroundColor = fillColor || AnimatedBTreeNode.BACKGROUND_COLOR;
    this.foregroundColor = edgeColor || AnimatedBTreeNode.FOREGROUND_COLOR;
    this.highlightColor = highlightColor || AnimatedBTreeNode.HIGHLIGHT_COLOR;

    this.labels = new Array(this.numLabels);
    this.labelColors = new Array(this.numLabels);
    for (var i = 0; i < this.numLabels; i++) {
        this.labelColors[i] = this.foregroundColor;
    }
}
AnimatedBTreeNode.inheritFrom(AnimatedObject);


AnimatedBTreeNode.BACKGROUND_COLOR = "#FFFFFF";
AnimatedBTreeNode.FOREGROUND_COLOR = "#000000";
AnimatedBTreeNode.HIGHLIGHT_COLOR = "#FF0000";

AnimatedBTreeNode.MIN_WIDTH = 10;
AnimatedBTreeNode.CORNER_RADIUS = 10;
AnimatedBTreeNode.EDGE_POINTER_DISPLACEMENT = 5;


AnimatedBTreeNode.prototype.getNumElements = function()
{
    return this.numLabels;
}


AnimatedBTreeNode.prototype.getWidth = function()
{
    if (this.numLabels > 0) {
        return  (this.widthPerElement * this.numLabels);
    }
    else {
        return AnimatedBTreeNode.MIN_WIDTH;
    }
}


AnimatedBTreeNode.prototype.setNumElements = function(newNumElements)
{
    if (this.numLabels < newNumElements) {
        for (var i = this.numLabels; i < newNumElements; i++) {
            this.labels[i] = "";
            this.labelColors[i] = this.foregroundColor;
        }
        this.numLabels = newNumElements;
    }
    else if (this.numLabels > newNumElements) {
        for (var i = newNumElements; i < this.numLabels; i++) {
            this.labels[i] = null;
        }
        this.numLabels = newNumElements;
    }
}


AnimatedBTreeNode.prototype.left = function()
{
    return this.x - this.getWidth() / 2;
}

AnimatedBTreeNode.prototype.right = function()
{
    return this.x + this.getWidth() / 2;
}

AnimatedBTreeNode.prototype.top = function()
{
    return this.y - this.nodeHeight / 2;
}

AnimatedBTreeNode.prototype.bottom = function()
{
    return this.y + this.nodeHeight / 2;
}


AnimatedBTreeNode.prototype.draw = function(context)
{
    var x0 = this.left();
    var y0 = this.top();
    if (isNaN(x0)) x0 = 0;

    if (this.highlighted) {
        context.strokeStyle = this.highlightColor;
        context.fillStyle = this.highlightColor;
        context.lineWidth = 2;

        context.beginPath();
        context.roundRect(
            x0 - this.highlightDiff, 
            y0 - this.highlightDiff, 
            this.getWidth() + 2 * this.highlightDiff, 
            this.nodeHeight + 2 * this.highlightDiff, 
            AnimatedBTreeNode.CORNER_RADIUS
        );
        context.stroke();
        context.fill();
    }

    context.strokeStyle = this.foregroundColor;
    context.fillStyle = this.backgroundColor;
    context.lineWidth = 2;

    context.beginPath();
    context.roundRect(x0, y0, this.getWidth(), this.nodeHeight, AnimatedBTreeNode.CORNER_RADIUS);
    context.stroke();
    context.fill();

    context.lineWidth = 1;
    context.beginPath();
    for (var i = 1; i < this.numLabels; i++) {
        var x = x0 + i * this.widthPerElement;
        context.moveTo(x, y0);
        context.lineTo(x, y0 + this.nodeHeight);
    }
    context.stroke();

    context.textAlign = 'center';
    context.textBaseline = 'middle';

    for (var i = 0; i < this.numLabels; i++) {
        var labelx = this.x - this.widthPerElement * this.numLabels / 2 + this.widthPerElement / 2 + i * this.widthPerElement;
        context.fillStyle = this.labelColors[i];
        context.fillText(this.labels[i], labelx, this.y);
    }
}


AnimatedBTreeNode.prototype.getHeight = function()
{
    return this.nodeHeight;
}


AnimatedBTreeNode.prototype.setForegroundColor = function(newColor)
{
    this.foregroundColor = newColor;
    for (var i = 0; i < numLabels; i++) {
        labelColor[i] = newColor;
    }
}


AnimatedBTreeNode.prototype.getTailPointerAttachPos = function(fromX, fromY, anchor)
{
    if (anchor == 0) {
        return [this.left() + AnimatedBTreeNode.EDGE_POINTER_DISPLACEMENT, this.y];
    }
    else if (anchor == this.numLabels) {
        return [this.right() - AnimatedBTreeNode.EDGE_POINTER_DISPLACEMENT, this.y];
    }
    else {
        return [this.left() + anchor * this.widthPerElement, this.y]
    }
}


AnimatedBTreeNode.prototype.getHeadPointerAttachPos = function(fromX, fromY)
{
    if (fromY < this.y - this.nodeHeight / 2) {
        return [this.x, this.y - this.nodeHeight / 2];
    }
    else if (this.fromY > this.y + this.nodeHeight / 2) {
        return [this.x, this.y + this.nodeHeight / 2];
    }
    else if (fromX  <  this.x - this.getWidth() / 2) {
        return [this.x - this.getWidth() / 2, this.y];
    }
    else {
        return [this.x + this.getWidth() / 2, this.y];
    }
}


AnimatedBTreeNode.prototype.createUndoDelete = function()
{
    return new UndoDeleteBTreeNode(this.objectID, this.numLabels, this.labels, this.x, this.y, this.widthPerElement, this.nodeHeight, this.labelColors, this.backgroundColor, this.foregroundColor, this.layer, this.highlighted);
}


AnimatedBTreeNode.prototype.getTextColor = function(textIndex)
{
    return this.labelColors[textIndex || 0];
}

AnimatedBTreeNode.prototype.setTextColor = function(color, textIndex)
{
    this.labelColors[textIndex || 0] = color;
}


AnimatedBTreeNode.prototype.getText = function(index)
{
    return this.labels[index || 0];
}    

AnimatedBTreeNode.prototype.setText = function(newText, textIndex)
{
    this.labels[textIndex || 0] = newText;
}


function UndoDeleteBTreeNode(id, numLab, labelText, x, y, wPerElement, nHeight, lColors, bgColor, fgColor, l, highlighted)
{
    this.objectID = id;
    this.posX = x;
    this.posY = y;
    this.widthPerElem = wPerElement;
    this.nodeHeight = nHeight;
    this.backgroundColor= bgColor;
    this.foregroundColor = fgColor;
    this.numElems = numLab;
    this.labels = labelText;

    this.labelColors = lColors;
    this.layer = l;
    this.highlighted = highlighted;
}

UndoDeleteBTreeNode.inheritFrom(UndoBlock);


UndoDeleteBTreeNode.prototype.undoInitialStep = function(world)
{

    world.addBTreeNode(this.objectID, this.widthPerElem, this.nodeHeight, this.numElems, this.backgroundColor, this.foregroundColor);
    world.setNodePosition(this.objectID, this.posX, this.posY);
    for (var i = 0; i < this.numElems; i++) {
        world.setText(this.objectID, this.labels[i], i);
        world.setTextColor(this.objectID, this.labelColors[i],i);
    }
    world.setHighlight(this.objectID, this.highlighted);
    world.setLayer(this.objectID, this.layer);
}

