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
/* exported Algorithm */
///////////////////////////////////////////////////////////////////////////////


class Algorithm {
    constructor(am) {
        if (am) this.init(am);
    }

    init(am) {
        this.animationManager = am;
        am.addListener("AnimationStarted", this, this.disableUI);
        am.addListener("AnimationEnded", this, this.enableUI);
        am.addListener("AnimationUndo", this, this.undo);
        am.addListener("CanvasSizeChanged", this, this.sizeChanged);

        this.actionHistory = [];
        this.recordAnimation = true;
        this.commands = [];
    }

    setCodeAlpha(code, newAlpha) {
        for (let i = 0; i < code.length; i++)
            for (let j = 0; j < code[i].length; j++) {
                this.cmd("SetAlpha", code[i][j], newAlpha);
            }
    }

    addCodeToCanvasBase(code, startX, startY, lineHeight, standardColor, layer = 0) {
        const codeID = new Array(code.length);

        for (let i = 0; i < code.length; i++) {
            codeID[i] = new Array(code[i].length);
            for (let j = 0; j < code[i].length; j++) {
                codeID[i][j] = this.nextIndex++;
                this.cmd("CreateLabel", codeID[i][j], code[i][j], startX, startY + i * lineHeight, 0);
                this.cmd("SetForegroundColor", codeID[i][j], standardColor);
                this.cmd("SetLayer", codeID[i][j], layer);
                if (j > 0) {
                    this.cmd("AlignRight", codeID[i][j], codeID[i][j - 1]);
                }
            }
        }
        return codeID;
    }

    getCanvasWidth() {
        return this.animationManager.canvas.width;
    }

    getCanvasHeight() {
        return this.animationManager.canvas.height;
    }

    sizeChanged() {
        // To be overriden in base class
    }

    implementAction(funct, ...args) {
        const nxt = [funct, args];
        this.actionHistory.push(nxt);
        const retVal = funct(...args);
        this.animationManager.StartNewAnimation(retVal);
    }

    compare(a, b) {
        if (isNaN(a) === isNaN(b)) {
            // a and b are (1) both numbers or (2) both non-numbers
            if (!isNaN(a)) {
                // a and b are both numbers
                a = Number(a);
                b = Number(b);
            }
            return a === b ? 0 : a < b ? -1 : 1;
        } else {
            // a and b are of different types
            // let's say that numbers are smaller than non-numbers
            return isNaN(a) ? 1 : -1;
        }
    }

    normalizeNumber(input) {
        input = input.trim();
        return input === "" || isNaN(input) ? input : Number(input);
    }

    disableUI(event) {
        this.animationManager.algorithmControlBar.toolbar.disabled = true;
    }

    enableUI(event) {
        this.animationManager.algorithmControlBar.toolbar.disabled = false;
    }

    addReturnSubmit(field, allowed, action) {
        allowed = (
            allowed === "int" ? "0-9" :
            allowed === "int+" ? "0-9 " :
            allowed === "float" ? "-.0-9" :
            allowed === "float+" ? "-.0-9 " :
            allowed === "ALPHA" ? "A-Z" :
            allowed === "ALPHA+" ? "A-Z " :
            allowed === "alpha" ? "a-zA-Z" :
            allowed === "alpha+" ? "a-zA-Z " :
            allowed === "ALPHANUM" ? "A-Z0-9" :
            allowed === "ALPHANUM+" ? "A-Z0-9 " :
            allowed === "alphanum" ? "a-zA-Z0-9" :
            allowed === "alphanum+" ? "a-zA-Z0-9 " :
            allowed
        );

        const regex = new RegExp(`[^${allowed}]`, "g");

        const transform = (
            allowed === allowed.toUpperCase() ? (s) => s.toUpperCase() :
            allowed === allowed.toLowerCase() ? (s) => s.toLowerCase() : (s) => s
        );

        // Idea taken from here: https://stackoverflow.com/a/14719818
        field.oninput = (event) => {
            let pos = field.selectionStart;
            let value = transform(field.value);
            if (regex.test(value)) {
                value = value.replace(regex, "");
                pos--;
            }
            field.value = value;
            field.setSelectionRange(pos, pos);
        };

        if (action) {
            field.onkeydown = (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    action();
                }
            };
        }
    }

    reset() {
        // To be overriden in base class
    }

    undo(event) {
        // Remove the last action (the one that we are going to undo)
        this.actionHistory.pop();
        // Clear out our data structure.
        // Be sure to implement reset in every AlgorithmAnimation subclass!
        this.reset();
        // Redo all actions from the beginning, throwing out the animation
        // commands (the animation manager will update the animation on its own).
        // Note that if you do something non-deterministic, you might cause problems!
        // Be sure if you do anything non-deterministic (that is, calls to a random
        // number generator) you clear out the undo stack here and in the animation manager.
        //
        // If this seems horribly inefficient -- it is! However, it seems to work well
        // in practice, and you get undo for free for all algorithms, which is a non-trivial gain.
        this.recordAnimation = false;
        for (const [funct, args] of this.actionHistory) {
            funct(...args);
        }
        this.recordAnimation = true;
    }

    clearHistory() {
        this.actionHistory = [];
    }

    // Helper method to create a command string from a bunch of arguments
    cmd(...args) {
        if (this.recordAnimation) {
            if (args[0].toUpperCase() === "SETTEXT") {
                if (args[2] instanceof Array) args[2] = args[2].join("\n");
            }
            this.commands.push(args);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // Algorithm bar methods

    addLabelToAlgorithmBar(...content) {
        return this.animationManager.algorithmControlBar.addLabel(...content);
    }

    addCheckboxToAlgorithmBar(label, attrs) {
        return this.animationManager.algorithmControlBar.addCheckbox(label, attrs);
    }

    addRadioButtonGroupToAlgorithmBar(buttonNames, groupName, attrs) {
        return this.animationManager.algorithmControlBar.addRadioButtons(buttonNames, groupName, attrs);
    }

    addSelectToAlgorithmBar(values, labels, attrs) {
        return this.animationManager.algorithmControlBar.addSelect(values, labels, attrs);
    }

    addButtonToAlgorithmBar(text, attrs) {
        return this.animationManager.algorithmControlBar.addButton(text, attrs);
    }

    addControlToAlgorithmBar(type, name, attrs) {
        return this.animationManager.algorithmControlBar.addInput(type, name, attrs);
    }

    addBreakToAlgorithmBar() {
        return this.animationManager.algorithmControlBar.addBreak();
    }
}
