import { prepare } from "../Source/Prepare.js";
import { programToMSL } from "../Source/metal/MSL.js";
import { programToJSON } from "../Source/json/JSON.js";

let shouldRun = true;

function printUsage() {
    shouldRun = false;
    print("Usage: jsc -m Scripts/generate.js -- [json|msl] filename.whlsl");
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
    let program;
    let conversionFunction = _ => { return { error: "Unknown conversion type" }; };
    try {
        let outputType = arguments[0];
        if (outputType == "json")
            conversionFunction = programToJSON;
        else if (outputType == "msl")
            conversionFunction = programToMSL;
        const source = readFile(arguments[1]);
        program = prepare("/internal/test", 0, source);
    } catch (e) {
        print(e);
        quit();
    }
    const result = conversionFunction(program);
    print(JSON.stringify(result));
}
