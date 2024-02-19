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
// THIS SOFTWARE IS PROVIDED BY David Galles ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL David Galles OR
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


class DisjointSet extends Algorithm {

    static ARRAY_START_X = 50;
    static ARRAY_WIDTH = 30;
    static ARRAY_HEIGHT = 30;

    static TREE_START_X = 50;
    static TREE_ELEM_WIDTH = 50;
    static TREE_ELEM_HEIGHT = 50;

    static SIZE = 16;

    static LINK_COLOR = "#007700"
    static HIGHLIGHT_CIRCLE_COLOR = "#007700";
    static FOREGROUND_COLOR = "#007700";
    static BACKGROUND_COLOR = "#EEFFEE";
    static PRINT_COLOR = DisjointSet.FOREGROUND_COLOR;


    constructor(am) {
        super();
        this.init(am);
    }

    init(am) {
        super.init(am);
        this.addControls();
        this.setup();
    }

    sizeChanged() {
        this.setup();
    }

    addControls() {
        this.findField = this.addControlToAlgorithmBar("Text", "", { maxlength: 4, size: 4 });
        this.addReturnSubmit(this.findField, "int", this.findCallback.bind(this));

        var findButton = this.addControlToAlgorithmBar("Button", "Find");
        findButton.onclick = this.findCallback.bind(this);

        this.unionField1 = this.addControlToAlgorithmBar("Text", "", { maxlength: 4, size: 4 });
        this.addReturnSubmit(this.unionField1, "int", this.unionCallback.bind(this));

        this.unionField2 = this.addControlToAlgorithmBar("Text", "", { maxlength: 4, size: 4 });
        this.addReturnSubmit(this.unionField2, "int", this.unionCallback.bind(this));

        this.unionButton = this.addControlToAlgorithmBar("Button", "Union");
        this.unionButton.onclick = this.unionCallback.bind(this);

        this.pathCompressionBox = this.addCheckboxToAlgorithmBar("Path Compression");
        this.pathCompressionBox.onclick = this.pathCompressionChangeCallback.bind(this);

        this.unionByRankBox = this.addCheckboxToAlgorithmBar("Union By Rank");
        this.unionByRankBox.onclick = this.unionByRankChangeCallback.bind(this);

        var radioButtonList = this.addRadioButtonGroupToAlgorithmBar(
            ["Rank = # of nodes", "Rank = estimated height"],
            "RankType"
        );
        this.rankNumberOfNodesButton = radioButtonList[0];
        this.rankNumberOfNodesButton.onclick = this.rankTypeChangedCallback.bind(this, false);

        this.rankEstimatedHeightButton = radioButtonList[1];
        this.rankEstimatedHeightButton.onclick = this.rankTypeChangedCallback.bind(this, true);

        this.rankNumberOfNodesButton.checked = !this.rankAsHeight;
        this.rankEstimatedHeightButton.checked = this.rankAsHeight;
    }

    setup() {
        this.animationManager.resetAll();
        this.nextIndex = 0;

        var h = this.getCanvasHeight();
        this.array_start_y = h - 2 * DisjointSet.ARRAY_HEIGHT;
        this.tree_start_y = this.array_start_y - 50;

        this.highlight1ID = this.nextIndex++;
        this.highlight2ID = this.nextIndex++;

        this.arrayID = new Array(DisjointSet.SIZE);
        this.arrayLabelID = new Array(DisjointSet.SIZE);
        this.treeID = new Array(DisjointSet.SIZE);
        this.setData = new Array(DisjointSet.SIZE);
        this.treeY = new Array(DisjointSet.SIZE);
        this.treeIndexToLocation = new Array(DisjointSet.SIZE);
        this.locationToTreeIndex = new Array(DisjointSet.SIZE);
        this.heights = new Array(DisjointSet.SIZE);
        for (var i = 0; i < DisjointSet.SIZE; i++) {
            this.treeIndexToLocation[i] = i;
            this.locationToTreeIndex[i] = i;
            this.arrayID[i] = this.nextIndex++;
            this.arrayLabelID[i] = this.nextIndex++;
            this.treeID[i] = this.nextIndex++;
            this.setData[i] = -1;
            this.treeY[i] = this.tree_start_y;
            this.heights[i] = 0;
        }

        this.pathCompression = false;
        this.unionByRank = false;
        this.rankAsHeight = false;

        this.commands = [];

        for (var i = 0; i < DisjointSet.SIZE; i++) {
            this.cmd("CreateRectangle", this.arrayID[i], this.setData[i], DisjointSet.ARRAY_WIDTH, DisjointSet.ARRAY_HEIGHT, DisjointSet.ARRAY_START_X + i * DisjointSet.ARRAY_WIDTH, this.array_start_y);
            this.cmd("CreateLabel", this.arrayLabelID[i], i, DisjointSet.ARRAY_START_X + i * DisjointSet.ARRAY_WIDTH, this.array_start_y + DisjointSet.ARRAY_HEIGHT);
            this.cmd("SetForegroundColor", this.arrayLabelID[i], "#0000FF");

            this.cmd("CreateCircle", this.treeID[i], i, DisjointSet.TREE_START_X + this.treeIndexToLocation[i] * DisjointSet.TREE_ELEM_WIDTH, this.treeY[i]);
            this.cmd("SetForegroundColor", this.treeID[i], DisjointSet.FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", this.treeID[i], DisjointSet.BACKGROUND_COLOR);

        }

        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    reset() {
        for (var i = 0; i < DisjointSet.SIZE; i++) {
            this.setData[i] = -1;
        }
        this.pathCompression = false;
        this.unionByRank = false;
        this.rankAsHeight = false;
        this.pathCompressionBox.selected = this.pathCompression;
        this.unionByRankBox.selected = this.unionByRank;
        this.rankNumberOfNodesButton.checked = !this.rankAsHeight;
        this.rankEstimatedHeightButton.checked = this.rankAsHeight;
    }

    rankTypeChangedCallback(rankAsHeight, event) {
        if (this.rankAsHeight != rankAsHeight) {
            this.implementAction(this.changeRankType.bind(this), rankAsHeight);
        }
    }

    pathCompressionChangeCallback(event) {
        if (this.pathCompression != this.pathCompressionBox.checked) {
            this.implementAction(this.changePathCompression.bind(this), this.pathCompressionBox.checked);
        }
    }

    unionByRankChangeCallback(event) {
        if (this.unionByRank != this.unionByRankBox.checked) {
            this.implementAction(this.changeUnionByRank.bind(this), this.unionByRankBox.checked);
        }
    }

    changeRankType(newValue) {
        this.commands = new Array();
        this.rankAsHeight = newValue;
        if (this.rankNumberOfNodesButton.checked == this.rankAsHeight) {
            this.rankNumberOfNodesButton.checked = !this.rankAsHeight;
        }
        if (this.rankEstimatedHeightButton.checked != this.rankAsHeight) {
            this.rankEstimatedHeightButton.checked = this.rankAsHeight;
        }
        // When we change union by rank, we can either create a blank slate using clearAll,
        // or we can rebuild the root values to what they shoue be given the current state of
        // the tree.
        // clearAll();
        this.rebuildRootValues();
        return this.commands;
    }

    changeUnionByRank(newValue) {
        this.commands = new Array();
        this.unionByRank = newValue;
        if (this.unionByRankBox.selected != this.unionByRank) {
            this.unionByRankBox.selected = this.unionByRank;
        }
        // When we change union by rank, we can either create a blank slate using clearAll,
        // or we can rebuild the root values to what they shoue be given the current state of
        // the tree.
        // clearAll();
        this.rebuildRootValues();
        return this.commands;
    }

    changePathCompression(newValue) {
        this.commands = new Array();
        this.cmd("Step");
        this.pathCompression = newValue;
        if (this.pathCompressionBox.selected != this.pathCompression) {
            this.pathCompressionBox.selected = this.pathCompression;
        }
        this.rebuildRootValues();
        // clearAll();
        return this.commands;
    }

    findCallback(event) {
        var findValue = this.normalizeNumber(this.findField.value);
        if (findValue !== "" && findValue < DisjointSet.SIZE) {
            this.findField.value = "";
            this.implementAction(this.findElement.bind(this), findValue);
        }
    }

    clearCallback(event) {
        this.implementAction(this.clearData.bind(this), "");
    }

    clearData(ignored) {
        this.commands = new Array();
        clearAll();
        return this.commands;
    }

    getSizes() {
        var sizes = new Array(DisjointSet.SIZE);
        for (var i = 0; i < DisjointSet.SIZE; i++) {
            sizes[i] = 1;
        }
        var changed = true;
        while (changed) {
            changed = false;
            for (i = 0; i < DisjointSet.SIZE; i++) {
                if (sizes[i] > 0 && this.setData[i] >= 0) {
                    sizes[this.setData[i]] += sizes[i];
                    sizes[i] = 0;
                    changed = true;
                }
            }
        }
        return sizes;
    }

    rebuildRootValues() {
        if (this.unionByRank) {
            if (!this.rankAsHeight) {
                var sizes = this.getSizes();
            }
            for (var i = 0; i < DisjointSet.SIZE; i++) {
                if (this.setData[i] < 0) {
                    if (this.rankAsHeight) {
                        this.setData[i] = 0 - this.heights[i] - 1;
                    }
                    else {
                        this.setData[i] = -sizes[i];
                    }
                }
            }
        }
        else {
            for (i = 0; i < DisjointSet.SIZE; i++) {
                if (this.setData[i] < 0) {
                    this.setData[i] = -1;
                }
            }
        }
        for (i = 0; i < DisjointSet.SIZE; i++) {
            this.cmd("SetText", this.arrayID[i], this.setData[i]);
        }
    }

    unionCallback(event) {
        var union1 = this.normalizeNumber(this.unionField1.value);
        var union2 = this.normalizeNumber(this.unionField2.value);
        if (union1 !== "" && union1 < DisjointSet.SIZE && union2 !== "" && union2 < DisjointSet.SIZE) {
            this.unionField1.value = "";
            this.unionField2.value = "";
            this.implementAction(this.doUnion.bind(this), union1 + ";" + union2);
        }
    }

    clearAll() {
        for (var i = 0; i < DisjointSet.SIZE; i++) {
            if (this.setData[i] >= 0) {
                this.cmd("Disconnect", this.treeID[i], this.treeID[this.setData[i]]);
            }
            this.setData[i] = -1;
            this.cmd("SetText", this.arrayID[i], this.setData[i]);
            this.treeIndexToLocation[i] = i;
            this.locationToTreeIndex[i] = i;
            this.treeY[i] = this.tree_start_y;
            this.cmd("SetPosition", this.treeID[i], DisjointSet.TREE_START_X + this.treeIndexToLocation[i] * DisjointSet.TREE_ELEM_WIDTH, this.treeY[i]);
        }
    }

    findElement(findValue) {
        this.commands = new Array();

        var found = this.doFind(parseInt(findValue));

        if (this.pathCompression) {
            var changed = this.adjustHeights();
            if (changed) {
                this.animateNewPositions();
            }
        }
        return this.commands;
    }

    doFind(elem) {
        this.cmd("SetHighlight", this.treeID[elem], 1);
        this.cmd("SetHighlight", this.arrayID[elem], 1);
        this.cmd("Step");
        this.cmd("SetHighlight", this.treeID[elem], 0);
        this.cmd("SetHighlight", this.arrayID[elem], 0);
        if (this.setData[elem] >= 0) {
            var treeRoot = this.doFind(this.setData[elem]);
            if (this.pathCompression) {
                if (this.setData[elem] != treeRoot) {
                    this.cmd("Disconnect", this.treeID[elem], this.treeID[this.setData[elem]]);
                    this.setData[elem] = treeRoot;
                    this.cmd("SetText", this.arrayID[elem], this.setData[elem]);
                    this.cmd("Connect", this.treeID[elem],
                        this.treeID[treeRoot],
                        DisjointSet.FOREGROUND_COLOR,
                        0, // Curve
                        1, // Directed
                        ""); // Label
                }
            }
            return treeRoot;
        }
        else {
            return elem;
        }
    }

    findRoot(elem) {
        while (this.setData[elem] >= 0)
            elem = this.setData[elem];
        return elem;
    }

    // After linking two trees, move them next to each other.
    adjustXPos(pos1, pos2) {
        var left1 = this.treeIndexToLocation[pos1];
        while (left1 > 0 && this.findRoot(this.locationToTreeIndex[left1 - 1]) == pos1) {
            left1--;
        }
        var right1 = this.treeIndexToLocation[pos1];
        while (right1 < DisjointSet.SIZE - 1 && this.findRoot(this.locationToTreeIndex[right1 + 1]) == pos1) {
            right1++;
        }
        var left2 = this.treeIndexToLocation[pos2];
        while (left2 > 0 && this.findRoot(this.locationToTreeIndex[left2 - 1]) == pos2) {
            left2--;
        }
        var right2 = this.treeIndexToLocation[pos2];
        while (right2 < DisjointSet.SIZE - 1 && this.findRoot(this.locationToTreeIndex[right2 + 1]) == pos2) {
            right2++;
        }
        if (right1 == left2 - 1) {
            return false;
        }

        var tmpLocationToTreeIndex = new Array(DisjointSet.SIZE);
        var nextInsertIndex = 0;
        for (var i = 0; i <= right1; i++) {
            tmpLocationToTreeIndex[nextInsertIndex++] = this.locationToTreeIndex[i];
        }
        for (i = left2; i <= right2; i++) {
            tmpLocationToTreeIndex[nextInsertIndex++] = this.locationToTreeIndex[i];
        }
        for (i = right1 + 1; i < left2; i++) {
            tmpLocationToTreeIndex[nextInsertIndex++] = this.locationToTreeIndex[i];
        }
        for (i = right2 + 1; i < DisjointSet.SIZE; i++) {
            tmpLocationToTreeIndex[nextInsertIndex++] = this.locationToTreeIndex[i];
        }
        for (i = 0; i < DisjointSet.SIZE; i++) {
            this.locationToTreeIndex[i] = tmpLocationToTreeIndex[i];
        }
        for (i = 0; i < DisjointSet.SIZE; i++) {
            this.treeIndexToLocation[this.locationToTreeIndex[i]] = i;
        }
        return true;
    }

    doUnion(value) {
        this.commands = new Array();
        var args = value.split(";");
        var arg1 = this.doFind(parseInt(args[0]));

        this.cmd("CreateHighlightCircle", this.highlight1ID, DisjointSet.HIGHLIGHT_CIRCLE_COLOR, DisjointSet.TREE_START_X + this.treeIndexToLocation[arg1] * DisjointSet.TREE_ELEM_WIDTH, this.treeY[arg1]);

        var arg2 = this.doFind(parseInt(args[1]));
        this.cmd("CreateHighlightCircle", this.highlight2ID, DisjointSet.HIGHLIGHT_CIRCLE_COLOR, DisjointSet.TREE_START_X + this.treeIndexToLocation[arg2] * DisjointSet.TREE_ELEM_WIDTH, this.treeY[arg2]);

        if (arg1 == arg2) {
            this.cmd("Delete", this.highlight1ID);
            this.cmd("Delete", this.highlight2ID);
            return this.commands;
        }

        var changed;

        if (this.treeIndexToLocation[arg1] < this.treeIndexToLocation[arg2]) {
            changed = this.adjustXPos(arg1, arg2) || changed;
        }
        else {
            changed = this.adjustXPos(arg2, arg1) || changed;
        }

        if (this.unionByRank && this.setData[arg1] < this.setData[arg2]) {
            var tmp = arg1;
            arg1 = arg2;
            arg2 = tmp;
        }

        if (this.unionByRank && this.rankAsHeight) {
            if (this.setData[arg2] == this.setData[arg1]) {
                this.setData[arg2]--;
            }
        }
        else if (this.unionByRank) {
            this.setData[arg2] = this.setData[arg2] + this.setData[arg1];
        }

        this.setData[arg1] = arg2;

        this.cmd("SetText", this.arrayID[arg1], this.setData[arg1]);
        this.cmd("SetText", this.arrayID[arg2], this.setData[arg2]);

        this.cmd("Connect", this.treeID[arg1],
            this.treeID[arg2],
            DisjointSet.FOREGROUND_COLOR,
            0, // Curve
            1, // Directed
            ""); // Label

        if (this.adjustHeights()) {
            changed = true;
        }

        if (changed) {
            this.cmd("Step");
            this.cmd("Delete", this.highlight1ID);
            this.cmd("Delete", this.highlight2ID);
            this.animateNewPositions();
        }
        else {
            this.cmd("Delete", this.highlight1ID);
            this.cmd("Delete", this.highlight2ID);
        }
        return this.commands;
    }

    adjustHeights() {
        var changed = false;
        for (var i = 0; i < DisjointSet.SIZE; i++) {
            this.heights[i] = 0;
        }

        for (var j = 0; j < DisjointSet.SIZE; j++) {
            for (i = 0; i < DisjointSet.SIZE; i++) {
                if (this.setData[i] >= 0) {
                    this.heights[this.setData[i]] = Math.max(this.heights[this.setData[i]], this.heights[i] + 1);
                }

            }
        }
        for (j = 0; j < DisjointSet.SIZE; j++) {
            for (i = 0; i < DisjointSet.SIZE; i++) {
                if (this.setData[i] >= 0) {
                    this.heights[i] = this.heights[this.setData[i]] - 1;
                }

            }
        }
        for (i = 0; i < DisjointSet.SIZE; i++) {
            var newY = this.tree_start_y - this.heights[i] * DisjointSet.TREE_ELEM_HEIGHT;
            if (this.treeY[i] != newY) {
                this.treeY[i] = newY;
                changed = true;
            }
        }
        return changed;
    }

    animateNewPositions() {
        for (var i = 0; i < DisjointSet.SIZE; i++) {
            this.cmd("Move", this.treeID[i], DisjointSet.TREE_START_X + this.treeIndexToLocation[i] * DisjointSet.TREE_ELEM_WIDTH, this.treeY[i]);
        }
    }
}
