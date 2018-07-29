.. WSL documentation master file, created by
   sphinx-quickstart on Thu Jun  7 15:53:54 2018.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

WSL Specification
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

WSL shaders are used with the WebGPU API. Specific WebGPU API entry points to compile
and manipulate shaders are specified in the WebGPU specification, not this document.
This document describes which programs are well-formed; the exact form of error
reporting is not discussed in this specification.

WSL does not support extensions or optional behavior.

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

WSL is used to describe different types of shaders:

#. Vertex shaders
#. Fragment shaders
#. Compute shaders

Each shader type represents software which may execute on a specialized processor. Different
draw calls, different shader types, or different invocations of the same shader, may execute
on independent processors.

A WSL string passes through the following stages of processing before it is executed:

#. Tokenization
#. Parsing
#. Validation

Once a WSL string passes all the validation checks, it is then available to be used in a
draw call or dispatch call. A WSL string contains zero or more shaders, and each shader is
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

An input vertex may be any assortment of information, arranged into three forms:

#. Stage-in data. Each invocation of the vertex shader is associated with data from a particular
   index in a GPU buffer. The WebGPU API is responsible for describing the association between
   which invocation receives which index in which buffer. Stage-in data must only be of scalar,
   vector, or matrix type.

#. Resources. All invocations of the vertex shader may have access to one or more resources.
   All invocations share the same resource; therefore, data races may occur between read-write
   resources. Resources may be of type buffer, texture, or sampler.

#. Built-ins. Some information can be made available to the shader automatically (such as the
   invocation ID or the primitive ID).

Because vertex shaders may have write-access to resources, they are not "pure" in the functional
sense. The order of execution of multiple invocations of the vertex shader may be observable.
Execution of multiple invocations of the vertex shader may be multiplexed across multiple processing
units at the entire shader level or the instruction level (or any level in between). Therefore,
when using simple loads and stores, load tearing may occur, or any such artifacts. WSL authors must
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
three forms:

#. Interpolated output from the vertex shader. These variables are matched to vertex shader variables
   using the routine described below.

#. Resources. All invocations of the fragment shader may have access to one or more resources.
   All invocations share the same resource; therefore, data races may occur between read-write
   resources. Resources may be of type buffer, texture, or sampler.

#. Built-ins. Some information can be made available to the shader automatically (such as the
   sample ID or the primitive ID).

Because vertex shaders may have write-access to resources, they are not "pure" in the functional
sense. The order of execution of multiple invocations of the vertex shader may be observable.
Execution of multiple invocations of the vertex shader may be multiplexed across multiple processing
units at the entire shader level or the instruction level (or any level in between). Therefore,
WSL authors must take care to create shaders which are portable. See below for advice on how to
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

The input to a compute shader may be any assortment of information, arranged into two forms:

#. Resources. All invocations of the compute shader may have access to one or more resources.
   All invocations share the same resource; therefore, data races may occur between read-write
   resources. Resources may be of type buffer, texture, or sampler.

#. Built-ins. Some information can be made available to the shader automatically (such as the
   invocation ID within the block or the block ID within the grid).

Entry Points
------------

All functions in WSL are either "entry points" or "non-entry points." An entry point is a function
that may be associated with a particular programmable stage in a pipeline. Entry points may call
non-entry points, non-entry points may call non-entry points, but entry points may not be called
by any WSL function. When execution of a particular shader stage begins, the entry point associated
with that shader stage begins, and when that entry point returns, the associated shader stage ends.

Exactly one WSL shader occupies one stage in the WebGPU pipeline at a time. Two shaders
of the same shader type must not be used together in the same draw call or dispatch call.
Every stage of the appropriate WebGPU pipeline must be occupied by a shader in order to
execute a draw call or dispatch call.

All entry points must begin with the keyword "vertex", "fragment", or "compute", and the keyword
describes which pipeline stage that shader is appropriate for. An entry point is only valid for one
type of shader stage.

Built-ins are identified by name. WSL does not include annotations for identifying built-ins. If
the return of a shader should be assigned to a built-in, the author should create a struct with
a variable named according to to the built-in, and the shader should return that struct.

Vertex and fragment entry points must transitively never refer to the ``threadgroup`` memory space.

Arguments and Return Types
""""""""""""""""""""""""""

Arguments return types of an entry point are more restricted than arguments to an arbitrary WSL function.
They are flattened through structs - that is, each member of any struct appearing in an argument to an entry
point or return type is considered independently, recursively. Arguments to entry points are not
distinguished by position or order.

Multiple members with the same name may appear inside the flattened collection of arguments. However,
if multiple members with the same name appear, the entire variable (type, qualifiers, etc.) must be
identical. Otherwise, the entire program is in error.

The items of the flattened structs can be partitioned into three buckets:

#. Built-in variables. These declaractions must exactly match an item in the list below.

#. Resources. These must be either the opaque texture types, opaque sampler types, or slices. Slices must
   only hold scalars, vectors, matrices, or structs containing any of these types. Nested structs are
   allowed. The packing rules for data inside slices are described below. All resources must be in the
   ``device`` or ``constant`` memory space.

# Stage-in/out variables. These are variables of scalar, vector, or matrix type.

Vertex shaders accept all three buckets as input, and allow only built-in variables and stage-out variables
as output. Fragment shaders accept all three buckets as input, and allow only built-in variables and stage-
out variables as output. Fragment shaders only accept built-in variables and resources, and do not allow
any output.

Grammar
=======

Lexical analysis
----------------

Shaders exist as a Unicode string, and therefore support all the code points
Unicode supports.

WSL does not include any digraphs or trigraphs. WSL is case-sensitive. It does not include any
escape sequences.

.. Note:: WSL does not include a string type, so escape characters are not present in the
   language.

WSL does not include a preprocessor step.

.. Note:: Because there is no processor step, tokens such as '#if' are generally considered
   parse errors.

Before parsing, the text of a WSL program is first turned into a list of tokens, removing comments and whitespace along the way.
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

.. todo:: I chose rather arbitrarily to allow leading 0s in hexadecimal, but not in decimal integer literals. This can obviously be changed either way.

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

+-------------------------------+---------------------------------------------------------------------------------+
| Top level                     | struct typedef enum operator vertex fragment native restricted                  |
+-------------------------------+---------------------------------------------------------------------------------+
| Control flow                  | if else switch case default while do for break continue fallthrough return trap |
+-------------------------------+---------------------------------------------------------------------------------+
| Literals                      | null true false                                                                 |
+-------------------------------+---------------------------------------------------------------------------------+
| Address space                 | constant device threadgroup thread                                              |
+-------------------------------+---------------------------------------------------------------------------------+
| Reserved for future extension | protocol auto                                                                   |
+-------------------------------+---------------------------------------------------------------------------------+

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

.. todo:: add here a quick explanation of BNF syntax and our conventions.

Top-level declarations
""""""""""""""""""""""

A valid file is made of a sequence of 0 or more top-level declarations, followed by the special End-Of-File token.

.. productionlist::
    topLevelDecl: ";" | `typedef` | `structDef` | `enumDef` | `funcDef`

.. todo:: We may want to also allow variable declarations at the top-level if it can easily be supported by all of our targets. (Myles: We can emulate it an all the targets, but the targets themselves only allow constant variables
    at global scope. We should follow suit.)
.. todo:: Decide whether we put native/restricted in the spec or not.

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
    stmt: "{" `stmt`* "}"
        : | `compoundStmt` 
        : | `terminatorStmt` ";" 
        : | `variableDecls` ";" 
        : | `maybeEffectfulExpr` ";"
    compoundStmt: `ifStmt` | `ifElseStmt` | `whileStmt` | `doWhileStmt` | `forStmt` | `switchStmt`
    terminatorStmt: "break" | "continue" | "fallthrough" | "return" `expr`? | "trap"

.. productionlist::
    ifStmt: "if" "(" `expr` ")" `stmt`
    ifElseStmt: "if" "(" `expr` ")" `stmt` "else" `stmt`

.. todo:: should I forbid assignments (without parentheses) inside the conditions of if/while to avoid the common mistaking of "=" for "==" ? (Myles: Let's say "yes, forbid it" for now, and we can change it if people complain)

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

.. todo:: should I make the requirement that variableDecls only appear in blocks be part of the syntax, or should it just be part of the validation rules?

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

.. todo:: Now that we are disallowing the general use of type arguments, do we need the >> processing?

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

Phase 1: Gathering declarations
-------------------------------

the goal is to build the global typing environment, as well as the global execution environment.
I am afraid it may require several steps.
The first step would do most of the work, gathering all function signatures, as well as typedefs, etc..
The second step would go through the resulting environment, resolving all types, in particular all typedefs (as well as connecting function parameters to the corresponding type variables, etc..)

We need to give consideration to the tons of qualifiers on variables that GLSL / Metal have.

Phase 2: Local typing and early validation
------------------------------------------

Notations and definitions
"""""""""""""""""""""""""

- Definition of the typing environment
- Definition of the type hierarchy
- Definition of the type evaluation judgement

Validating top-level declarations
"""""""""""""""""""""""""""""""""

Typedefs and structs:

- checking no recursive types (both structs and typedefs.. maybe as part of the computation of the size of each type)
  No, the computation of the size of each type will necessarily happen during monomorphisation
  And we cannot defer this check until then, because we will need to eliminate all typedefs during the local typing phase.

Structs:

- checking that structs have distinct names for different fields, and that the type of their fields are well-defined (and non-void)

Enums:

- check that enums do not have duplicate values, and have one zero-valued element.
- check that enums have an integer base type (not another enum in particular).
- check that every value given to an enum element fits in the base type.

Protocols:

- check that each signature inside a protocol refers to the protocol name (aka type variable).
- check that the extension relation on protocols is sane (at the very least acyclic, maybe also no incompatible signatures for the same function name).

Functions:

- check that operator.field, operator.field=, operator[] and operator[]= are not defined for pointer types, nor declared for pointer types in a protocol.
- check that operator.field= is only defined if operator.field is as well, and that they agree on their return type in that case.
- check that operator[]= is only defined if operator[] is as well, and that they agree on their return type in that case.
- check that all of the type parameters of each operator declaration/definition are inferrable from their arguments (and from its return type in the case of cast operators).
- check that no argument is of type void
- finally, check that the function body can only end with a return of the right type, or with Nothing if it is a void function

Typing statements
"""""""""""""""""

Typing expressions
""""""""""""""""""

- typing rules (this and everything that follows can be managed by just a pair of judgements that type stmts/exprs)
- checking returns
- check that every variable declaration is in a block or at the top-level
- check that no variable declaration shadows another one at the same scope
- check that no variable is declared of type void
- check that switch statements treat all cases
- check that every case in a switch statement ends in a terminator (fallthrough/break/return/continue/trap)
- check that literals fit into the type they are stored into (optional?)
- check that all new variables are in the ``thread`` or ``threadgroup`` address space

Phase 3: Monomorphisation and late validation
---------------------------------------------

.. todo:: We shouldn't need to monomorphize

- monomorphisation itself
- resolving function calls (probably done as part of monomorphisation)
- checking no recursive functions (seems very hard to do before that step, as it requires resolving overloaded functions)
- allocating a unique store identifier to each function parameter and variable declaration
- annotating each array access with the stride used by that array type? If we do it here and not at runtime, then each assignment would also need a size annotation..
- checks of proper use of address spaces

Dynamic rules
=============

Definitions
-----------

We split the semantics in two parts: a per-thread execution semantics that does not know anything about concurrency or the memory, and a global set of rules for
loads, stores, barriers and the like.

The per-thread semantics is a fairly classic small-step operational semantics, meaning that it describes what a list of possible transitions that the program can
take in one step.
The per-thread state is made of a few element:

- The program being executed. Each transition transforms it.
- A control-flow stack. This is a stack of values, which tracks whether we are in a branch, and is used by the rules for barriers to check that control-flow is uniform.
- A (constant) environment. This is a mapping from variable names to values and is used to keep track of arguments and variables declared in the function.

Each transition is a statement of the form "With environment :math:`\rho`, if some conditions are respected, the program may be transformed into the following, modifing
the control-flow stack in the following way, and emitting the following memory events."

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
      #. Emit a store to the store identifier of the declaration, of a value that is either the initializing value (if available) or the default value for the type (otherwise)
      #. Remove this variable declaration from the block

#. Else reduce the first statement of the block, using the environment that the block was annotated with (not the top-level environment)

.. todo:: Specify this "default value for the type". It should be very simple (null for ptrs/refs, false for booleans, 0/0. for ints/floats, and the natural extension for arrays/structs).

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

Here is how to reduce a ``Join(s)`` statement:

#. If the argument of the ``Join`` is a terminator (``break;``, ``continue;``, ``fallthrough;``, ``return e?;`` or ``trap;``) or an empty block

   #. ASSERT(the control flow stack is not empty)
   #. Pop the last value from the control flow stack
   #. Replace the ``Join`` statement by its argument

#. Else reduce its argument

.. note:: Popping the last value from the control flow stack never fails, as a Join only appears when eliminating a branch, which pushes a value on it.

Switches
""""""""

We add another kind of statement: the ``Cases(..)`` construct that takes as argument a sequence of statements.
Informally it represents the different cases of a switch, and deals with the ``fallthrough;`` and ``break;`` statements.

Here is how to reduce a switch statement by one step:

#. If the expression in the switch can be reduced, reduce it by one step
#. Else if it is a value ``val`` and there is a ``case val:`` in the switch:

    #. Wrap the corresponding sequence of statements into a block (turning it into a single statement)
    #. Do the same for each sequence of statements until the end of the switch
    #. Replace the entire switch by a ``Cases`` construct, taking as argument these resulting statements in the program order

#. Else

   #. ASSERT(the expression in the switch is a value)
   #. ASSERT(there is a ``default:`` case in the switch)
   #. Find the ``default`` case, and wrap the corresponding sequence of statements into a block (turning it into a single statement)
   #. Do the same for each sequence of statements until the end of the switch
   #. Replace the entire switch by a ``Cases`` construct, taking as argument these resulting statements in the program order

.. todo:: define what a value is.

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

Loops
"""""

We add yet another kind of statement: the ``Loop(s, s')`` construct that takes as arguments a pair of statements.
Informally, its first argument represent the current iteration of a loop, and its second argument is a continuation for the rest of the loop.

Any ``do s while(e);`` statement is reduced to the following in one step: ``Loop(s, if(e) do s while(e); else {})``.

.. note:: while loops and for loops are desugared into do while loops, see the Parsing section.

Here is how to reduce a ``Loop(s, s')`` statement by one step:

#. If ``s`` is the ``break;`` statement, replace the whole construct by the empty block: ``{}``
#. Else if ``s`` is the empty block or the ``continue;`` statement, replace the whole construct by its second argument ``s'``
#. Else if ``s`` is another terminator (``fallthrough;``, ``return;``, ``return rval;`` or ``trap;``), replace the whole construct by it
#. Else reduce ``s`` by one step

Barriers and uniform control flow
"""""""""""""""""""""""""""""""""

There is no rule in the per-thread semantics for *control barriers*.
Instead, there is a rule in the global semantics, saying that if all threads are at a barrier instruction, and their control-flow stacks are identical, then they may all advance atomically, replacing the barrier by an empty block.

Other
"""""

.. todo:: Return reduce, and effectful expr.

Execution of expressions
------------------------

Memory model
------------

There are 4 address spaces:

#. global (read-write)
#. constant
#. threadgroup
#. thread

How do these interact with pointers? How can you have a pointer in one address space that points to a value in another address space?

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
| uint8     | An unsigned 8-bit integer.                                                     | 0, 1, 2, ... 255                                                                  |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| uint16    | An unsigned 16-bit integer.                                                    | 0, 1, 2, ... 65535                                                                |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| uint32    | An unsigned 32-bit integer.                                                    | 0, 1, 2, ... 4294967295                                                           |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| int8      | A signed 8-bit integer.                                                        | -128, -127, ... -1, 0, 1, ... 127                                                 |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| int16     |  A signed 16-bit integer.                                                      | -32768, -32767, ... -1, 0, 1, ... 32767                                           |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| int32     | A signed 32-bit integer.                                                       | -2147483648, -2147483647, ... -1, 0, 1, ... 2147483647                            |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| float16   | A 32-bit floating-point number.                                                | See below for details on representable values.                                    |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| float32   | A 32-bit floating-point number.                                                | See below for details on representable values.                                    |
+-----------+--------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+

In addition, the standard library includes some typedefs:

+---------------+----------------------------------------------+
| This new type | is defined to be equal to this existing type |
+===============+==============================================+
| int           | int32                                        |
+---------------+----------------------------------------------+
| uint          | uint32                                       |
+---------------+----------------------------------------------+
| short         | int16                                        |
+---------------+----------------------------------------------+
| ushort        | uint16                                       |
+---------------+----------------------------------------------+
| half          | float16                                      |
+---------------+----------------------------------------------+
| float         | float32                                      |
+---------------+----------------------------------------------+

.. Note:: The following types are not present in WSL: dword, min16float, min10float, min16int, min12int, min16uint, string, size_t, ptrdiff_t, double, float64, int64, uint64

Built-in aggregate types
""""""""""""""""""""""""

The following are vector types, which list the name of a scalar type and the number of elements in the
vector. Each item below includes two types, which are synonyms for each other.

* bool1, or vector<bool, 1>
* bool2, or vector<bool, 2>
* bool3, or vector<bool, 3>
* bool4, or vector<bool, 4>
* ushort1, or vector<ushort, 1>
* ushort2, or vector<ushort, 2>
* ushort3, or vector<ushort, 3>
* ushort4, or vector<ushort, 4>
* uint1, or vector<uint, 1>
* uint2, or vector<uint, 2>
* uint3, or vector<uint, 3>
* uint4, or vector<uint, 4>
* short1, or vector<short, 1>
* short2, or vector<short, 2>
* short3, or vector<short, 3>
* short4, or vector<short, 4>
* int1, or vector<int, 1>
* int2, or vector<int, 2>
* int3, or vector<int, 3>
* int4, or vector<int, 4>
* half1, or vector<half, 1>
* half2, or vector<half, 2>
* half3, or vector<half, 3>
* half4, or vector<half, 4>
* float1, or vector<float, 1>
* float2, or vector<float, 2>
* float3, or vector<float, 3>
* float4, or vector<float, 4>

The following are matrix types, which list the name of a scalar type, the number of columns, and the number
of rows, in that order. Each item below includes two types, which are synonyms for each other.

* half1x1, or matrix<half, 1, 1>
* half1x2, or matrix<half, 1, 2>
* half1x3, or matrix<half, 1, 3>
* half1x4, or matrix<half, 1, 4>
* half2x1, or matrix<half, 2, 1>
* half2x2, or matrix<half, 2, 2>
* half2x3, or matrix<half, 2, 3>
* half2x4, or matrix<half, 2, 4>
* half3x1, or matrix<half, 3, 1>
* half3x2, or matrix<half, 3, 2>
* half3x3, or matrix<half, 3, 3>
* half3x4, or matrix<half, 3, 4>
* half4x1, or matrix<half, 4, 1>
* half4x2, or matrix<half, 4, 2>
* half4x3, or matrix<half, 4, 3>
* half4x4, or matrix<half, 4, 4>
* float1x1, or matrix<float, 1, 1>
* float1x2, or matrix<float, 1, 2>
* float1x3, or matrix<float, 1, 3>
* float1x4, or matrix<float, 1, 4>
* float2x1, or matrix<float, 2, 1>
* float2x2, or matrix<float, 2, 2>
* float2x3, or matrix<float, 2, 3>
* float2x4, or matrix<float, 2, 4>
* float3x1, or matrix<float, 3, 1>
* float3x2, or matrix<float, 3, 2>
* float3x3, or matrix<float, 3, 3>
* float3x4, or matrix<float, 3, 4>
* float4x1, or matrix<float, 4, 1>
* float4x2, or matrix<float, 4, 2>
* float4x3, or matrix<float, 4, 3>
* float4x4, or matrix<float, 4, 4>

Samplers
""""""""

Samplers must only be passed into an entry point inside an argument. All samplers are immutable and must be
declared in the "constant" address space. There is no constructor for samplers; it is impossible to create
or destory one in WHLSL. The type is defined as ``native typedef sampler;``. Samplers are are impossible to
introspect. Arrays must not contain samplers anywhere inside them. Functions that return samplers must only
have one return point. Ternary expressions must not return references.

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
* TextureCubeArray<T>
* TextureDepth2D<S>
* TextureDepth2DArray<S>
* TextureDepthCube<S>
* TextureDepthCubeArray<S>

.. todo:: Texture2DMS<T>, TextureDepth2DMS<float>

Each of the above types accepts a "type argument". The "T" types above may be any scalar or vector type.
The "S" types above may be float, float1, float2, float3, or float4.

If the type argument, including the ``<>`` characters is missing, is is assumed to be ``float4``.

Textures must only be passed into an entry point inside an argument. Therefore, textures must only be declared
in either the ``constant`` or ``device`` address space. A texture declared in the ``constant`` address space
must never be modified. There is no constructor for textures; it is impossible to create or destroy one in WHLSL.
Arrays must not contain textures anywhere inside them. Functions that return textures must only have one return
point. Ternary expressions must not return references.

Pointers
""""""""

Pointers may be passed into an entry point inside an argument or created inside a function using the "&"
operator. No data arrived at via a ``constant`` pointer may be modified. ``device``, ``constant``, and
``threadgroup`` pointers must not point to data that may have pointers in it. Arrays must not contain pointers
anywhere inside them. Functions that return pointers must only have one return point. Ternary expressions must
not return pointers. Every construction of a pointer must be initialized upon declaration and never reassigned.

Array References
""""""""""""""""

Numerical Compliance
""""""""""""""""""""

Built-in Variables
------------------

Different for each shader stage

Represented by magic name?

Built-in Functions
------------------

Some of these functions only appear in specific shader stages.

We should figure out if atomic handling goes here.

Interface with JavaScript
=========================

Shaders are supplied to the Javascript WebGPU API as a single argument
which is understood to be of type 'DOMString'.

Indices and tables
##################

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
