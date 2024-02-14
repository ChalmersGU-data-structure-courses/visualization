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

function AnimatedLinkedList(id, val, wth, hgt, linkPer, verticalOrientation, linkPosEnd, numLab, fillColor, edgeColor, highlightColor, labelColor)
{
    AnimatedLinkedList.superclass.constructor.call(this, fillColor, edgeColor, highlightColor, labelColor);

    this.w = wth;
    this.h = hgt;
    this.val = val;

    this.vertical = verticalOrientation;
    this.linkPositionEnd = linkPosEnd;
    this.linkPercent = linkPer;

    this.numLabels = numLab;
    this.objectID = id;

    this.labels = [];
    this.labelPosX = [];
    this.labelPosY = [];
    this.labelColors = [];
    this.nullPointer = false;

    this.currentHeightDif = 6;
    this.maxHeightDiff = 5;
    this.minHeightDiff = 3;

    for (var i = 0; i < this.numLabels; i++) {
        this.labels[i] = "";
        this.labelPosX[i] = 0;
        this.labelPosY[i] = 0;
        this.labelColors[i] = this.labelColor;
    }

    this.labels[0] = this.val;
}
AnimatedLinkedList.inheritFrom(AnimatedObject);


AnimatedLinkedList.prototype.setNull = function(np)
{
    if (this.nullPointer != np) {
        this.nullPointer = np;
    }
}


AnimatedLinkedList.prototype.getNull = function()
{
    return this.nullPointer;
}


AnimatedLinkedList.prototype.left = function()
{
    if (this.vertical) {
        return this.x - this.w / 2.0;
    }
    else if (this.linkPositionEnd) {
        return this.x - ((this.w * (1 - this.linkPercent)) / 2);
    }
    else {
        return this.x  - (this.w * (this.linkPercent + 1)) / 2;
    }
}


AnimatedLinkedList.prototype.right = function()
{
    if (this.vertical) {
        return this.x + this.w / 2.0;
    }
    else if (this.linkPositionEnd) {
        return this.x + ((this.w * (this.linkPercent + 1)) / 2);
    }
    else {
        return this.x + (this.w * (1 - this.linkPercent)) / 2;
    }
}


AnimatedLinkedList.prototype.top = function()
{
    if (!this.vertical) {
        return this.y - this.h / 2.0;
    }
    else if (this.linkPositionEnd) {
        return this.y - (this.h * (1 -this.linkPercent)) / 2;
    }
    else {
        return this.y - (this.h * (1 + this.linkPercent)) / 2;
    }
}


AnimatedLinkedList.prototype.bottom = function()
{
    if (!this.vertical) {
        return this.y + this.h / 2.0;
    }
    else if (this.linkPositionEnd) {
        return this.y + (this.h * (1 +this.linkPercent)) / 2;
    }
    else {
        return this.y + (this.h * (1 - this.linkPercent)) / 2;
    }
}


// TODO: Should we move this to the draw function, and save the
//       space of the arrays?  Bit of a leftover from the Flash code,
//       which did drawing differently
AnimatedLinkedList.prototype.resetTextPosition = function()
{
    if (this.vertical) {
        this.labelPosX[0] = this.x;

        this.labelPosY[0] = this.y + this.h * (1-this.linkPercent)/2 *(1/this.numLabels - 1);
        //   labelPosY[0] = -height * (1-linkPercent) / 2 + height*(1-linkPercent)/2*numLabels;
        for (var i = 1; i < this.numLabels; i++) {
            this.labelPosY[i] = this.labelPosY[i-1] + this.h*(1-this.linkPercent)/this.numLabels;
            this.labelPosX[i] = this.x;
        }
    }
    else {
        this.labelPosY[0] = this.y;
        this.labelPosX[0] = this.x + this.w * (1-this.linkPercent)/2*(1/this.numLabels - 1);
        for (var i = 1; i < this.numLabels; i++) {
            this.labelPosY[i] = this.y;
            this.labelPosX[i] = this.labelPosX[i-1] +  this.w*(1-this.linkPercent)/this.numLabels;
        }
    }
}


AnimatedLinkedList.prototype.getTailPointerAttachPos = function(fromX, fromY, anchor)
{
    if (this.vertical && this.linkPositionEnd) {
        return [this.x, this.y + this.h / 2.0];
    }
    else if (this.vertical && !this.linkPositionEnd) {
        return [this.x, this.y - this.h / 2.0];
    }
    else if (!this.vertical && this.linkPositionEnd) {
        return [this.x + this.w / 2.0, this.y];
    }
    else { // (!this.vertical && !this.linkPositionEnd)
        return [this.x - this.w / 2.0, this.y];
    }
}


AnimatedLinkedList.prototype.getHeadPointerAttachPos = function(fromX, fromY)
{
    return this.getClosestCardinalPoint(fromX, fromY);
}


AnimatedLinkedList.prototype.setWidth = function(wdth)
{
    this.w = wdth;
    this.resetTextPosition();
}


AnimatedLinkedList.prototype.setHeight = function(hght)
{
    this.h = hght;
    this.resetTextPosition();
}


AnimatedLinkedList.prototype.getWidth = function()
{
    return this.w;
}

AnimatedLinkedList.prototype.getHeight = function()
{
    return this.h;
}


AnimatedLinkedList.prototype.draw = function(ctx)
{
    if (!this.addedToScene) return;

    var x0 = this.left();
    var x1 = this.right();
    var y0 = this.top();
    var y1 = this.bottom();

    ctx.globalAlpha = this.alpha;

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(x0, y0, x1-x0, y1-y0);

    ctx.fillStyle = this.labelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = this.textHeight + 'px sans-serif';

    this.resetTextPosition();
    for (var i = 0; i < this.numLabels; i++) {
        ctx.fillStyle = this.labelColors[i];
        ctx.fillText(this.labels[i], this.labelPosX[i], this.labelPosY[i]);
    }

    ctx.strokeStyle = this.foregroundColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (this.vertical) {
        if (this.linkPositionEnd) {
            var y = y1 - this.h * this.linkPercent;
            ctx.moveTo(x0, y); ctx.lineTo(x1, y);
            if (this.nullPointer) {
                ctx.moveTo(x0, y); ctx.lineTo(x1, y1);
            }
            y1 = y;
        }
        else {
            var y = y0 + this.h * this.linkPercent;
            ctx.moveTo(x0, y); ctx.lineTo(x1, y);
            if (this.nullPointer) {
                ctx.moveTo(x0, y0); ctx.lineTo(x1, y);
            }
            y0 = y;
        }
        for (var i = 1; i < this.numLabels; i++) {
            var y = y0 + (y1-y0) * (i/this.numLabels-1/2);
            ctx.moveTo(x0, y); ctx.lineTo(x1, y);
        }
    }
    else { // !vertical
        if (this.linkPositionEnd) {
            var x = x1 - this.w * this.linkPercent;
            ctx.moveTo(x, y0); ctx.lineTo(x, y1);
            if (this.nullPointer) {
                ctx.moveTo(x, y0); ctx.lineTo(x1, y1);
            }
            x1 = x;
        }
        else {
            var x = x0 + this.w * this.linkPercent;
            ctx.moveTo(x, y0); ctx.lineTo(x, y1);
            if (this.nullPointer) {
                ctx.moveTo(x0, y0); ctx.lineTo(x, y1);
            }
            x0 = x;
        }
        for (var i = 1; i < this.numLabels; i++) {
            var x = x0 + (x1-x0) * (i/this.numLabels-1/2);
            ctx.moveTo(x, y0); ctx.lineTo(x, y1);
        }
    }
    ctx.stroke();

    if (this.highlighted) {
        ctx.strokeStyle = this.highlightColor;
        ctx.lineWidth = this.highlightDiff;
    }
    ctx.strokeRect(this.left(), this.top(), this.getWidth(), this.getHeight());
}


AnimatedLinkedList.prototype.setTextColor = function(color, textIndex)
{
    this.labelColors[textIndex] = color;
}


AnimatedLinkedList.prototype.getTextColor = function(textIndex)
{
    return this.labelColors[textIndex];
}


AnimatedLinkedList.prototype.getText = function(index)
{
    return this.labels[index];
}


AnimatedLinkedList.prototype.setText = function(newText, textIndex)
{
    this.labels[textIndex] = newText;
    this.resetTextPosition();
}


AnimatedLinkedList.prototype.createUndoDelete = function()
{
    return new UndoDeleteLinkedList(this.objectID, this.numLabels, this.labels, this.x, this.y, this.w, this.h, this.linkPercent,
                                    this.linkPositionEnd, this.vertical, this.labelColors, this.backgroundColor, this.foregroundColor,
                                    this.layer, this.nullPointer);
}


AnimatedLinkedList.prototype.setHighlight = function(value)
{
    if (value != this.highlighted) {
        this.highlighted = value;
    }
}



function UndoDeleteLinkedList(id, numlab, lab, x, y, w, h, linkper, posEnd, vert, labColors, bgColor, fgColor, l, np)
{
    this.objectID = id;
    this.posX = x;
    this.posY = y;
    this.width = w;
    this.height = h;
    this.backgroundColor= bgColor;
    this.foregroundColor = fgColor;
    this.labels = lab;
    this.linkPercent = linkper;
    this.verticalOrentation = vert;
    this.linkAtEnd = posEnd;
    this.labelColors = labColors
    this.layer = l;
    this.numLabels = numlab;
    this.nullPointer = np;
}

UndoDeleteLinkedList.inheritFrom(UndoBlock);



UndoDeleteLinkedList.prototype.undoInitialStep =function(world)
{
    world.addLinkedListObject(this.objectID,this.labels[0], this.width, this.height, this.linkPercent, this.verticalOrentation, this.linkAtEnd, this.numLabels, this.backgroundColor, this.foregroundColor);
    world.setNodePosition(this.objectID, this.posX, this.posY);
    world.setLayer(this.objectID, this.layer);
    world.setNull(this.objectID, this.nullPointer);
    for (var i = 0; i < this.numLabels; i++) {
        world.setText(this.objectID, this.labels[i], i);
        world.setTextColor(this.objectID, this.labelColors[i], i);
    }
}
