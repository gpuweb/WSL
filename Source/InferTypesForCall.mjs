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

import { OverloadResolutionFailure } from "./OverloadResolutionFailure.mjs";
import { TypeOverloadResolutionFailure } from "./TypeOverloadResolutionFailure.mjs";
import { UnificationContext } from "./UnificationContext.mjs";

export function inferTypesForCall(func, argumentTypes, returnType)
{
    if (argumentTypes.length != func.parameters.length)
        return {failure: new OverloadResolutionFailure(func, "Wrong number of arguments (passed " + argumentTypes.length + ", require " + func.parameters.length + ")")};
    let unificationContext = new UnificationContext();

    for (let i = 0; i < argumentTypes.length; ++i) {
        if (!argumentTypes[i])
            throw new Error("Null argument type at i = " + i);
        if (!argumentTypes[i].unify(unificationContext, func.parameters[i].type))
            return {failure: new OverloadResolutionFailure(func, "Argument #" + (i + 1) + " " + (func.parameters[i].name ? "for parameter " + func.parameters[i].name + " " : "") + "does not match (passed " + argumentTypes[i] + ", require " + func.parameters[i].type + ")")};
    }
    if (returnType && !returnType.unify(unificationContext, func.returnType))
        return {failure: new OverloadResolutionFailure(func, "Return type " + func.returnType + " does not match " + returnType)};
    let verificationResult = unificationContext.verify();
    if (!verificationResult.result)
        return {failure: new OverloadResolutionFailure(func, verificationResult.reason)};

    return {func, unificationContext};
}

export function inferTypesForTypeArguments(type, typeArguments)
{
    if (typeArguments.length != type.typeArguments.length)
        return {failure: new TypeOverloadResolutionFailure(type, "Wrong number of arguments (passed " + typeArguments.length + ", require " + type.typeArguments.length + ")")};
    let unificationContext = new UnificationContext();

    for (let i = 0; i < typeArguments.length; ++i) {
        if (!typeArguments[i])
            throw new Error("Null type argument at i = " + i);
        if (!typeArguments[i].unify(unificationContext, type.typeArguments[i]))
            return {failure: new TypeOverloadResolutionFailure(type, "Argument #" + (i + 1) + " " + (type.typeArguments[i].name ? "for parameter " + type.typeArguments[i].name + " " : "") + "does not match (passed " + typeArguments[i] + ", require " + type.typeArguments[i].type + ")")};
    }
    let verificationResult = unificationContext.verify();
    if (!verificationResult.result)
        return {failure: new TypeOverloadResolutionFailure(type, verificationResult.reason)};

    return {type, unificationContext};
}

export { inferTypesForCall as default };
