import { prepare } from "../Source/Prepare.mjs";
import { programToMSL } from "../Source/metal/MSL.mjs";
import { programToJSON } from "../Source/json/JSON.mjs";
import { programDescriptionToSPIRVAssembly } from "../Source/spirv/SPIRV.mjs";

let shouldRun = true;

function printUsage() {
    shouldRun = false;
    print("Usage: jsc -m Scripts/generate.js -- [json|msl|spirv-ass] filename.whlsl");
    print("(Currently only works via JSC command line. Node support coming soon.)")
    try {
        quit();
    } catch (e) {}
}

try {
    if (arguments.length != 2)
        printUsage();
} catch (e) {
    printUsage();
}

if (shouldRun) {
    let result;
    try {
        let outputType = arguments[0];
        const filename = arguments[1];
        const inputIsJSON = filename.endsWith(".json");
        const source = readFile(filename);
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
        print(e);
        quit();
    }
    print(JSON.stringify(result));
}
