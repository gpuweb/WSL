import { prepare } from "../Source/Prepare.js";
import { programToMSL } from "../Source/metal/MSL.js";
import { programToJSON } from "../Source/json/JSON.js";

function printUsage() {
    print("Usage: jsc -m Scripts/generate.js -- [json|msl] filename.whlsl");
    print("(Currently only works via JSC command line. Node support coming soon.)")
}

try {
    if (arguments.length != 2) {
        printUsage();
    } else {

        try {
            const outputType = arguments[0];
            let conversionFunction = _ => { return { error: "Unknown conversion type" };};
            if (outputType == "json")
                conversionFunction = programToJSON;
            else if (outputType == "msl")
                conversionFunction = programToMSL;
            const source = readFile(arguments[1]);
            const program = prepare("/internal/test", 0, source);
            const result = conversionFunction(program);
            print(JSON.stringify(result));
        } catch (e) {
            print(e);
        }
    }

} catch (e) {
    printUsage();
}
