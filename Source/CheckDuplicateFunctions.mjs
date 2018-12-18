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

import { WTypeError } from "./WTypeError.mjs";
import { ReferenceType } from "./ReferenceType.mjs";

export function checkDuplicateFunctions(program)
{
    for (let [name, functions] of program.functions) {
        for (let i = 0; i < functions.length; ++i) {
            for (let j = i + 1; j < functions.length; ++j) {
                if (name == "operator cast") {
                    // Overload resolution incorporate the return type for casts
                    if (!functions[i].isCast || !functions[j].isCast)
                        throw new Error("Function disagrees with itself about whether or not it is a cast");
                    if (functions[i].parameters.length != functions[j].parameters.length)
                        continue;
                    let same = true;
                    if (!functions[i].returnType.equals(functions[j].returnType))
                        same = false;
                    else {
                        for (let k = 0; k < functions[i].parameters.length; ++k) {
                            if (!functions[i].parameters[k].type.equals(functions[j].parameters[k].type)) {
                                same = false;
                                break;
                            }
                        }
                    }
                    if (same)
                        throw new WTypeError(`Duplicate function detected: ${functions[i].toString()}`);
                } else {
                    if (functions[i].isCast || functions[j].isCast)
                        throw new Error("Function disagrees with itself about whether or not it is a cast");
                    if (functions[i].parameters.length != functions[j].parameters.length)
                        continue;
                    let same = true;
                    for (let k = 0; k < functions[i].parameters.length; ++k) {
                        if (!functions[i].parameters[k].type.equals(functions[j].parameters[k].type)) {
                            same = false;
                            break;
                        }
                    }
                    if (same)
                        throw new WTypeError(functions[i].origin.originString, `Duplicate function detected: ${functions[i].toString()}`);
                }
            }
        }

        if (name == "operator&[]") {
            for (let func of functions) {
                if (func.parameters.length == 2 && func.parameters[0].type.isArrayRef && func.parameters[1].type.equals(program.intrinsics.uint))
                    throw new WTypeError(func.origin.originString, "User-specified array reference anders are not supported");
            }
        } else if (name == "operator.length") {
            for (let func of functions) {
                if (func.parameters.length == 1 && (func.parameters[0].type.isArray || func.parameters[0].type.isArrayRef))
                    throw new WTypeError(func.origin.originString, "User-specified array or array reference length operators are not supported");
            }
        } else if (name == "operator==") {
            for (let func of functions) {
                if (func.parameters.length == 2
                    && (func.parameters[0].type instanceof ReferenceType)
                    && (func.parameters[1].type instanceof ReferenceType)
                    && func.parameters[0].type.equals(func.parameters[1].type))
                    throw new WTypeError(func.origin.originString, "User-specified reference equality operators are not supported");
            }
        }
    }
}

export { checkDuplicateFunctions as default };
