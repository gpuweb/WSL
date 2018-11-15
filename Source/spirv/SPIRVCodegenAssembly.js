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

export function generateSPIRVAssembly(spirv, program, assembler)
{
    let currentId = assembler.largestId;
    let typeMap = new Map();
    let reverseTypeMap = new Map();
    let entryPoints = [];

    assembler.blankLine();

    // 1. All OpCapability instructions
    assembler.append(new spirv.ops.Capability(spirv.kinds.Capability.Shader));

    // 2. Optional OpExtension instructions
    // 3. Optional OpExtInstImport instructions

    // 4. The single required OpMemoryModel instruction
    assembler.append(new spirv.ops.MemoryModel(spirv.kinds.AddressingModel.Logical, spirv.kinds.MemoryModel.GLSL450));

    //
    // // 5. All entry point declarations
    // for (let entryPoint of entryPoints) {
    //     let executionModel;
    //     switch (entryPoint.shader.shaderType) {
    //     case "vertex":
    //         executionModel = spirv.kinds.ExecutionModel.Vertex;
    //         break;
    //     case "fragment":
    //         executionModel = spirv.kinds.ExecutionModel.Fragment;
    //         break;
    //     }
    //     let id = entryPoint.id;
    //     let name = entryPoint.shader.name;
    //     let interfaceIds = []
    //     for (let value of entryPoint.inputs)
    //         interfaceIds.push(value.id);
    //     for (let value of entryPoint.outputs)
    //         interfaceIds.push(value.id);
    //     assembler.append(new spirv.ops.EntryPoint(executionModel, id, name, ...interfaceIds));
    // }
    //
    // // 6. All execution mode declarations
    // for (let entryPoint of entryPoints) {
    //     let id = entryPoint.id;
    //     assembler.append(new spirv.ops.ExecutionMode(id, spirv.kinds.ExecutionMode.OriginLowerLeft));
    // }
    //
    // // 7. These debug instructions
    // // 8. All annotation instructions
    
    // typeMap.set(program.intrinsics.void, currentId++);
    // typeMap.set(program.intrinsics.uint32, currentId++);
    //
    
    // // FIXME: There are probably more annotations that are required than just location.
    // let locations = [];
    // for (let entryPoint of entryPoints) {
    //     switch (entryPoint.shader.shaderType) {
    //     case "vertex":
    //         for (let input of entryPoint.inputs) {
    //             assembler.append(new spirv.ops.Decorate(input.id, spirv.kinds.Decoration.Location, input.location));
    //             locations.push({ name: entryPoint.shader.name + "." + input.name, location: input.location });
    //         }
    //         break;
    //     case "fragment":
    //         for (let output of entryPoint.outputs) {
    //             assembler.append(new spirv.ops.Decorate(output.id, spirv.kinds.Decoration.Location, output.location));
    //             locations.push({ name: entryPoint.shader.name + "." + output.name, location: output.location });
    //         }
    //         break;
    //     }
    // }
    //
    // // 9. All type declarations, all constant instructions, and all global variable declarations
    // emitTypes(assembler);
    // let functionType = currentId++;
    // assembler.append(new spirv.ops.TypeFunction(functionType, typeMap.get(program.intrinsics.void)));
    // for (let constant of constants) {
    //     if (constant[1].type == program.intrinsics.bool) {
    //         if (constant[1].value[0])
    //             assembler.append(new spirv.ops.ConstantTrue(constant[1].id));
    //         else
    //             assembler.append(new spirv.ops.ConstantFalse(constant[1].id));
    //     } else
    //         assembler.append(new spirv.ops.Constant(constant[1].typeId, constant[1].id, ...constant[1].values));
    // }
    // for (let entryPoint of entryPoints) {
    //     for (let input of entryPoint.inputs)
    //         assembler.append(new spirv.ops.Variable(input.type, input.id, spirv.kinds.StorageClass.Input));
    //     for (let output of entryPoint.outputs)
    //         assembler.append(new spirv.ops.Variable(output.type, output.id, spirv.kinds.StorageClass.Output));
    // }
    //
    // // 10. All function declarations
    // // 11. All function definitions
    // for (let entryPoint of entryPoints) {
    //     assembler.append(new spirv.ops.Function(typeMap.get(program.intrinsics.void), entryPoint.id, [spirv.kinds.FunctionControl.None], functionType));
    //     assembler.append(new spirv.ops.FunctionEnd());
    // }
    //
    // return { file: assembler.result, locations: locations };
}

export { generateSPIRVAssembly as default };
