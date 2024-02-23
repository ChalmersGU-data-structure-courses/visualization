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
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL David Galles OR
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


Algorithm.Geometric = class Geometric extends Algorithm {
    Matrix = class Matrix {
        constructor(contents, x, y) {
            this.data = contents;
            this.x = x;
            this.y = y;
        }

        transpose() {
            const newData = new Array(this.data[0].length);
            for (let i = 0; i < this.data[0].length; i++) {
                newData[i] = new Array(this.data.length);
            }
            for (let i = 0; i < this.data.length; i++) {
                for (let j = 0; j < this.data[i].length; j++) {
                    newData[j][i] = this.data[i][j];
                }
            }
            this.data = newData;
        }
    };

    // Multiply two (data only!) matrices (not complete matrix object with graphics, just the data
    multiply(lhs, rhs) {
        const resultMat = new Array(lhs.length);
        for (let i = 0; i < lhs.length; i++) {
            resultMat[i] = new Array(rhs[0].length);
        }
        for (let i = 0; i < lhs.length; i++) {
            for (let j = 0; j < rhs[0].length; j++) {
                let value = 0;
                for (let k = 0; k < rhs.length; k++) {
                    value = value + lhs[i][k] * rhs[k][j];
                }
                resultMat[i][j] = value;
            }
        }
        return resultMat;
    }

    // Add two (data only!) matrices (not complete matrix object with graphics, just the data)
    add(lhs, rhs) {
        const resultMat = new Array(lhs.length);
        for (let i = 0; i < lhs.length; i++) {
            resultMat[i] = new Array(lhs[i].length);
            for (let j = 0; j < lhs[i].length; j++) {
                resultMat[i][j] = lhs[i][j] + rhs[i][j];
            }
        }
        return resultMat;
    }

    toRadians(degrees) {
        return (degrees * 2 * Math.PI) / 360.0;
    }
};
