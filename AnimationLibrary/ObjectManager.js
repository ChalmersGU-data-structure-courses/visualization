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
/* globals AnimatedObject */
/* exported ObjectManager */
///////////////////////////////////////////////////////////////////////////////


// Manage all of our animated objects.  Control any animated object should occur through
// this interface (not language enforced, because enforcing such things in Javascript is
// problematic.)
//
// This class is only accessed through:
//  - AnimationManager
//  - Undo objects (which are themselves controlled by AnimationManager


class ObjectManager {
    STATUSREPORT_LEFT_MARGIN = 25;
    STATUSREPORT_BOTTOM_MARGIN = 5;

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
        this.ctx = canvas.getContext("2d");
        this.statusReport = new AnimatedObject.Label(-1, "...", false, this.ctx);
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

        for (let i = 0; i < this.Nodes.length; i++) {
            if (this.Nodes[i] != null && !this.Nodes[i].highlighted && this.Nodes[i].addedToScene && !this.Nodes[i].alwaysOnTop) {
                this.Nodes[i].draw(this.ctx);
            }
        }

        for (let i = 0; i < this.Nodes.length; i++) {
            if (this.Nodes[i] != null && (this.Nodes[i].highlighted && !this.Nodes[i].alwaysOnTop) && this.Nodes[i].addedToScene) {
                this.Nodes[i].pulseHighlight(this.framenum);
                this.Nodes[i].draw(this.ctx);
            }
        }

        for (let i = 0; i < this.Nodes.length; i++) {
            if (this.Nodes[i] != null && this.Nodes[i].alwaysOnTop && this.Nodes[i].addedToScene) {
                this.Nodes[i].pulseHighlight(this.framenum);
                this.Nodes[i].draw(this.ctx);
            }
        }

        for (let i = 0; i < this.Edges.length; i++) {
            if (this.Edges[i] != null) {
                for (let j = 0; j < this.Edges[i].length; j++) {
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
        this.statusReport.x = this.STATUSREPORT_LEFT_MARGIN;
        this.statusReport.y = this.canvas.height - this.statusReport.textHeight - this.STATUSREPORT_BOTTOM_MARGIN;
        this.statusReport.draw(this.ctx);
    }

    setStatus(text, color) {
        if (color) this.statusReport.setForegroundColor(color);
        this.statusReport.setText(text);
        console.log(`---- ${text} ----`);
    }

    ///////////////////////////////////////////////////////////////////////////
    // Layers

    setLayers(shown, layers) {
        for (let i = 0; i < layers.length; i++) {
            this.activeLayers[layers[i]] = shown;
        }
        this.resetLayers();
    }

    setAllLayers(layers) {
        this.activeLayers = [];
        for (let i = 0; i < layers.length; i++) {
            this.activeLayers[layers[i]] = true;
        }
        this.resetLayers();
    }

    resetLayers() {
        for (let i = 0; i < this.Nodes.length; i++) {
            if (this.Nodes[i] != null) {
                this.Nodes[i].addedToScene = this.activeLayers[this.Nodes[i].layer];
            }
        }
        for (let i = this.Edges.length - 1; i >= 0; i--) {
            if (this.Edges[i] != null) {
                for (let j = 0; j < this.Edges[i].length; j++) {
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
                for (let i = 0; i < this.Edges[objectID].length; i++) {
                    const nextEdge = this.Edges[objectID][i];
                    if (nextEdge != null) {
                        nextEdge.addedToScene = nextEdge.node1.addedToScene && nextEdge.node2.addedToScene;
                    }
                }
            }
            if (this.BackEdges[objectID] != null) {
                for (let i = 0; i < this.BackEdges[objectID].length; i++) {
                    const nextEdge = this.BackEdges[objectID][i];
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
        const newLabel = new AnimatedObject.Label(objectID, objectLabel, centering, this.ctx);
        this.Nodes[objectID] = newLabel;
    }

    addLinkedListObject(objectID, nodeLabel, width, height, linkPer, verticalOrientation, linkPosEnd, numLabels, backgroundColor, foregroundColor) {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addLinkedListObject: Object with same ID (${objectID}) already exists`);
        }
        const newNode = new AnimatedObject.LinkedList(objectID, nodeLabel, width, height, linkPer, verticalOrientation, linkPosEnd, numLabels, backgroundColor, foregroundColor);
        this.Nodes[objectID] = newNode;
    }

    addHighlightCircleObject(objectID, objectColor, radius) {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addHighlightCircleObject: Object with same ID (${objectID}) already exists`);
        }
        const newNode = new AnimatedObject.HighlightCircle(objectID, objectColor, radius);
        this.Nodes[objectID] = newNode;
    }

    addBTreeNode(objectID, widthPerElem, height, numElems, backgroundColor, foregroundColor) {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addBTreeNode: Object with same ID (${objectID}) already exists`);
        }
        const newNode = new AnimatedObject.BTreeNode(objectID, widthPerElem, height, numElems, backgroundColor, foregroundColor);
        this.Nodes[objectID] = newNode;
    }

    addRectangleObject(objectID, nodeLabel, width, height, xJustify, yJustify, backgroundColor, foregroundColor) {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addRectangleObject: Object with same ID (${objectID}) already exists`);
        }
        const newNode = new AnimatedObject.Rectangle(objectID, nodeLabel, width, height, xJustify, yJustify, backgroundColor, foregroundColor);
        this.Nodes[objectID] = newNode;
    }

    addCircleObject(objectID, objectLabel) {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addCircleObject: Object with same ID (${objectID}) already exists`);
        }
        const newNode = new AnimatedObject.Circle(objectID, objectLabel);
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
        const oldObject = this.Nodes[objectID];
        if (objectID === this.Nodes.length - 1) {
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
        const fromObj = this.Nodes[objectIDfrom];
        const toObj = this.Nodes[objectIDto];
        if (fromObj == null || toObj == null) {
            throw new Error(`connectEdge: One of the objects ${objectIDfrom} or ${objectIDto} do not exist`);
        }
        const l = new AnimatedObject.Connection(fromObj, toObj, color, curve, directed, lab, connectionPoint);
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

    disconnectEdge(objectIDfrom, objectIDto) {
        if (this.Edges[objectIDfrom] != null) {
            let len = this.Edges[objectIDfrom].length;
            for (let i = len - 1; i >= 0; i--) {
                if (this.Edges[objectIDfrom][i] != null && this.Edges[objectIDfrom][i].node2 === this.Nodes[objectIDto]) {
                    this.Edges[objectIDfrom][i] = this.Edges[objectIDfrom][len - 1];
                    len--;
                    this.Edges[objectIDfrom].pop();
                }
            }
        }
        if (this.BackEdges[objectIDto] != null) {
            let len = this.BackEdges[objectIDto].length;
            for (let i = len - 1; i >= 0; i--) {
                if (this.BackEdges[objectIDto][i] != null && this.BackEdges[objectIDto][i].node1 === this.Nodes[objectIDfrom]) {
                    this.BackEdges[objectIDto][i] = this.BackEdges[objectIDto][len - 1];
                    len--;
                    this.BackEdges[objectIDto].pop();
                }
            }
        }
    }

    disconnectIncidentEdges(objectID) {
        if (this.Edges[objectID] != null) {
            const len = this.Edges[objectID].length;
            for (let i = len - 1; i >= 0; i--) {
                const deleted = this.Edges[objectID][i];
                const node2ID = deleted.node2.identifier();
                let len2 = this.BackEdges[node2ID].length;
                for (let j = len2 - 1; j >= 0; j--) {
                    if (this.BackEdges[node2ID][j] === deleted) {
                        this.BackEdges[node2ID][j] = this.BackEdges[node2ID][len2 - 1];
                        len2--;
                        this.BackEdges[node2ID].pop();
                    }
                }
            }
            this.Edges[objectID] = null;
        }
        if (this.BackEdges[objectID] != null) {
            const len = this.BackEdges[objectID].length;
            for (let i = len - 1; i >= 0; i--) {
                const deleted = this.BackEdges[objectID][i];
                const node1ID = deleted.node1.identifier();
                let len2 = this.Edges[node1ID].length;
                for (let j = len2 - 1; j >= 0; j--) {
                    if (this.Edges[node1ID][j] === deleted) {
                        this.Edges[node1ID][j] = this.Edges[node1ID][len2 - 1];
                        len2--;
                        this.Edges[node1ID].pop();
                    }
                }
            }
            this.BackEdges[objectID] = null;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // Finding edges

    findEdge(fromID, toID) {
        const edges = this.Edges[fromID];
        if (edges != null) {
            for (let i = edges.length - 1; i >= 0; i--) {
                if (edges[i] != null && edges[i].node2 === this.Nodes[toID]) {
                    return edges[i];
                }
            }
        }
        return null;
    }

    findIncidentEdges(objectID) {
        const edges = this.Edges[objectID] || [];
        const backEdges = this.BackEdges[objectID] || [];
        return edges.concat(backEdges);
    }

    ///////////////////////////////////////////////////////////////////////////
    // Getting and setting edge properties

    getEdgeAlpha(fromID, toID) {
        const edge = this.findEdge(fromID, toID);
        return edge?.getAlpha();
    }

    setEdgeAlpha(fromID, toID, alphaVal) {
        const edge = this.findEdge(fromID, toID);
        if (edge) edge.setAlpha(alphaVal);
    }

    getEdgeColor(fromID, toID) {
        const edge = this.findEdge(fromID, toID);
        return edge?.getColor();
    }

    setEdgeColor(fromID, toID, color) {
        const edge = this.findEdge(fromID, toID);
        if (edge) edge.setColor(color);
    }

    getEdgeHighlight(fromID, toID) {
        const edge = this.findEdge(fromID, toID);
        return edge?.getHighlight();
    }

    setEdgeHighlight(fromID, toID, val) {
        const edge = this.findEdge(fromID, toID);
        if (edge) edge.setHighlight(val);
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
        this.Nodes[objectID].setText(text, index);
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
}
