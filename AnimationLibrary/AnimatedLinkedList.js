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


class AnimatedLinkedList extends AnimatedObject {
    w;
    h;
    val;
    vertical;
    linkPositionEnd;
    linkPercent;
    numLabels;

    nullPointer = false;
    labels = [];
    labelColors = [];
    currentHeightDif = 6;
    maxHeightDiff = 5;
    minHeightDiff = 3;

    constructor(id, val, wth, hgt, linkPercent, verticalOrientation, linkPositionEnd, 
                numLabels, fillColor, edgeColor, highlightColor, labelColor) {
        super(fillColor, edgeColor, highlightColor, labelColor);
        this.w = wth;
        this.h = hgt;
        this.val = val;
        this.vertical = verticalOrientation;
        this.linkPositionEnd = linkPositionEnd;
        this.linkPercent = linkPercent;
        this.numLabels = numLabels;
        this.objectID = id;

        for (var i = 0; i < this.numLabels; i++) {
            this.labels[i] = "";
            this.labelColors[i] = this.labelColor;
        }
        this.labels[0] = this.val;
    }

    setNull(np) {
        this.nullPointer = np;
    }

    getNull() {
        return this.nullPointer;
    }

    getWidth() {
        return this.w;
    }

    setWidth(wdth) {
        this.w = wdth;
    }

    getHeight() {
        return this.h;
    }

    setHeight(hght) {
        this.h = hght;
    }

    left() {
        var w = (
            this.vertical ?        this.w                          : 
            this.linkPositionEnd ? this.w * (1 - this.linkPercent) : 
            /* otherwise */        this.w * (1 + this.linkPercent)
        );
        return this.x - w/2;
    }

    right() {
        var w = (
            this.vertical ?        this.w                          : 
            this.linkPositionEnd ? this.w * (1 + this.linkPercent) : 
            /* otherwise */        this.w * (1 - this.linkPercent)
        );
        return this.x + w/2;
    }

    top() {
        var h = (
            !this.vertical ?       this.h                          : 
            this.linkPositionEnd ? this.h * (1 - this.linkPercent) : 
            /* otherwise */        this.h * (1 + this.linkPercent)
        );
        return this.y - h/2;
    }

    bottom() {
        var h = (
            !this.vertical ?       this.h                          : 
            this.linkPositionEnd ? this.h * (1 + this.linkPercent) : 
            /* otherwise */        this.h * (1 - this.linkPercent)
        );
        return this.y + h/2;
    }

    getTailPointerAttachPos(fromX, fromY, anchor) {
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

    getHeadPointerAttachPos(fromX, fromY) {
        return this.getClosestCardinalPoint(fromX, fromY);
    }

    getTextColor(textIndex) {
        return this.labelColors[textIndex];
    }

    setTextColor(color, textIndex) {
        this.labelColors[textIndex] = color;
    }

    getText(index) {
        return this.labels[index];
    }

    setText(newText, textIndex) {
        this.labels[textIndex] = newText;
    }

    draw(ctx) {
        if (!this.addedToScene) return;

        var x0 = this.left();
        var x1 = this.right();
        var y0 = this.top();
        var y1 = this.bottom();

        ctx.globalAlpha = this.alpha;

        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);

        ctx.fillStyle = this.labelColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = this.textHeight + 'px sans-serif';

        var labelPos = this.resetTextPositions();
        for (var i = 0; i < this.numLabels; i++) {
            ctx.fillStyle = this.labelColors[i];
            ctx.fillText(this.labels[i], labelPos[i].x, labelPos[i].y);
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
                var y = y0 + (y1 - y0) * (i / this.numLabels - 1 / 2);
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
                var x = x0 + (x1 - x0) * (i / this.numLabels - 1 / 2);
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

    resetTextPositions() {
        var labelPos = []
        if (this.vertical) {
            labelPos[0] = {
                x: this.x,
                y: this.y + this.h * (1 - this.linkPercent) / 2 * (1 / this.numLabels - 1),
                // -height * (1-linkPercent) / 2 + height*(1-linkPercent)/2*numLabels;
            };
            for (var i = 1; i < this.numLabels; i++) {
                labelPos[i] = {
                    x: this.x,
                    y: labelPos[i-1].y + this.h * (1 - this.linkPercent) / this.numLabels,
                };
            }
        }
        else { 
            labelPos[0] = {
                y: this.y,
                x: this.x + this.w * (1 - this.linkPercent) / 2 * (1 / this.numLabels - 1),
            };
            for (var i = 1; i < this.numLabels; i++) {
                labelPosY[i] = {
                    y: this.y,
                    x: labelPos[i-1].x + this.w * (1 - this.linkPercent) / this.numLabels,
                };
            }
        }
        return labelPos;
    }

    createUndoDelete() {
        return new UndoDeleteLinkedList(this.objectID, this.numLabels, this.labels, this.x, this.y, this.w, this.h, this.linkPercent,
            this.linkPositionEnd, this.vertical, this.labelColors, this.backgroundColor, this.foregroundColor,
            this.layer, this.nullPointer);
    }
}



class UndoDeleteLinkedList extends UndoBlock {
    constructor(id, numlab, lab, x, y, w, h, linkper, posEnd, vert, labColors, bgColor, fgColor, l, np) {
        super();
        this.objectID = id;
        this.posX = x;
        this.posY = y;
        this.width = w;
        this.height = h;
        this.backgroundColor = bgColor;
        this.foregroundColor = fgColor;
        this.labels = lab;
        this.linkPercent = linkper;
        this.verticalOrentation = vert;
        this.linkAtEnd = posEnd;
        this.labelColors = labColors;
        this.layer = l;
        this.numLabels = numlab;
        this.nullPointer = np;
    }

    undoInitialStep(world) {
        world.addLinkedListObject(this.objectID, this.labels[0], this.width, this.height, this.linkPercent, this.verticalOrentation, this.linkAtEnd, this.numLabels, this.backgroundColor, this.foregroundColor);
        world.setNodePosition(this.objectID, this.posX, this.posY);
        world.setLayer(this.objectID, this.layer);
        world.setNull(this.objectID, this.nullPointer);
        for (var i = 0; i < this.numLabels; i++) {
            world.setText(this.objectID, this.labels[i], i);
            world.setTextColor(this.objectID, this.labelColors[i], i);
        }
    }
}

