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

function Algorithm(am)
{

}



Algorithm.prototype.setCodeAlpha = function(code, newAlpha)
{
   var i,j;
   for (i = 0; i < code.length; i++)
       for (j = 0; j < code[i].length; j++) {
          this.cmd("SetAlpha", code[i][j], newAlpha);
       }
}


Algorithm.prototype.addCodeToCanvasBase = function(code, start_x, start_y, line_height, standard_color, layer)
{
    layer = typeof layer !== 'undefined' ? layer : 0;
    var codeID = Array(code.length);
    var i, j;
    for (i = 0; i < code.length; i++) {
        codeID[i] = new Array(code[i].length);
        for (j = 0; j < code[i].length; j++) {
            codeID[i][j] = this.nextIndex++;
            this.cmd("CreateLabel", codeID[i][j], code[i][j], start_x, start_y + i * line_height, 0);
            this.cmd("SetForegroundColor", codeID[i][j], standard_color);
            this.cmd("SetLayer", codeID[i][j], layer);
            if (j > 0) {
                this.cmd("AlignRight", codeID[i][j], codeID[i][j-1]);
            }
        }
    }
    return codeID;
}


Algorithm.prototype.init = function(am)
{
    this.animationManager = am;
    am.addListener("AnimationStarted", this, this.disableUI);
    am.addListener("AnimationEnded", this, this.enableUI);
    am.addListener("AnimationUndo", this, this.undo);
    am.addListener("CanvasSizeChanged", this, this.sizeChanged);

    this.actionHistory = [];
    this.recordAnimation = true;
    this.commands = [];
}


Algorithm.prototype.getCanvasWidth = function()
{
    return this.animationManager.canvas.width;
}


Algorithm.prototype.getCanvasHeight = function()
{
    return this.animationManager.canvas.height;
}


// Overload in subclass
Algorithm.prototype.sizeChanged = function()
{

}


Algorithm.prototype.implementAction = function(funct, val)
{
    var nxt = [funct, val];
    this.actionHistory.push(nxt);
    var retVal = funct(val);
    this.animationManager.StartNewAnimation(retVal);
}


Algorithm.prototype.compare = function(a, b) {
    if (isNaN(a) == isNaN(b)) {
        // a and b are (1) both numbers or (2) both non-numbers
        if (!isNaN(a)) {
            // a and b are both numbers
            a = Number(a); 
            b = Number(b);
        }
        return a == b ? 0 : a < b ? -1 : 1;
    } else {
        // a and b are of different types
        // let's say that numbers are smaller than non-numbers
        return isNaN(a) ? 1 : -1;
    }
}


Algorithm.prototype.normalizeNumber = function(input)
{
    input = input.trim();
    return input == "" || isNaN(input) ? input : Number(input);
}


Algorithm.prototype.disableUI = function(event)
{
    this.animationManager.algorithmControlBar.toolbar.disabled = true;
}


Algorithm.prototype.enableUI = function(event)
{
    this.animationManager.algorithmControlBar.toolbar.disabled = false;
}


Algorithm.prototype.addReturnSubmit = function(field, allowed, action)
{
    allowed = (
        allowed == "int"      ? "0-9"       :
        allowed == "float"    ? "0-9.-"     :
        allowed == "alpha"    ? "a-zA-Z"    :
        allowed == "ALPHA"    ? "A-Z"       :
        allowed == "alphanum" ? "a-zA-Z0-9" :
        allowed == "ALPHANUM" ? "A-Z0-9"    :  allowed
    );

    var regex = new RegExp("[^" + allowed + "]", "g");

    var transform = (
        allowed == allowed.toUpperCase() ? (s) => s.toUpperCase() :
        allowed == allowed.toLowerCase() ? (s) => s.toLowerCase() : (s) => s
    );

    // Idea taken from here: https://stackoverflow.com/a/14719818
    field.oninput = (event) => {
        var pos = field.selectionStart;
        var value = transform(field.value);
        if (regex.test(value)) {
            value = value.replace(regex, "");
            pos--;
        }
        field.value = value;
        field.setSelectionRange(pos, pos);
    }

    if (action) {
        field.onkeydown = (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                action();
            }        
        }
    }
}


Algorithm.prototype.reset = function()
{
    // to be overriden in base class
    // (Throw exception here?)
}


Algorithm.prototype.undo = function(event)
{
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
    var len = this.actionHistory.length;
    this.recordAnimation = false;
    for (var i = 0; i < len; i++) {
        this.actionHistory[i][0](this.actionHistory[i][1]);
    }
    this.recordAnimation = true;
}


Algorithm.prototype.clearHistory = function()
{
    this.actionHistory = [];
}


// Helper method to create a command string from a bunch of arguments
Algorithm.prototype.cmd = function(...args)
{
    if (this.recordAnimation) {
        if (args[0].toUpperCase() == "SETTEXT" && args[1] == this.messageID && args[2]) {
            console.log(args[2]);
        }
        this.commands.push(args.join("<;>"));
    }
}


// Algorithm bar methods //////////////////

Algorithm.prototype.addLabelToAlgorithmBar = function(...content)
{
    return this.animationManager.algorithmControlBar.addLabel(...content);
}

Algorithm.prototype.addCheckboxToAlgorithmBar = function(label, attrs)
{
    return this.animationManager.algorithmControlBar.addCheckbox(label, attrs);
}

Algorithm.prototype.addRadioButtonGroupToAlgorithmBar = function(buttonNames, groupName, attrs)
{
    return this.animationManager.algorithmControlBar.addRadioButtons(buttonNames, groupName, attrs);
}

Algorithm.prototype.addSelectToAlgorithmBar = function(values, labels, attrs)
{
    return this.animationManager.algorithmControlBar.addSelect(values, labels, attrs);
}

Algorithm.prototype.addControlToAlgorithmBar = function(type, name, attrs)
{
    return this.animationManager.algorithmControlBar.addInput(type, name, attrs);
}

Algorithm.prototype.addBreakToAlgorithmBar = function() 
{
    return this.animationManager.algorithmControlBar.addBreak();
}

