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


AnimatedObject.LinkedList = class LinkedList extends AnimatedObject {
    w;
    h;
    linkPercent;
    vertical;
    linkPositionEnd;
    numLabels;

    nullPointer = false;
    labels = [];
    labelColors = [];

    constructor(objectID, initalLabel, w, h, linkPercent, vertical, linkPositionEnd,
        numLabels, backgroundColor, foregroundColor, highlightColor, labelColor) {
        super(backgroundColor, foregroundColor, highlightColor, labelColor);
        this.objectID = objectID;
        this.w = w;
        this.h = h;
        this.linkPercent = linkPercent;
        this.vertical = vertical;
        this.linkPositionEnd = linkPositionEnd;
        this.numLabels = numLabels;

        for (let i = 0; i < this.numLabels; i++) {
            this.labels[i] = "";
            this.labelColors[i] = this.labelColor;
        }
        this.labels[0] = initalLabel;
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
        const w = (
            this.vertical ? this.w :
            this.linkPositionEnd ? this.w * (1 - this.linkPercent) :
            /* otherwise */ this.w * (1 + this.linkPercent)
        );
        return this.x - w / 2;
    }

    right() {
        const w = (
            this.vertical ? this.w :
            this.linkPositionEnd ? this.w * (1 + this.linkPercent) :
            /* otherwise */ this.w * (1 - this.linkPercent)
        );
        return this.x + w / 2;
    }

    top() {
        const h = (
            !this.vertical ? this.h :
            this.linkPositionEnd ? this.h * (1 - this.linkPercent) :
            /* otherwise */ this.h * (1 + this.linkPercent)
        );
        return this.y - h / 2;
    }

    bottom() {
        const h = (
            !this.vertical ? this.h :
            this.linkPositionEnd ? this.h * (1 + this.linkPercent) :
            /* otherwise */ this.h * (1 - this.linkPercent)
        );
        return this.y + h / 2;
    }

    getTailPointerAttachPos(fromX, fromY, anchor) {
        if (this.vertical && this.linkPositionEnd) {
            return [this.x, this.y + this.h / 2.0];
        } else if (this.vertical && !this.linkPositionEnd) {
            return [this.x, this.y - this.h / 2.0];
        } else if (!this.vertical && this.linkPositionEnd) {
            return [this.x + this.w / 2.0, this.y];
        } else { // (!this.vertical && !this.linkPositionEnd)
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

        let x0 = this.left();
        let x1 = this.right();
        let y0 = this.top();
        let y1 = this.bottom();

        ctx.globalAlpha = this.alpha;

        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);

        ctx.fillStyle = this.labelColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${this.textHeight}px sans-serif`;

        const labelPos = this.resetTextPositions();
        for (let i = 0; i < this.numLabels; i++) {
            ctx.fillStyle = this.labelColors[i];
            ctx.fillText(this.labels[i], labelPos[i].x, labelPos[i].y);
        }

        ctx.strokeStyle = this.foregroundColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (this.vertical) {
            if (this.linkPositionEnd) {
                const y = y1 - this.h * this.linkPercent;
                ctx.moveTo(x0, y), ctx.lineTo(x1, y);
                if (this.nullPointer) {
                    ctx.moveTo(x0, y), ctx.lineTo(x1, y1);
                }
                y1 = y;
            } else {
                const y = y0 + this.h * this.linkPercent;
                ctx.moveTo(x0, y), ctx.lineTo(x1, y);
                if (this.nullPointer) {
                    ctx.moveTo(x0, y0), ctx.lineTo(x1, y);
                }
                y0 = y;
            }
            for (let i = 1; i < this.numLabels; i++) {
                const y = y0 + (y1 - y0) * (i / this.numLabels - 1 / 2);
                ctx.moveTo(x0, y), ctx.lineTo(x1, y);
            }
        } else { // !vertical
            if (this.linkPositionEnd) {
                const x = x1 - this.w * this.linkPercent;
                ctx.moveTo(x, y0), ctx.lineTo(x, y1);
                if (this.nullPointer) {
                    ctx.moveTo(x, y0), ctx.lineTo(x1, y1);
                }
                x1 = x;
            } else {
                const x = x0 + this.w * this.linkPercent;
                ctx.moveTo(x, y0), ctx.lineTo(x, y1);
                if (this.nullPointer) {
                    ctx.moveTo(x0, y0), ctx.lineTo(x, y1);
                }
                x0 = x;
            }
            for (let i = 1; i < this.numLabels; i++) {
                const x = x0 + (x1 - x0) * (i / this.numLabels - 1 / 2);
                ctx.moveTo(x, y0), ctx.lineTo(x, y1);
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
        const labelPos = [];
        if (this.vertical) {
            labelPos[0] = {
                x: this.x,
                y: this.y + this.h * (1 - this.linkPercent) / 2 * (1 / this.numLabels - 1),
                // -height * (1-linkPercent) / 2 + height*(1-linkPercent)/2*numLabels;
            };
            for (let i = 1; i < this.numLabels; i++) {
                labelPos[i] = {
                    x: this.x,
                    y: labelPos[i - 1].y + this.h * (1 - this.linkPercent) / this.numLabels,
                };
            }
        } else {
            labelPos[0] = {
                y: this.y,
                x: this.x + this.w * (1 - this.linkPercent) / 2 * (1 / this.numLabels - 1),
            };
            for (let i = 1; i < this.numLabels; i++) {
                labelPos[i] = {
                    y: this.y,
                    x: labelPos[i - 1].x + this.w * (1 - this.linkPercent) / this.numLabels,
                };
            }
        }
        return labelPos;
    }

    createUndoDelete() {
        return new UndoBlock.DeleteLinkedList(
            this.objectID, this.numLabels, this.labels, this.x, this.y, this.w, this.h,
            this.linkPercent, this.linkPositionEnd, this.vertical, this.labelColors,
            this.backgroundColor, this.foregroundColor, this.layer, this.nullPointer,
        );
    }
};


UndoBlock.DeleteLinkedList = class UndoDeleteLinkedList extends UndoBlock {
    constructor(objectID, numLabels, labels, x, y, w, h, linkPercent, linkPositionEnd,
        vertical, labelColors, backgroundColor, foregroundColor, layer, nullPointer) {
        super();
        this.objectID = objectID;
        this.numLabels = numLabels;
        this.labels = labels;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.linkPercent = linkPercent;
        this.linkPositionEnd = linkPositionEnd;
        this.vertical = vertical;
        this.labelColors = labelColors;
        this.backgroundColor = backgroundColor;
        this.foregroundColor = foregroundColor;
        this.layer = layer;
        this.nullPointer = nullPointer;
    }

    undoInitialStep(world) {
        world.addLinkedListObject(
            this.objectID, this.labels[0], this.w, this.h, this.linkPercent, this.vertical,
            this.linkPositionEnd, this.numLabels, this.backgroundColor, this.foregroundColor,
        );
        world.setNodePosition(this.objectID, this.x, this.y);
        world.setLayer(this.objectID, this.layer);
        world.setNull(this.objectID, this.nullPointer);
        for (let i = 0; i < this.numLabels; i++) {
            world.setText(this.objectID, this.labels[i], i);
            world.setTextColor(this.objectID, this.labelColors[i], i);
        }
    }
};
