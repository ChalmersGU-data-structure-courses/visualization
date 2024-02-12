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
// THIS SOFTWARE IS PROVIDED BY David Galles ``AS IS'' AND ANY EXPRESS OR IMPLIED
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
// Initialization of the data structure
///////////////////////////////////////////////////////////////////////////////

// This is an example data structure, a simple stack.
// You can start from this when developing your own algorithm / data structure.

// Note: remember to replace all instances of SimpleStack with the name of your own data structure!

function SimpleStack(am)
{
    this.init(am);
}
SimpleStack.inheritFrom(Algorithm);


// Next are some constants that are specific to the data structure.
// We placed them in the function's namespace to avoid symbol clashes:

SimpleStack.FOREGROUND_COLOR = "#007700";
SimpleStack.BACKGROUND_COLOR = "#EEFFEE";

SimpleStack.ELEMENT_WIDTH = 30;
SimpleStack.ELEMENT_HEIGHT = 30;
SimpleStack.INSERT_X = 30;
SimpleStack.INSERT_Y = 30;
SimpleStack.STARTING_X = 30;
SimpleStack.STARTING_Y = 100;


// The constructor above did not do any actual work, this is instead done in the init function.
// That way constructors of subclasses can effectively call the constructors of their superclasses.
// For the init function in this simple example (the simple stack), we need to do very little work.
// We do not have to add any elements to the canvas at load time.

// All we need to do is set up our own internal data structures. 
// We keep track of two arrays and one variable:
//  - an array that stores the objectIDs of the elements of the stack (stackID)
//  - an array that stores the actual stack (stackValues)
//  - a variable that points to the top of the stack

SimpleStack.prototype.init = function(am)
{
    // Call the unit function of our "superclass", 
    // which adds a couple of listeners, and sets up the undo stack.
    SimpleStack.superclass.init.call(this, am);

    this.addControls();
    this.nextIndex = 0;  // Useful for memory management

    this.stackID = [];
    this.stackValues = [];
    this.stackTop = 0;
}


// Next up is the method to add algorithm controls and callbacks.
// The tricky bit here is that we can't do something like:
// 
//     this.popButton.onclick = this.popCallback;
// 
// to add our callbacks.  Why not?  
// This would pass in the proper function, but *not* the proper *context*.
// Essentially, it would be passing a pointer to the code of the function,
// without saving the "this" pointer.  So we need to bind the "this" pointer 
// to our function before we store it, like this:
// 
//     this.popButton.onclick = this.popCallback.bind(this);

// In the simple stack example we need three controls: 
//  - a text input where the user can enter new values
//  - a button for pushing the new value onto the stack
//  - a button for popping the topmost value from the stack

SimpleStack.prototype.addControls = function()
{
    // Here you add any necessary controls for your algorithm.
    // There are libraries that help with text entry, buttons, check boxes, dropdown menus.

    // The text input field:
    this.pushField = this.addControlToAlgorithmBar("Text", "", {
        maxlength: 4, // max number of characters allowed
        size: 4,      // size (width) of the text field
    });
    this.addReturnSubmit(
        this.pushField, 
        "ALPHANUM",   // only allow alphanumeric characters, and convert to uppercase
        this.pushCallback.bind(this)  // callback to make when return is pressed
    );

    // The button for pushing onto the stack:
    this.pushButton = this.addControlToAlgorithmBar("Button", "Push");
    this.pushButton.onclick = this.pushCallback.bind(this);
    
    // The button for popping from the stack:
    this.popButton = this.addControlToAlgorithmBar("Button", "Pop");
    this.popButton.onclick = this.popCallback.bind(this);

    // To add a checkbox:
    // this.myCheckbox = this.addCheckboxToAlgorithmBar("Checkbox Label");
    // this.myCheckbox.onclick = this.checkboxCallback.bind(this);

    // To add a dropdown menu:
    // this.mySelect = this.addSelectToAlgorithmBar(
    //     [ value1,    value2,    value3,   ...],
    //     ["Label 1", "Label 2", "Label 3", ...]
    // );
    // this.mySelect.onchange = this.selectCallback.bind(this);
}


// Next up is the reset method.
// All visualizations must implement the reset method.
// This method needs to restore *all* of our variables to 
// the state that they were in right after the call to init.

// In our case, we have four variables - nextIndex, stackTop, stackID and stackValues.

SimpleStack.prototype.reset = function()
{
    // Reset the (very simple) memory manager.
    // NOTE: If we had added a number of objects to the scene *before* any user input, 
    // then we would want to set this to the appropriate value based on
    // objects added to the scene before the first user input.
    this.nextIndex = 0;

    // Reset our data structure.
    this.stackID = [];
    this.stackValues = [];
    this.stackTop = 0;
}


///////////////////////////////////////////////////////////////////////////////
// Callbacks
///////////////////////////////////////////////////////////////////////////////

// Next up, the callbacks.  Note that we don't do any action directly on a callback: 
// instead, we use the method implementAction, which takes a bound function (using 
// the method bind) and a parameter, and then calls that function using that parameter.  
// implementAction also saves a list of all actions that have been performed, 
// so that undo will work nicely.

// Note: Your callbacks should *not* do any work directly, but instead should go through
// the implement action command. That way, undos are handled by ths system "behind the scenes".

SimpleStack.prototype.pushCallback = function()
{
    // Get value to insert from textfield (created in addControls above).
    // Also normalize it by parsing numbers and removing blanks.
    var pushedValue = this.normalizeNumber(this.pushField.value);

    // Only push the value if the text field is not empty.
    if (pushedValue !== "") {
       // Clear text field after operation.
       this.pushField.value = "";
       // Do the actual work. The function implementAction is defined in the Algorithm superclass.
       this.implementAction(this.push.bind(this), pushedValue);
    }
}

SimpleStack.prototype.popCallback = function()
{
    // Popping doesn't take any parameters, so we just call the pop function.
    this.implementAction(this.pop.bind(this), "");
}


///////////////////////////////////////////////////////////////////////////////
// Doing actual work
///////////////////////////////////////////////////////////////////////////////

// Finally, we get to the actual meat of our visualization: the code that does the work.
// The functions that are called by implementAction need to:
//
//   1. Create an array of strings that represent commands to give to the animation manager
//   2. Return this array of commands
//
// We strongly recommend that you use the function this.cmd, which is a handy utility function
// that appends commands onto the instance variable this.commands

SimpleStack.prototype.push = function(pushedValue)
{
    console.log("P", pushedValue)
    // Empty out our commands variable, so it isn't corrupted by previous actions.
    this.commands = [];

    // Get a new memory ID for the rectangle that we are going to create.
    var top = this.stackTop;
    this.stackID[top] = this.nextIndex++;

    // Create a rectangle that contains the pushed value.
    this.cmd("CreateRectangle", 
        this.stackID[top],
        pushedValue,
        SimpleStack.ELEMENT_WIDTH,
        SimpleStack.ELEMENT_HEIGHT,
        SimpleStack.INSERT_X,
        SimpleStack.INSERT_Y
    );
    // Set the colors of the rectangle.
    this.cmd("SetForegroundColor", this.stackID[top], SimpleStack.FOREGROUND_COLOR);
    this.cmd("SetBackgroundColor", this.stackID[top], SimpleStack.BACKGROUND_COLOR);
    // First animation step done.
    this.cmd("Step");

    // Calculate the coordinates of the rectangle.
    var nextXPos = SimpleStack.STARTING_X + top * SimpleStack.ELEMENT_WIDTH;
    var nextYPos = SimpleStack.STARTING_Y;
    // Move it to its correct location.
    this.cmd("Move", this.stackID[top], nextXPos, nextYPos);
    // Next animation step done.
    this.cmd("Step");

    // Increase the stack top counter.
    this.stackTop++;

    // Return the commands that were generated by the "cmd" calls:
    return this.commands;
}

SimpleStack.prototype.pop = function(unused)
{
    // Empty out our commands variable, so it isn't corrupted by previous actions.
    this.commands = [];

    // We can only pop values if the stack contains elements.
    if (this.stackTop > 0) {
        this.stackTop--;

        // First we move the rectangle to the "base" position.
        this.cmd("Move", this.stackID[this.stackTop], SimpleStack.INSERT_X, SimpleStack.INSERT_Y);
        this.cmd("Step");

        // Then we delete the rectangle.
        this.cmd("Delete", this.stackID[this.stackTop]);
        this.cmd("Step");

        // OPTIONAL:  
        // We can do a little better with memory leaks in our own memory manager by
        // reclaiming this memory.  It is recommened that you *NOT* do this unless
        // you really know what you are doing (memory management leads to tricky bugs!)
        // *and* you really need to (very long runnning visualizaitons, not common).
        // Because this is a stack, we can reclaim memory easily.
        // Most of the time, this is not the case, and can be dangerous.
        //
        // nextIndex = this.stackID[this.stackTop];
    }
    return this.commands;
}


////////////////////////////////////////////////////////////
// Finally, some boilerplate to get everything started.
////////////////////////////////////////////////////////////

var currentAlg;

// Script to start up your function, to be called from the webpage.
function init()
{
    var animManag = initCanvas();
    currentAlg = new SimpleStack(animManag);

}