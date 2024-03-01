// Copyright 2016 David Galles, University of San Francisco. All rights reserved.
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
// WARRANTIES, INCLUDING, BUT NOT LIIBTED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
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


Algorithm.Tree.Radix = class RadixTree extends Algorithm.Tree.Trie {
    BACKGROUND_COLOR = this.TRUE_COLOR;
    NODE_SIZE = 60;
    HIGHLIGHT_CIRCLE_WIDTH = this.NODE_SIZE;


    constructor(am) {
        super();
        if (am) this.init(am);
    }

    findIndexDifference(s1, s2, id, wordIndex) {
        let index = 0;
        this.cmd("SetText", this.messageNextID, ["Comparing next letter in search term", "to next letter in prefix of current node"]);
        while (index < s1.length && index < s2.length) {
            this.cmd("SetHighlightIndex", this.messageExtraID, index);
            this.cmd("SetHighlightIndex", id, index);
            this.cmd("Step");
            this.cmd("SetHighlightIndex", this.messageExtraID, -1);
            this.cmd("SetHighlightIndex", id, -1);
            if (s1.charAt(index) !== s2.charAt(index)) break;
            index++;
        }
        return index;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Find a value in the tree

    doFind(node, value) {
        if (!node) {
            this.cmd("SetText", this.messageNextID, ["Empty tree found", "String not in the tree"]);
            this.cmd("Step");
            return null;
        }
        this.cmd("SetHighlight", node.graphicID, 1);
        const remain = node.value;
        const indexDifference = this.findIndexDifference(value, remain, node.graphicID, 0);
        if (indexDifference === remain.length) {
            this.cmd("SetText", this.messageNextID, "Reached the end of the prefix stored at this node");
            this.cmd("Step");
            if (value.length > indexDifference) {
                this.cmd("SetText", this.messageNextID, ["Recusively search remaining string", `in the '${value.charAt(indexDifference)}' child`]);
                this.cmd("Step");
                this.cmd("SetHighlight", node.graphicID, 0);
                this.cmd("SetText", this.messageExtraID, value.substring(indexDifference));
                const index = this.getIndex(value, indexDifference);
                const child = node.children[index];
                if (!child) {
                    this.cmd("SetText", this.messageNextID, [`Child '${value.charAt(indexDifference)}' does not exit.`, "String is not in the tree."]);
                    this.cmd("Step");
                    return null;
                }
                this.cmd("SetAlpha", this.highlightID, 1);
                this.cmd("SetPosition", this.highlightID, node.x, node.y);
                this.cmd("Step");
                this.cmd("Move", this.highlightID, child.x, child.y);
                this.cmd("Step");
                this.cmd("SetAlpha", this.highlightID, 0);
                return this.doFind(child, value.substring(indexDifference));
            }
            this.cmd("SetText", this.messageNextID, "Reached the end of the string. Check if current node is \"True\"");
            this.cmd("Step");
            const found = Boolean(node.isword);
            this.cmd("SetText", this.messageNextID, [
                "Reached the end of the string",
                `Current node is ${found}`,
                `Word ${found ? "is" : "is NOT"} in the tree`,
            ]);
            this.cmd("Step");
            this.cmd("SetHighlight", node.graphicID, 0);
            return found ? node : null;
        } else {
            this.cmd("SetText", this.messageNextID, ["Reached end of search string,", "Still characters remaining at node", "String not in tree"]);
            this.cmd("Step");
            this.cmd("SetText", this.messageNextID, "");
            this.cmd("SetHighlight", node.graphicID, 0);
            return null;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Delete a node from the tree

    cleanupAfterDelete(node) {
        const children = node.numChildren();
        if (children === 0 && !node.isword) {
            this.cmd("SetText", this.messageNextID, ["Deletion left us with a \"False\" leaf", "Removing false leaf"]);
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", node.graphicID, 0);
            if (node.parent) {
                const index = this.getParentIndex(node);
                this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
                this.removeTreeNode(node);
                node.parent.children[index] = null;
                this.cleanupAfterDelete(node.parent);
            } else {
                this.removeTreeNode(node);
                this.treeRoot = null;
            }
        } else if (children === 1 && !node.isword) {
            this.cmd("SetText", this.messageNextID, ["Deletion left us with a \"False\" node", "containing one child: Combining"]);
            this.cmd("SetHighlight", node.graphicID, 1);
            this.cmd("Step");
            this.cmd("SetHighlight", node.graphicID, 0);

            const child = node.getChildren()[0];
            child.value = node.value + child.value;
            this.cmd("SetText", child.graphicID, child.value);
            this.cmd("Disconnect", node.graphicID, child.graphicID);

            if (!node.parent) {
                child.parent = null;
                this.treeRoot = child;
            } else {
                const parIndex = this.getParentIndex(node);
                this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
                node.parent.children[parIndex] = child;
                child.parent = node.parent;
                this.cmd("Connect", node.parent.graphicID, child.graphicID, this.FOREGROUND_COLOR, 0, true, child.value.charAt(0));
            }
            this.removeTreeNode(node);
            this.resizeTree();
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Insert one or more values into the tree

    insertAction(...values) {
        this.commands = [];
        if (values.length > 1) {
            this.cmd("SetText", this.messageID, `Inserting ${values.length} words: ${values.join(", ")}`);
            this.cmd("Step");
        }
        for (const word of values) {
            this.cmd("SetText", this.messageID, "Inserting: ");
            this.cmd("SetText", this.messageExtraID, word);
            this.cmd("AlignRight", this.messageExtraID, this.messageID);
            this.cmd("Step");
            this.treeRoot = this.doInsert(word, this.treeRoot);
            this.resizeTree();
            this.cmd("SetText", this.messageID, "");
            this.cmd("SetText", this.messageExtraID, "");
            this.cmd("SetText", this.messageNextID, "");
        }
        return this.commands;
    }

    doInsert(s, rt, wordIndex = 0) {
        if (rt == null) {
            const nodeID = this.nextIndex++;
            rt = this.createTreeNode(nodeID, this.NEW_NODE_X, this.NEW_NODE_Y, s);
            rt.isword = true;
            this.cmd("SetText", this.messageNextID, `Reached an empty tree.  Creating a node containing ${s}`);
            this.cmd("Step");
            this.cmd("SetText", this.messageNextID, "");
            return rt;
        }
        this.cmd("SetHighlight", rt.graphicID, 1);
        const indexDifference = this.findIndexDifference(s, rt.value, rt.graphicID, wordIndex);
        if (indexDifference === rt.value.length) {
            this.cmd("SetText", this.messageNextID, "Reached the end of the prefix stored at this node");
            this.cmd("Step");
            if (s.length > indexDifference) {
                this.cmd("SetText", this.messageNextID, ["Recusively insert remaining string", `into the '${s.charAt(indexDifference)}' child`]);
                this.cmd("Step");
                this.cmd("SetHighlight", rt.graphicID, 0);
                this.cmd("SetText", this.messageExtraID, s.substring(indexDifference));
                const index = this.getIndex(s, indexDifference);
                let child = rt.children[index];
                if (!child) {
                    this.cmd("SetText", this.messageNextID, `Child '${s.charAt(indexDifference)}' does not exist, creating it`);
                    this.cmd("Step");
                } else {
                    this.cmd("SetAlpha", this.highlightID, 1);
                    this.cmd("SetPosition", this.highlightID, rt.x, rt.y);
                    this.cmd("Step");
                    this.cmd("Move", this.highlightID, child.x, child.y);
                    this.cmd("Step");
                    this.cmd("SetAlpha", this.highlightID, 0);
                }
                const connect = child == null;
                child = this.doInsert(s.substring(indexDifference), child, wordIndex + indexDifference);
                rt.children[index] = child;
                child.parent = rt;
                if (connect) {
                    this.cmd("Connect", rt.graphicID, child.graphicID, this.FOREGROUND_COLOR, 0, true, s.charAt(indexDifference));
                }
                return rt;
            }
            this.cmd("SetText", this.messageNextID, "Reached the end of the string.  Set Current node to \"True\"");
            this.cmd("Step");
            this.cmd("SetText", this.messageNextID, "");
            this.cmd("SetBackgroundColor", rt.graphicID, this.BACKGROUND_COLOR);
            this.cmd("Step");
            this.cmd("SetHighlight", rt.graphicID, 0);
            rt.isword = true;
            return rt;
        }

        const firstRemainder = rt.value.substring(0, indexDifference);
        const secondRemainder = rt.value.substring(indexDifference);
        this.cmd("SetText", this.messageNextID, ["Reached a mismatch in prefix.", "Create a new node with common prefix"]);
        const newNodeID = this.nextIndex++;
        const newNode = this.createTreeNode(newNodeID, this.NEW_NODE_X, this.NEW_NODE_Y, firstRemainder);
        this.cmd("Step");

        let index = this.getIndex(rt.value, indexDifference);
        newNode.parent = rt.parent;
        newNode.children[index] = rt;
        if (rt.parent) {
            this.cmd("Disconnect", rt.parent.graphicID, rt.graphicID);
            this.cmd("Connect", rt.parent.graphicID, newNode.graphicID, this.FOREGROUND_COLOR, 0, true, newNode.value.charAt(0));
            const childIndex = this.getIndex(newNode.value, 0);
            rt.parent.children[childIndex] = newNode;
            rt.parent = newNode;
        } else {
            this.treeRoot = newNode;
        }
        this.cmd("SetHighlight", rt.graphicID, 0);

        rt.parent = newNode;
        this.cmd("SetText", this.messageNextID, "Connect new node to the old, and reset prefix stored at previous node");
        this.cmd("Connect", newNode.graphicID, newNode.children[index].graphicID, this.FOREGROUND_COLOR, 0, true, rt.value.charAt(indexDifference));
        rt.value = secondRemainder;
        this.cmd("SetText", rt.graphicID, rt.value);
        this.cmd("Step");
        this.resizeTree();

        if (indexDifference === s.length) {
            newNode.isword = true;
            this.cmd("SetBackgroundColor", newNode.graphicID, this.BACKGROUND_COLOR);
        } else {
            this.cmd("SetBackgroundColor", newNode.graphicID, this.FALSE_COLOR);
            index = this.getIndex(s, indexDifference);
            this.cmd("SetText", this.messageExtraID, s.substring(indexDifference));
            newNode.children[index] = this.doInsert(s.substring(indexDifference), null, indexDifference + wordIndex);
            newNode.children[index].parent = newNode;
            this.cmd("Connect", newNode.graphicID, newNode.children[index].graphicID, this.FOREGROUND_COLOR, 0, true, s.charAt(indexDifference));
        }
        return newNode;
    }
};
