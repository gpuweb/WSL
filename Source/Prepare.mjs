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

import { Program } from "./Program.mjs";
import { StructLayoutBuilder } from "./StructLayoutBuilder.mjs";
import { allocateAtEntryPoints } from "./AllocateAtEntryPoints.mjs";
import { check } from "./Check.mjs";
import { checkLiteralTypes } from "./CheckLiteralTypes.mjs";
import { checkLoops } from "./CheckLoops.mjs";
import { checkNativeFuncStages } from "./CheckNativeFuncStages.mjs";
import { checkProgramWrapped } from "./CheckWrapped.mjs";
import { checkRecursion } from "./CheckRecursion.mjs";
import { checkRecursiveTypes } from "./CheckRecursiveTypes.mjs";
import { checkReturns } from "./CheckReturns.mjs";
import { checkTypesWithArguments } from "./CheckTypesWithArguments.mjs";
import { checkUnreachableCode } from "./CheckUnreachableCode.mjs";
import { cloneProgram } from "./CloneProgram.mjs";
import { createNameResolver, resolveNamesInTypes, resolveNamesInFunctions } from "./ResolveNames.mjs";
import { findHighZombies } from "./FindHighZombies.mjs";
import { foldConstexprs } from "./FoldConstexprs.mjs";
import { inline } from "./Inline.mjs";
import { layoutBuffers } from "./LayoutBuffers.mjs";
import { parse } from "./Parse.mjs";
import { programWithUnnecessaryThingsRemoved } from "./ProgramWithUnnecessaryThingsRemoved.mjs";
import { resolveProperties } from "./ResolveProperties.mjs";
import { resolveTypeDefsInFunctions, resolveTypeDefsInTypes } from "./ResolveTypeDefs.mjs";
import { standardLibrary } from "./StandardLibrary.mjs";
import { synthesizeArrayOperatorLength } from "./SynthesizeArrayOperatorLength.mjs";
import { synthesizeCopyConstructorOperator } from "./SynthesizeCopyConstructorOperator.mjs";
import { synthesizeDefaultConstructorOperator } from "./SynthesizeDefaultConstructorOperator.mjs";
import { synthesizeEnumFunctions } from "./SynthesizeEnumFunctions.mjs";
import { synthesizeStructAccessors } from "./SynthesizeStructAccessors.mjs";
import { checkDuplicateFunctions } from "./CheckDuplicateFunctions.mjs";

export let prepare = (() => {
    let standardProgram;
    return function(origin, lineNumberOffset, text, shouldInline = false) {
        if (!standardProgram) {
            standardProgram = new Program();
            let firstLineOfStandardLibrary = 28; // See StandardLibrary.js.
            parse(standardProgram, "/internal/stdlib", "native", firstLineOfStandardLibrary - 1, standardLibrary);
        }

        let program = cloneProgram(standardProgram);
        if (arguments.length) {
            parse(program, origin, "user", lineNumberOffset, text);
            program = programWithUnnecessaryThingsRemoved(program);
        }

        foldConstexprs(program);

        let nameResolver = createNameResolver(program);
        resolveNamesInTypes(program, nameResolver);
        resolveTypeDefsInTypes(program);
        checkRecursiveTypes(program);
        synthesizeStructAccessors(program);
        synthesizeEnumFunctions(program);
        synthesizeArrayOperatorLength(program);
        synthesizeCopyConstructorOperator(program);
        synthesizeDefaultConstructorOperator(program);
        resolveNamesInFunctions(program, nameResolver);
        resolveTypeDefsInFunctions(program);
        checkTypesWithArguments(program);
        checkDuplicateFunctions(program);

        check(program);
        checkLiteralTypes(program);
        resolveProperties(program);
        findHighZombies(program);
        checkLiteralTypes(program);
        checkProgramWrapped(program);
        checkReturns(program);
        checkUnreachableCode(program);
        checkLoops(program);
        checkRecursion(program);
        checkProgramWrapped(program);
        checkTypesWithArguments(program);
        findHighZombies(program);
        allocateAtEntryPoints(program);
        program.visit(new StructLayoutBuilder());
        layoutBuffers(program);
        checkNativeFuncStages(program);
        if (shouldInline)
            inline(program);
        return program;
    };
})();

export { prepare as default };
