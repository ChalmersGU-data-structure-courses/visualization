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
/* exported AnimatedObject */
///////////////////////////////////////////////////////////////////////////////


class AnimatedObject {
    backgroundColor;
    foregroundColor;
    labelColor;
    highlightColor;
    textHeight = 14;
    highlighted = false;
    objectID = -1;
    layer = 0;
    label = "";
    alpha = 1.0;
    x = 0;
    y = 0;
    heightDiff = 3;
    range = 5;
    highlightIndex = -1;
    alwaysOnTop = false;
    addedToScene = true;

    constructor(backgroundColor = "white", foregroundColor = "black", highlightColor = "red", labelColor = null) {
        if (!labelColor) labelColor = foregroundColor;
        this.backgroundColor = backgroundColor;
        this.foregroundColor = foregroundColor;
        this.highlightColor = highlightColor;
        this.labelColor = labelColor;
    }

    setForegroundColor(newColor) {
        this.foregroundColor = newColor;
        this.labelColor = newColor;
    }

    setBackgroundColor(newColor) {
        this.backgroundColor = newColor;
    }

    getNull() {
        return false;
    }

    setNull() {
    }

    getAlpha() {
        return this.alpha;
    }

    setAlpha(newAlpha) {
        this.alpha = newAlpha;
    }

    getHighlight() {
        return this.highlighted;
    }

    setHighlight(value) {
        this.highlighted = value;
    }

    getWidth() {
        // TODO:  Do we want to throw here?  Should always override this ...
        return 0;
    }

    setWidth(newWidth) {
        // TODO:  Do we want to throw here?  Should always override this ...
    }

    getHeight() {
        // TODO:  Do we want to throw here?  Should always override this ...
        return 0;
    }

    setHeight() {
        // TODO:  Do we want to throw here?  Should always override this ...
    }

    left() {
        return this.centerX() - this.getWidth() / 2;
    }

    centerX() {
        return this.x;
    }

    right() {
        return this.centerX() + this.getWidth() / 2;
    }

    top() {
        return this.centerY() - this.getHeight() / 2;
    }

    centerY() {
        return this.y;
    }

    bottom() {
        return this.centerY() + this.getHeight() / 2;
    }

    getAlignLeftPos(other) {
        return [other.right() + this.getWidth() / 2, other.centerY()];
    }

    getAlignRightPos(other) {
        return [other.left() - this.getWidth() / 2, other.centerY()];
    }

    getAlignTopPos(other) {
        return [other.centerX(), other.top() - this.getHeight() / 2];
    }

    getAlignBottomPos(other) {
        return [other.centerX(), other.bottom() + this.getHeight() / 2];
    }

    // Aligning assumes centering. Overridden method could modify if not centered
    // (See AnimatedLabel, for instance)
    alignMiddle(other) {
        this.y = other.centerY();
        this.x = other.centerX();
    }

    alignLeft(other) {
        this.y = other.centerY();
        this.x = other.left() - this.getWidth() / 2;
    }

    alignRight(other) {
        this.y = other.centerY();
        this.x = other.right() + this.getWidth() / 2;
    }

    alignTop(other) {
        this.x = other.centerX();
        this.y = other.top() - this.getHeight() / 2;
    }

    alignBottom(other) {
        this.x = other.centerX();
        this.y = other.bottom() + this.getHeight() / 2;
    }

    getClosestCardinalPoint(fromX, fromY) {
        let xDelta;
        let yDelta;
        let xPos;
        let yPos;

        if (fromX < this.left()) {
            xDelta = this.left() - fromX;
            xPos = this.left();
        } else if (fromX > this.right()) {
            xDelta = fromX - this.right();
            xPos = this.right();
        } else {
            xDelta = 0;
            xPos = this.centerX();
        }

        if (fromY < this.top()) {
            yDelta = this.top() - fromY;
            yPos = this.top();
        } else if (fromY > this.bottom()) {
            yDelta = fromY - this.bottom();
            yPos = this.bottom();
        } else {
            yDelta = 0;
            yPos = this.centerY();
        }

        if (yDelta > xDelta) {
            xPos = this.centerX();
        } else {
            yPos = this.centerY();
        }
        return [xPos, yPos];
    }

    centered() {
        return false;
    }

    pulseHighlight(frameNum) {
        if (this.highlighted) {
            const frameMod = frameNum / 7.0;
            const delta = Math.abs((frameMod) % (2 * this.range - 2) - this.range + 1);
            this.highlightDiff = delta + this.heightDiff;
        }
    }

    getTailPointerAttachPos(fromX, fromY, anchorPoint) {
        return [this.x, this.y];
    }

    getHeadPointerAttachPos(fromX, fromY) {
        return [this.x, this.y];
    }

    createUndoDelete() {
        console.error("createUndoDelete: Must be overridden!");
    }

    identifier() {
        return this.objectID;
    }

    getText(index) {
        return this.label;
    }

    getTextColor(textIndex) {
        return this.labelColor;
    }

    setTextColor(color, textIndex) {
        this.labelColor = color;
    }

    setText(newText, textIndex) {
        this.label = newText;
    }

    getHighlightIndex() {
        return this.highlightIndex;
    }

    setHighlightIndex(hlIndex) {
        this.highlightIndex = hlIndex;
    }

    draw() {
        console.error("draw: Must be overridden!");
    }
}
