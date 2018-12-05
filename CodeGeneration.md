# Code generation

## JSON

Using JavaScriptCore:

```bash
prompt> jsc -m Scripts/generate.mjs -- json file.whlsl
```

Using Node JS:

```bash
prompt> node --experimental-modules Scripts/generate.mjs json file.whlsl
```

Or, load Source/json/JSON.html in your browser.

Note that the JSON output can be fed into the other generation types instead
of the `.whlsl` file, which makes things a *lot* faster (skips parsing and
validating the WHLSL).

## Metal Shading Language

Using JavaScriptCore:

```bash
prompt> jsc -m Scripts/generate.mjs -- msl file.whlsl
```

Using Node JS:

```bash
prompt> node --experimental-modules Scripts/generate.mjs msl file.whlsl
```

Or, load Source/metal/MSL.html in your browser.

## SPIR-V

Using JavaScriptCore:

```bash
prompt> jsc -m Scripts/generate.mjs -- spirv-ass file.whlsl
```

Using Node JS:

```bash
prompt> node --experimental-modules Scripts/generate.mjs spirv-ass file.whlsl
```

Or, load Source/spirv/SPIRV.html in your browser.

Also, there are some [rough notes
on the specifics of translating WHLSL to SPIR-V](CodeGeneration-SPIRV.md)
