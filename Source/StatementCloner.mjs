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

import { BoolLiteral } from "./BoolLiteral.mjs";
import { EnumType } from "./EnumType.mjs";
import { FuncDef } from "./FuncDef.mjs";
import { FuncNumThreadsAttribute } from "./FuncNumThreadsAttribute.mjs";
import { NativeFunc } from "./NativeFunc.mjs";
import { NativeType } from "./NativeType.mjs";
import { Rewriter } from "./Rewriter.mjs";
import { StructType } from "./StructType.mjs";
import { TypeDef } from "./TypeDef.mjs";

export default class StatementCloner extends Rewriter {
    visitFuncDef(node)
    {
        let attributeBlock = null;
        if (node.attributeBlock)
            attributeBlock = node.attributeBlock.map(attribute => attribute.visit(this));
        let result = new FuncDef(
            node.origin, node.name,
            node.returnType.visit(this),
            node.parameters.map(parameter => parameter.visit(this)),
            node.body.visit(this),
            node.isCast, node.shaderType, attributeBlock);
        return result;
    }

    visitNativeFunc(node)
    {
        let result = new NativeFunc(
            node.origin, node.name,
            node.returnType.visit(this),
            node.parameters.map(parameter => parameter.visit(this)),
            node.isCast, node.stage);
        return result;
    }

    visitNativeType(node)
    {
        return new NativeType(node.origin, node.name, node.typeArguments.map(argument => argument.visit(this)));
    }

    visitTypeDef(node)
    {
        return new TypeDef(node.origin, node.name, node.type.visit(this));
    }

    visitStructType(node)
    {
        let result = new StructType(node.origin, node.name);
        for (let field of node.fields)
            result.add(field.visit(this));
        return result;
    }

    visitBoolLiteral(node)
    {
        return new BoolLiteral(node.origin, node.value);
    }

    visitEnumType(node)
    {
        let result = new EnumType(node.origin, node.name, node.baseType.visit(this));
        for (let member of node.members)
            result.add(member);
        return result;
    }

    visitFuncNumThreadsAttribute(node)
    {
        return new FuncNumThreadsAttribute(node.x, node.y, node.z);
    }
}

export { StatementCloner };
