import { prepare } from "../Source/Prepare.js";
import { programToMSL } from "../Source/metal/MSL.js";

function printUsage() {
    print("Usage: jsc -m Scripts/WHLSLtoMSL.js -- filename.whlsl");
    print("(Currently only works via JSC command line. Node support coming soon.)")
}

try {
    if (arguments.length != 1) {
        printUsage();
    } else {

        try {
            const source = readFile(arguments[0]);
            const program = prepare("/internal/test", 0, source);
            const result = programToMSL(program);

            print(result._metalShaderLanguageSource);
        } catch (e) {
            print(e);
        }
    }

} catch (e) {
    printUsage();
}
