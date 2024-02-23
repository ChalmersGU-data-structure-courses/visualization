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


AnimatedObject.Label = class Label extends AnimatedObject {
    centering;
    textWidth;
    leftWidth;
    centerWidth;
    drawingContext;
    alwaysOnTop = true;

    constructor(objectID, label, centering, drawingContext, textWidth, labelColor, highlightColor) {
        super(null, labelColor, highlightColor);
        this.objectID = objectID;
        this.label = label;
        this.centering = centering;
        this.drawingContext = drawingContext; // Must set this before calling getTextWidth
        this.textWidth = textWidth || this.getTextWidth();
        this.leftWidth = -1;
        this.centerWidth = -1;
    }

    centered() {
        return this.centering;
    }

    getTextWidth() {
        this.drawingContext.font = `${this.textHeight}px sans-serif`;
        const strList = this.label.split("\n");
        let width = 0;
        if (strList.length === 1) {
            width = this.drawingContext.measureText(this.label).width;
        } else {
            for (let i = 0; i < strList.length; i++) {
                width = Math.max(width, this.drawingContext.measureText(strList[i]).width);
            }
        }
        return width;
    }

    alignLeft(other) {
        if (this.centering) {
            this.y = other.centerY();
            this.x = other.left() - this.textWidth / 2;
        } else {
            this.y = other.centerY() - this.textHeight / 2;
            this.x = other.left() - this.textWidth;
        }
    }

    getAlignLeftPos(other) {
        if (this.centering) {
            return [other.left() - this.textWidth / 2, this.y = other.centerY()];
        } else {
            return [other.left() - this.textWidth, other.centerY() - this.textHeight / 2];
        }
    }

    alignRight(other) {
        if (this.centering) {
            this.y = other.centerY();
            this.x = other.right() + this.textWidth / 2;
        } else {
            this.y = other.centerY() - this.textHeight / 2;
            this.x = other.right();
        }
    }

    getAlignRightPos(other) {
        if (this.centering) {
            return [other.right() + this.textWidth / 2, other.centerY()];
        } else {
            return [other.right(), other.centerY() - this.textHeight / 2];
        }
    }

    alignTop(other) {
        if (this.centering) {
            this.y = other.top() - this.textHeight / 2;
            this.x = other.centerX();
        } else {
            this.y = other.top() - 10;
            this.x = other.centerX() - this.textWidth / 2;
        }
    }

    getAlignTopPos(other) {
        if (this.centering) {
            return [other.centerX(), other.top() - this.textHeight / 2];
        } else {
            return [other.centerX() - this.textWidth / 2, other.top() - 10];
        }
    }

    alignBottom(other) {
        if (this.centering) {
            this.y = other.bottom() + this.textHeight / 2;
            this.x = other.centerX();
        } else {
            this.y = other.bottom();
            this.x = other.centerX() - this.textWidth / 2;
        }
    }

    getAlignBottomPos(other) {
        if (this.centering) {
            return [other.centerX(), other.bottom() + this.textHeight / 2];
        } else {
            return [other.centerX() - this.textWidth / 2, other.bottom()];
        }
    }

    getWidth() {
        return this.textWidth;
    }

    getHeight() {
        return this.textHeight;
    }

    setHeight(newHeight) {
        this.textHeight = newHeight;
        this.textWidth = this.getTextWidth();
    }

    left() {
        return this.centering ? this.x - this.textWidth / 2 : this.x;
    }

    centerX() {
        return this.centering ? this.x : this.x + this.textWidth;
    }

    right() {
        return this.centering ? this.x + this.textWidth / 2 : this.x + this.textWidth;
    }

    top() {
        return this.centering ? this.y - this.textHeight / 2 : this.y;
    }

    centerY() {
        return this.centering ? this.y : this.y + this.textHeight / 2;
    }

    bottom() {
        return this.centering ? this.y + this.textHeight / 2 : this.y + this.textHeight;
    }

    setHighlightIndex(hlIndex) {
        // Only allow highlight index for labels that don't have End-Of-Line
        if (this.label.indexOf("\n") < 0 && this.label.length > hlIndex) {
            this.highlightIndex = hlIndex;
        } else {
            this.highlightIndex = -1;
        }
    }

    getTailPointerAttachPos(fromX, fromY, anchorPoint) {
        return this.getClosestCardinalPoint(fromX, fromY);
    }

    getHeadPointerAttachPos(fromX, fromY) {
        return this.getClosestCardinalPoint(fromX, fromY);
    }

    setText(newText, textIndex, initialWidth) {
        this.label = newText;
        this.textWidth = initialWidth || this.getTextWidth();
    }

    draw(ctx) {
        if (!this.addedToScene) return;

        ctx.globalAlpha = this.alpha;
        ctx.font = `${this.textHeight}px sans-serif`;

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        if (this.centering) {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
        }

        if (this.highlighted) {
            ctx.strokeStyle = this.highlightColor;
            ctx.lineWidth = this.highlightDiff;
            ctx.strokeText(this.label, this.x, this.y);
        }

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
                let x = this.x;
                if (this.centering) {
                    x -= this.textWidth / 2;
                    ctx.textAlign = "left";
                }
                ctx.fillText(leftStr, x, this.y);
                ctx.fillText(rightStr, x + leftWidth + centerWidth, this.y);
                ctx.fillStyle = this.highlightColor;
                ctx.fillText(highlightStr, x + leftWidth, this.y);
            }
        } else {
            const offset = (this.centering) ? (1 - strList.length) / 2 : 0;
            for (let i = 0; i < strList.length; i++) {
                ctx.fillText(strList[i], this.x, this.y + (i + offset) * this.textHeight);
            }
        }
    }

    createUndoDelete() {
        return new UndoBlock.DeleteLabel(
            this.objectID, this.label, this.x, this.y, this.centering,
            this.labelColor, this.layer, this.highlightIndex,
        );
    }
};


UndoBlock.DeleteLabel = class UndoDeleteLabel extends UndoBlock {
    constructor(objectID, label, x, y, centering, labelColor, layer, highlightIndex) {
        super();
        this.objectID = objectID;
        this.x = x;
        this.y = y;
        this.nodeLabel = label;
        this.centering = centering;
        this.labelColor = labelColor;
        this.layer = layer;
        this.highlightIndex = highlightIndex;
    }

    undoInitialStep(world) {
        world.addLabelObject(this.objectID, this.nodeLabel, this.centering);
        world.setNodePosition(this.objectID, this.x, this.y);
        world.setForegroundColor(this.objectID, this.labelColor);
        world.setLayer(this.objectID, this.layer);
    }
};
