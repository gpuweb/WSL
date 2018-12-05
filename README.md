# WHLSL

The *Web High-level Shading Language* provides a human-writable, safe programming language
for the WebGPU API.

## Goals

- Formally proven as safe for Web use e.g. the language forbids reading or writing to memory that shouldn't be accessible.
- C-like syntax that is similar to Microsoft's HLSL, and thus compatible with the majority of the world's existing shaders.
- Supports a restricted form of pointers.

## Examples

The Examples directory has some WHLSL sample code.

## Generating Output

We currently support Metal Shading Language as an output format, as well as a debug mode (JSON).

```bash
# Using JavaScriptCore
prompt> jsc -m Scripts/generate.mjs -- [json|msl|spirv-ass] file.whlsl

# Using Node JS
prompt> node --experimental-modules Scripts/generate.mjs [json|msl|spirv-ass] file.whlsl
```

You can get `jsc` by checking out and [building WebKit](https://webkit.org/getting-the-code/)
or, if you're using macOS, it can be found in `/System/Library/Frameworks/JavaScriptCore.framework/Resources/jsc`.

Alternatively, load Source/json/JSON.html, Source/metal/MSL.html or Source/spirv/SPIRV.html in your browser.

More details can be found in [Code Generation](CodeGeneration.md). Also, there are some [rough notes
on the specifics of translating WHLSL to SPIR-V](CodeGeneration-SPIRV.md).

## Running the Tests

The WHSL source code is exposed as an ES6 Module.

To run the tests:

```bash
# Using JavaScriptCore
prompt> jsc -m Source/Test.mjs

# Using Node JS
prompt> node --experimental-modules Source/Test.mjs
```

Or, load Source/Test.html in your browser (assuming your browser supports ES modules, which most modern browsers do).
