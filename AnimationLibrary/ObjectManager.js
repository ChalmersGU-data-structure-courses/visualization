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


// Object Manager
//
// Manage all of our animated objects.  Control any animated object should occur through
// this interface (not language enforced, because enforcing such things in Javascript is
// problematic.)
//
// This class is only accessed through:
//
//  AnimationMain
//  Undo objects (which are themselves controlled by AnimationMain


class ObjectManager {
    static STATUSREPORT_LEFT_MARGIN = 25;
    static STATUSREPORT_BOTTOM_MARGIN = 5;

    Nodes = [];
    Edges = [];
    BackEdges = [];
    activeLayers = [true];
    framenum = 0;
    canvas;
    ctx;
    statusReport;
    
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.statusReport = new AnimatedLabel(-1, "...", false, 30, this.ctx);
    }

    update() {
    }

    clearAllObjects() {
        this.Nodes = [];
        this.Edges = [];
        this.BackEdges = [];
    }


    ///////////////////////////////////////////////////////////////////////////
    // Drawing objects 

    draw() {
        this.framenum++;
        if (this.framenum > 1000) this.framenum = 0;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // clear canvas

        for (var i = 0; i < this.Nodes.length; i++) {
            if (this.Nodes[i] != null && !this.Nodes[i].highlighted && this.Nodes[i].addedToScene && !this.Nodes[i].alwaysOnTop) {
                this.Nodes[i].draw(this.ctx);
            }
        }

        for (var i = 0; i < this.Nodes.length; i++) {
            if (this.Nodes[i] != null && (this.Nodes[i].highlighted && !this.Nodes[i].alwaysOnTop) && this.Nodes[i].addedToScene) {
                this.Nodes[i].pulseHighlight(this.framenum);
                this.Nodes[i].draw(this.ctx);
            }
        }

        for (var i = 0; i < this.Nodes.length; i++) {
            if (this.Nodes[i] != null && this.Nodes[i].alwaysOnTop && this.Nodes[i].addedToScene) {
                this.Nodes[i].pulseHighlight(this.framenum);
                this.Nodes[i].draw(this.ctx);
            }
        }

        for (var i = 0; i < this.Edges.length; i++) {
            if (this.Edges[i] != null) {
                for (var j = 0; j < this.Edges[i].length; j++) {
                    if (this.Edges[i][j].addedToScene) {
                        this.Edges[i][j].pulseHighlight(this.framenum);
                        this.Edges[i][j].draw(this.ctx);
                    }
                }
            }
        }

        this.drawStatusReport();
    }


    ///////////////////////////////////////////////////////////////////////////
    // Status report 

    drawStatusReport() {
        this.statusReport.x = ObjectManager.STATUSREPORT_LEFT_MARGIN;
        this.statusReport.y = this.canvas.height - this.statusReport.textHeight - ObjectManager.STATUSREPORT_BOTTOM_MARGIN;
        this.statusReport.draw(this.ctx);
    }

    setStatus(text, color) {
        if (color) this.statusReport.setForegroundColor(color);
        this.statusReport.setText(text);
        console.log("---- " + text + " ----");
    }


    ///////////////////////////////////////////////////////////////////////////
    // Layers 

    setLayers(shown, layers) {
        for (var i = 0; i < layers.length; i++) {
            this.activeLayers[layers[i]] = shown;
        }
        this.resetLayers();
    }

    setAllLayers(layers) {
        this.activeLayers = [];
        for (var i = 0; i < layers.length; i++) {
            this.activeLayers[layers[i]] = true;
        }
        this.resetLayers();
    }

    resetLayers() {
        for (var i = 0; i < this.Nodes.length; i++) {
            if (this.Nodes[i] != null) {
                this.Nodes[i].addedToScene = this.activeLayers[this.Nodes[i].layer];
            }
        }
        for (var i = this.Edges.length - 1; i >= 0; i--) {
            if (this.Edges[i] != null) {
                for (var j = 0; j < this.Edges[i].length; j++) {
                    if (this.Edges[i][j] != null) {
                        this.Edges[i][j].addedToScene =
                            this.activeLayers[this.Edges[i][j].node1.layer] &&
                            this.activeLayers[this.Edges[i][j].node2.layer];
                    }
                }
            }
        }
    }

    setLayer(objectID, layer) {
        if (this.Nodes[objectID] != null) {
            this.Nodes[objectID].layer = layer;
            this.Nodes[objectID].addedToScene = Boolean(this.activeLayers[layer]);
            if (this.Edges[objectID] != null) {
                for (var i = 0; i < this.Edges[objectID].length; i++) {
                    var nextEdge = this.Edges[objectID][i];
                    if (nextEdge != null) {
                        nextEdge.addedToScene = nextEdge.node1.addedToScene && nextEdge.node2.addedToScene;
                    }
                }
            }
            if (this.BackEdges[objectID] != null) {
                for (var i = 0; i < this.BackEdges[objectID].length; i++) {
                    var nextEdge = this.BackEdges[objectID][i];
                    if (nextEdge != null) {
                        nextEdge.addedToScene = nextEdge.node1.addedToScene && nextEdge.node2.addedToScene;
                    }
                }
            }
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    // Adding objects 

    addLabelObject(objectID, objectLabel, centering) {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addLabelObject: Object with same ID (${objectID}) already exists`);
        }
        var newLabel = new AnimatedLabel(objectID, objectLabel, centering, this.getTextWidth(objectLabel), this.ctx);
        this.Nodes[objectID] = newLabel;
    }

    addLinkedListObject(objectID, nodeLabel, width, height, linkPer, verticalOrientation, linkPosEnd, numLabels, backgroundColor, foregroundColor) {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addLinkedListObject: Object with same ID (${objectID}) already exists`);
        }
        var newNode = new AnimatedLinkedList(objectID, nodeLabel, width, height, linkPer, verticalOrientation, linkPosEnd, numLabels, backgroundColor, foregroundColor);
        this.Nodes[objectID] = newNode;
    }

    addHighlightCircleObject(objectID, objectColor, radius) {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addHighlightCircleObject: Object with same ID (${objectID}) already exists`);
        }
        var newNode = new HighlightCircle(objectID, objectColor, radius);
        this.Nodes[objectID] = newNode;
    }

    addBTreeNode(objectID, widthPerElem, height, numElems, backgroundColor, foregroundColor) {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addBTreeNode: Object with same ID (${objectID}) already exists`);
        }
        if (!backgroundColor) backgroundColor = "#FFFFFF";
        if (!foregroundColor) foregroundColor = "#FFFFFF";
        var newNode = new AnimatedBTreeNode(objectID, widthPerElem, height, numElems, backgroundColor, foregroundColor);
        this.Nodes[objectID] = newNode;
    }

    addRectangleObject(objectID, nodeLabel, width, height, xJustify, yJustify, backgroundColor, foregroundColor) {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addRectangleObject: Object with same ID (${objectID}) already exists`);
        }
        var newNode = new AnimatedRectangle(objectID, nodeLabel, width, height, xJustify, yJustify, backgroundColor, foregroundColor);
        this.Nodes[objectID] = newNode;
    }

    addCircleObject(objectID, objectLabel) {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addCircleObject: Object with same ID (${objectID}) already exists`);
        }
        var newNode = new AnimatedCircle(objectID, objectLabel);
        this.Nodes[objectID] = newNode;
    }


    ///////////////////////////////////////////////////////////////////////////
    // Finding and removing objects

    getObject(objectID) {
        if (this.Nodes[objectID] == null) {
            throw new Error(`getObject: Object with ID (${objectID}) does not exist`);
        }
        return this.Nodes[objectID];
    }

    removeObject(objectID) {
        var oldObject = this.Nodes[objectID];
        if (objectID == this.Nodes.length - 1) {
            this.Nodes.pop();
        } else {
            this.Nodes[objectID] = null;
        }
        return oldObject;
    }


    ///////////////////////////////////////////////////////////////////////////
    // Aligning objects

    alignMiddle(id1, id2) {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`alignMiddle: One of the objects ${id1} or ${id2} do not exist`);
        }
        this.Nodes[id1].alignMiddle(this.Nodes[id2]);
    }

    alignTop(id1, id2) {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`alignTop: One of the objects ${id1} or ${id2} do not exist`);
        }
        this.Nodes[id1].alignTop(this.Nodes[id2]);
    }

    alignBottom(id1, id2) {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`alignBottom: One of the objects ${id1} or ${id2} do not exist`);
        }
        this.Nodes[id1].alignBottom(this.Nodes[id2]);
    }

    alignLeft(id1, id2) {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`alignLeft: One of the objects ${id1} or ${id2} do not exist`);
        }
        this.Nodes[id1].alignLeft(this.Nodes[id2]);
    }

    alignRight(id1, id2) {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`alignRight: One of the objects ${id1} or ${id2} do not exist`);
        }
        this.Nodes[id1].alignRight(this.Nodes[id2]);
    }

    getAlignRightPos(id1, id2) {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`getAlignRightPos: One of the objects ${id1} or ${id2} do not exist`);
        }
        return this.Nodes[id1].getAlignRightPos(this.Nodes[id2]);
    }

    getAlignLeftPos(id1, id2) {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`getAlignLeftPos: One of the objects ${id1} or ${id2} do not exist`);
        }
        return this.Nodes[id1].getAlignLeftPos(this.Nodes[id2]);
    }


    ///////////////////////////////////////////////////////////////////////////
    // Modifying edges

    connectEdge(objectIDfrom, objectIDto, color, curve, directed, lab, connectionPoint) {
        var fromObj = this.Nodes[objectIDfrom];
        var toObj = this.Nodes[objectIDto];
        if (fromObj == null || toObj == null) {
            throw new Error(`connectEdge: One of the objects ${objectIDfrom} or ${objectIDto} do not exist`);
        }
        var l = new Line(fromObj, toObj, color, curve, directed, lab, connectionPoint);
        if (this.Edges[objectIDfrom] == null) {
            this.Edges[objectIDfrom] = [];
        }
        if (this.BackEdges[objectIDto] == null) {
            this.BackEdges[objectIDto] = [];
        }
        l.addedToScene = fromObj.addedToScene && toObj.addedToScene;
        this.Edges[objectIDfrom].push(l);
        this.BackEdges[objectIDto].push(l);
    }

    disconnect(objectIDfrom, objectIDto) {
        var undo = null;
        if (this.Edges[objectIDfrom] != null) {
            var len = this.Edges[objectIDfrom].length;
            for (var i = len - 1; i >= 0; i--) {
                if (this.Edges[objectIDfrom][i] != null && this.Edges[objectIDfrom][i].node2 == this.Nodes[objectIDto]) {
                    var deleted = this.Edges[objectIDfrom][i];
                    undo = deleted.createUndoDisconnect();
                    this.Edges[objectIDfrom][i] = this.Edges[objectIDfrom][len - 1];
                    len--;
                    this.Edges[objectIDfrom].pop();
                }
            }
        }
        if (this.BackEdges[objectIDto] != null) {
            len = this.BackEdges[objectIDto].length;
            for (var i = len - 1; i >= 0; i--) {
                if (this.BackEdges[objectIDto][i] != null && this.BackEdges[objectIDto][i].node1 == this.Nodes[objectIDfrom]) {
                    deleted = this.BackEdges[objectIDto][i];
                    // Note:  Don't need to remove this child, did it above on the regular edge
                    this.BackEdges[objectIDto][i] = this.BackEdges[objectIDto][len - 1];
                    len--;
                    this.BackEdges[objectIDto].pop();
                }
            }
        }
        return undo;
    }

    deleteIncident(objectID) {
        var undoStack = [];
        if (this.Edges[objectID] != null) {
            var len = this.Edges[objectID].length;
            for (var i = len - 1; i >= 0; i--) {
                var deleted = this.Edges[objectID][i];
                var node2ID = deleted.node2.identifier();
                undoStack.push(deleted.createUndoDisconnect());

                var len2 = this.BackEdges[node2ID].length;
                for (var j = len2 - 1; j >= 0; j--) {
                    if (this.BackEdges[node2ID][j] == deleted) {
                        this.BackEdges[node2ID][j] = this.BackEdges[node2ID][len2 - 1];
                        len2--;
                        this.BackEdges[node2ID].pop();
                    }
                }
            }
            this.Edges[objectID] = null;
        }
        if (this.BackEdges[objectID] != null) {
            len = this.BackEdges[objectID].length;
            for (i = len - 1; i >= 0; i--) {
                deleted = this.BackEdges[objectID][i];
                console.log(objectID, i, deleted)
                var node1ID = deleted.node1.identifier();
                undoStack.push(deleted.createUndoDisconnect());

                len2 = this.Edges[node1ID].length;
                for (j = len2 - 1; j >= 0; j--) {
                    if (this.Edges[node1ID][j] == deleted) {
                        this.Edges[node1ID][j] = this.Edges[node1ID][len2 - 1];
                        len2--;
                        this.Edges[node1ID].pop();
                    }
                }
            }
            this.BackEdges[objectID] = null;
        }
        return undoStack;
    }


    ///////////////////////////////////////////////////////////////////////////
    // Setting edge properties

    setEdgeAlpha(fromID, toID, alphaVal) {
        var oldAlpha = 1.0;
        if (this.Edges[fromID] != null) {
            var len = this.Edges[fromID].length;
            for (var i = len - 1; i >= 0; i--) {
                if (this.Edges[fromID][i] != null && this.Edges[fromID][i].node2 == this.Nodes[toID]) {
                    oldAlpha = this.Edges[fromID][i].alpha;
                    this.Edges[fromID][i].alpha = alphaVal;
                }
            }
        }
        return oldAlpha;
    }

    setEdgeColor(fromID, toID, color) {
        var oldColor = "black";
        if (this.Edges[fromID] != null) {
            var len = this.Edges[fromID].length;
            for (var i = len - 1; i >= 0; i--) {
                if (this.Edges[fromID][i] != null && this.Edges[fromID][i].node2 == this.Nodes[toID]) {
                    oldColor = this.Edges[fromID][i].color();
                    this.Edges[fromID][i].setColor(color);
                }
            }
        }
        return oldColor;
    }

    setEdgeHighlight(fromID, toID, val) {
        var oldHighlight = false;
        if (this.Edges[fromID] != null) {
            var len = this.Edges[fromID].length;
            for (var i = len - 1; i >= 0; i--) {
                if (this.Edges[fromID][i] != null && this.Edges[fromID][i].node2 == this.Nodes[toID]) {
                    oldHighlight = this.Edges[fromID][i].highlighted;
                    this.Edges[fromID][i].setHighlight(val);
                }
            }
        }
        return oldHighlight;
    }


    ///////////////////////////////////////////////////////////////////////////
    // Getting and setting object properties

    getAlpha(objectID) {
        if (this.Nodes[objectID] == null) return -1;
        return this.Nodes[objectID].getAlpha();
    }

    setAlpha(objectID, alphaVal) {
        if (this.Nodes[objectID] == null) return;
        this.Nodes[objectID].setAlpha(alphaVal);
    }

    getTextColor(objectID, index) {
        if (this.Nodes[objectID] == null) return "black";
        return this.Nodes[objectID].getTextColor(index);
    }

    setTextColor(objectID, color, index) {
        if (this.Nodes[objectID] == null) return;
        this.Nodes[objectID].setTextColor(color, index);
    }

    getHighlightIndex(objectID) {
        if (this.Nodes[objectID] == null) return false;
        return this.Nodes[objectID].getHighlightIndex();
    }

    setHighlightIndex(objectID, index) {
        if (this.Nodes[objectID] == null) return;
        this.Nodes[objectID].setHighlightIndex(index);
    }

    foregroundColor(objectID) {
        if (this.Nodes[objectID] == null) return "black";
        return this.Nodes[objectID].foregroundColor;
    }

    setForegroundColor(objectID, color) {
        if (this.Nodes[objectID] == null) return;
        this.Nodes[objectID].setForegroundColor(color);
    }

    backgroundColor(objectID) {
        if (this.Nodes[objectID] == null) return "white";
        return this.Nodes[objectID].backgroundColor;
    }

    setBackgroundColor(objectID, color) {
        if (this.Nodes[objectID] == null) return;
        this.Nodes[objectID].setBackgroundColor(color);
    }

    getHighlight(objectID) {
        if (this.Nodes[objectID] == null) return false;
        return this.Nodes[objectID].getHighlight();
    }

    setHighlight(objectID, val) {
        if (this.Nodes[objectID] == null) return;
        this.Nodes[objectID].setHighlight(val);
    }

    getWidth(objectID) {
        if (this.Nodes[objectID] == null) return -1;
        return this.Nodes[objectID].getWidth();
    }

    setWidth(objectID, val) {
        if (this.Nodes[objectID] == null) return;
        this.Nodes[objectID].setWidth(val);
    }

    getHeight(objectID) {
        if (this.Nodes[objectID] == null) return -1;
        return this.Nodes[objectID].getHeight();
    }

    setHeight(objectID, val) {
        if (this.Nodes[objectID] == null) return;
        this.Nodes[objectID].setHeight(val);
    }

    getNodeX(objectID) {
        if (this.Nodes[objectID] == null) return 0;
        return this.Nodes[objectID].x;
    }

    getNodeY(objectID) {
        if (this.Nodes[objectID] == null) return 0;
        return this.Nodes[objectID].y;
    }

    setNodePosition(objectID, newX, newY) {
        if (this.Nodes[objectID] == null) return;
        if (newX == null || newY == null) return;
        this.Nodes[objectID].x = newX;
        this.Nodes[objectID].y = newY;
        // (TODO: Revisit if we do conditional redraws)
    }

    getText(objectID, index) {
        if (this.Nodes[objectID] == null) return "";
        return this.Nodes[objectID].getText(index);
    }

    setText(objectID, text, index) {
        if (this.Nodes[objectID] == null) return;
        this.Nodes[objectID].setText(text, index, this.getTextWidth(text));
    }

    getNull(objectID) {
        if (this.Nodes[objectID] == null) return false;
        return this.Nodes[objectID].getNull();
    }

    setNull(objectID, nullVal) {
        if (this.Nodes[objectID] == null) return;
        this.Nodes[objectID].setNull(nullVal);
    }

    getNumElements(objectID) {
        if (this.Nodes[objectID] == null) return 0;
        return this.Nodes[objectID].getNumElements();
    }

    setNumElements(objectID, numElems) {
        if (this.Nodes[objectID] == null) return;
        this.Nodes[objectID].setNumElements(numElems);
    }


    ///////////////////////////////////////////////////////////////////////////
    // Helper methods

    getTextWidth(text) {
        // TODO:  Need to make fonts more flexible, and less hardwired.
        if (text == null) {
            return 3;
        }
        this.ctx.font = AnimatedObject.DEFAULT_TEXT_HEIGHT + 'px sans-serif';
        var strList = text.split("\n");
        var width = 0;
        if (strList.length == 1) {
            width = this.ctx.measureText(text).width;
        } else {
            for (var i = 0; i < strList.length; i++) {
                width = Math.max(width, this.ctx.measureText(strList[i]).width);
            }
        }
        return width;
    }


}

