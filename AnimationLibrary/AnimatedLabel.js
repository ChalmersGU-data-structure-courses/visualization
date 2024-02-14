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


function AnimatedLabel(id, val, center, initialWidth, ctx, labelColor, highlightColor)
{
    AnimatedLabel.superclass.constructor.call(this, null, labelColor, highlightColor);

    this.centering = center;
    this.label = val;
    this.objectID = id;
    this.ctx = ctx; 
    this.textWidth = initialWidth || this.getTextWidth();
    this.leftWidth = -1;
    this.centerWidth = -1;
    this.highlightIndex = -1;
}
AnimatedLabel.inheritFrom(AnimatedObject);

AnimatedLabel.prototype.alwaysOnTop = true;


AnimatedLabel.prototype.centered = function()
{
    return this.centering;
}


AnimatedLabel.prototype.draw = function(ctx)
{
    if (!this.addedToScene) return;

    ctx.globalAlpha = this.alpha;
    ctx.font = this.textHeight + 'px sans-serif';

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    if (this.centering) {
        if (this.highlightIndex < 0) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
        }
        else {
            x0 = this.x - this.textWidth / 2;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
        }
    }

    if (this.highlighted) {
        ctx.strokeStyle = this.highlightColor;
        ctx.lineWidth = this.highlightDiff;
        ctx.strokeText(this.label, this.x, this.y);
    }

    ctx.fillStyle = this.labelColor;
    strList = this.label.split("\n");
    if (strList.length == 1) {
        if (this.highlightIndex < 0 || this.highlightIndex >= this.label.length) {
            ctx.fillText(this.label, this.x, this.y);
        }
        else {
            var leftStr = this.label.substring(0, this.highlightIndex);
            var highlightStr = this.label.substring(this.highlightIndex, this.highlightIndex + 1)
            var rightStr = this.label.substring(this.highlightIndex + 1)
            var leftWidth = ctx.measureText(leftStr).width;
            var centerWidth = ctx.measureText(highlightStr).width;
            ctx.fillText(leftStr, x0, this.y)
            ctx.fillText(rightStr, x0 + leftWidth + centerWidth, this.y)
            ctx.fillStyle = this.highlightColor;
            ctx.fillText(highlightStr, x0 + leftWidth, this.y)
        }
    }
    else {
        var offset = (this.centering) ? (1 - strList.length) / 2 : 0;
        for (var i = 0; i < strList.length; i++) {
            ctx.fillText(strList[i], this.x, this.y + (i + offset) * this.textHeight);
        }
    }
}


AnimatedLabel.prototype.getTextWidth = function()
{
    this.ctx.font = this.textHeight + 'px sans-serif';
    var strList = this.label.split("\n");
    var width = 0;
    if (strList.length == 1) {
        width = this.ctx.measureText(this.label).width;
    }
    else {
        for (var i = 0; i < strList.length; i++) {
            width = Math.max(width, this.ctx.measureText(strList[i]).width);
        }
    }
    return width;
}


AnimatedLabel.prototype.getAlignLeftPos = function(otherObject)
{
    if (this.centering) {
        return [otherObject.left() - this.textWidth / 2, this.y = otherObject.centerY()];
    }
    else {
        return [otherObject.left() - this.textWidth, otherObject.centerY() - this.textHeight / 2];
    }
}


AnimatedLabel.prototype.alignLeft = function(otherObject)
{
    if (this.centering) {
        this.y = otherObject.centerY();
        this.x = otherObject.left() - this.textWidth / 2;
    }
    else {
        this.y = otherObject.centerY() - this.textHeight / 2;
        this.x = otherObject.left() - this.textWidth;
    }
}


AnimatedLabel.prototype.alignRight = function(otherObject)
{
    if (this.centering) {
        this.y = otherObject.centerY();
        this.x = otherObject.right() + this.textWidth / 2;
    }
    else {
        this.y = otherObject.centerY() - this.textHeight / 2;
        this.x = otherObject.right();
    }
}


AnimatedLabel.prototype.getAlignRightPos = function(otherObject)
{
    if (this.centering) {
        return [otherObject.right() + this.textWidth / 2, otherObject.centerY()];
    }
    else {
        return [otherObject.right(), otherObject.centerY() - this.textHeight / 2];
    }
}


AnimatedLabel.prototype.alignTop = function(otherObject)
{
    if (this.centering) {
        this.y = otherObject.top() - this.textHeight / 2;
        this.x = otherObject.centerX();
    }
    else {
        this.y = otherObject.top() - 10;
        this.x = otherObject.centerX() - this.textWidth / 2;
    }
}


AnimatedLabel.prototype.getAlignTopPos = function(otherObject)
{
    if (this.centering) {
        return [otherObject.centerX(), otherObject.top() - this.textHeight / 2];
    }
    else {
        return [otherObject.centerX() - this.textWidth / 2, otherObject.top() - 10];
    }
}


AnimatedLabel.prototype.alignBottom = function(otherObject)
{
    if (this.centering) {
        this.y = otherObject.bottom() + this.textHeight / 2;
        this.x = otherObject.centerX();
    }
    else {
        this.y = otherObject.bottom();
        this.x = otherObject.centerX() - this.textWidth / 2;
    }
}


AnimatedLabel.prototype.getAlignBottomPos = function(otherObject)
{
    if (this.centering) {
        return [otherObject.centerX(),  otherObject.bottom() + this.textHeight / 2];
    }
    else {
        return [otherObject.centerX() - this.textWidth / 2,  otherObject.bottom()];
    }
}


AnimatedLabel.prototype.getWidth = function()
{
    return this.textWidth;
}


AnimatedLabel.prototype.getHeight = function()
{
    return this.textHeight;
}


AnimatedLabel.prototype.setHeight = function(newHeight)
{
    this.textHeight = newHeight;
    this.textWidth = this.getTextWidth();
}


AnimatedLabel.prototype.setHighlight = function(value)
{
    this.highlighted = value;
}


AnimatedLabel.prototype.createUndoDelete = function()
{
    return new UndoDeleteLabel(this.objectID, this.label, this.x, this.y, this.centering, this.labelColor, this.layer, this.highlightIndex);
}


AnimatedLabel.prototype.centerX = function()
{
    if (this.centering) {
        return this.x;
    }
    else {
        return this.x + this.textWidth;
    }
}


AnimatedLabel.prototype.centerY = function()
{
    if (this.centering) {
        return this.y;
    }
    else {
        return this.y + this.textHeight / 2;
    }
}


AnimatedLabel.prototype.top = function()
{
    if (this.centering) {
        return  this.y - this.textHeight / 2;
    }
    else {
        return this.y;
    }
}


AnimatedLabel.prototype.bottom = function()
{
    if (this.centering) {
        return this.y + this.textHeight / 2;
    }
    else {
        return this.y + this.textHeight;
    }
}


AnimatedLabel.prototype.right = function()
{
    if (this.centering) {
        return this.x + this.textWidth / 2;
    }
    else {
        return this.x + this.textWidth;
    }
}


AnimatedLabel.prototype.left = function()
{
    if (this.centering) {
        return this.x - this.textWidth / 2;
    }
    else {
        return this.x;
    }
}


AnimatedLabel.prototype.setHighlightIndex = function(hlIndex)
{
    // Only allow highlight index for labels that don't have End-Of-Line
    if (this.label.indexOf("\n") == -1 && this.label.length > hlIndex) {
        this.highlightIndex = hlIndex;
    }
    else {
        this.highlightIndex = -1;
    }
}


AnimatedLabel.prototype.getTailPointerAttachPos = function(fromX, fromY, anchorPoint)
{
    return this.getClosestCardinalPoint(fromX, fromY);
}


AnimatedLabel.prototype.getHeadPointerAttachPos = function (fromX, fromY)
{
    return this.getClosestCardinalPoint(fromX, fromY);
}


AnimatedLabel.prototype.setText = function(newText, textIndex, initialWidth)
{
    this.label = newText;
    this.textWidth = initialWidth || this.getTextWidth();
}



function UndoDeleteLabel(id, lab, x, y, centered, color, l, hli)
{
    this.objectID = id;
    this.posX = x;
    this.posY = y;
    this.nodeLabel = lab;
    this.labCentered = centered;
    this.labelColor = color;
    this.layer = l;
    this.highlightIndex = hli;
}

UndoDeleteLabel.inheritFrom(UndoBlock);

UndoDeleteLabel.prototype.undoInitialStep = function(world)
{
    world.addLabelObject(this.objectID, this.nodeLabel, this.labCentered);
    world.setNodePosition(this.objectID, this.posX, this.posY);
    world.setForegroundColor(this.objectID, this.labelColor);
    world.setLayer(this.objectID, this.layer);
}

