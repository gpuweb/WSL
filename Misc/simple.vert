#version 450

layout(location=0) in vec4 position;
layout(location=1) in vec4 input_color;
layout(location=0) out vec4 output_color;

void main()
{
    gl_Position = position;
    output_color = input_color;
}
