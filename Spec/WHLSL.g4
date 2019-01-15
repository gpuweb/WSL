grammar WHLSL;

/*
 * Lexer
 */
Whitespace: [ \t\r\n]+ -> skip ;
LineComment: '//'~[\r\n]* -> skip ;
LongComment: '/*'.*?'*/' -> skip ;

// Note: we forbid leading 0s in decimal integers. to bikeshed.
fragment CoreDecimalIntLiteral: '0' | ([1-9] [0-9]*);
// Note: we allow a leading '-' but not a leading '+' in all kind of numeric literals. to bikeshed.
fragment DecimalIntLiteral: '-'? CoreDecimalIntLiteral ;
fragment DecimalUIntLiteral: CoreDecimalIntLiteral 'u' ;
fragment CoreHexadecimalIntLiteral: '0x' [0-9a-fA-F]+ ;
fragment HexadecimalIntLiteral: '-'? CoreHexadecimalIntLiteral;
fragment HexadecimalUIntLiteral: CoreHexadecimalIntLiteral 'u';
// There are currently no places that only accept one of ints or uints, but not both. Therefore, we can treat them identically.
IntLiteral: DecimalIntLiteral | DecimalUIntLiteral | HexadecimalIntLiteral | HexadecimalUIntLiteral ;
// Do we want to allow underscores in the middle of numbers for readability?

fragment CoreFloatLiteral: [0-9]+'.'[0-9]* | [0-9]*'.'[0-9]+ ;
FloatLiteral: '-'? CoreFloatLiteral [fd]? ;
// TODO: what to do about floats that are too big or too small to represent?
// TODO: what is the default precision? double?
// IDEA: add Nan, +infinity, -infinity
// IDEA: add half-precision literals

// One rule per keyword, to prevent them from being recognized as identifiers
STRUCT: 'struct';
TYPEDEF: 'typedef';
ENUM: 'enum';
OPERATOR: 'operator';

IF: 'if';
ELSE: 'else';
CONTINUE: 'continue';
BREAK: 'break';
SWITCH: 'switch';
CASE: 'case';
DEFAULT: 'default';
FALLTHROUGHKEYWORD: 'fallthrough';
FOR: 'for';
WHILE: 'while';
DO: 'do';
RETURN: 'return';
TRAP: 'trap';

NULLKEYWORD: 'null';
TRUEKEYWORD: 'true';
FALSEKEYWORD: 'false';
// Note: We could make these three fully case sensitive or insensitive. to bikeshed.

CONSTANT: 'constant';
DEVICE: 'device';
THREADGROUP: 'threadgroup';
THREAD: 'thread';

VERTEX: 'vertex';
FRAGMENT: 'fragment';
COMPUTE: 'compute';
NUMTHREADS: 'numthreads';

SVINSTANCEID: 'SV_InstanceID';
SVVERTEXID: 'SV_VertexID';
PSIZE: 'PSIZE';
SVPOSITION: 'SV_Position';
SVISFRONTFACE: 'SV_IsFrontFace';
SVSAMPLEINDEX: 'SV_SampleIndex';
SVINNERCOVERAGE: 'SV_InnerCoverage';
SVTARGET: 'SV_Target';
SVDEPTH: 'SV_Depth';
SVCOVERAGE: 'SV_Coverage';
SVDISPATCHTHREADID: 'SV_DispatchThreadID';
SVGROUPID: 'SV_GroupID';
SVGROUPINDEX: 'SV_GroupIndex';
SVGROUPTHREADID: 'SV_GroupThreadID';
ATTRIBUTE: 'attribute';
REGISTER: 'register';
SPECIALIZED: 'specialized';

UNDERSCORE: '_';
AUTO: 'auto';
PROTOCOL: 'protocol';
CONST: 'const';
STATIC: 'static';
NATIVE: 'native';
RESTRICTED: 'restricted';
SPACEKEYWORD: 'space';
// Note: these are currently not used by the grammar, but I would like to make them reserved keywords for future expansion of the language. to bikeshed

Qualifier: 'nointerpolation' | 'noperspective' | 'uniform' | 'centroid' | 'sample';

fragment ValidIdentifier: [a-zA-Z_] [a-zA-Z0-9_]* ;
Identifier: ValidIdentifier ;
// Note: this currently excludes unicode, but allows digits in the middle of identifiers. We could easily restrict or extend this definition. to bikeshed

OperatorName
    : 'operator' ('>>' | '<<' | '+' | '-' | '*' | '/' | '%' | '&&' | '||' | '&' | '^' | '|' | '>=' | '<=' | '==' | '!=' | '<' | '>' | '++' | '--' | '!' | '~' | '[]' | '[]=' | '&[]')
    | 'operator&.' ValidIdentifier
    | 'operator.' ValidIdentifier '='
    | 'operator.' ValidIdentifier ;

/*
 * Parser: Top-level
 */
file: topLevelDecl* EOF ;
topLevelDecl
    : ';'
    | typeDef
    | structDef
    | enumDef
    | funcDef;

semantic
    : builtInSemantic
    | stageInOutSemantic
    | resourceSemantic
    | specializationConstantSemantic;

builtInSemantic
    : SVINSTANCEID
    | SVVERTEXID
    | PSIZE
    | SVPOSITION
    | SVISFRONTFACE
    | SVSAMPLEINDEX
    | SVINNERCOVERAGE
    | SVTARGET IntLiteral
    | SVDEPTH
    | SVCOVERAGE
    | SVDISPATCHTHREADID
    | SVGROUPID
    | SVGROUPINDEX
    | SVGROUPTHREADID;

stageInOutSemantic: ATTRIBUTE '(' IntLiteral ')';

resourceSemantic: REGISTER '(' Identifier (',' Identifier)? ')';

specializationConstantSemantic: SPECIALIZED;

typeDef: TYPEDEF Identifier '=' type ';' ;

structDef: STRUCT Identifier '{' structElement* '}' ;
structElement: Qualifier* type Identifier (':' semantic)? ';' ;

enumDef: ENUM Identifier (':' type)? '{' enumMember (',' enumMember)* '}' ;
// Note: we could allow an extra ',' at the end of the list of enumMembers, ala Rust, to make it easier to reorder the members. to bikeshed
enumMember: Identifier ('=' constexpression)? ;

numthreadsSemantic: NUMTHREADS '(' IntLiteral ',' IntLiteral ',' IntLiteral ')' ;

funcDef: RESTRICTED? funcDecl block;
funcDecl
    : (VERTEX | FRAGMENT | ('[' numthreadsSemantic ']' COMPUTE)) type Identifier parameters (':' semantic)?
    | type (Identifier | OperatorName) parameters (':' semantic)?
    | OPERATOR type parameters (':' semantic)? ;

// Note: the return type is moved in a different place for operator casts, as a hint that it plays a role in overload resolution. to bikeshed
parameters
    : '(' ')'
    | '(' parameter (',' parameter)* ')' ;
parameter: Qualifier* type Identifier? (':' semantic)?;

type
    : addressSpace Identifier typeArguments typeSuffixAbbreviated+
    | Identifier typeArguments typeSuffixNonAbbreviated* ;
addressSpace: CONSTANT | DEVICE | THREADGROUP | THREAD ;
typeSuffixAbbreviated: '*' | '[]' | '[' IntLiteral ']';
typeSuffixNonAbbreviated: '*' addressSpace | '[]' addressSpace | '[' IntLiteral ']' ;
// Note: in this formulation of typeSuffix*, we don't allow whitespace between the '[' and the ']' in '[]'. We easily could at the cost of a tiny more bit of lookahead. to bikeshed

typeArguments
    | '<' typeArgument (',' typeArgument)* '>'
    | ('<' '>')? ;
typeArgument: constexpression | Identifier ;

/* 
 * Parser: Statements 
 */
block: '{' blockBody '}' ;
blockBody: stmt* ;

stmt
    : block
    | ifStmt
    | switchStmt
    | forStmt
    | whileStmt
    | doStmt ';'
    | BREAK ';'
    | CONTINUE ';'
    | FALLTHROUGHKEYWORD ';'
    | TRAP ';'
    | RETURN expr? ';'
    | variableDecls ';'
    | effectfulExpr ';' ;

ifStmt: IF '(' expr ')' stmt (ELSE stmt)? ;

switchStmt: SWITCH '(' expr ')' '{' switchCase* '}' ;
switchCase: (CASE constexpression | DEFAULT) ':' blockBody ;

forStmt: FOR '(' (variableDecls | effectfulExpr) ';' expr? ';' expr? ')' stmt ;
whileStmt: WHILE '(' expr ')' stmt ;
doStmt: DO stmt WHILE '(' expr ')' ;

variableDecls: type variableDecl (',' variableDecl)* ;
variableDecl: Qualifier* Identifier (':' semantic)? ('=' expr)? ;

/* 
 * Parser: Expressions
 */
constexpression
    : literal 
    | Identifier '.' Identifier; // to get a value out of an enum

// Note: we separate effectful expressions from normal expressions, and only allow the former in statement positions, to disambiguate the following:
// "x * y;". Without this trick, it would look like both an expression and a variable declaration, and could not be disambiguated until name resolution.
effectfulExpr: ((effAssignment ',')* effAssignment)? ; 
effAssignment
    : possiblePrefix assignOperator possibleTernaryConditional
    | effPrefix
    | callExpression ;
assignOperator: '=' | '+=' | '-=' | '*=' | '/=' | '%=' | '^=' | '&=' | '|=' | '>>=' | '<<=' ;
effPrefix
    : ('++' | '--') possiblePrefix
    | effSuffix ;
effSuffix
    : possibleSuffix ('++' | '--')
    | callExpression
    | '(' expr ')' ;
// Note: this last case is to allow craziness like "(x < y ? z += 42 : w += 13);" 
// TODO: Not sure at all how useful it is, I also still have to double check that it introduces no ambiguity.
limitedSuffixOperator
    : '.' Identifier 
    | '->' Identifier 
    | '[' expr ']' ;

expr: (possibleTernaryConditional ',')* possibleTernaryConditional;
// TODO: I tried to mimic https://en.cppreference.com/w/cpp/language/operator_precedence with regards to assignment and ternary conditionals, but it still needs some testing
possibleTernaryConditional
    : possibleLogicalBinop '?' expr ':' possibleTernaryConditional
    | possiblePrefix assignOperator possibleTernaryConditional
    | possibleLogicalBinop ;
possibleLogicalBinop: possibleRelationalBinop (logicalBinop possibleRelationalBinop)*;
logicalBinop: '||' | '&&' | '|' | '^' | '&' ;
// Note: the list above may need some manipulation to get the proper left-to-right associativity
possibleRelationalBinop: possibleShift (relationalBinop possibleShift)?;
relationalBinop: '<' | '>' | '<=' | '>=' | '==' | '!=' ; 
// Note: we made relational binops non-associative to better disambiguate "x<y>(z)" into a call expression and not a comparison of comparison
// Idea: https://en.cppreference.com/w/cpp/language/operator_comparison#Three-way_comparison
possibleShift: possibleAdd (('>>' | '<<') possibleAdd)* ;
possibleAdd: possibleMult (('+' | '-') possibleMult)* ;
possibleMult: possiblePrefix (('*' | '/' | '%') possiblePrefix)* ;
possiblePrefix: prefixOp* possibleSuffix ;
prefixOp: '++' | '--' | '+' | '-' | '~' | '!' | '&' | '@' | '*' ;
possibleSuffix
    : callExpression limitedSuffixOperator*
    | term (limitedSuffixOperator | '++' | '--')* ;
callExpression: Identifier '(' (possibleTernaryConditional (',' possibleTernaryConditional)*)? ')';
term
    : literal
    | Identifier
    | '(' expr ')' ;

literal: IntLiteral | FloatLiteral | NULLKEYWORD | TRUEKEYWORD | FALSEKEYWORD;

