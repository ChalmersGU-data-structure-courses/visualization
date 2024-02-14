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


var AnimatedCircle = function(objectID, objectLabel, backgroundColor, foregroundColor, highlightColor, labelColor)
{
    AnimatedCircle.superclass.constructor.call(this, backgroundColor, foregroundColor, highlightColor, labelColor);

    this.objectID = objectID;
    this.label = objectLabel;
    this.radius = AnimatedCircle.RADIUS;
    this.thickness = 3;
}
AnimatedCircle.inheritFrom(AnimatedObject);


AnimatedCircle.RADIUS = 20;


AnimatedCircle.prototype.getTailPointerAttachPos = function(fromX, fromY, anchorPoint)
{
    return this.getHeadPointerAttachPos(fromX, fromY);
}


AnimatedCircle.prototype.getWidth = function()
{
    return this.radius * 2;
}


AnimatedObject.prototype.setWidth = function(newWidth)
{
    this.radius = newWidth / 2;
}


AnimatedCircle.prototype.getHeadPointerAttachPos = function(fromX, fromY)
{
    var xVec = fromX - this.x;
    var yVec = fromY - this.y;
    var len = Math.sqrt(xVec * xVec + yVec*yVec);
    if (len == 0) {
        return [this.x, this.y];
    }
    return [this.x + (xVec/len)*(this.radius), this.y + (yVec/len)*(this.radius)];
}


AnimatedCircle.prototype.setHighlightIndex = function(hlIndex)
{
    this.highlightIndex = hlIndex;
}


AnimatedCircle.prototype.draw = function(ctx)
{
    if (!this.addedToScene) return;

    ctx.globalAlpha = this.alpha;

    ctx.fillStyle = this.backgroundColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = this.textHeight + 'px sans-serif';
    ctx.lineWidth = 2;
    ctx.fillStyle = this.labelColor;

    var strList = this.label.split("\n");
    if (strList.length == 1) {
        if (this.highlightIndex < 0 || this.highlightIndex >= this.label.length) {
            ctx.fillText(this.label, this.x, this.y);
        } else {
            var leftStr = this.label.substring(0, this.highlightIndex);
            var highlightStr = this.label.substring(this.highlightIndex, this.highlightIndex + 1);
            var rightStr = this.label.substring(this.highlightIndex + 1);
            var leftWidth = ctx.measureText(leftStr).width;
            var centerWidth = ctx.measureText(highlightStr).width;
            var x0 = this.x - this.textWidth / 2;
            ctx.textAlign = 'left';
            ctx.fillText(leftStr, x0, this.y);
            ctx.fillText(rightStr, x0 + leftWidth + centerWidth, this.y);
            ctx.fillStyle = this.highlightColor;
            ctx.fillText(highlightStr, x0 + leftWidth, this.y)
        }
    }
    else {
        var offset = (1 - strList.length) / 2;
        for (var i = 0; i < strList.length; i++) {
            ctx.fillText(strList[i], this.x, this.y + (i + offset) * this.textHeight);
        }
    }

    ctx.strokeStyle = this.foregroundColor;
    ctx.lineWidth = 2;
    if (this.highlighted) {
        ctx.strokeStyle = this.highlightColor;
        ctx.lineWidth = this.highlightDiff;
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.closePath();
    ctx.stroke();
}


AnimatedCircle.prototype.createUndoDelete = function()
{
    return new UndoDeleteCircle(this.objectID, this.label, this.x, this.y, this.foregroundColor, this.backgroundColor, this.layer, this.radius);
}


function UndoDeleteCircle(id, lab, x, y, foregroundColor, backgroundColor, l, radius)
{
    this.objectID = id;
    this.posX = x;
    this.posY = y;
    this.nodeLabel = lab;
    this.fgColor = foregroundColor;
    this.bgColor = backgroundColor;
    this.layer = l;
    this.radius = radius;
}

UndoDeleteCircle.inheritFrom(UndoBlock);

UndoDeleteCircle.prototype.undoInitialStep = function(world)
{
    world.addCircleObject(this.objectID, this.nodeLabel);
    world.setWidth(this.objectID, this.radius * 2);
    world.setNodePosition(this.objectID, this.posX, this.posY);
    world.setForegroundColor(this.objectID, this.fgColor);
    world.setBackgroundColor(this.objectID, this.bgColor);
    world.setLayer(this.objectID, this.layer);
}

