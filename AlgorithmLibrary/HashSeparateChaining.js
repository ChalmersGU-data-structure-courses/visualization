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


Algorithm.Hash.SeparateChaining = class SeparateChaining extends Algorithm.Hash {
    DEFAULT_TABLE_SIZE = 13;
    TABLE_SIZES = [7, 13, 23];
    TABLE_SIZE_LABELS = ["Small (7)", "Medium (13)", "Large (23)"];

    NODE_INSERT_X = 100;
    NODE_INSERT_Y = 75;

    LinkedListNode = class LinkedListNode {
        constructor(data, id, x, y) {
            this.data = data;
            this.graphicID = id;
            this.x = x;
            this.y = y;
            this.next = null;
        }
    };

    constructor(am) {
        super();
        this.init(am);
    }

    addControls() {
        super.addControls();
        this.addBreakToAlgorithmBar();

        this.addLabelToAlgorithmBar("Table size:");
        this.sizeSelect = this.addSelectToAlgorithmBar(this.TABLE_SIZES, this.TABLE_SIZE_LABELS);
        this.sizeSelect.value = this.DEFAULT_TABLE_SIZE;
        this.sizeSelect.onchange = this.resetAll.bind(this);
    }

    resetAll() {
        this.tableSize = parseInt(this.sizeSelect.value) || this.DEFAULT_TABLE_SIZE;
        super.resetAll();

        this.tableCells = new Array(this.tableSize);
        for (let i = 0; i < this.tableSize; i++) {
            this.tableCells[i] = null;
            this.cmd("SetNull", this.tableCellIDs[i], 1);
        }

        this.initialIndex = this.nextIndex;
        this.animationManager.StartNewAnimation(this.commands);
        this.animationManager.skipForward();
        this.animationManager.clearHistory();
    }

    reset() {
        for (let i = 0; i < this.table_size; i++) {
            this.tableCells[i] = null;
        }
        this.nextIndex = this.initialIndex;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Calculating canvas positions and sizes

    getCellPosX(i) {
        return (this.getCanvasWidth() + (2 * i + 1 - this.tableSize) * this.getCellWidth()) / 2;
    }

    getCellPosY(i) {
        return Math.round(this.getCellIndexPosY(i) - this.getCellHeight() / 2 - 20);
    }

    getCellIndexPosY(i) {
        return Math.round(this.getCanvasHeight() * 0.8);
    }

    getCellWidth() {
        return Math.min(70, Math.round(this.getCanvasWidth() / (this.tableSize + 1)));
    }

    getCellHeight() {
        return Math.max(20, Math.round(this.getCellWidth() * 0.6));
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Functions that do the actual work

    printTable() {
        this.commands = [];
        this.cmd("SetText", this.messageID, "Printing hash table");
        this.highlightID = this.nextIndex++;
        this.cmd("CreateHighlightCircle", this.highlightID, "red", 0, 0);
        const firstLabel = this.nextIndex;

        let xPosOfNextLabel = this.FIRST_PRINT_POS_X;
        let yPosOfNextLabel = this.getCanvasHeight() * 0.9;

        for (let i = 0; i < this.tableCells.length; i++) {
            this.cmd("Move", this.highlightID, this.getCellPosX(i), this.getCellPosY(i));
            this.cmd("Step");
            let node = this.tableCells[i];
            while (node != null) {
                this.cmd("Move", this.highlightID, node.x, node.y);
                this.cmd("Step");

                const nextLabelID = this.nextIndex++;
                this.cmd("CreateLabel", nextLabelID, node.data, node.x, node.y);
                this.cmd("SetForegroundColor", nextLabelID, "blue");
                this.cmd("Move", nextLabelID, xPosOfNextLabel, yPosOfNextLabel);
                this.cmd("Step");

                xPosOfNextLabel += this.PRINT_HORIZONTAL_GAP;
                if (xPosOfNextLabel > this.printMax) {
                    xPosOfNextLabel = this.FIRST_PRINT_POS_X;
                    yPosOfNextLabel += this.PRINT_VERTICAL_GAP;
                }
                node = node.next;
            }
        }

        this.cmd("Delete", this.highlightID);
        this.cmd("Step");
        for (let i = firstLabel; i < this.nextIndex; i++) {
            this.cmd("Delete", i);
        }
        this.nextIndex = this.highlightID; // Reuse objects. Not necessary.
        this.cmd("SetText", this.messageID, "");
        return this.commands;
    }

    clearTable() {
        this.commands = [];
        for (let i = 0; i < this.tableCells.length; i++) {
            let node = this.tableCells[i];
            if (node != null) {
                while (node != null) {
                    this.cmd("Delete", node.graphicID);
                    node = node.next;
                }
                this.tableCells[i] = null;
                this.cmd("SetNull", this.tableCellIDs[i], 1);
            }
        }
        return this.commands;
    }

    insertElement(elem) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Inserting ${elem}`);

        const hash = this.getHashCode(elem);
        const index = this.getStartIndex(hash);

        const node = new this.LinkedListNode(elem, this.nextIndex++, 0, 0);
        this.cmd("CreateLinkedList", node.graphicID, elem, this.getCellWidth() * 0.8, this.getCellHeight(), 0, 0);
        this.cmd("AlignRight", node.graphicID, this.messageID);

        if (this.tableCells[index] != null) {
            this.cmd("Connect", node.graphicID, this.tableCells[index].graphicID);
            this.cmd("Disconnect", this.tableCellIDs[index], this.tableCells[index].graphicID);
        } else {
            this.cmd("SetNull", node.graphicID, 1);
            this.cmd("SetNull", this.tableCellIDs[index], 0);
        }
        this.cmd("Connect", this.tableCellIDs[index], node.graphicID);
        node.next = this.tableCells[index];
        this.tableCells[index] = node;

        this.repositionList(index);
        this.cmd("Step");
        this.cmd("SetText", this.messageID, `Inserted ${elem}.`);
        return this.commands;
    }

    deleteElement(elem) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Deleting ${elem}`);

        const hash = this.getHashCode(elem);
        const index = this.getStartIndex(hash);

        if (this.tableCells[index] == null) {
            this.cmd("SetText", this.messageID, `Deleting ${elem}: Element not found!`);
            return this.commands;
        }

        this.cmd("SetHighlight", this.tableCells[index].graphicID, 1);
        this.cmd("Step");
        this.cmd("SetHighlight", this.tableCells[index].graphicID, 0);
        if (this.tableCells[index].data === elem) {
            if (this.tableCells[index].next != null) {
                this.cmd("Connect", this.tableCellIDs[index], this.tableCells[index].next.graphicID);
            } else {
                this.cmd("SetNull", this.tableCellIDs[index], 1);
            }
            this.cmd("Delete", this.tableCells[index].graphicID);
            this.tableCells[index] = this.tableCells[index].next;
            this.repositionList(index);
            this.cmd("SetText", this.messageID, `Deleted ${elem}.`);
            return this.commands;
        }

        let prevNode = this.tableCells[index];
        let node = this.tableCells[index].next;
        while (node != null) {
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", node.graphicID, 0);
            if (node.data === elem) {
                if (node.next != null) {
                    this.cmd("Connect", prevNode.graphicID, node.next.graphicID);
                } else {
                    this.cmd("SetNull", prevNode.graphicID, 1);
                }
                prevNode.next = prevNode.next.next;
                this.cmd("Delete", node.graphicID);
                this.repositionList(index);
                this.cmd("SetText", this.messageID, `Deleted ${elem}.`);
                return this.commands;
            } else {
                prevNode = node;
                node = node.next;
            }
        }

        this.cmd("SetText", this.messageID, `Deleting ${elem}: Element not found!`);
        return this.commands;
    }

    findElement(elem) {
        this.commands = [];
        this.cmd("SetText", this.messageID, `Finding ${elem}`);

        const hash = this.getHashCode(elem);
        const index = this.getStartIndex(hash);

        let node = this.tableCells[index];
        let found = false;
        while (node != null && !found) {
            this.cmd("SetHighlight", node.graphicID, 1);
            if (node.data === elem) {
                this.cmd("SetText", this.sndMessageID, `${node.data} = ${elem}`);
                found = true;
            } else {
                this.cmd("SetText", this.sndMessageID, `${node.data} != ${elem}`);
            }
            this.cmd("Step");
            this.cmd("SetHighlight", node.graphicID, 0);
            node = node.next;
        }
        this.cmd("SetText", this.sndMessageID, "");

        if (found) {
            this.cmd("SetText", this.messageID, `Found ${elem}.`);
        } else {
            this.cmd("SetText", this.messageID, `Finding ${elem}: Element not found!`);
        }
        return this.commands;
    }

    repositionList(index) {
        if (this.tableCells[index] == null) return;
        let length = 0;
        for (let node = this.tableCells[index]; node != null; node = node.next) length++;
        const nodeSpacing = Math.min(2 * this.getCellHeight(), this.getCellPosY(index) / (length + 1));
        const x = this.getCellPosX(index);
        let y = this.getCellPosY(index) - nodeSpacing;
        let node = this.tableCells[index];
        while (node != null) {
            this.cmd("Move", node.graphicID, x, y);
            node.x = x;
            node.y = y;
            y -= nodeSpacing;
            node = node.next;
        }
    }
};
