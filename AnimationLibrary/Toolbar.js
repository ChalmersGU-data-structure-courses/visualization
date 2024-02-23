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
/* exported Toolbar */
///////////////////////////////////////////////////////////////////////////////


class Toolbar {
    constructor(toolbar) {
        if (typeof toolbar == "string") {
            toolbar = document.getElementById(toolbar);
        }
        this.toolbar = toolbar;
        toolbar.innerHTML = "";
        toolbar.classList.add("toolbar");
    }

    element(tag, attrs, ...children) {
        const element = document.createElement(tag);
        if (attrs) {
            for (const name in attrs) {
                element.setAttribute(name, attrs[name]);
            }
        }
        if (children) {
            element.append(...children);
        }
        return element;
    }

    input(type, value, attrs) {
        if (!attrs) attrs = {};
        attrs["type"] = type;
        attrs["value"] = value;
        return this.element("input", attrs);
    }

    add(element) {
        return this.toolbar.appendChild(element);
    }

    addBreak() {
        return this.add(this.element("span", {class: "break"}, " "));
    }

    addLabel(...content) {
        return this.add(this.element("span", {class: "label"}, ...content));
    }

    addInput(type, value, attrs) {
        return this.add(this.input(type, value, attrs));
    }

    addButton(text, attrs) {
        return this.add(this.element("button", attrs, text));
    }

    addCheckbox(label, attrs) {
        if (!attrs) attrs = {};
        if (!attrs.id) attrs.id = `${this.toolbar.id}-${this.toolbar.childElementCount}`;
        const checkbox = this.addInput("checkbox", label, attrs);
        this.add(this.element("label", {for: attrs.id}, label));
        return checkbox;
    }

    addRadio(label, group, attrs) {
        if (!attrs) attrs = {};
        if (!attrs.id) attrs.id = `${this.toolbar.id}-${this.toolbar.childElementCount}`;
        attrs.name = group;
        const radio = this.addInput("radio", label, attrs);
        this.add(this.element("label", {for: attrs.id}, label));
        return radio;
    }

    addRadioButtons(labels, group, attrs) {
        const radioList = [];
        for (const lbl of labels) {
            radioList.push(this.addRadio(lbl, group, attrs));
        }
        return radioList;
    }

    addSelect(values, labels, attrs) {
        const options = [];
        for (let i = 0; i < values.length; i++) {
            options.push(
                this.element("option", {value: values[i]}, labels ? labels[i] : values[i]),
            );
        }
        return this.add(this.element("select", attrs, ...options));
    }
}
