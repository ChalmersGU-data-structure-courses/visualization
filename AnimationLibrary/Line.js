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


// This class is somewhat poorly named -- it handles links between vertices in graphs,
//  pointers in linked lists, and so on.


class Line extends AnimatedObject {
    static MAX_HEIGHT_DIFF = 5;
    static MIN_HEIGHT_DIFF = 3;
    static RANGE = Line.MAX_HEIGHT_DIFF - Line.MIN_HEIGHT_DIFF + 1;
    static HIGHLIGHT_DIFF = 3;

    node1;
    node2;
    color;
    curve;
    directed;
    anchorPoint;

    addedToScene = true;
    arrowHeight = 8;
    arrowWidth = 4;
    highlightDiff = 0;

    constructor(n1, n2, color, curve = 0, directed = false, label = "", anchorPoint = 0, highlightColor, labelColor) {
        super(color, color, highlightColor, labelColor);
        this.node1 = n1;
        this.node2 = n2;
        this.color = color || this.foregroundColor;
        this.directed = directed;
        this.label = label;
        this.anchorPoint = anchorPoint;
        this.curve = curve;
    }

    color() {
        return this.color;
    }

    setColor(newColor) {
        this.color = newColor;
    }

    hasNode(n) {
        return this.node1 == n || this.node2 == n;
    }

    draw(ctx) {
        if (!this.addedToScene) return;

        ctx.globalAlpha = this.alpha;

        if (this.highlighted) {
            ctx.fillStyle = ctx.strokeStyle = this.highlightColor;
            ctx.lineWidth = this.highlightDiff;
        } else {
            ctx.fillStyle = ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
        }

        var fromPos = this.node1.getTailPointerAttachPos(this.node2.x, this.node2.y, this.anchorPoint);
        var toPos = this.node2.getHeadPointerAttachPos(this.node1.x, this.node1.y);

        var fromPos = this.node1.getTailPointerAttachPos(this.node2.x, this.node2.y, this.anchorPoint);
        var toPos = this.node2.getHeadPointerAttachPos(this.node1.x, this.node1.y);

        var deltaX = toPos[0] - fromPos[0];
        var deltaY = toPos[1] - fromPos[1];
        var midX = (deltaX) / 2.0 + fromPos[0];
        var midY = (deltaY) / 2.0 + fromPos[1];
        var controlX = midX - deltaY * this.curve;
        var controlY = midY + deltaX * this.curve;

        ctx.beginPath();
        ctx.moveTo(fromPos[0], fromPos[1]);
        ctx.quadraticCurveTo(controlX, controlY, toPos[0], toPos[1]);
        ctx.stroke();

        if (this.label != null && this.label !== "") {
            // Position of the edge label:  First, we will place it right along the
            // middle of the curve (or the middle of the line, for curve == 0)
            var labelPosX = 0.25 * fromPos[0] + 0.5 * controlX + 0.25 * toPos[0];
            var labelPosY = 0.25 * fromPos[1] + 0.5 * controlY + 0.25 * toPos[1];

            // Next, we push the edge position label out just a little in the direction of
            // the curve, so that the label doesn't intersect the cuve (as long as the label
            // is only a few characters, that is)
            var midLen = Math.sqrt(deltaY * deltaY + deltaX * deltaX);
            if (midLen != 0) {
                labelPosX += (-deltaY * Math.sign(this.curve)) / midLen * 10;
                labelPosY += (deltaX * Math.sign(this.curve)) / midLen * 10;
            }

            ctx.textAlign = 'center';
            ctx.font = this.textHeight + 'px sans-serif';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.label, labelPosX, labelPosY);
        }

        if (this.directed) {
            var xVec = controlX - toPos[0];
            var yVec = controlY - toPos[1];
            var len = Math.sqrt(xVec * xVec + yVec * yVec);
            if (len > 0) {
                xVec = xVec / len;
                yVec = yVec / len;
                ctx.beginPath();
                ctx.moveTo(toPos[0], toPos[1]);
                ctx.lineTo(toPos[0] + xVec * this.arrowHeight - yVec * this.arrowWidth, toPos[1] + yVec * this.arrowHeight + xVec * this.arrowWidth);
                ctx.lineTo(toPos[0] + xVec * this.arrowHeight + yVec * this.arrowWidth, toPos[1] + yVec * this.arrowHeight - xVec * this.arrowWidth);
                ctx.lineTo(toPos[0], toPos[1]);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            }
        }
    }

    createUndoDisconnect() {
        return new UndoConnect(this.node1.objectID, this.node2.objectID, true, this.color, this.directed, this.curve, this.label, this.anchorPoint);
    }
}



class UndoConnect extends UndoBlock {
    constructor(from, to, createConnection, edgeColor, isDirected, cv, lab, anch) {
        super();
        this.fromID = from;
        this.toID = to;
        this.connect = createConnection;
        this.color = edgeColor;
        this.directed = isDirected;
        this.curve = cv;
        this.label = lab;
        this.anchorPoint = anch;
    }

    undoInitialStep(world) {
        if (this.connect) {
            world.connectEdge(this.fromID, this.toID, this.color, this.curve, this.directed, this.label, this.anchorPoint);
        }
        else {
            world.disconnectEdge(this.fromID, this.toID);
        }
    }
}

