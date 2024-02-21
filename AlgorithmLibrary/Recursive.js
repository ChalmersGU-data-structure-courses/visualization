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
/* globals Algorithm */
/* exported Recursive */
///////////////////////////////////////////////////////////////////////////////


class ActivationRecord {
    constructor(fields) {
        this.fields = fields;
        this.values = new Array(this.fields.length);
        for (let i = 0; i < this.fields.length; i++) {
            this.values[i] = "";
        }
        this.fieldIDs = new Array(this.fields.length);
        this.labelIDs = new Array(this.fields.length);
    }
}


class Recursive extends Algorithm {
    static CODE_START_X = 10;
    static CODE_START_Y = 10;
    static CODE_LINE_HEIGHT = 14;

    static RECURSIVE_START_X = 20;
    static RECURSIVE_START_Y = 120;
    static RECURSIVE_DELTA_Y = 14;
    static RECURSIVE_DELTA_X = 15;
    static CODE_HIGHLIGHT_COLOR = "#FF0000";
    static CODE_STANDARD_COLOR = "#000000";

    static TABLE_INDEX_COLOR = "#0000FF";
    static CODE_RECURSIVE_1_COLOR = "#339933";
    static CODE_RECURSIVE_2_COLOR = "#0099FF";

    static ACTIVATION_RECORD_WIDTH = 100;
    static ACTIVATION_RECORD_HEIGHT = 20;

    static ACTIVATION_RECORD_SPACING = 2 * Recursive.ACTIVATION_RECORD_WIDTH + 10;

    static SEPARATING_LINE_COLOR = "#0000FF";

    init(am) {
        super.init(am);
    }

    addCodeToCanvas(code) {
        this.codeID = this.addCodeToCanvasBase(code, Recursive.CODE_START_X, Recursive.CODE_START_Y, Recursive.CODE_LINE_HEIGHT, Recursive.CODE_STANDARD_COLOR);
        /*  this.codeID = new Array(this.code.length);
            var i, j;
            for (let i = 0; i < code.length; i++) {
                this.codeID[i] = new Array(code[i].length);
                for (let j = 0; j < code[i].length; j++) {
                    this.codeID[i][j] = this.nextIndex++;
                    this.cmd("CreateLabel", this.codeID[i][j], code[i][j], Recursive.CODE_START_X, Recursive.CODE_START_Y + i * Recursive.CODE_LINE_HEIGHT, 0);
                    this.cmd("SetForegroundColor", this.codeID[i][j], Recursive.CODE_STANDARD_COLOR);
                    if (j > 0) {
                        this.cmd("AlignRight", this.codeID[i][j], this.codeID[i][j-1]);
                    }
                }
            } */
    }

    clearOldIDs() {
        for (let i = 0; i < this.oldIDs.length; i++) {
            this.cmd("Delete", this.oldIDs[i]);
        }
        this.oldIDs = [];
        this.nextIndex = this.initialIndex;
    }

    reset() {
        this.oldIDs = [];
        this.nextIndex = this.initialIndex;
    }

    deleteActivation(activationRec) {
        for (let i = 0; i < activationRec.labelIDs.length; i++) {
            this.cmd("Delete", activationRec.labelIDs[i]);
            this.cmd("Delete", activationRec.fieldIDs[i]);
        }
        this.cmd("Delete", activationRec.separatingLineID);
        this.cmd("Delete", activationRec.nameID);
    }

    createActivation(functionName, argList, x, y, labelsOnLeft) {
        const activationRec = new ActivationRecord(argList);

        activationRec.nameID = this.nextIndex++;
        labelsOnLeft = (labelsOnLeft == null) ? true : labelsOnLeft;
        for (let i = 0; i < argList.length; i++) {
            const valueID = this.nextIndex++;
            activationRec.fieldIDs[i] = valueID;

            this.cmd("CreateRectangle", valueID,
                "",
                Recursive.ACTIVATION_RECORD_WIDTH,
                Recursive.ACTIVATION_RECORD_HEIGHT,
                x,
                y + i * Recursive.ACTIVATION_RECORD_HEIGHT);

            const labelID = this.nextIndex++;
            activationRec.labelIDs[i] = labelID;
            this.cmd("CreateLabel", labelID, argList[i]);
            if (labelsOnLeft)
                this.cmd("AlignLeft", labelID, valueID);

            else
                this.cmd("AlignRight", labelID, valueID);
        }
        activationRec.separatingLineID = this.nextIndex++;
        this.cmd("CreateLabel", activationRec.nameID, `   ${functionName}   `);
        this.cmd("SetForegroundColor", activationRec.nameID, Recursive.SEPARATING_LINE_COLOR);

        if (labelsOnLeft) {
            this.cmd("CreateRectangle", activationRec.separatingLineID,
                "",
                Recursive.ACTIVATION_RECORD_WIDTH * 2,
                1,
                x - Recursive.ACTIVATION_RECORD_WIDTH / 2,
                y - Recursive.ACTIVATION_RECORD_HEIGHT / 2);
            this.cmd("AlignLeft", activationRec.nameID, activationRec.labelIDs[0]);
        } else {
            this.cmd("CreateRectangle", activationRec.separatingLineID,
                "",
                Recursive.ACTIVATION_RECORD_WIDTH * 2,
                1,
                x + Recursive.ACTIVATION_RECORD_WIDTH / 2,
                y - Recursive.ACTIVATION_RECORD_HEIGHT / 2);
            this.cmd("AlignRight", activationRec.nameID, activationRec.labelIDs[0]);
        }
        this.cmd("SetForegroundColor", activationRec.separatingLineID, Recursive.SEPARATING_LINE_COLOR);
        return activationRec;
    }
}
