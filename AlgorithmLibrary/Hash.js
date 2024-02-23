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
///////////////////////////////////////////////////////////////////////////////


Algorithm.Hash = class Hash extends Algorithm {
    MAX_HASH_LENGTH = 6;
    HIGHLIGHT_COLOR = "red";
    INDEX_COLOR = "blue";

    HASH_INTEGER = "int";
    HASH_STRING = "ALPHANUM";

    MESSAGE_X = 20;
    MESSAGE_Y = 20;
    SND_MESSAGE_Y = 20 + this.MESSAGE_Y;

    HASH_BITS = 16;
    BYTE_BITS = 8;
    FLOATING_BITS = 6;
    ELF_HASH_SHIFT = 6;

    HASH_NUMBER_START_X = 200;
    HASH_X_DIFF = 7;
    HASH_NUMBER_START_Y = this.MESSAGE_Y;
    HASH_ADD_START_Y = this.HASH_NUMBER_START_Y + 12;
    HASH_INPUT_START_X = 60;
    HASH_INPUT_X_DIFF = 7;
    HASH_INPUT_START_Y = this.MESSAGE_Y + 24;
    HASH_ADD_LINE_Y = this.HASH_ADD_START_Y + 18;
    HASH_RESULT_Y = this.HASH_ADD_LINE_Y + 2;
    HASH_MOD_X = this.HASH_NUMBER_START_X + this.HASH_BITS * this.HASH_X_DIFF;

    FIRST_PRINT_POS_X = 50;
    PRINT_VERTICAL_GAP = 20;
    PRINT_HORIZONTAL_GAP = 50;


    constructor(am) {
        super();
        if (am) this.init(am);
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
        this.insertField = this.addControlToAlgorithmBar("Text", "", {maxlength: this.MAX_HASH_LENGTH, size: 4});
        this.insertButton = this.addButtonToAlgorithmBar("Insert");
        this.insertButton.onclick = this.insertCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.deleteField = this.addControlToAlgorithmBar("Text", "", {maxlength: this.MAX_HASH_LENGTH, size: 4});
        this.deleteButton = this.addButtonToAlgorithmBar("Delete");
        this.deleteButton.onclick = this.deleteCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.findField = this.addControlToAlgorithmBar("Text", "", {maxlength: this.MAX_HASH_LENGTH, size: 4});
        this.findButton = this.addButtonToAlgorithmBar("Find");
        this.findButton.onclick = this.findCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.printButton = this.addButtonToAlgorithmBar("Print");
        this.printButton.onclick = this.printCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.clearButton = this.addButtonToAlgorithmBar("Clear");
        this.clearButton.onclick = this.clearCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.hashSelect = this.addSelectToAlgorithmBar(
            [this.HASH_INTEGER, this.HASH_STRING],
            ["Hash integers", "Hash strings"],
        );
        this.hashSelect.value = this.HASH_INTEGER;
        this.hashSelect.onchange = this.resetAll.bind(this);
    }

    resetAll() {
        this.animationManager.resetAll();
        this.commands = [];
        this.nextIndex = 0;

        const hashtype = this.hashSelect.value;
        this.addReturnSubmit(this.insertField, hashtype, this.insertCallback.bind(this));
        this.addReturnSubmit(this.deleteField, hashtype, this.deleteCallback.bind(this));
        this.addReturnSubmit(this.findField, hashtype, this.findCallback.bind(this));

        this.messageID = this.nextIndex++;
        this.cmd("CreateLabel", this.messageID, "", this.MESSAGE_X, this.MESSAGE_Y, 0);

        this.sndMessageID = this.nextIndex++;
        this.cmd("CreateLabel", this.sndMessageID, "", this.MESSAGE_X, this.SND_MESSAGE_Y, 0);

        this.tableCellIDs = new Array(this.tableSize);
        for (let i = 0; i < this.tableSize; i++) {
            this.tableCellIDs[i] = this.nextIndex++;
            this.cmd("CreateRectangle", this.tableCellIDs[i], "",
                this.getCellWidth(), this.getCellHeight(), this.getCellPosX(i), this.getCellPosY(i));
            const indexID = this.nextIndex++;
            this.cmd("CreateLabel", indexID, i, this.getCellPosX(i), this.getCellIndexPosY(i));
            this.cmd("SetForegroundColor", indexID, this.INDEX_COLOR);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Callback functions for the algorithm control bar

    insertCallback(event) {
        const insertedValue = this.insertField.value;
        if (insertedValue !== "") {
            this.insertField.value = "";
            this.implementAction(this.insertElement.bind(this), insertedValue);
        }
    }

    deleteCallback(event) {
        const deletedValue = this.deleteField.value;
        if (deletedValue !== "") {
            this.deleteField.value = "";
            this.implementAction(this.deleteElement.bind(this), deletedValue);
        }
    }

    findCallback(event) {
        const findValue = this.findField.value;
        if (findValue !== "") {
            this.findField.value = "";
            this.implementAction(this.findElement.bind(this), findValue);
        }
    }

    clearCallback(event) {
        this.implementAction(this.clearTable.bind(this), "");
    }

    printCallback(event) {
        this.implementAction(this.printTable.bind(this), "");
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Functions that do the actual work

    getHashCode(input) {
        const hashtype = this.hashSelect.value;
        if (hashtype === this.HASH_INTEGER) {
            return parseInt(input);
        } else {
            return this.hashString(input);
        }
    }

    getStartIndex(hash) {
        const index = hash % this.tableSize;

        const labelID = this.nextIndex++;
        const labelID2 = this.nextIndex++;
        const highlightID = this.nextIndex++;

        const lblText = `    ${hash} % ${this.tableSize}  =  `;
        this.cmd("CreateLabel", labelID, lblText, this.HASH_MOD_X, this.HASH_NUMBER_START_Y, 0);
        this.cmd("CreateLabel", labelID2, "", 0, 0);
        this.cmd("AlignRight", labelID2, labelID);
        this.cmd("Settext", labelID, lblText + index);
        this.cmd("Step");

        this.cmd("CreateHighlightCircle", highlightID, this.HIGHLIGHT_COLOR, 0, 0);
        this.cmd("SetWidth", highlightID, this.getCellHeight());
        this.cmd("AlignMiddle", highlightID, labelID2);
        this.cmd("Move", highlightID, this.getCellPosX(index), this.getCellIndexPosY(index));
        this.cmd("Step");

        this.cmd("Delete", labelID);
        this.cmd("Delete", labelID2);
        this.cmd("Delete", highlightID);
        this.nextIndex -= 3;
        return index;
    }

    hashString(input) {
        const oldnextIndex = this.nextIndex;

        const labelID = this.nextIndex++;
        this.cmd("CreateLabel", labelID, "Hashing: ", this.MESSAGE_X, this.HASH_INPUT_START_Y, 0);
        const wordToHashID = [];
        const wordToHash = [];
        let prevID = labelID;
        for (let i = 0; i < input.length; i++) {
            wordToHashID[i] = this.nextIndex++;
            wordToHash[i] = input.charAt(i);
            this.cmd("CreateLabel", wordToHashID[i], wordToHash[i], 0, 0);
            this.cmd("AlignRight", wordToHashID[i], prevID);
            prevID = wordToHashID[i];
        }

        const operatorID = this.nextIndex++;
        const barID = this.nextIndex++;

        const digits = [];
        const hashValue = [];
        const nextByte = [];
        const nextByteID = [];
        const resultDigits = [];
        const floatingDigits = [];
        for (let i = 0; i < this.HASH_BITS; i++) {
            hashValue[i] = 0;
            digits[i] = this.nextIndex++;
            resultDigits[i] = this.nextIndex++;
        }
        for (let i = 0; i < this.BYTE_BITS; i++) {
            nextByteID[i] = this.nextIndex++;
        }
        for (let i = 0; i < this.FLOATING_BITS; i++) {
            floatingDigits[i] = this.nextIndex++;
        }
        this.cmd("Step");

        this.cmd("CreateRectangle", barID, "", this.HASH_BITS * this.HASH_X_DIFF, 0, this.HASH_NUMBER_START_X, this.HASH_ADD_LINE_Y, "left", "bottom");
        const floatingVals = [];
        for (let i = wordToHash.length - 1; i >= 0; i--) {
            for (let j = 0; j < this.HASH_BITS; j++) {
                this.cmd("CreateLabel", digits[j], hashValue[j],
                    this.HASH_NUMBER_START_X + j * this.HASH_X_DIFF, this.HASH_NUMBER_START_Y, 0);
            }
            this.cmd("Delete", wordToHashID[i]);
            let nextChar = wordToHash[i].charCodeAt(0);
            for (let j = this.BYTE_BITS - 1; j >= 0; j--) {
                nextByte[j] = nextChar % 2;
                nextChar = Math.floor(nextChar / 2);
                this.cmd("CreateLabel", nextByteID[j], nextByte[j],
                    this.HASH_INPUT_START_X + i * this.HASH_INPUT_X_DIFF, this.HASH_INPUT_START_Y, 0);
                this.cmd("Move", nextByteID[j],
                    this.HASH_NUMBER_START_X + (j + this.HASH_BITS - this.BYTE_BITS) * this.HASH_X_DIFF, this.HASH_ADD_START_Y);
            }
            this.cmd("CreateLabel", operatorID, "+", this.HASH_NUMBER_START_X, this.HASH_ADD_START_Y, 0);
            this.cmd("Step");

            let carry = 0;
            for (let j = this.BYTE_BITS - 1; j >= 0; j--) {
                const k = j + this.HASH_BITS - this.BYTE_BITS;
                hashValue[k] = hashValue[k] + nextByte[j] + carry;
                if (hashValue[k] > 1) {
                    hashValue[k] = hashValue[k] - 2;
                    carry = 1;
                } else {
                    carry = 0;
                }
            }
            for (let j = this.HASH_BITS - this.BYTE_BITS - 1; j >= 0; j--) {
                hashValue[j] = hashValue[j] + carry;
                if (hashValue[j] > 1) {
                    hashValue[j] = hashValue[j] - 2;
                    carry = 1;
                } else {
                    carry = 0;
                }
            }
            for (let j = 0; j < this.HASH_BITS; j++) {
                this.cmd("CreateLabel", resultDigits[j], hashValue[j],
                    this.HASH_NUMBER_START_X + j * this.HASH_X_DIFF, this.HASH_RESULT_Y, 0);
            }
            this.cmd("Step");

            this.cmd("Delete", operatorID);
            for (let j = 0; j < this.BYTE_BITS; j++) {
                this.cmd("Delete", nextByteID[j]);
            }
            for (let j = 0; j < this.HASH_BITS; j++) {
                this.cmd("Delete", digits[j]);
                this.cmd("Move", resultDigits[j],
                    this.HASH_NUMBER_START_X + j * this.HASH_X_DIFF, this.HASH_NUMBER_START_Y);
            }
            this.cmd("Step");

            if (i > 0) {
                for (let j = 0; j < this.HASH_BITS; j++) {
                    this.cmd("Move", resultDigits[j],
                        this.HASH_NUMBER_START_X + (j - this.FLOATING_BITS) * this.HASH_X_DIFF, this.HASH_NUMBER_START_Y);
                }
                this.cmd("Step");

                for (let j = 0; j < this.HASH_BITS - this.FLOATING_BITS; j++) {
                    floatingVals[j] = hashValue[j];
                    hashValue[j] = hashValue[j + this.FLOATING_BITS];
                }
                for (let j = 0; j < this.FLOATING_BITS; j++) {
                    this.cmd("Move", resultDigits[j],
                        this.HASH_NUMBER_START_X + (j + this.ELF_HASH_SHIFT) * this.HASH_X_DIFF, this.HASH_ADD_START_Y);
                    hashValue[j + this.HASH_BITS - this.FLOATING_BITS] = 0;
                    this.cmd("CreateLabel", floatingDigits[j], 0,
                        this.HASH_NUMBER_START_X + (j + this.HASH_BITS - this.FLOATING_BITS) * this.HASH_X_DIFF, this.HASH_NUMBER_START_Y, 0);
                    if (floatingVals[j]) {
                        hashValue[j + this.ELF_HASH_SHIFT] = 1 - hashValue[j + this.ELF_HASH_SHIFT];
                    }
                }
                this.cmd("CreateLabel", operatorID, "XOR",
                    this.HASH_NUMBER_START_X, this.HASH_ADD_START_Y, 0);
                this.cmd("Step");

                for (let j = 0; j < this.HASH_BITS; j++) {
                    this.cmd("CreateLabel", digits[j], hashValue[j],
                        this.HASH_NUMBER_START_X + j * this.HASH_X_DIFF, this.HASH_RESULT_Y, 0);
                }
                this.cmd("Step");

                this.cmd("Delete", operatorID);
                for (let j = 0; j < this.HASH_BITS; j++) {
                    this.cmd("Delete", resultDigits[j]);
                    this.cmd("Move", digits[j],
                        this.HASH_NUMBER_START_X + j * this.HASH_X_DIFF, this.HASH_NUMBER_START_Y);
                }
                for (let j = 0; j < this.FLOATING_BITS; j++) {
                    this.cmd("Delete", floatingDigits[j]);
                }
                this.cmd("Step");

                for (let j = 0; j < this.HASH_BITS; j++) {
                    this.cmd("Delete", digits[j]);
                }
            } else {
                for (let j = 0; j < this.HASH_BITS; j++) {
                    this.cmd("Delete", resultDigits[j]);
                }
            }
        }
        this.cmd("Delete", barID);
        this.cmd("Delete", labelID);
        for (let j = 0; j < this.HASH_BITS; j++) {
            this.cmd("CreateLabel", digits[j], hashValue[j],
                this.HASH_NUMBER_START_X + j * this.HASH_X_DIFF, this.HASH_NUMBER_START_Y, 0);
        }
        let currHash = 0;
        for (let j = 0; j < this.HASH_BITS; j++) {
            currHash = 2 * currHash + hashValue[j];
        }
        this.cmd("CreateLabel", labelID, ` = ${currHash}`,
            this.HASH_NUMBER_START_X + this.HASH_BITS * this.HASH_X_DIFF, this.HASH_NUMBER_START_Y, 0);
        this.cmd("Step");

        this.cmd("Delete", labelID);
        for (let j = 0; j < this.HASH_BITS; j++) {
            this.cmd("Delete", digits[j]);
        }

        // Reset the nextIndex pointer to where we started
        this.nextIndex = oldnextIndex;
        return currHash;
    }
};
