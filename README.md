# WHLSL

The *Web High-level Shading Language* provides a human-writable, safe programming language
for the WebGPU API.

## Goals

- Formally proven as safe for Web use e.g. the language forbids reading or writing to memory that shouldn't be accessible.
- C-like syntax that is similar to Microsoft's HLSL, and thus compatible with the majority of the world's existing shaders.
- Supports a restricted form of pointers.

## Running the Tests

The WHSL source code is exposed as an ES6 Module.

To run the tests:

```bash
prompt> cd Source
prompt> run-jsc --module-file=Test.js
```
Or, load Test.html in your browser (assuming it supports modules, which most modern browsers do).

## Coming Soon

- Translation of WHLSL source into Metal Shading Language and SPIR-V.


