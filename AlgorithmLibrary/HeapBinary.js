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


function HeapBinary(am)
{
    this.init(am);
}
HeapBinary.inheritFrom(Algorithm);


// Various constants

HeapBinary.HEAP_X_POSITIONS = [
    null, 0.50, 0.26, 0.74, 0.14, 0.38, 0.62, 0.86,
    0.08, 0.20, 0.32, 0.44, 0.56, 0.68, 0.80, 0.92,
    0.05, 0.11, 0.17, 0.23, 0.29, 0.35, 0.41, 0.47,
    0.53, 0.59, 0.65, 0.71, 0.77, 0.83, 0.89, 0.95,

];
HeapBinary.HEAP_Y_POSITIONS = [
    null, 0.00, 0.20, 0.20, 0.40, 0.40, 0.40, 0.40,
    0.60, 0.60, 0.60, 0.60, 0.60, 0.60, 0.60, 0.60,
    0.80, 0.80, 0.80, 0.80, 0.80, 0.80, 0.80, 0.80,
    0.80, 0.80, 0.80, 0.80, 0.80, 0.80, 0.80, 0.80,
];

HeapBinary.ARRAY_SIZE = HeapBinary.HEAP_X_POSITIONS.length;

HeapBinary.LABEL_COLOR = "#0000FF";

HeapBinary.ARRAY_INITIAL_X = 30;
HeapBinary.DESCRIPT_LABEL_X = 20;

HeapBinary.REVERSED_ARRAY = "reversed";
HeapBinary.RANDOM_ARRAY = "random";


HeapBinary.prototype.init = function(am)
{
    HeapBinary.superclass.init.call(this, am);
    this.addControls();
    this.resetAll();
}


HeapBinary.prototype.addControls = function()
{
    this.insertField = this.addControlToAlgorithmBar("Text", "", {maxlength: 4, size: 4});
    this.addReturnSubmit(this.insertField, "int", this.insertCallback.bind(this));
    this.insertButton = this.addControlToAlgorithmBar("Button", "Insert");
    this.insertButton.onclick = this.insertCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.removeSmallestButton = this.addControlToAlgorithmBar("Button", "Remove smallest");
    this.removeSmallestButton.onclick = this.removeSmallestCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.clearHeapButton = this.addControlToAlgorithmBar("Button", "Clear heap");
    this.clearHeapButton.onclick = this.clearCallback.bind(this);
    this.addBreakToAlgorithmBar();

    this.addLabelToAlgorithmBar("Build heap from: ");
    this.buildHeapButton = this.addControlToAlgorithmBar("Button", "Reversed array");
    this.buildHeapButton.onclick = this.buildHeapCallback.bind(this, HeapBinary.REVERSED_ARRAY);
    this.buildHeapButton = this.addControlToAlgorithmBar("Button", "Random array");
    this.buildHeapButton.onclick = this.buildHeapCallback.bind(this, HeapBinary.RANDOM_ARRAY);
}


HeapBinary.prototype.sizeChanged = function()
{
    this.resetAll();
}


HeapBinary.prototype.resetAll = function()
{
    this.animationManager.resetAll();
    this.nextIndex = 0;
    this.commands = [];

    this.arrayData = [];
    this.arrayLabels = [];
    this.arrayRects = [];
    this.circleObjs = [];
    this.currentHeapSize = 0;

    for (var i = 0; i < HeapBinary.ARRAY_SIZE; i++) {
        this.arrayLabels[i] = this.nextIndex++;
        this.arrayRects[i] = this.nextIndex++;
        this.circleObjs[i] = this.nextIndex++;
        this.cmd("CreateRectangle", this.arrayRects[i], "", this.getArrayElemWidth(), this.getArrayElemHeight(), this.getArrayX(i), this.getArrayY(i));
        this.cmd("CreateLabel", this.arrayLabels[i], i, this.getArrayX(i), this.getArrayY(i) + this.getArrayElemHeight() * 0.9);
        this.cmd("SetForegroundColor", this.arrayLabels[i], HeapBinary.LABEL_COLOR);
    }
    this.cmd("SetNull", this.arrayRects[0], 1);

    this.swapLabel1 = this.nextIndex++;
    this.swapLabel2 = this.nextIndex++;
    this.swapLabel3 = this.nextIndex++;
    this.swapLabel4 = this.nextIndex++;
    this.descriptLabel1 = this.nextIndex++;
    this.descriptLabel2 = this.nextIndex++;
    this.descriptLabel3 = this.nextIndex++;
    this.cmd("CreateLabel", this.descriptLabel1, "", HeapBinary.DESCRIPT_LABEL_X, this.getDescriptionY(), 0);

    this.initialIndex = this.nextIndex;
    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}


HeapBinary.prototype.reset = function()
{
    this.currentHeapSize = 0;
    this.nextIndex = this.initialIndex;
}


///////////////////////////////////////////////////////////////////////////////
// Calculating canvas positions and sizes

HeapBinary.prototype.getHeapX = function(i)
{
    return HeapBinary.HEAP_X_POSITIONS[i] * this.getCanvasWidth();
}

HeapBinary.prototype.getHeapY = function(i)
{
    var startY = 6 * this.getArrayElemHeight();
    return startY + HeapBinary.HEAP_Y_POSITIONS[i] * (Math.min(500, this.getCanvasHeight()) - startY);
}

HeapBinary.prototype.getArrayX = function(i)
{
    return this.getArrayXY(i).x;
}

HeapBinary.prototype.getArrayY = function(i)
{
    return this.getArrayXY(i).y;
}

HeapBinary.prototype.getArrayXY = function(i)
{
    var x = HeapBinary.ARRAY_INITIAL_X;
    var y = 1.5 * this.getArrayElemHeight();
    for (var k = 0; k < i; k++) {
        x += this.getArrayElemWidth();
        if (x + this.getArrayElemWidth() > this.getCanvasWidth()) {
            x = HeapBinary.ARRAY_INITIAL_X;
            y += this.getArrayElemHeight() * 2;
        }
    }
    return {x: x, y: y};
}

HeapBinary.prototype.getArrayElemWidth = function() 
{
    var nrows = 1;
    while (true) {
        var w = nrows * (this.getCanvasWidth() - HeapBinary.ARRAY_INITIAL_X) / HeapBinary.ARRAY_SIZE;
        if (w >= 25) return w;
        nrows++;
    }
}

HeapBinary.prototype.getArrayElemHeight = function() 
{
    return this.getArrayElemWidth() * 0.7;
}

HeapBinary.prototype.getCircleWidth = function()
{
    return this.getCanvasWidth() * 0.05;
}

HeapBinary.prototype.getDescriptionY = function()
{
    return this.getHeapY(1) - 10;
}


///////////////////////////////////////////////////////////////////////////////
// Callback functions for the algorithm control bar

HeapBinary.prototype.insertCallback = function(event)
{
    var insertedValue = this.normalizeNumber(this.insertField.value);
    if (insertedValue !== "") {
        this.insertField.value = "";
        this.implementAction(this.insertElement.bind(this), insertedValue);
    }
}

HeapBinary.prototype.removeSmallestCallback = function(event)
{
    this.implementAction(this.removeSmallest.bind(this),"");
}

HeapBinary.prototype.clearCallback = function(event)
{
    this.implementAction(this.clearHeap.bind(this), "");
}

HeapBinary.prototype.buildHeapCallback = function(arraytype, event)
{
    this.implementAction(this.buildHeap.bind(this), arraytype);
}


///////////////////////////////////////////////////////////////////////////////
// Functions that do the actual work


HeapBinary.prototype.clearHeap = function()
{
    this.commands = [];
    while (this.currentHeapSize > 0) {
        this.cmd("Delete", this.circleObjs[this.currentHeapSize]);
        this.cmd("SetText", this.arrayRects[this.currentHeapSize], "");
        this.currentHeapSize--;
    }
    return this.commands;
}


HeapBinary.prototype.insertElement = function(insertedValue)
{
    this.commands = [];
    if (this.currentHeapSize >= HeapBinary.ARRAY_SIZE - 1) {
        this.cmd("SetText", this.descriptLabel1, "Heap Full!");
        return this.commands;
    }

    this.cmd("SetText", this.descriptLabel1, "Inserting Element:  " + insertedValue);
    this.cmd("Step");
    this.cmd("CreateLabel", this.descriptLabel2, insertedValue, 0, 0, 1);
    this.cmd("AlignRight", this.descriptLabel2, this.descriptLabel1);
    this.cmd("CreateLabel", this.descriptLabel3, insertedValue, 0, 0, 1);
    this.cmd("AlignRight", this.descriptLabel3, this.descriptLabel1);
    this.currentHeapSize++;
    this.arrayData[this.currentHeapSize] = insertedValue;
    this.cmd("CreateCircle", this.circleObjs[this.currentHeapSize], "", this.getHeapX(this.currentHeapSize), this.getHeapY(this.currentHeapSize));
    this.cmd("SetWidth", this.circleObjs[this.currentHeapSize], this.getCircleWidth());
    if (this.currentHeapSize > 1) {
        this.cmd("Connect", this.circleObjs[Math.floor(this.currentHeapSize / 2)], this.circleObjs[this.currentHeapSize]);
    }

    this.cmd("Move", this.descriptLabel2, this.getHeapX(this.currentHeapSize), this.getHeapY(this.currentHeapSize));
    this.cmd("Move", this.descriptLabel3, this.getArrayX(this.currentHeapSize), this.getArrayY(this.currentHeapSize));
    this.cmd("Step");
    this.cmd("SetText", this.circleObjs[this.currentHeapSize], insertedValue);
    this.cmd("SetText", this.arrayRects[this.currentHeapSize], insertedValue);
    this.cmd("Delete", this.descriptLabel2);
    this.cmd("Delete", this.descriptLabel3);

    var currentIndex = this.currentHeapSize;
    var parentIndex = Math.floor(currentIndex / 2);

    if (currentIndex > 1) {
        this.setIndexHighlight(currentIndex, 1);
        this.setIndexHighlight(parentIndex, 1);
        this.cmd("Step");
        this.setIndexHighlight(currentIndex, 0);
        this.setIndexHighlight(parentIndex, 0);
    }

    while (currentIndex > 1 && this.compare(this.arrayData[currentIndex], this.arrayData[parentIndex]) < 0) {
        this.swap(currentIndex, parentIndex);
        currentIndex = parentIndex;
        parentIndex = Math.floor(parentIndex / 2);
        if (currentIndex > 1) {
            this.setIndexHighlight(currentIndex, 1);
            this.setIndexHighlight(parentIndex, 1);
            this.cmd("Step");
            this.setIndexHighlight(currentIndex, 0);
            this.setIndexHighlight(parentIndex, 0);
        }
    }
    this.cmd("Step");
    this.cmd("SetText", this.descriptLabel1, "");
    return this.commands;
}


HeapBinary.prototype.removeSmallest = function(dummy)
{
    this.commands = [];
    this.cmd("SetText", this.descriptLabel1, "");

    if (this.currentHeapSize == 0) {
        this.cmd("SetText", this.descriptLabel1, "Heap is empty, cannot remove smallest element");
        return this.commands;
    }
    this.cmd("SetText", this.descriptLabel1, "Removing element:  ");
    this.cmd("CreateLabel", this.descriptLabel2, this.arrayData[1],  this.getHeapX(1), this.getHeapY(1), 1);
    this.cmd("CreateLabel", this.descriptLabel3, this.arrayData[1],  this.getArrayX(1), this.getArrayY(1), 1);
    this.cmd("SetText", this.circleObjs[1], "");
    this.cmd("SetText", this.arrayRects[1], "");
    this.cmd("MoveToAlignRight", this.descriptLabel2, this.descriptLabel1);
    this.cmd("MoveToAlignRight", this.descriptLabel3, this.descriptLabel1);
    this.cmd("Step");
    this.cmd("Delete", this.descriptLabel2);
    this.cmd("Delete", this.descriptLabel3);
    this.cmd("SetText", this.descriptLabel1, "Removing element:  " + this.arrayData[1]);
    this.arrayData[1] = "";
    if (this.currentHeapSize > 1) {
        this.cmd("SetText", this.arrayRects[this.currentHeapSize], "");
        this.swap(1, this.currentHeapSize);
        this.cmd("Delete", this.circleObjs[this.currentHeapSize]);
        this.currentHeapSize--;
        this.pushDown(1);
    } else {
        this.cmd("Delete", this.circleObjs[this.currentHeapSize]);
        this.currentHeapSize--;
    }
    this.cmd("Step");
    this.cmd("SetText", this.descriptLabel1, "");
    return this.commands;
}


HeapBinary.prototype.buildHeap = function(data)
{
    this.commands = [];
    this.clearHeap();
    if (data instanceof Array) {
        for (var i = 0; i < data.length; i++) {
            this.arrayData[i+1] = data[i];
        }
        this.currentHeapSize = data.length;
    }
    else if (data == HeapBinary.RANDOM_ARRAY) {
        // Using the "inside-out" variant of Fisher-Yates shuffle:
        // https://en.wikipedia.org/wiki/Fisher–Yates_shuffle#The_%22inside-out%22_algorithm
        for (var i = 0; i < HeapBinary.ARRAY_SIZE; i++) {
            var j = Math.floor(Math.random() * (i + 1));
            if (j != i) this.arrayData[i] = this.arrayData[j];
            this.arrayData[j] = i+1;
        }
        this.currentHeapSize = HeapBinary.ARRAY_SIZE - 1;
    }
    else { // data == Heap.REVERSED_ARRAY
        for (var i = 1; i < HeapBinary.ARRAY_SIZE; i++) {
            this.arrayData[i] = HeapBinary.ARRAY_SIZE - i;
        }
        this.currentHeapSize = HeapBinary.ARRAY_SIZE - 1;
    }

    for (var i = 1; i <= this.currentHeapSize; i++) {
        this.cmd("CreateCircle", this.circleObjs[i], this.arrayData[i], this.getHeapX(i), this.getHeapY(i));
        this.cmd("SetWidth", this.circleObjs[i], this.getCircleWidth());
        this.cmd("SetText", this.arrayRects[i], this.arrayData[i]);
        if (i > 1) {
            this.cmd("Connect", this.circleObjs[Math.floor(i/2)], this.circleObjs[i]);
        }
    }
    this.cmd("Step");
    var nextElem = this.currentHeapSize;
    while (nextElem > 0) {
        this.pushDown(nextElem);
        nextElem = nextElem - 1;
    }
    return this.commands;
}


HeapBinary.prototype.swap = function(index1, index2)
{
    this.cmd("SetText", this.arrayRects[index1], "");
    this.cmd("SetText", this.arrayRects[index2], "");
    this.cmd("SetText", this.circleObjs[index1], "");
    this.cmd("SetText", this.circleObjs[index2], "");
    this.cmd("CreateLabel", this.swapLabel1, this.arrayData[index1], this.getArrayX(index1), this.getArrayY(index1));
    this.cmd("CreateLabel", this.swapLabel2, this.arrayData[index2], this.getArrayX(index2), this.getArrayY(index2));
    this.cmd("CreateLabel", this.swapLabel3, this.arrayData[index1], this.getHeapX(index1), this.getHeapY(index1));
    this.cmd("CreateLabel", this.swapLabel4, this.arrayData[index2], this.getHeapX(index2), this.getHeapY(index2));
    this.cmd("Move", this.swapLabel1, this.getArrayX(index2), this.getArrayY(index2));
    this.cmd("Move", this.swapLabel2, this.getArrayX(index1), this.getArrayY(index1));
    this.cmd("Move", this.swapLabel3, this.getHeapX(index2), this.getHeapY(index2));
    this.cmd("Move", this.swapLabel4, this.getHeapX(index1), this.getHeapY(index1));
    var tmp = this.arrayData[index1];
    this.arrayData[index1] = this.arrayData[index2];
    this.arrayData[index2] = tmp;
    this.cmd("Step")
    this.cmd("SetText", this.arrayRects[index1], this.arrayData[index1]);
    this.cmd("SetText", this.arrayRects[index2], this.arrayData[index2]);
    this.cmd("SetText", this.circleObjs[index1], this.arrayData[index1]);
    this.cmd("SetText", this.circleObjs[index2], this.arrayData[index2]);
    this.cmd("Delete", this.swapLabel1);
    this.cmd("Delete", this.swapLabel2);
    this.cmd("Delete", this.swapLabel3);
    this.cmd("Delete", this.swapLabel4);
}


HeapBinary.prototype.pushDown = function(index)
{
    while(true) {
        if (index*2 > this.currentHeapSize) {
            return;
        }
        var smallestIndex = 2*index;
        if (index*2 + 1 <= this.currentHeapSize) {
            this.setIndexHighlight(2*index, 1);
            this.setIndexHighlight(2*index + 1, 1);
            this.cmd("Step");
            this.setIndexHighlight(2*index, 0);
            this.setIndexHighlight(2*index + 1, 0);
            if (this.compare(this.arrayData[2*index + 1], this.arrayData[2*index]) < 0) {
                smallestIndex = 2*index + 1;
            }
        }
        this.setIndexHighlight(index, 1);
        this.setIndexHighlight(smallestIndex, 1);
        this.cmd("Step");
        this.setIndexHighlight(index, 0);
        this.setIndexHighlight(smallestIndex, 0);
        if (this.compare(this.arrayData[smallestIndex], this.arrayData[index]) < 0) {
            this.swap(smallestIndex, index);
            index = smallestIndex;
        }
        else {
            return;
        }
    }
}


HeapBinary.prototype.setIndexHighlight = function(index, highlightVal)
{
    this.cmd("SetHighlight", this.circleObjs[index], highlightVal);
    this.cmd("SetHighlight", this.arrayRects[index], highlightVal);
}


///////////////////////////////////////////////////////////////////////////////
// Initialization

var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new HeapBinary(animManag);
}