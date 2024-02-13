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


function SortRadix(am)
{
    this.init(am);
}


SortRadix.ARRAY_ELEM_WIDTH = 30;
SortRadix.ARRAY_ELEM_HEIGHT = 30;
SortRadix.ARRAY_ELEM_START_X = 20;

SortRadix.ARRAY_SIZE = 30;
SortRadix.COUNTER_ARRAY_SIZE = 10;


SortRadix.COUNTER_ARRAY_ELEM_WIDTH = 30;
SortRadix.COUNTER_ARRAY_ELEM_HEIGHT = 30;
//RadixSort.COUNTER_ARRAY_ELEM_START_X = 20;
SortRadix.COUNTER_ARRAY_ELEM_START_X = (SortRadix.ARRAY_ELEM_WIDTH * SortRadix.ARRAY_SIZE- SortRadix.COUNTER_ARRAY_ELEM_WIDTH * SortRadix.COUNTER_ARRAY_SIZE) / 2 + SortRadix.ARRAY_ELEM_START_X;
SortRadix.NUM_DIGITS = 3;


SortRadix.MAX_DATA_VALUE = 999;



SortRadix.inheritFrom(Algorithm);

SortRadix.prototype.init = function(am)
{
    SortRadix.superclass.init.call(this, am);
    this.addControls();
    this.setup();
}


SortRadix.prototype.sizeChanged = function()
{
    this.setup();
}


SortRadix.prototype.addControls = function()
{
    this.resetButton = this.addControlToAlgorithmBar("Button", "Randomize List");
    this.resetButton.onclick = this.resetCallback.bind(this);

    this.radixSortButton = this.addControlToAlgorithmBar("Button", "Radix Sort");
    this.radixSortButton.onclick = this.radixSortCallback.bind(this);
}


SortRadix.prototype.setup = function()
{
    this.animationManager.resetAll();
    this.nextIndex = 0;

    var h = this.getCanvasHeight();
    this.ARRAY_ELEM_Y = 3 * SortRadix.COUNTER_ARRAY_ELEM_HEIGHT;
    this.COUNTER_ARRAY_ELEM_Y = Math.floor(h / 2);
    this.SWAP_ARRAY_ELEM_Y = h - 3 * SortRadix.COUNTER_ARRAY_ELEM_HEIGHT

    this.arrayData = new Array(SortRadix.ARRAY_SIZE);
    this.arrayRects= new Array(SortRadix.ARRAY_SIZE);
    this.arrayIndices = new Array(SortRadix.ARRAY_SIZE);


    this.counterData = new Array(SortRadix.COUNTER_ARRAY_SIZE);
    this.counterRects= new Array(SortRadix.COUNTER_ARRAY_SIZE);
    this.counterIndices = new Array(SortRadix.COUNTER_ARRAY_SIZE);

    this.swapData = new Array(SortRadix.ARRAY_SIZE);
    this.swapRects= new Array(SortRadix.ARRAY_SIZE);
    this.swapIndices = new Array(SortRadix.ARRAY_SIZE);

    this.commands = new Array();

    for (var i = 0; i < SortRadix.ARRAY_SIZE; i++) {
        var nextID = this.nextIndex++;
        this.arrayData[i] = Math.floor(Math.random()*SortRadix.MAX_DATA_VALUE);
        this.cmd("CreateRectangle", nextID, this.arrayData[i], SortRadix.ARRAY_ELEM_WIDTH, SortRadix.ARRAY_ELEM_HEIGHT, SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y)
        this.arrayRects[i] = nextID;
        nextID = this.nextIndex++;
        this.arrayIndices[i] = nextID;
        this.cmd("CreateLabel",nextID,  i,  SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y + SortRadix.ARRAY_ELEM_HEIGHT);
        this.cmd("SetForegroundColor", nextID, "#0000FF");

        nextID = this.nextIndex++;
        this.cmd("CreateRectangle", nextID, "", SortRadix.ARRAY_ELEM_WIDTH, SortRadix.ARRAY_ELEM_HEIGHT, SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH, this.SWAP_ARRAY_ELEM_Y)
        this.swapRects[i] = nextID;
        nextID = this.nextIndex++;
        this.swapIndices[i] = nextID;
        this.cmd("CreateLabel",nextID,  i,  SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH, this.SWAP_ARRAY_ELEM_Y + SortRadix.ARRAY_ELEM_HEIGHT);
        this.cmd("SetForegroundColor", nextID, "#0000FF");

    }
    for (i = SortRadix.COUNTER_ARRAY_SIZE - 1; i >= 0; i--) {
        nextID = this.nextIndex++;
        this.cmd("CreateRectangle", nextID,"", SortRadix.COUNTER_ARRAY_ELEM_WIDTH, SortRadix.COUNTER_ARRAY_ELEM_HEIGHT, SortRadix.COUNTER_ARRAY_ELEM_START_X + i *SortRadix.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_Y)
        this.counterRects[i] = nextID;
        nextID = this.nextIndex++;
        this.counterIndices[i] = nextID;
        this.cmd("CreateLabel",nextID,  i,  SortRadix.COUNTER_ARRAY_ELEM_START_X + i *SortRadix.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_Y + SortRadix.COUNTER_ARRAY_ELEM_HEIGHT);
        this.cmd("SetForegroundColor", nextID, "#0000FF");
    }

    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}


SortRadix.prototype.resetAll = function(small)
{
    this.animationManager.resetAll();
    this.nextIndex = 0;
}


SortRadix.prototype.radixSortCallback = function(event)
{
    this.commands = new Array();
    var animatedCircleID = this.nextIndex++;
    var animatedCircleID2 = this.nextIndex++;
    var animatedCircleID3 = this.nextIndex++;
    var animatedCircleID4 = this.nextIndex++;

    var digits = new Array(SortRadix.NUM_DIGITS);
    for (var k = 0; k < SortRadix.NUM_DIGITS; k++) {
        digits[k] = this.nextIndex++;
    }

    for (var radix = 0;  radix < SortRadix.NUM_DIGITS; radix++) {
        for (var i = 0; i < SortRadix.COUNTER_ARRAY_SIZE; i++) {
            this.counterData[i] = 0;
            this.cmd("SetText", this.counterRects[i], 0);
        }
        for (i = 0; i < SortRadix.ARRAY_SIZE; i++) {
            this.cmd("CreateHighlightCircle", animatedCircleID, "#0000FF",  SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);
            this.cmd("CreateHighlightCircle", animatedCircleID2, "#0000FF",  SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);


            this.cmd("SetText", this.arrayRects[i], "");

            for (k = 0; k < SortRadix.NUM_DIGITS; k++) {
                var digitXPos = SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH - SortRadix.ARRAY_ELEM_WIDTH/2 + (SortRadix.NUM_DIGITS - k ) * (SortRadix.ARRAY_ELEM_WIDTH / SortRadix.NUM_DIGITS - 3);
                var digitYPos = this.ARRAY_ELEM_Y;
                this.cmd("CreateLabel", digits[k], Math.floor(this.arrayData[i] / Math.pow(10,k)) % 10, digitXPos, digitYPos);
                if (k != radix) {
                    this.cmd("SetAlpha", digits[k], 0.2);
                }
                //                        else
                //                        {
                //                            this.cmd("SetAlpha", digits[k], 0.2);
                //                        }
            }

            var index = Math.floor(this.arrayData[i] / Math.pow(10,radix)) % 10;
            this.cmd("Move", animatedCircleID,  SortRadix.COUNTER_ARRAY_ELEM_START_X + index *SortRadix.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_Y + SortRadix.COUNTER_ARRAY_ELEM_HEIGHT)
            this.cmd("Step");
            this.counterData[index]++;
            this.cmd("SetText", this.counterRects[index], this.counterData[index]);
            this.cmd("Step");
            // this.cmd("SetAlpha", this.arrayRects[i], 0.2);
            this.cmd("Delete", animatedCircleID);
            this.cmd("Delete", animatedCircleID2);
            this.cmd("SetText", this.arrayRects[i], this.arrayData[i]);
            for (k = 0; k < SortRadix.NUM_DIGITS; k++) {
                this.cmd("Delete", digits[k]);
            }
        }
        for (i=1; i < SortRadix.COUNTER_ARRAY_SIZE; i++) {
            this.cmd("SetHighlight", this.counterRects[i-1], 1);
            this.cmd("SetHighlight", this.counterRects[i], 1);
            this.cmd("Step")
            this.counterData[i] = this.counterData[i] + this.counterData[i-1];
            this.cmd("SetText", this.counterRects[i], this.counterData[i]);
            this.cmd("Step")
            this.cmd("SetHighlight", this.counterRects[i-1], 0);
            this.cmd("SetHighlight", this.counterRects[i], 0);
        }
        //                for (i=RadixSort.ARRAY_SIZE - 1; i >= 0; i--)
        //                {
        //                    this.cmd("SetAlpha", this.arrayRects[i], 1.0);
        //                }
        for (i=SortRadix.ARRAY_SIZE - 1; i >= 0; i--) {
            this.cmd("CreateHighlightCircle", animatedCircleID, "#0000FF",  SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);
            this.cmd("CreateHighlightCircle", animatedCircleID2, "#0000FF",  SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);

            this.cmd("SetText", this.arrayRects[i], "");

            for (k = 0; k < SortRadix.NUM_DIGITS; k++) {
                digits[k] = this.nextIndex++;
                digitXPos = SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH - SortRadix.ARRAY_ELEM_WIDTH/2 + (SortRadix.NUM_DIGITS - k ) * (SortRadix.ARRAY_ELEM_WIDTH / SortRadix.NUM_DIGITS - 3);
                digitYPos = this.ARRAY_ELEM_Y;
                this.cmd("CreateLabel", digits[k], Math.floor(this.arrayData[i] / Math.pow(10,k)) % 10, digitXPos, digitYPos);
                if (k != radix) {
                    this.cmd("SetAlpha", digits[k], 0.2);
                }
            }

            index = Math.floor(this.arrayData[i] / Math.pow(10,radix)) % 10;
            this.cmd("Move", animatedCircleID2,  SortRadix.COUNTER_ARRAY_ELEM_START_X + index *SortRadix.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_Y + SortRadix.COUNTER_ARRAY_ELEM_HEIGHT)
            this.cmd("Step");

            var insertIndex = --this.counterData[index];
            this.cmd("SetText", this.counterRects[index], this.counterData[index]);
            this.cmd("Step");

            this.cmd("CreateHighlightCircle", animatedCircleID3, "#AAAAFF",  SortRadix.COUNTER_ARRAY_ELEM_START_X + index *SortRadix.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_Y);
            this.cmd("CreateHighlightCircle", animatedCircleID4, "#AAAAFF",  SortRadix.COUNTER_ARRAY_ELEM_START_X + index *SortRadix.COUNTER_ARRAY_ELEM_WIDTH, this.COUNTER_ARRAY_ELEM_Y);

            this.cmd("Move", animatedCircleID4,  SortRadix.ARRAY_ELEM_START_X + insertIndex * SortRadix.ARRAY_ELEM_WIDTH, this.SWAP_ARRAY_ELEM_Y + SortRadix.COUNTER_ARRAY_ELEM_HEIGHT)
            this.cmd("Step");

            var moveLabel = this.nextIndex++;
            this.cmd("SetText", this.arrayRects[i], "");
            this.cmd("CreateLabel", moveLabel, this.arrayData[i], SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);
            this.cmd("Move", moveLabel, SortRadix.ARRAY_ELEM_START_X + insertIndex *SortRadix.ARRAY_ELEM_WIDTH, this.SWAP_ARRAY_ELEM_Y);
            this.swapData[insertIndex] = this.arrayData[i];

            for (k = 0; k < SortRadix.NUM_DIGITS; k++) {
                this.cmd("Delete", digits[k]);
            }
            this.cmd("Step");
            this.cmd("Delete", moveLabel);
            this.nextIndex--;  // Reuse index from moveLabel, now that it has been removed.
            this.cmd("SetText", this.swapRects[insertIndex], this.swapData[insertIndex]);
            this.cmd("Delete", animatedCircleID);
            this.cmd("Delete", animatedCircleID2);
            this.cmd("Delete", animatedCircleID3);
            this.cmd("Delete", animatedCircleID4);
        }

        for (i= 0; i < SortRadix.ARRAY_SIZE; i++) {
            this.cmd("SetText", this.arrayRects[i], "");
        }

        for (i= 0; i < SortRadix.COUNTER_ARRAY_SIZE; i++) {
            this.cmd("SetAlpha", this.counterRects[i], 0.05);
            this.cmd("SetAlpha", this.counterIndices[i], 0.05);
        }

        this.cmd("Step");
        var startLab = this.nextIndex;
        for (i = 0; i < SortRadix.ARRAY_SIZE; i++) {
            this.cmd("CreateLabel", startLab+i, this.swapData[i], SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH, this.SWAP_ARRAY_ELEM_Y);
            this.cmd("Move", startLab+i,  SortRadix.ARRAY_ELEM_START_X + i *SortRadix.ARRAY_ELEM_WIDTH, this.ARRAY_ELEM_Y);
            this.cmd("SetText", this.swapRects[i], "");
        }
        this.cmd("Step");
        for (i = 0; i < SortRadix.ARRAY_SIZE; i++) {
            this.arrayData[i] = this.swapData[i];
            this.cmd("SetText", this.arrayRects[i], this.arrayData[i]);
            this.cmd("Delete", startLab + i);
        }
        for (i= 0; i < SortRadix.COUNTER_ARRAY_SIZE; i++) {
            this.cmd("SetAlpha", this.counterRects[i], 1);
            this.cmd("SetAlpha", this.counterIndices[i], 1);
        }
    }
    this.animationManager.StartNewAnimation(this.commands);
}


SortRadix.prototype.randomizeArray = function()
{
    this.commands = new Array();
    for (var i = 0; i < SortRadix.ARRAY_SIZE; i++) {
        this.arrayData[i] = Math.floor(1 + Math.random()*SortRadix.MAX_DATA_VALUE);
        this.cmd("SetText", this.arrayRects[i], this.arrayData[i]);
    }

    for (i = 0; i < SortRadix.COUNTER_ARRAY_SIZE; i++) {
        this.cmd("SetText", this.counterRects[i], "");
    }

    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}


// We want to (mostly) ignore resets, since we are disallowing undoing
SortRadix.prototype.reset = function()
{
    this.commands = new Array();
}


SortRadix.prototype.resetCallback = function(event)
{
    this.randomizeArray();
}



var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new SortRadix(animManag);
}