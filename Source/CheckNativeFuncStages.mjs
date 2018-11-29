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

import { NativeFunc } from "./NativeFunc.mjs";
import { Visitor } from "./Visitor.mjs";
import { WTypeError } from "./WTypeError.mjs";

export function checkNativeFuncStages(program)
{
    class CheckNativeFuncStages extends Visitor {
        constructor(entryPoint) {
            super();
            this._entryPoint = entryPoint;
        }

        visitCallExpression(node)
        {
            if ((node.func instanceof NativeFunc) && node.func.stage && node.func.stage != this._entryPoint.shaderType)
                throw new WTypeError(node.origin, `Cannot call ${node.func.stage} function ${node.func.name} inside ${this._entryPoint.shadeType} entry point`);
            node.func.visit(this);
        }
    }
    for (let [, funcDefs] of program.functions) {
        for (let funcDef of funcDefs) {
            if (funcDef.isEntryPoint)
                funcDef.visit(new CheckNativeFuncStages(funcDef));
        }
    }
}

export { checkNativeFuncStages as default };
