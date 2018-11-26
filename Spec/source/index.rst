.. WHLSL documentation master file, created by
   sphinx-quickstart on Thu Jun  7 15:53:54 2018.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

WHLSL Specification
#################

General
=======
*This section is non-normative.*

A shader passes through a series of compilation steps, eventually ending up
represented as machine code for the specific device the user is running. Any
intermediate forms the source may take throughout this transformation are beyond
the scope of this specification.

. Note:: The WebGPU Shading Language is designed to target other high-level shading
   languages as compilation targets.

WHLSL shaders are used with the WebGPU API. Specific WebGPU API entry points to compile
and manipulate shaders are specified in the WebGPU specification, not this document.
This document describes which programs are well-formed; the exact form of error
reporting is not discussed in this specification.

WHLSL does not support extensions or optional behavior.

Terms in this document such as *must*, *must not*, *required*, *shall*, *shall not*,
*should*, *should not*, *recommended*, *may*, and *optional* in normative parts of
this document are to be interpreted as described in RFC 2119.

Basics
======

The WebGPU Shading Language is designed to be as portable as possible; therefore,
implementations must reject any shader which does not strictly adhere to this
specification. Optimizations must not be observable, and must not affect error reporting.
Implementations must not support functionality beyond the mandated parts of this
specification.

A shader is a compilation unit which includes type definitions and function definitions.

WHLSL is used to describe different types of shaders:

#. Vertex shaders
#. Fragment shaders
#. Compute shaders

Each shader type represents software which may execute on a specialized processor. Different
draw calls, different shader types, or different invocations of the same shader, may execute
on independent processors.

A WHLSL string passes through the following stages of processing before it is executed:

#. Tokenization
#. Parsing
#. Validation

Once a WHLSL string passes all the validation checks, it is then available to be used in a
draw call or dispatch call. A WHLSL string contains zero or more shaders, and each shader is
of a specific shader type. Compute shaders must only be used for dispatch calls, and vertex
and fragment shaders must only be used in draw calls.

Pipelines
=========

WebGPU includes two pipelines: the graphics pipeline and the compute pipeline.

Graphics Pipeline
-----------------

The WebGPU graphics pipeline includes five stages, two of which are programmable. The graphics
pipeline is invoked by WebGPU draw calls.

Input Assembler
"""""""""""""""

The first stage of the graphics pipeline is the input assembler. This stage is not programmable.
This stage may do a collection of many things, including collecting primitives, determining which
vertices are actually referenced in the draw call, extruding points/lines, expanding adjacency
information into adjacent triangles, and more. As this stage is not programmable, the exact
behavior of this stage is not observable. This stage is configured with the WebGPU API.

Vertex Shader
"""""""""""""

After the vertices relevant to a particular draw call have been determined, they are run through
the programmable vertex shader. A vertex shader is responsible for mapping a single input vertex
to a single output vertex. Multiple vertex shaders may run in parallel; two arbitrary vertices
may be mapped through the vertex shader concurrently or sequentially.

An input vertex may be any assortment of information, arranged into four forms:

#. Stage-in data. Each invocation of the vertex shader is associated with data from a particular
   index in a GPU buffer. The WebGPU API is responsible for describing the association between
   which invocation receives which index in which buffer. Stage-in data must only be of scalar,
   vector, or matrix type.

#. Resources. All invocations of the vertex shader may have access to one or more resources.
   All invocations share the same resource; therefore, data races may occur between read-write
   resources. Resources may be of type buffer, texture, or sampler.

#. Built-ins. Some information can be made available to the shader automatically (such as the
   vertex ID or the instance ID).

#. Specialization constants. These are scalar variables for which the WebGPU API specifies a value
   before the shader may be used.

Because vertex shaders may have write-access to resources, they are not "pure" in the functional
sense. The order of execution of multiple invocations of the vertex shader may be observable.
Execution of multiple invocations of the vertex shader may be multiplexed across multiple processing
units at the entire shader level or the instruction level (or any level in between). Therefore,
when using simple loads and stores, load tearing may occur, or any such artifacts. WHLSL authors must
take care to create shaders which are portable. See below for advice on how to accomplish this.

.. Note:: Specific GPU instructions are not within scope of this document; therefore, races may
   lead to surprising and interesting results.

An output vertex may be any assortment of information, arranged into two forms:

#. A position, in Clip Coordinates, represented by a float4. When a vertex shader emits a position
   in Clip Coordinates, the WebGPU runtime will divide this position by its "w" component, resulting
   in a position in Normalized Device Coordinates. In Normalized Device Coordinates, the "x" component
   represents horizontal distance across the screen (or other output medium), where -1 represents the
   left edge and 1 represents the right edge. Similarly, the "y" component represents the vertical
   distance between -1 and 1, and the "z" component represents depth, where -1 represents the minimum
   depth and 1 represents the maximum depth.

#. Other information, represented by a collection of scalar values, vector values, and matrix values.

Rasterizer
""""""""""

Once the relevant vertex shaders have been run, their positions have been emitted, and those positions
have been transformed into Normalized Device Coordinates, the rasterizer now interpolates the values
of the other information in the output vertex. For a particular primitive, the rasterizer iterates over
all fragments on the interior of the primitive, and computes the barycentric coordinate of that particular
fragment with respect to the vertices of the primitive. It then computes a weighted average of the other
vertex information using the barycentric coordinates as weights. This stage is not programmable.

Fragment Shader
"""""""""""""""

After the vertex output information has been interpolated across the face of each vertex, one invocation
of the fragment shader runs for each of these sets of interpolated values. A fragment shader is
responsible for mapping the interpolated result of the vertex shader into a single output fragment (which
is usually a color in the framebuffer, but may be other information such as geometry in a G-buffer or
lighting accumulation in a lighting buffer).

Similar to a vertex shader, a fragment shader input may be any assortment of information, arranged into
four forms:

#. Interpolated output from the vertex shader. These variables are matched to vertex shader variables
   using the routine described below.

#. Resources. All invocations of the fragment shader may have access to one or more resources.
   All invocations share the same resource; therefore, data races may occur between read-write
   resources. Resources may be of type buffer, texture, or sampler.

#. Built-ins. Some information can be made available to the shader automatically (such as the
   sample ID or the primitive ID).

#. Specialization constants. These are scalar variables for which the WebGPU API specifies a value
   before the shader may be used.

Because vertex shaders may have write-access to resources, they are not "pure" in the functional
sense. The order of execution of multiple invocations of the vertex shader may be observable.
Execution of multiple invocations of the vertex shader may be multiplexed across multiple processing
units at the entire shader level or the instruction level (or any level in between). Therefore,
WHLSL authors must take care to create shaders which are portable. See below for advice on how to
accomplish this.

.. Note:: Specific GPU instructions are not within scope of this document; therefore, races may
   lead to surprising and interesting results.

Because each invocation of the fragment shader is associated with a particuluar fragment with respect
to the geometry of the primitive being drawn, the fragment shader can output into a particular region
into zero or more attachments of the framebuffer. The fragment shader does not choose which region
of the framebuffer its results get outputted into; instead, the fragment shader only gets to choose
which values get outputted into that region.

The destination region of the framebuffer may be a pixel on the screen (if the framebuffer is attached
to a canvas element). It may also be a texel in a texture, or a particular sample or set of samples in
a multisampled texture.

The type of this output data must match the type of the framebuffer attachments being written into.
See below for a rigorous definition of "match."

Output Merger
"""""""""""""

Once the fragment shader outputs a particular value for a fragment, that value must be merged with
whatever value the fragment already happens to hold. For example, the new color may be linearly
blended with the existing framebuffer contents (possibly using the "w" channel of the new color to
determine the weights).

The output merger for a particular fragment is guaranteed to occur in API submission order for all
primitives that overlap that particular fragment.

.. Note:: This is in contrast to the fragment shader stage of the pipeline, which has no such
   guarantee.

Compute pipeline
----------------

The compute pipeline only has a single stage, and is invoked by WebGPU dispatch calls. The compute
pipeline and the graphics pipeline are thus mutually exclusive; a single WebGPU call will invoke
either the graphics pipeline or the compute pipeline, but not both.

Compute shader invocations are arranged into a two-level hierarchy: invocations are grouped into
blocks, and blocks are grouped into a single grid. Multiple invocations that share a block share
threadgroup variables for both reading and writing.

The WebGPU API describes how many invocations of the compute shader to invoke, as well as how big
the blocks should be within the grid.

The input to a compute shader may be any assortment of information, arranged into three forms:

#. Resources. All invocations of the compute shader may have access to one or more resources.
   All invocations share the same resource; therefore, data races may occur between read-write
   resources. Resources may be of type buffer, texture, or sampler.

#. Built-ins. Some information can be made available to the shader automatically (such as the
   invocation ID within the block or the block ID within the grid).

#. Specialization constants. These are scalar variables for which the WebGPU API specifies a value
   before the shader may be used.

Entry Points
------------

All functions in WHLSL are either "entry points" or "non-entry points." An entry point is a function
that may be associated with a particular programmable stage in a pipeline. Entry points may call
non-entry points, non-entry points may call non-entry points, but entry points may not be called
by any WHLSL function. When execution of a particular shader stage begins, the entry point associated
with that shader stage begins, and when that entry point returns, the associated shader stage ends.

Exactly one WHLSL shader occupies one stage in the WebGPU pipeline at a time. Two shaders
of the same shader type must not be used together in the same draw call or dispatch call.
Every stage of the appropriate WebGPU pipeline must be occupied by a shader in order to
execute a draw call or dispatch call.

All entry points must begin with the keyword "vertex", "fragment", or "compute", and the keyword
describes which pipeline stage that shader is appropriate for. An entry point is only valid for one
type of shader stage.

Built-ins are identified by name. WHLSL does not include annotations for identifying built-ins. If
the return of a shader should be assigned to a built-in, the author should create a struct with
a variable named according to to the built-in, and the shader should return that struct.

Vertex and fragment entry points must transitively never refer to the ``threadgroup`` memory space.

Arguments and Return Types
""""""""""""""""""""""""""

Arguments return types of an entry point are more restricted than arguments to an arbitrary WHLSL function.
They are flattened through structs - that is, each member of any struct appearing in an argument to an entry
point or return type is considered independently, recursively. Arguments to entry points are not
distinguished by position or order.

Multiple members with the same name may appear inside the flattened collection of arguments. However,
if multiple members with the same name appear, the entire variable (type, qualifiers, etc.) must be
identical. Otherwise, the entire program is in error.

The items of the flattened structs can be partitioned into a number of buckets:

#. Built-in variables. These declaractions use the appropriate built-in semantic from the list below,
   and must use the appropriate type for that semantic.

#. Resources. These must be either the opaque texture types, opaque sampler types, or slices. Slices must
   only hold scalars, vectors, matrices, or structs containing any of these types. Nested structs are
   allowed. The packing rules for data inside slices are described below. All resources must be in the
   ``device`` or ``constant`` memory space, and use the appropriate semantic as described below.

#. Stage-in/out variables. These are variables of scalar, vector, or matrix type. Stage-in variables in
   a vertex shader must use the semantic `` : attribute(n)`` where n is a nonnegative integer. Stage-out
   variables in a vertex shader and stage-in variables in a fragment shader must also use the semantic
   `` : attribute(n)``. Stage-out variables in a vertex shader are matched with stage-in variables in a
   fragment shader by semantic. After these stage-in/stage-out varaibles match, their qualified type must
   also match. After discovering all these matches, any other left-over variables are simply zero-filled.

#. Specialization constants. These are scalar variables which must be specified by the WebGPU API before
   the shader is allowed to execute. These variables must use the ``specialized`` semantic.

Vertex shaders accept all four buckets as input, and allow only built-in variables and stage-out variables
as output. Fragment shaders accept all four buckets as input, and allow only built-in variables as output.
Compute shaders only accept built-in variables and resources, and do not allow any output.

If an entry-point returns a single built-in or stage-out variable, the semantic for that variable must be
placed between the function signature and the function's opening ``{`` character.

Vertex shader stage-out variables and fragment-shader stage-in variables may be qualified with any of the
following qualifiers: ``nointerpolation``, ``noperspective``, ``centroid``, or ``sample``. ``nointerpolation``
and ``noperspective`` must not both be specified on the same variable. ``centroid`` and ``sample`` must not
both be specified on the same variable. If other variables are qualified with these qualifiers, the qualifiers
are ignored.

``nointerpolation`` configures the rasterizer to not interpolate the value of this variable across the
geometry. ``noperspective`` configures the rasterize to not use perspective-correct interpolation,
and instead use simple linear interpolation. ``centroid`` configures the rasterizer to use a position
in the centroid of all the samples within the geometry, rather than the center of the pixel. ``sample``
configures the fragment shader to run multiple times per pixel, with the interpolation point at each
individual sample.

The value used for variables qualified with the ``nointerpolation`` qualifier is the value produced by
one vertex shader invocation per primitive, known as the "provoking vertex." When drawing points, the
provoking vertex is the vertex associated with that point (since points only have a single vertex).
When drawing lines, the provoking vertex is the initial vertex (rather than the final vertex). When
drawing triangles, the provoking vertex is also the initial vertex. Strips and fans are not supported
by WHLSL.

When not in the context of arguments or return values of entry points, semantics are ignored.

Grammar
=======

Lexical analysis
----------------

Shaders exist as a Unicode string, and therefore support all the code points
Unicode supports.

WHLSL does not include any digraphs or trigraphs. WHLSL is case-sensitive. It does not include any
escape sequences.

.. Note:: WHLSL does not include a string type, so escape characters are not present in the
   language.

WHLSL does not include a preprocessor step.

.. Note:: Because there is no processor step, tokens such as '#if' are generally considered
   parse errors.

Before parsing, the text of a WHLSL program is first turned into a list of tokens, removing comments and whitespace along the way.
Tokens are built greedily, in other words each token is as long as possible.
If the program cannot be transformed into a list of tokens by following these rules, the program is invalid and must be rejected.

A token can be either of:

- An integer literal
- A float literal
- Punctuation
- A keyword
- A normal identifier
- An operator name

Literals
""""""""

An integer literal can either be decimal or hexadecimal, and either signed or unsigned, giving 4 possibilities.

- A signed decimal integer literal starts with an optional ``-``, then a number without leading 0.
- An unsigned decimal integer literal starts with a number without leading 0, then ``u``.
- A signed hexadecimal integer literal starts with an optional ``-``, then the string ``0x``, then a non-empty sequence of elements of [0-9a-fA-F] (non-case sensitive, leading 0s are allowed).
- An unsigned hexadecimal inter literal starts with the string ``0x``, then a non-empty sequence of elements of [0-9a-fA-F] (non-case sensitive, leading 0s are allowed), and finally the character ``u``.

.. note:: Leading 0s are allowed in hexadecimal integer literals, but not in decimal integer literals

A float literal is made of the following elements in sequence:

- an optional ``-`` character
- a sequence of 0 or more digits (in [0-9])
- a ``.`` character
- a sequence of 0 or more digits (in [0-9]). This sequence must instead have 1 or more elements, if the last sequence was empty.
- optionally a ``f`` character

In regexp form: '-'? ([0-9]+ '.' [0-9]* | [0-9]* '.' [0-9]+) f?

Keywords and punctuation
""""""""""""""""""""""""

The following strings are reserved keywords of the language:

+-------------------------------+-----------------------------------------------------------------------------------------+
| Top level                     | struct typedef enum operator vertex fragment native restricted space compute numthreads |
+-------------------------------+-----------------------------------------------------------------------------------------+
| Control flow                  | if else switch case default while do for break continue fallthrough return trap         |
+-------------------------------+-----------------------------------------------------------------------------------------+
| Literals                      | null true false                                                                         |
+-------------------------------+-----------------------------------------------------------------------------------------+
| Address space                 | constant device threadgroup thread                                                      |
+-------------------------------+-----------------------------------------------------------------------------------------+
| Qualifier                     | nointerpolation noperspective uniform specialized centroid sample                       |
+-------------------------------+-----------------------------------------------------------------------------------------+
| Reserved for future extension | protocol auto const static                                                              |
+-------------------------------+-----------------------------------------------------------------------------------------+

.. todo:: Find a way to explain the 'Semantic' grammar element here, or at least the relevant keywords

``null``, ``true`` and ``false`` are keywords, but they are considered literals in the grammar rules later.

Similarily, the following elements of punctuation are valid tokens:

+----------------------+-----------------------------------------------------------------------------------------------+
| Relational operators | ``==`` ``!=`` ``<=`` ``=>`` ``<`` ``>``                                                       |
+----------------------+-----------------------------------------------------------------------------------------------+
| Assignment operators | ``=`` ``++`` ``--`` ``+=`` ``-=`` ``*=`` ``/=`` ``%=`` ``^=`` ``&=``  ``|=`` ``>>=``  ``<<=`` |
+----------------------+-----------------------------------------------------------------------------------------------+
| Arithmetic operators | ``+``  ``-`` ``*`` ``/`` ``%``                                                                |
+----------------------+-----------------------------------------------------------------------------------------------+
| Logic operators      | ``&&`` ``||`` ``&``  ``|``  ``^`` ``>>`` ``<<`` ``!`` ``~``                                   |
+----------------------+-----------------------------------------------------------------------------------------------+
| Memory operators     | ``->`` ``.`` ``&`` ``@``                                                                      |
+----------------------+-----------------------------------------------------------------------------------------------+
| Other                | ``?`` ``:`` ``;`` ``,`` ``[`` ``]`` ``{`` ``}`` ``(`` ``)``                                   |
+----------------------+-----------------------------------------------------------------------------------------------+

Identifiers and operator names
""""""""""""""""""""""""""""""

An identifier is any sequence of characters or underscores, that does not start by a digit, that is not a single underscore (the single underscore is reserved for future extension), and that is not a reserved keyword.

Operator names can be either of the 4 following possibilities:

- the string ``operator``, followed immediately with one of the following strings: ``>>``, ``<<``, ``+``, ``-``, ``*``, ``/``, ``%``, ``&&``, ``||``, ``&``, ``|``, ``^``, ``>=``, ``<=``, ``>``, ``<``, ``++``, ``--``, ``!``, ``~``, ``[]``, ``[]=``, ``&[]``.
- the string ``operator.`` followed immediately with what would be a valid identifier x. We call this token a 'getter for x'.
- the string ``operator.`` followed immediately with what would be a valid identifier x, followed immediately with the character ``=``. We call this token 'a setter for x'.
- the string ``operator&.`` followed immediately with what would be a valid identifier x. We call this token an 'address taker for x'.

.. note:: Thanks to the rule that token are read greedily, the string "operator.foo" is a single token (a getter for foo), and not the keyword "operator" followed by the punctuation "." followed by the identifier "foo".

Whitespace and comments
"""""""""""""""""""""""

Any of the following characters are considered whitespace, and ignored after this phase: space, tabulation (``\t``), carriage return (``\r``), new line(``\n``).

WHLSL also allows two kinds of comments. These are treated like whitespace (i.e. ignored during parsing).
The first kind is a line comment, that starts with the string ``//`` and continues until the next end of line character.
The second kind is a multi-line comment, that starts with the string ``/*`` and ends as soon as the string ``*/`` is read.

.. note:: Multi-line comments cannot be nested, as the first ``*/`` closes the outermost ``/*``

Parsing
-------

In this section we will describe the grammar of WHLSL programs, using the usual BNF metalanguage (https://en.wikipedia.org/wiki/Backus–Naur_form).
We use names starting with an upper case letter to refer to lexical tokens defined in the previous section, and names starting with a lower case letter to refer to non-terminals. These are linked (at least in the HTML version of this document).
We use non-bold text surrounded by quotes for text terminals (keywords, punctuation, etc..).

Top-level declarations
""""""""""""""""""""""

A valid file is made of a sequence of 0 or more top-level declarations, followed by the special End-Of-File token.

.. productionlist::
    topLevelDecl: ";" | `typedef` | `structDef` | `enumDef` | `funcDef`

.. todo:: We may want to also allow variable declarations at the top-level if it can easily be supported by all of our targets. (Myles: We can emulate it an all the targets, but the targets themselves only allow constant variables
    at global scope. We should follow suit.)

.. productionlist::
    typedef: "typedef" `Identifier` "=" `type` ";"

.. productionlist::
    structDef: "struct" `Identifier` "{" `structElement`* "}"
    structElement: `type` `Identifier` ";"

.. productionlist::
    enumDef: "enum" `Identifier` (":" `type`)? "{" `enumElement` ("," `enumElement`)* "}"
    enumElement: `Identifier` ("=" `constexpr`)?

.. productionlist::
    funcDef: `funcDecl` "{" `stmt`* "}"
    funcDecl: `entryPointDecl` | `normalFuncDecl` | `castOperatorDecl`
    entryPointDecl: ("vertex" | "fragment") `type` `Identifier` `parameters`
    normalFuncDecl: `type` (`Identifier` | `OperatorName`) `parameters`
    castOperatorDecl: "operator" `type` `parameters`
    parameters: "(" ")" | "(" `parameter` ("," `parameter`)* ")"
    parameter: `type` `Identifier`

.. note:: the return type is put after the "operator" keyword when declaring a cast operator, mostly because it is also the name of the created function. 

Statements
""""""""""

.. productionlist::
    stmt: "{" (`stmt` | `variableDecls` ';')* "}"
        : | `compoundStmt` 
        : | `terminatorStmt` ";" 
        : | `maybeEffectfulExpr` ";"
    compoundStmt: `ifStmt` | `ifElseStmt` | `whileStmt` | `doWhileStmt` | `forStmt` | `switchStmt`
    terminatorStmt: "break" | "continue" | "fallthrough" | "return" `expr`? | "trap"

.. productionlist::
    ifStmt: "if" "(" `expr` ")" `stmt`
    ifElseStmt: "if" "(" `expr` ")" `stmt` "else" `stmt`

.. should I forbid assignments (without parentheses) inside the conditions of if/while to avoid the common mistaking of "=" for "==" ? (Myles: Let's say "yes, forbid it" for now, and we can change it if people complain)
   Delayed for now, may be done in a future revision

The first of these two productions is merely syntactic sugar for the second:

.. math:: \textbf{if}(e) \,s \leadsto \textbf{if}(e) \,s\, \textbf{else} \,\{\}

.. productionlist::
    whileStmt: "while" "(" `expr` ")" `stmt`
    forStmt: "for" "(" (`maybeEffectfulExpr` | `variableDecls`) ";" `expr`? ";" `expr`? ")" `stmt`
    doWhileStmt: "do" `stmt` "while" "(" `expr` ")" ";"

Similarily, we desugar first for loops into while loops, and then all while loops into do while loops.
First, if the second element of the for is empty we replace it by "true".
Then, we apply the following two rules:

.. math::
    \textbf{for} (X_{pre} ; e_{cond} ; e_{iter}) \, s \leadsto \{ X_{pre} ; \textbf{while} (e_{cond}) \{ s \, e_{iter} ; \} \}

.. math::
    \textbf{while} (e)\, s \leadsto \textbf{if} (e) \textbf{do}\, s\, \textbf{while}(e)

.. productionlist::
    switchStmt: "switch" "(" `expr` ")" "{" `switchCase`* "}"
    switchCase: ("case" `constexpr` | "default") ":" `stmt`*

.. productionlist::
    variableDecls: `type` `variableDecl` ("," `variableDecl`)*
    variableDecl: `Identifier` ("=" `expr`)?

Complex variable declarations are also mere syntactic sugar.
Several variable declarations separated by commas are the same as separating them with semicolons and repeating the type for each one.
This transformation can always be done because variable declarations are only allowed inside blocks (and for loops, but these get desugared into a block, see above).

Types
"""""

.. productionlist::
    type: `addressSpace` `Identifier` `typeArguments` `typeSuffixAbbreviated`+
        : | `Identifier` `typeArguments` `typeSuffixNonAbbreviated`*
    addressSpace: "constant" | "device" | "threadgroup" | "thread"
    typeSuffixAbbreviated: "*" | "[" "]" | "[" `IntLiteral` "]"
    typeSuffixNonAbbreviated: "*" `addressSpace` | "[" "]" `addressSpace` | "[" `IntLiteral` "]"


Putting the address space before the identifier is just syntactic sugar for having that same address space applied to all type suffixes.
``thread int *[]*[42]`` is for example the same as ``int *thread []thread *thread [42]``.

.. productionlist::
    typeArguments: "<" (`typeArgument` ",")* `addressSpace`? `Identifier` "<" 
                 : (`typeArgument` ("," `typeArgument`)*)? ">>"
                 : | "<" (`typeArgument` ("," `typeArgument`)* ">"
                 : | ("<" ">")?
    typeArgument: `constepxr` | `type`

The first production rule for typeArguments is a way to say that `>>` can be parsed as two `>` closing delimiters, in the case of nested typeArguments.

Expressions
"""""""""""

WHLSL accepts three different kinds of expressions, in different places in the grammar.

- ``expr`` is the most generic, and includes all expressions.
- ``maybeEffectfulExpr`` is used in places where a variable declaration would also be allowed. It forbids some expressions that are clearly effect-free, such as ``x*y`` or ``x < y``.
  As the name indicates, it may be empty. In that case it is equivalent to "null" (any other effect-free expression would be fine, as the result of such an expression is always discarded).
- ``constexpr`` is limited to literals and the elements of an enum. It is used in switch cases, and in type arguments.

.. productionlist::
    expr: (`expr` ",")? `ternaryConditional`
    ternaryConditional: `exprLogicalOr` "?" `expr` ":" `ternaryConditional`
                      : | `exprPrefix` `assignOperator` `ternaryConditional`
                      : | `exprLogicalOr`
    assignOperator: "=" | "+=" | "-=" | "*=" | "/=" | "%=" | "&=" | "|=" | "^=" | ">>=" | "<<="
    exprLogicalOr: (`exprLogicalOr` "||")? `exprLogicalAnd`
    exprLogicalAnd: (`exprLogicalAnd` "&&")? `exprBitwiseOr`
    exprBitwiseOr: (`exprBitwiseOr` "|")? `exprBitwiseXor`
    exprBitwiseXor: (`exprBitwiseXor` "^")? `exprBitwiseAnd`
    exprBitwiseAnd: (`exprBitwiseAnd` "&")? `exprRelational`
    exprRelational: `exprShift` (`relationalBinop` `exprShift`)?
    relationalBinop: "<" | ">" | "<=" | ">=" | "==" | "!="
    exprShift: (`exprShift` ("<<" | ">>"))? `exprAdd`
    exprAdd: (`exprMult` ("*" | "/" | "%"))? `exprPrefix`
    exprPrefix: `prefixOp` `exprPrefix` | `exprSuffix`
    prefixOp: "++" | "--" | "+" | "-" | "~" | "!" | "*" | "&" | "@"
    exprSuffix: `callExpression` `limitedSuffixOp`*
              : | `term` (`limitedSuffixOp` | "++" | "--")*
    limitedSuffixOp: "." `Identifier` | "->" `Identifier` | "[" `expr` "]"
    callExpression: `Identifier` "(" (`ternaryConditional` ("," `ternaryConditional`)*)? ")"
    term: `Literal` | `Identifier` | "(" `expr` ")"

WHLSL matches the precedence and associativity of operators from C++, with one exception: relational operators are non-associative,
so that they cannot be chained. Chaining them has sufficiently surprising results that it is not a clear
reduction in usability, and it should make it a lot easier to extend the syntax in the future to accept
generics.

There is exactly one piece of syntactic sugar in the above rules: the ``!=`` operator.
``e0 != e1`` is equivalent with ``! (e0 == e1)``.

.. productionlist::
    maybeEffectfulExpr: (`effAssignment` ("," `effAssignment`)*)?
    effAssignment: `exprPrefix` `assignOperator` `expr` | `effPrefix`
    effPrefix: ("++" | "--") `exprPrefix` | `effSuffix`
    effSuffix: `exprSuffix` ("++" | "--") | `callExpression` | "(" `expr` ")"

The structure of maybeEffectfulExpr roughly match the structure of normal expressions, just with normally effect-free operators left off.

If the programmer still wants to use them in such a position (for example due to having overloaded an operator with an effectful operation),
it can be done just by wrapping the expression in parentheses (see the last alternative for effSuffix).

.. productionlist::
    constexpr: `Literal` | `Identifier` "." `Identifier`

Validation
===========

In this section we describe how to determine if a program is valid or not.
If a program is invalid, a compliant implementation must reject it with an appropriate error message, and not attempt to execute it.
If a program is valid, we describe its semantics later in this document.

Validation includes all of typing. If a program is valid, it is also annotated with typing information used by the execution semantics later
(for example, accesses to fixed-size arrays are annotated with the size for the bounds-check).

The validation rules are presented in several steps:
- First we explain how the typing environment is built from the top-level declarations
- Then we provide global validation rules (mostly checking the absence of recursion)
- Finally we provide the typing rules

Building the global typing environment
--------------------------------------

In this first step all top-level declarations are gathered into a global environment.
More precisely they are gathered in three different mappings:

- A mapping from identifiers to types (typedefs, enums and structs)
- A mapping from identifiers to declarations of global (constant) variables
- A mapping from identifiers to sets of function declarations.

A type for the purpose of this mapping is either an enum characterized by a set of values, or it is a typedef characterized by its equivalent type, or it is a struct characterized by the types of its elements.
A variable declaration for the purpose of this mapping is characterized by its type.
A function declaration for the purpose of this mapping is characterised by a tuple of the return type, the number and types of the parameters, and the body of the function.

.. todo::
    Explain how this environment starts with elements from the std lib.

For each top-level declaration:

#. If it is a variable declaration

   #. If there is already a variable of the same name in the environment, the program is invalid
   #. Add it to the mapping with a type Left-value of its declared type in the Constant address space (see later the section on typing for details of types)

#. If it is a typedef

   #. If there is already a type of the same name in the environment, the program is invalid
   #. Add it to the mapping, as a new type, associated to its definition

#. If it is a structure

   #. If there is already a type of the same name in the environment, the program is invalid
   #. If two or more fields of the struct have the same name, the program is invalid
   #. Add the struct to the environment as a new type.
   #. For each field of the struct:

        #. Add to the environment a mapping from the name ``operator.field`` (where ``field`` is replaced by the name of the field) to a function declaration with one argument,
                   whose return type is the type of the field and whose argument type is the struct itself
        #. Add to the environment a mapping from the name ``operator.field=`` (where ``field`` is replaced by the name of the field) to a function declaration with two arguments,
                   whose return type is the type of the struct itself, whose first argument type is the type of the struct itself, and whose second argument type is the type of the field

#. If it is an enum

   #. If there is already a type of the same name in the environment, the program is invalid
   #. If the enum has an explicit base type, and it is not one of ``uchar``, ``ushort``, ``uint``, ``char``, ``short``, ``int``; the program is invalid
   #. If the enum does not have an explicit base type, its base type is int
   #. A value is associated to each element of the enum, by iterating over them in source order:

        #. If it has an explicit value, then this is its value
        #. Else if it is the first element of the enum, its value is 0
        #. Else its value is the value of the precedent element increased by one.

   #. If no element of the enum has the value 0, the program is invalid
   #. If two or more element of the enum have the same value, the program is invalid
   #. If one or more element of the enum have a value that is not representable in the base type of the enum, the program is invalid
   #. Add the enum to the environment as a new type, associated with the set of the values of its elements
   #. For each element of the enum, add a mapping from ``EnumName.ElementName`` (with ``EnumName`` and ``ElementName`` replaced) to the enum type

#. If it is a function declaration

   #. If the name of the function is ``operator.field`` for some name ``field``

        #. It must have a single argument
        #. That argument must not be a pointer, array reference or array

   #. If the name of the function is ``operator.field=`` for some name ``field`` 

        #. It must have exactly two arguments
        #. Its first argument must not be a pointer, array reference or array

   #. If the name of the function is ``operator[]``

        #. It must have exactly two argument
        #. Its first argument must not be a pointer, array reference or array.
        #. Its second argument must be one of ``uchar``, ``ushort``, ``uint``, ``char``, ``short`` or ``int``
 
   #. If the name of the function is ``operator[]=``

        #. It must have exactly three arguments
        #. Its first argument must not be a pointer, array reference or array
        #. Its second argument must be one of ``uchar``, ``ushort``, ``uint``, ``char``, ``short`` or ``int``

   #. If the environment already has a mapping from that function name to a set of declarations, add this declaration to that set
   #. Otherwise add a new mapping from that function name to a singleton set containing that declaration

Other validation steps
----------------------

We list here these validation steps that don't cleanly fit in either the building of the global typing environment, or the typing of each function.

Void type
"""""""""

The void type is a special type that can only appear as the return type of functions.
It must not be part of a composite type (i.e. there is no pointer to void, no array reference to void, no array of void)
It must not be the type of a variable (either at the top-level or in a function), the type of a field of a struct, the type of a function parameter, or the definition of a typedef.

..
    We could allow it as the definition of a typedef, but it would be fairly useless, and would make this verification impossible to do before resolving typedefs

Validating types
""""""""""""""""

Every type name that appears in the program must be defined (i.e. have a mapping in the environment).

Resolving typedefs
""""""""""""""""""

Once this is checked, we define a relation "depends on", as the smallest relation such that:

- A typedef that is defined as equal to a structure or another typedef "depends on" this structure or typedef.
- A structure "depends on" a typedef or structure if it has a member with the same name.

If this relation is cyclic, then the program is invalid.

Then each typedef must be resolved, meaning that each mention of it in the program and in the environment is replaced by its definition.

.. note::
    This last step is guaranteed to terminate thanks to the acyclicity check before it.

Checking the coherence of operators
"""""""""""""""""""""""""""""""""""

For every function with a name of the form ``operator.field=`` for some name ``field`` which is defined:

    #. There must be a function with the name ``operator.field`` (for the same name ``field``) which is defined
    #. For each declaration of the former with arguments type ``(t1, t2)``, there must be a declaration of the latter with argument type ``(t1)``, and return type ``t2``

If a function with the name ``operator[]=`` is defined:

    #. There must be a function with the name ``operator[]`` which is defined
    #. For each declaration of the former with arguments type ``(t1, t2, t3)``, there must be a declaration of the latter with argument type ``(t1, t2)``, and return type ``t3``

Typing of functions
-------------------

Each entry point to the program must be well-typed as described in this section.
This check can in turn lead to the verification of the well-typedness of other functions.

To check that a function is well-typed:

#. Make a new copy of the global environment (built above)
#. For each parameter of the function, add a mapping to this typing environment, associating this parameter name to the corresponding type (with uniformity being negative in the case of entry points)
#. Check that the function body is well-typed in this typing environment (treating it as a block of statement) at the enclosing level of control-flow uniformity (positive in the case of entry points).
#. If the return type of the function is ``void``, then the set of behaviours of the function body must be included in ``{Nothing, Return Void}`` (ignoring uniformity)
#. Else if the return type of the function is a type T, then the set of behaviours of the function body must be ``{Return T}`` (ignoring uniformity)

.. todo:: check that we cannot assume the parameters to entry points to be uniform.

In this section we define the terms above, and in particular, what it means for a statement or an expression to be well-typed.
More formally we define two mutually recursive judgments: "In typing environment Gamma, s is a well-typed statement in (non-)uniform control-flow whose set of behaviours is B" and "In typing environment Gamma, e is a well-typed expression in (non-)uniform control-flow whose type is Tau".

A type can either be:

- A left-value type with an associated right-value type and an address space
- A right-value type, which can be any of the following:
    
    - A basic type such as ``bool`` or ``uint``
    - A structure type, defined by its name
    - An enum type, defined by its name
    - ``void``
    - An array with an associated right-value type and a size (a number of elements)
    - A pointer with an associated right-value type and an address space
    - An array reference with an associated right-value type and an address space

And in both cases it is associated with a uniformity flag (a boolean).

A behaviour is any of the following:

- Return of a right-value type
- Break
- Continue
- Fallthrough
- Nothing

All of these except for Nothing are associated with a uniformity flag (a boolean).
We use these "behaviours" to check the effect of statements on the control flow. 

Notes about uniformity
"""""""""""""""""""""""

Because of both the uniform keyword (which allow the programmer to request verification that a given variable is uniform) and some functions in the standard library that only make sense when called in uniform control flow we infer the uniformity of both control-flow and values in these typing rules.

As defined above, uniformity is a boolean flag that appears at three different locations:

- On the typing judgments themselves, where it refers to the uniformity of the control-flow
- On the types of expressions
- On behaviours, where it refers to the uniformity of the control-flow at the origin of the non-local control-flow they represent.

When we later refer to the "lower of two uniformity flags", we mean false (i.e. negative, i.e. non-uniform) unless both are true. In other words it is a boolean and.

.. todo::
    This subsection reads terribly, I should try to find a way to rephrase it.
    Maybe decide once and for all on names for the two uniformity levels: true/false, positive/negative, uniform/non-uniform is two more naming schemes than we need.

There are two important rules about uniformity:

- If a statement or expression is well-typed in non-uniform control flow, it would also be considered well-typed in uniform control-flow
- If an expression has a type which is uniformi and is a right-value type, it can also be treated as if it is non-uniform.

.. math::
    :nowrap:
    
    \begin{align*}
        \ottdruleuniformityXXstmt{}\\
        \ottdruleuniformityXXexpr{}\\
        \ottdruletvalXXuniform{}
    \end{align*}

.. note::
    Importantly that last rule does not apply to expressions that have a left-value type.
    Such a type refer to the memory that this expression (typically a variable name) refers to, and we don't want to forget that a variable was defined as uniform.

Typing statements
"""""""""""""""""

To check an if-then-else statement:

#. Let ``u`` be the uniformity of the control-flow around this statement
#. Check that the condition is a well-typed expression in control-flow of uniformity ``u``, of type ``bool``, with some uniformity ``u'``
#. Check that the then and else branches are well-typed statements in control-flow of uniformity that is the lower of ``u`` and ``u'``, whose behaviours we will respectively call ``B`` and ``B'``
#. Check that neither ``B`` nor ``B'`` contain a return of a pointer type, or of an array reference type
#. Then the if-then-else statement is well-typed, and its behaviours is the union of ``B`` and ``B'``

.. math::
    :nowrap:

    \begin{align*}
       \ottdruleif{}
    \end{align*}

To check a do-while statement:

#. If the control-flow around this statement is uniform

   #. And the condition is a well-typed expression in uniform control flow, of type uniform ``bool``
   #. And the body of the loop is a well-typed statement in uniform control flow, whose behaviours we will call B
   #. And B does not contain any non-uniform behaviour
   #. And B does not contain a return of a pointer type, or of an array reference type
   #. Then the do-while statement is well-typed, and its behaviours is B, from which Break and Continue behaviours have been removed (if they were present) and to which Nothing has been added

#. Else

   #. Check that the condition is a well-typed expression in non-uniform control-flow, of type ``bool``
   #. Check that the body of the loop is a well-typed statement in non-uniform control-flow, whose behaviours we will call B
   #. Check that B does not contain a return of a pointer type, or of an array reference type
   #. Make a new set of behaviours from B by removing Break and Continue (if they are present) and adding Nothing.
   #. Then the do-while statement is well-typed, and its behaviours is this new set

.. math::
    :nowrap:

    \begin{align*}
        \ottdruledoXXwhileXXuniform{}\\
        \ottdruledoXXwhile{}
    \end{align*}

.. note::
    We do not give rules for for loops, or for while loops, or for if-then statements without an else, because all of those are syntactic sugar that are eliminated during parsing.

To check a switch statement:

#. Check that the expression being switched on is well-typed in control-flow of the same uniformity as the switch statement
#. Check that this type is either an integer type (``uchar``, ``ushort``, ``uint``, ``char``, ``short``, ``int``) or an enum type
#. Check that each value ``v`` in a ``case v`` in this switch is well-typed with the same type
#. Check that no two such cases have the same value
#. If there is a default, check that there is at least one value in that type which is not covered by the cases
#. Else check that for all values in that type, there is one case that covers it
#. Check that either:
   
   #. Both the control-flow around the switch and the type of the expression being switched on are uniform
   #. The body of each case (and default) is well-typed in uniform control-flow, treating them as blocks
   #. None of their behaviours include a non-uniform behaviour

#. Or that the body of each case (and default) is well-typed in non-uniform control-flow, treating them as blocks
#. Make a set of behaviours that is the union of the behaviours of all of these bodies
#. Check that this set contains neither Nothing, nor a Return of a pointer type, nor a Return of an array reference type
#. Remove Break and Fallthrough from this set (if they are in it) and add Nothing
#. Then the switch statement is well-typed, and its behaviours is this last set

.. math::
    :nowrap:

    \begin{align*}
       \ottdruleswitchXXuniform{}\\
       \ottdruleswitch{}\\
       \ottdrulecase{}\\
       \ottdruledefault{}\\
       \ottdruleswitchXXblock{}
    \end{align*}

The ``break;``, ``fallthrough;``, ``continue;`` and ``return;`` statements are always well-typed, and their behaviours are respectively {Break}, {Fallthrough}, {Continue} and {Return void}, annotated with the uniformity of the control-flow at this point.

The statement ``return e;`` is well-typed if ``e`` is a well-typed expression of type T, and its behaviours is then {Return T}, annotated with the uniformity of the control-flow at this point.

.. The statement ``trap;`` is always well-typed. Its set of behaviours is {Return T} for whichever T makes the validation of the program pass (if one such T exists).

.. math::
    :nowrap:

    \begin{align*}
       \ottdrulebreak{}\\
       \ottdrulecontinue{}\\
       \ottdrulefallthrough{}\\
       \ottdrulereturnXXvoid{}\\
       \ottdrulereturn{}\\
    \end{align*}

.. todo::
    Everything below this still has to be updated for the new rules (uniformity, clamping, memory model, etc..)

To check a block:

#. If it is empty, it is well-typed and its behaviours is always {Nothing}
#. Else if it starts by a variable declaration:

    #. Check that there is no other statement in that block is a variable declaration sharing the same name.
    #. Check that the given address space is either ``thread`` or ``threadgroup``
    #. If there is no initializing expression, check that the type of this variable is neither a pointer type nor an array reference type.
    #. Make a new typing environment from the current one, in which the variable name is mapped to a left-value type of its given type and address-space.
    #. If there is an initializing expression, check that it is well-typed in this new environment, and that its type match the type of the variable
    #. Check that the rest of the block, removing this first statement is well-typed in this new typing environment and has a set of behaviours B.
    #. Then the block is well-typed and has the same set of behaviours B.

#. Else if this block contains a single statement, check that this statement is well-typed. If it is, then so is this block, and it has the same set of behaviours
#. Else
   
    #. Check that this block's first statement is well-typed
    #. Check that its set of behaviours B contains Nothing.
    #. Remove Nothing from it.
    #. Check that it does not contain Fallthrough
    #. Check that the rest of the block, removing the first statement, is well-typed with a set of behaviours B'
    #. Then the whole block is well-typed, and its set of behaviour is the union of B and B'.

.. math::
    :nowrap:

    \begin{align*}
        \ottdruleemptyXXblock{}\\
        \ottdrulevariableXXdecl{}\\
        \ottdrulevariableXXdeclXXinit{}\\
        \ottdruletrivialXXblock{}\\
        \ottdruleblock{}
    \end{align*}

.. note::
    The fact that Fallthrough is forbidden in the remnant of the block is purely to forbid some trivial case of dead code.

.. todo::
    Change the variable declaration ott rules to support threadgroup local variables

Finally a statement that consists of a single expression (followed by a semicolon) is well-typed if that expression is well-typed, and its set of behaviours is then {Nothing}.

.. math::
    :nowrap:

    \begin{align*}
        \ottdruleexpr{}
    \end{align*}

.. Do we have a notion of ill-formed syntactically correct type? If so we should make sure it appears nowhere.

Typing expressions
""""""""""""""""""

Literals are always well-typed, and are of any type that can contain them (depending on which is required for validation to succeed).
``true`` and ``false`` are always boolean.

``null`` is always well-typed, and its type can be any pointer or array reference type (depending on which is required for validation to succeed).

The type of an expression in parentheses, is the type of the expression in the parentheses.

A comma expression is well-typed if both of its operands are well-typed. In that case, its type is the type of its second operand.

.. math::
    :nowrap:

    \begin{align*}
        \ottdruleliteralXXtrue{}\\
        \ottdruleliteralXXfalse{}\\
        \ottdrulenullXXlitXXarrayXXref{}\\
        \ottdrulenullXXlitXXptr{}\\
        \ottdruleparens{}\\
        \ottdrulecomma{}
    \end{align*}

To check that a ternary conditional is well-typed:

#. Check that its condition is well-typed and of type bool
#. Check that both of its branches are well-typed
#. Check that the types of its branches are the same
#. Check that this same type is neither a pointer type nor an array reference type.
#. Then it is well-typed, and of that type.

.. math::
    :nowrap:

    \begin{align*}
        \ottdruleternary{}
    \end{align*}

To check that an assignment is well-typed:

#. Check that the expression on the right side of the ``=`` is well-typed with a right-value type "tval"
#. Check that "tval" is neither a pointer type nor an array reference type
#. Check that the expression on the left side is well-typed with a left-value type
#. Check that the right-value type associated with this left-value type is "tval"
#. Check that the address space associated with this left-value type is not ``constant``
#. Then the assignment is well-typed, and its type is "tval"

.. math::
    :nowrap:

    \begin{align*}
        \ottdruleassignment{}
    \end{align*}


A variable name is well-typed if it is in the typing environment. In that case, its type is whatever it is mapped to in the typing environment,

If an expression is well-typed and its type is an left-value type, it can also be treated as if it were of the associated right-value type.

An expression ``&e`` (respectively ``*e``) is well-typed and with a pointer type (respectively with a left-value type) if ``e`` is well-typed and of a left-value type (respectively of a pointer type).
The associated right-value types and address spaces are left unchanged by these two operators.

An expression ``@e`` is well-typed and with an array reference type if ``e`` is well-typed and of a left-value type. The associated right-value types and address spaces are left unchanged by this operator.

.. note::
    The dynamic behaviour depends on whether the expression is a left-value array type or not, but it makes no difference during validation.
    ``@x`` for a variable ``x`` with a non-array type is valid, it will merely produce an array reference for which only the index 0 can be used without trapping.

.. math::
    :nowrap:

    \begin{align*}
        \ottdrulevariableXXname{}\\
        \ottdrulelvalXXaccess{}\\
        \ottdruleaddressXXtaking{}\\
        \ottdruleptrXXderef{}\\
        \ottdruletakeXXrefXXlval{}
    \end{align*}

To check that an array dereference ``e1[e2]`` is well-typed:

#. Check that ``e2`` is well-typed with the type ``uint32``
#. Check that ``e1`` is well-typed
#. If the type of ``e1`` is an array of elements of type ``T``, then the whole expression is well-typed and its type is ``T``
#. Else if the type of ``e1`` is a left-value type, whose associated type is an array of elements of type ``T``, then the whole expression is well-typed, and its type is a left-value with an associated type of ``T`` and the same address space as the type of ``e1``
#. Else if the type of ``e1`` is an array reference whose associated type is ``T``, then the whole expression is well-typed, and its type is a left-value with an associated type of ``T`` and the same address space as the type of ``e1``
#. Else the expression is ill-typed

.. math::
    :nowrap:

    \begin{align*}
        \ottdrulearrayXXindexXXlval{}\\
        \ottdrulearrayXXindexXXrval{}\\
        \ottdrulearrayXXrefXXindex{}
    \end{align*}

.. note::
    The rules shown above can be applied in two different orders in the case of an array dereference of a left-value of an array.
    The left-value can either be treated as a right-value (base) array type by the rule lval\_access then the dereferencing can be validated by array\_index\_rval
    or the dereference can first be validated by array\_index\_lval, and the result then converted to a right-value type by the rule lval\_access.
    This apparent ambiguity is benign because the result is the same in both cases.

To check that a function call is well-typed:

#. Check that each argument is well-typed
#. Make a set of all the functions in the global environment that share the same name and number of parameters
#. For each function in that set:

    #. Check that each argument can be given a type that match the type of the parameter
    #. Otherwise, remove the function from the set

#. Check that the set now contains a single function
#. Then the function call is well-typed, and its type is the return type of that function

.. note::
    Our overloading resolution is only this simple because this version of the language does not have generics.

.. note::
    A consequence of the rule that overloading must be resolved without ambiguity is that if there are two implementations of a function ``foo``
    that take respectively an int and a short, then the program ``foo(42)`` is invalid (as it could refer to either of these implementations).
    The programmer can easily make its intent clear with something like ``int x = 42; foo(x);``.

.. Writing a formal rule for this would be somewhat painful/unreadable, and I don't think it would clarify anything compared to the english description.

Phase 4. Annotations for execution
----------------------------------

We resolved each overloaded function call in the previous section. They must now be annotated with which function is actually being called.

Every variable declaration, and every function parameter must be associated with a unique memory location.

Each control barrier must be annotated with a unique barrier identifier.

Every variable declaration that does not have an initializing value, must get an initializing value that is the default value for its type.
These default values are computed as follows:

- The default value for integer types is ``0``
- The default value for floating point types is ``0.0``
- The default value for booleans is ``false``
- The default value for enums is the element of the enum whose associated integer values is 0
- The default value for pointers and array references is ``null``
- The default value for an array is an array of the right size filled with the default values for its element type
- The default value for a structure type is a structure whose elements are all given their respective default values

Every load and store must also be annotated with a size in bytes.

- The size of primitive types, pointers and array references is implementation defined.
- The size of enums is the size of the underlying type
- The size of arrays is their number of elements multiplied by the size of one element
- The size of structs is computed in the same way as for C structs, and includes padding

.. note::
    The fact that padding is included in the size, combined with the dynamic rules in the next section, means that copying a struct
    also copies any padding bits. This may be observable by the outside world depending on where the store occurs.

.. Should we keep the basic sizes implementation defined?
   Should I find the exact rules for structs for C, and copy them here?
   Also, is this idea of using size annotation in bytes the right formalism at all?

Finally, every array dereference (the ``[]`` operator) must be annotated with the stride, i.e. the size of the elements of the corresponding array.
This size is computed in exactly the way described above.
If the first operand is either an array or a left-value type associated with an array type, the access must also be annotated with the statically known size of the array.


Phase 5. Verifying the absence of recursion
-------------------------------------------

WHLSL does not support recursion (for efficient compilation to GPUs).
So once all overloaded function calls have been resolved, we must do one last check.

We create a relationship "may call" that connects two functions ``f`` and ``g`` if there is a call to ``g`` in the body of ``f`` (after resolving overloading).
If this relationship is cyclic, then the program is invalid.

Dynamic rules
=============

Definitions
-----------

We split the semantics in two parts: a per-thread execution semantics that does not know anything about concurrency or the memory, and a global set of rules for
loads, stores, barriers and the like.

The per-thread semantics is a fairly classic small-step operational semantics, meaning that it describes a list of possible transitions that the program can
take in one step.
The per-thread state is made of a few element:

- The program being executed. Each transition transforms it.
- A control-flow stack. This is a stack of values, which tracks whether we are in a branch, and is used by the rules for barriers to check that control-flow is uniform.
- A (constant) environment. This is a mapping from variable names to values and is used to keep track of arguments and variables declared in the function.

Each transition is a statement of the form "With environment :math:`\rho`, if some conditions are respected, the program may be transformed into the following, modifing
the control-flow stack in the following way, and emitting the following memory events."

In some of these rules we use ``ASSERT`` to provide some properties that are true either by construction or thanks to the validation rules of the previous section.
Such assertions are not tests that must be done by any implementation, they are merely hints to our intent.

Execution of statements
-----------------------

Blocks and variable declarations
""""""""""""""""""""""""""""""""

The program fragments that we use to define our semantics are richer than just the syntactically correct programs. In particular, we allow annotating blocks
(sequences of statements between braces) with an environment. This is useful to formalize lexical scoping.

Here is how to reduce a block by one step:

#. If the block is not annotated, annotate it with the environment
#. If the first statement of the block is an empty block, remove it
#. Else if the first statement of the block is a terminator (break, continue, fallthrough, return or trap), replace the entire block by it.
#. Else if the first statement of the block is a variable declaration:

   #. Make a new environment from the one that annotates the block, mapping the variable name to its store identifier.
   #. If the variable declaration has an initializing expression that can be reduced, reduce it using the new environment
   #. Else:

      #. Change the annotation of the block to the new environment.
      #. Emit a store to the store identifier of the declaration, of the initializing value
      #. Remove this variable declaration from the block

#. Else reduce the first statement of the block, using the environment that the block was annotated with (not the top-level environment)

.. math::
    :nowrap:

    \begin{align*}
        \ottdruleblockXXannotate{}\\
        \ottdruleblockXXnextXXstmt{}\\
        \ottdruleblockXXterminator{}\\
        \ottdruleblockXXvdeclXXreduce{}\\
        \ottdruleblockXXvdeclXXcomplete{}\\
        \ottdruleblockXXvdecl{}\\
        \ottdruleblockXXreduce{}
    \end{align*}

Branches
""""""""

We add another kind of statement: the ``Join(s)`` construct, that takes as argument another statement ``s``.

Here is how to reduce a branch (if-then-else construct, remember that if-then is just syntactic sugar that was eliminated during parsing) by one step:

#. If the expression in the if is ``true`` or ``false``.

   #. Push that value on the control flow stack
   #. Replace the branch by the statement in the then (for ``true``) or else (for ``false``) branch, wrapped in the ``Join`` construct

#. Else reduce that expression

.. math::
    :nowrap:

    \begin{align*}
        \ottdruleifXXtrue{}\\
        \ottdruleifXXfalse{}\\
        \ottdruleifXXreduce{}
    \end{align*}

.. Find a way to reduce the size of the rules in the html version, they are significantly larger than the text for some reason.

Here is how to reduce a ``Join(s)`` statement:

#. If the argument of the ``Join`` is a terminator (``break;``, ``continue;``, ``fallthrough;``, ``return e?;`` or ``trap;``) or an empty block

   #. ASSERT(the control flow stack is not empty)
   #. Pop the last value from the control flow stack
   #. Replace the ``Join`` statement by its argument

#. Else reduce its argument

.. math::
    :nowrap:

    \begin{align*}
        \ottdrulejoinXXelim{}\\
        \ottdrulejoinXXreduce{}
    \end{align*}

.. note:: Popping the last value from the control flow stack never fails, as a Join only appears when eliminating a branch, which pushes a value on it.

Switches
""""""""

We add another kind of statement: the ``Cases(..)`` construct that takes as argument a sequence of statements.
Informally it represents the different cases of a switch, and deals with the ``fallthrough;`` and ``break;`` statements.

Here is how to reduce a switch statement by one step:

#. If the expression in the switch can be reduced, reduce it by one step
#. Else if it is an integer or enum value ``val`` and there is a ``case val:`` in the switch:

    #. Wrap the corresponding sequence of statements into a block (turning it into a single statement)
    #. Do the same for each sequence of statements until the end of the switch
    #. Replace the entire switch by a ``Cases`` construct, taking as argument these resulting statements in source order

#. Else

   #. ASSERT(the expression in the switch is an integer or enum value)
   #. ASSERT(there is a ``default:`` case in the switch)
   #. Find the ``default`` case, and wrap the corresponding sequence of statements into a block (turning it into a single statement)
   #. Do the same for each sequence of statements until the end of the switch
   #. Replace the entire switch by a ``Cases`` construct, taking as argument these resulting statements in source order

.. math::
    :nowrap:

    \begin{align*}
        \ottdruleswitchXXreduce{}\\
        \ottdruleswitchXXcaseXXfound{}\\
        \ottdruleswitchXXdefault{}
    \end{align*}

Here is how to reduce a ``Cases`` construct by one step:

#. ASSERT(the construct has at least one argument)
#. If the first argument is the ``fallthrough;`` statement, remove it (reducing the total number of arguments by 1)
#. Else if the first argument is the ``break;`` statement:

   #. ASSERT(the control flow stack is not empty)
   #. Pop the last value from the control flow stack
   #. Replace the entire construct by an empty block

#. Else if the first argument is another terminator statement, that cannot be reduced (i.e. ``continue;``, ``trap;``, ``return value;`` or ``return;``)

   #. ASSERT(the control flow stack is not empty)
   #. Pop the last value from the control flow stack
   #. Replace the entire construct by its first argument

#. Else reduce the first argument by one step

.. math::
    :nowrap:

    \begin{align*}
        \ottdrulecasesXXfallthrough{}\\
        \ottdrulecasesXXbreak{}\\
        \ottdrulecasesXXotherXXterminator{}\\
        \ottdrulecasesXXreduce{}
    \end{align*}

Loops
"""""

We add yet another kind of statement: the ``Loop(s, s')`` construct that takes as arguments a pair of statements.
Informally, its first argument represent the current iteration of a loop, and its second argument is a continuation for the rest of the loop.

Any ``do s while(e);`` statement is reduced to the following in one step: ``Loop(s, if(e) do s while(e); else {})``.

.. math::
    :nowrap:

    \begin{align*}
        \ottdruledoXXwhileXXloop{}
    \end{align*}

.. note:: while loops and for loops are desugared into do while loops, see the Parsing section.

Here is how to reduce a ``Loop(s, s')`` statement by one step:

#. If ``s`` is the ``break;`` statement, replace the whole construct by the empty block: ``{}``
#. Else if ``s`` is the empty block or the ``continue;`` statement, replace the whole construct by its second argument ``s'``
#. Else if ``s`` is another terminator (``fallthrough;``, ``return;``, ``return rval;`` or ``trap;``), replace the whole construct by it
#. Else reduce ``s`` by one step

.. math::
    :nowrap:

    \begin{align*}
        \ottdruleloopXXbreak{}\\
        \ottdruleloopXXnextXXiteration{}\\
        \ottdruleloopXXotherXXterminator{}\\
        \ottdruleloopXXreduce{}
    \end{align*}

.. note::
    These operations do not need to explicitly modify the control-flow stack, because each iteration of a loop executes an ``if`` statement that does it.

Barriers and uniform control flow
"""""""""""""""""""""""""""""""""

There is no rule in the per-thread semantics for *control barriers*.
Instead, there is a rule in the global semantics, saying that if all threads are at a control barrier instruction, and their control-flow stacks are identical, then they may all advance atomically, replacing the barrier by an empty block.

Other
"""""

If a statement is just an expression (``effectfulExpr`` in the grammar), it is either discarded (if it is a value) or reduced by one step (otherwise).

If a statement is a return followed by an expression, and the expression can be reduced, then the statement can as well by reducing the expression.

The standard library also offers atomic operations and fences (a.k.a. *memory barriers*, not to be confused with *control barriers*).
Each of these emit a specific memory event when they are executed, whose semantics is described in the memory model section.

Execution of expressions
------------------------

We define the following kinds of values:

- Integers, floats, booleans and other primitives provided by the standard library
- Pointers. These have an address and an address space
- Left values. These also have an address and an address space
- Array references. These have a base address, an address space and a size
- Struct values. These are a sequence of bytes of the right size, and can be interpreted as a tuple of their elements (plus padding bits)
- Array values. These are also a sequence of bytes of the right size, and can also be interpreted as a sequence of their elements (plus padding bits).

In this section we describe how to reduce each kind of expression to another expression or to a value.
Left values are the only kind of values that can be further reduced.

Operations affecting control-flow
"""""""""""""""""""""""""""""""""

Just like we added ``Join``, ``Cases`` and ``Loop`` construct to deal with control-flow affecting statements, we add a ``JoinExpr`` construct to deal with control-flow affecting expressions.
``JoinExpr`` takes as argument an expression and return an expression. Its only use is (informally) as a marker that the control-flow stack will have to be popped to access its content.

There are three kinds of expressions that can cause a divergence in control-flow: the boolean and (i.e. ``&&``, that short-circuits), the boolean or (i.e. ``||``, that also short-circuits), and ternary conditions.

To reduce a boolean and by one step:

#. If its first operand can be reduced, reduce it
#. Else if its first operand is ``false``, replace the whole operation by ``false``.
#. Else

    #. ASSERT(its first operand is ``true``)
    #. Push ``true`` on the control-flow stack.
    #. Replace the whole operation by its second operand wrapped in a ``JoinExpr`` construct.

.. math::
    :nowrap:

    \begin{align*}
        \ottdruleandXXreduce{}\\
        \ottdruleandXXfalse{}\\
        \ottdruleandXXtrue{}
    \end{align*}

Very similarily, to reduce a boolean or by one step:

#. If its first operand can be reduced, reduce it
#. Else if its first operand is ``true``, replace the whole operation by ``true``.
#. Else

    #. ASSERT(its first operand is ``false``)
    #. Push ``false`` on the control-flow stack.
    #. Replace the whole operation by its second operand wrapped in a ``JoinExpr`` construct.

.. math::
    :nowrap:

    \begin{align*}
        \ottdruleorXXreduce{}\\
        \ottdruleorXXtrue{}\\
        \ottdruleorXXfalse{}
    \end{align*}

To reduce a ternary condition by one step:

#. If its first operand can be reduced, reduce it
#. Else if its first operand is ``true``

    #. Push ``true`` on the control-flow stack.
    #. Replace the whole operation by its second operand wrapped in a ``JoinExpr`` construct

#. Else

    #. ASSERT(its first operand is ``false``)
    #. Push ``false`` on the control-flow stack.
    #. Replace the whole operation by its third operand wrapped in a ``JoinExpr`` construct.

.. math::
    :nowrap:

    \begin{align*}
        \ottdruleternaryXXreduce{}\\
        \ottdruleternaryXXtrue{}\\
        \ottdruleternaryXXfalse{}
    \end{align*}

To reduce a ``JoinExpr`` by one step:

#. If its operand is not a lvalue, and can be reduced, then reduce it by one step
#. Else pop one element from the control stack, and replace the whole expression by the operand.

.. math::
    :nowrap:

    \begin{align*}
        \ottdrulejoinXXexprXXreduce{}\\
        \ottdrulejoinXXexprXXelim{}
    \end{align*}

Pointers and references
"""""""""""""""""""""""
WHLSL has both pointers and array references. Pointers let the programmer access a specific memory location, but do not allow any pointer arithmetic.
Array references are actually bounds-checked fat-pointers.

The ``&`` and ``*`` operators simply convert between left-values and pointers.
In particular, to reduce ``& e``:

#. If ``e`` is an lvalue, replace the whole expression by a pointer to the same address.
#. Else reduce ``e``.

Symmetrically, to reduce ``* e``:

#. If ``e`` is null, trap
#. Else if ``e`` is a pointer, replace the whole expression by a lvalue to the same address
#. Else reduce ``e``.

.. math::
    :nowrap:

    \begin{align*}
        \ottdruletakeXXptrXXlval{}\\
        \ottdruletakeXXptrXXreduce{}\\
        \ottdrulederefXXptr{}\\
        \ottdrulederefXXreduce{}\\
    \end{align*}

The ``@`` operator is used to turn a lvalue into an array reference, using the size information computed during typing to set the bounds.
More precisely, to reduce ``@ e``:

#. If ``e`` is an LValue and was of type LValue of an array of size ``n`` during typing, replace it by an array reference to the same address, same address space, and with a bound of ``n``
#. Else if it is an LValue and was of type LValue of a non-array type during typing, replace it by an array reference to the same address, same address space, and with a bound of ``1``
#. Else reduce it

There is no explicit dereferencing operator for array references: they can just be used with the array syntax.
The ``[]`` dereferencing operator is polymorphic: its first operand can be either an array reference, or an array, or a left value pointing
to an array.
To reduce ``e1[e2]`` by one step:

#. If ``e2`` can be reduced, then reduce it by one step
#. Else if the first operand is null, trap
#. Else if the first operand is an array

    #. ASSERT(``e2`` is a non-negative integer value)
    #. If the value is equal or greater than the size of the array (known from typing information), trap
    #. Else replace the whole expression by the corresponding element of the array

#. Else if the first operand is a left-value

   #. ASSERT(``e2`` is a non-negative integer value)
   #. If the value is equal or greater than the size of the array pointed to by the left-value (known from typing information), trap
   #. Offset the address pointed to by the left-value by the product of the stride size (annotated during typing) and ``e2``
   #. Replace the whole expression by the resulting left-value (without changing its address space)

#. Else if the first operand is an array reference

   #. ASSERT(``e2`` is a non-negative integer value)
   #. If the value is equal or greater than the size carried by the array reference, trap
   #. Make a left-value with the same address-space as ``e1``, with an address that is the address pointed to by ``e1``, offset by the product of the stride size (annotated during typing) and ``e2``
   #. Replace the whole expression by it

.. todo::
    Finish writing the related formal rules

Variables and assignment
""""""""""""""""""""""""

A variable name can be reduced in one step into whatever that name binds in the current environment.
This does not require any memory access: it is purely used to represent scoping, and most names just bind to lvalues.

To reduce an lvalue:

#. Emit a load to the corresponding address
#. If the type of the expression was an enum type, and the value loaded is not a valid value of that type, replace it by an unspecified valid value of that type
#. Replace the whole expression by this value

.. note::
    The 2nd step is to prevent races from allowing the creation of invalid enum values, which could cause problems to switches without default cases.
    We don't need a similar rules for pointers or array references, because we do not allow potentially racy assignments to variables of these types.

To reduce an assignment ``e1 = e2``:

#. If ``e1`` is not a lvalue, and can be reduced, reduce it.
#. Else if ``e2`` can be reduced, reduce it.
#. Else

   #. Emit a store to the address of the lvalue, of the value on the right of the equal.
   #. Replace the entire expression by the value on the right of the equal.

.. Should we make the sizes of loads/stores more explicit?

Calls
"""""

Overloaded function calls have already been resolved to point to a specific function during the validation phase.

Like we added ``Loop`` or ``JoinExpr``, we add a special construct ``Call`` that takes as argument a statement and return an expression.
Informally, it is a way to transform a return statement into the corresponding value.

To reduce a function call by one step:

#. If there is at least an argument that can be reduced, reduce the left-most argument that can be reduced.
#. Else:

    #. ASSERT(the number of arguments and parameters to the function match)
    #. Create a new environment from the current environment
    #. For each parameter of the function, from left to right:
           
        #. Lookup the address of that parameter
        #. Emit a store of the value of the corresponding argument to that address
        #. Modify the new environment to have a binding from that parameter name to that address

    #. Make a block statement from the body of the function, annotated with this new environment
    #. Wrap that block in the ``Call`` construct
    #. Replace the entire expression by that construct.

.. note::
    Contrary to C/C++, execution order is fully specified: it is always left-to-right.

.. note::
    The new environment binds the parameter names to the argument values, regardless of whether there was already a binding for that name.
    This allows shadowing global variables.

.. math::
    :nowrap:

    \begin{align*}
        \ottdrulecallXXreduce{}\\
        \ottdrulecallXXresolve{}
    \end{align*}

To reduce a ``Call`` construct by one step:

#. If its argument can be reduced, reduce it
#. Else if its argument is ``return;`` or an empty block, replace it by a special ``Void`` value. Nothing can be done with such a value, except discarding it (see Effectful Expression).
#. Else if its argument is ``return val;`` for some value ``val``, then replace it by this value.

.. math::
    :nowrap:

    \begin{align*}
        \ottdrulecallXXconstructXXreduce{}\\
        \ottdrulecallXXreturnXXvoid{}\\
        \ottdrulecallXXendXXfunction{}\\
        \ottdrulecallXXreturn{}
    \end{align*}

Other
"""""

Parentheses have no effect at runtime (beyond their effect during parsing).

The comma operator simply reduces its first operand as long as it can, then drop it and is replaced by its second operand.

.. I don't mention the ! operator here, because it has no weirdness/interest: it is just a special syntax for a standard library function.

Memory model
------------

There are 4 address spaces into which all memory locations are partitioned:

#. global (read-write)
#. constant
#. threadgroup
#. thread

Global and constant memory are shared between all threads, threadgroup memory is shared between threads in the same group, and finally thread memory is thread-local.
Furthermore, the rules in the validation section should prevent any store to the constant address space.

As we have seen in the previous sections, each thread can emit memory events. There are several possible such kinds of events:

- (non-atomic) stores of a value to a location
- (non-atomic) loads of a value from a location
- Fences (a.k.a. memory barrier, not to be confused with control barriers)
- atomic stores of a value to a location
- atomic loads of a value from a location.

All non-atomic stores and loads are considered to happen byte-by-byte.

In this section we will give the *memory model* of WHLSL, that is the set of rules that determine which values a load is allowed to read.
The gist of it is that all atomic accesses are fully ordered and sequentially consistent, and that races involving non-atomic accesses result in unspecified values being read.
A bit more precisely, a read is racy if:

- It is non-atomic, and the set of all stores that are visible to it (same location and not happening-after it) is not a singleton that happens-before it
- Or there are at least two stores in the set of all stores that are visible to it, and at least one of these stores is non-atomic

The value read by a racy load is unspecified: it can be anything (even a value that is not written anywhere in the program). Contrary to C++ though, it is not an undefined behaviour to have a racy access.

.. 
    This memory model is presented in an axiomatic fashion, and is loosely inspired by the C++11 memory model.
    Like in C++11, we first generate the set of all candidate executions, by considering each thread in isolation, and assuming that any load can return any value (of the right size).
    Then we augment each of these candidate executions with several relationships:

    - Reads-from, which optionally associates one store at the same address to each load
    - Memory-order, which must be a total order for each memory address on all the stores to that memory address
    - Sequentially-consistent-before, that is a total order on all atomic operations

    This further increase the number of candidate executions to include all possible relationships above.
    We then build yet another relationship called happens-before with the following rules:

    - If two events are emitted by the same thread in some order, they are related in the same order by happens-before
    - If an atomic load (or a normal load followed in program order by a fence) reads a value written by an atomic store (or a normal store preceded in program order by a fence), then that atomic store (or fence) happens-before that atomic load (or fence).
    - Happens-before is transitive (and is the smallest relationship that follows these rules

    Then we filter all of these to only keep those candidate executions that verify a few rules:

    - If a load reads-from a store, it must read the same value that was written by that store
    - If two stores are ordered by both memory-order and happens-before, then they must be in the same order in both
    - If two stores are ordered by both memory-order and sequentially-consistent-before, then they must be in the same order in both
    - Happens-before is irreflexive
    - A read cannot reads-from a store that happens-after it
    - If there is a single store that happens-before a normal load such that every other store to that memory location either happens-before that store or happens-after that load, then the load must read-from the store
    - If there is at least one store to a location that does not happen-after a load to that location, then that load must reads-from one such store

    TODO: my rules are currently wrong, because of the case of atomic/non-atomic race.
    TODO: essentially every part of the C11 model related to mo, hb, rf; + a fixed version of the rules for sc.. it is going to be ugly and unreadable to anyone not an expert I'm afraid.

Standard library
================

Built-in Types
--------------

Built-in Scalars
""""""""""""""""

+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| Type Name | Description                                                                    | Representable values                                                              |
+===========+================================================================================+===================================================================================+
| void      | Must only be used as a return type from functions which don't return anything. | None                                                                              |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| bool      | A conditional type.                                                            | true or false                                                                     |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| uchar     | An unsigned 8-bit integer.                                                     | 0, 1, 2, ... 255                                                                  |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| ushort    | An unsigned 16-bit integer.                                                    | 0, 1, 2, ... 65535                                                                |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| uint      | An unsigned 32-bit integer.                                                    | 0, 1, 2, ... 4294967295                                                           |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| char      | A signed 8-bit integer.                                                        | -128, -127, ... -1, 0, 1, ... 127                                                 |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| short     |  A signed 16-bit integer.                                                      | -32768, -32767, ... -1, 0, 1, ... 32767                                           |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| int       | A signed 32-bit integer.                                                       | -2147483648, -2147483647, ... -1, 0, 1, ... 2147483647                            |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| half      | A 16-bit floating-point number.                                                | See below for details on representable values.                                    |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| float     | A 32-bit floating-point number.                                                | See below for details on representable values.                                    |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+

.. Note:: The following types are not present in WHLSL: dword, min16float, min10float, min16int, min12int, min16uint, string, size_t, ptrdiff_t, double, float64, int64, uint64

Built-in Atomic Types
"""""""""""""""""""""

#. atomic_int
#. atomic_uint

Built-in aggregate types
""""""""""""""""""""""""

The following are vector types, which list the name of a scalar type and the number of elements in the
vector. Each item below includes two types, which are synonyms for each other.

* bool2, or vector<bool, 2>
* bool3, or vector<bool, 3>
* bool4, or vector<bool, 4>
* uchar2, or vector<uchar, 2>
* uchar3, or vector<uchar, 3>
* uchar4, or vector<uchar, 4>
* ushort2, or vector<ushort, 2>
* ushort3, or vector<ushort, 3>
* ushort4, or vector<ushort, 4>
* uint2, or vector<uint, 2>
* uint3, or vector<uint, 3>
* uint4, or vector<uint, 4>
* char2, or vector<char, 2>
* char3, or vector<char, 3>
* char4, or vector<char, 4>
* short2, or vector<short, 2>
* short3, or vector<short, 3>
* short4, or vector<short, 4>
* int2, or vector<int, 2>
* int3, or vector<int, 3>
* int4, or vector<int, 4>
* half2, or vector<half, 2>
* half3, or vector<half, 3>
* half4, or vector<half, 4>
* float2, or vector<float, 2>
* float3, or vector<float, 3>
* float4, or vector<float, 4>

The following are matrix types, which list the name of a scalar type, the number of columns, and the number
of rows, in that order. Each item below includes two types, which are synonyms for each other.

* half2x2, or matrix<half, 2, 2>
* half2x3, or matrix<half, 2, 3>
* half2x4, or matrix<half, 2, 4>
* half3x2, or matrix<half, 3, 2>
* half3x3, or matrix<half, 3, 3>
* half3x4, or matrix<half, 3, 4>
* half4x2, or matrix<half, 4, 2>
* half4x3, or matrix<half, 4, 3>
* half4x4, or matrix<half, 4, 4>
* float2x2, or matrix<float, 2, 2>
* float2x3, or matrix<float, 2, 3>
* float2x4, or matrix<float, 2, 4>
* float3x2, or matrix<float, 3, 2>
* float3x3, or matrix<float, 3, 3>
* float3x4, or matrix<float, 3, 4>
* float4x2, or matrix<float, 4, 2>
* float4x3, or matrix<float, 4, 3>
* float4x4, or matrix<float, 4, 4>

.. todo:: Should we have int or bool matrices?

Samplers
""""""""

Samplers must only be passed into an entry point inside an argument. All samplers are immutable and must be
declared in the "constant" address space. There is no constructor for samplers; it is impossible to create
or destory one in WHLSL. The type is defined as ``native typedef sampler;``. Samplers are impossible to
introspect. Arrays must not contain samplers anywhere inside them. Functions that return samplers must only
have one return point. Ternary expressions must not return references.

.. todo::
    Robin: I have not put the ``native typedef`` syntax in the grammar or the semantics so far, should I?

Textures
""""""""

The following types represent textures:

* Texture1D<T>
* RWTexture1D<T>
* Texture1DArray<T>
* RWTexture1DArray<T>
* Texture2D<T>
* RWTexture2D<T>
* Texture2DArray<T>
* RWTexture2DArray<T>
* Texture3D<T>
* RWTexture3D<T>
* TextureCube<T>
* TextureDepth2D<S>
* RWTextureDepth2D<S>
* TextureDepth2DArray<S>
* RWTextureDepth2DArray<S>
* TextureDepthCube<S>

.. todo:: Texture2DMS<T>, TextureDepth2DMS<float>

Each of the above types accepts a "type argument". The "T" types above may be any scalar or vector integral or floating point type.
The "S" types above may be float or half.

If the type argument, including the ``<>`` characters is missing, is is assumed to be ``float4``.

Textures must only be passed into an entry point inside an argument. Therefore, textures must only be declared
in either the ``constant`` or ``device`` address space. A texture declared in the ``constant`` address space
must never be modified. There is no constructor for textures; it is impossible to create or destroy one in WHLSL.
Arrays must not contain textures anywhere inside them. Functions that return textures must only have one return
point. Ternary expressions must not return references.

.. todo::
    "Therefore": it is not clear to me how it is a consequence (Robin).
    "Ternary expressions must not return references": What kind of references are you referring to? If it is array references, I don't think it is the right place to mention this (but thank you for the reminder to put it in the validation section).
    Similarily, most of these constraints should probably be either duplicated in or moved to the validation section, I will take care of it.

    They are not copyable, ie they are references.

Pointers
""""""""

Pointers may be passed into an entry point inside an argument or created inside a function using the "&"
operator. No data arrived at via a ``constant`` pointer may be modified. ``device``, ``constant``, and
``threadgroup`` pointers must not point to data that may have pointers in it. Arrays must not contain pointers
anywhere inside them. Functions that return pointers must only have one return point. Ternary expressions must
not return pointers. Every construction of a pointer must be initialized upon declaration and never reassigned.

.. todo::
    "No data arrived at via a ``constant`` pointer may be modified": this phrasing sounds a bit unclear to me.
    In particular (from my understanding), it is not the pointer itself that is constant, it is just a pointer to the constant address space.
    What I am trying to say is that data pointed to by a ``constant`` pointer cannot be modified at all, even if accessed in some other way, because all ways of accessing it will find it is in the ``constant`` address space.
    (at least that is the way I've understood it so far).

Array References
""""""""""""""""

Uniform Qualifier
"""""""""""""""""

Numerical Compliance
""""""""""""""""""""

Built-in Variables
------------------

Built-in variables are represented by using semantics. For example, ``uint theInstanceID : SV_InstanceID``.
Variables with these semantics must have the type associated with that semantic.

The following built-in variables, as identified by their semantics, are available inside arguments to vertex
shaders:

+---------------+------+
| Semantic Name | Type |
+===============+======+
| SV_InstanceID | uint |
+---------------+------+
| SV_VertexID   | uint |
+---------------+------+

The following built-in variables, as identified by their semantics, are available inside the return value of
a vertex shader:

+---------------+--------+
| Semantic Name | Type   |
+===============+========+
| PSIZE         | float  |
+---------------+--------+
| SV_Position   | float4 |
+---------------+--------+

The following built-in variables, as identified by their semantics, are available inside arguments to fragment
shaders:

+------------------+--------+
| Semantic Name    | Type   |
+==================+========+
| SV_IsFrontFace   | bool   |
+------------------+--------+
| SV_SampleIndex   | uint   |
+------------------+--------+
| SV_InnerCoverage | uint   |
+------------------+--------+

The following built-in variables, as identified by their semantics, are available inside the return value of
a fragment shader:

+----------------+--------+
| Semantic Name  | Type   |
+================+========+
| SV_Target[n]   | float4 |
+----------------+--------+
| SV_Depth       | float  |
+----------------+--------+
| SV_Coverage    | uint   |
+----------------+--------+

The following built-in variables, as identified by their semantics, are available inside arguments to compute
shaders:

+---------------------+-------+
| Semantic Name       | Type  |
+=====================+=======+
| SV_DispatchThreadID | uint3 |
+---------------------+-------+
| SV_GroupID          | uint3 |
+---------------------+-------+
| SV_GroupIndex       | uint  |
+---------------------+-------+
| SV_GroupThreadID    | uint3 |
+---------------------+-------+

Built-in Functions
------------------

Some of these functions only appear in specific shader stages.

We should figure out if atomic handling goes here.

Interface with JavaScript
=========================

Shaders are supplied to the Javascript WebGPU API as a single argument
which is understood to be of type 'DOMString'.

Resource Limits
===============

#. How many inputs
#. How many outputs
#. How many intermediate variables

Indices and tables
##################

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
