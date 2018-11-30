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

export function log(msg) {
    if (console && console.log) {
        console.log(msg);
        return;
    }
    // JSC always provides a global print function.
    print(msg);
}

export let commandLineArgs = [];

try {
    // JSC command line provides a global "arguments" object.
    commandLineArgs = arguments;
} catch (e) {
    try {
        // Node provides process.argv.
        commandLineArgs = process.argv.slice(2);
    } catch (e) {
    }
}

export async function getFileContents(filename) {
    try {
        // JSC command line provides a global "readFile" function.
        return readFile(filename);
    } catch (e) {
        try {
            // Node provides process.argv.
            let fs = await import("fs");
            return fs.readFileSync(filename).toString("utf-8");
        } catch (e) {
            log(e);
            return "";
        }
    }
}

export function exitProcess() {
    try {
        // JSC command line provides a global "quit" function.
        quit();
    } catch (e) {
        try {
            // Node provides sys.exit.
            sys.exit();
        } catch (e) {
            // Do nothing and hope for the best.
        }
    }
}
export { log as default };
