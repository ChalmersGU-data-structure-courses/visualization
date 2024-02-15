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


class SortComparison extends Algorithm {

    static INDEX_COLOR = "#0000FF";
    static BAR_FOREGROUND_COLOR = SortComparison.INDEX_COLOR;
    static BAR_BACKGROUND_COLOR ="#AAAAFF";
    static HIGHLIGHT_BAR_COLOR = "#FF0000";
    static HIGHLIGHT_BAR_BACKGROUND_COLOR = "#FFAAAA";
    static QUICKSORT_LINE_COLOR = SortComparison.HIGHLIGHT_BAR_COLOR;
    
    static DEFAULT_ARRAY_SIZE = 25;
    static ARRAY_SIZES = [25, 50, 100, 200];
    static ARRAY_SIZE_LABELS = ["Small (25)", "Medium (50)", "Large (100)", "Huge (200)"];
    
    static DEFAULT_ALGORITHM = "insertion";
    static ALGORITHMS = ["insertion", "selection", "bubble", "quick", "merge", "shell"];
    static ALGORITHM_LABELS = ["Insertion sort", "Selection sort", "Bubble sort", "Quicksort", "Merge sort", "Shellsort"];
    
    static Y_MARGINAL = 50;
    static LABEL_Y_ADD = 10;
    
    static MAX_VALUE = 99;
    static MAX_SCALE_FACTOR = 2.0;


    constructor(am) {
        super();
        this.init(am);
    }

    init(am) {
        super.init(am);
        this.addControls();
        this.resetAll();
    }

    sizeChanged() {
        this.resetAll();
    }

    addControls() {
        this.resetButton = this.addControlToAlgorithmBar("Button", "Randomize Array");
        this.resetButton.onclick = this.resetAll.bind(this);
        this.addBreakToAlgorithmBar();

        this.addLabelToAlgorithmBar("Array size:");
        this.sizeSelect = this.addSelectToAlgorithmBar(SortComparison.ARRAY_SIZES, SortComparison.ARRAY_SIZE_LABELS);
        this.sizeSelect.value = SortComparison.DEFAULT_ARRAY_SIZE;
        this.sizeSelect.onchange = this.resetAll.bind(this);
        this.addBreakToAlgorithmBar();

        this.addLabelToAlgorithmBar("Algorithm:");
        this.algorithmSelect = this.addSelectToAlgorithmBar(SortComparison.ALGORITHMS, SortComparison.ALGORITHM_LABELS);
        this.algorithmSelect.value = SortComparison.DEFAULT_ALGORITHM;
        this.sortButton = this.addControlToAlgorithmBar("Button", "Run");
        this.sortButton.onclick = this.runSortCallback.bind(this);
    }

    resetAll() {
        this.animationManager.resetAll();
        this.nextIndex = 0;

        this.info = {};
        this.info.size = parseInt(this.sizeSelect.value) || SortComparison.DEFAULT_ARRAY_SIZE;
        this.info.width = Math.floor((this.getCanvasWidth() - 50) / this.info.size);
        this.info.initial_x = Math.floor((this.getCanvasWidth() - this.info.width * (1 + this.info.size)) / 2);
        this.info.bar_width = Math.max(1, Math.floor(this.info.width * 0.8) - 2);
        this.info.labels = this.info.width >= 13;
        this.info.scale_factor = Math.min(
            SortComparison.MAX_SCALE_FACTOR,
            this.getCanvasHeight() / (3 * SortComparison.MAX_VALUE)
        );
        this.info.y_pos = SortComparison.Y_MARGINAL + SortComparison.MAX_VALUE * this.info.scale_factor;
        this.info.lower_y_pos = Math.min(
            2 * this.info.y_pos,
            this.getCanvasHeight() - SortComparison.Y_MARGINAL - SortComparison.LABEL_Y_ADD
        );

        this.createVisualObjects();
    }

    createVisualObjects() {
        var size = this.info.size;

        this.arrayData = new Array(size);
        this.oldArrayData = new Array(size);
        this.barObjects = new Array(size);
        this.oldBarObjects = new Array(size);
        this.barLabels = new Array(size);
        this.oldBarLabels = new Array(size);

        this.arraySwap = new Array(size);
        this.labelsSwap = new Array(size);
        this.objectsSwap = new Array(size);

        this.barPositionsX = new Array(size);
        this.obscureObject = new Array(size);

        var xPos = this.info.initial_x;
        var yPos = this.info.y_pos;
        var yLabelPos = yPos + SortComparison.LABEL_Y_ADD;

        this.commands = [];
        for (var i = 0; i < size; i++) {
            xPos = xPos + this.info.width;
            this.barPositionsX[i] = xPos;
            this.obscureObject[i] = false;
            this.oldArrayData[i] = this.arrayData[i] = Math.floor(1 + Math.random() * SortComparison.MAX_VALUE);

            var rectID = this.nextIndex++;
            var barHeight = this.arrayData[i] * this.info.scale_factor;
            this.cmd("CreateRectangle", rectID, "", this.info.bar_width, barHeight, xPos, yPos, "center", "bottom");
            this.cmd("SetForegroundColor", rectID, SortComparison.BAR_FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", rectID, SortComparison.BAR_BACKGROUND_COLOR);
            this.oldBarObjects[i] = this.barObjects[i] = rectID;

            var labelID = this.nextIndex++;
            var label = this.info.labels ? this.arrayData[i] : "";
            this.cmd("CreateLabel", labelID, label, xPos, yLabelPos);
            this.cmd("SetHeight", labelID, 10); // this.array.bar_width);
            this.cmd("SetForegroundColor", labelID, SortComparison.INDEX_COLOR);
            this.oldBarLabels[i] = this.barLabels[i] = labelID;
        }
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    reset() {
        for (var i = 0; i < this.info.size; i++) {
            this.arrayData[i] = this.oldArrayData[i];
            this.barObjects[i] = this.oldBarObjects[i];
            this.barLabels[i] = this.oldBarLabels[i];
            var label = this.info.labels ? this.arrayData[i] : "";
            this.cmd("SetText", this.barLabels[i], label);
            this.cmd("SetHeight", this.barObjects[i], this.arrayData[i] * this.info.scale_factor);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Callback functions for the algorithm control bar

    runSortCallback(event) {
        this.animationManager.clearHistory();
        this.commands = [];
        switch (this.algorithmSelect.value) {
            case "insertion":
                this.insertionSort();
                break;
            case "selection":
                this.selectionSort();
                break;
            case "bubble":
                this.bubbleSort();
                break;
            case "quick":
                this.quickSort();
                break;
            case "merge":
                this.mergeSort();
                break;
            case "shell":
                this.shellSort();
                break;
        }
        this.animationManager.StartNewAnimation(this.commands);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Functions that do the actual work

    insertionSort() {
        this.insertionSortSkip(1, 0);
    }

    selectionSort() {
        for (var i = 0; i < this.info.size - 1; i++) {
            var smallestIndex = i;
            this.cmd("SetForegroundColor", this.barObjects[smallestIndex], SortComparison.HIGHLIGHT_BAR_COLOR);
            this.cmd("SetBackgroundColor", this.barObjects[smallestIndex], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);
            for (var j = i + 1; j < this.info.size; j++) {
                this.cmd("SetForegroundColor", this.barObjects[j], SortComparison.HIGHLIGHT_BAR_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[j], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);
                this.cmd("Step");
                if (this.compare(this.arrayData[j], this.arrayData[smallestIndex]) < 0) {
                    this.cmd("SetForegroundColor", this.barObjects[smallestIndex], SortComparison.BAR_FOREGROUND_COLOR);
                    this.cmd("SetBackgroundColor", this.barObjects[smallestIndex], SortComparison.BAR_BACKGROUND_COLOR);
                    smallestIndex = j;
                }
                else {
                    this.cmd("SetForegroundColor", this.barObjects[j], SortComparison.BAR_FOREGROUND_COLOR);
                    this.cmd("SetBackgroundColor", this.barObjects[j], SortComparison.BAR_BACKGROUND_COLOR);
                }
            }
            if (smallestIndex != i) {
                this.swap(smallestIndex, i);
            }
            this.cmd("SetForegroundColor", this.barObjects[i], SortComparison.BAR_FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", this.barObjects[i], SortComparison.BAR_BACKGROUND_COLOR);
        }
    }

    bubbleSort() {
        for (var i = this.info.size - 1; i > 0; i--) {
            for (var j = 0; j < i; j++) {
                this.cmd("SetForegroundColor", this.barObjects[j], SortComparison.HIGHLIGHT_BAR_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[j], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);

                this.cmd("SetForegroundColor", this.barObjects[j + 1], SortComparison.HIGHLIGHT_BAR_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[j + 1], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);
                this.cmd("Step");
                if (this.compare(this.arrayData[j], this.arrayData[j + 1]) > 0) {
                    this.swap(j, j + 1);
                }
                this.cmd("SetForegroundColor", this.barObjects[j], SortComparison.BAR_FOREGROUND_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[j], SortComparison.BAR_BACKGROUND_COLOR);

                this.cmd("SetForegroundColor", this.barObjects[j + 1], SortComparison.BAR_FOREGROUND_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[j + 1], SortComparison.BAR_BACKGROUND_COLOR);
            }
        }
    }

    mergeSort() {
        this.recursiveMergeSort(0, this.info.size - 1);
    }

    quickSort() {
        this.iID = this.nextIndex++;
        this.jID = this.nextIndex++;
        this.info.y_ij_pos = this.info.y_pos + SortComparison.LABEL_Y_ADD * (this.info.labels ? 3 : 1);
        this.cmd("CreateLabel", this.iID, "↑", this.barPositionsX[0], this.info.y_ij_pos);
        this.cmd("CreateLabel", this.jID, "↑", this.barPositionsX[this.info.size - 1], this.info.y_ij_pos);
        this.cmd("SetForegroundColor", this.iID, SortComparison.HIGHLIGHT_BAR_COLOR);
        this.cmd("SetBackgroundColor", this.iID, SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);
        this.cmd("SetForegroundColor", this.jID, SortComparison.HIGHLIGHT_BAR_COLOR);
        this.cmd("SetBackgroundColor", this.jID, SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);
        this.recursiveQuickSort(0, this.info.size - 1);
        this.cmd("Delete", this.iID);
        this.cmd("Delete", this.jID);
    }

    recursiveQuickSort(low, high) {
        this.highlightRange(low, high);
        if (high <= low) {
            return;
        }
        this.cmd("Step");
        var lineID = this.nextIndex;
        var pivot = this.arrayData[low];
        this.cmd(
            "CreateRectangle",
            lineID,
            "",
            (this.info.size + 1) * this.info.width,
            0,
            this.info.initial_x,
            this.info.y_pos - pivot * this.info.scale_factor,
            "left",
            "bottom"
        );
        this.cmd("SetForegroundColor", lineID, SortComparison.QUICKSORT_LINE_COLOR);
        var i = low + 1;
        var j = high;

        this.cmd("Move", this.iID, this.barPositionsX[i], this.info.y_ij_pos);
        this.cmd("Move", this.jID, this.barPositionsX[j], this.info.y_ij_pos);
        this.cmd("Step");

        while (i <= j) {
            this.cmd("SetForegroundColor", this.barObjects[i], SortComparison.HIGHLIGHT_BAR_COLOR);
            this.cmd("SetBackgroundColor", this.barObjects[i], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);
            this.cmd("SetForegroundColor", this.barObjects[low], SortComparison.HIGHLIGHT_BAR_COLOR);
            this.cmd("SetBackgroundColor", this.barObjects[low], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);
            this.cmd("Step");
            this.cmd("SetForegroundColor", this.barObjects[low], SortComparison.BAR_FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", this.barObjects[low], SortComparison.BAR_BACKGROUND_COLOR);

            this.cmd("SetForegroundColor", this.barObjects[i], SortComparison.BAR_FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", this.barObjects[i], SortComparison.BAR_BACKGROUND_COLOR);
            while (i <= j && this.compare(this.arrayData[i], pivot) < 0) {
                ++i;
                this.cmd("Move", this.iID, this.barPositionsX[i], this.info.y_ij_pos);
                this.cmd("Step");
                this.cmd("SetForegroundColor", this.barObjects[low], SortComparison.HIGHLIGHT_BAR_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[low], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);
                this.cmd("SetForegroundColor", this.barObjects[i], SortComparison.HIGHLIGHT_BAR_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[i], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);
                this.cmd("Step");
                this.cmd("SetForegroundColor", this.barObjects[low], SortComparison.BAR_FOREGROUND_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[low], SortComparison.BAR_BACKGROUND_COLOR);

                this.cmd("SetForegroundColor", this.barObjects[i], SortComparison.BAR_FOREGROUND_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[i], SortComparison.BAR_BACKGROUND_COLOR);
            }
            this.cmd("SetForegroundColor", this.barObjects[j], SortComparison.HIGHLIGHT_BAR_COLOR);
            this.cmd("SetBackgroundColor", this.barObjects[j], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);

            this.cmd("SetForegroundColor", this.barObjects[low], SortComparison.HIGHLIGHT_BAR_COLOR);
            this.cmd("SetBackgroundColor", this.barObjects[low], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);

            this.cmd("Step");
            this.cmd("SetForegroundColor", this.barObjects[j], SortComparison.BAR_FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", this.barObjects[j], SortComparison.BAR_BACKGROUND_COLOR);

            this.cmd("SetForegroundColor", this.barObjects[low], SortComparison.BAR_FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", this.barObjects[low], SortComparison.BAR_BACKGROUND_COLOR);

            while (j >= i && this.compare(this.arrayData[j], pivot) > 0) {
                --j;
                this.cmd("Move", this.jID, this.barPositionsX[j], this.info.y_ij_pos);
                this.cmd("Step");
                this.cmd("SetForegroundColor", this.barObjects[j], SortComparison.HIGHLIGHT_BAR_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[j], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);

                this.cmd("SetForegroundColor", this.barObjects[low], SortComparison.HIGHLIGHT_BAR_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[low], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);

                this.cmd("Step");
                this.cmd("SetForegroundColor", this.barObjects[j], SortComparison.BAR_FOREGROUND_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[j], SortComparison.BAR_BACKGROUND_COLOR);
                this.cmd("SetForegroundColor", this.barObjects[low], SortComparison.BAR_FOREGROUND_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[low], SortComparison.BAR_BACKGROUND_COLOR);
            }
            if (i <= j) {
                this.cmd("Move", this.jID, this.barPositionsX[j - 1], this.info.y_ij_pos);
                this.cmd("Move", this.iID, this.barPositionsX[i + 1], this.info.y_ij_pos);
                this.swap(i, j);
                ++i;
                --j;
            }
        }
        if (i >= low) {
            this.cmd("SetForegroundColor", this.barObjects[i], SortComparison.BAR_FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", this.barObjects[i], SortComparison.BAR_BACKGROUND_COLOR);

        }
        if (j <= high) {
            this.cmd("SetForegroundColor", this.barObjects[j], SortComparison.BAR_FOREGROUND_COLOR);
            this.cmd("SetBackgroundColor", this.barObjects[j], SortComparison.BAR_BACKGROUND_COLOR);

        }
        this.swap(low, j);

        this.cmd("Step");
        this.cmd("Delete", lineID);

        this.recursiveQuickSort(low, j - 1);
        this.recursiveQuickSort(j + 1, high);
        this.highlightRange(low, high);
    }

    recursiveMergeSort(low, high) {
        this.highlightRange(low, high);
        if (low < high) {
            this.cmd("Step");
            var mid = Math.floor((low + high) / 2);
            this.recursiveMergeSort(low, mid);
            this.recursiveMergeSort(mid + 1, high);
            this.highlightRange(low, high);
            var insertIndex = low;
            var leftIndex = low;
            var rightIndex = mid + 1;
            while (insertIndex <= high) {
                if (leftIndex <= mid && (rightIndex > high || this.compare(this.arrayData[leftIndex], this.arrayData[rightIndex]) <= 0)) {
                    this.arraySwap[insertIndex] = this.arrayData[leftIndex];
                    this.cmd("Move", this.barObjects[leftIndex], this.barPositionsX[insertIndex], this.info.lower_y_pos);
                    this.cmd("Move", this.barLabels[leftIndex], this.barPositionsX[insertIndex], this.info.lower_y_pos + SortComparison.LABEL_Y_ADD);
                    this.cmd("Step");
                    this.labelsSwap[insertIndex] = this.barLabels[leftIndex];
                    this.objectsSwap[insertIndex] = this.barObjects[leftIndex];
                    insertIndex++;
                    leftIndex++;
                }
                else {
                    this.arraySwap[insertIndex] = this.arrayData[rightIndex];
                    this.cmd("Move", this.barObjects[rightIndex], this.barPositionsX[insertIndex], this.info.lower_y_pos);
                    this.cmd("Move", this.barLabels[rightIndex], this.barPositionsX[insertIndex], this.info.lower_y_pos + SortComparison.LABEL_Y_ADD);
                    this.cmd("Step");
                    this.labelsSwap[insertIndex] = this.barLabels[rightIndex];
                    this.objectsSwap[insertIndex] = this.barObjects[rightIndex];
                    insertIndex++;
                    rightIndex++;
                }
            }
            for (insertIndex = low; insertIndex <= high; insertIndex++) {
                this.barObjects[insertIndex] = this.objectsSwap[insertIndex];
                this.barLabels[insertIndex] = this.labelsSwap[insertIndex];
                this.arrayData[insertIndex] = this.arraySwap[insertIndex];
                this.cmd("Move", this.barObjects[insertIndex], this.barPositionsX[insertIndex], this.info.y_pos);
                this.cmd("Move", this.barLabels[insertIndex], this.barPositionsX[insertIndex], this.info.y_pos + SortComparison.LABEL_Y_ADD);
            }
            this.cmd("Step");
        }
        else {
            this.cmd("Step");
        }
    }

    shellSort() {
        for (var inc = Math.floor(this.info.size / 2); inc >= 1; inc = Math.floor(inc / 2)) {
            for (var offset = 0; offset < inc; offset = offset + 1) {
                for (var k = 0; k < this.info.size; k++) {
                    if ((k - offset) % inc == 0) {
                        if (this.obscureObject[k]) {
                            this.obscureObject[k] = false;
                            this.cmd("SetAlpha", this.barObjects[k], 1.0);
                            this.cmd("SetAlpha", this.barLabels[k], 1.0);
                        }
                    }
                    else {
                        if (!this.obscureObject[k]) {
                            this.obscureObject[k] = true;
                            this.cmd("SetAlpha", this.barObjects[k], 0.08);
                            this.cmd("SetAlpha", this.barLabels[k], 0.08);
                        }
                    }
                }
                this.cmd("Step");
                this.insertionSortSkip(inc, offset);
            }
        }
    }

    insertionSortSkip(inc, offset) {
        for (var i = inc + offset; i < this.info.size; i = i + inc) {
            var j = i;
            while (j > inc - 1) {
                this.cmd("SetForegroundColor", this.barObjects[j], SortComparison.HIGHLIGHT_BAR_COLOR);
                this.cmd("SetForegroundColor", this.barObjects[j - inc], SortComparison.HIGHLIGHT_BAR_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[j], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[j - inc], SortComparison.HIGHLIGHT_BAR_BACKGROUND_COLOR);
                this.cmd("Step");
                if (this.compare(this.arrayData[j - inc], this.arrayData[j]) <= 0) {
                    this.cmd("SetForegroundColor", this.barObjects[j], SortComparison.BAR_FOREGROUND_COLOR);
                    this.cmd("SetForegroundColor", this.barObjects[j - inc], SortComparison.BAR_FOREGROUND_COLOR);
                    this.cmd("SetBackgroundColor", this.barObjects[j], SortComparison.BAR_BACKGROUND_COLOR);
                    this.cmd("SetBackgroundColor", this.barObjects[j - inc], SortComparison.BAR_BACKGROUND_COLOR);
                    break;
                }
                this.swap(j, j - inc);
                this.cmd("SetForegroundColor", this.barObjects[j], SortComparison.BAR_FOREGROUND_COLOR);
                this.cmd("SetForegroundColor", this.barObjects[j - inc], SortComparison.BAR_FOREGROUND_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[j], SortComparison.BAR_BACKGROUND_COLOR);
                this.cmd("SetBackgroundColor", this.barObjects[j - inc], SortComparison.BAR_BACKGROUND_COLOR);
                j = j - inc;
            }
        }
    }

    swap(index1, index2) {
        var tmp = this.arrayData[index1];
        this.arrayData[index1] = this.arrayData[index2];
        this.arrayData[index2] = tmp;

        tmp = this.barObjects[index1];
        this.barObjects[index1] = this.barObjects[index2];
        this.barObjects[index2] = tmp;

        tmp = this.barLabels[index1];
        this.barLabels[index1] = this.barLabels[index2];
        this.barLabels[index2] = tmp;

        this.cmd("Move", this.barObjects[index1], this.barPositionsX[index1], this.info.y_pos);
        this.cmd("Move", this.barObjects[index2], this.barPositionsX[index2], this.info.y_pos);
        this.cmd("Move", this.barLabels[index1], this.barPositionsX[index1], this.info.y_pos + SortComparison.LABEL_Y_ADD);
        this.cmd("Move", this.barLabels[index2], this.barPositionsX[index2], this.info.y_pos + SortComparison.LABEL_Y_ADD);
        this.cmd("Step");
    }

    highlightRange(lowIndex, highIndex) {
        for (var i = 0; i < lowIndex; i++) {
            if (!this.obscureObject[i]) {
                this.obscureObject[i] = true;
                this.cmd("SetAlpha", this.barObjects[i], 0.08);
                this.cmd("SetAlpha", this.barLabels[i], 0.08);
            }
        }
        for (i = lowIndex; i <= highIndex; i++) {
            if (this.obscureObject[i]) {
                this.obscureObject[i] = false;
                this.cmd("SetAlpha", this.barObjects[i], 1.0);
                this.cmd("SetAlpha", this.barLabels[i], 1.0);
            }
        }
        for (i = highIndex + 1; i < this.info.size; i++) {
            if (!this.obscureObject[i]) {
                this.obscureObject[i] = true;
                this.cmd("SetAlpha", this.barObjects[i], 0.08);
                this.cmd("SetAlpha", this.barLabels[i], 0.08);
            }
        }
    }

}
