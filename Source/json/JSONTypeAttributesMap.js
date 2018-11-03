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

import { JSONTypeAttributes } from "./JSONTypeAttributes.js";

import { Visitor } from "../Visitor.js";

export class JSONTypeAttributesMap {

    constructor(functionDefs, typeUnifier)
    {
        this._typeUnifier = typeUnifier;
        this._typeAttributeMap = new Map();

        for (let funcDef of functionDefs) {
            if (funcDef.shaderType == "vertex")
                this._visitVertexShader(funcDef);
            else if (funcDef.shaderType == "fragment")
                this._visitFragmentShader(funcDef);
            else
                this._visitFunction(funcDef);

            // FIXME: Support compute shaders.
        }

        typeUnifier.typesThatNeedDeclaration().forEach(type => {
            this.attributesForType(type);
        });
    }

    get types()
    {
        return this._typeAttributeMap;
    }

    attributesForType(type)
    {
        const key = this._typeUnifier.uniqueTypeId(type);
        let attrs = this._typeAttributeMap.get(key);
        if (!attrs)
            this._typeAttributeMap.set(key, attrs = new JSONTypeAttributes(type));
        return attrs;
    }

    _gatherVariables(funcDef)
    {
        const variables = new Set();
        class VarVisitor extends Visitor {
            visitVariableDecl(node)
            {
                variables.add(node);
            }
        }
        funcDef.visit(new VarVisitor());
        return variables;
    }

    _visitVertexShader(func)
    {
        this.attributesForType(func.returnType).isVertexOutputOrFragmentInput = true;
        for (let param of func.parameters)
            this.attributesForType(param.type).isVertexInput = true;
        for (let variable of this._gatherVariables(func))
            this.attributesForType(variable.type);
    }

    _visitFragmentShader(func)
    {
        this.attributesForType(func.returnType).isFragmentOutput = true;
        for (let param of func.parameters)
            this.attributesForType(param.type).isVertexOutputOrFragmentInput = true;
        for (let variable of this._gatherVariables(func))
            this.attributesForType(variable.type);
    }

    _visitFunction(func)
    {
        // FIXME: Should be a setter, like setAttributesForType.
        this.attributesForType(func.returnType);
        for (let param of func.parameters)
            this.attributesForType(param.type);
        for (let variable of this._gatherVariables(func))
            this.attributesForType(variable.type);
    }
}

export { JSONTypeAttributesMap as default };
