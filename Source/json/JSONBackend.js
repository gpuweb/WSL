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
import { Visitor } from "../Visitor.js";

class Describer {

    describeFunc(func)
    {
        if (func.isCast) {
            let result = {
                name: func.name,
                cast: true,
            };
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
        this._declarations = [];
        this._funcNameMangler = new JSONNameMangler("F");
        this._typeUnifier = new JSONTypeUnifier();
        this._forwardTypeDecls = [];
        this._typeDefinitions = [];
        this._forwardFunctionDecls = [];
        this._functionDefintions = [];
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
        try {
            const src = this._compile();
            const mangledMap = {};
            for (let func of this._functionDefintions) {
                const key = func.func.name;
                const value = this._funcNameMangler.mangle(func.func);
                mangledMap[key] = value;
            }

            return new GeneratorResult(src, null, mangledMap, this._functionSources);
        } catch (e) {
            return new GeneratorResult(null, e, null, null);
        }
    }

    _compile()
    {
        let output = {
            language: "whlsl",
            entryPoints: [],
            functions: []
        };

        const entryPoints = this._findEntryPoints();
        for (let func of entryPoints) {
            output.entryPoints.push({ name: func.name, type: func.shaderType });
        }

        let describer = new Describer();
        const usedFunctions = this._findUsedFunctions();
        for (let func of usedFunctions) {
            output.functions.push(describer.describeFuncDef(func));
        }
        //
        // this._allTypeAttributes = new JSONTypeAttributesMap(usedFunctions, this._typeUnifier);
        // this._createTypeDecls();
        // this._createFunctionDecls(functionsToCompile);
        //
        // const addSection = (title, decls) => {
        //     outputStr += `#pragma mark - ${title}\n\n${decls.join("\n\n")}\n\n`;
        // };
        //
        // addSection("Forward type declarations", this._forwardTypeDecls);
        // addSection("Type definitions", this._typeDefinitions);
        // addSection("Forward function declarations", this._forwardFunctionDecls);
        // addSection("Function definitions", this._functionDefintions);
        //
        // if (!this._allowComments)
        //     outputStr = this._removeCommentsAndEmptyLines(outputStr);

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
                    usedFunctions.add(node.func);
                    node.func.visit(this);
                }
            }
        }
        const findFunctionsThatGetCalledVisitor = new FindFunctionsThatGetCalled();
        for (let entryPoint of entryPoints)
            entryPoint.visit(findFunctionsThatGetCalledVisitor);
        return Array.from(usedFunctions);
    }

    _createTypeDecls()
    {
        const typesThatNeedDeclaration = this._typeUnifier.typesThatNeedDeclaration();
        const typeDeclsInOrderInTypeDefOrder = this._sortTypeDefsAndForwardDeclarationsInTopologicalOrder(typesThatNeedDeclaration);
        for (let type of typeDeclsInOrderInTypeDefOrder) {
            if (type instanceof StructType)
                this._forwardTypeDecls.push(this._metalSourceForStructForwardDeclaration(type));
            else if (type instanceof ArrayRefType)
                this._forwardTypeDecls.push(this._metalSourceForArrayRefForwardDeclaration(type));
            else
                this._forwardTypeDecls.push(this._metalSourceForTypeDef(type));
        }

        const typeDeclsThatNeedDeclarationInOrder = this._sortTypeDeclarationsInTopologicalOrder(typesThatNeedDeclaration);
        for (let type of typeDeclsThatNeedDeclarationInOrder) {
            if (type instanceof StructType)
                this._typeDefinitions.push(this._metalSourceForStructDefinition(type));
            else if (type instanceof ArrayRefType)
                this._typeDefinitions.push(this._metalSourceForArrayRefDefinition(type));
        }
    }

    _createFunctionDecls(unifiedFunctionDefs)
    {
        for (let func of unifiedFunctionDefs) {
            this._forwardFunctionDecls.push(new JSONFunctionForwardDeclaration(this.program, this._funcNameMangler, func, this._typeUnifier, this._allTypeAttributes));
            this._functionDefintions.push(new JSONFunctionDefinition(this.program, this._funcNameMangler, func, this._typeUnifier, this._allTypeAttributes));
        }
    }

    _sortTypeDefsAndForwardDeclarationsInTopologicalOrder(typesToDeclare)
    {
        // All types are sorted in topological order in this method; every type needs a typedef.
        // We do not recurse into structs becasue this is *just* for forward declarations.
        const declarations = new Array();
        for (let type of typesToDeclare)
            declarations.push(type);

        let typeOrder = [];
        let visitedSet = new Set();
        const typeUnifier = this._typeUnifier;
        class TypeOrderer extends Visitor {
            _visitType(node, visitCallback)
            {
                const id = typeUnifier.uniqueTypeId(node);
                if (!visitedSet.has(id)) {
                    visitedSet.add(id);
                    visitCallback();
                    typeOrder.push(node);
                }
            }

            visitNativeType(node)
            {
                this._visitType(node, () => {});
            }

            visitEnumType(node)
            {
                node.baseType.visit(this);
            }

            visitArrayType(node)
            {
                this._visitType(node, () => super.visitArrayType(node));
            }

            visitVectorType(node)
            {
                this._visitType(node, () => {});
            }

            visitMatrixType(node)
            {
                this._visitType(node, () => {});
            }

            visitStructType(node)
            {
                // Don't need to recurse into elements for the forward declarations.
                this._visitType(node, () => {});
            }

            visitArrayRefType(node)
            {
                this._visitType(node, () => super.visitArrayRefType(node));
            }

            visitReferenceType(node)
            {
                this._visitType(node, () => super.visitReferenceType(node));
            }

            visitTypeRef(node)
            {
                super.visitTypeRef(node);
                node.type.visit(this);
            }
        }
        const typeOrderer = new TypeOrderer();
        for (let type of typesToDeclare)
            type.visit(typeOrderer);
        return typeOrder;
    }

    _sortTypeDeclarationsInTopologicalOrder(typesToDeclare)
    {
        const declarations = new Array();
        for (let type of typesToDeclare)
            declarations.push(type);

        let typeOrder = [];
        let visitedSet = new Set();
        const typeUnifier = this._typeUnifier;
        class TypeOrderer extends Visitor {
            _visitType(node, visitCallback)
            {
                const id = typeUnifier.uniqueTypeId(node);
                if (!visitedSet.has(id)) {
                    visitedSet.add(id);
                    visitCallback();
                    typeOrder.push(node);
                }
            }

            visitStructType(node)
            {
                this._visitType(node, () => super.visitStructType(node));
            }

            visitTypeRef(node)
            {
                super.visitTypeRef(node);
                node.type.visit(this);
            }

            visitArrayRefType(node)
            {
                this._visitType(node, () => super.visitArrayRefType(node));
            }

            visitReferenceType(node)
            {
                // We need an empty implementation to avoid recursion.
            }
        }
        const typeOrderer = new TypeOrderer();
        for (let type of typesToDeclare)
            type.visit(typeOrderer);

        const typeOrderMap = new Map();
        for (let i = 0; i < typeOrder.length; i++)
            typeOrderMap.set(typeOrder[i], i);

        return typeOrder;
    }

    // Also removes #pragma marks.
    _removeCommentsAndEmptyLines(src)
    {
        const singleLineCommentRegex = /(\/\/|#pragma)(.*?)($|\n)/;
        const lines = src.split('\n')
            .map(line => line.replace(singleLineCommentRegex, '').trimEnd())
            .filter(line => line.length > 0);
        return lines.join('\n');
    }

    _metalSourceForArrayRefDefinition(arrayRefType)
    {
        let src = `struct ${this._typeUnifier.uniqueTypeId(arrayRefType)} {\n`;
        const fakePtrType = new PtrType(arrayRefType.origin, arrayRefType.addressSpace, arrayRefType.elementType);
        src += `    ${this._typeUnifier.uniqueTypeId(fakePtrType)} ptr;\n`
        src += "    uint32_t length;\n";
        src += "};";
        return src;
    }

    _metalSourceForArrayRefForwardDeclaration(arrayRefType)
    {
        return `struct ${this._typeUnifier.uniqueTypeId(arrayRefType)};`;
    }

    _metalSourceForStructForwardDeclaration(structType)
    {
        return `struct ${this._typeUnifier.uniqueTypeId(structType)};`;
    }

    _metalSourceForStructDefinition(structType)
    {
        const structTypeAttributes = this._allTypeAttributes.attributesForType(structType);
        let src = `struct ${this._typeUnifier.uniqueTypeId(structType)} {\n`;

        for (let [fieldName, field] of structType.fieldMap) {
            const mangledFieldName = structTypeAttributes.mangledFieldName(fieldName);
            src += `    ${this._typeUnifier.uniqueTypeId(field.type)} ${mangledFieldName}`;

            const annotations = [];
            if (structTypeAttributes.isVertexAttribute)
                annotations.push(`attribute(${field._semantic._index})`);
            if (structTypeAttributes.isVertexOutputOrFragmentInput && field._semantic._name === "SV_Position")
                annotations.push("position");
            if (structTypeAttributes.isFragmentOutput && field._semantic._name == "SV_Target")
                annotations.push(`color(${field._semantic._extraArguments[0]})`);
            if (annotations.length)
                src += ` [[${annotations.join(", ")}]]`;
            src += `; // ${fieldName} (${field.type}) \n`;
        }

        src += "};";

        return src;
    }

    _metalSourceForTypeDef(node)
    {
        const name = this._typeUnifier.uniqueTypeId(node);
        if (node.isArray)
            return `typedef ${this._typeUnifier.uniqueTypeId(node.elementType)} ${name}[${node.numElementsValue}];`;
        else if (node.isPtr)
            return `typedef ${node.addressSpace} ${this._typeUnifier.uniqueTypeId(node.elementType)} (*${name});`;
        else {
            class NativeTypeNameVisitor extends Visitor {
                visitNativeType(node)
                {
                    // FIXME: Also add samplers and textures here.
                    const nativeTypeNameMap = {
                        "void": "void",
                        "bool": "bool",
                        "uchar": "uint8_t",
                        "ushort": "uint16_t",
                        "uint": "uint32_t",
                        "char": "int8_t",
                        "short": "int16_t",
                        "int": "int32_t",
                        "half": "half",
                        "float": "float",
                        "atomic_int": "atomic_int",
                        "atomic_uint": "atomic_uint"
                    };

                    return nativeTypeNameMap[node.name];
                }

                visitVectorType(node)
                {
                    // Vector type names work slightly differently to native type names.
                    const elementTypeNameMap = {
                        "bool": "bool",
                        "char": "char",
                        "uchar": "uchar",
                        "short": "short",
                        "ushort": "ushort",
                        "int": "int",
                        "uint": "uint",
                        "half": "half",
                        "float": "float"
                    };

                    const elementTypeName = elementTypeNameMap[node.elementType.name];
                    if (!elementTypeName)
                        throw new Error(`${node.elementType.name} is not a supported vector element type`);

                    return `${elementTypeName}${node.numElementsValue}`;
                }

                visitMatrixType(node)
                {
                    const elementTypeNameMap = {
                        "half": "half",
                        "float": "float"
                    };

                    const elementTypeName = elementTypeNameMap[node.elementType.name];
                    if (!elementTypeName)
                        throw new Error(`${node.elementType.name} is not a supported matrix element type`);

                    return `${elementTypeName}${node.numRowsValue}x${node.numColumnsValue}`;
                }
            }
            const nativeName = node.visit(new NativeTypeNameVisitor());
            if (!nativeName)
                throw new Error(`Native type name not found for ${node}`);
            return `typedef ${nativeName} ${name};`;
        }
    }
}

export { JSONBackend as default };
