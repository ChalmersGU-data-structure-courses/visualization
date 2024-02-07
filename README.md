# Visualizations of data structures and algorithms

The best way to understand complex data structures is to see them in action. We've developed interactive animations for a
variety of data structures and algorithms. Our visualization tool is written in Javascript using the HTML5 canvas element,
and run in just about any modern browser – including iOS devices like the iPhone and iPad, and even the web browser in
the Kindle!  (The frame rate is low enough in the Kindle that the visualizations aren't terribly useful, but the tree-based
visualizations – BSTs and AVL Trees – seem to work well enough)

### Try the visualizations yourself

Please visit the published web pages if you want to try everything out for yourself:

- https://chalmersgu-data-structure-courses.github.io/visualization/

If you are interested in how the code works, you can continue reading.

### History

The code was originally developed by
[David Galles](http://www.cs.usfca.edu/galles), University of San Francisco,
in Java and then [ported to Javascript in 2011](https://www.cs.usfca.edu/~galles/visualization/).
Some updates were made by [Kostas Chatzikokolakis](https://github.com/chatziko),
and this current repository is maintained by [Peter Ljunglöf](https://github.com/heatherleaf), University of Gothenburg & Chalmers University of Technology.


## Visualization creation tutorial

A few notes / warnings:

- *Do not* try to look at the code to understand the algorithms.
  I (i.e., David Galles) have done one or two tricky things to get the visualizations
  to work property that rather obscure the algorithms themselves.
  Your favorte textbook, or even wikipedia, is a better bet for appropriate source code.

- Like all software projects, this one is a bit of a living thing – it started life as a Java project,
  was rewritten in ActionScript3 (that is, flash), and then ported to Javascript.
  It was also my (i.e., David's) opportunity to learn Flash and Javascript,
  so by the time I figured out the best way to do things, half of the software was already written.
  I've done some going back to clean stuff up, but there is still a quite a lot of ugliness.
  *Next time* all my code will be pretty:)

### Creating a new visualization

To create a new visualization, you need to create a Javascript file and an HTML file.
The HTML file can just be copied from the example template (i.e., the file [example.html](example.html)),
changing only one or two items (like the name of the Javascript file).

In the Javascript file, you will create a function (an object, really, but functions are objects in Javascript) that:

1. Creates any appropriate controls to control you visualization (inserting elements, deletig elements, etc).
2. Creates callbacks for these controls that implement the visualizations.
   The visualizations are implemented by sending an array of strings to the animation manager –
   the animation manager will then implement the animation, and handle all of the animation controls for you.
3. Listens for an undo event from the animation manager.  When an undo event is detected, roll back the last operation.

When you are ready your final visualization page will look something like this: 

- https://chalmersgu-data-structure-courses.github.io/visualization/example.html

### Using the Algorithm "class"

Creating the Javascript function is still farily complicated, even when using the rest of the library.

Many of the ugly details can be automated if your function "subclasses" the Algorithm function
(located in the file [AlgorithmLibrary/Algorithm.js](AlgorithmLibrary/Algorithm.js),
which is sort of a faux "class").
To get you started, there is a simple example data structure (a simple stack) in the file
[AlgorithmLibrary/ExampleAlgorithm.js](AlgorithmLibrary/ExampleAlgorithm.js),
which we will look into in detail below.

### Looking at various pieces of the file ExampleAlgorithm.js in turn

Copyright: The code is released under in a FreeBSD license.

https://github.com/ChalmersGU-data-structure-courses/visualization/blob/3a8f9ee03a1bcec3e571aab398a5eaef55b5a524/AlgorithmLibrary/ExampleAlgorithm.js#L1-L25

Next, the algorithm definition.  We are doing a sort of "faked" inheritance within Javascript.
We define our function, set the prototype of our function to the prototype of our superclass,
reset the constructor to be our own constructor, and then cache the superclass prototype,
for simulating a java-style "super" call.  Notice that to make inheritance work well on
counstructors, we don't do anything in the main constructor function other than call an init
function (that way we can have our init function call the init function of the superclass).
(Yes, this is a bit of a hack.)

*Note*: remember to replace all instances of `SimpleStack` with the name of your own data structure!

https://github.com/ChalmersGU-data-structure-courses/visualization/blob/bf8668b2b75bc20e40e3e62698137439f912253f/AlgorithmLibrary/ExampleAlgorithm.js#L37-L41

Next are some constants that are specific to the data structure.
We placed them in the function's namespace to avoid symbol clashes:

https://github.com/ChalmersGU-data-structure-courses/visualization/blob/bf8668b2b75bc20e40e3e62698137439f912253f/AlgorithmLibrary/ExampleAlgorithm.js#L47-L54

Next, we initialize our object. In general, we will need to do the following:

- Call the superclass constructor.
  Note the syntax, it's a little odd, but we are forcing Javascript into
  a tradtional object-oriented paradigm, so it will complain a little at us.

- Add necessary controls.

- Initialize our "Memory Manager".
  For the most part, we will use a very simple memory manager:
  the old Pascal-style "Never free" memory manager.
  Start the free list at 0, and then increment it every time you need a new piece of memory.

- Initialize any data structures we will be using.
  In the case of a simple stack, we keep track of two arrays and one variable:
    - an array that stores the objectIDs of the elements of the stack (stackID)
    - an array that stores the actual stack (stackValues)
    - a variable that points to the top of the stack

https://github.com/ChalmersGU-data-structure-courses/visualization/blob/bf8668b2b75bc20e40e3e62698137439f912253f/AlgorithmLibrary/ExampleAlgorithm.js#L68-L80

Next we have the function to add controls.
There are several helper functions to add controls.
See the file [AlgorithmLibrary/Algorithm.js](AlgorithmLibrary/Algorithm.js)
for more information on these helper functions.

In the simple stack example we need three controls: 
- a text input where the user can enter new values
- a button for pushing the new value onto the stack
- a button for popping the topmost value from the stack

https://github.com/ChalmersGU-data-structure-courses/visualization/blob/bf8668b2b75bc20e40e3e62698137439f912253f/AlgorithmLibrary/ExampleAlgorithm.js#L101-L142

We will need to "override" the reset method.
Whenever the animation manager wants to undo an operation:

- This reset method is called, which resets the state of your object to
  *exactly* how it was before any operations were performed.
- All of the operations up until the last one are replayed
  (though the animation information is thrown away).
- We end up in the same state that we were in right before the last operation was done.

In our simple stack, we have four variables - nextIndex, stackTop, stackID and stackValues.

https://github.com/ChalmersGU-data-structure-courses/visualization/blob/bf8668b2b75bc20e40e3e62698137439f912253f/AlgorithmLibrary/ExampleAlgorithm.js#L152-L164

Next up, the callbacks.  Note that we don't do any action directly on a callback: 
instead, we use the method `implementAction`, which takes a bound function (using 
the method `bind`) and a parameter, and then calls that function using that parameter.  
implementAction also saves a list of all actions that have been performed, 
so that undo will work nicely.

*Note*: Your callbacks should *not* do any work directly, but instead should go through
the implement action command. That way, undos are handled by ths system "behind the scenes".

https://github.com/ChalmersGU-data-structure-courses/visualization/blob/bf8668b2b75bc20e40e3e62698137439f912253f/AlgorithmLibrary/ExampleAlgorithm.js#L180-L199

Finally, we get to the actual meat of our visualization: the code that does the work.
The functions that are called by `implementAction` need to:

1. Create an array of strings that represent commands to give to the animation manager
2. Return this array of commands

We strongly recommend that you use the function `this.cmd`, which is a handy utility function
that appends commands onto the instance variable `this.commands`.

https://github.com/ChalmersGU-data-structure-courses/visualization/blob/bf8668b2b75bc20e40e3e62698137439f912253f/AlgorithmLibrary/ExampleAlgorithm.js#L215-L283

Now we're almost done!

The functions `disableUI` and `enableUI` are called by our superclass
when an animation is started resp. completed.

https://github.com/ChalmersGU-data-structure-courses/visualization/blob/bf8668b2b75bc20e40e3e62698137439f912253f/AlgorithmLibrary/ExampleAlgorithm.js#L293-L309

Finally there is a simple function `init` to start everything up,
it should be called from the webpage after it is loaded:

https://github.com/ChalmersGU-data-structure-courses/visualization/blob/bf8668b2b75bc20e40e3e62698137439f912253f/AlgorithmLibrary/ExampleAlgorithm.js#L316-L324


## Digging deeper: Animation commands

The commands that we give to the animation manager are a list (array) of strings.
Each string starts with the name of the command (case-insensitive) followed by a list of arguments,
separated by the token `<;>`.
The first argument of (almost) every command is the ID of the object you want to create or access.
So, the string to *move* element 37 to position (100, 120) would be:

```
Move<;>37<;>100<;>120
```

Commands can be separated into two groups:
Commands that create animated objects, and commands that manipulate previously created objects.

### Object creation and deletion commands

Object creation commands take as a first argument an integer representing the index of the object to create.
This integer must *not* be the same as another
object that is currently active in the system (though you can reuse numbers once the objects have been
deleted).  Like all commands, the creation commands have some required and some optional parameters.

- **CreateCircle**: objectID, label, [initial_x, initial_y]

    - *objectID*:  Non-negative integer that represents the ID of this object.  Must be different from any ID currently active.  Should be as small as posslbe for better performance.
    - *label*: the label that appears in the middle of the circle.  It may contain end of line (\n) characters, which allows you to place a multi-line label in the circle.  Labels are centered in circles.
    - *initial_x* (optional, defaults to 0): the initial x position of the circle.
    - *initial_y* (optional, defaults to 0): the initial u position of the circle.

- **CreateRectange**: objectID, label, width, height, [initial_x, initial_y, xJustify, yJustufy, backgroundColor, foregroundColor]

    - *objectID*:  Non-negative integer that represents the ID of this object.  Must be different from any ID currently active.  Should be as small as possible for better performance.
    - *label*: the label that appears in the middle of the rectangle.  It may contain end of line (\n) characters, which allows you to place a multi-line label in the rectangle.  Labels are centered in rectangles.
    - *width*:  The width of the rectangle, in pixels.
    - *height*: The height of the rectangle, in pixels.
    - *initial_x* (optional, defaults to 0): the initial x position of the rectangle.
    - *initial_y* (optional, defaults to 0): the initial u position of the rectangle.
    - *xJustify* (optional, defaults to "center"): One of "center", "left", "right" – If the rectangle is at location (x,y), does x stand for the left, center, or right of the rectangle.
    - *yJustify* (optional, defaults to "center"): One of "center", "top", "bottom" – If the rectangle is at location (x,y), does y stand for the top, center, or bottom of the rectangle.
    - *foregroundColor*:  The initial color of the foregorund of the rectangle, using string representations of HTML colors ("#FF0000" for red, "#00FF00" for green, and so on).  Defaults to black.
    - *backgroundColor*:  The initial color of the background of the rectangle, using HTML colors (#FF0000 for red, #00FF00 for green, and so on).  Defaults to white.


- **CreateHighlightCircle**: objectID, color, [initial_x, initial_y, radius] 

    A highlight circle is much like a standard circle, except that it has no label, and no background color, so that it does not obscure other objects like a circle does.

    - *objectID*:  Non-negative integer that represents the ID of this object.  Must be different from any ID currently active.  Should be as small as posslbe for better performance.
    - *color*:  The initial color of the circle, using HTML colors ("#FF0000" for red, "#00FF00" for green, and so on).
    - *initial_x* (optional, defaults to 0): the initial x position of the circle.
    - *initial_y* (optional, defaults to 0): the initial u position of the circle.
    - *radius* (optional, defaults to 20):  The radius of the circle.

- **CreateLabel**: objectID, label, [initial_x, initial_x, centered]

    - *objectID*:  Non-negative integer that represents the ID of this object.  Must be different from any ID currently active.  Should be as small as posslbe for better performance.
    - *label*: the text of the label.  It may contain end of line (\n) characters, which allows you to place a multi-line labels.
    - *initial_x* (optional, defaults to 0): the initial x position of the label.
    - *initial_y* (optional, defaults to 0): the initial y position of the label.
    - *centered* (optional, defaults to true): true or 1 if the label should be centered, false or 0 if it should not.

- **CreateLinkedList**: objectID, label, width, height, [initial_x, initial_y, linkPercent, verticalOrientation, linkPosEnd, numLabels]

    - *objectID*:  Non-negative integer that represents the ID of this object.  Must be different from any ID currently active.  Should be as small as posslbe for better performance.
    - *label*:  The label inside this linked list element (or the first label, if there are more than one).
    - *width*:  The width of the linked list element, in pixels.
    - *height*: The height of the linked list element, in pixels.
    - *initial_x* (optional, defaults to 0): the initial x position of the linked list element.
    - *initial_y* (optional, defaults to 0): the initial y position of the linked list element.
    - *linkPercent* (optional, defaults to 0.25): The percentage of the linked list element that the outgoing pointer takes up.
    - *verticalOrientation* (optional, defaults to true): Should the linked list element be vertial (true) or horizontal (false).
    - *linkPosEnd* (optional, defaults to false): Should the poiner appear at the bottom or left of the linked list element (true), or the top or right of the linked list element (false).
    - *numLabels* (optional, defaults to 1): The number of labels that the linked lists element can hold.  See the adjacency list implementation of a graph for an example of a linked list element with more than 1 label.

- **CreateBTreeNode**: objectID, widthPerLabel, height, numLabels, inital_x, initial_y, backgroundColor, foregroundColor

    Somewhat special-purpose animated object created for B-Trees.   Single rectangle containing any number of labels, with no dividing lines between the labels.  Edges can be attached between each label, and to the left of the leftmost label, and to the right of the rightmost label.  See the BTree and B+ Tree visualizations for examples.

    - *objectID*:  Non-negative integer that represents the ID of this object.  Must be different from any ID currently active.  Should be as small as posslbe for better performance.
    - *widthPerLabel*:  The width of the B-Tree node is the number of labels * the width per label.  Value is in pixels.
    - *height*:  Height of the B-Tree node in pixels.
    - *numLabels*:  The number of labels in the BTree node.
    - *initial_x*:  The initial x position of the B-Tree node.
    - *initial_y*:  The initial y position of the B-Tree node.
    - *backgroundColor*:  The initial color of the background of the rectangle, using HTML colors (#FF0000 for red, #00FF00 for green, and so on).
    - *backgroundColor*:  The initial color of the forground of the rectangle, using HTML colors (#FF0000 for red, #00FF00 for green, and so on).

- **Delete**: objectID

    - *objectID*:  The ID of the object to delete.  All edges incident on this object will be removed. (If the delete is undone, then all such edges will be restored).  Once an Animated Element has been deleted, its ID is free to be used again. Note that overly complicated ID management (which is really memory management, since IDs are just indicies into a "memory array" of active animated objects) is not necessarily recommended, since it can lead to some subtle bugs.

Note that creation of an object using an objectID that already is in use will throw an exception.
Deleting an ID that is not currently in use will also throw an exception.


### Object manipulation commands

- **Move**: objectID, toX, toY

    Move the object smoothly over the next step from the current position to the new position.

    - *objectID*:  The ID of the object to move.  The object must exists, or an exception will be thrown.
    - *toX*:  The new X location to move to.
    - *toY*:  The new Y location to move to.

- **SetPosition**: objectID, toX, toY

    Move the object immediately to the new position at the beginning of the next step.

    - *objectID*:  The ID of the object to move.  The object must exists, or an exception will be thrown.
    - *toX*:  The new X location to move to.
    - *toY*:  The new Y location to move to.

- **SetForegroundColor**: objectID, color

    Sets the foreground color (outline color and label color) of an object.  Note that if an object has several labels this will set the color of *all* labels.

    - *objectID*:  The ID of the object to modify.  The object must exists, or an exception will be thrown.
    - *color*:  New foreground color (string representing HTML color, like "#ff0000").

- **SetBackgroundColor**: objectID, color

    Sets the background color of current object.  Note that if an object has several labels this will set the color of an object.

    - *objectID*:  The ID of the object to modify.  The object must exist, or an exception will be thrown.
    - *color*:  New background color.

- **SetHighlight**: objectID, highlightVal

    Mark an object as either highlighted or unhighlighted, based on the value of highlightVal. Objects that are highlighted will pulse red.  Any object can be highlighted (thought labels are slightly harder to read when highlighted)  Note that if an object is left highlighted after an animation is ended, it will not pulse until the animation starts again.  Edges can be highlighted using the highlight edge command.

    - *objectID*:  The ID of the object to modify.  The object must exists, or an exception will be thrown.
    - *highlightVal*:  1 or true, turn on highlighting.  0 or false, turn off highlighting.

- **SetText**: objectID, newText, [textIndex]

    Sets the value of the label associated with the object (the printing withing a circle, for instance).

    - *objectID*:  The ID of the object to modify.  The object must exists, or an exception will be thrown.
    - *newText*: The new text of the label.
    - *textIndex* (optional, defaults to 0): Index of the text label to change.  Only used in objects that have more than one text label (B-Tree nodes, Linked List nodes).  If the object does not support multiple labels, this is ignored.

- **SetAlpha**: objectID

    Sets the alpha (transparency) of the object. 0 is completely transparent, 1 is completely opaque.  Works for all objects.

    - *objectID*:  The ID of the object to modify.  The object must exists, or an exception will be thrown.

- **SetHeight**: objectID, newHeight

    Sets the height (in pixels) of the object.

    - *objectID*:  The ID of the object to modify.  The object must exists, or an exception will be thrown.
    - *newHeight*:  The new height of the object.

- **SetWidth**: objectID, newWIdth

    Sets the width (in pixels) of the object.

    - *objectID*:  The ID of the object to modify.  The object must exists, or an exception will be thrown.
    - *newWidth*:  The new width of the object.

- **SetTextColor**: objectID, newColor, [textIndex]

    Sets the color of the label associated with the object.

    - *objectID*:  The ID of the object to modify.  The object must exists, or an exception will be thrown.
    - *newColor*:  The new color to set.  As with all colors, should be a html color string.
    - *textIndex* (optional, defaults to 0):  If the object contain multiple labels (such as a linked-list node, or a B-Tree node) determine which label to change the color of.  If the object only has one label, this parameter is ignored.

- **SetNull**: objectID, nullValue

    Currently only used for linked-list elements.  Should the area set aside for the pointer in the linked list object be drawn as a null pointer (slash through the field)?   This should probably be automated (draw the slash if and only if the node is not connected to anything), but for now this must be done manually.

    - *objectID*:  The ID of the object to modify.  The object must exists, or an exception will be thrown.
    - *nullValue*:  0 or false for do not draw the slash, 1 or true for draw the slash.

- **SetNumElements**: objectID, numElements

    Currently only used for B-Tree nodes.  Changes the number of labels stored in this B-tree node. Should probably be extended to at least Linked-list nodes.

    - *objectID*:  The ID of the object to modify.  The object must exists, or an exception will be thrown.
    - *numElements*:  integer, the number of elements this B-Tree node should have

- **AlignRight**: object1ID, object2ID

    Align object1 so that it is immediately to the right of object2.  Very handy for lining up labels (where you don't necessarily know the width of the label), but can be used with any two objects.

    - *object1ID*:  The ID of the object to move.  The object must exists, or an exception will be thrown.
    - *object2ID*:  The ID of the object used to align object1.  The object must exists, or an exception will be thrown.

- **AlignLeft**: object1ID, object2ID

    Align object1 so that it is immediately to the left of object2.  Very handy for lining up labels (where you don't necessarily know the width of the label), but can be used with any two objects.

    - *object1ID*:  The ID of the object to move.  The object must exists, or an exception will be thrown.
    - *object2ID*:  The ID of the object used to align object1.  The object must exists, or an exception will be thrown.

- **AlignTop**: object1ID, object2ID

    Align object1 so that it is immediately on top of of object2.  Very handy for lining up labels (where you don't necessarily know the width of the label), but can be used with any two objects.

    - *object1ID*:  The ID of the object to move.  The object must exists, or an exception will be thrown.
    - *object2ID*:  The ID of the object used to align object1.  The object must exists, or an exception will be thrown.

- **AlignBottom**: object1ID, object2ID

    Align object1 so that it is immediately below object2.  Very handy for lining up labels (where you don't necessarily know the width of the label), but can be used with any two objects.

    - *object1ID*:  The ID of the object to move.  The object must exists, or an exception will be thrown.
    - *object2ID*:  The ID of the object used to align object1.  The object must exists, or an exception will be thrown.


### Edge manipulation commands

Edges are manipulated by giving the two objects associated with the edge.  While edges
can be graphically directed or undirected, all edges under the hood have a direction,
which is the direction that they were given when the edge was created.   There can
only be *one* edge from any object to any other object (though there can be
an edge from object1 to object2, and a different edge from object2 to object1.)  Edges
are always referred to by two IDs - the objectID of the "from" object, followed by the
objectID of the "to" object.  Any object can be connected to any other object.

- **Connect**: fromID, toID, [linkColor, curve, directed, label, anchorPosition]

    - *fromID*:  The ID of the object at the tail of the new edge.
    - *toID*:  The ID of the object at the head of the new edge.
    - *linkColor* (optional, defaults to "#000000"): The color of the edge.
    - *linkColor* (optional, defaults to false): true for a diected edge, false for an undirected edge.
    - *curve* (optional, defaults to 0.0): The "curviness" of the edge.  0.0 is perfectly straight, positive values arc to the right, negative values arc to the left.
    - *directed* (optional, defaults to true):  True if the edge is directed, false if the edge is undirected.
    - *label* (optional, defaults to ""):  The label that appears along the edge (useful for things like edge costs in graphs).
    - *anchorPosition* (optional, defaults to 0): If the edge could have more than one attachment postion at the "from" node, (currently only used for B-Tree nodes, but could well be expanded to things like doubly-linked lists) the index of the attachment position to use. Ignored for animated objects that do not have multiple attachment positions.

- **Disconnect**: fromID, toID

    Removes an edge between two elements.  If there is no edge, then this operation is a no-op.

    - *fromID*: The ID of the "From" direction of the edge.
    - *toID*:  The ID of the "To" direction of the edge.

    Note that even "undirected" edges have a "from" and a "to" – determined by how the edge was created using the Connect command.

- **SetAlpha**: objectID

    Sets the alpha (transparency) of the object. 0 is completely transparent, 1 is completely opaque.

    - *objectID*:  The ID of the object to modify.  The object must exists, or an exception will be thrown.

- **SetEdgeHighlight**: fromID, toID, highlightVal

    Mark an edge as either highlighted or unhighlighted, based on the value of highlightVal. Edges that are highlighted will pulse red.

    - *fromID*: The ID of the "From" direction of the edge.
    - *toID*:  The ID of the "To" direction of the edge.
    - *higlightVal*:  0 or false, turn of higlighting.  1 or true, turn on highlighting.


### Special commands

- **Step**: *no parameters*

    The step command allows you to keep everything from happening at once.  The way that most animations will work is that you will create a group of objects, then do a step, then do some movements, then do a step, then do more movements, then do a step, and so on.  All commands that appear between adjacent steps will happen simultaneously.  Each step represents where the animation will pause when it is in single-step mode.


- **SetLayer**: objectID, newLayer

    Sets the layer of the object.  All objects default to layer 0, and the "shown" layer always defaults to 0.  You can change the layers of different objects, and then change the list of which layers are currently shown, to show or hide objects dynamically.  (This is often useful for allowing the user to show or hide information, or to alternate between different versions of a representation). An object will only appear if its layer is one of the layers listed to be shown.  An edge will only appear of each of the objects that it connect are to be shown.  While commands cannot be executed while an animation is running, the global set of visible layers can be changed while an animation is running

    - *objectID*:  The ID of the object to modify.  The object must exists, or an exception will be thrown.
    - *layer*:  The new layer for this object.  Each object must live in one and only one layer (though any combination of layers can be shown at any given time).


### Quirks and Advanced Techniques

#### Object Display Order

If two object overlap, which one is placed on top?  The animation system uses the following rules to determine draw order:

- All non-highlighted items are drawn *before* all highlighted items (so highlighted items will appear on top of non-highlighted items).
- All items with the same highlight state are drawn in order of their identifiers (so objects with larger identifiers will be drawn in front of objects with small identifiers).

This system is not terribly sophisticated, but it works well enough.  You just need to be sure that if you want object A to appear in front of object B, then object A has to have a higher object ID.  If a more sophisticated system is required, this may be modified in a future release.

