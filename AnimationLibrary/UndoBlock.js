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
/* globals SingleAnimation */
/* exported UndoCreate, UndoHighlight, UndoHighlightEdge, UndoMove, UndoSetAlpha,
            UndoSetBackgroundColor, UndoSetEdgeAlpha, UndoSetEdgeColor,
            UndoSetForegroundColor, UndoSetHeight, UndoSetHighlightIndex,
            UndoSetNull, UndoSetNumElements, UndoSetPosition, UndoSetText,
            UndoSetTextColor, UndoSetWidth
*/
///////////////////////////////////////////////////////////////////////////////


class UndoBlock {
    objectID;

    addUndoAnimation(animationList) {
        return false;
    }

    undoInitialStep(world) {
    }
}


class UndoMove extends UndoBlock {
    constructor(id, fmX, fmy, tx, ty) {
        super();
        this.objectID = id;
        this.fromX = fmX;
        this.fromY = fmy;
        this.toX = tx;
        this.toY = ty;
    }

    addUndoAnimation(animationList) {
        const nextAnim = new SingleAnimation(this.objectID, this.fromX, this.fromY, this.toX, this.toY);
        animationList.push(nextAnim);
        return true;
    }
}


class UndoCreate extends UndoBlock {
    constructor(id) {
        super();
        this.objectID = id;
    }

    undoInitialStep(world) {
        world.removeObject(this.objectID);
    }
}


class UndoHighlight extends UndoBlock {
    constructor(id, val) {
        super();
        this.objectID = id;
        this.highlightValue = val;
    }

    undoInitialStep(world) {
        world.setHighlight(this.objectID, this.highlightValue);
    }
}


class UndoSetHeight extends UndoBlock {
    constructor(id, val) {
        super();
        this.objectID = id;
        this.height = val;
    }

    undoInitialStep(world) {
        world.setHeight(this.objectID, this.height);
    }
}


class UndoSetWidth extends UndoBlock {
    constructor(id, val) {
        super();
        this.objectID = id;
        this.width = val;
    }

    undoInitialStep(world) {
        world.setWidth(this.objectID, this.width);
    }
}


class UndoSetNumElements extends UndoBlock {
    constructor(obj, oldNumElems, newNumElems) {
        super();
        this.objectID = obj.objectID;
        this.sizeBeforeChange = oldNumElems;
        this.sizeAfterChange = newNumElems;
        if (this.sizeBeforeChange > this.sizeAfterChange) {
            this.labels = [];
            this.colors = [];
            for (let i = 0; i < this.sizeBeforeChange - this.sizeAfterChange; i++) {
                this.labels[i] = obj.getText(i + this.sizeAfterChange);
                this.colors[i] = obj.getTextColor(i + this.sizeAfterChange);
            }
        }
    }

    undoInitialStep(world) {
        world.setNumElements(this.objectID, this.sizeBeforeChange);
        if (this.sizeBeforeChange > this.sizeAfterChange) {
            for (let i = 0; i < this.sizeBeforeChange - this.sizeAfterChange; i++) {
                world.setText(this.objectID, this.labels[i], i + this.sizeAfterChange);
                world.setTextColor(this.objectID, this.colors[i], i + this.sizeAfterChange);
            }
        }
    }
}


class UndoSetAlpha extends UndoBlock {
    constructor(id, alph) {
        super();
        this.objectID = id;
        this.alphaVal = alph;
    }

    undoInitialStep(world) {
        world.setAlpha(this.objectID, this.alphaVal);
    }
}


class UndoSetNull extends UndoBlock {
    constructor(id, nv) {
        super();
        this.objectID = id;
        this.nullVal = nv;
    }

    undoInitialStep(world) {
        world.setNull(this.objectID, this.nullVal);
    }
}


class UndoSetForegroundColor extends UndoBlock {
    constructor(id, color) {
        super();
        this.objectID = id;
        this.color = color;
    }

    undoInitialStep(world) {
        world.setForegroundColor(this.objectID, this.color);
    }
}


class UndoSetBackgroundColor extends UndoBlock {
    constructor(id, color) {
        super();
        this.objectID = id;
        this.color = color;
    }

    undoInitialStep(world) {
        world.setBackgroundColor(this.objectID, this.color);
    }
}


class UndoSetHighlightIndex extends UndoBlock {
    constructor(id, index) {
        super();
        this.objectID = id;
        this.index = index;
    }

    undoInitialStep(world) {
        world.setHighlightIndex(this.objectID, this.index);
    }
}


class UndoSetText extends UndoBlock {
    constructor(id, str, index) {
        super();
        this.objectID = id;
        this.newText = str;
        this.labelIndex = index;
    }

    undoInitialStep(world) {
        world.setText(this.objectID, this.newText, this.labelIndex);
    }
}


class UndoSetTextColor extends UndoBlock {
    constructor(id, color, index) {
        super();
        this.objectID = id;
        this.color = color;
        this.index = index;
    }

    undoInitialStep(world) {
        world.setTextColor(this.objectID, this.color, this.index);
    }
}


class UndoHighlightEdge extends UndoBlock {
    constructor(from, to, val) {
        super();
        this.fromID = from;
        this.toID = to;
        this.highlightValue = val;
    }

    undoInitialStep(world) {
        world.setEdgeHighlight(this.fromID, this.toID, this.highlightValue);
    }
}


class UndoSetEdgeColor extends UndoBlock {
    constructor(from, to, oldColor) {
        super();
        this.fromID = from;
        this.toID = to;
        this.color = oldColor;
    }

    undoInitialStep(world) {
        world.setEdgeColor(this.fromID, this.toID, this.color);
    }
}


class UndoSetEdgeAlpha extends UndoBlock {
    constructor(from, to, oldAplha) {
        super();
        this.fromID = from;
        this.toID = to;
        this.alpha = oldAplha;
    }

    undoInitialStep(world) {
        world.setEdgeAlpha(this.fromID, this.toID, this.alpha);
    }
}


class UndoSetPosition extends UndoBlock {
    constructor(id, x, y) {
        super();
        this.objectID = id;
        this.x = x;
        this.y = y;
    }

    undoInitialStep(world) {
        world.setNodePosition(this.objectID, this.x, this.y);
    }
}
