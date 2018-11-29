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

import { ArrayRefType } from "./ArrayRefType.mjs";
import { ArrayType } from "./ArrayType.mjs";
import { MakeArrayRefExpression } from "./MakeArrayRefExpression.mjs";
import { MakePtrExpression } from "./MakePtrExpression.mjs";
import { PtrType } from "./PtrType.mjs";
import { WTypeError } from "./WTypeError.mjs";

export function returnTypeFromAndOverload(type, origin)
{
    if (type instanceof PtrType)
        return type.elementType;

    throw new WTypeError(origin.originString, "By-pointer overload returned non-pointer type: " + this);
}

// Have to call these on the unifyNode.
export function argumentForAndOverload(type, origin, value)
{
    if (type instanceof ArrayRefType)
        return value;

    if (type instanceof ArrayType) {
        let result = new MakeArrayRefExpression(origin, value);
        result.numElements = type.numElements;
        return result;
    }

    if (type instanceof PtrType)
        throw new WTypeError(origin.originString, "Pointer subscript is not valid");

    return new MakePtrExpression(origin, value);
}

export function argumentTypeForAndOverload(type, origin)
{
    if (type instanceof ArrayRefType)
        return type;

    if (type instanceof ArrayType)
        return new ArrayRefType(origin, "thread", type.elementType);

    if (type instanceof PtrType)
        throw new WTypeError(origin.originString, "Pointer subscript is not valid");

    return new PtrType(origin, "thread", type);
}

export { returnTypeFromAndOverload as default };
