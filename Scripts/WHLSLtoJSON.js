import { prepare } from "../Source/Prepare.js";
import { programToJSON } from "../Source/json/JSON.js";

function printUsage() {
    print("Usage: jsc -m Scripts/WHLSLtoJSON.js -- filename.whlsl");
    print("(Currently only works via JSC command line. Node support coming soon.)")
}

try {
    if (arguments.length != 1) {
        printUsage();
    } else {

        try {
            const source = readFile(arguments[0]);
            const program = prepare("/internal/test", 0, source);
            const result = programToJSON(program);
            print(JSON.stringify(result));
        } catch (e) {
            print(e);
        }
    }

} catch (e) {
    printUsage();
}
