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


AnimatedObject.BTreeNode = class BTreeNode extends AnimatedObject {
    MIN_WIDTH = 10;
    CORNER_RADIUS = 10;
    EDGE_POINTER_DISPLACEMENT = 5;

    widthPerElement;
    nodeHeight;
    numLabels;
    labels;
    labelColors;

    constructor(objectID, widthPerElement, nodeHeight, numLabels, backgroundColor, foregroundColor, highlightColor, labelColor) {
        super(backgroundColor, foregroundColor, highlightColor, labelColor);
        this.objectID = objectID;
        this.widthPerElement = widthPerElement;
        this.nodeHeight = nodeHeight;
        this.numLabels = numLabels;
        this.labels = new Array(this.numLabels);
        this.labelColors = new Array(this.numLabels);
        for (let i = 0; i < this.numLabels; i++) {
            this.labels[i] = "";
            this.labelColors[i] = this.labelColor;
        }
    }

    getNumElements() {
        return this.numLabels;
    }

    getWidth() {
        if (this.numLabels > 0) {
            return this.widthPerElement * this.numLabels;
        } else {
            return this.MIN_WIDTH;
        }
    }

    setNumElements(newNumElements) {
        if (this.numLabels < newNumElements) {
            for (let i = this.numLabels; i < newNumElements; i++) {
                this.labels[i] = "";
                this.labelColors[i] = this.labelColor;
            }
        } else if (this.numLabels > newNumElements) {
            this.labels.length = newNumElements;
            this.labelColors.length = newNumElements;
        }
        this.numLabels = newNumElements;
    }

    getHeight() {
        return this.nodeHeight;
    }

    setForegroundColor(newColor) {
        this.foregroundColor = newColor;
        for (let i = 0; i < this.numLabels; i++) {
            this.labelColors[i] = newColor;
        }
    }

    getTailPointerAttachPos(fromX, fromY, anchor) {
        if (anchor === 0) {
            return [this.left() + this.EDGE_POINTER_DISPLACEMENT, this.y];
        } else if (anchor === this.numLabels) {
            return [this.right() - this.EDGE_POINTER_DISPLACEMENT, this.y];
        } else {
            return [this.left() + anchor * this.widthPerElement, this.y];
        }
    }

    getHeadPointerAttachPos(fromX, fromY) {
        if (fromY < this.y - this.nodeHeight / 2) {
            return [this.x, this.y - this.nodeHeight / 2];
        } else if (this.fromY > this.y + this.nodeHeight / 2) {
            return [this.x, this.y + this.nodeHeight / 2];
        } else if (fromX < this.x - this.getWidth() / 2) {
            return [this.x - this.getWidth() / 2, this.y];
        } else {
            return [this.x + this.getWidth() / 2, this.y];
        }
    }

    getTextColor(textIndex) {
        return this.labelColors[textIndex || 0];
    }

    setTextColor(color, textIndex) {
        this.labelColors[textIndex || 0] = color;
    }

    getText(index) {
        return this.labels[index || 0];
    }

    setText(newText, textIndex) {
        this.labels[textIndex || 0] = newText;
    }

    draw(ctx) {
        if (!this.addedToScene) return;

        let x = this.left();
        const y = this.top();
        const w = this.getWidth();
        const h = this.getHeight();

        ctx.globalAlpha = this.alpha;

        ctx.fillStyle = this.backgroundColor;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, this.CORNER_RADIUS);
        ctx.fill();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let i = 0; i < this.numLabels; i++) {
            const labelx = this.x - this.widthPerElement * this.numLabels / 2 + this.widthPerElement / 2 + i * this.widthPerElement;
            ctx.fillStyle = this.labelColors[i];
            ctx.fillText(this.labels[i], labelx, this.y);
        }

        ctx.strokeStyle = this.foregroundColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 1; i < this.numLabels; i++) {
            x += this.widthPerElement;
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + h);
        }
        ctx.stroke();

        if (this.highlighted) {
            ctx.strokeStyle = this.highlightColor;
            ctx.lineWidth = this.highlightDiff;
        }
        ctx.beginPath();
        ctx.roundRect(this.left(), this.top(), this.getWidth(), this.getHeight(), this.CORNER_RADIUS);
        ctx.stroke();
    }

    createUndoDelete() {
        return new UndoBlock.DeleteBTreeNode(
            this.objectID, this.numLabels, this.labels, this.x, this.y, this.widthPerElement, this.nodeHeight,
            this.labelColors, this.backgroundColor, this.foregroundColor, this.layer, this.highlighted,
        );
    }
};


UndoBlock.DeleteBTreeNode = class UndoDeleteBTreeNode extends UndoBlock {
    constructor(objectID, numLabels, labels, x, y, widthPerElement, nodeHeight,
        labelColors, backgroundColor, foregroundColor, layer, highlighted) {
        super();
        this.objectID = objectID;
        this.numLabels = numLabels;
        this.labels = labels;
        this.x = x;
        this.y = y;
        this.widthPerElement = widthPerElement;
        this.nodeHeight = nodeHeight;
        this.labelColors = labelColors;
        this.backgroundColor = backgroundColor;
        this.foregroundColor = foregroundColor;
        this.layer = layer;
        this.highlighted = highlighted;
    }

    undoInitialStep(world) {
        world.addBTreeNode(this.objectID, this.widthPerElement, this.nodeHeight, this.numLabels, this.backgroundColor, this.foregroundColor);
        world.setNodePosition(this.objectID, this.x, this.y);
        for (let i = 0; i < this.numLabels; i++) {
            world.setText(this.objectID, this.labels[i], i);
            world.setTextColor(this.objectID, this.labelColors[i], i);
        }
        world.setHighlight(this.objectID, this.highlighted);
        world.setLayer(this.objectID, this.layer);
    }
};
