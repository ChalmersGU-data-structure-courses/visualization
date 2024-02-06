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


function ObjectManager(canvas)
{
    this.Nodes = [];
    this.Edges = [];
    this.BackEdges = [];
    this.activeLayers = [];
    this.activeLayers[0] = true;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.framenum = 0;
    this.statusReport = new AnimatedLabel(-1, "XXX", false, 30, this.ctx);
    this.statusReport.x = 30;


    this.draw = function()
    {
        this.framenum++;
        if (this.framenum > 1000)
            this.framenum = 0;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // clear canvas
        this.statusReport.y = this.canvas.height - 15;

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

        this.statusReport.draw(this.ctx);
    }


    this.update = function() 
    {
    }


    this.setLayers = function(shown, layers)
    {
        for (var i = 0; i < layers.length; i++) {
            this.activeLayers[layers[i]] = shown;
        }
        this.resetLayers();
    }


    this.addHighlightCircleObject = function(objectID, objectColor, radius) {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addHighlightCircleObject: Object with same ID (${objectID}) already exists`);
        }
        var newNode = new HighlightCircle(objectID, objectColor, radius)
        this.Nodes[objectID] = newNode;
    }


    this.setEdgeAlpha = function(fromID, toID, alphaVal) {
        var oldAlpha = 1.0;
        if (this.Edges[fromID] != null) {
            var len = this.Edges[fromID].length;
            for (var i = len - 1; i >= 0; i--) {
                if (this.Edges[fromID][i] != null && this.Edges[fromID][i].Node2 == this.Nodes[toID]) {
                    oldAlpha = this.Edges[fromID][i].alpha
                    this.Edges[fromID][i].alpha = alphaVal;
                }
            }
        }
        return oldAlpha;

    }

    this.setAlpha = function(objectID, alphaVal)
    {
        if (this.Nodes[objectID] != null) {
            this.Nodes[objectID].setAlpha(alphaVal);
        }
    }

    this.getAlpha = function(objectID)
    {
        if (this.Nodes[objectID] == null) {
            return -1;
        }
        return this.Nodes[objectID].getAlpha();
    }

    this.getTextColor = function(objectID, index)
    {
        if (this.Nodes[objectID] == null) {
            return "#000000";
        }
        return this.Nodes[objectID].getTextColor(index);
    }


    this.setTextColor = function(objectID, color, index)
    {
        if (this.Nodes[objectID] != null) {
            this.Nodes[objectID].setTextColor(color, index);
        }
    }


    this.setHighlightIndex = function(objectID, index)
    {
        if (this.Nodes[objectID] != null) {
            this.Nodes[objectID].setHighlightIndex(index);
        }
    }


    this.setAllLayers = function(layers)
    {
        this.activeLayers = [];
        for(var i = 0; i < layers.length; i++) {
            this.activeLayers[layers[i]] = true;
        }
        this.resetLayers();
    }


    this.resetLayers = function()
    {
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
                                this.activeLayers[this.Edges[i][j].Node1.layer] &&
                                this.activeLayers[this.Edges[i][j].Node2.layer];
                    }
                }
            }
        }
    }


    this.setLayer = function(objectID, layer)
    {
        if (this.Nodes[objectID] != null) {
            this.Nodes[objectID].layer = layer;
            this.Nodes[objectID].addedToScene = Boolean(this.activeLayers[layer]);
            if (this.Edges[objectID] != null) {
                for (var i = 0; i < this.Edges[objectID].length; i++) {
                    var nextEdge = this.Edges[objectID][i];
                    if (nextEdge != null) {
                        nextEdge.addedToScene = nextEdge.Node1.addedToScene && nextEdge.Node2.addedToScene;
                    }
                }
            }
            if (this.BackEdges[objectID] != null) {
                for (var i = 0; i < this.BackEdges[objectID].length; i++) {
                    var nextEdge = this.BackEdges[objectID][i];
                    if (nextEdge != null) {
                        nextEdge.addedToScene = nextEdge.Node1.addedToScene && nextEdge.Node2.addedToScene;
                    }
                }
            }
        }
    }


    this.clearAllObjects = function()
    {
        this.Nodes = [];
        this.Edges = [];
        this.BackEdges = [];
    }


    this.setForegroundColor = function(objectID, color)
    {
        if (this.Nodes[objectID] != null) {
            this.Nodes[objectID].setForegroundColor(color);
        }
    }


    this.setBackgroundColor = function(objectID, color)
    {
        if (this.Nodes[objectID] != null) {
            this.Nodes[objectID].setBackgroundColor(color);
        }
    }

    this.setHighlight = function(objectID, val)
    {
        if (this.Nodes[objectID] == null) {
            return;  // TODO:  Error here?
        }
        this.Nodes[objectID].setHighlight(val);
    }


    this.getHighlight = function(objectID)
    {
        if (this.Nodes[objectID] == null) {
            return false;  // TODO:  Error here?
        }
        return this.Nodes[objectID].getHighlight();
    }


    this.getHighlightIndex = function(objectID)
    {
        if (this.Nodes[objectID] == null) {
            return false;  // TODO:  Error here?
        }
        return this.Nodes[objectID].getHighlightIndex();
    }


    this.setWidth = function(objectID, val)
    {
        if (this.Nodes[objectID] == null) {
            return;  // TODO:  Error here?
        }
        this.Nodes[objectID].setWidth(val);
    }


    this.setHeight = function(objectID, val)
    {
        if (this.Nodes[objectID] == null) {
            return;  // TODO:  Error here?
        }
        this.Nodes[objectID].setHeight(val);
    }


    this.getHeight = function(objectID)
    {
        if (this.Nodes[objectID] == null) {
            return -1;  // TODO:  Error here?
        }
        return this.Nodes[objectID].getHeight();
    }


    this.getWidth = function(objectID)
    {
        if (this.Nodes[objectID] == null) {
            return -1;  // TODO:  Error here?
        }
        return this.Nodes[objectID].getWidth();
    }


    this.backgroundColor = function(objectID)
    {
        if (this.Nodes[objectID] == null) {
            return "#FFFFFF";
        }
        return this.Nodes[objectID].backgroundColor;
    }


    this.foregroundColor = function(objectID)
    {
        if (this.Nodes[objectID] == null) {
            return "#000000";
        }
        return this.Nodes[objectID].foregroundColor;
    }


    this.disconnect = function(objectIDfrom,objectIDto)
    {
        var undo = null;
        if (this.Edges[objectIDfrom] != null) {
            var len = this.Edges[objectIDfrom].length;
            for (var i = len - 1; i >= 0; i--) {
                if (this.Edges[objectIDfrom][i] != null && this.Edges[objectIDfrom][i].Node2 == this.Nodes[objectIDto]) {
                    var deleted = this.Edges[objectIDfrom][i];
                    undo = deleted.createUndoDisconnect();
                    this.Edges[objectIDfrom][i] = this.Edges[objectIDfrom][len - 1];
                    len -= 1;
                    this.Edges[objectIDfrom].pop();
                }
            }
        }
        if (this.BackEdges[objectIDto] != null) {
            len = this.BackEdges[objectIDto].length;
            for (var i = len - 1; i >= 0; i--) {
                if (this.BackEdges[objectIDto][i] != null && this.BackEdges[objectIDto][i].Node1 == this.Nodes[objectIDfrom]) {
                    deleted = this.BackEdges[objectIDto][i];
                    // Note:  Don't need to remove this child, did it above on the regular edge
                    this.BackEdges[objectIDto][i] = this.BackEdges[objectIDto][len - 1];
                    len -= 1;
                    this.BackEdges[objectIDto].pop();
                }
            }
        }
        return undo;
    }


    this.deleteIncident = function(objectID)
    {
        var undoStack = [];

        if (this.Edges[objectID] != null) {
            var len = this.Edges[objectID].length;
            for (var i = len - 1; i >= 0; i--) {
                var deleted = this.Edges[objectID][i];
                var node2ID = deleted.Node2.identifier();
                undoStack.push(deleted.createUndoDisconnect());

                var len2 = this.BackEdges[node2ID].length;
                for (var j = len2 - 1; j >=0; j--) {
                    if (this.BackEdges[node2ID][j] == deleted) {
                        this.BackEdges[node2ID][j] = this.BackEdges[node2ID][len2 - 1];
                        len2 -= 1;
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
                var node1ID = deleted.Node1.identifier();
                undoStack.push(deleted.createUndoDisconnect());

                len2 = this.Edges[node1ID].length;
                for (j = len2 - 1; j >=0; j--) {
                    if (this.Edges[node1ID][j] == deleted) {
                        this.Edges[node1ID][j] = this.Edges[node1ID][len2 - 1];
                        len2 -= 1;
                        this.Edges[node1ID].pop();
                    }
                }
            }
            this.BackEdges[objectID] = null;
        }
        return undoStack;
    }


    this.removeObject = function(ObjectID)
    {
        var oldObject = this.Nodes[ObjectID];
        if (ObjectID == this.Nodes.length - 1) {
            this.Nodes.pop();
        }
        else {
            this.Nodes[ObjectID] = null;
        }
        return oldObject;
    }


    this.getObject = function(objectID)
    {
        if (this.Nodes[objectID] == null) {
            throw new Error(`getObject: Object with ID (${objectID}) does not exist`);
        }
        return this.Nodes[objectID];
    }


    this.addCircleObject = function(objectID, objectLabel)
    {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addCircleObject: Object with same ID (${objectID}) already exists`);
        }
        var newNode = new AnimatedCircle(objectID, objectLabel);
        this.Nodes[objectID] = newNode;
    }


    this.getNodeX = function(objectID)
    {
        if (this.Nodes[objectID] == null) {
            throw new Error(`getNodeX: Object with ID (${objectID}) does not exist`);
        }
        return this.Nodes[objectID].x;
    }


    this.getNodeY = function(objectID)
    {
        if (this.Nodes[objectID] == null) {
            throw new Error(`getNodeY: Object with ID (${objectID}) does not exist`);
        }
        return this.Nodes[objectID].y;
    }


    this.getTextWidth = function(text)
    {
        // TODO:  Need to make fonts more flexible, and less hardwired.
        if (text == null) {
            return 3;
        }
        this.ctx.font = AnimatedObject.DEFAULT_TEXT_HEIGHT + 'px sans-serif';
        var strList = text.split("\n");
        var width = 0;
        if (strList.length == 1) {
             width = this.ctx.measureText(text).width;
        }
        else {
            for (var i = 0; i < strList.length; i++) {
                width = Math.max(width, this.ctx.measureText(strList[i]).width);
            }
        }
        return width;
    }


    this.setText = function(objectID, text, index)
    {
        if (this.Nodes[objectID] == null) {
            return;
            throw new Error(`setText: Object with ID (${objectID}) does not exist`);
        }
        this.Nodes[objectID].setText(text, index, this.getTextWidth(text));
    }


    this.getText = function(objectID, index)
    {
        if (this.Nodes[objectID] == null) {
            throw new Error(`getText: Object with ID (${objectID}) does not exist`);
        }
        return this.Nodes[objectID].getText(index);
    }


    this.connectEdge = function(objectIDfrom, objectIDto, color, curve, directed, lab, connectionPoint)
    {
        var fromObj = this.Nodes[objectIDfrom];
        var toObj = this.Nodes[objectIDto];
        if (fromObj == null || toObj == null) {
            throw new Error(`connectEdge: One of the objects ${objectIDfrom} or ${objectIDto} do not exist`);
        }
        var l = new Line(fromObj,toObj, color, curve, directed, lab, connectionPoint);
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


    this.setNull = function(objectID, nullVal)
    {
        if (this.Nodes[objectID] != null) {
            this.Nodes[objectID].setNull(nullVal);
        }
    }


    this.getNull = function(objectID)
    {
        if (this.Nodes[objectID] == null) {
            return false;  // TODO:  Error here?
        }
        return this.Nodes[objectID].getNull();
    }


    this.setEdgeColor = function(fromID, toID, color) // returns old color
    {
        var oldColor ="#000000";
        if (this.Edges[fromID] != null) {
            var len = this.Edges[fromID].length;
            for (var i = len - 1; i >= 0; i--) {
                if (this.Edges[fromID][i] != null && this.Edges[fromID][i].Node2 == this.Nodes[toID]) {
                    oldColor = this.Edges[fromID][i].color();
                    this.Edges[fromID][i].setColor(color);
                }
            }
        }
        return oldColor;
    }


    this.alignTop = function(id1, id2)
    {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`alignTop: One of the objects ${id1} or ${id2} do not exist`);
        }
        this.Nodes[id1].alignTop(this.Nodes[id2]);
    }


    this.alignBottom = function(id1, id2)
    {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`alignBottom: One of the objects ${id1} or ${id2} do not exist`);
        }
        this.Nodes[id1].alignBottom(this.Nodes[id2]);
    }


    this.alignLeft = function(id1, id2) {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`alignLeft: One of the objects ${id1} or ${id2} do not exist`);
        }
        this.Nodes[id1].alignLeft(this.Nodes[id2]);
    }


    this.alignRight = function(id1, id2)
    {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`alignRight: One of the objects ${id1} or ${id2} do not exist`);
        }
        this.Nodes[id1].alignRight(this.Nodes[id2]);
    }


    this.getAlignRightPos = function(id1, id2)
    {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`getAlignRightPos: One of the objects ${id1} or ${id2} do not exist`);
        }
        return this.Nodes[id1].getAlignRightPos(this.Nodes[id2]);
    }


    this.getAlignLeftPos = function(id1, id2)
    {
        if (this.Nodes[id1] == null || this.Nodes[id2] == null) {
            throw new Error(`getAlignLeftPos: One of the objects ${id1} or ${id2} do not exist`);
        }
        return this.Nodes[id1].getAlignLeftPos(this.Nodes[id2]);
    }


    this.setEdgeHighlight = function(fromID, toID, val) // returns old color
    {
        var oldHighlight = false;
        if (this.Edges[fromID] != null) {
            var len = this.Edges[fromID].length;
            for (var i = len - 1; i >= 0; i--) {
                if (this.Edges[fromID][i] != null && this.Edges[fromID][i].Node2 == this.Nodes[toID]) {
                    oldHighlight = this.Edges[fromID][i].highlighted;
                    this.Edges[fromID][i].setHighlight(val);
                }
            }
        }
        return oldHighlight;
    }


    this.addLabelObject = function(objectID, objectLabel, centering)
    {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addLabelObject: Object with same ID (${objectID}) already exists`);
        }
        var newLabel = new AnimatedLabel(objectID, objectLabel, centering, this.getTextWidth(objectLabel),this.ctx);
        this.Nodes[objectID] = newLabel;
    }


    this.addLinkedListObject = function(objectID, nodeLabel, width, height, linkPer, verticalOrientation, linkPosEnd, numLabels, backgroundColor, foregroundColor)
    {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addLinkedListObject: Object with same ID (${objectID}) already exists`);
        }
        var newNode = new AnimatedLinkedList(objectID, nodeLabel, width, height, linkPer, verticalOrientation, linkPosEnd, numLabels, backgroundColor, foregroundColor);
        this.Nodes[objectID] = newNode;
    }


    this.getNumElements = function(objectID)
    {
        if (this.Nodes[objectID] == null) {
            throw new Error(`getNumElements: Object with ID (${objectID}) does not exist`);
        }
        return this.Nodes[objectID].getNumElements();
    }


    this.setNumElements = function(objectID, numElems)
    {
        if (this.Nodes[objectID] == null) {
            return;  // TODO:  Error here?
        }
        this.Nodes[objectID].setNumElements(numElems);
    }


    this.addBTreeNode = function(objectID, widthPerElem, height, numElems, backgroundColor, foregroundColor)
    {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addBTreeNode: Object with same ID (${objectID}) already exists`);
        }
        if (!backgroundColor) backgroundColor = "#FFFFFF";
        if (!foregroundColor) foregroundColor = "#FFFFFF";
        var newNode = new AnimatedBTreeNode(objectID,widthPerElem, height, numElems, backgroundColor, foregroundColor);
        this.Nodes[objectID] = newNode;
    }


    this.addRectangleObject = function(objectID,nodeLabel, width, height, xJustify , yJustify , backgroundColor, foregroundColor)
    {
        if (this.Nodes[objectID] != null) {
            throw new Error(`addRectangleObject: Object with same ID (${objectID}) already exists`);
        }
        var newNode = new AnimatedRectangle(objectID, nodeLabel, width, height, xJustify, yJustify, backgroundColor, foregroundColor);
        this.Nodes[objectID] = newNode;
    }


    this.setNodePosition = function(objectID, newX, newY)
    {
        if (this.Nodes[objectID] == null) {
            return;  // TODO:  Error here?
        }
        if (newX == null || newY == null) {
            return;
        }
        this.Nodes[objectID].x = newX;
        this.Nodes[objectID].y = newY;
        // Don't need to dirty anything, since we repaint everything every frame
        // (TODO:  Revisit if we do conditional redraws)
    }

}

