// Copyright 2015 David Galles, University of San Francisco. All rights reserved.
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


function SearchArray(am)
{
    this.init(am);
}
SearchArray.inheritFrom(Algorithm);


// Various constants

SearchArray.LOW_CIRCLE_COLOR = "#1010FF";
SearchArray.LOW_BACKGROUND_COLOR = "#F0F0FF";
SearchArray.MID_CIRCLE_COLOR = "#108040";
SearchArray.MID_BACKGROUND_COLOR = "#F0FFF0";
SearchArray.HIGH_CIRCLE_COLOR = "#C08000";
SearchArray.HIGH_BACKGROUND_COLOR = "#FFFFE0";
SearchArray.INDEX_CIRCLE_COLOR = SearchArray.MID_CIRCLE_COLOR;
SearchArray.INDEX_BACKGROUND_COLOR = SearchArray.MID_BACKGROUND_COLOR;
SearchArray.ARRAY_LABEL_FOREGROUND_COLOR = "#0000FF";
SearchArray.CODE_HIGHLIGHT_COLOR = "#FF0000";
SearchArray.CODE_STANDARD_COLOR = "#000000";
SearchArray.RESULT_BOX_COLOR = SearchArray.CODE_HIGHLIGHT_COLOR;

SearchArray.CODE_START_X = 10;
SearchArray.CODE_START_Y = 10;
SearchArray.CODE_LINE_HEIGHT = 15;

SearchArray.DEFAULT_ARRAY_SIZE = 16;
SearchArray.ARRAY_SIZES = [16, 32, 80, 192];
SearchArray.ARRAY_SIZE_LABELS = ["Small (20)", "Medium (40)", "Large (80)", "Huge (160)"];

SearchArray.ARRAY_VALUE_MAX_INCREMENT = 5;

SearchArray.EXTRA_FIELD_WIDTH = 40;
SearchArray.EXTRA_FIELD_HEIGHT = 30;

SearchArray.SEARCH_FOR_X = 425;
SearchArray.SEARCH_FOR_Y = 40;

SearchArray.RESULT_X = 550;
SearchArray.RESULT_Y = SearchArray.SEARCH_FOR_Y;

SearchArray.COMPARISONS_X = SearchArray.RESULT_X;
SearchArray.COMPARISONS_Y = 90;

SearchArray.INDEX_X = SearchArray.SEARCH_FOR_X;
SearchArray.INDEX_Y = 140;

SearchArray.LOW_POS_X = 300;
SearchArray.LOW_POS_Y = SearchArray.INDEX_Y;

SearchArray.MID_POS_X = SearchArray.INDEX_X;
SearchArray.MID_POS_Y = SearchArray.INDEX_Y;

SearchArray.HIGH_POS_X = SearchArray.RESULT_X;
SearchArray.HIGH_POS_Y = SearchArray.INDEX_Y;

SearchArray.HIGHLIGHT_CIRCLE_SIZE = 15;

SearchArray.ARRAY_START_X = 50;
SearchArray.ARRAY_START_Y = 200;


SearchArray.LINEAR_CODE = [ 
    ["def ", "linearSearch(array, value)", ":"],
    ["    i = 0"],
    ["    while (", "i < len(array)", " and ", "array[i] < value", "):"],
    ["        i += 1"],
    ["    if (", "i >= len(array)", " or ", "array[i] != value", "):"],
    ["        return -1"],
    ["    return i"],
];

SearchArray.BINARY_CODE = [
    ["def ", "binarySearch(array, value)", ":"],
    ["    low = 0"],
    ["    high = len(array) - 1"],
    ["    while (", "low <= high", "):"],
    ["        mid = (low + high) / 2"] ,
    ["        if (", "array[mid] == value", "):"],
    ["            return mid"],
    ["        else if (", "array[mid] < value", "):"],
    ["            low = mid + 1"],
    ["        else:"],
    ["            high = mid - 1"],
    ["    return -1"],
];



SearchArray.prototype.init = function(am)
{
    SearchArray.superclass.init.call(this, am);
    this.addControls();
    this.resetAll();
}


SearchArray.prototype.sizeChanged = function()
{
    this.resetAll();
}


SearchArray.prototype.addControls = function()
{
    this.searchField = this.addControlToAlgorithmBar("Text", "", {maxlength: 3, size: 3});
    this.addReturnSubmit(this.searchField, "int");
    this.linearSearchButton = this.addControlToAlgorithmBar("Button", "Linear search");
    this.linearSearchButton.onclick = this.linearSearchCallback.bind(this);
    this.binarySearchButton = this.addControlToAlgorithmBar("Button", "Binary search");
    this.binarySearchButton.onclick = this.binarySearchCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.addLabelToAlgorithmBar("Array size:");
    this.sizeSelect = this.addSelectToAlgorithmBar(SearchArray.ARRAY_SIZES, SearchArray.ARRAY_SIZE_LABELS);
    this.sizeSelect.value = SearchArray.DEFAULT_ARRAY_SIZE;
    this.sizeSelect.onchange = this.resetAll.bind(this);
    this.addBreakToAlgorithmBar();

    this.resetButton = this.addControlToAlgorithmBar("Button", "Regenerate array");
    this.resetButton.onclick = this.resetAll.bind(this);
}


SearchArray.prototype.getSize = function()
{
    return Number(this.sizeSelect.value) || SearchArray.DEFAULT_ARRAY_SIZE;
}

SearchArray.prototype.getArrayElemWidth = function() 
{
    return 24 + 512 / this.getSize();
}

SearchArray.prototype.getArrayElemHeight = function() 
{
    return 14 + 512 / this.getSize();
}

SearchArray.prototype.getArrayLineSpacing = function()
{
    return this.getArrayElemHeight() * 2.3;
}

SearchArray.prototype.getLabelYAdd = function()
{
    return this.getArrayElemHeight() / 2 + 10;
}

SearchArray.prototype.getIndexXY = function(index) {
    var xpos = SearchArray.ARRAY_START_X;
    var ypos = SearchArray.ARRAY_START_Y + this.getArrayElemHeight();
    for (var i = 0; i < index; i++) {
        xpos += this.getArrayElemWidth();
        if (xpos > this.getCanvasWidth() - this.getArrayElemWidth()) {
            xpos = SearchArray.ARRAY_START_X;
            ypos += this.getArrayLineSpacing();
        }
    }
    return [xpos, ypos];
}

SearchArray.prototype.getIndexX = function(index) {
    return this.getIndexXY(index)[0];
}

SearchArray.prototype.getIndexY = function(index) {
    return this.getIndexXY(index)[1];
}



SearchArray.prototype.resetAll = function()
{
    this.animationManager.resetAll();
    this.nextIndex = 0;
    this.commands = [];
    var size = this.getSize();

    // Initialise a sorted array with unique random numbers:
    this.arrayID = [];
    this.arrayLabelID = [];
    this.arrayData = [];
    var value = 0;
    for (var i = 0; i < size; i++) {
        value += Math.floor(1 + SearchArray.ARRAY_VALUE_MAX_INCREMENT * Math.random());
        this.arrayData[i] = value;
        this.arrayID[i] = this.nextIndex++;
        this.arrayLabelID[i] = this.nextIndex++;
    }

    for (var i = 0; i < size; i++) {
        var xPos = this.getIndexX(i);
        var yPos = this.getIndexY(i);
        var yLabelPos = yPos + this.getLabelYAdd();
        this.cmd("CreateRectangle", this.arrayID[i], this.arrayData[i], this.getArrayElemWidth(), this.getArrayElemHeight(), xPos, yPos);
        this.cmd("CreateLabel", this.arrayLabelID[i], i, xPos, yLabelPos);
        this.cmd("SetForegroundColor", this.arrayLabelID[i], SearchArray.ARRAY_LABEL_FOREGROUND_COLOR);
    }

    this.movingLabelID = this.nextIndex++;
    this.cmd("CreateLabel", this.movingLabelID,  "", 0, 0);

    this.searchForBoxID = this.nextIndex++;
    this.searchForBoxLabel = this.nextIndex++;
    this.cmd("CreateRectangle", this.searchForBoxID, "", SearchArray.EXTRA_FIELD_WIDTH, SearchArray.EXTRA_FIELD_HEIGHT, SearchArray.SEARCH_FOR_X, SearchArray.SEARCH_FOR_Y);
    this.cmd("CreateLabel", this.searchForBoxLabel, "Seaching for:  ", SearchArray.SEARCH_FOR_X, SearchArray.SEARCH_FOR_Y);
    this.cmd("AlignLeft",  this.searchForBoxLabel, this.searchForBoxID);

    this.resultBoxID = this.nextIndex++;
    this.resultBoxLabel = this.nextIndex++;
    this.resultString = this.nextIndex++;
    this.cmd("CreateRectangle", this.resultBoxID, "", SearchArray.EXTRA_FIELD_WIDTH, SearchArray.EXTRA_FIELD_HEIGHT, SearchArray.RESULT_X, SearchArray.RESULT_Y);
    this.cmd("CreateLabel", this.resultBoxLabel, "Result:  ", SearchArray.RESULT_X, SearchArray.RESULT_Y);
    this.cmd("CreateLabel", this.resultString, "", SearchArray.RESULT_X, SearchArray.RESULT_Y);
    this.cmd("AlignLeft", this.resultBoxLabel, this.resultBoxID);
    this.cmd("AlignRight", this.resultString, this.resultBoxID);
    this.cmd("SetTextColor", this.resultString, SearchArray.RESULT_BOX_COLOR);

    this.comparisonsBoxID = this.nextIndex++;
    this.comparisonsBoxLabel = this.nextIndex++;
    this.cmd("CreateRectangle", this.comparisonsBoxID, "", SearchArray.EXTRA_FIELD_WIDTH, SearchArray.EXTRA_FIELD_HEIGHT, SearchArray.COMPARISONS_X, SearchArray.COMPARISONS_Y);
    this.cmd("CreateLabel", this.comparisonsBoxLabel, "Comparisons:  ", SearchArray.COMPARISONS_X, SearchArray.COMPARISONS_Y);
    this.cmd("AlignLeft",  this.comparisonsBoxLabel, this.comparisonsBoxID);

    this.indexBoxID = this.nextIndex++;
    this.indexBoxLabel = this.nextIndex++;
    this.cmd("CreateRectangle", this.indexBoxID, "", SearchArray.EXTRA_FIELD_WIDTH, SearchArray.EXTRA_FIELD_HEIGHT, SearchArray.INDEX_X, SearchArray.INDEX_Y);
    this.cmd("CreateLabel", this.indexBoxLabel, "Index:  ", SearchArray.INDEX_X, SearchArray.INDEX_Y);
    this.cmd("AlignLeft", this.indexBoxLabel, this.indexBoxID);
    this.cmd("SetTextColor", this.indexBoxID, SearchArray.INDEX_CIRCLE_COLOR);
    this.cmd("SetBackgroundColor", this.indexBoxID, SearchArray.INDEX_BACKGROUND_COLOR);

    this.indexCircleID = this.nextIndex++;
    this.cmd("CreateHighlightCircle", this.indexCircleID, SearchArray.INDEX_CIRCLE_COLOR, 0, 0, SearchArray.HIGHLIGHT_CIRCLE_SIZE);

    this.midBoxID = this.nextIndex++;
    this.midBoxLabel = this.nextIndex++;
    this.cmd("CreateRectangle", this.midBoxID, "", SearchArray.EXTRA_FIELD_WIDTH, SearchArray.EXTRA_FIELD_HEIGHT, SearchArray.MID_POS_X, SearchArray.MID_POS_Y);
    this.cmd("CreateLabel", this.midBoxLabel,  "Mid:  ", SearchArray.MID_POS_X, SearchArray.MID_POS_Y);
    this.cmd("AlignLeft", this.midBoxLabel, this.midBoxID);
    // this.cmd("SetForegroundColor", this.midBoxID, Search.MID_CIRCLE_COLOR);
    this.cmd("SetTextColor", this.midBoxID, SearchArray.MID_CIRCLE_COLOR);
    this.cmd("SetBackgroundColor", this.midBoxID, SearchArray.MID_BACKGROUND_COLOR);

    this.midCircleID = this.nextIndex++;
    this.cmd("CreateHighlightCircle", this.midCircleID, SearchArray.MID_CIRCLE_COLOR, 0, 0, SearchArray.HIGHLIGHT_CIRCLE_SIZE);

    this.lowBoxID = this.nextIndex++;
    this.lowBoxLabel = this.nextIndex++;
    this.cmd("CreateRectangle", this.lowBoxID, "", SearchArray.EXTRA_FIELD_WIDTH, SearchArray.EXTRA_FIELD_HEIGHT, SearchArray.LOW_POS_X, SearchArray.LOW_POS_Y);
    this.cmd("CreateLabel", this.lowBoxLabel, "Low:  ", SearchArray.LOW_POS_X, SearchArray.LOW_POS_Y);
    this.cmd("AlignLeft", this.lowBoxLabel, this.lowBoxID);
    // this.cmd("SetForegroundColor", this.lowBoxID, Search.LOW_CIRCLE_COLOR);
    this.cmd("SetTextColor", this.lowBoxID, SearchArray.LOW_CIRCLE_COLOR);
    this.cmd("SetBackgroundColor", this.lowBoxID, SearchArray.LOW_BACKGROUND_COLOR);

    this.lowCircleID = this.nextIndex++;
    this.cmd("CreateHighlightCircle", this.lowCircleID, SearchArray.LOW_CIRCLE_COLOR, 0, 0, SearchArray.HIGHLIGHT_CIRCLE_SIZE);

    this.highBoxID = this.nextIndex++;
    this.highBoxLabel = this.nextIndex++;
    this.cmd("CreateRectangle", this.highBoxID, "", SearchArray.EXTRA_FIELD_WIDTH, SearchArray.EXTRA_FIELD_HEIGHT, SearchArray.HIGH_POS_X, SearchArray.HIGH_POS_Y);
    this.cmd("CreateLabel", this.highBoxLabel, "High:  ", SearchArray.HIGH_POS_X, SearchArray.HIGH_POS_Y);
    this.cmd("AlignLeft", this.highBoxLabel, this.highBoxID);
    // this.cmd("SetForegroundColor", this.highBoxID, Search.HIGH_CIRCLE_COLOR);
    this.cmd("SetTextColor", this.highBoxID, SearchArray.HIGH_CIRCLE_COLOR);
    this.cmd("SetBackgroundColor", this.highBoxID, SearchArray.HIGH_BACKGROUND_COLOR);

    this.highCircleID = this.nextIndex++;
    this.cmd("CreateHighlightCircle", this.highCircleID, SearchArray.HIGH_CIRCLE_COLOR, 0, 0, SearchArray.HIGHLIGHT_CIRCLE_SIZE);

    this.cmd("SetAlpha", this.lowBoxID, 0);
    this.cmd("SetAlpha", this.lowBoxLabel, 0);
    this.cmd("SetAlpha", this.midBoxID, 0);
    this.cmd("SetAlpha", this.midBoxLabel, 0);
    this.cmd("SetAlpha", this.highBoxID, 0);
    this.cmd("SetAlpha", this.highBoxLabel, 0);
    this.cmd("SetAlpha", this.midCircleID, 0);
    this.cmd("SetAlpha", this.lowCircleID, 0);
    this.cmd("SetAlpha", this.highCircleID, 0);
    this.cmd("SetAlpha", this.indexBoxID, 0);
    this.cmd("SetAlpha", this.indexBoxLabel, 0);
    this.cmd("SetAlpha", this.indexCircleID, 0);

    this.binaryCodeID = this.addCodeToCanvasBase(SearchArray.BINARY_CODE, SearchArray.CODE_START_X, SearchArray.CODE_START_Y, SearchArray.CODE_LINE_HEIGHT, SearchArray.CODE_STANDARD_COLOR);
    this.linearCodeID = this.addCodeToCanvasBase(SearchArray.LINEAR_CODE, SearchArray.CODE_START_X, SearchArray.CODE_START_Y, SearchArray.CODE_LINE_HEIGHT, SearchArray.CODE_STANDARD_COLOR);

    this.setCodeAlpha(this.binaryCodeID, 0);
    this.setCodeAlpha(this.linearCodeID, 0);

    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}


///////////////////////////////////////////////////////////////////////////////
// Callback functions for the algorithm control bar

SearchArray.prototype.linearSearchCallback = function(event)
{
    var searchVal = this.normalizeNumber(this.searchField.value);
    if (searchVal !== "") {
        this.implementAction(this.linearSearch.bind(this), searchVal);
    }
}

SearchArray.prototype.binarySearchCallback = function(event)
{
    var searchVal = this.normalizeNumber(this.searchField.value);
    if (searchVal !== "") {
        this.implementAction(this.binarySearch.bind(this), searchVal);
    }
}


///////////////////////////////////////////////////////////////////////////////
// Functions that do the actual work

SearchArray.prototype.binarySearch = function(searchVal)
{
    this.commands = [];
    this.setCodeAlpha(this.binaryCodeID, 1);
    this.setCodeAlpha(this.linearCodeID, 0);

    this.cmd("SetAlpha", this.lowBoxID, 1);
    this.cmd("SetAlpha", this.lowBoxLabel, 1);
    this.cmd("SetAlpha", this.midBoxID, 1);
    this.cmd("SetAlpha", this.midBoxLabel, 1);
    this.cmd("SetAlpha", this.highBoxID, 1);
    this.cmd("SetAlpha", this.highBoxLabel, 1);
    this.cmd("SetAlpha", this.lowCircleID, 1);
    this.cmd("SetAlpha", this.midCircleID, 1);
    this.cmd("SetAlpha", this.highCircleID, 1);
    this.cmd("SetAlpha", this.indexBoxID, 0);
    this.cmd("SetAlpha", this.indexBoxLabel, 0);
    this.cmd("SetAlpha", this.indexCircleID, 0);

    this.cmd("SetPosition", this.lowCircleID, SearchArray.LOW_POS_X, SearchArray.LOW_POS_Y);
    this.cmd("SetPosition", this.midCircleID, SearchArray.MID_POS_X, SearchArray.MID_POS_Y);
    this.cmd("SetPosition", this.highCircleID, SearchArray.HIGH_POS_X, SearchArray.HIGH_POS_Y);

    this.cmd("SetText", this.resultString, "");
    this.cmd("SetText", this.resultBoxID, "");
    this.cmd("SetText", this.movingLabelID, "");

    var size = this.getSize();
    var low = 0;
    var high = size - 1;
    this.cmd("Move", this.lowCircleID, this.getIndexX(low), this.getIndexY(low));
    this.cmd("SetText", this.searchForBoxID, searchVal);
    this.cmd("SetForegroundColor", this.binaryCodeID[1][0], SearchArray.CODE_HIGHLIGHT_COLOR);
    this.cmd("SetHighlight", this.lowBoxID, 1);
    this.cmd("SetText", this.lowBoxID, low);
    this.cmd("Step");
    this.cmd("SetForegroundColor", this.binaryCodeID[1][0], SearchArray.CODE_STANDARD_COLOR);
    this.cmd("SetHighlight", this.lowBoxID, 0);
    this.cmd("SetForegroundColor", this.binaryCodeID[2][0], SearchArray.CODE_HIGHLIGHT_COLOR);
    this.cmd("SetHighlight", this.highBoxID, 1);
    this.cmd("SetText", this.highBoxID, high);
    this.cmd("Move", this.highCircleID, this.getIndexX(high), this.getIndexY(high));
    this.cmd("Step");
    this.cmd("SetForegroundColor", this.binaryCodeID[2][0], SearchArray.CODE_STANDARD_COLOR);
    this.cmd("SetHighlight", this.highBoxID, 0);

    var comparisons = 0;
    while (true)  {
        this.cmd("SetHighlight", this.highBoxID, 1);
        this.cmd("SetHighlight", this.lowBoxID, 1);
        this.cmd("SetForegroundColor", this.binaryCodeID[3][1], SearchArray.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetHighlight", this.highBoxID, 0);
        this.cmd("SetHighlight", this.lowBoxID, 0);
        this.cmd("SetForegroundColor", this.binaryCodeID[3][1], SearchArray.CODE_STANDARD_COLOR);
        if (low > high) {
            break;
        } 
        else {
            var mid = Math.floor((high + low) / 2);
            this.cmd("SetForegroundColor", this.binaryCodeID[4][0], SearchArray.CODE_HIGHLIGHT_COLOR);
            this.cmd("SetHighlight", this.highBoxID, 1);
            this.cmd("SetHighlight", this.lowBoxID, 1);
            this.cmd("SetHighlight", this.midBoxID, 1);
            this.cmd("SetText", this.midBoxID, mid);
            this.cmd("Move", this.midCircleID, this.getIndexX(mid), this.getIndexY(mid));
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.binaryCodeID[4][0], SearchArray.CODE_STANDARD_COLOR);
            this.cmd("SetHighlight", this.midBoxID, 0);
            this.cmd("SetHighlight", this.highBoxID, 0);
            this.cmd("SetHighlight", this.lowBoxID, 0);
            this.cmd("SetHighlight", this.searchForBoxID, 1);
            this.cmd("SetHighlight", this.arrayID[mid], 1);
            this.cmd("SetForegroundColor", this.binaryCodeID[5][1], SearchArray.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetHighlight", this.searchForBoxID, 0);
            this.cmd("SetHighlight", this.arrayID[mid], 0);
            this.cmd("SetForegroundColor", this.binaryCodeID[5][1], SearchArray.CODE_STANDARD_COLOR);
            var cmp = this.compare(this.arrayData[mid], searchVal);
            comparisons++;
            this.cmd("SetText", this.comparisonsBoxID, comparisons);
            if (cmp == 0) {
                break;
            }
            else {
                this.cmd("SetForegroundColor", this.binaryCodeID[7][1], SearchArray.CODE_HIGHLIGHT_COLOR);
                this.cmd("SetHighlight", this.searchForBoxID, 1);
                this.cmd("SetHighlight", this.arrayID[mid], 1);
                this.cmd("Step");
                this.cmd("SetForegroundColor", this.binaryCodeID[7][1], SearchArray.CODE_STANDARD_COLOR);
                this.cmd("SetHighlight", this.searchForBoxID, 0);
                this.cmd("SetHighlight", this.arrayID[mid],0);
                if (cmp < 0) {
                    low = mid + 1;
                    this.cmd("SetForegroundColor", this.binaryCodeID[8][0], SearchArray.CODE_HIGHLIGHT_COLOR);
                    this.cmd("SetHighlight", this.lowID,1);
                    this.cmd("SetText", this.lowBoxID, low);
                    this.cmd("Move", this.lowCircleID, this.getIndexX(low), this.getIndexY(low));
                    for (var i = 0; i < low; i++) {
                        this.cmd("SetAlpha", this.arrayID[i], 0.2);
                    }
                    this.cmd("Step");
                    this.cmd("SetForegroundColor", this.binaryCodeID[8][0], SearchArray.CODE_STANDARD_COLOR);
                    this.cmd("SetHighlight", this.lowBoxID, 0);
                }
                else {
                    high = mid - 1;
                    this.cmd("SetForegroundColor", this.binaryCodeID[10][0], SearchArray.CODE_HIGHLIGHT_COLOR);
                    this.cmd("SetHighlight", this.highBoxID,1);
                    this.cmd("SetText", this.highBoxID, high);
                    this.cmd("Move", this.highCircleID, this.getIndexX(high), this.getIndexY(high));
                    for (var i = high + 1; i < size; i++) {
                        this.cmd("SetAlpha", this.arrayID[i], 0.2);
                    }
                    this.cmd("Step");
                    this.cmd("SetForegroundColor", this.binaryCodeID[10][0], SearchArray.CODE_STANDARD_COLOR);
                    this.cmd("SetHighlight", this.midBoxID, 0);
                }
            }
        }
    }

    if (high < low) {
        this.cmd("SetText", this.resultString, "   Element not found!");
        this.cmd("SetText", this.resultBoxID, -1);
        this.cmd("AlignRight", this.resultString, this.resultBoxID);
        this.cmd("SetForegroundColor", this.binaryCodeID[11][0], SearchArray.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.binaryCodeID[11][0], SearchArray.CODE_STANDARD_COLOR);
    }
    else {
        this.cmd("SetText", this.resultString, "   Element found!");
        this.cmd("SetText", this.movingLabelID, mid);
        this.cmd("SetPosition", this.movingLabelID, this.getIndexX(mid), this.getIndexY(mid));
        this.cmd("Move", this.movingLabelID, SearchArray.RESULT_X, SearchArray.RESULT_Y);
        this.cmd("AlignRight", this.resultString, this.resultBoxID);
        this.cmd("SetForegroundColor", this.binaryCodeID[6][0], SearchArray.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.binaryCodeID[6][0], SearchArray.CODE_STANDARD_COLOR);
    }

    for (var i = 0; i < size; i++) {
        this.cmd("SetAlpha", this.arrayID[i], 1);
    }
    return this.commands;
}


SearchArray.prototype.linearSearch = function(searchVal)
{
    this.commands = [];
    this.setCodeAlpha(this.binaryCodeID, 0);
    this.setCodeAlpha(this.linearCodeID, 1);

    this.cmd("SetAlpha", this.lowBoxID, 0);
    this.cmd("SetAlpha", this.lowBoxLabel, 0);
    this.cmd("SetAlpha", this.midBoxID, 0);
    this.cmd("SetAlpha", this.midBoxLabel, 0);
    this.cmd("SetAlpha", this.highBoxID, 0);
    this.cmd("SetAlpha", this.highBoxLabel, 0);
    this.cmd("SetAlpha", this.lowCircleID, 0);
    this.cmd("SetAlpha", this.midCircleID, 0);
    this.cmd("SetAlpha", this.highCircleID, 0);    
    this.cmd("SetAlpha", this.indexBoxID, 1);
    this.cmd("SetAlpha", this.indexBoxLabel, 1);
    this.cmd("SetAlpha", this.indexCircleID, 1);    

    this.cmd("SetPosition", this.indexCircleID, SearchArray.INDEX_X, SearchArray.INDEX_Y);

    this.cmd("SetText", this.resultString, "");
    this.cmd("SetText", this.resultBoxID, "");
    this.cmd("SetText", this.movingLabelID, "");

    this.cmd("SetText", this.searchForBoxID, searchVal);
    this.cmd("SetForegroundColor", this.linearCodeID[1][0], SearchArray.CODE_HIGHLIGHT_COLOR);
    this.cmd("SetHighlight", this.indexBoxID, 1);
    this.cmd("SetText", this.indexBoxID, 0);
    this.cmd("Move", this.indexCircleID, this.getIndexX(0), this.getIndexY(0));
    
    this.cmd("Step");
    this.cmd("SetForegroundColor", this.linearCodeID[1][0], SearchArray.CODE_STANDARD_COLOR);
    this.cmd("SetHighlight", this.indexBoxID, 0);

    var size = this.getSize();
    var comparisons = 0;
    var foundIndex = 0;
    while (true) {
        if (foundIndex == size) {
            this.cmd("SetForegroundColor", this.linearCodeID[2][1], SearchArray.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.linearCodeID[2][1], SearchArray.CODE_STANDARD_COLOR);
            break;
        }

        this.cmd("SetHighlight", this.arrayID[foundIndex],1);
        this.cmd("SetHighlight", this.searchForBoxID,1);
        this.cmd("SetForegroundColor", this.linearCodeID[2][3], SearchArray.CODE_HIGHLIGHT_COLOR);
        this.cmd("Step")
        this.cmd("SetForegroundColor", this.linearCodeID[2][3], SearchArray.CODE_STANDARD_COLOR);
        this.cmd("SetHighlight", this.arrayID[foundIndex],0);
        this.cmd("SetHighlight", this.searchForBoxID,0);

        comparisons++;
        this.cmd("SetText", this.comparisonsBoxID, comparisons);
        if (this.compare(this.arrayData[foundIndex], searchVal) >= 0) {
            break;
        }

        foundIndex++;
        this.cmd("SetForegroundColor", this.linearCodeID[3][0], SearchArray.CODE_HIGHLIGHT_COLOR);
        this.cmd("SetHighlight", this.indexBoxID,1);
        this.cmd("SetText", this.indexBoxID, foundIndex);
        this.cmd("Move", this.indexCircleID, this.getIndexX(foundIndex), this.getIndexY(foundIndex));
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.linearCodeID[3][0], SearchArray.CODE_STANDARD_COLOR);
        this.cmd("SetHighlight", this.indexBoxID,0);
    }

    if (foundIndex < size && this.compare(this.arrayData[foundIndex], searchVal) == 0) {
        this.cmd("SetForegroundColor", this.linearCodeID[4][1], SearchArray.CODE_HIGHLIGHT_COLOR);
        this.cmd("SetForegroundColor", this.linearCodeID[4][2], SearchArray.CODE_HIGHLIGHT_COLOR);
        this.cmd("SetForegroundColor", this.linearCodeID[4][3], SearchArray.CODE_HIGHLIGHT_COLOR);
        this.cmd("SetHighlight", this.arrayID[foundIndex],1);
        this.cmd("SetHighlight", this.searchForBoxID,1);
        this.cmd("Step");

        this.cmd("SetHighlight", this.arrayID[foundIndex],0);
        this.cmd("SetHighlight", this.searchForBoxID,0);

        this.cmd("SetForegroundColor", this.linearCodeID[4][1], SearchArray.CODE_STANDARD_COLOR);
        this.cmd("SetForegroundColor", this.linearCodeID[4][2], SearchArray.CODE_STANDARD_COLOR);
        this.cmd("SetForegroundColor", this.linearCodeID[4][3], SearchArray.CODE_STANDARD_COLOR);
        this.cmd("SetForegroundColor", this.linearCodeID[6][0], SearchArray.CODE_HIGHLIGHT_COLOR);
        this.cmd("SetText", this.resultString, "   Element found!");
        this.cmd("SetText", this.movingLabelID, foundIndex);
        this.cmd("SetPosition", this.movingLabelID, this.getIndexX(foundIndex), this.getIndexY(foundIndex));
        this.cmd("Move", this.movingLabelID, SearchArray.RESULT_X, SearchArray.RESULT_Y);
        this.cmd("AlignRight", this.resultString, this.resultBoxID);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.linearCodeID[6][0], SearchArray.CODE_STANDARD_COLOR);
    }
    else {
        if (foundIndex == size) {
            this.cmd("SetForegroundColor", this.linearCodeID[4][1], SearchArray.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.linearCodeID[4][1], SearchArray.CODE_STANDARD_COLOR);
        }
        else {
            this.cmd("SetHighlight", this.arrayID[foundIndex], 1);
            this.cmd("SetHighlight", this.searchForBoxID, 1);
            this.cmd("SetForegroundColor", this.linearCodeID[4][3], SearchArray.CODE_HIGHLIGHT_COLOR);
            this.cmd("Step");
            this.cmd("SetHighlight", this.arrayID[foundIndex], 0);
            this.cmd("SetHighlight", this.searchForBoxID, 0);
            this.cmd("SetForegroundColor", this.linearCodeID[4][3], SearchArray.CODE_STANDARD_COLOR);
        }
        this.cmd("SetForegroundColor", this.linearCodeID[5][0], SearchArray.CODE_HIGHLIGHT_COLOR);
        this.cmd("SetText", this.resultString, "   Element not found!");
        this.cmd("SetText", this.resultBoxID, -1);
        this.cmd("AlignRight", this.resultString, this.resultBoxID);
        this.cmd("Step");
        this.cmd("SetForegroundColor", this.linearCodeID[5][0], SearchArray.CODE_STANDARD_COLOR);
    }
    return this.commands;
}


///////////////////////////////////////////////////////////////////////////////
// Initialization

var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new SearchArray(animManag);
}