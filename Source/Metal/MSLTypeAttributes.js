/*
 * Copyright 2018 Apple Inc.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *    1. Redistributions of source code must retain the above copyright notice,
 *       this list of conditions and the following disclaimer.
 *
 *    2. Redistributions in binary form must reproduce the above copyright notice,
 *       this list of conditions and the following disclaimer in the documentation
 *       and/or other materials provided with the distribution.
 *
 *    3. Neither the name of the copyright holder nor the names of its
 *       contributors may be used to endorse or promote products derived from this
 *       software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { MSLNameMangler } from "./MSLNameMangler.js";

import { StructType } from "../StructType.js";

export class MSLTypeAttributes {

    constructor(type)
    {
        this._type = type;
        this._isVertexAttribute = false;
        this._isVertexOutputOrFragmentInput = false;
        this._isFragmentOutput = false;
        this._fieldMangler = new MSLNameMangler('field');

        if (type instanceof StructType) {
            for (let field of type.fields)
                this._fieldMangler.mangle(field.name)
        }
    }

    get type()
    {
        return this._type;
    }

    get isVertexAttribute()
    {
        return this._isVertexAttribute;
    }

    set isVertexAttribute(va)
    {
        this._isVertexAttribute = va;
    }

    get isVertexOutputOrFragmentInput()
    {
        return this._isVertexOutputOrFragmentInput;
    }

    set isVertexOutputOrFragmentInput(vo)
    {
        this._isVertexOutputOrFragmentInput = vo;
    }

    get isFragmentOutput()
    {
        return this._isFragmentOutput;
    }

    set isFragmentOutput(fo)
    {
        this._isFragmentOutput = fo;
    }

    get fieldMangler()
    {
        return this._fieldMangler;
    }

    mangledFieldName(fieldName)
    {
        return this.fieldMangler.mangle(fieldName);
    }
}

export { MSLTypeAttributes as default };