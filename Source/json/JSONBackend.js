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

import { JSONFunctionDefinition } from "./JSONFunctionDefinition.js";
import { JSONFunctionForwardDeclaration } from "./JSONFunctionForwardDeclaration.js";
import { JSONNameMangler } from "./JSONNameMangler.js";
import { JSONTypeAttributesMap } from "./JSONTypeAttributesMap.js";
import { JSONTypeUnifier } from "./JSONTypeUnifier.js";

import { ArrayRefType } from "../ArrayRefType.js";
import { CommaExpression } from "../CommaExpression.js";
import { FuncDef } from "../FuncDef.js";
import { FuncParameter } from "../FuncParameter.js";
import { GeneratorResult } from "../GeneratorResult.js";
import { PtrType } from "../PtrType.js";
import { Return } from "../Return.js";
import { StructType } from "../StructType.js";
import { VariableDecl } from "../VariableDecl.js";
import { VectorType } from "../VectorType.js";
import { Visitor } from "../Visitor.js";

class FunctionDescriber {

    describe(node)
    {
        if (!node || !('constructor' in node))
            throw new Error("Unknown type " + node + " in " + this.constructor.name);

        let describeFunc = this["describe" + node.constructor.name];

        if (!describeFunc)
            throw new Error("No describe function for " + node.constructor.name + " in " + this.constructor.name);

        return describeFunc.call(this, node);
    }

    describeFunc(func)
    {
        if (func.isCast) {
            let result = {
                name: func.name,
                cast: true,
                parameters: []
            };
            result.returnType = { name: func.name };
            for (let parameter of func.parameters) {
                result.parameters.push(this.describeFuncParameter(parameter));
            }
            return result;
        } else {
            let result = {
                name: func.name,
                parameters: [],
            };
            result.returnType = this.describeTypeRef(func.returnType);

            if (func.semantic)
                result.semantic = func.semantic;

            for (let parameter of func.parameters) {
                result.parameters.push(this.describeFuncParameter(parameter));
            }
            if (func.attributeBlock) {
                result.attributeBlock = [];
                for (let attribute of func.attributeBlock) {
                    result.attributeBlock.push("FIXME: attributeBlock");
                }
            }
            return result;
        }
    }

    describeFuncParameter(param)
    {
        let result = {
            name: param.name || "default function parameter"
        };
        result.type = this.describeTypeRef(param.type);
        if (param.semantic)
            result.semantic = param.semantic;
        return result;
    }

    describeFuncDef(def)
    {
        let result = this.describeFunc(def);
        result.body = this.describeBlock(def.body);
        return result;
    }

    describeNativeFunc(node)
    {
        return "NativeFunc";
    }

    describeBlock(block)
    {
        const describer = this;
        if (!block.statements) {
            return {
                type: "emptyBlock"
            };
        }
        return block.statements.map(statement => {
            return describer.describe(statement);
        });
    }

    describeCommaExpression(node)
    {
        let statements = [];
        for (let expression of node.list)
            statements.push(this.describe(expression));
        return {
            type: "comma",
            statements
        }
    }

    describeTypeRef(typeRef)
    {
        if (typeRef.name) {
            let result = {
                name: typeRef.name
            };
            if (typeRef.typeArguments.length > 0)
                result.typeArguments = typeRef.typeArguments.map(argument => argument.toString());
            return result;
        } else {
            return this.describe(typeRef.type);
        }
    }

    describeNativeType(node)
    {
        return "NativeType";
    }

    describeTypeDef(node)
    {
        return "TypeDef";
    }

    describeStructType(node)
    {
        return "StructType";
    }

    describeField(node)
    {
        return "Field";
    }

    describeEnumType(node)
    {
        return "EnumType";
    }

    describeEnumMember(node)
    {
        return "EnumMember";
    }

    describeEnumLiteral(node)
    {
        return "EnumLiteral";
    }

    describeElementalType(node)
    {
        return "ElementalType";
    }

    describeReferenceType(node)
    {
        return "ReferenceType";
    }

    describePtrType(node)
    {
        return {
            type: "pointerType",
            typeID: node.typeID,
            addressSpace: node.addressSpace,
            elementType: this.describe(node.elementType)
        };
    }

    describeArrayRefType(node)
    {
        return "ArrayRefType";
    }

    describeArrayType(node)
    {
        return "ArrayType";
    }

    describeVariableDecl(varDecl)
    {
        return {
            type: "variableDeclaration",
            variableType: varDecl.name
        };
    }

    describeAssignment(node)
    {
        return {
            type: "assignment",
            lhs: this.describe(node.lhs),
            rhs: this.describe(node.rhs),
            assignmentType: node.type.name
        };
    }

    describeReadModifyWriteExpression(node)
    {
        return "ReadModifyWriteExpression";
    }

    describeDereferenceExpression(node)
    {
        return {
            type: "dereference",
            to: this.describe(node.ptr)
        };
    }

    describeTernaryExpression(node)
    {
        return "TernaryExpression";
    }

    describeDotExpression(node)
    {
        return "DotExpression";
    }

    describeIndexExpression(node)
    {
        return "IndexExpression";
    }

    describeMakePtrExpression(node)
    {
        return {
            type: "addressOf",
            value: this.describe(node.lValue)
        }
    }

    describeMakeArrayRefExpression(node)
    {
        return "MakeArrayRefExpression";
    }

    describeConvertPtrToArrayRefExpression(node)
    {
        return "ConvertPtrToArrayRefExpression";
    }

    describeVariableRef(node)
    {
        if (!node.name && node.variable instanceof FuncParameter) {
            return {
                type: "variableReference",
                name: "default function parameter"
            };
        }
        return {
            type: "variableReference",
            name: node.name,
            // FIXME: I think this is just duplicating the VarDecl.
            // variable: this.describe(node.variable)
        }
    }

    describeIfStatement(node)
    {
        return "IfStatement";
    }

    describeWhileLoop(node)
    {
        return "WhileLoop";
    }

    describeDoWhileLoop(node)
    {
        return "DoWhileLoop";
    }

    describeForLoop(node)
    {
        return "ForLoop";
    }

    describeSwitchStatement(node)
    {
        return "SwitchStatement";
    }

    describeSwitchCase(node)
    {
        return "SwitchCase";
    }

    describeReturn(node)
    {
        let result = {
            type: "return"
        };

        if (node.value)
            result.value = this.describe(node.value);
        return result;
    }

    describeContinue(node)
    {
        return "Continue";
    }

    describeBreak(node)
    {
        return "Break";
    }

    describeTrapStatement(node)
    {
        return "TrapStatement";
    }

    describeGenericLiteral(node)
    {
        return {
            type: "literal",
            value: node.value,
            literalType: node.type._typeID
        };
    }

    describeGenericLiteralType(node)
    {
        return "GenericLiteralType";
    }

    describeNullLiteral(node)
    {
        return "NullLiteral";
    }

    describeBoolLiteral(node)
    {
        return "BoolLiteral";
    }

    describeNullType(node)
    {
        return "NullType";
    }

    describeCallExpression(call)
    {
        let result = {
            type: "call",
            name: call.name,
            arguments: [],
            resultType: this.describe(call.resultType)
        };
        for (let argument of call.argumentList) {
            result.arguments.push(this.describe(argument));
        }
        return result;
    }

    describeLogicalNot(node)
    {
        return "LogicalNot";
    }

    describeLogicalExpression(node)
    {
        return "LogicalExpression";
    }

    describeFunctionLikeBlock(node)
    {
        return "FunctionLikeBlock";
    }

    describeAnonymousVariable(node)
    {
        // FIXME: Use typeUnifier.
        return {
            type: "anonymousVariable",
            name: node.name,
            variableType: node.type._typeID
        }
    }

    describeIdentityExpression(node)
    {
        return {
            type: "identity",
            target: this.describe(node.target)
        };
    }

    describeVectorType(node)
    {
        return "VectorType";
    }

    describeMatrixType(node)
    {
        return "MatrixType";
    }

    describeFuncNumThreadsAttribute(node)
    {
        return "FuncNumThreadsAttribute";
    }

    describeBuiltInSemantic(node)
    {
        return "BuiltInSemantic";
    }

    describeResourceSemantic(node)
    {
        return "ResourceSemantic";
    }

    describeStageInOutSemantic(node)
    {
        return "StageInOutSemantic";
    }

    describeSpecializationConstantSemantic(node)
    {
        return "SpecializationConstantSemantic";
    }
}

export class JSONBackend {

    constructor(program)
    {
        this._program = program;
        this._typeUnifier = new JSONTypeUnifier();
    }

    get program()
    {
        return this._program;
    }

    get declarations()
    {
        return this._declarations;
    }

    get functionSources()
    {
        return this._functionSources;
    }

    compile()
    {
        const src = this._compile();
        return new GeneratorResult(src, null, null, this._functionSources);
    }

    _compile()
    {
        let output = {
            language: "whlsl",
            entryPoints: [],
            functions: [],
            types: [],
            literals: []
        };

        const entryPoints = this._findEntryPoints();
        entryPoints.forEach(entryPoint => {
            output.entryPoints.push({ name: entryPoint.name, type: entryPoint.shaderType });
        });

        const usedFunctions = this._findUsedFunctions();
        usedFunctions.forEach(func => {
            func.visit(this._typeUnifier);
            output.functions.push(this._describeUsedFunction(func));
        });

        let usedTypes = new JSONTypeAttributesMap(usedFunctions, this._typeUnifier);
        for (let [name, attrs] of usedTypes.types) {
            output.types.push(this._describeUsedType(name, attrs));
        }

        // Sort types into an order that will allow them to be declared.
        output.types.sort(this._typeComparison);

        // Find literals, since that's helpful for SPIR-V.
        class LiteralVisitor extends Visitor {
            constructor(output)
            {
                super();
                this._output = output;
            }
            visitGenericLiteral(node)
            {
                let value = node.value;
                let literalType = node.type._typeID;
                // Probably a literal used in a typedef, not in the code.
                if (!literalType)
                    return;
                for (let literal of this._output) {
                    if (literal.value == value && literal.literalType == literalType)
                        return;
                }
                this._output.push({
                    type: "literal",
                    value: node.value,
                    literalType: node.type._typeID
                });
            }
        };
        let literalVisitor = new LiteralVisitor(output.literals);
        usedFunctions.forEach(func => {
            func.visit(literalVisitor);
        });

        return output;
    }

    _findEntryPoints()
    {
        const entryPointFunctions = [];
        for (let [, instances] of this._program.functions) {
            for (let instance of instances) {
                if (instance.isEntryPoint)
                    entryPointFunctions.push(instance);
            }
        }
        return new Set(entryPointFunctions);
    }

    _findUsedFunctions()
    {
        const entryPoints = this._findEntryPoints();
        const usedFunctions = new Set(entryPoints);

        class FindFunctionsThatGetCalled extends Visitor {
            visitCallExpression(node)
            {
                super.visitCallExpression(node);
                if (node.func instanceof FuncDef) {
                    // FIXME: Maybe the CallExpression needs to be captured?
                    usedFunctions.add(node.func);
                    node.func.visit(this);
                }
            }
        }
        const findFunctionsThatGetCalledVisitor = new FindFunctionsThatGetCalled();
        entryPoints.forEach(entryPoint => {
            entryPoint.visit(findFunctionsThatGetCalledVisitor);
        });
        return Array.from(usedFunctions);
    }

    _describeUsedFunction(funcDef)
    {
        let describer = new FunctionDescriber();
        return describer.describeFuncDef(funcDef);
    }

    _describeUsedType(name, attributes)
    {
        class NativeTypeNameVisitor extends Visitor {
            visitTypeRef(node)
            {
                if (node.type)
                    return node.type.visit(this);
                return "";
            }

            visitNativeType(node)
            {
                return node.name;
            }

            visitVectorType(node)
            {
                return `${node.elementType.name}${node.numElementsValue}`;
            }

            visitMatrixType(node)
            {
                return `${node.elementType.name}${node.numRowsValue}x${node.numColumnsValue}`;
            }
        }

        let typeRef = attributes.type;
        let type = typeRef.type;
        if (type instanceof StructType) {
            return this._describeUsedStructType(name, attributes);
        } else if (type instanceof ArrayRefType)
            return "FIXME: Implement ArrayRefType";
        else {
            const uniqueName = this._typeUnifier.uniqueTypeId(typeRef);
            if (type && type.isArray)
                return `FIXME: Implement Array`;
            else if (type && type.isPtr)
                return this._describeUsedPtrType(name, type);
            else if (typeRef instanceof PtrType)
                return this._describeUsedPtrType(name, typeRef);
            else if (typeRef instanceof VectorType) {
                return {
                    name,
                    type: "vector",
                    shortName: typeRef.visit(new NativeTypeNameVisitor()),
                    elementType: this._typeUnifier.uniqueTypeId(typeRef.elementType),
                    length: typeRef.numElementsValue
                };
            } else {
                const nativeName = typeRef.visit(new NativeTypeNameVisitor());
                return { name, type: "native", definition: nativeName };
            }
        }
    }

    _describeUsedPtrType(name, ptrTypeRef)
    {
        return {
            name,
            type: "pointer",
            to: this._typeUnifier.uniqueTypeId(ptrTypeRef.elementType),
            addressSpace: ptrTypeRef.addressSpace
         };
    }

    _describeUsedStructType(name, structTypeAttributes)
    {
        let structType = structTypeAttributes.type;
        let struct = structType.type;
        let result = {
            name,
            type: "struct",
            fields: []
        };

        for (let [fieldName, field] of struct.fieldMap) {
            const uniqueName = this._typeUnifier.uniqueTypeId(field.type.type);
            let fieldData = { name: fieldName, type: uniqueName };

            const annotations = new StringMap();
            if (structTypeAttributes.isVertexAttribute)
                annotations.set("vertexAttribute", field._semantic._index);
            if (structTypeAttributes.isVertexOutputOrFragmentInput)
                annotations.set("vertexOutputOrFragmentInput", field._semantic._name);
            if (structTypeAttributes.isFragmentOutput)
                annotations.set("fragmentOutput", field._semantic._name);
            if (annotations.size)
                result.attributes = annotations.toJSON();

            // FIXME: Add semantics.

            result.fields.push(fieldData);
        }

        return result;
    }

    _typeComparison(a, b) {
        // FIXME: This isn't accurate enough. Structs may reference
        // other structs, etc. We need to look at the members and reference
        // types.
        if (a.type == "native")
            return -1;
        if (b.type == "native")
            return 1;
        if (a.type == "vector")
            return -1;
        if (b.type == "vector")
            return 1;
        if (a.type == "struct" && a.name != "global struct")
            return -1;
        if (b.type == "struct" && b.name != "global struct")
            return 1;
        if (a.name == "global struct")
            return -1;
        if (b.name == "global struct" && a.type == "pointer")
            return 1;
        return 0;
    }
}

class StringMap extends Map {
    toJSON()
    {
        let obj = Object.create(null);
        for (let [k,v] of this)
            obj[k] = v;
        return obj;
    }
}

export { JSONBackend as default };
