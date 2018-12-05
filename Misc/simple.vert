#version 450

// Input structures are flattened into structName_attributeName.

layout(location=0) in vec4 VertexInput_position;

// The position output of the vertex shader is the
// value of gl_PerVertex.gl_Position.

void main() {
    gl_Position = VertexInput_position;
}
