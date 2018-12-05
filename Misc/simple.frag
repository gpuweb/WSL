#version 450

layout(location=0) out vec4 FragmentOutput_color;

struct Global {
    float float4_param1;
    float float4_param2;
    float float4_param3;
    float float4_param4;
    vec4 float4_result;
};

void float4(inout Global g) {
    g.float4_result.x = g.float4_param1;
    g.float4_result.y = g.float4_param2;
    g.float4_result.z = g.float4_param3;
    g.float4_result.w = g.float4_param4;
}

void main() {
    Global g;
    g.float4_param1 = 1;
    g.float4_param2 = 0;
    g.float4_param3 = 0;
    g.float4_param4 = 1;
    float4(g);

    FragmentOutput_color = g.float4_result;
}
