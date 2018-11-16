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

class ProgramHelper {
    constructor(programDescription)
    {
        this._program = programDescription;
    }

    get types()
    {
        return this._program.source.types;
    }

    get entryPoints()
    {
        if (!this._entryPoints) {
            this._entryPoints = Array.from(this._program.source.entryPoints);
            for (let entryPoint of this._entryPoints) {
                let func = this._findFunctionNamed(entryPoint.name);
                entryPoint.func = func;
            }
        }
        return this._entryPoints;
    }

    _findFunctionNamed(name)
    {
        for (let func of this._program.source.functions) {
            if (func.name == name)
                return func;
        }
        return null;
    }
}

export function generateSPIRVAssembly(spirv, programDescription, assembler)
{
    let program = new ProgramHelper(programDescription);
    let currentId = assembler.largestId;
    let typeMap = new Map();
    let reverseTypeMap = new Map();

    // Collect all the types.
    typeMap.set("void", ++currentId);
    for (let type of program.types) {
        if (type.type == "native") {
            if (!typeMap.has(type.name))
                typeMap.set(type.name, ++currentId);
        }
    }

    // Give each entry point an identifier.
    for (let entryPoint of program.entryPoints) {
        entryPoint.id = ++currentId;
    }

    // 1. All OpCapability instructions
    assembler.blankLine();
    assembler.append(new spirv.ops.Capability(spirv.kinds.Capability.Shader));

    // 2. Optional OpExtension instructions
    // 3. Optional OpExtInstImport instructions

    // 4. The single required OpMemoryModel instruction
    assembler.append(new spirv.ops.MemoryModel(spirv.kinds.AddressingModel.Logical, spirv.kinds.MemoryModel.GLSL450));

    // 5. All entry point declarations
    for (let entryPoint of program.entryPoints) {
        let executionModel;
        switch (entryPoint.type) {
        case "vertex":
            executionModel = spirv.kinds.ExecutionModel.Vertex;
            break;
        case "fragment":
            executionModel = spirv.kinds.ExecutionModel.Fragment;
            break;
        }
        let interfaceIds = []
        // for (let value of entryPoint.inputs)
        //     interfaceIds.push(value.id);
        // for (let value of entryPoint.outputs)
        //     interfaceIds.push(value.id);
        assembler.append(new spirv.ops.EntryPoint(executionModel, entryPoint.id, entryPoint.name, ...interfaceIds));
    }

    // 6. All execution mode declarations
    for (let entryPoint of program.entryPoints) {
        assembler.append(new spirv.ops.ExecutionMode(entryPoint.id, spirv.kinds.ExecutionMode.OriginLowerLeft));
    }

    // 7. Optional debug instructions

    assembler.blankLine();
    assembler.comment("Debug information");
    assembler.append(new spirv.ops.Source(spirv.kinds.SourceLanguage.Unknown, 1));
    for (let entryPoint of program.entryPoints) {
        assembler.append(new spirv.ops.Name(entryPoint.id, entryPoint.name));
    }

    // 8. All annotation instructions

    // 9. All type declarations, all constant instructions, and all global variable declarations
    assembler.blankLine();
    assembler.comment("Types");
    for (let [typeName, id] of typeMap) {
        switch (typeName) {
        case "void":
            assembler.type(id, new spirv.ops.TypeVoid(id));
            break;
        case "float":
            assembler.type(id, new spirv.ops.TypeFloat(id, 32));
            break;
        }
    }


    // 10. All function declarations
    // 11. All function definitions
}

export { generateSPIRVAssembly as default };
