import { log, commandLineArgs, getFileContents, exitProcess } from "../Source/misc/Helpers.mjs";
import { prepare } from "../Source/Prepare.mjs";
import { programToMSL } from "../Source/metal/MSL.mjs";
import { programToJSON } from "../Source/json/JSON.mjs";
import { programDescriptionToSPIRVAssembly } from "../Source/spirv/SPIRV.mjs";

let shouldRun = true;

function printUsage() {
    shouldRun = false;
    log("WebKit JSC Usage: jsc -m Scripts/generate.mjs -- [json|msl|spirv-ass] filename.whlsl");
    log("Node JS Usage: node --experimental-modules Scripts/generate.mjs [json|msl|spirv-ass] filename.whlsl");
    exitProcess();
}

if (commandLineArgs.length != 2)
    printUsage();

async function run() {
    if (shouldRun) {
        let result;
        try {
            let outputType = commandLineArgs[0];
            const filename = commandLineArgs[1];
            const inputIsJSON = filename.endsWith(".json");
            const source = await getFileContents(filename);
            if (outputType == "json" && inputIsJSON) {
                // I don't know why you'd do this :)
                result = JSON.parse(source);
            } else if (outputType == "json") {
                let program = prepare("/internal/test", 0, source);
                result = programToJSON(program);
            } else if (outputType == "msl" && inputIsJSON) {
                result = { error: "Can't yet convert from json to msl." };
            } else if (outputType == "msl") {
                let program = prepare("/internal/test", 0, source);
                result = programToMSL(program);
            } else if (outputType == "spirv-ass" && inputIsJSON) {
                result = programDescriptionToSPIRVAssembly(JSON.parse(source));
            } else {
                result = { error: `Unknown conversion type: ${outputType}` };
            }
        } catch (e) {
            log(e);
            exitProcess();
        }
        log(JSON.stringify(result));
    }
}

run();

