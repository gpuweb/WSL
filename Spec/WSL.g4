grammar WSL;

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
FALLTHROUGH: 'fallthrough';
FOR: 'for';
WHILE: 'while';
DO: 'do';
RETURN: 'return';
TRAP: 'trap';

NULL: 'null';
TRUE: 'true';
FALSE: 'false';
// Note: We could make these three fully case sensitive or insensitive. to bikeshed.

CONSTANT: 'constant';
DEVICE: 'device';
THREADGROUP: 'threadgroup';
THREAD: 'thread';

VERTEX: 'vertex';
FRAGMENT: 'fragment';

NATIVE: 'native';
RESTRICTED: 'restricted';
// Note: these could be only keyword in the native mode, but I decided to make them always reserved. to bikeshed.

UNDERSCORE: '_';
AUTO: 'auto';
PROTOCOL: 'protocol';
CONST: 'const';
STATIC: 'static';
// Note: these are currently not used by the grammar, but I would like to make them reserved keywords for future expansion of the language. to bikeshed

Qualifier: 'nointerpolation' | 'noperspective' | 'uniform' | 'specialized' | 'centroid' | 'sample';

Semantics
    : 'SV_instanceID'
    | 'SV_vertexID'
    | 'PSIZE'
    | 'SV_Position'
    | 'SV_IsFrontFace'
    | 'SV_SampleIndex'
    | 'SV_InnerCoverage'
    | 'SV_Target' CoreDecimalIntLiteral?
    | 'SV_Depth'
    | 'SV_Coverage'
    | 'SV_DispatchThreadID'
    | 'SV_GroupID'
    | 'SV_GroupIndex'
    | 'SV_GroupThreadID'
    | 'attribute(' CoreDecimalIntLiteral ')'
    | 'register(' [utbcs] CoreDecimalIntLiteral ')'; 

fragment ValidIdentifier: [a-zA-Z_] [a-zA-Z0-9_]* ;
Identifier: ValidIdentifier ;
// Note: this currently excludes unicode, but allows digits in the middle of identifiers. We could easily restrict or extend this definition. to bikeshed

OperatorName
    : 'operator' ('>>' | '<<' | '+' | '-' | '*' | '/' | '%' | '&&' | '||' | '&' | '^' | '|' | '>=' | '<=' | '==' | '<' | '>' | '++' | '--' | '!' | '~' | '[]' | '[]=' | '&[]')
    | 'operator&.' ValidIdentifier
    | 'operator.' ValidIdentifier '='
    | 'operator.' ValidIdentifier ;
// Note: operator!= is not user-definable, it is automatically derived from operator==

/*
 * Parser: Top-level
 */
file: topLevelDecl* EOF ;
topLevelDecl
    : ';'
    | variableDecls ';'
    | typeDef
    | structDef
    | enumDef
    | funcDef
    | nativeFuncDecl
    | nativeTypeDecl;

typeDef: TYPEDEF Identifier '=' type ';' ;

structDef: STRUCT Identifier '{' structElement* '}' ;
structElement: Qualifier* type Identifier (':' Semantics)? ';' ;

enumDef: ENUM Identifier (':' type)? '{' enumMember (',' enumMember)* '}' ;
// Note: we could allow an extra ',' at the end of the list of enumMembers, ala Rust, to make it easier to reorder the members. to bikeshed
enumMember: Identifier ('=' constexpr)? ;

funcDef: RESTRICTED? funcDecl block;
funcDecl
    : (VERTEX | FRAGMENT) type Identifier parameters
    | type (Identifier | OperatorName) parameters
    | OPERATOR type parameters ;
// Note: the return type is moved in a different place for operator casts, as a hint that it plays a role in overload resolution. to bikeshed
parameters
    : '(' ')'
    | '(' parameter (',' parameter)* ')' ;
parameter: Qualifier* type Identifier? (':' Semantics)?;

nativeFuncDecl: RESTRICTED? NATIVE funcDecl ';' ;
nativeTypeDecl: NATIVE TYPEDEF Identifier typeArguments ';' ;

type
    : addressSpace Identifier typeArguments typeSuffixAbbreviated+
    | Identifier typeArguments typeSuffixNonAbbreviated* ;
addressSpace: CONSTANT | DEVICE | THREADGROUP | THREAD ;
typeSuffixAbbreviated: '*' | '[]' | '[' IntLiteral ']';
typeSuffixNonAbbreviated: '*' addressSpace | '[]' addressSpace | '[' IntLiteral ']' ;
// Note: in this formulation of typeSuffix*, we don't allow whitespace between the '[' and the ']' in '[]'. We easily could at the cost of a tiny more bit of lookahead. to bikeshed

typeArguments
    : '<' (typeArgument ',')* addressSpace? Identifier '<' (typeArgument (',' typeArgument)*)? '>>'
    // Note: this first alternative is a horrible hack to deal with nested generics that end with '>>'. As far as I can tell it works fine, but requires arbitrary lookahead.
    | '<' typeArgument (',' typeArgument)* '>'
    | ('<' '>')? ;
typeArgument: constexpr | type ;

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
    | FALLTHROUGH ';'
    | TRAP ';'
    | RETURN expr? ';'
    | variableDecls ';'
    | effectfulExpr ';' ;

ifStmt: IF '(' expr ')' stmt (ELSE stmt)? ;

switchStmt: SWITCH '(' expr ')' '{' switchCase* '}' ;
switchCase: (CASE constexpr | DEFAULT) ':' blockBody ;

forStmt: FOR '(' (variableDecls | effectfulExpr) ';' expr? ';' expr? ')' stmt ;
whileStmt: WHILE '(' expr ')' stmt ;
doStmt: DO stmt WHILE '(' expr ')' ;

variableDecls: type variableDecl (',' variableDecl)* ;
variableDecl: Qualifier* Identifier (':' Semantics)? ('=' expr)? ;

/* 
 * Parser: Expressions
 */
constexpr
    : literal 
    | Identifier // to get the (constexpr) value of a type variable
    | Identifier '.' Identifier; // to get a value out of an enum

// Note: we separate effectful expressions from normal expressions, and only allow the former in statement positions, to disambiguate the following:
// "x * y;". Without this trick, it would look like both an expression and a variable declaration, and could not be disambiguated until name resolution.
effectfulExpr: ((effAssignment ',')* effAssignment)? ; 
effAssignment
    : possiblePrefix assignOperator possibleTernaryConditional
    | effPrefix ;
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
callExpression: Identifier typeArguments '(' (possibleTernaryConditional (',' possibleTernaryConditional)*)? ')';
term
    : literal
    | Identifier
    | '(' expr ')' ;

literal: IntLiteral | FloatLiteral | NULL | TRUE | FALSE;

