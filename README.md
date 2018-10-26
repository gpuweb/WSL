# WHLSL

The *Web High-level Shading Language* provides a human-writable, safe programming language
for the WebGPU API.

## Goals

- Formally proven as safe for Web use e.g. the language forbids reading or writing to memory that shouldn't be accessible.
- C-like syntax that is similar to Microsoft's HLSL, and thus compatible with the majority of the world's existing shaders.
- Supports a restricted form of pointers.

## Examples

The Examples directory has some WHLSL sample code.

## Running the Tests

The WHSL source code is exposed as an ES6 Module.

To run the tests:

```bash
prompt> run-jsc --module-file=Source/Test.js
```

Or, load Source/Test.html in your browser (assuming your browser supports modules, which most modern browsers do).

## Generating Output

We currently support Metal Shading Language as an output format, as well as a debug mode (JSON).

```bash
prompt> run-jsc --module-file=Scripts/generate.js -- [json|msl] file.whlsl
```

Alternatively, for MSL load Source/metal/MSL.html in your browser.

