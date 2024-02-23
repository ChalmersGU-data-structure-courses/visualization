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

///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals AnimatedObject, UndoBlock */
///////////////////////////////////////////////////////////////////////////////


AnimatedObject.Circle = class Circle extends AnimatedObject {
    radius = 20;

    constructor(objectID, label, backgroundColor, foregroundColor, highlightColor, labelColor) {
        super(backgroundColor, foregroundColor, highlightColor, labelColor);
        this.objectID = objectID;
        this.label = label;
    }

    getWidth() {
        return this.radius * 2;
    }

    setWidth(newWidth) {
        this.radius = newWidth / 2;
    }

    getTailPointerAttachPos(fromX, fromY, anchorPoint) {
        return this.getHeadPointerAttachPos(fromX, fromY);
    }

    getHeadPointerAttachPos(fromX, fromY) {
        const xVec = fromX - this.x;
        const yVec = fromY - this.y;
        const len = Math.sqrt(xVec * xVec + yVec * yVec);
        if (len === 0) {
            return [this.x, this.y];
        }
        return [this.x + (xVec / len) * (this.radius), this.y + (yVec / len) * (this.radius)];
    }

    draw(ctx) {
        if (!this.addedToScene) return;

        ctx.globalAlpha = this.alpha;

        ctx.fillStyle = this.backgroundColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${this.textHeight}px sans-serif`;
        ctx.lineWidth = 2;
        ctx.fillStyle = this.labelColor;

        const strList = this.label.split("\n");
        if (strList.length === 1) {
            if (this.highlightIndex < 0 || this.highlightIndex >= this.label.length) {
                ctx.fillText(this.label, this.x, this.y);
            } else {
                const leftStr = this.label.substring(0, this.highlightIndex);
                const highlightStr = this.label.substring(this.highlightIndex, this.highlightIndex + 1);
                const rightStr = this.label.substring(this.highlightIndex + 1);
                const leftWidth = ctx.measureText(leftStr).width;
                const centerWidth = ctx.measureText(highlightStr).width;
                const textWidth = ctx.measureText(this.label).width;
                const x = this.x - textWidth / 2;
                ctx.textAlign = "left";
                ctx.fillText(leftStr, x, this.y);
                ctx.fillText(rightStr, x + leftWidth + centerWidth, this.y);
                ctx.fillStyle = this.highlightColor;
                ctx.fillText(highlightStr, x + leftWidth, this.y);
            }
        } else {
            const offset = (1 - strList.length) / 2;
            for (let i = 0; i < strList.length; i++) {
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
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
    }

    createUndoDelete() {
        return new UndoBlock.DeleteCircle(
            this.objectID, this.label, this.x, this.y,
            this.foregroundColor, this.backgroundColor, this.layer, this.radius,
        );
    }
};


UndoBlock.DeleteCircle = class UndoDeleteCircle extends UndoBlock {
    constructor(objectID, label, x, y, foregroundColor, backgroundColor, layer, radius) {
        super();
        this.objectID = objectID;
        this.x = x;
        this.y = y;
        this.label = label;
        this.foregroundColor = foregroundColor;
        this.backgroundColor = backgroundColor;
        this.layer = layer;
        this.radius = radius;
    }

    undoInitialStep(world) {
        world.addCircleObject(this.objectID, this.label);
        world.setWidth(this.objectID, this.radius * 2);
        world.setNodePosition(this.objectID, this.x, this.y);
        world.setForegroundColor(this.objectID, this.foregroundColor);
        world.setBackgroundColor(this.objectID, this.backgroundColor);
        world.setLayer(this.objectID, this.layer);
    }
};
