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
import { FuncDef } from "../FuncDef.js";
import { GeneratorResult } from "../GeneratorResult.js";
import { PtrType } from "../PtrType.js";
import { StructType } from "../StructType.js";
import { VectorType } from "../VectorType.js";
import { Visitor } from "../Visitor.js";

class FunctionDescriber {

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
                    print("FIXME: attributeBlock");
                }
            }
            return result;
        }
    }

    describeFuncParameter(param)
    {
        let result = {
            name: param.name
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
        print(`NativeFunc`);
    }

    describeBlock(block)
    {
        return block.statements.map(this.describeStatement);
    }

    describeStatement(statement)
    {
        return statement.toString();
    }

    describeCommaExpression(node)
    {
        print("CommaExpression");
    }

    describeTypeRef(typeRef)
    {
        let result = {
            name: typeRef.name
        };
        if (typeRef.typeArguments.length > 0)
            result.typeArguments = typeRef.typeArguments.map(argument => argument.toString());

        return result;
    }

    describeNativeType(node)
    {
        print("NativeType");
    }

    describeTypeDef(node)
    {
        print("TypeDef");
    }

    describeStructType(node)
    {
        print("StructType");
    }

    describeField(node)
    {
        print("Field");
    }

    describeEnumType(node)
    {
        print("EnumType");
    }

    describeEnumMember(node)
    {
        print("EnumMember");
    }

    describeEnumLiteral(node)
    {
        print("EnumLiteral");
    }

    describeElementalType(node)
    {
        print("ElementalType");
    }

    describeReferenceType(node)
    {
        print("ReferenceType");
    }

    describePtrType(node)
    {
        print("PtrType");
    }

    describeArrayRefType(node)
    {
        print("ArrayRefType");
    }

    describeArrayType(node)
    {
        print("ArrayType");
    }

    describeVariableDecl(node)
    {
        print("VariableDecl");
    }

    describeAssignment(node)
    {
        print("Assignment");
    }

    describeReadModifyWriteExpression(node)
    {
        print("ReadModifyWriteExpression");
    }

    describeDereferenceExpression(node)
    {
        print("DereferenceExpression");
    }

    describeTernaryExpression(node)
    {
        print("TernaryExpression");
    }

    describeDotExpression(node)
    {
        print("DotExpression");
    }

    describeIndexExpression(node)
    {
        print("IndexExpression");
    }

    describeMakePtrExpression(node)
    {
        print("MakePtrExpression");
    }

    describeMakeArrayRefExpression(node)
    {
        print("MakeArrayRefExpression");
    }

    describeConvertPtrToArrayRefExpression(node)
    {
        print("ConvertPtrToArrayRefExpression");
    }

    describeVariableRef(node)
    {
        print("VariableRef");
    }

    describeIfStatement(node)
    {
        print("IfStatement");
    }

    describeWhileLoop(node)
    {
        print("WhileLoop");
    }

    describeDoWhileLoop(node)
    {
        print("DoWhileLoop");
    }

    describeForLoop(node)
    {
        print("ForLoop");
    }

    describeSwitchStatement(node)
    {
        print("SwitchStatement");
    }

    describeSwitchCase(node)
    {
        print("SwitchCase");
    }

    describeReturn(node)
    {
        print("Return");
    }

    describeContinue(node)
    {
        print("Continue");
    }

    describeBreak(node)
    {
        print("Break");
    }

    describeTrapStatement(node)
    {
        print("TrapStatement");
    }

    describeGenericLiteral(node)
    {
        print("GenericLiteral");
    }

    describeGenericLiteralType(node)
    {
        print("GenericLiteralType");
    }

    describeNullLiteral(node)
    {
        print("NullLiteral");
    }

    describeBoolLiteral(node)
    {
        print("BoolLiteral");
    }

    describeNullType(node)
    {
        print("NullType");
    }

    describeCallExpression(node)
    {
        print("CallExpression");
    }

    describeLogicalNot(node)
    {
        print("LogicalNot");
    }

    describeLogicalExpression(node)
    {
        print("LogicalExpression");
    }

    describeFunctionLikeBlock(node)
    {
        print("FunctionLikeBlock");
    }

    describeAnonymousVariable(node)
    {
        print("AnonymousVariable");
    }

    describeIdentityExpression(node)
    {
        print("IdentityExpression");
    }

    describeVectorType(node)
    {
        print("VectorType");
    }

    describeMatrixType(node)
    {
        print("MatrixType");
    }

    describeFuncNumThreadsAttribute(node)
    {
        print("FuncNumThreadsAttribute");
    }

    describeBuiltInSemantic(node)
    {
        print("BuiltInSemantic");
    }

    describeResourceSemantic(node)
    {
        print("ResourceSemantic");
    }

    describeStageInOutSemantic(node)
    {
        print("StageInOutSemantic");
    }

    describeSpecializationConstantSemantic(node)
    {
        print("SpecializationConstantSemantic");
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
            types: []
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
