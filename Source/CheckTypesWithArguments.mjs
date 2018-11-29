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

import { Visitor } from "./Visitor.mjs";

export function checkTypesWithArguments(program)
{
    class TypeWithArgumentsChecker extends Visitor {
        visitTypeRef(node)
        {
            if ((node.name == "vector" && node.typeArguments.length != 2)
                || (node.name == "matrix" && node.typeArguments.length != 3)
                || (node.name == "Texture1D" && node.typeArguments.length != 1)
                || (node.name == "RWTexture1D" && node.typeArguments.length != 1)
                || (node.name == "Texture1DArray" && node.typeArguments.length != 1)
                || (node.name == "RWTexture1DArray" && node.typeArguments.length != 1)
                || (node.name == "Texture2D" && node.typeArguments.length != 1)
                || (node.name == "RWTexture2D" && node.typeArguments.length != 1)
                || (node.name == "Texture2DArray" && node.typeArguments.length != 1)
                || (node.name == "RWTexture2DArray" && node.typeArguments.length != 1)
                || (node.name == "Texture3D" && node.typeArguments.length != 1)
                || (node.name == "RWTexture3D" && node.typeArguments.length != 1)
                || (node.name == "TextureCube" && node.typeArguments.length != 1))
                throw new Error(`Builtin type ${node.name} should always have type arguments.`);
        }
    }
    program.visit(new TypeWithArgumentsChecker());
}

export { checkTypesWithArguments as default };
