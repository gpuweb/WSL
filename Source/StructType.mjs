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

import { Type } from "./Type.mjs";
import { WTypeError } from "./WTypeError.mjs";

export default class StructType extends Type {
    constructor(origin, name)
    {
        super();
        this._origin = origin;
        this._name = name;
        this._fields = new Map();
    }

    add(field)
    {
        field.struct = this;
        if (this._fields.has(field.name))
            throw new WTypeError(field.origin.originString, "Duplicate field name: " + field.name);
        this._fields.set(field.name, field);
    }

    get name() { return this._name; }
    get origin() { return this._origin; }

    get fieldNames() { return this._fields.keys(); }
    fieldByName(name) { return this._fields.get(name); }
    get fields() { return this._fields.values(); }
    get fieldMap() { return this._fields; }
    get isPrimitive()
    {
        let result = true;
        for (let field of this.fields)
            result &= field.type.isPrimitive;
        return result;
    }

    populateDefaultValue(buffer, offset)
    {
        if (this.size == null)
            throw new Error("Struct does not have layout: " + this);
        for (let field of this.fields)
            field.type.populateDefaultValue(buffer, offset + field.offset);
    }

    toString()
    {
        return `struct ${this.name} { ${Array.from(this.fields).join("; ")}; }`;
    }
}
export { StructType };
