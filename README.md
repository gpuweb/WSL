# WHLSL

The *Web High-level Shading Language* provides a human-writable, safe programming language
for the WebGPU API.

## Goals

- Formally proven as safe for Web use e.g. the language forbids reading or writing to memory that shouldn't be accessible.
- C-like syntax that is similar to Microsoft's HLSL, and thus compatible with the majority of the world's existing shaders.
- Supports a restricted form of pointers.

## Implementation

The current implementation can be found in WebKit [Source Code](https://github.com/WebKit/webkit/tree/master/Source/WebCore/Modules/webgpu/WHLSL).

## Examples

The Examples directory has some WHLSL sample code.

## Building the spec

The specification is contained in Spec/, and in particular in Spec/source/index.rst

To build it requires the following:
- ott (https://www.cl.cam.ac.uk/~pes20/ott/)
- sphinx (http://www.sphinx-doc.org/en/master/)
- latex (and various latex packages)
- dvipng

All of the dependencies can be installed on Mac (assuming that XCode and MacPorts are installed) with the following commands:

```
sudo port install opam
opam init
opam install ott
sudo port install py-sphinx
sudo port install texlive-latex
sudo port install texlive-latex-extra
sudo port install dvipng
```

Actually building the document can be done by simply running make singlehtml in /Spec, and it can be seen by opening Spec/build/singlehtml/index.html
