# Code generation

## JSON

```bash
prompt> jsc --module-file=Scripts/generate.js -- json file.whlsl
```

Or, load Source/json/JSON.html in your browser.

## Metal Shading Language

```bash
prompt> jsc --module-file=Scripts/generate.js -- msl file.whlsl
```

Or, load Source/metal/MSL.html in your browser.

## SPIR-V

The _simple_ shaders in Misc were generated using glslang:

```bash
prompt> glslangValidator -H -V -o simple-vert.spv simple.vert
prompt> glslangValidator -H -V -o simple-frag.spv simple.frag
prompt> glslangValidator -H -V -l -o simple.spv simple.vert simple.frag
```

The `simple.spv` file should contain both entry points, making the `-vert` and `-frag`
files redundant (but still useful for debugging). However, even with the `-l` flag,
it doesn't seem to be linking both into the output.

Then the disassembly output came from SPIRV-Tools:

```bash
prompt> spirv-dis -o simple-vert.txt simple-vert.spv
prompt> spirv-dis -o simple-frag.txt simple-frag.spv
prompt> spirv-dis -o simple.txt simple.spv
```

That gives us some hopefully valid SPIR-V to compare against.


### Tools

- [glslang](https://github.com/KhronosGroup/glslang) - for compiling a GLSL file into SPIR-V (useful to see what SPIR-V should look like)
- [SPIRV-Tools](https://github.com/KhronosGroup/SPIRV-Tools) - for validating and disassembling a SPIR-V file
- [SPIRV-Headers](https://github.com/KhronosGroup/SPIRV-Headers) - needed for the other tools
- [SPIRV-Cross](https://github.com/KhronosGroup/SPIRV-Cross) - if you want to translate the SPIR-V back into a human-reable format

