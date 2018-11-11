import { prepare } from "../Source/Prepare.js";

let p = prepare("/internal/test", 0, `
vertex float4 foo(uint x : SV_InstanceID) : SV_Position {
    return float4(float(x), float(x), float(x), float(x));
}
`);

print(JSON.stringify(p.dump()));
