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


class AnimatedRectangle extends AnimatedObject {
    w;
    h;
    xJustify;  // "center", "left", "right"
    yJustify;  // "center", "top", "bottom"
    nullPointer = false;

    constructor(id, label, wth, hgt, xJustify = "center", yJustify = "center", fillColor, edgeColor, highlightColor, labelColor) {
        super(fillColor, edgeColor, highlightColor, labelColor);
        this.objectID = id;
        this.label = label;
        this.w = wth;
        this.h = hgt;
        this.xJustify = xJustify;
        this.yJustify = yJustify;
    }

    setNull(np) {
        this.nullPointer = np;
    }

    getNull() {
        return this.nullPointer;
    }

    left() {
        return (
            this.xJustify == "right"  ? this.x - this.w     :
            this.xJustify == "center" ? this.x - this.w / 2 :
            /*   xJustify == "left"  */ this.x
        );
    }

    centerX() {
        return (
            this.xJustify == "right"  ? this.x - this.w / 2 :
            this.xJustify == "center" ? this.x              :
            /*   xJustify == "left"  */ this.x + this.w / 2
        );
    }

    right() {
        return (
            this.xJustify == "right"  ? this.x              :
            this.xJustify == "center" ? this.x + this.w / 2 :
            /*   xJustify == "left"  */ this.x + this.w
        );
    }

    top() {
        return (
            this.yJustify == "bottom" ? this.y - this.h     :
            this.yJustify == "center" ? this.y - this.h / 2 :
            /*   yJustify == "top"   */ this.y
        );
    }

    centerY() {
        return (
            this.yJustify == "bottom" ? this.y - this.h / 2 :
            this.yJustify == "center" ? this.y              :
            /*   yJustify == "top"   */ this.y + this.h / 2
        );
    }

    bottom() {
        return (
            this.yJustify == "bottom" ? this.y              :
            this.yJustify == "center" ? this.y + this.h / 2 :
            /*   yJustify == "top"   */ this.y + this.h
        );
    }

    getHeadPointerAttachPos(fromX, fromY) {
        return this.getClosestCardinalPoint(fromX, fromY);
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

    draw(ctx) {
        if (!this.addedToScene) return;

        var x = this.left();
        var y = this.top();
        var w = this.getWidth();
        var h = this.getHeight();

        ctx.globalAlpha = this.alpha;

        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(x, y, w, h);

        ctx.fillStyle = this.labelColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = this.textHeight + 'px sans-serif';
        ctx.fillText(this.label, this.centerX(), this.centerY());

        ctx.strokeStyle = this.foregroundColor;
        ctx.lineWidth = 2;
        if (this.nullPointer) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y + h);
            ctx.stroke();
        }

        if (this.highlighted) {
            ctx.strokeStyle = this.highlightColor;
            ctx.lineWidth = this.highlightDiff;
        }
        ctx.strokeRect(x, y, w, h);
    }

    setText(newText, textIndex) {
        this.label = newText;
    }

    createUndoDelete() {
        // TODO: Add color?
        return new UndoDeleteRectangle(this.objectID, this.label, this.x, this.y, this.w, this.h, this.xJustify, this.yJustify, this.backgroundColor, this.foregroundColor, this.highlighted, this.layer);
    }
}



class UndoDeleteRectangle extends UndoBlock {
    constructor(id, lab, x, y, w, h, xJust, yJust, bgColor, fgColor, highlight, lay) {
        super();
        this.objectID = id;
        this.posX = x;
        this.posY = y;
        this.width = w;
        this.height = h;
        this.xJustify = xJust;
        this.yJustify = yJust;
        this.backgroundColor = bgColor;
        this.foregroundColor = fgColor;
        this.nodeLabel = lab;
        this.layer = lay;
        this.highlighted = highlight;
    }

    undoInitialStep(world) {
        world.addRectangleObject(this.objectID, this.nodeLabel, this.width, this.height, this.xJustify, this.yJustify, this.backgroundColor, this.foregroundColor);
        world.setNodePosition(this.objectID, this.posX, this.posY);
        world.setLayer(this.objectID, this.layer);
        world.setHighlight(this.objectID, this.highlighted);
    }
}

