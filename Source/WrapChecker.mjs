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

export default class WrapChecker extends Visitor {
    constructor(node)
    {
        super();
        this._startNode = node;
    }

    visitVariableRef(node)
    {
    }

    visitTypeRef(node)
    {
    }

    _foundUnwrapped(node)
    {
        function originString(node)
        {
            let origin = node.origin;
            if (!origin)
                return "<null origin>";
            return origin.originString;
        }

        throw new Error("Found unwrapped " + node.constructor.name + " at " + originString(node) + ": " + node + "\nWhile visiting " + this._startNode.constructor.name + " at " + originString(this._startNode.origin) + ": " + this._startNode);
    }

    visitFuncParameter(node)
    {
        this._foundUnwrapped(node);
    }

    visitVariableDecl(node)
    {
        this._foundUnwrapped(node);
    }

    visitStructType(node)
    {
        this._foundUnwrapped(node);
    }

    visitNativeType(node)
    {
        this._foundUnwrapped(node);
    }

    // NOTE: This needs to be kept in sync with AutoWrapper.
}
export { WrapChecker };
