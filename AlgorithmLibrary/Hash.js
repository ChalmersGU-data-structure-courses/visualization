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


class Hash extends Algorithm {
    static MAX_HASH_LENGTH = 6;
    static HIGHLIGHT_COLOR = "red";
    static INDEX_COLOR = "blue";

    static HASH_INTEGER = "int";
    static HASH_STRING = "ALPHANUM";

    static MESSAGE_X = 20;
    static MESSAGE_Y = 20;
    static SND_MESSAGE_Y = 20 + Hash.MESSAGE_Y;

    static HASH_BITS = 16;
    static BYTE_BITS = 8;
    static FLOATING_BITS = 6;
    static ELF_HASH_SHIFT = 6;

    static HASH_NUMBER_START_X = 200;
    static HASH_X_DIFF = 7;
    static HASH_NUMBER_START_Y = Hash.MESSAGE_Y;
    static HASH_ADD_START_Y = Hash.HASH_NUMBER_START_Y + 12;
    static HASH_INPUT_START_X = 60;
    static HASH_INPUT_X_DIFF = 7;
    static HASH_INPUT_START_Y = Hash.MESSAGE_Y + 24;
    static HASH_ADD_LINE_Y = Hash.HASH_ADD_START_Y + 18;
    static HASH_RESULT_Y = Hash.HASH_ADD_LINE_Y + 2;
    static HASH_MOD_X = Hash.HASH_NUMBER_START_X + Hash.HASH_BITS * Hash.HASH_X_DIFF;

    static FIRST_PRINT_POS_X = 50;
    static PRINT_VERTICAL_GAP = 20;
    static PRINT_HORIZONTAL_GAP = 50;


    init(am) {
        super.init(am);
        this.addControls();
        this.resetAll();
    }

    sizeChanged() {
        this.resetAll();
    }

    addControls() {
        this.insertField = this.addControlToAlgorithmBar("Text", "", { maxlength: Hash.MAX_HASH_LENGTH, size: 4 });
        this.insertButton = this.addControlToAlgorithmBar("Button", "Insert");
        this.insertButton.onclick = this.insertCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.deleteField = this.addControlToAlgorithmBar("Text", "", { maxlength: Hash.MAX_HASH_LENGTH, size: 4 });
        this.deleteButton = this.addControlToAlgorithmBar("Button", "Delete");
        this.deleteButton.onclick = this.deleteCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.findField = this.addControlToAlgorithmBar("Text", "", { maxlength: Hash.MAX_HASH_LENGTH, size: 4 });
        this.findButton = this.addControlToAlgorithmBar("Button", "Find");
        this.findButton.onclick = this.findCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.printButton = this.addControlToAlgorithmBar("Button", "Print");
        this.printButton.onclick = this.printCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.clearButton = this.addControlToAlgorithmBar("Button", "Clear");
        this.clearButton.onclick = this.clearCallback.bind(this);
        this.addBreakToAlgorithmBar();

        this.hashSelect = this.addSelectToAlgorithmBar(
            [Hash.HASH_INTEGER, Hash.HASH_STRING],
            ["Hash integers", "Hash strings"]
        );
        this.hashSelect.value = Hash.HASH_INTEGER;
        this.hashSelect.onchange = this.resetAll.bind(this);
    }

    resetAll() {
        this.animationManager.resetAll();
        this.commands = [];
        this.nextIndex = 0;

        var hashtype = this.hashSelect.value;
        this.addReturnSubmit(this.insertField, hashtype, this.insertCallback.bind(this));
        this.addReturnSubmit(this.deleteField, hashtype, this.deleteCallback.bind(this));
        this.addReturnSubmit(this.findField, hashtype, this.findCallback.bind(this));

        this.messageID = this.nextIndex++;
        this.cmd("CreateLabel", this.messageID, "", Hash.MESSAGE_X, Hash.MESSAGE_Y, 0);

        this.sndMessageID = this.nextIndex++;
        this.cmd("CreateLabel", this.sndMessageID, "", Hash.MESSAGE_X, Hash.SND_MESSAGE_Y, 0);

        this.tableCellIDs = new Array(this.tableSize);
        for (var i = 0; i < this.tableSize; i++) {
            this.tableCellIDs[i] = this.nextIndex++;
            this.cmd("CreateRectangle", this.tableCellIDs[i], "",
                this.getCellWidth(), this.getCellHeight(), this.getCellPosX(i), this.getCellPosY(i));
            var indexID = this.nextIndex++;
            this.cmd("CreateLabel", indexID, i, this.getCellPosX(i), this.getCellIndexPosY(i));
            this.cmd("SetForegroundColor", indexID, Hash.INDEX_COLOR);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Callback functions for the algorithm control bar

    insertCallback(event) {
        var insertedValue = this.insertField.value;
        if (insertedValue !== "") {
            this.insertField.value = "";
            this.implementAction(this.insertElement.bind(this), insertedValue);
        }
    }

    deleteCallback(event) {
        var deletedValue = this.deleteField.value;
        if (deletedValue !== "") {
            this.deleteField.value = "";
            this.implementAction(this.deleteElement.bind(this), deletedValue);
        }
    }

    findCallback(event) {
        var findValue = this.findField.value;
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
        var hashtype = this.hashSelect.value;
        if (hashtype == Hash.HASH_INTEGER) {
            return parseInt(input);
        } else {
            return this.hashString(input);
        }
    }

    getStartIndex(hash) {
        var index = hash % this.tableSize;

        var labelID = this.nextIndex++;
        var labelID2 = this.nextIndex++;
        var highlightID = this.nextIndex++;

        var lblText = `    ${hash} % ${this.tableSize}  =  `;
        this.cmd("CreateLabel", labelID, lblText, Hash.HASH_MOD_X, Hash.HASH_NUMBER_START_Y, 0);
        this.cmd("CreateLabel", labelID2, "", 0, 0);
        this.cmd("AlignRight", labelID2, labelID);
        this.cmd("Settext", labelID, lblText + index);
        this.cmd("Step");

        this.cmd("CreateHighlightCircle", highlightID, Hash.HIGHLIGHT_COLOR, 0, 0);
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
        var oldnextIndex = this.nextIndex;

        var labelID = this.nextIndex++;
        this.cmd("CreateLabel", labelID, "Hashing: ", Hash.MESSAGE_X, Hash.HASH_INPUT_START_Y, 0);
        var wordToHashID = [];
        var wordToHash = [];
        var prevID = labelID;
        for (var i = 0; i < input.length; i++) {
            wordToHashID[i] = this.nextIndex++;
            wordToHash[i] = input.charAt(i);
            this.cmd("CreateLabel", wordToHashID[i], wordToHash[i], 0, 0);
            this.cmd("AlignRight", wordToHashID[i], prevID);
            prevID = wordToHashID[i];
        }

        var operatorID = this.nextIndex++;
        var barID = this.nextIndex++;

        var digits = [];
        var hashValue = [];
        var nextByte = [];
        var nextByteID = [];
        var resultDigits = [];
        var floatingDigits = [];
        for (var i = 0; i < Hash.HASH_BITS; i++) {
            hashValue[i] = 0;
            digits[i] = this.nextIndex++;
            resultDigits[i] = this.nextIndex++;
        }
        for (var i = 0; i < Hash.BYTE_BITS; i++) {
            nextByteID[i] = this.nextIndex++;
        }
        for (var i = 0; i < Hash.FLOATING_BITS; i++) {
            floatingDigits[i] = this.nextIndex++;
        }
        this.cmd("Step");

        this.cmd("CreateRectangle", barID, "", Hash.HASH_BITS * Hash.HASH_X_DIFF, 0, Hash.HASH_NUMBER_START_X, Hash.HASH_ADD_LINE_Y, "left", "bottom");
        var floatingVals = [];
        for (var i = wordToHash.length - 1; i >= 0; i--) {
            for (var j = 0; j < Hash.HASH_BITS; j++) {
                this.cmd("CreateLabel", digits[j], hashValue[j],
                    Hash.HASH_NUMBER_START_X + j * Hash.HASH_X_DIFF, Hash.HASH_NUMBER_START_Y, 0);
            }
            this.cmd("Delete", wordToHashID[i]);
            var nextChar = wordToHash[i].charCodeAt(0);
            for (var j = Hash.BYTE_BITS - 1; j >= 0; j--) {
                nextByte[j] = nextChar % 2;
                nextChar = Math.floor(nextChar / 2);
                this.cmd("CreateLabel", nextByteID[j], nextByte[j],
                    Hash.HASH_INPUT_START_X + i * Hash.HASH_INPUT_X_DIFF, Hash.HASH_INPUT_START_Y, 0);
                this.cmd("Move", nextByteID[j],
                    Hash.HASH_NUMBER_START_X + (j + Hash.HASH_BITS - Hash.BYTE_BITS) * Hash.HASH_X_DIFF, Hash.HASH_ADD_START_Y);
            }
            this.cmd("CreateLabel", operatorID, "+", Hash.HASH_NUMBER_START_X, Hash.HASH_ADD_START_Y, 0);
            this.cmd("Step");

            var carry = 0;
            for (var j = Hash.BYTE_BITS - 1; j >= 0; j--) {
                var k = j + Hash.HASH_BITS - Hash.BYTE_BITS;
                hashValue[k] = hashValue[k] + nextByte[j] + carry;
                if (hashValue[k] > 1) {
                    hashValue[k] = hashValue[k] - 2;
                    carry = 1;
                }
                else {
                    carry = 0;
                }
            }
            for (var j = Hash.HASH_BITS - Hash.BYTE_BITS - 1; j >= 0; j--) {
                hashValue[j] = hashValue[j] + carry;
                if (hashValue[j] > 1) {
                    hashValue[j] = hashValue[j] - 2;
                    carry = 1;
                }
                else {
                    carry = 0;
                }
            }
            for (var j = 0; j < Hash.HASH_BITS; j++) {
                this.cmd("CreateLabel", resultDigits[j], hashValue[j],
                    Hash.HASH_NUMBER_START_X + j * Hash.HASH_X_DIFF, Hash.HASH_RESULT_Y, 0);
            }
            this.cmd("Step");

            this.cmd("Delete", operatorID);
            for (var j = 0; j < Hash.BYTE_BITS; j++) {
                this.cmd("Delete", nextByteID[j]);
            }
            for (var j = 0; j < Hash.HASH_BITS; j++) {
                this.cmd("Delete", digits[j]);
                this.cmd("Move", resultDigits[j],
                    Hash.HASH_NUMBER_START_X + j * Hash.HASH_X_DIFF, Hash.HASH_NUMBER_START_Y);
            }
            this.cmd("Step");

            if (i > 0) {
                for (var j = 0; j < Hash.HASH_BITS; j++) {
                    this.cmd("Move", resultDigits[j],
                        Hash.HASH_NUMBER_START_X + (j - Hash.FLOATING_BITS) * Hash.HASH_X_DIFF, Hash.HASH_NUMBER_START_Y);
                }
                this.cmd("Step");

                for (var j = 0; j < Hash.HASH_BITS - Hash.FLOATING_BITS; j++) {
                    floatingVals[j] = hashValue[j];
                    hashValue[j] = hashValue[j + Hash.FLOATING_BITS];
                }
                for (var j = 0; j < Hash.FLOATING_BITS; j++) {
                    this.cmd("Move", resultDigits[j],
                        Hash.HASH_NUMBER_START_X + (j + Hash.ELF_HASH_SHIFT) * Hash.HASH_X_DIFF, Hash.HASH_ADD_START_Y);
                    hashValue[j + Hash.HASH_BITS - Hash.FLOATING_BITS] = 0;
                    this.cmd("CreateLabel", floatingDigits[j], 0,
                        Hash.HASH_NUMBER_START_X + (j + Hash.HASH_BITS - Hash.FLOATING_BITS) * Hash.HASH_X_DIFF, Hash.HASH_NUMBER_START_Y, 0);
                    if (floatingVals[j]) {
                        hashValue[j + Hash.ELF_HASH_SHIFT] = 1 - hashValue[j + Hash.ELF_HASH_SHIFT];
                    }
                }
                this.cmd("CreateLabel", operatorID, "XOR",
                    Hash.HASH_NUMBER_START_X, Hash.HASH_ADD_START_Y, 0);
                this.cmd("Step");

                for (var j = 0; j < Hash.HASH_BITS; j++) {
                    this.cmd("CreateLabel", digits[j], hashValue[j],
                        Hash.HASH_NUMBER_START_X + j * Hash.HASH_X_DIFF, Hash.HASH_RESULT_Y, 0);
                }
                this.cmd("Step");

                this.cmd("Delete", operatorID);
                for (var j = 0; j < Hash.HASH_BITS; j++) {
                    this.cmd("Delete", resultDigits[j]);
                    this.cmd("Move", digits[j],
                        Hash.HASH_NUMBER_START_X + j * Hash.HASH_X_DIFF, Hash.HASH_NUMBER_START_Y);
                }
                for (var j = 0; j < Hash.FLOATING_BITS; j++) {
                    this.cmd("Delete", floatingDigits[j]);
                }
                this.cmd("Step");

                for (var j = 0; j < Hash.HASH_BITS; j++) {
                    this.cmd("Delete", digits[j]);
                }
            }
            else {
                for (var j = 0; j < Hash.HASH_BITS; j++) {
                    this.cmd("Delete", resultDigits[j]);
                }
            }
        }
        this.cmd("Delete", barID);
        this.cmd("Delete", labelID);
        for (var j = 0; j < Hash.HASH_BITS; j++) {
            this.cmd("CreateLabel", digits[j], hashValue[j],
                Hash.HASH_NUMBER_START_X + j * Hash.HASH_X_DIFF, Hash.HASH_NUMBER_START_Y, 0);
        }
        var currHash = 0;
        for (var j = 0; j < Hash.HASH_BITS; j++) {
            currHash = 2 * currHash + hashValue[j];
        }
        this.cmd("CreateLabel", labelID, ` = ${currHash}`,
            Hash.HASH_NUMBER_START_X + Hash.HASH_BITS * Hash.HASH_X_DIFF, Hash.HASH_NUMBER_START_Y, 0);
        this.cmd("Step");

        this.cmd("Delete", labelID);
        for (var j = 0; j < Hash.HASH_BITS; j++) {
            this.cmd("Delete", digits[j]);
        }

        // Reset the nextIndex pointer to where we started
        this.nextIndex = oldnextIndex;
        return currHash;
    }
}
