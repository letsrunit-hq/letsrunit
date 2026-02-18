import { explore, generate } from '@letsrunit/executor';
import runTest from '@letsrunit/executor/src/run-test';
import 'node:crypto';
import * as fs from 'node:fs/promises';
import fs__default, { writeFile } from 'node:fs/promises';
import process$1 from 'node:process';
import { Command } from 'commander';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			var isInstance = false;
      try {
        isInstance = this instanceof a;
      } catch {}
			if (isInstance) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var src$1 = {};

var generateMessages = {};

var Parser$1 = {};

var Errors = {};

var hasRequiredErrors;

function requireErrors () {
	if (hasRequiredErrors) return Errors;
	hasRequiredErrors = 1;
	Object.defineProperty(Errors, "__esModule", { value: true });
	Errors.NoSuchLanguageException = Errors.AstBuilderException = Errors.CompositeParserException = Errors.ParserException = Errors.GherkinException = void 0;
	class GherkinException extends Error {
	    constructor(message) {
	        super(message);
	        const actualProto = new.target.prototype;
	        // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
	        if (Object.setPrototypeOf) {
	            Object.setPrototypeOf(this, actualProto);
	        }
	        else {
	            // @ts-ignore
	            this.__proto__ = actualProto;
	        }
	    }
	    static _create(message, location) {
	        const column = location != null ? location.column || 0 : -1;
	        const line = location != null ? location.line || 0 : -1;
	        const m = `(${line}:${column}): ${message}`;
	        const err = new this(m);
	        err.location = location;
	        return err;
	    }
	}
	Errors.GherkinException = GherkinException;
	class ParserException extends GherkinException {
	    static create(message, line, column) {
	        const err = new this(`(${line}:${column}): ${message}`);
	        err.location = { line, column };
	        return err;
	    }
	}
	Errors.ParserException = ParserException;
	class CompositeParserException extends GherkinException {
	    static create(errors) {
	        const message = 'Parser errors:\n' + errors.map((e) => e.message).join('\n');
	        const err = new this(message);
	        err.errors = errors;
	        return err;
	    }
	}
	Errors.CompositeParserException = CompositeParserException;
	class AstBuilderException extends GherkinException {
	    static create(message, location) {
	        return this._create(message, location);
	    }
	}
	Errors.AstBuilderException = AstBuilderException;
	class NoSuchLanguageException extends GherkinException {
	    static create(language, location) {
	        const message = 'Language not supported: ' + language;
	        return this._create(message, location);
	    }
	}
	Errors.NoSuchLanguageException = NoSuchLanguageException;
	
	return Errors;
}

var TokenExceptions = {};

var hasRequiredTokenExceptions;

function requireTokenExceptions () {
	if (hasRequiredTokenExceptions) return TokenExceptions;
	hasRequiredTokenExceptions = 1;
	Object.defineProperty(TokenExceptions, "__esModule", { value: true });
	TokenExceptions.UnexpectedEOFException = TokenExceptions.UnexpectedTokenException = void 0;
	const Errors_1 = requireErrors();
	class UnexpectedTokenException extends Errors_1.GherkinException {
	    static create(token, expectedTokenTypes) {
	        const message = `expected: ${expectedTokenTypes.join(', ')}, got '${token
	            .getTokenValue()
	            .trim()}'`;
	        const location = tokenLocation(token);
	        return this._create(message, location);
	    }
	}
	TokenExceptions.UnexpectedTokenException = UnexpectedTokenException;
	class UnexpectedEOFException extends Errors_1.GherkinException {
	    static create(token, expectedTokenTypes) {
	        const message = `unexpected end of file, expected: ${expectedTokenTypes.join(', ')}`;
	        const location = tokenLocation(token);
	        return this._create(message, location);
	    }
	}
	TokenExceptions.UnexpectedEOFException = UnexpectedEOFException;
	function tokenLocation(token) {
	    return token.location && token.location.line && token.line && token.line.indent !== undefined
	        ? {
	            line: token.location.line,
	            column: token.line.indent + 1,
	        }
	        : token.location;
	}
	
	return TokenExceptions;
}

var TokenScanner = {};

var hasRequiredTokenScanner;

function requireTokenScanner () {
	if (hasRequiredTokenScanner) return TokenScanner;
	hasRequiredTokenScanner = 1;
	Object.defineProperty(TokenScanner, "__esModule", { value: true });
	/**
	 * The scanner reads a gherkin doc (typically read from a .feature file) and creates a token for each line.
	 * The tokens are passed to the parser, which outputs an AST (Abstract Syntax Tree).
	 *
	 * If the scanner sees a `#` language header, it will reconfigure itself dynamically to look for
	 * Gherkin keywords for the associated language. The keywords are defined in gherkin-languages.json.
	 */
	let TokenScanner$1 = class TokenScanner {
	    constructor(source, makeToken) {
	        this.makeToken = makeToken;
	        this.lineNumber = 0;
	        this.lines = source.split(/\r?\n/);
	        if (this.lines.length > 0 && this.lines[this.lines.length - 1].trim() === '') {
	            this.lines.pop();
	        }
	    }
	    read() {
	        const line = this.lines[this.lineNumber++];
	        const location = {
	            line: this.lineNumber,
	        };
	        return this.makeToken(line, location);
	    }
	};
	TokenScanner.default = TokenScanner$1;
	
	return TokenScanner;
}

var GherkinLine = {exports: {}};

var countSymbols = {};

var hasRequiredCountSymbols;

function requireCountSymbols () {
	if (hasRequiredCountSymbols) return countSymbols;
	hasRequiredCountSymbols = 1;
	Object.defineProperty(countSymbols, "__esModule", { value: true });
	countSymbols.default = countSymbols$1;
	// https://mathiasbynens.be/notes/javascript-unicode
	const regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
	function countSymbols$1(s) {
	    return s.replace(regexAstralSymbols, '_').length;
	}
	
	return countSymbols;
}

var GherkinLine_1 = GherkinLine.exports;

var hasRequiredGherkinLine;

function requireGherkinLine () {
	if (hasRequiredGherkinLine) return GherkinLine.exports;
	hasRequiredGherkinLine = 1;
	(function (module, exports$1) {
		var __importDefault = (GherkinLine_1 && GherkinLine_1.__importDefault) || function (mod) {
		    return (mod && mod.__esModule) ? mod : { "default": mod };
		};
		Object.defineProperty(exports$1, "__esModule", { value: true });
		const countSymbols_1 = __importDefault(requireCountSymbols());
		class GherkinLine {
		    constructor(lineText, lineNumber) {
		        this.lineText = lineText;
		        this.lineNumber = lineNumber;
		        this.trimmedLineText = lineText.replace(/^\s+/g, ''); // ltrim
		        this.isEmpty = this.trimmedLineText.length === 0;
		        this.indent = (0, countSymbols_1.default)(lineText) - (0, countSymbols_1.default)(this.trimmedLineText);
		    }
		    startsWith(prefix) {
		        return this.trimmedLineText.indexOf(prefix) === 0;
		    }
		    startsWithTitleKeyword(keyword) {
		        return this.startsWith(keyword + ':'); // The C# impl is more complicated. Find out why.
		    }
		    match(regexp) {
		        return this.trimmedLineText.match(regexp);
		    }
		    getLineText(indentToRemove) {
		        if (indentToRemove < 0 || indentToRemove > this.indent) {
		            return this.trimmedLineText;
		        }
		        else {
		            return this.lineText.substring(indentToRemove);
		        }
		    }
		    getRestTrimmed(length) {
		        return this.trimmedLineText.substring(length).trim();
		    }
		    getTableCells() {
		        const cells = [];
		        let col = 0;
		        let startCol = col + 1;
		        let cell = '';
		        let firstCell = true;
		        while (col < this.trimmedLineText.length) {
		            let chr = this.trimmedLineText[col];
		            col++;
		            if (chr === '|') {
		                if (firstCell) {
		                    // First cell (content before the first |) is skipped
		                    firstCell = false;
		                }
		                else {
		                    // Keeps newlines
		                    const trimmedLeft = cell.replace(/^[ \t\v\f\r\u0085\u00A0]*/g, '');
		                    const trimmed = trimmedLeft.replace(/[ \t\v\f\r\u0085\u00A0]*$/g, '');
		                    const cellIndent = cell.length - trimmedLeft.length;
		                    const span = {
		                        column: this.indent + startCol + cellIndent,
		                        text: trimmed,
		                    };
		                    cells.push(span);
		                }
		                cell = '';
		                startCol = col + 1;
		            }
		            else if (chr === '\\') {
		                chr = this.trimmedLineText[col];
		                col += 1;
		                if (chr === 'n') {
		                    cell += '\n';
		                }
		                else {
		                    if (chr !== '|' && chr !== '\\') {
		                        cell += '\\';
		                    }
		                    cell += chr;
		                }
		            }
		            else {
		                cell += chr;
		            }
		        }
		        return cells;
		    }
		}
		exports$1.default = GherkinLine;
		module.exports = GherkinLine;
		
	} (GherkinLine, GherkinLine.exports));
	return GherkinLine.exports;
}

var hasRequiredParser;

function requireParser () {
	if (hasRequiredParser) return Parser$1;
	hasRequiredParser = 1;
	// This file is generated. Do not edit! Edit gherkin-javascript.razor instead.
	var __importDefault = (Parser$1 && Parser$1.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(Parser$1, "__esModule", { value: true });
	Parser$1.RuleType = Parser$1.TokenType = Parser$1.Token = void 0;
	const Errors_1 = requireErrors();
	const TokenExceptions_1 = requireTokenExceptions();
	const TokenScanner_1 = __importDefault(requireTokenScanner());
	const GherkinLine_1 = __importDefault(requireGherkinLine());
	class Token {
	    constructor(line, location) {
	        this.line = line;
	        this.location = location;
	        this.isEof = !line;
	    }
	    getTokenValue() {
	        return this.isEof ? 'EOF' : this.line.getLineText(-1);
	    }
	    detach() {
	        // TODO: Detach line, but is this really needed?
	    }
	}
	Parser$1.Token = Token;
	var TokenType;
	(function (TokenType) {
	    TokenType[TokenType["None"] = 0] = "None";
	    TokenType[TokenType["EOF"] = 1] = "EOF";
	    TokenType[TokenType["Empty"] = 2] = "Empty";
	    TokenType[TokenType["Comment"] = 3] = "Comment";
	    TokenType[TokenType["TagLine"] = 4] = "TagLine";
	    TokenType[TokenType["FeatureLine"] = 5] = "FeatureLine";
	    TokenType[TokenType["RuleLine"] = 6] = "RuleLine";
	    TokenType[TokenType["BackgroundLine"] = 7] = "BackgroundLine";
	    TokenType[TokenType["ScenarioLine"] = 8] = "ScenarioLine";
	    TokenType[TokenType["ExamplesLine"] = 9] = "ExamplesLine";
	    TokenType[TokenType["StepLine"] = 10] = "StepLine";
	    TokenType[TokenType["DocStringSeparator"] = 11] = "DocStringSeparator";
	    TokenType[TokenType["TableRow"] = 12] = "TableRow";
	    TokenType[TokenType["Language"] = 13] = "Language";
	    TokenType[TokenType["Other"] = 14] = "Other";
	})(TokenType || (Parser$1.TokenType = TokenType = {}));
	var RuleType;
	(function (RuleType) {
	    RuleType[RuleType["None"] = 0] = "None";
	    RuleType[RuleType["_EOF"] = 1] = "_EOF";
	    RuleType[RuleType["_Empty"] = 2] = "_Empty";
	    RuleType[RuleType["_Comment"] = 3] = "_Comment";
	    RuleType[RuleType["_TagLine"] = 4] = "_TagLine";
	    RuleType[RuleType["_FeatureLine"] = 5] = "_FeatureLine";
	    RuleType[RuleType["_RuleLine"] = 6] = "_RuleLine";
	    RuleType[RuleType["_BackgroundLine"] = 7] = "_BackgroundLine";
	    RuleType[RuleType["_ScenarioLine"] = 8] = "_ScenarioLine";
	    RuleType[RuleType["_ExamplesLine"] = 9] = "_ExamplesLine";
	    RuleType[RuleType["_StepLine"] = 10] = "_StepLine";
	    RuleType[RuleType["_DocStringSeparator"] = 11] = "_DocStringSeparator";
	    RuleType[RuleType["_TableRow"] = 12] = "_TableRow";
	    RuleType[RuleType["_Language"] = 13] = "_Language";
	    RuleType[RuleType["_Other"] = 14] = "_Other";
	    RuleType[RuleType["GherkinDocument"] = 15] = "GherkinDocument";
	    RuleType[RuleType["Feature"] = 16] = "Feature";
	    RuleType[RuleType["FeatureHeader"] = 17] = "FeatureHeader";
	    RuleType[RuleType["Rule"] = 18] = "Rule";
	    RuleType[RuleType["RuleHeader"] = 19] = "RuleHeader";
	    RuleType[RuleType["Background"] = 20] = "Background";
	    RuleType[RuleType["ScenarioDefinition"] = 21] = "ScenarioDefinition";
	    RuleType[RuleType["Scenario"] = 22] = "Scenario";
	    RuleType[RuleType["ExamplesDefinition"] = 23] = "ExamplesDefinition";
	    RuleType[RuleType["Examples"] = 24] = "Examples";
	    RuleType[RuleType["ExamplesTable"] = 25] = "ExamplesTable";
	    RuleType[RuleType["Step"] = 26] = "Step";
	    RuleType[RuleType["StepArg"] = 27] = "StepArg";
	    RuleType[RuleType["DataTable"] = 28] = "DataTable";
	    RuleType[RuleType["DocString"] = 29] = "DocString";
	    RuleType[RuleType["Tags"] = 30] = "Tags";
	    RuleType[RuleType["DescriptionHelper"] = 31] = "DescriptionHelper";
	    RuleType[RuleType["Description"] = 32] = "Description";
	})(RuleType || (Parser$1.RuleType = RuleType = {}));
	class Parser {
	    constructor(builder, tokenMatcher) {
	        this.builder = builder;
	        this.tokenMatcher = tokenMatcher;
	        this.stopAtFirstError = false;
	    }
	    parse(gherkinSource) {
	        const tokenScanner = new TokenScanner_1.default(gherkinSource, (line, location) => {
	            const gherkinLine = line === null || line === undefined
	                ? null
	                : new GherkinLine_1.default(line, location.line);
	            return new Token(gherkinLine, location);
	        });
	        this.builder.reset();
	        this.tokenMatcher.reset();
	        this.context = {
	            tokenScanner,
	            tokenQueue: [],
	            errors: [],
	        };
	        this.startRule(this.context, RuleType.GherkinDocument);
	        let state = 0;
	        let token = null;
	        while (true) {
	            token = this.readToken(this.context);
	            state = this.matchToken(state, token, this.context);
	            if (token.isEof)
	                break;
	        }
	        this.endRule(this.context);
	        if (this.context.errors.length > 0) {
	            throw Errors_1.CompositeParserException.create(this.context.errors);
	        }
	        return this.getResult();
	    }
	    addError(context, error) {
	        if (!context.errors.map(e => { return e.message; }).includes(error.message)) {
	            context.errors.push(error);
	            if (context.errors.length > 10)
	                throw Errors_1.CompositeParserException.create(context.errors);
	        }
	    }
	    startRule(context, ruleType) {
	        this.handleAstError(context, () => this.builder.startRule(ruleType));
	    }
	    endRule(context) {
	        this.handleAstError(context, () => this.builder.endRule());
	    }
	    build(context, token) {
	        this.handleAstError(context, () => this.builder.build(token));
	    }
	    getResult() {
	        return this.builder.getResult();
	    }
	    handleAstError(context, action) {
	        this.handleExternalError(context, true, action);
	    }
	    handleExternalError(context, defaultValue, action) {
	        if (this.stopAtFirstError)
	            return action();
	        try {
	            return action();
	        }
	        catch (e) {
	            if (e instanceof Errors_1.CompositeParserException) {
	                e.errors.forEach((error) => this.addError(context, error));
	            }
	            else if (e instanceof Errors_1.ParserException ||
	                e instanceof Errors_1.AstBuilderException ||
	                e instanceof TokenExceptions_1.UnexpectedTokenException ||
	                e instanceof Errors_1.NoSuchLanguageException) {
	                this.addError(context, e);
	            }
	            else {
	                throw e;
	            }
	        }
	        return defaultValue;
	    }
	    readToken(context) {
	        return context.tokenQueue.length > 0
	            ? context.tokenQueue.shift()
	            : context.tokenScanner.read();
	    }
	    matchToken(state, token, context) {
	        switch (state) {
	            case 0:
	                return this.matchTokenAt_0(token, context);
	            case 1:
	                return this.matchTokenAt_1(token, context);
	            case 2:
	                return this.matchTokenAt_2(token, context);
	            case 3:
	                return this.matchTokenAt_3(token, context);
	            case 4:
	                return this.matchTokenAt_4(token, context);
	            case 5:
	                return this.matchTokenAt_5(token, context);
	            case 6:
	                return this.matchTokenAt_6(token, context);
	            case 7:
	                return this.matchTokenAt_7(token, context);
	            case 8:
	                return this.matchTokenAt_8(token, context);
	            case 9:
	                return this.matchTokenAt_9(token, context);
	            case 10:
	                return this.matchTokenAt_10(token, context);
	            case 11:
	                return this.matchTokenAt_11(token, context);
	            case 12:
	                return this.matchTokenAt_12(token, context);
	            case 13:
	                return this.matchTokenAt_13(token, context);
	            case 14:
	                return this.matchTokenAt_14(token, context);
	            case 15:
	                return this.matchTokenAt_15(token, context);
	            case 16:
	                return this.matchTokenAt_16(token, context);
	            case 17:
	                return this.matchTokenAt_17(token, context);
	            case 18:
	                return this.matchTokenAt_18(token, context);
	            case 19:
	                return this.matchTokenAt_19(token, context);
	            case 20:
	                return this.matchTokenAt_20(token, context);
	            case 21:
	                return this.matchTokenAt_21(token, context);
	            case 22:
	                return this.matchTokenAt_22(token, context);
	            case 23:
	                return this.matchTokenAt_23(token, context);
	            case 24:
	                return this.matchTokenAt_24(token, context);
	            case 25:
	                return this.matchTokenAt_25(token, context);
	            case 26:
	                return this.matchTokenAt_26(token, context);
	            case 27:
	                return this.matchTokenAt_27(token, context);
	            case 28:
	                return this.matchTokenAt_28(token, context);
	            case 29:
	                return this.matchTokenAt_29(token, context);
	            case 30:
	                return this.matchTokenAt_30(token, context);
	            case 31:
	                return this.matchTokenAt_31(token, context);
	            case 32:
	                return this.matchTokenAt_32(token, context);
	            case 33:
	                return this.matchTokenAt_33(token, context);
	            case 35:
	                return this.matchTokenAt_35(token, context);
	            case 36:
	                return this.matchTokenAt_36(token, context);
	            case 37:
	                return this.matchTokenAt_37(token, context);
	            case 38:
	                return this.matchTokenAt_38(token, context);
	            case 39:
	                return this.matchTokenAt_39(token, context);
	            case 40:
	                return this.matchTokenAt_40(token, context);
	            case 41:
	                return this.matchTokenAt_41(token, context);
	            case 42:
	                return this.matchTokenAt_42(token, context);
	            default:
	                throw new Error("Unknown state: " + state);
	        }
	    }
	    // Start
	    matchTokenAt_0(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Language(context, token)) {
	            this.startRule(context, RuleType.Feature);
	            this.startRule(context, RuleType.FeatureHeader);
	            this.build(context, token);
	            return 1;
	        }
	        if (this.match_TagLine(context, token)) {
	            this.startRule(context, RuleType.Feature);
	            this.startRule(context, RuleType.FeatureHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 2;
	        }
	        if (this.match_FeatureLine(context, token)) {
	            this.startRule(context, RuleType.Feature);
	            this.startRule(context, RuleType.FeatureHeader);
	            this.build(context, token);
	            return 3;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 0;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 0;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Language", "#TagLine", "#FeatureLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 0;
	    }
	    // GherkinDocument:0>Feature:0>FeatureHeader:0>#Language:0
	    matchTokenAt_1(token, context) {
	        if (this.match_TagLine(context, token)) {
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 2;
	        }
	        if (this.match_FeatureLine(context, token)) {
	            this.build(context, token);
	            return 3;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 1;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 1;
	        }
	        token.detach();
	        const expectedTokens = ["#TagLine", "#FeatureLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 1;
	    }
	    // GherkinDocument:0>Feature:0>FeatureHeader:1>Tags:0>#TagLine:0
	    matchTokenAt_2(token, context) {
	        if (this.match_TagLine(context, token)) {
	            this.build(context, token);
	            return 2;
	        }
	        if (this.match_FeatureLine(context, token)) {
	            this.endRule(context);
	            this.build(context, token);
	            return 3;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 2;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 2;
	        }
	        token.detach();
	        const expectedTokens = ["#TagLine", "#FeatureLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 2;
	    }
	    // GherkinDocument:0>Feature:0>FeatureHeader:2>#FeatureLine:0
	    matchTokenAt_3(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 3;
	        }
	        if (this.match_Comment(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 4;
	        }
	        if (this.match_BackgroundLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Background);
	            this.build(context, token);
	            return 5;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 4;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Empty", "#Comment", "#BackgroundLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 3;
	    }
	    // GherkinDocument:0>Feature:0>FeatureHeader:3>DescriptionHelper:1>Description:0>__alt1:0>#Other:0
	    matchTokenAt_4(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 4;
	        }
	        if (this.match_BackgroundLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Background);
	            this.build(context, token);
	            return 5;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.build(context, token);
	            return 4;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Comment", "#BackgroundLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 4;
	    }
	    // GherkinDocument:0>Feature:1>Background:0>#BackgroundLine:0
	    matchTokenAt_5(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 5;
	        }
	        if (this.match_Comment(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 6;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 7;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 6;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Empty", "#Comment", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 5;
	    }
	    // GherkinDocument:0>Feature:1>Background:1>DescriptionHelper:1>Description:0>__alt1:0>#Other:0
	    matchTokenAt_6(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 6;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 7;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.build(context, token);
	            return 6;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Comment", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 6;
	    }
	    // GherkinDocument:0>Feature:1>Background:2>Step:0>#StepLine:0
	    matchTokenAt_7(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.startRule(context, RuleType.DataTable);
	            this.build(context, token);
	            return 8;
	        }
	        if (this.match_DocStringSeparator(context, token)) {
	            this.startRule(context, RuleType.DocString);
	            this.build(context, token);
	            return 41;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 7;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 7;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 7;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#TableRow", "#DocStringSeparator", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 7;
	    }
	    // GherkinDocument:0>Feature:1>Background:2>Step:1>StepArg:0>__alt0:0>DataTable:0>#TableRow:0
	    matchTokenAt_8(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.build(context, token);
	            return 8;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 7;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 8;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 8;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#TableRow", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 8;
	    }
	    // GherkinDocument:0>Feature:2>ScenarioDefinition:0>Tags:0>#TagLine:0
	    matchTokenAt_9(token, context) {
	        if (this.match_TagLine(context, token)) {
	            this.build(context, token);
	            return 9;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 9;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 9;
	        }
	        token.detach();
	        const expectedTokens = ["#TagLine", "#ScenarioLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 9;
	    }
	    // GherkinDocument:0>Feature:2>ScenarioDefinition:1>Scenario:0>#ScenarioLine:0
	    matchTokenAt_10(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_Comment(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 11;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 12;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 14;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 15;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 11;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Empty", "#Comment", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 10;
	    }
	    // GherkinDocument:0>Feature:2>ScenarioDefinition:1>Scenario:1>DescriptionHelper:1>Description:0>__alt1:0>#Other:0
	    matchTokenAt_11(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 11;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 12;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 14;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 15;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.build(context, token);
	            return 11;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Comment", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 11;
	    }
	    // GherkinDocument:0>Feature:2>ScenarioDefinition:1>Scenario:2>Step:0>#StepLine:0
	    matchTokenAt_12(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.startRule(context, RuleType.DataTable);
	            this.build(context, token);
	            return 13;
	        }
	        if (this.match_DocStringSeparator(context, token)) {
	            this.startRule(context, RuleType.DocString);
	            this.build(context, token);
	            return 39;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 12;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 14;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 15;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 12;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 12;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#TableRow", "#DocStringSeparator", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 12;
	    }
	    // GherkinDocument:0>Feature:2>ScenarioDefinition:1>Scenario:2>Step:1>StepArg:0>__alt0:0>DataTable:0>#TableRow:0
	    matchTokenAt_13(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.build(context, token);
	            return 13;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 12;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 14;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 15;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 13;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 13;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#TableRow", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 13;
	    }
	    // GherkinDocument:0>Feature:2>ScenarioDefinition:1>Scenario:3>ExamplesDefinition:0>Tags:0>#TagLine:0
	    matchTokenAt_14(token, context) {
	        if (this.match_TagLine(context, token)) {
	            this.build(context, token);
	            return 14;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 15;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 14;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 14;
	        }
	        token.detach();
	        const expectedTokens = ["#TagLine", "#ExamplesLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 14;
	    }
	    // GherkinDocument:0>Feature:2>ScenarioDefinition:1>Scenario:3>ExamplesDefinition:1>Examples:0>#ExamplesLine:0
	    matchTokenAt_15(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 15;
	        }
	        if (this.match_Comment(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 16;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.startRule(context, RuleType.ExamplesTable);
	            this.build(context, token);
	            return 17;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 14;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 15;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 16;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Empty", "#Comment", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 15;
	    }
	    // GherkinDocument:0>Feature:2>ScenarioDefinition:1>Scenario:3>ExamplesDefinition:1>Examples:1>DescriptionHelper:1>Description:0>__alt1:0>#Other:0
	    matchTokenAt_16(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 16;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesTable);
	            this.build(context, token);
	            return 17;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 14;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 15;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.build(context, token);
	            return 16;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Comment", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 16;
	    }
	    // GherkinDocument:0>Feature:2>ScenarioDefinition:1>Scenario:3>ExamplesDefinition:1>Examples:2>ExamplesTable:0>#TableRow:0
	    matchTokenAt_17(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.build(context, token);
	            return 17;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 14;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 15;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 17;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 17;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 17;
	    }
	    // GherkinDocument:0>Feature:3>Rule:0>RuleHeader:0>Tags:0>#TagLine:0
	    matchTokenAt_18(token, context) {
	        if (this.match_TagLine(context, token)) {
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 18;
	        }
	        token.detach();
	        const expectedTokens = ["#TagLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 18;
	    }
	    // GherkinDocument:0>Feature:3>Rule:0>RuleHeader:1>#RuleLine:0
	    matchTokenAt_19(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 20;
	        }
	        if (this.match_BackgroundLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Background);
	            this.build(context, token);
	            return 21;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 20;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Empty", "#Comment", "#BackgroundLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 19;
	    }
	    // GherkinDocument:0>Feature:3>Rule:0>RuleHeader:2>DescriptionHelper:1>Description:0>__alt1:0>#Other:0
	    matchTokenAt_20(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 20;
	        }
	        if (this.match_BackgroundLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Background);
	            this.build(context, token);
	            return 21;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.build(context, token);
	            return 20;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Comment", "#BackgroundLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 20;
	    }
	    // GherkinDocument:0>Feature:3>Rule:1>Background:0>#BackgroundLine:0
	    matchTokenAt_21(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 21;
	        }
	        if (this.match_Comment(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 22;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 23;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 22;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Empty", "#Comment", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 21;
	    }
	    // GherkinDocument:0>Feature:3>Rule:1>Background:1>DescriptionHelper:1>Description:0>__alt1:0>#Other:0
	    matchTokenAt_22(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 22;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 23;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.build(context, token);
	            return 22;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Comment", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 22;
	    }
	    // GherkinDocument:0>Feature:3>Rule:1>Background:2>Step:0>#StepLine:0
	    matchTokenAt_23(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.startRule(context, RuleType.DataTable);
	            this.build(context, token);
	            return 24;
	        }
	        if (this.match_DocStringSeparator(context, token)) {
	            this.startRule(context, RuleType.DocString);
	            this.build(context, token);
	            return 37;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 23;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 23;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 23;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#TableRow", "#DocStringSeparator", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 23;
	    }
	    // GherkinDocument:0>Feature:3>Rule:1>Background:2>Step:1>StepArg:0>__alt0:0>DataTable:0>#TableRow:0
	    matchTokenAt_24(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.build(context, token);
	            return 24;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 23;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 24;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 24;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#TableRow", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 24;
	    }
	    // GherkinDocument:0>Feature:3>Rule:2>ScenarioDefinition:0>Tags:0>#TagLine:0
	    matchTokenAt_25(token, context) {
	        if (this.match_TagLine(context, token)) {
	            this.build(context, token);
	            return 25;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 25;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 25;
	        }
	        token.detach();
	        const expectedTokens = ["#TagLine", "#ScenarioLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 25;
	    }
	    // GherkinDocument:0>Feature:3>Rule:2>ScenarioDefinition:1>Scenario:0>#ScenarioLine:0
	    matchTokenAt_26(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_Comment(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 27;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 28;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 30;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 31;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 27;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Empty", "#Comment", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 26;
	    }
	    // GherkinDocument:0>Feature:3>Rule:2>ScenarioDefinition:1>Scenario:1>DescriptionHelper:1>Description:0>__alt1:0>#Other:0
	    matchTokenAt_27(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 27;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 28;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 30;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 31;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.build(context, token);
	            return 27;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Comment", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 27;
	    }
	    // GherkinDocument:0>Feature:3>Rule:2>ScenarioDefinition:1>Scenario:2>Step:0>#StepLine:0
	    matchTokenAt_28(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.startRule(context, RuleType.DataTable);
	            this.build(context, token);
	            return 29;
	        }
	        if (this.match_DocStringSeparator(context, token)) {
	            this.startRule(context, RuleType.DocString);
	            this.build(context, token);
	            return 35;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 28;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 30;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 31;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 28;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 28;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#TableRow", "#DocStringSeparator", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 28;
	    }
	    // GherkinDocument:0>Feature:3>Rule:2>ScenarioDefinition:1>Scenario:2>Step:1>StepArg:0>__alt0:0>DataTable:0>#TableRow:0
	    matchTokenAt_29(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.build(context, token);
	            return 29;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 28;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 30;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 31;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 29;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 29;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#TableRow", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 29;
	    }
	    // GherkinDocument:0>Feature:3>Rule:2>ScenarioDefinition:1>Scenario:3>ExamplesDefinition:0>Tags:0>#TagLine:0
	    matchTokenAt_30(token, context) {
	        if (this.match_TagLine(context, token)) {
	            this.build(context, token);
	            return 30;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 31;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 30;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 30;
	        }
	        token.detach();
	        const expectedTokens = ["#TagLine", "#ExamplesLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 30;
	    }
	    // GherkinDocument:0>Feature:3>Rule:2>ScenarioDefinition:1>Scenario:3>ExamplesDefinition:1>Examples:0>#ExamplesLine:0
	    matchTokenAt_31(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 31;
	        }
	        if (this.match_Comment(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 32;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.startRule(context, RuleType.ExamplesTable);
	            this.build(context, token);
	            return 33;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 30;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 31;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.startRule(context, RuleType.Description);
	            this.build(context, token);
	            return 32;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Empty", "#Comment", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 31;
	    }
	    // GherkinDocument:0>Feature:3>Rule:2>ScenarioDefinition:1>Scenario:3>ExamplesDefinition:1>Examples:1>DescriptionHelper:1>Description:0>__alt1:0>#Other:0
	    matchTokenAt_32(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 32;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesTable);
	            this.build(context, token);
	            return 33;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 30;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 31;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Other(context, token)) {
	            this.build(context, token);
	            return 32;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#Comment", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 32;
	    }
	    // GherkinDocument:0>Feature:3>Rule:2>ScenarioDefinition:1>Scenario:3>ExamplesDefinition:1>Examples:2>ExamplesTable:0>#TableRow:0
	    matchTokenAt_33(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_TableRow(context, token)) {
	            this.build(context, token);
	            return 33;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 30;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 31;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 33;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 33;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 33;
	    }
	    // GherkinDocument:0>Feature:3>Rule:2>ScenarioDefinition:1>Scenario:2>Step:1>StepArg:0>__alt0:1>DocString:0>#DocStringSeparator:0
	    matchTokenAt_35(token, context) {
	        if (this.match_DocStringSeparator(context, token)) {
	            this.build(context, token);
	            return 36;
	        }
	        if (this.match_Other(context, token)) {
	            this.build(context, token);
	            return 35;
	        }
	        token.detach();
	        const expectedTokens = ["#DocStringSeparator", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 35;
	    }
	    // GherkinDocument:0>Feature:3>Rule:2>ScenarioDefinition:1>Scenario:2>Step:1>StepArg:0>__alt0:1>DocString:2>#DocStringSeparator:0
	    matchTokenAt_36(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 28;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 30;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 31;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 36;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 36;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 36;
	    }
	    // GherkinDocument:0>Feature:3>Rule:1>Background:2>Step:1>StepArg:0>__alt0:1>DocString:0>#DocStringSeparator:0
	    matchTokenAt_37(token, context) {
	        if (this.match_DocStringSeparator(context, token)) {
	            this.build(context, token);
	            return 38;
	        }
	        if (this.match_Other(context, token)) {
	            this.build(context, token);
	            return 37;
	        }
	        token.detach();
	        const expectedTokens = ["#DocStringSeparator", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 37;
	    }
	    // GherkinDocument:0>Feature:3>Rule:1>Background:2>Step:1>StepArg:0>__alt0:1>DocString:2>#DocStringSeparator:0
	    matchTokenAt_38(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 23;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 25;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 26;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 38;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 38;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 38;
	    }
	    // GherkinDocument:0>Feature:2>ScenarioDefinition:1>Scenario:2>Step:1>StepArg:0>__alt0:1>DocString:0>#DocStringSeparator:0
	    matchTokenAt_39(token, context) {
	        if (this.match_DocStringSeparator(context, token)) {
	            this.build(context, token);
	            return 40;
	        }
	        if (this.match_Other(context, token)) {
	            this.build(context, token);
	            return 39;
	        }
	        token.detach();
	        const expectedTokens = ["#DocStringSeparator", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 39;
	    }
	    // GherkinDocument:0>Feature:2>ScenarioDefinition:1>Scenario:2>Step:1>StepArg:0>__alt0:1>DocString:2>#DocStringSeparator:0
	    matchTokenAt_40(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 12;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_1(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ExamplesDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 14;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ExamplesLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ExamplesDefinition);
	            this.startRule(context, RuleType.Examples);
	            this.build(context, token);
	            return 15;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 40;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 40;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 40;
	    }
	    // GherkinDocument:0>Feature:1>Background:2>Step:1>StepArg:0>__alt0:1>DocString:0>#DocStringSeparator:0
	    matchTokenAt_41(token, context) {
	        if (this.match_DocStringSeparator(context, token)) {
	            this.build(context, token);
	            return 42;
	        }
	        if (this.match_Other(context, token)) {
	            this.build(context, token);
	            return 41;
	        }
	        token.detach();
	        const expectedTokens = ["#DocStringSeparator", "#Other"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 41;
	    }
	    // GherkinDocument:0>Feature:1>Background:2>Step:1>StepArg:0>__alt0:1>DocString:2>#DocStringSeparator:0
	    matchTokenAt_42(token, context) {
	        if (this.match_EOF(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.build(context, token);
	            return 34;
	        }
	        if (this.match_StepLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Step);
	            this.build(context, token);
	            return 7;
	        }
	        if (this.match_TagLine(context, token)) {
	            if (this.lookahead_0(context, token)) {
	                this.endRule(context);
	                this.endRule(context);
	                this.endRule(context);
	                this.startRule(context, RuleType.ScenarioDefinition);
	                this.startRule(context, RuleType.Tags);
	                this.build(context, token);
	                return 9;
	            }
	        }
	        if (this.match_TagLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.startRule(context, RuleType.Tags);
	            this.build(context, token);
	            return 18;
	        }
	        if (this.match_ScenarioLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.ScenarioDefinition);
	            this.startRule(context, RuleType.Scenario);
	            this.build(context, token);
	            return 10;
	        }
	        if (this.match_RuleLine(context, token)) {
	            this.endRule(context);
	            this.endRule(context);
	            this.endRule(context);
	            this.startRule(context, RuleType.Rule);
	            this.startRule(context, RuleType.RuleHeader);
	            this.build(context, token);
	            return 19;
	        }
	        if (this.match_Comment(context, token)) {
	            this.build(context, token);
	            return 42;
	        }
	        if (this.match_Empty(context, token)) {
	            this.build(context, token);
	            return 42;
	        }
	        token.detach();
	        const expectedTokens = ["#EOF", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
	        const error = token.isEof ?
	            TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) :
	            TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
	        if (this.stopAtFirstError)
	            throw error;
	        this.addError(context, error);
	        return 42;
	    }
	    match_EOF(context, token) {
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_EOF(token));
	    }
	    match_Empty(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_Empty(token));
	    }
	    match_Comment(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_Comment(token));
	    }
	    match_TagLine(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_TagLine(token));
	    }
	    match_FeatureLine(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_FeatureLine(token));
	    }
	    match_RuleLine(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_RuleLine(token));
	    }
	    match_BackgroundLine(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_BackgroundLine(token));
	    }
	    match_ScenarioLine(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_ScenarioLine(token));
	    }
	    match_ExamplesLine(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_ExamplesLine(token));
	    }
	    match_StepLine(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_StepLine(token));
	    }
	    match_DocStringSeparator(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_DocStringSeparator(token));
	    }
	    match_TableRow(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_TableRow(token));
	    }
	    match_Language(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_Language(token));
	    }
	    match_Other(context, token) {
	        if (token.isEof)
	            return false;
	        return this.handleExternalError(context, false, () => this.tokenMatcher.match_Other(token));
	    }
	    lookahead_0(context, currentToken) {
	        currentToken.detach();
	        let token;
	        const queue = [];
	        let match = false;
	        do {
	            token = this.readToken(this.context);
	            token.detach();
	            queue.push(token);
	            if (this.match_ScenarioLine(context, token)) {
	                match = true;
	                break;
	            }
	        } while (this.match_Empty(context, token) || this.match_Comment(context, token) || this.match_TagLine(context, token));
	        context.tokenQueue = context.tokenQueue.concat(queue);
	        return match;
	    }
	    lookahead_1(context, currentToken) {
	        currentToken.detach();
	        let token;
	        const queue = [];
	        let match = false;
	        do {
	            token = this.readToken(this.context);
	            token.detach();
	            queue.push(token);
	            if (this.match_ExamplesLine(context, token)) {
	                match = true;
	                break;
	            }
	        } while (this.match_Empty(context, token) || this.match_Comment(context, token) || this.match_TagLine(context, token));
	        context.tokenQueue = context.tokenQueue.concat(queue);
	        return match;
	    }
	}
	Parser$1.default = Parser;
	
	return Parser$1;
}

var GherkinClassicTokenMatcher = {};

const af = {
	and: [
		"* ",
		"En "
	],
	background: [
		"Agtergrond"
	],
	but: [
		"* ",
		"Maar "
	],
	examples: [
		"Voorbeelde"
	],
	feature: [
		"Funksie",
		"Besigheid Behoefte",
		"Vermoë"
	],
	given: [
		"* ",
		"Gegewe "
	],
	name: "Afrikaans",
	native: "Afrikaans",
	rule: [
		"Reël",
		"Reel"
	],
	scenario: [
		"Voorbeeld",
		"Situasie"
	],
	scenarioOutline: [
		"Situasie Uiteensetting"
	],
	then: [
		"* ",
		"Dan "
	],
	when: [
		"* ",
		"Wanneer "
	]
};
const am = {
	and: [
		"* ",
		"Եվ "
	],
	background: [
		"Կոնտեքստ"
	],
	but: [
		"* ",
		"Բայց "
	],
	examples: [
		"Օրինակներ"
	],
	feature: [
		"Ֆունկցիոնալություն",
		"Հատկություն"
	],
	given: [
		"* ",
		"Դիցուք "
	],
	name: "Armenian",
	native: "հայերեն",
	rule: [
		"Rule"
	],
	scenario: [
		"Օրինակ",
		"Սցենար"
	],
	scenarioOutline: [
		"Սցենարի կառուցվացքը"
	],
	then: [
		"* ",
		"Ապա "
	],
	when: [
		"* ",
		"Եթե ",
		"Երբ "
	]
};
const an = {
	and: [
		"* ",
		"Y ",
		"E "
	],
	background: [
		"Antecedents"
	],
	but: [
		"* ",
		"Pero "
	],
	examples: [
		"Eixemplos"
	],
	feature: [
		"Caracteristica"
	],
	given: [
		"* ",
		"Dau ",
		"Dada ",
		"Daus ",
		"Dadas "
	],
	name: "Aragonese",
	native: "Aragonés",
	rule: [
		"Rule"
	],
	scenario: [
		"Eixemplo",
		"Caso"
	],
	scenarioOutline: [
		"Esquema del caso"
	],
	then: [
		"* ",
		"Alavez ",
		"Allora ",
		"Antonces "
	],
	when: [
		"* ",
		"Cuan "
	]
};
const ar = {
	and: [
		"* ",
		"و "
	],
	background: [
		"الخلفية"
	],
	but: [
		"* ",
		"لكن "
	],
	examples: [
		"امثلة"
	],
	feature: [
		"خاصية"
	],
	given: [
		"* ",
		"بفرض "
	],
	name: "Arabic",
	native: "العربية",
	rule: [
		"Rule"
	],
	scenario: [
		"مثال",
		"سيناريو"
	],
	scenarioOutline: [
		"سيناريو مخطط"
	],
	then: [
		"* ",
		"اذاً ",
		"ثم "
	],
	when: [
		"* ",
		"متى ",
		"عندما "
	]
};
const ast = {
	and: [
		"* ",
		"Y ",
		"Ya "
	],
	background: [
		"Antecedentes"
	],
	but: [
		"* ",
		"Peru "
	],
	examples: [
		"Exemplos"
	],
	feature: [
		"Carauterística"
	],
	given: [
		"* ",
		"Dáu ",
		"Dada ",
		"Daos ",
		"Daes "
	],
	name: "Asturian",
	native: "asturianu",
	rule: [
		"Rule"
	],
	scenario: [
		"Exemplo",
		"Casu"
	],
	scenarioOutline: [
		"Esbozu del casu"
	],
	then: [
		"* ",
		"Entós "
	],
	when: [
		"* ",
		"Cuando "
	]
};
const az = {
	and: [
		"* ",
		"Və ",
		"Həm "
	],
	background: [
		"Keçmiş",
		"Kontekst"
	],
	but: [
		"* ",
		"Amma ",
		"Ancaq "
	],
	examples: [
		"Nümunələr"
	],
	feature: [
		"Özəllik"
	],
	given: [
		"* ",
		"Tutaq ki ",
		"Verilir "
	],
	name: "Azerbaijani",
	native: "Azərbaycanca",
	rule: [
		"Rule"
	],
	scenario: [
		"Nümunə",
		"Ssenari"
	],
	scenarioOutline: [
		"Ssenarinin strukturu"
	],
	then: [
		"* ",
		"O halda "
	],
	when: [
		"* ",
		"Əgər ",
		"Nə vaxt ki "
	]
};
const be = {
	and: [
		"* ",
		"I ",
		"Ды ",
		"Таксама "
	],
	background: [
		"Кантэкст"
	],
	but: [
		"* ",
		"Але ",
		"Інакш "
	],
	examples: [
		"Прыклады"
	],
	feature: [
		"Функцыянальнасць",
		"Фіча"
	],
	given: [
		"* ",
		"Няхай ",
		"Дадзена "
	],
	name: "Belarusian",
	native: "Беларуская",
	rule: [
		"Правілы"
	],
	scenario: [
		"Сцэнарый",
		"Cцэнар"
	],
	scenarioOutline: [
		"Шаблон сцэнарыя",
		"Узор сцэнара"
	],
	then: [
		"* ",
		"Тады "
	],
	when: [
		"* ",
		"Калі "
	]
};
const bg = {
	and: [
		"* ",
		"И "
	],
	background: [
		"Предистория"
	],
	but: [
		"* ",
		"Но "
	],
	examples: [
		"Примери"
	],
	feature: [
		"Функционалност"
	],
	given: [
		"* ",
		"Дадено "
	],
	name: "Bulgarian",
	native: "български",
	rule: [
		"Правило"
	],
	scenario: [
		"Пример",
		"Сценарий"
	],
	scenarioOutline: [
		"Рамка на сценарий"
	],
	then: [
		"* ",
		"То "
	],
	when: [
		"* ",
		"Когато "
	]
};
const bm = {
	and: [
		"* ",
		"Dan "
	],
	background: [
		"Latar Belakang"
	],
	but: [
		"* ",
		"Tetapi ",
		"Tapi "
	],
	examples: [
		"Contoh"
	],
	feature: [
		"Fungsi"
	],
	given: [
		"* ",
		"Diberi ",
		"Bagi "
	],
	name: "Malay",
	native: "Bahasa Melayu",
	rule: [
		"Rule"
	],
	scenario: [
		"Senario",
		"Situasi",
		"Keadaan"
	],
	scenarioOutline: [
		"Kerangka Senario",
		"Kerangka Situasi",
		"Kerangka Keadaan",
		"Garis Panduan Senario"
	],
	then: [
		"* ",
		"Maka ",
		"Kemudian "
	],
	when: [
		"* ",
		"Apabila "
	]
};
const bs = {
	and: [
		"* ",
		"I ",
		"A "
	],
	background: [
		"Pozadina"
	],
	but: [
		"* ",
		"Ali "
	],
	examples: [
		"Primjeri"
	],
	feature: [
		"Karakteristika"
	],
	given: [
		"* ",
		"Dato "
	],
	name: "Bosnian",
	native: "Bosanski",
	rule: [
		"Rule"
	],
	scenario: [
		"Primjer",
		"Scenariju",
		"Scenario"
	],
	scenarioOutline: [
		"Scenariju-obris",
		"Scenario-outline"
	],
	then: [
		"* ",
		"Zatim "
	],
	when: [
		"* ",
		"Kada "
	]
};
const ca = {
	and: [
		"* ",
		"I "
	],
	background: [
		"Rerefons",
		"Antecedents"
	],
	but: [
		"* ",
		"Però "
	],
	examples: [
		"Exemples"
	],
	feature: [
		"Característica",
		"Funcionalitat"
	],
	given: [
		"* ",
		"Donat ",
		"Donada ",
		"Atès ",
		"Atesa "
	],
	name: "Catalan",
	native: "català",
	rule: [
		"Rule"
	],
	scenario: [
		"Exemple",
		"Escenari"
	],
	scenarioOutline: [
		"Esquema de l'escenari"
	],
	then: [
		"* ",
		"Aleshores ",
		"Cal "
	],
	when: [
		"* ",
		"Quan "
	]
};
const cs = {
	and: [
		"* ",
		"A také ",
		"A "
	],
	background: [
		"Pozadí",
		"Kontext"
	],
	but: [
		"* ",
		"Ale "
	],
	examples: [
		"Příklady"
	],
	feature: [
		"Požadavek"
	],
	given: [
		"* ",
		"Pokud ",
		"Za předpokladu "
	],
	name: "Czech",
	native: "Česky",
	rule: [
		"Pravidlo"
	],
	scenario: [
		"Příklad",
		"Scénář"
	],
	scenarioOutline: [
		"Náčrt Scénáře",
		"Osnova scénáře"
	],
	then: [
		"* ",
		"Pak "
	],
	when: [
		"* ",
		"Když "
	]
};
const da = {
	and: [
		"* ",
		"Og "
	],
	background: [
		"Baggrund"
	],
	but: [
		"* ",
		"Men "
	],
	examples: [
		"Eksempler"
	],
	feature: [
		"Egenskab"
	],
	given: [
		"* ",
		"Givet "
	],
	name: "Danish",
	native: "dansk",
	rule: [
		"Regel"
	],
	scenario: [
		"Eksempel",
		"Scenarie"
	],
	scenarioOutline: [
		"Abstrakt Scenario"
	],
	then: [
		"* ",
		"Så "
	],
	when: [
		"* ",
		"Når "
	]
};
const de = {
	and: [
		"* ",
		"Und "
	],
	background: [
		"Grundlage",
		"Hintergrund",
		"Voraussetzungen",
		"Vorbedingungen"
	],
	but: [
		"* ",
		"Aber "
	],
	examples: [
		"Beispiele"
	],
	feature: [
		"Funktionalität",
		"Funktion"
	],
	given: [
		"* ",
		"Angenommen ",
		"Gegeben sei ",
		"Gegeben seien "
	],
	name: "German",
	native: "Deutsch",
	rule: [
		"Rule",
		"Regel"
	],
	scenario: [
		"Beispiel",
		"Szenario"
	],
	scenarioOutline: [
		"Szenariogrundriss",
		"Szenarien"
	],
	then: [
		"* ",
		"Dann "
	],
	when: [
		"* ",
		"Wenn "
	]
};
const el = {
	and: [
		"* ",
		"Και "
	],
	background: [
		"Υπόβαθρο"
	],
	but: [
		"* ",
		"Αλλά "
	],
	examples: [
		"Παραδείγματα",
		"Σενάρια"
	],
	feature: [
		"Δυνατότητα",
		"Λειτουργία"
	],
	given: [
		"* ",
		"Δεδομένου "
	],
	name: "Greek",
	native: "Ελληνικά",
	rule: [
		"Rule"
	],
	scenario: [
		"Παράδειγμα",
		"Σενάριο"
	],
	scenarioOutline: [
		"Περιγραφή Σεναρίου",
		"Περίγραμμα Σεναρίου"
	],
	then: [
		"* ",
		"Τότε "
	],
	when: [
		"* ",
		"Όταν "
	]
};
const em = {
	and: [
		"* ",
		"😂"
	],
	background: [
		"💤"
	],
	but: [
		"* ",
		"😔"
	],
	examples: [
		"📓"
	],
	feature: [
		"📚"
	],
	given: [
		"* ",
		"😐"
	],
	name: "Emoji",
	native: "😀",
	rule: [
		"Rule"
	],
	scenario: [
		"🥒",
		"📕"
	],
	scenarioOutline: [
		"📖"
	],
	then: [
		"* ",
		"🙏"
	],
	when: [
		"* ",
		"🎬"
	]
};
const en = {
	and: [
		"* ",
		"And "
	],
	background: [
		"Background"
	],
	but: [
		"* ",
		"But "
	],
	examples: [
		"Examples",
		"Scenarios"
	],
	feature: [
		"Feature",
		"Business Need",
		"Ability"
	],
	given: [
		"* ",
		"Given "
	],
	name: "English",
	native: "English",
	rule: [
		"Rule"
	],
	scenario: [
		"Example",
		"Scenario"
	],
	scenarioOutline: [
		"Scenario Outline",
		"Scenario Template"
	],
	then: [
		"* ",
		"Then "
	],
	when: [
		"* ",
		"When "
	]
};
const eo = {
	and: [
		"* ",
		"Kaj "
	],
	background: [
		"Fono"
	],
	but: [
		"* ",
		"Sed "
	],
	examples: [
		"Ekzemploj"
	],
	feature: [
		"Trajto"
	],
	given: [
		"* ",
		"Donitaĵo ",
		"Komence "
	],
	name: "Esperanto",
	native: "Esperanto",
	rule: [
		"Regulo"
	],
	scenario: [
		"Ekzemplo",
		"Scenaro",
		"Kazo"
	],
	scenarioOutline: [
		"Konturo de la scenaro",
		"Skizo",
		"Kazo-skizo"
	],
	then: [
		"* ",
		"Do "
	],
	when: [
		"* ",
		"Se "
	]
};
const es = {
	and: [
		"* ",
		"Y ",
		"E "
	],
	background: [
		"Antecedentes"
	],
	but: [
		"* ",
		"Pero "
	],
	examples: [
		"Ejemplos"
	],
	feature: [
		"Característica",
		"Necesidad del negocio",
		"Requisito"
	],
	given: [
		"* ",
		"Dado ",
		"Dada ",
		"Dados ",
		"Dadas "
	],
	name: "Spanish",
	native: "español",
	rule: [
		"Regla",
		"Regla de negocio"
	],
	scenario: [
		"Ejemplo",
		"Escenario"
	],
	scenarioOutline: [
		"Esquema del escenario"
	],
	then: [
		"* ",
		"Entonces "
	],
	when: [
		"* ",
		"Cuando "
	]
};
const et = {
	and: [
		"* ",
		"Ja "
	],
	background: [
		"Taust"
	],
	but: [
		"* ",
		"Kuid "
	],
	examples: [
		"Juhtumid"
	],
	feature: [
		"Omadus"
	],
	given: [
		"* ",
		"Eeldades "
	],
	name: "Estonian",
	native: "eesti keel",
	rule: [
		"Reegel"
	],
	scenario: [
		"Juhtum",
		"Stsenaarium"
	],
	scenarioOutline: [
		"Raamjuhtum",
		"Raamstsenaarium"
	],
	then: [
		"* ",
		"Siis "
	],
	when: [
		"* ",
		"Kui "
	]
};
const fa = {
	and: [
		"* ",
		"و "
	],
	background: [
		"زمینه"
	],
	but: [
		"* ",
		"اما "
	],
	examples: [
		"نمونه ها"
	],
	feature: [
		"وِیژگی"
	],
	given: [
		"* ",
		"با فرض "
	],
	name: "Persian",
	native: "فارسی",
	rule: [
		"Rule"
	],
	scenario: [
		"مثال",
		"سناریو"
	],
	scenarioOutline: [
		"الگوی سناریو"
	],
	then: [
		"* ",
		"آنگاه "
	],
	when: [
		"* ",
		"هنگامی "
	]
};
const fi = {
	and: [
		"* ",
		"Ja "
	],
	background: [
		"Tausta"
	],
	but: [
		"* ",
		"Mutta "
	],
	examples: [
		"Tapaukset"
	],
	feature: [
		"Ominaisuus"
	],
	given: [
		"* ",
		"Oletetaan "
	],
	name: "Finnish",
	native: "suomi",
	rule: [
		"Rule"
	],
	scenario: [
		"Tapaus"
	],
	scenarioOutline: [
		"Tapausaihio"
	],
	then: [
		"* ",
		"Niin "
	],
	when: [
		"* ",
		"Kun "
	]
};
const fr = {
	and: [
		"* ",
		"Et que ",
		"Et qu'",
		"Et "
	],
	background: [
		"Contexte"
	],
	but: [
		"* ",
		"Mais que ",
		"Mais qu'",
		"Mais "
	],
	examples: [
		"Exemples"
	],
	feature: [
		"Fonctionnalité"
	],
	given: [
		"* ",
		"Soit ",
		"Sachant que ",
		"Sachant qu'",
		"Sachant ",
		"Etant donné que ",
		"Etant donné qu'",
		"Etant donné ",
		"Etant donnée ",
		"Etant donnés ",
		"Etant données ",
		"Étant donné que ",
		"Étant donné qu'",
		"Étant donné ",
		"Étant donnée ",
		"Étant donnés ",
		"Étant données "
	],
	name: "French",
	native: "français",
	rule: [
		"Règle"
	],
	scenario: [
		"Exemple",
		"Scénario"
	],
	scenarioOutline: [
		"Plan du scénario",
		"Plan du Scénario"
	],
	then: [
		"* ",
		"Alors ",
		"Donc "
	],
	when: [
		"* ",
		"Quand ",
		"Lorsque ",
		"Lorsqu'"
	]
};
const ga = {
	and: [
		"* ",
		"Agus "
	],
	background: [
		"Cúlra"
	],
	but: [
		"* ",
		"Ach "
	],
	examples: [
		"Samplaí"
	],
	feature: [
		"Gné"
	],
	given: [
		"* ",
		"Cuir i gcás go ",
		"Cuir i gcás nach ",
		"Cuir i gcás gur ",
		"Cuir i gcás nár "
	],
	name: "Irish",
	native: "Gaeilge",
	rule: [
		"Riail"
	],
	scenario: [
		"Sampla",
		"Cás"
	],
	scenarioOutline: [
		"Cás Achomair"
	],
	then: [
		"* ",
		"Ansin "
	],
	when: [
		"* ",
		"Nuair a ",
		"Nuair nach ",
		"Nuair ba ",
		"Nuair nár "
	]
};
const gj = {
	and: [
		"* ",
		"અને "
	],
	background: [
		"બેકગ્રાઉન્ડ"
	],
	but: [
		"* ",
		"પણ "
	],
	examples: [
		"ઉદાહરણો"
	],
	feature: [
		"લક્ષણ",
		"વ્યાપાર જરૂર",
		"ક્ષમતા"
	],
	given: [
		"* ",
		"આપેલ છે "
	],
	name: "Gujarati",
	native: "ગુજરાતી",
	rule: [
		"નિયમ"
	],
	scenario: [
		"ઉદાહરણ",
		"સ્થિતિ"
	],
	scenarioOutline: [
		"પરિદ્દશ્ય રૂપરેખા",
		"પરિદ્દશ્ય ઢાંચો"
	],
	then: [
		"* ",
		"પછી "
	],
	when: [
		"* ",
		"ક્યારે "
	]
};
const gl = {
	and: [
		"* ",
		"E "
	],
	background: [
		"Contexto"
	],
	but: [
		"* ",
		"Mais ",
		"Pero "
	],
	examples: [
		"Exemplos"
	],
	feature: [
		"Característica"
	],
	given: [
		"* ",
		"Dado ",
		"Dada ",
		"Dados ",
		"Dadas "
	],
	name: "Galician",
	native: "galego",
	rule: [
		"Rule"
	],
	scenario: [
		"Exemplo",
		"Escenario"
	],
	scenarioOutline: [
		"Esbozo do escenario"
	],
	then: [
		"* ",
		"Entón ",
		"Logo "
	],
	when: [
		"* ",
		"Cando "
	]
};
const he = {
	and: [
		"* ",
		"וגם "
	],
	background: [
		"רקע"
	],
	but: [
		"* ",
		"אבל "
	],
	examples: [
		"דוגמאות"
	],
	feature: [
		"תכונה"
	],
	given: [
		"* ",
		"בהינתן "
	],
	name: "Hebrew",
	native: "עברית",
	rule: [
		"כלל"
	],
	scenario: [
		"דוגמא",
		"תרחיש"
	],
	scenarioOutline: [
		"תבנית תרחיש"
	],
	then: [
		"* ",
		"אז ",
		"אזי "
	],
	when: [
		"* ",
		"כאשר "
	]
};
const hi = {
	and: [
		"* ",
		"और ",
		"तथा "
	],
	background: [
		"पृष्ठभूमि"
	],
	but: [
		"* ",
		"पर ",
		"परन्तु ",
		"किन्तु "
	],
	examples: [
		"उदाहरण"
	],
	feature: [
		"रूप लेख"
	],
	given: [
		"* ",
		"अगर ",
		"यदि ",
		"चूंकि "
	],
	name: "Hindi",
	native: "हिंदी",
	rule: [
		"नियम"
	],
	scenario: [
		"परिदृश्य"
	],
	scenarioOutline: [
		"परिदृश्य रूपरेखा"
	],
	then: [
		"* ",
		"तब ",
		"तदा "
	],
	when: [
		"* ",
		"जब ",
		"कदा "
	]
};
const hr = {
	and: [
		"* ",
		"I "
	],
	background: [
		"Pozadina"
	],
	but: [
		"* ",
		"Ali "
	],
	examples: [
		"Primjeri",
		"Scenariji"
	],
	feature: [
		"Osobina",
		"Mogućnost",
		"Mogucnost"
	],
	given: [
		"* ",
		"Zadan ",
		"Zadani ",
		"Zadano ",
		"Ukoliko "
	],
	name: "Croatian",
	native: "hrvatski",
	rule: [
		"Rule"
	],
	scenario: [
		"Primjer",
		"Scenarij"
	],
	scenarioOutline: [
		"Skica",
		"Koncept"
	],
	then: [
		"* ",
		"Onda "
	],
	when: [
		"* ",
		"Kada ",
		"Kad "
	]
};
const ht = {
	and: [
		"* ",
		"Ak ",
		"Epi ",
		"E "
	],
	background: [
		"Kontèks",
		"Istorik"
	],
	but: [
		"* ",
		"Men "
	],
	examples: [
		"Egzanp"
	],
	feature: [
		"Karakteristik",
		"Mak",
		"Fonksyonalite"
	],
	given: [
		"* ",
		"Sipoze ",
		"Sipoze ke ",
		"Sipoze Ke "
	],
	name: "Creole",
	native: "kreyòl",
	rule: [
		"Rule"
	],
	scenario: [
		"Senaryo"
	],
	scenarioOutline: [
		"Plan senaryo",
		"Plan Senaryo",
		"Senaryo deskripsyon",
		"Senaryo Deskripsyon",
		"Dyagram senaryo",
		"Dyagram Senaryo"
	],
	then: [
		"* ",
		"Lè sa a ",
		"Le sa a "
	],
	when: [
		"* ",
		"Lè ",
		"Le "
	]
};
const hu = {
	and: [
		"* ",
		"És "
	],
	background: [
		"Háttér"
	],
	but: [
		"* ",
		"De "
	],
	examples: [
		"Példák"
	],
	feature: [
		"Jellemző"
	],
	given: [
		"* ",
		"Amennyiben ",
		"Adott "
	],
	name: "Hungarian",
	native: "magyar",
	rule: [
		"Szabály"
	],
	scenario: [
		"Példa",
		"Forgatókönyv"
	],
	scenarioOutline: [
		"Forgatókönyv vázlat"
	],
	then: [
		"* ",
		"Akkor "
	],
	when: [
		"* ",
		"Majd ",
		"Ha ",
		"Amikor "
	]
};
const id = {
	and: [
		"* ",
		"Dan "
	],
	background: [
		"Dasar",
		"Latar Belakang"
	],
	but: [
		"* ",
		"Tapi ",
		"Tetapi "
	],
	examples: [
		"Contoh",
		"Misal"
	],
	feature: [
		"Fitur"
	],
	given: [
		"* ",
		"Dengan ",
		"Diketahui ",
		"Diasumsikan ",
		"Bila ",
		"Jika "
	],
	name: "Indonesian",
	native: "Bahasa Indonesia",
	rule: [
		"Rule",
		"Aturan"
	],
	scenario: [
		"Skenario"
	],
	scenarioOutline: [
		"Skenario konsep",
		"Garis-Besar Skenario"
	],
	then: [
		"* ",
		"Maka ",
		"Kemudian "
	],
	when: [
		"* ",
		"Ketika "
	]
};
const is = {
	and: [
		"* ",
		"Og "
	],
	background: [
		"Bakgrunnur"
	],
	but: [
		"* ",
		"En "
	],
	examples: [
		"Dæmi",
		"Atburðarásir"
	],
	feature: [
		"Eiginleiki"
	],
	given: [
		"* ",
		"Ef "
	],
	name: "Icelandic",
	native: "Íslenska",
	rule: [
		"Rule"
	],
	scenario: [
		"Atburðarás"
	],
	scenarioOutline: [
		"Lýsing Atburðarásar",
		"Lýsing Dæma"
	],
	then: [
		"* ",
		"Þá "
	],
	when: [
		"* ",
		"Þegar "
	]
};
const it = {
	and: [
		"* ",
		"E ",
		"Ed "
	],
	background: [
		"Contesto"
	],
	but: [
		"* ",
		"Ma "
	],
	examples: [
		"Esempi"
	],
	feature: [
		"Funzionalità",
		"Esigenza di Business",
		"Abilità"
	],
	given: [
		"* ",
		"Dato ",
		"Data ",
		"Dati ",
		"Date "
	],
	name: "Italian",
	native: "italiano",
	rule: [
		"Regola"
	],
	scenario: [
		"Esempio",
		"Scenario"
	],
	scenarioOutline: [
		"Schema dello scenario"
	],
	then: [
		"* ",
		"Allora "
	],
	when: [
		"* ",
		"Quando "
	]
};
const ja = {
	and: [
		"* ",
		"且つ",
		"かつ"
	],
	background: [
		"背景"
	],
	but: [
		"* ",
		"然し",
		"しかし",
		"但し",
		"ただし"
	],
	examples: [
		"例",
		"サンプル"
	],
	feature: [
		"フィーチャ",
		"機能"
	],
	given: [
		"* ",
		"前提"
	],
	name: "Japanese",
	native: "日本語",
	rule: [
		"ルール"
	],
	scenario: [
		"シナリオ"
	],
	scenarioOutline: [
		"シナリオアウトライン",
		"シナリオテンプレート",
		"テンプレ",
		"シナリオテンプレ"
	],
	then: [
		"* ",
		"ならば"
	],
	when: [
		"* ",
		"もし"
	]
};
const jv = {
	and: [
		"* ",
		"Lan "
	],
	background: [
		"Dasar"
	],
	but: [
		"* ",
		"Tapi ",
		"Nanging ",
		"Ananging "
	],
	examples: [
		"Conto",
		"Contone"
	],
	feature: [
		"Fitur"
	],
	given: [
		"* ",
		"Nalika ",
		"Nalikaning "
	],
	name: "Javanese",
	native: "Basa Jawa",
	rule: [
		"Rule"
	],
	scenario: [
		"Skenario"
	],
	scenarioOutline: [
		"Konsep skenario"
	],
	then: [
		"* ",
		"Njuk ",
		"Banjur "
	],
	when: [
		"* ",
		"Manawa ",
		"Menawa "
	]
};
const ka = {
	and: [
		"* ",
		"და ",
		"ასევე "
	],
	background: [
		"კონტექსტი"
	],
	but: [
		"* ",
		"მაგრამ ",
		"თუმცა "
	],
	examples: [
		"მაგალითები"
	],
	feature: [
		"თვისება",
		"მოთხოვნა"
	],
	given: [
		"* ",
		"მოცემული ",
		"მოცემულია ",
		"ვთქვათ "
	],
	name: "Georgian",
	native: "ქართული",
	rule: [
		"წესი"
	],
	scenario: [
		"მაგალითად",
		"მაგალითი",
		"მაგ",
		"სცენარი"
	],
	scenarioOutline: [
		"სცენარის ნიმუში",
		"სცენარის შაბლონი",
		"ნიმუში",
		"შაბლონი"
	],
	then: [
		"* ",
		"მაშინ "
	],
	when: [
		"* ",
		"როდესაც ",
		"როცა ",
		"როგორც კი ",
		"თუ "
	]
};
const kn = {
	and: [
		"* ",
		"ಮತ್ತು "
	],
	background: [
		"ಹಿನ್ನೆಲೆ"
	],
	but: [
		"* ",
		"ಆದರೆ "
	],
	examples: [
		"ಉದಾಹರಣೆಗಳು"
	],
	feature: [
		"ಹೆಚ್ಚಳ"
	],
	given: [
		"* ",
		"ನೀಡಿದ "
	],
	name: "Kannada",
	native: "ಕನ್ನಡ",
	rule: [
		"Rule"
	],
	scenario: [
		"ಉದಾಹರಣೆ",
		"ಕಥಾಸಾರಾಂಶ"
	],
	scenarioOutline: [
		"ವಿವರಣೆ"
	],
	then: [
		"* ",
		"ನಂತರ "
	],
	when: [
		"* ",
		"ಸ್ಥಿತಿಯನ್ನು "
	]
};
const ko = {
	and: [
		"* ",
		"그리고 "
	],
	background: [
		"배경"
	],
	but: [
		"* ",
		"하지만 ",
		"단 "
	],
	examples: [
		"예"
	],
	feature: [
		"기능"
	],
	given: [
		"* ",
		"조건 ",
		"먼저 "
	],
	name: "Korean",
	native: "한국어",
	rule: [
		"Rule"
	],
	scenario: [
		"시나리오"
	],
	scenarioOutline: [
		"시나리오 개요"
	],
	then: [
		"* ",
		"그러면 "
	],
	when: [
		"* ",
		"만일 ",
		"만약 "
	]
};
const lt = {
	and: [
		"* ",
		"Ir "
	],
	background: [
		"Kontekstas"
	],
	but: [
		"* ",
		"Bet "
	],
	examples: [
		"Pavyzdžiai",
		"Scenarijai",
		"Variantai"
	],
	feature: [
		"Savybė"
	],
	given: [
		"* ",
		"Duota "
	],
	name: "Lithuanian",
	native: "lietuvių kalba",
	rule: [
		"Rule"
	],
	scenario: [
		"Pavyzdys",
		"Scenarijus"
	],
	scenarioOutline: [
		"Scenarijaus šablonas"
	],
	then: [
		"* ",
		"Tada "
	],
	when: [
		"* ",
		"Kai "
	]
};
const lu = {
	and: [
		"* ",
		"an ",
		"a "
	],
	background: [
		"Hannergrond"
	],
	but: [
		"* ",
		"awer ",
		"mä "
	],
	examples: [
		"Beispiller"
	],
	feature: [
		"Funktionalitéit"
	],
	given: [
		"* ",
		"ugeholl "
	],
	name: "Luxemburgish",
	native: "Lëtzebuergesch",
	rule: [
		"Rule"
	],
	scenario: [
		"Beispill",
		"Szenario"
	],
	scenarioOutline: [
		"Plang vum Szenario"
	],
	then: [
		"* ",
		"dann "
	],
	when: [
		"* ",
		"wann "
	]
};
const lv = {
	and: [
		"* ",
		"Un "
	],
	background: [
		"Konteksts",
		"Situācija"
	],
	but: [
		"* ",
		"Bet "
	],
	examples: [
		"Piemēri",
		"Paraugs"
	],
	feature: [
		"Funkcionalitāte",
		"Fīča"
	],
	given: [
		"* ",
		"Kad "
	],
	name: "Latvian",
	native: "latviešu",
	rule: [
		"Rule"
	],
	scenario: [
		"Piemērs",
		"Scenārijs"
	],
	scenarioOutline: [
		"Scenārijs pēc parauga"
	],
	then: [
		"* ",
		"Tad "
	],
	when: [
		"* ",
		"Ja "
	]
};
const mn = {
	and: [
		"* ",
		"Мөн ",
		"Тэгээд "
	],
	background: [
		"Агуулга"
	],
	but: [
		"* ",
		"Гэхдээ ",
		"Харин "
	],
	examples: [
		"Тухайлбал"
	],
	feature: [
		"Функц",
		"Функционал"
	],
	given: [
		"* ",
		"Өгөгдсөн нь ",
		"Анх "
	],
	name: "Mongolian",
	native: "монгол",
	rule: [
		"Rule"
	],
	scenario: [
		"Сценар"
	],
	scenarioOutline: [
		"Сценарын төлөвлөгөө"
	],
	then: [
		"* ",
		"Тэгэхэд ",
		"Үүний дараа "
	],
	when: [
		"* ",
		"Хэрэв "
	]
};
const ne = {
	and: [
		"* ",
		"र ",
		"अनि "
	],
	background: [
		"पृष्ठभूमी"
	],
	but: [
		"* ",
		"तर "
	],
	examples: [
		"उदाहरण",
		"उदाहरणहरु"
	],
	feature: [
		"सुविधा",
		"विशेषता"
	],
	given: [
		"* ",
		"दिइएको ",
		"दिएको ",
		"यदि "
	],
	name: "Nepali",
	native: "नेपाली",
	rule: [
		"नियम"
	],
	scenario: [
		"परिदृश्य"
	],
	scenarioOutline: [
		"परिदृश्य रूपरेखा"
	],
	then: [
		"* ",
		"त्यसपछि ",
		"अनी "
	],
	when: [
		"* ",
		"जब "
	]
};
const nl = {
	and: [
		"* ",
		"En "
	],
	background: [
		"Achtergrond"
	],
	but: [
		"* ",
		"Maar "
	],
	examples: [
		"Voorbeelden"
	],
	feature: [
		"Functionaliteit"
	],
	given: [
		"* ",
		"Gegeven ",
		"Stel "
	],
	name: "Dutch",
	native: "Nederlands",
	rule: [
		"Regel"
	],
	scenario: [
		"Voorbeeld",
		"Scenario"
	],
	scenarioOutline: [
		"Abstract Scenario"
	],
	then: [
		"* ",
		"Dan "
	],
	when: [
		"* ",
		"Als ",
		"Wanneer "
	]
};
const no = {
	and: [
		"* ",
		"Og "
	],
	background: [
		"Bakgrunn"
	],
	but: [
		"* ",
		"Men "
	],
	examples: [
		"Eksempler"
	],
	feature: [
		"Egenskap"
	],
	given: [
		"* ",
		"Gitt "
	],
	name: "Norwegian",
	native: "norsk",
	rule: [
		"Regel"
	],
	scenario: [
		"Eksempel",
		"Scenario"
	],
	scenarioOutline: [
		"Scenariomal",
		"Abstrakt Scenario"
	],
	then: [
		"* ",
		"Så "
	],
	when: [
		"* ",
		"Når "
	]
};
const pa = {
	and: [
		"* ",
		"ਅਤੇ "
	],
	background: [
		"ਪਿਛੋਕੜ"
	],
	but: [
		"* ",
		"ਪਰ "
	],
	examples: [
		"ਉਦਾਹਰਨਾਂ"
	],
	feature: [
		"ਖਾਸੀਅਤ",
		"ਮੁਹਾਂਦਰਾ",
		"ਨਕਸ਼ ਨੁਹਾਰ"
	],
	given: [
		"* ",
		"ਜੇਕਰ ",
		"ਜਿਵੇਂ ਕਿ "
	],
	name: "Panjabi",
	native: "ਪੰਜਾਬੀ",
	rule: [
		"Rule"
	],
	scenario: [
		"ਉਦਾਹਰਨ",
		"ਪਟਕਥਾ"
	],
	scenarioOutline: [
		"ਪਟਕਥਾ ਢਾਂਚਾ",
		"ਪਟਕਥਾ ਰੂਪ ਰੇਖਾ"
	],
	then: [
		"* ",
		"ਤਦ "
	],
	when: [
		"* ",
		"ਜਦੋਂ "
	]
};
const pl = {
	and: [
		"* ",
		"Oraz ",
		"I "
	],
	background: [
		"Założenia"
	],
	but: [
		"* ",
		"Ale "
	],
	examples: [
		"Przykłady"
	],
	feature: [
		"Właściwość",
		"Funkcja",
		"Aspekt",
		"Potrzeba biznesowa"
	],
	given: [
		"* ",
		"Zakładając ",
		"Mając ",
		"Zakładając, że "
	],
	name: "Polish",
	native: "polski",
	rule: [
		"Zasada",
		"Reguła"
	],
	scenario: [
		"Przykład",
		"Scenariusz"
	],
	scenarioOutline: [
		"Szablon scenariusza"
	],
	then: [
		"* ",
		"Wtedy "
	],
	when: [
		"* ",
		"Jeżeli ",
		"Jeśli ",
		"Gdy ",
		"Kiedy "
	]
};
const pt = {
	and: [
		"* ",
		"E "
	],
	background: [
		"Contexto",
		"Cenário de Fundo",
		"Cenario de Fundo",
		"Fundo"
	],
	but: [
		"* ",
		"Mas "
	],
	examples: [
		"Exemplos",
		"Cenários",
		"Cenarios"
	],
	feature: [
		"Funcionalidade",
		"Característica",
		"Caracteristica"
	],
	given: [
		"* ",
		"Dado ",
		"Dada ",
		"Dados ",
		"Dadas "
	],
	name: "Portuguese",
	native: "português",
	rule: [
		"Regra"
	],
	scenario: [
		"Exemplo",
		"Cenário",
		"Cenario"
	],
	scenarioOutline: [
		"Esquema do Cenário",
		"Esquema do Cenario",
		"Delineação do Cenário",
		"Delineacao do Cenario"
	],
	then: [
		"* ",
		"Então ",
		"Entao "
	],
	when: [
		"* ",
		"Quando "
	]
};
const ro = {
	and: [
		"* ",
		"Si ",
		"Și ",
		"Şi "
	],
	background: [
		"Context"
	],
	but: [
		"* ",
		"Dar "
	],
	examples: [
		"Exemple"
	],
	feature: [
		"Functionalitate",
		"Funcționalitate",
		"Funcţionalitate"
	],
	given: [
		"* ",
		"Date fiind ",
		"Dat fiind ",
		"Dată fiind",
		"Dati fiind ",
		"Dați fiind ",
		"Daţi fiind "
	],
	name: "Romanian",
	native: "română",
	rule: [
		"Rule"
	],
	scenario: [
		"Exemplu",
		"Scenariu"
	],
	scenarioOutline: [
		"Structura scenariu",
		"Structură scenariu"
	],
	then: [
		"* ",
		"Atunci "
	],
	when: [
		"* ",
		"Cand ",
		"Când "
	]
};
const ru = {
	and: [
		"* ",
		"И ",
		"К тому же ",
		"Также "
	],
	background: [
		"Предыстория",
		"Контекст"
	],
	but: [
		"* ",
		"Но ",
		"А ",
		"Иначе "
	],
	examples: [
		"Примеры",
		"Значения"
	],
	feature: [
		"Функция",
		"Функциональность",
		"Функционал",
		"Свойство",
		"Фича"
	],
	given: [
		"* ",
		"Допустим ",
		"Дано ",
		"Пусть "
	],
	name: "Russian",
	native: "русский",
	rule: [
		"Правило"
	],
	scenario: [
		"Пример",
		"Сценарий"
	],
	scenarioOutline: [
		"Структура сценария",
		"Шаблон сценария"
	],
	then: [
		"* ",
		"То ",
		"Затем ",
		"Тогда "
	],
	when: [
		"* ",
		"Когда ",
		"Если "
	]
};
const sk = {
	and: [
		"* ",
		"A ",
		"A tiež ",
		"A taktiež ",
		"A zároveň "
	],
	background: [
		"Pozadie"
	],
	but: [
		"* ",
		"Ale "
	],
	examples: [
		"Príklady"
	],
	feature: [
		"Požiadavka",
		"Funkcia",
		"Vlastnosť"
	],
	given: [
		"* ",
		"Pokiaľ ",
		"Za predpokladu "
	],
	name: "Slovak",
	native: "Slovensky",
	rule: [
		"Rule"
	],
	scenario: [
		"Príklad",
		"Scenár"
	],
	scenarioOutline: [
		"Náčrt Scenáru",
		"Náčrt Scenára",
		"Osnova Scenára"
	],
	then: [
		"* ",
		"Tak ",
		"Potom "
	],
	when: [
		"* ",
		"Keď ",
		"Ak "
	]
};
const sl = {
	and: [
		"In ",
		"Ter "
	],
	background: [
		"Kontekst",
		"Osnova",
		"Ozadje"
	],
	but: [
		"Toda ",
		"Ampak ",
		"Vendar "
	],
	examples: [
		"Primeri",
		"Scenariji"
	],
	feature: [
		"Funkcionalnost",
		"Funkcija",
		"Možnosti",
		"Moznosti",
		"Lastnost",
		"Značilnost"
	],
	given: [
		"Dano ",
		"Podano ",
		"Zaradi ",
		"Privzeto "
	],
	name: "Slovenian",
	native: "Slovenski",
	rule: [
		"Rule"
	],
	scenario: [
		"Primer",
		"Scenarij"
	],
	scenarioOutline: [
		"Struktura scenarija",
		"Skica",
		"Koncept",
		"Oris scenarija",
		"Osnutek"
	],
	then: [
		"Nato ",
		"Potem ",
		"Takrat "
	],
	when: [
		"Ko ",
		"Ce ",
		"Če ",
		"Kadar "
	]
};
const sv = {
	and: [
		"* ",
		"Och "
	],
	background: [
		"Bakgrund"
	],
	but: [
		"* ",
		"Men "
	],
	examples: [
		"Exempel"
	],
	feature: [
		"Egenskap"
	],
	given: [
		"* ",
		"Givet "
	],
	name: "Swedish",
	native: "Svenska",
	rule: [
		"Regel"
	],
	scenario: [
		"Scenario"
	],
	scenarioOutline: [
		"Abstrakt Scenario",
		"Scenariomall"
	],
	then: [
		"* ",
		"Så "
	],
	when: [
		"* ",
		"När "
	]
};
const ta = {
	and: [
		"* ",
		"மேலும் ",
		"மற்றும் "
	],
	background: [
		"பின்னணி"
	],
	but: [
		"* ",
		"ஆனால் "
	],
	examples: [
		"எடுத்துக்காட்டுகள்",
		"காட்சிகள்",
		"நிலைமைகளில்"
	],
	feature: [
		"அம்சம்",
		"வணிக தேவை",
		"திறன்"
	],
	given: [
		"* ",
		"கொடுக்கப்பட்ட "
	],
	name: "Tamil",
	native: "தமிழ்",
	rule: [
		"Rule"
	],
	scenario: [
		"உதாரணமாக",
		"காட்சி"
	],
	scenarioOutline: [
		"காட்சி சுருக்கம்",
		"காட்சி வார்ப்புரு"
	],
	then: [
		"* ",
		"அப்பொழுது "
	],
	when: [
		"* ",
		"எப்போது "
	]
};
const th = {
	and: [
		"* ",
		"และ "
	],
	background: [
		"แนวคิด"
	],
	but: [
		"* ",
		"แต่ "
	],
	examples: [
		"ชุดของตัวอย่าง",
		"ชุดของเหตุการณ์"
	],
	feature: [
		"โครงหลัก",
		"ความต้องการทางธุรกิจ",
		"ความสามารถ"
	],
	given: [
		"* ",
		"กำหนดให้ "
	],
	name: "Thai",
	native: "ไทย",
	rule: [
		"Rule"
	],
	scenario: [
		"เหตุการณ์"
	],
	scenarioOutline: [
		"สรุปเหตุการณ์",
		"โครงสร้างของเหตุการณ์"
	],
	then: [
		"* ",
		"ดังนั้น "
	],
	when: [
		"* ",
		"เมื่อ "
	]
};
const te = {
	and: [
		"* ",
		"మరియు "
	],
	background: [
		"నేపథ్యం"
	],
	but: [
		"* ",
		"కాని "
	],
	examples: [
		"ఉదాహరణలు"
	],
	feature: [
		"గుణము"
	],
	given: [
		"* ",
		"చెప్పబడినది "
	],
	name: "Telugu",
	native: "తెలుగు",
	rule: [
		"Rule"
	],
	scenario: [
		"ఉదాహరణ",
		"సన్నివేశం"
	],
	scenarioOutline: [
		"కథనం"
	],
	then: [
		"* ",
		"అప్పుడు "
	],
	when: [
		"* ",
		"ఈ పరిస్థితిలో "
	]
};
const tlh = {
	and: [
		"* ",
		"'ej ",
		"latlh "
	],
	background: [
		"mo'"
	],
	but: [
		"* ",
		"'ach ",
		"'a "
	],
	examples: [
		"ghantoH",
		"lutmey"
	],
	feature: [
		"Qap",
		"Qu'meH 'ut",
		"perbogh",
		"poQbogh malja'",
		"laH"
	],
	given: [
		"* ",
		"ghu' noblu' ",
		"DaH ghu' bejlu' "
	],
	name: "Klingon",
	native: "tlhIngan",
	rule: [
		"Rule"
	],
	scenario: [
		"lut"
	],
	scenarioOutline: [
		"lut chovnatlh"
	],
	then: [
		"* ",
		"vaj "
	],
	when: [
		"* ",
		"qaSDI' "
	]
};
const tr = {
	and: [
		"* ",
		"Ve "
	],
	background: [
		"Geçmiş"
	],
	but: [
		"* ",
		"Fakat ",
		"Ama "
	],
	examples: [
		"Örnekler"
	],
	feature: [
		"Özellik"
	],
	given: [
		"* ",
		"Diyelim ki "
	],
	name: "Turkish",
	native: "Türkçe",
	rule: [
		"Kural"
	],
	scenario: [
		"Örnek",
		"Senaryo"
	],
	scenarioOutline: [
		"Senaryo taslağı"
	],
	then: [
		"* ",
		"O zaman "
	],
	when: [
		"* ",
		"Eğer ki "
	]
};
const tt = {
	and: [
		"* ",
		"Һәм ",
		"Вә "
	],
	background: [
		"Кереш"
	],
	but: [
		"* ",
		"Ләкин ",
		"Әмма "
	],
	examples: [
		"Үрнәкләр",
		"Мисаллар"
	],
	feature: [
		"Мөмкинлек",
		"Үзенчәлеклелек"
	],
	given: [
		"* ",
		"Әйтик "
	],
	name: "Tatar",
	native: "Татарча",
	rule: [
		"Rule"
	],
	scenario: [
		"Сценарий"
	],
	scenarioOutline: [
		"Сценарийның төзелеше"
	],
	then: [
		"* ",
		"Нәтиҗәдә "
	],
	when: [
		"* ",
		"Әгәр "
	]
};
const uk = {
	and: [
		"* ",
		"І ",
		"А також ",
		"Та "
	],
	background: [
		"Передумова"
	],
	but: [
		"* ",
		"Але "
	],
	examples: [
		"Приклади"
	],
	feature: [
		"Функціонал"
	],
	given: [
		"* ",
		"Припустимо ",
		"Припустимо, що ",
		"Нехай ",
		"Дано "
	],
	name: "Ukrainian",
	native: "Українська",
	rule: [
		"Rule"
	],
	scenario: [
		"Приклад",
		"Сценарій"
	],
	scenarioOutline: [
		"Структура сценарію"
	],
	then: [
		"* ",
		"То ",
		"Тоді "
	],
	when: [
		"* ",
		"Якщо ",
		"Коли "
	]
};
const ur = {
	and: [
		"* ",
		"اور "
	],
	background: [
		"پس منظر"
	],
	but: [
		"* ",
		"لیکن "
	],
	examples: [
		"مثالیں"
	],
	feature: [
		"صلاحیت",
		"کاروبار کی ضرورت",
		"خصوصیت"
	],
	given: [
		"* ",
		"اگر ",
		"بالفرض ",
		"فرض کیا "
	],
	name: "Urdu",
	native: "اردو",
	rule: [
		"Rule"
	],
	scenario: [
		"منظرنامہ"
	],
	scenarioOutline: [
		"منظر نامے کا خاکہ"
	],
	then: [
		"* ",
		"پھر ",
		"تب "
	],
	when: [
		"* ",
		"جب "
	]
};
const uz = {
	and: [
		"* ",
		"Ва "
	],
	background: [
		"Тарих"
	],
	but: [
		"* ",
		"Лекин ",
		"Бирок ",
		"Аммо "
	],
	examples: [
		"Мисоллар"
	],
	feature: [
		"Функционал"
	],
	given: [
		"* ",
		"Belgilangan "
	],
	name: "Uzbek",
	native: "Узбекча",
	rule: [
		"Rule"
	],
	scenario: [
		"Сценарий"
	],
	scenarioOutline: [
		"Сценарий структураси"
	],
	then: [
		"* ",
		"Унда "
	],
	when: [
		"* ",
		"Агар "
	]
};
const vi = {
	and: [
		"* ",
		"Và "
	],
	background: [
		"Bối cảnh"
	],
	but: [
		"* ",
		"Nhưng "
	],
	examples: [
		"Dữ liệu"
	],
	feature: [
		"Tính năng"
	],
	given: [
		"* ",
		"Biết ",
		"Cho "
	],
	name: "Vietnamese",
	native: "Tiếng Việt",
	rule: [
		"Quy tắc"
	],
	scenario: [
		"Tình huống",
		"Kịch bản"
	],
	scenarioOutline: [
		"Khung tình huống",
		"Khung kịch bản"
	],
	then: [
		"* ",
		"Thì "
	],
	when: [
		"* ",
		"Khi "
	]
};
const ml = {
	and: [
		"* ",
		"ഒപ്പം"
	],
	background: [
		"പശ്ചാത്തലം"
	],
	but: [
		"* ",
		"പക്ഷേ"
	],
	examples: [
		"ഉദാഹരണങ്ങൾ"
	],
	feature: [
		"സവിശേഷത"
	],
	given: [
		"* ",
		"നൽകിയത്"
	],
	name: "Malayalam",
	native: "മലയാളം",
	rule: [
		"നിയമം"
	],
	scenario: [
		"രംഗം"
	],
	scenarioOutline: [
		"സാഹചര്യത്തിന്റെ രൂപരേഖ"
	],
	then: [
		"* ",
		"പിന്നെ"
	],
	when: [
		"എപ്പോൾ"
	]
};
const mr = {
	and: [
		"* ",
		"आणि ",
		"तसेच "
	],
	background: [
		"पार्श्वभूमी"
	],
	but: [
		"* ",
		"पण ",
		"परंतु "
	],
	examples: [
		"उदाहरण"
	],
	feature: [
		"वैशिष्ट्य",
		"सुविधा"
	],
	given: [
		"* ",
		"जर",
		"दिलेल्या प्रमाणे "
	],
	name: "Marathi",
	native: "मराठी",
	rule: [
		"नियम"
	],
	scenario: [
		"परिदृश्य"
	],
	scenarioOutline: [
		"परिदृश्य रूपरेखा"
	],
	then: [
		"* ",
		"मग ",
		"तेव्हा "
	],
	when: [
		"* ",
		"जेव्हा "
	]
};
const amh = {
	and: [
		"* ",
		"እና "
	],
	background: [
		"ቅድመ ሁኔታ",
		"መነሻ",
		"መነሻ ሀሳብ"
	],
	but: [
		"* ",
		"ግን "
	],
	examples: [
		"ምሳሌዎች",
		"ሁናቴዎች"
	],
	feature: [
		"ስራ",
		"የተፈለገው ስራ",
		"የሚፈለገው ድርጊት"
	],
	given: [
		"* ",
		"የተሰጠ "
	],
	name: "Amharic",
	native: "አማርኛ",
	rule: [
		"ህግ"
	],
	scenario: [
		"ምሳሌ",
		"ሁናቴ"
	],
	scenarioOutline: [
		"ሁናቴ ዝርዝር",
		"ሁናቴ አብነት"
	],
	then: [
		"* ",
		"ከዚያ "
	],
	when: [
		"* ",
		"መቼ "
	]
};
const gherkinLanguages = {
	af: af,
	am: am,
	an: an,
	ar: ar,
	ast: ast,
	az: az,
	be: be,
	bg: bg,
	bm: bm,
	bs: bs,
	ca: ca,
	cs: cs,
	"cy-GB": {
	and: [
		"* ",
		"A "
	],
	background: [
		"Cefndir"
	],
	but: [
		"* ",
		"Ond "
	],
	examples: [
		"Enghreifftiau"
	],
	feature: [
		"Arwedd"
	],
	given: [
		"* ",
		"Anrhegedig a "
	],
	name: "Welsh",
	native: "Cymraeg",
	rule: [
		"Rule"
	],
	scenario: [
		"Enghraifft",
		"Scenario"
	],
	scenarioOutline: [
		"Scenario Amlinellol"
	],
	then: [
		"* ",
		"Yna "
	],
	when: [
		"* ",
		"Pryd "
	]
},
	da: da,
	de: de,
	el: el,
	em: em,
	en: en,
	"en-Scouse": {
	and: [
		"* ",
		"An "
	],
	background: [
		"Dis is what went down"
	],
	but: [
		"* ",
		"Buh "
	],
	examples: [
		"Examples"
	],
	feature: [
		"Feature"
	],
	given: [
		"* ",
		"Givun ",
		"Youse know when youse got "
	],
	name: "Scouse",
	native: "Scouse",
	rule: [
		"Rule"
	],
	scenario: [
		"The thing of it is"
	],
	scenarioOutline: [
		"Wharrimean is"
	],
	then: [
		"* ",
		"Dun ",
		"Den youse gotta "
	],
	when: [
		"* ",
		"Wun ",
		"Youse know like when "
	]
},
	"en-au": {
	and: [
		"* ",
		"Too right "
	],
	background: [
		"First off"
	],
	but: [
		"* ",
		"Yeah nah "
	],
	examples: [
		"You'll wanna"
	],
	feature: [
		"Pretty much"
	],
	given: [
		"* ",
		"Y'know "
	],
	name: "Australian",
	native: "Australian",
	rule: [
		"Rule"
	],
	scenario: [
		"Awww, look mate"
	],
	scenarioOutline: [
		"Reckon it's like"
	],
	then: [
		"* ",
		"But at the end of the day I reckon "
	],
	when: [
		"* ",
		"It's just unbelievable "
	]
},
	"en-lol": {
	and: [
		"* ",
		"AN "
	],
	background: [
		"B4"
	],
	but: [
		"* ",
		"BUT "
	],
	examples: [
		"EXAMPLZ"
	],
	feature: [
		"OH HAI"
	],
	given: [
		"* ",
		"I CAN HAZ "
	],
	name: "LOLCAT",
	native: "LOLCAT",
	rule: [
		"Rule"
	],
	scenario: [
		"MISHUN"
	],
	scenarioOutline: [
		"MISHUN SRSLY"
	],
	then: [
		"* ",
		"DEN "
	],
	when: [
		"* ",
		"WEN "
	]
},
	"en-old": {
	and: [
		"* ",
		"Ond ",
		"7 "
	],
	background: [
		"Aer",
		"Ær"
	],
	but: [
		"* ",
		"Ac "
	],
	examples: [
		"Se the",
		"Se þe",
		"Se ðe"
	],
	feature: [
		"Hwaet",
		"Hwæt"
	],
	given: [
		"* ",
		"Thurh ",
		"Þurh ",
		"Ðurh "
	],
	name: "Old English",
	native: "Englisc",
	rule: [
		"Rule"
	],
	scenario: [
		"Swa"
	],
	scenarioOutline: [
		"Swa hwaer swa",
		"Swa hwær swa"
	],
	then: [
		"* ",
		"Tha ",
		"Þa ",
		"Ða ",
		"Tha the ",
		"Þa þe ",
		"Ða ðe "
	],
	when: [
		"* ",
		"Bæþsealf ",
		"Bæþsealfa ",
		"Bæþsealfe ",
		"Ciricæw ",
		"Ciricæwe ",
		"Ciricæwa "
	]
},
	"en-pirate": {
	and: [
		"* ",
		"Aye "
	],
	background: [
		"Yo-ho-ho"
	],
	but: [
		"* ",
		"Avast! "
	],
	examples: [
		"Dead men tell no tales"
	],
	feature: [
		"Ahoy matey!"
	],
	given: [
		"* ",
		"Gangway! "
	],
	name: "Pirate",
	native: "Pirate",
	rule: [
		"Rule"
	],
	scenario: [
		"Heave to"
	],
	scenarioOutline: [
		"Shiver me timbers"
	],
	then: [
		"* ",
		"Let go and haul "
	],
	when: [
		"* ",
		"Blimey! "
	]
},
	"en-tx": {
	and: [
		"Come hell or high water "
	],
	background: [
		"Lemme tell y'all a story"
	],
	but: [
		"Well now hold on, I'll you what "
	],
	examples: [
		"Now that's a story longer than a cattle drive in July"
	],
	feature: [
		"This ain’t my first rodeo",
		"All gussied up"
	],
	given: [
		"Fixin' to ",
		"All git out "
	],
	name: "Texas",
	native: "Texas",
	rule: [
		"Rule "
	],
	scenario: [
		"All hat and no cattle"
	],
	scenarioOutline: [
		"Serious as a snake bite",
		"Busy as a hound in flea season"
	],
	then: [
		"There’s no tree but bears some fruit "
	],
	when: [
		"Quick out of the chute "
	]
},
	eo: eo,
	es: es,
	et: et,
	fa: fa,
	fi: fi,
	fr: fr,
	ga: ga,
	gj: gj,
	gl: gl,
	he: he,
	hi: hi,
	hr: hr,
	ht: ht,
	hu: hu,
	id: id,
	is: is,
	it: it,
	ja: ja,
	jv: jv,
	ka: ka,
	kn: kn,
	ko: ko,
	lt: lt,
	lu: lu,
	lv: lv,
	"mk-Cyrl": {
	and: [
		"* ",
		"И "
	],
	background: [
		"Контекст",
		"Содржина"
	],
	but: [
		"* ",
		"Но "
	],
	examples: [
		"Примери",
		"Сценарија"
	],
	feature: [
		"Функционалност",
		"Бизнис потреба",
		"Можност"
	],
	given: [
		"* ",
		"Дадено ",
		"Дадена "
	],
	name: "Macedonian",
	native: "Македонски",
	rule: [
		"Rule"
	],
	scenario: [
		"Пример",
		"Сценарио",
		"На пример"
	],
	scenarioOutline: [
		"Преглед на сценарија",
		"Скица",
		"Концепт"
	],
	then: [
		"* ",
		"Тогаш "
	],
	when: [
		"* ",
		"Кога "
	]
},
	"mk-Latn": {
	and: [
		"* ",
		"I "
	],
	background: [
		"Kontekst",
		"Sodrzhina"
	],
	but: [
		"* ",
		"No "
	],
	examples: [
		"Primeri",
		"Scenaria"
	],
	feature: [
		"Funkcionalnost",
		"Biznis potreba",
		"Mozhnost"
	],
	given: [
		"* ",
		"Dadeno ",
		"Dadena "
	],
	name: "Macedonian (Latin)",
	native: "Makedonski (Latinica)",
	rule: [
		"Rule"
	],
	scenario: [
		"Scenario",
		"Na primer"
	],
	scenarioOutline: [
		"Pregled na scenarija",
		"Skica",
		"Koncept"
	],
	then: [
		"* ",
		"Togash "
	],
	when: [
		"* ",
		"Koga "
	]
},
	mn: mn,
	ne: ne,
	nl: nl,
	no: no,
	pa: pa,
	pl: pl,
	pt: pt,
	ro: ro,
	ru: ru,
	sk: sk,
	sl: sl,
	"sr-Cyrl": {
	and: [
		"* ",
		"И "
	],
	background: [
		"Контекст",
		"Основа",
		"Позадина"
	],
	but: [
		"* ",
		"Али "
	],
	examples: [
		"Примери",
		"Сценарији"
	],
	feature: [
		"Функционалност",
		"Могућност",
		"Особина"
	],
	given: [
		"* ",
		"За дато ",
		"За дате ",
		"За дати "
	],
	name: "Serbian",
	native: "Српски",
	rule: [
		"Правило"
	],
	scenario: [
		"Сценарио",
		"Пример"
	],
	scenarioOutline: [
		"Структура сценарија",
		"Скица",
		"Концепт"
	],
	then: [
		"* ",
		"Онда "
	],
	when: [
		"* ",
		"Када ",
		"Кад "
	]
},
	"sr-Latn": {
	and: [
		"* ",
		"I "
	],
	background: [
		"Kontekst",
		"Osnova",
		"Pozadina"
	],
	but: [
		"* ",
		"Ali "
	],
	examples: [
		"Primeri",
		"Scenariji"
	],
	feature: [
		"Funkcionalnost",
		"Mogućnost",
		"Mogucnost",
		"Osobina"
	],
	given: [
		"* ",
		"Za dato ",
		"Za date ",
		"Za dati "
	],
	name: "Serbian (Latin)",
	native: "Srpski (Latinica)",
	rule: [
		"Pravilo"
	],
	scenario: [
		"Scenario",
		"Primer"
	],
	scenarioOutline: [
		"Struktura scenarija",
		"Skica",
		"Koncept"
	],
	then: [
		"* ",
		"Onda "
	],
	when: [
		"* ",
		"Kada ",
		"Kad "
	]
},
	sv: sv,
	ta: ta,
	th: th,
	te: te,
	tlh: tlh,
	tr: tr,
	tt: tt,
	uk: uk,
	ur: ur,
	uz: uz,
	vi: vi,
	"zh-CN": {
	and: [
		"* ",
		"而且",
		"并且",
		"同时"
	],
	background: [
		"背景"
	],
	but: [
		"* ",
		"但是"
	],
	examples: [
		"例子"
	],
	feature: [
		"功能"
	],
	given: [
		"* ",
		"假如",
		"假设",
		"假定"
	],
	name: "Chinese simplified",
	native: "简体中文",
	rule: [
		"Rule",
		"规则"
	],
	scenario: [
		"场景",
		"剧本"
	],
	scenarioOutline: [
		"场景大纲",
		"剧本大纲"
	],
	then: [
		"* ",
		"那么"
	],
	when: [
		"* ",
		"当"
	]
},
	ml: ml,
	"zh-TW": {
	and: [
		"* ",
		"而且",
		"並且",
		"同時"
	],
	background: [
		"背景"
	],
	but: [
		"* ",
		"但是"
	],
	examples: [
		"例子"
	],
	feature: [
		"功能"
	],
	given: [
		"* ",
		"假如",
		"假設",
		"假定"
	],
	name: "Chinese traditional",
	native: "繁體中文",
	rule: [
		"Rule"
	],
	scenario: [
		"場景",
		"劇本"
	],
	scenarioOutline: [
		"場景大綱",
		"劇本大綱"
	],
	then: [
		"* ",
		"那麼"
	],
	when: [
		"* ",
		"當"
	]
},
	mr: mr,
	amh: amh
};

const gherkinLanguages$1 = {
	__proto__: null,
	af: af,
	am: am,
	amh: amh,
	an: an,
	ar: ar,
	ast: ast,
	az: az,
	be: be,
	bg: bg,
	bm: bm,
	bs: bs,
	ca: ca,
	cs: cs,
	da: da,
	de: de,
	default: gherkinLanguages,
	el: el,
	em: em,
	en: en,
	eo: eo,
	es: es,
	et: et,
	fa: fa,
	fi: fi,
	fr: fr,
	ga: ga,
	gj: gj,
	gl: gl,
	he: he,
	hi: hi,
	hr: hr,
	ht: ht,
	hu: hu,
	id: id,
	is: is,
	it: it,
	ja: ja,
	jv: jv,
	ka: ka,
	kn: kn,
	ko: ko,
	lt: lt,
	lu: lu,
	lv: lv,
	ml: ml,
	mn: mn,
	mr: mr,
	ne: ne,
	nl: nl,
	no: no,
	pa: pa,
	pl: pl,
	pt: pt,
	ro: ro,
	ru: ru,
	sk: sk,
	sl: sl,
	sv: sv,
	ta: ta,
	te: te,
	th: th,
	tlh: tlh,
	tr: tr,
	tt: tt,
	uk: uk,
	ur: ur,
	uz: uz,
	vi: vi
};

const require$$7 = /*@__PURE__*/getAugmentedNamespace(gherkinLanguages$1);

var src = {};

var TimeConversion = {};

var hasRequiredTimeConversion;

function requireTimeConversion () {
	if (hasRequiredTimeConversion) return TimeConversion;
	hasRequiredTimeConversion = 1;
	Object.defineProperty(TimeConversion, "__esModule", { value: true });
	TimeConversion.millisecondsSinceEpochToTimestamp = millisecondsSinceEpochToTimestamp;
	TimeConversion.millisecondsToDuration = millisecondsToDuration;
	TimeConversion.timestampToMillisecondsSinceEpoch = timestampToMillisecondsSinceEpoch;
	TimeConversion.durationToMilliseconds = durationToMilliseconds;
	TimeConversion.addDurations = addDurations;
	var MILLISECONDS_PER_SECOND = 1e3;
	var NANOSECONDS_PER_MILLISECOND = 1e6;
	var NANOSECONDS_PER_SECOND = 1e9;
	function millisecondsSinceEpochToTimestamp(millisecondsSinceEpoch) {
	    return toSecondsAndNanos(millisecondsSinceEpoch);
	}
	function millisecondsToDuration(durationInMilliseconds) {
	    return toSecondsAndNanos(durationInMilliseconds);
	}
	function timestampToMillisecondsSinceEpoch(timestamp) {
	    var seconds = timestamp.seconds, nanos = timestamp.nanos;
	    return toMillis(seconds, nanos);
	}
	function durationToMilliseconds(duration) {
	    var seconds = duration.seconds, nanos = duration.nanos;
	    return toMillis(seconds, nanos);
	}
	function addDurations(durationA, durationB) {
	    var seconds = +durationA.seconds + +durationB.seconds;
	    var nanos = durationA.nanos + durationB.nanos;
	    if (nanos >= NANOSECONDS_PER_SECOND) {
	        seconds += 1;
	        nanos -= NANOSECONDS_PER_SECOND;
	    }
	    return { seconds: seconds, nanos: nanos };
	}
	function toSecondsAndNanos(milliseconds) {
	    var seconds = Math.floor(milliseconds / MILLISECONDS_PER_SECOND);
	    var nanos = Math.floor((milliseconds % MILLISECONDS_PER_SECOND) * NANOSECONDS_PER_MILLISECOND);
	    return { seconds: seconds, nanos: nanos };
	}
	function toMillis(seconds, nanos) {
	    var secondMillis = +seconds * MILLISECONDS_PER_SECOND;
	    var nanoMillis = nanos / NANOSECONDS_PER_MILLISECOND;
	    return secondMillis + nanoMillis;
	}
	
	return TimeConversion;
}

var IdGenerator = {};

var hasRequiredIdGenerator;

function requireIdGenerator () {
	if (hasRequiredIdGenerator) return IdGenerator;
	hasRequiredIdGenerator = 1;
	Object.defineProperty(IdGenerator, "__esModule", { value: true });
	IdGenerator.uuid = uuid;
	IdGenerator.incrementing = incrementing;
	function uuid() {
	    return function () { return crypto.randomUUID(); };
	}
	function incrementing() {
	    var next = 0;
	    return function () { return (next++).toString(); };
	}
	
	return IdGenerator;
}

var parseEnvelope = {};

var messages = {};

var TransformationType;
(function (TransformationType) {
    TransformationType[TransformationType["PLAIN_TO_CLASS"] = 0] = "PLAIN_TO_CLASS";
    TransformationType[TransformationType["CLASS_TO_PLAIN"] = 1] = "CLASS_TO_PLAIN";
    TransformationType[TransformationType["CLASS_TO_CLASS"] = 2] = "CLASS_TO_CLASS";
})(TransformationType || (TransformationType = {}));

/**
 * Storage all library metadata.
 */
var MetadataStorage = /** @class */ (function () {
    function MetadataStorage() {
        // -------------------------------------------------------------------------
        // Properties
        // -------------------------------------------------------------------------
        this._typeMetadatas = new Map();
        this._transformMetadatas = new Map();
        this._exposeMetadatas = new Map();
        this._excludeMetadatas = new Map();
        this._ancestorsMap = new Map();
    }
    // -------------------------------------------------------------------------
    // Adder Methods
    // -------------------------------------------------------------------------
    MetadataStorage.prototype.addTypeMetadata = function (metadata) {
        if (!this._typeMetadatas.has(metadata.target)) {
            this._typeMetadatas.set(metadata.target, new Map());
        }
        this._typeMetadatas.get(metadata.target).set(metadata.propertyName, metadata);
    };
    MetadataStorage.prototype.addTransformMetadata = function (metadata) {
        if (!this._transformMetadatas.has(metadata.target)) {
            this._transformMetadatas.set(metadata.target, new Map());
        }
        if (!this._transformMetadatas.get(metadata.target).has(metadata.propertyName)) {
            this._transformMetadatas.get(metadata.target).set(metadata.propertyName, []);
        }
        this._transformMetadatas.get(metadata.target).get(metadata.propertyName).push(metadata);
    };
    MetadataStorage.prototype.addExposeMetadata = function (metadata) {
        if (!this._exposeMetadatas.has(metadata.target)) {
            this._exposeMetadatas.set(metadata.target, new Map());
        }
        this._exposeMetadatas.get(metadata.target).set(metadata.propertyName, metadata);
    };
    MetadataStorage.prototype.addExcludeMetadata = function (metadata) {
        if (!this._excludeMetadatas.has(metadata.target)) {
            this._excludeMetadatas.set(metadata.target, new Map());
        }
        this._excludeMetadatas.get(metadata.target).set(metadata.propertyName, metadata);
    };
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    MetadataStorage.prototype.findTransformMetadatas = function (target, propertyName, transformationType) {
        return this.findMetadatas(this._transformMetadatas, target, propertyName).filter(function (metadata) {
            if (!metadata.options)
                return true;
            if (metadata.options.toClassOnly === true && metadata.options.toPlainOnly === true)
                return true;
            if (metadata.options.toClassOnly === true) {
                return (transformationType === TransformationType.CLASS_TO_CLASS ||
                    transformationType === TransformationType.PLAIN_TO_CLASS);
            }
            if (metadata.options.toPlainOnly === true) {
                return transformationType === TransformationType.CLASS_TO_PLAIN;
            }
            return true;
        });
    };
    MetadataStorage.prototype.findExcludeMetadata = function (target, propertyName) {
        return this.findMetadata(this._excludeMetadatas, target, propertyName);
    };
    MetadataStorage.prototype.findExposeMetadata = function (target, propertyName) {
        return this.findMetadata(this._exposeMetadatas, target, propertyName);
    };
    MetadataStorage.prototype.findExposeMetadataByCustomName = function (target, name) {
        return this.getExposedMetadatas(target).find(function (metadata) {
            return metadata.options && metadata.options.name === name;
        });
    };
    MetadataStorage.prototype.findTypeMetadata = function (target, propertyName) {
        return this.findMetadata(this._typeMetadatas, target, propertyName);
    };
    MetadataStorage.prototype.getStrategy = function (target) {
        var excludeMap = this._excludeMetadatas.get(target);
        var exclude = excludeMap && excludeMap.get(undefined);
        var exposeMap = this._exposeMetadatas.get(target);
        var expose = exposeMap && exposeMap.get(undefined);
        if ((exclude && expose) || (!exclude && !expose))
            return 'none';
        return exclude ? 'excludeAll' : 'exposeAll';
    };
    MetadataStorage.prototype.getExposedMetadatas = function (target) {
        return this.getMetadata(this._exposeMetadatas, target);
    };
    MetadataStorage.prototype.getExcludedMetadatas = function (target) {
        return this.getMetadata(this._excludeMetadatas, target);
    };
    MetadataStorage.prototype.getExposedProperties = function (target, transformationType) {
        return this.getExposedMetadatas(target)
            .filter(function (metadata) {
            if (!metadata.options)
                return true;
            if (metadata.options.toClassOnly === true && metadata.options.toPlainOnly === true)
                return true;
            if (metadata.options.toClassOnly === true) {
                return (transformationType === TransformationType.CLASS_TO_CLASS ||
                    transformationType === TransformationType.PLAIN_TO_CLASS);
            }
            if (metadata.options.toPlainOnly === true) {
                return transformationType === TransformationType.CLASS_TO_PLAIN;
            }
            return true;
        })
            .map(function (metadata) { return metadata.propertyName; });
    };
    MetadataStorage.prototype.getExcludedProperties = function (target, transformationType) {
        return this.getExcludedMetadatas(target)
            .filter(function (metadata) {
            if (!metadata.options)
                return true;
            if (metadata.options.toClassOnly === true && metadata.options.toPlainOnly === true)
                return true;
            if (metadata.options.toClassOnly === true) {
                return (transformationType === TransformationType.CLASS_TO_CLASS ||
                    transformationType === TransformationType.PLAIN_TO_CLASS);
            }
            if (metadata.options.toPlainOnly === true) {
                return transformationType === TransformationType.CLASS_TO_PLAIN;
            }
            return true;
        })
            .map(function (metadata) { return metadata.propertyName; });
    };
    MetadataStorage.prototype.clear = function () {
        this._typeMetadatas.clear();
        this._exposeMetadatas.clear();
        this._excludeMetadatas.clear();
        this._ancestorsMap.clear();
    };
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------
    MetadataStorage.prototype.getMetadata = function (metadatas, target) {
        var metadataFromTargetMap = metadatas.get(target);
        var metadataFromTarget;
        if (metadataFromTargetMap) {
            metadataFromTarget = Array.from(metadataFromTargetMap.values()).filter(function (meta) { return meta.propertyName !== undefined; });
        }
        var metadataFromAncestors = [];
        for (var _i = 0, _a = this.getAncestors(target); _i < _a.length; _i++) {
            var ancestor = _a[_i];
            var ancestorMetadataMap = metadatas.get(ancestor);
            if (ancestorMetadataMap) {
                var metadataFromAncestor = Array.from(ancestorMetadataMap.values()).filter(function (meta) { return meta.propertyName !== undefined; });
                metadataFromAncestors.push.apply(metadataFromAncestors, metadataFromAncestor);
            }
        }
        return metadataFromAncestors.concat(metadataFromTarget || []);
    };
    MetadataStorage.prototype.findMetadata = function (metadatas, target, propertyName) {
        var metadataFromTargetMap = metadatas.get(target);
        if (metadataFromTargetMap) {
            var metadataFromTarget = metadataFromTargetMap.get(propertyName);
            if (metadataFromTarget) {
                return metadataFromTarget;
            }
        }
        for (var _i = 0, _a = this.getAncestors(target); _i < _a.length; _i++) {
            var ancestor = _a[_i];
            var ancestorMetadataMap = metadatas.get(ancestor);
            if (ancestorMetadataMap) {
                var ancestorResult = ancestorMetadataMap.get(propertyName);
                if (ancestorResult) {
                    return ancestorResult;
                }
            }
        }
        return undefined;
    };
    MetadataStorage.prototype.findMetadatas = function (metadatas, target, propertyName) {
        var metadataFromTargetMap = metadatas.get(target);
        var metadataFromTarget;
        if (metadataFromTargetMap) {
            metadataFromTarget = metadataFromTargetMap.get(propertyName);
        }
        var metadataFromAncestorsTarget = [];
        for (var _i = 0, _a = this.getAncestors(target); _i < _a.length; _i++) {
            var ancestor = _a[_i];
            var ancestorMetadataMap = metadatas.get(ancestor);
            if (ancestorMetadataMap) {
                if (ancestorMetadataMap.has(propertyName)) {
                    metadataFromAncestorsTarget.push.apply(metadataFromAncestorsTarget, ancestorMetadataMap.get(propertyName));
                }
            }
        }
        return metadataFromAncestorsTarget
            .slice()
            .reverse()
            .concat((metadataFromTarget || []).slice().reverse());
    };
    MetadataStorage.prototype.getAncestors = function (target) {
        if (!target)
            return [];
        if (!this._ancestorsMap.has(target)) {
            var ancestors = [];
            for (var baseClass = Object.getPrototypeOf(target.prototype.constructor); typeof baseClass.prototype !== 'undefined'; baseClass = Object.getPrototypeOf(baseClass.prototype.constructor)) {
                ancestors.push(baseClass);
            }
            this._ancestorsMap.set(target, ancestors);
        }
        return this._ancestorsMap.get(target);
    };
    return MetadataStorage;
}());

/**
 * Default metadata storage is used as singleton and can be used to storage all metadatas.
 */
var defaultMetadataStorage = new MetadataStorage();

/**
 * This function returns the global object across Node and browsers.
 *
 * Note: `globalThis` is the standardized approach however it has been added to
 * Node.js in version 12. We need to include this snippet until Node 12 EOL.
 */
function getGlobal() {
    if (typeof globalThis !== 'undefined') {
        return globalThis;
    }
    if (typeof global !== 'undefined') {
        return global;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Cannot find name 'window'.
    if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Cannot find name 'window'.
        return window;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Cannot find name 'self'.
    if (typeof self !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Cannot find name 'self'.
        return self;
    }
}

function isPromise(p) {
    return p !== null && typeof p === 'object' && typeof p.then === 'function';
}

var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
function instantiateArrayType(arrayType) {
    var array = new arrayType();
    if (!(array instanceof Set) && !('push' in array)) {
        return [];
    }
    return array;
}
var TransformOperationExecutor = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function TransformOperationExecutor(transformationType, options) {
        this.transformationType = transformationType;
        this.options = options;
        // -------------------------------------------------------------------------
        // Private Properties
        // -------------------------------------------------------------------------
        this.recursionStack = new Set();
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    TransformOperationExecutor.prototype.transform = function (source, value, targetType, arrayType, isMap, level) {
        var _this = this;
        if (level === void 0) { level = 0; }
        if (Array.isArray(value) || value instanceof Set) {
            var newValue_1 = arrayType && this.transformationType === TransformationType.PLAIN_TO_CLASS
                ? instantiateArrayType(arrayType)
                : [];
            value.forEach(function (subValue, index) {
                var subSource = source ? source[index] : undefined;
                if (!_this.options.enableCircularCheck || !_this.isCircular(subValue)) {
                    var realTargetType = void 0;
                    if (typeof targetType !== 'function' &&
                        targetType &&
                        targetType.options &&
                        targetType.options.discriminator &&
                        targetType.options.discriminator.property &&
                        targetType.options.discriminator.subTypes) {
                        if (_this.transformationType === TransformationType.PLAIN_TO_CLASS) {
                            realTargetType = targetType.options.discriminator.subTypes.find(function (subType) {
                                return subType.name === subValue[targetType.options.discriminator.property];
                            });
                            var options = { newObject: newValue_1, object: subValue, property: undefined };
                            var newType = targetType.typeFunction(options);
                            realTargetType === undefined ? (realTargetType = newType) : (realTargetType = realTargetType.value);
                            if (!targetType.options.keepDiscriminatorProperty)
                                delete subValue[targetType.options.discriminator.property];
                        }
                        if (_this.transformationType === TransformationType.CLASS_TO_CLASS) {
                            realTargetType = subValue.constructor;
                        }
                        if (_this.transformationType === TransformationType.CLASS_TO_PLAIN) {
                            subValue[targetType.options.discriminator.property] = targetType.options.discriminator.subTypes.find(function (subType) { return subType.value === subValue.constructor; }).name;
                        }
                    }
                    else {
                        realTargetType = targetType;
                    }
                    var value_1 = _this.transform(subSource, subValue, realTargetType, undefined, subValue instanceof Map, level + 1);
                    if (newValue_1 instanceof Set) {
                        newValue_1.add(value_1);
                    }
                    else {
                        newValue_1.push(value_1);
                    }
                }
                else if (_this.transformationType === TransformationType.CLASS_TO_CLASS) {
                    if (newValue_1 instanceof Set) {
                        newValue_1.add(subValue);
                    }
                    else {
                        newValue_1.push(subValue);
                    }
                }
            });
            return newValue_1;
        }
        else if (targetType === String && !isMap) {
            if (value === null || value === undefined)
                return value;
            return String(value);
        }
        else if (targetType === Number && !isMap) {
            if (value === null || value === undefined)
                return value;
            return Number(value);
        }
        else if (targetType === Boolean && !isMap) {
            if (value === null || value === undefined)
                return value;
            return Boolean(value);
        }
        else if ((targetType === Date || value instanceof Date) && !isMap) {
            if (value instanceof Date) {
                return new Date(value.valueOf());
            }
            if (value === null || value === undefined)
                return value;
            return new Date(value);
        }
        else if (!!getGlobal().Buffer && (targetType === Buffer || value instanceof Buffer) && !isMap) {
            if (value === null || value === undefined)
                return value;
            return Buffer.from(value);
        }
        else if (isPromise(value) && !isMap) {
            return new Promise(function (resolve, reject) {
                value.then(function (data) { return resolve(_this.transform(undefined, data, targetType, undefined, undefined, level + 1)); }, reject);
            });
        }
        else if (!isMap && value !== null && typeof value === 'object' && typeof value.then === 'function') {
            // Note: We should not enter this, as promise has been handled above
            // This option simply returns the Promise preventing a JS error from happening and should be an inaccessible path.
            return value; // skip promise transformation
        }
        else if (typeof value === 'object' && value !== null) {
            // try to guess the type
            if (!targetType && value.constructor !== Object /* && TransformationType === TransformationType.CLASS_TO_PLAIN*/)
                if (!Array.isArray(value) && value.constructor === Array) ;
                else {
                    // We are good we can use the built-in constructor
                    targetType = value.constructor;
                }
            if (!targetType && source)
                targetType = source.constructor;
            if (this.options.enableCircularCheck) {
                // add transformed type to prevent circular references
                this.recursionStack.add(value);
            }
            var keys = this.getKeys(targetType, value, isMap);
            var newValue = source ? source : {};
            if (!source &&
                (this.transformationType === TransformationType.PLAIN_TO_CLASS ||
                    this.transformationType === TransformationType.CLASS_TO_CLASS)) {
                if (isMap) {
                    newValue = new Map();
                }
                else if (targetType) {
                    newValue = new targetType();
                }
                else {
                    newValue = {};
                }
            }
            var _loop_1 = function (key) {
                if (key === '__proto__' || key === 'constructor') {
                    return "continue";
                }
                var valueKey = key;
                var newValueKey = key, propertyName = key;
                if (!this_1.options.ignoreDecorators && targetType) {
                    if (this_1.transformationType === TransformationType.PLAIN_TO_CLASS) {
                        var exposeMetadata = defaultMetadataStorage.findExposeMetadataByCustomName(targetType, key);
                        if (exposeMetadata) {
                            propertyName = exposeMetadata.propertyName;
                            newValueKey = exposeMetadata.propertyName;
                        }
                    }
                    else if (this_1.transformationType === TransformationType.CLASS_TO_PLAIN ||
                        this_1.transformationType === TransformationType.CLASS_TO_CLASS) {
                        var exposeMetadata = defaultMetadataStorage.findExposeMetadata(targetType, key);
                        if (exposeMetadata && exposeMetadata.options && exposeMetadata.options.name) {
                            newValueKey = exposeMetadata.options.name;
                        }
                    }
                }
                // get a subvalue
                var subValue = undefined;
                if (this_1.transformationType === TransformationType.PLAIN_TO_CLASS) {
                    /**
                     * This section is added for the following report:
                     * https://github.com/typestack/class-transformer/issues/596
                     *
                     * We should not call functions or constructors when transforming to class.
                     */
                    subValue = value[valueKey];
                }
                else {
                    if (value instanceof Map) {
                        subValue = value.get(valueKey);
                    }
                    else if (value[valueKey] instanceof Function) {
                        subValue = value[valueKey]();
                    }
                    else {
                        subValue = value[valueKey];
                    }
                }
                // determine a type
                var type = undefined, isSubValueMap = subValue instanceof Map;
                if (targetType && isMap) {
                    type = targetType;
                }
                else if (targetType) {
                    var metadata_1 = defaultMetadataStorage.findTypeMetadata(targetType, propertyName);
                    if (metadata_1) {
                        var options = { newObject: newValue, object: value, property: propertyName };
                        var newType = metadata_1.typeFunction ? metadata_1.typeFunction(options) : metadata_1.reflectedType;
                        if (metadata_1.options &&
                            metadata_1.options.discriminator &&
                            metadata_1.options.discriminator.property &&
                            metadata_1.options.discriminator.subTypes) {
                            if (!(value[valueKey] instanceof Array)) {
                                if (this_1.transformationType === TransformationType.PLAIN_TO_CLASS) {
                                    type = metadata_1.options.discriminator.subTypes.find(function (subType) {
                                        if (subValue && subValue instanceof Object && metadata_1.options.discriminator.property in subValue) {
                                            return subType.name === subValue[metadata_1.options.discriminator.property];
                                        }
                                    });
                                    type === undefined ? (type = newType) : (type = type.value);
                                    if (!metadata_1.options.keepDiscriminatorProperty) {
                                        if (subValue && subValue instanceof Object && metadata_1.options.discriminator.property in subValue) {
                                            delete subValue[metadata_1.options.discriminator.property];
                                        }
                                    }
                                }
                                if (this_1.transformationType === TransformationType.CLASS_TO_CLASS) {
                                    type = subValue.constructor;
                                }
                                if (this_1.transformationType === TransformationType.CLASS_TO_PLAIN) {
                                    if (subValue) {
                                        subValue[metadata_1.options.discriminator.property] = metadata_1.options.discriminator.subTypes.find(function (subType) { return subType.value === subValue.constructor; }).name;
                                    }
                                }
                            }
                            else {
                                type = metadata_1;
                            }
                        }
                        else {
                            type = newType;
                        }
                        isSubValueMap = isSubValueMap || metadata_1.reflectedType === Map;
                    }
                    else if (this_1.options.targetMaps) {
                        // try to find a type in target maps
                        this_1.options.targetMaps
                            .filter(function (map) { return map.target === targetType && !!map.properties[propertyName]; })
                            .forEach(function (map) { return (type = map.properties[propertyName]); });
                    }
                    else if (this_1.options.enableImplicitConversion &&
                        this_1.transformationType === TransformationType.PLAIN_TO_CLASS) {
                        // if we have no registererd type via the @Type() decorator then we check if we have any
                        // type declarations in reflect-metadata (type declaration is emited only if some decorator is added to the property.)
                        var reflectedType = Reflect.getMetadata('design:type', targetType.prototype, propertyName);
                        if (reflectedType) {
                            type = reflectedType;
                        }
                    }
                }
                // if value is an array try to get its custom array type
                var arrayType_1 = Array.isArray(value[valueKey])
                    ? this_1.getReflectedType(targetType, propertyName)
                    : undefined;
                // const subValueKey = TransformationType === TransformationType.PLAIN_TO_CLASS && newKeyName ? newKeyName : key;
                var subSource = source ? source[valueKey] : undefined;
                // if its deserialization then type if required
                // if we uncomment this types like string[] will not work
                // if (this.transformationType === TransformationType.PLAIN_TO_CLASS && !type && subValue instanceof Object && !(subValue instanceof Date))
                //     throw new Error(`Cannot determine type for ${(targetType as any).name }.${propertyName}, did you forget to specify a @Type?`);
                // if newValue is a source object that has method that match newKeyName then skip it
                if (newValue.constructor.prototype) {
                    var descriptor = Object.getOwnPropertyDescriptor(newValue.constructor.prototype, newValueKey);
                    if ((this_1.transformationType === TransformationType.PLAIN_TO_CLASS ||
                        this_1.transformationType === TransformationType.CLASS_TO_CLASS) &&
                        // eslint-disable-next-line @typescript-eslint/unbound-method
                        ((descriptor && !descriptor.set) || newValue[newValueKey] instanceof Function))
                        return "continue";
                }
                if (!this_1.options.enableCircularCheck || !this_1.isCircular(subValue)) {
                    var transformKey = this_1.transformationType === TransformationType.PLAIN_TO_CLASS ? newValueKey : key;
                    var finalValue = void 0;
                    if (this_1.transformationType === TransformationType.CLASS_TO_PLAIN) {
                        // Get original value
                        finalValue = value[transformKey];
                        // Apply custom transformation
                        finalValue = this_1.applyCustomTransformations(finalValue, targetType, transformKey, value, this_1.transformationType);
                        // If nothing change, it means no custom transformation was applied, so use the subValue.
                        finalValue = value[transformKey] === finalValue ? subValue : finalValue;
                        // Apply the default transformation
                        finalValue = this_1.transform(subSource, finalValue, type, arrayType_1, isSubValueMap, level + 1);
                    }
                    else {
                        if (subValue === undefined && this_1.options.exposeDefaultValues) {
                            // Set default value if nothing provided
                            finalValue = newValue[newValueKey];
                        }
                        else {
                            finalValue = this_1.transform(subSource, subValue, type, arrayType_1, isSubValueMap, level + 1);
                            finalValue = this_1.applyCustomTransformations(finalValue, targetType, transformKey, value, this_1.transformationType);
                        }
                    }
                    if (finalValue !== undefined || this_1.options.exposeUnsetFields) {
                        if (newValue instanceof Map) {
                            newValue.set(newValueKey, finalValue);
                        }
                        else {
                            newValue[newValueKey] = finalValue;
                        }
                    }
                }
                else if (this_1.transformationType === TransformationType.CLASS_TO_CLASS) {
                    var finalValue = subValue;
                    finalValue = this_1.applyCustomTransformations(finalValue, targetType, key, value, this_1.transformationType);
                    if (finalValue !== undefined || this_1.options.exposeUnsetFields) {
                        if (newValue instanceof Map) {
                            newValue.set(newValueKey, finalValue);
                        }
                        else {
                            newValue[newValueKey] = finalValue;
                        }
                    }
                }
            };
            var this_1 = this;
            // traverse over keys
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                _loop_1(key);
            }
            if (this.options.enableCircularCheck) {
                this.recursionStack.delete(value);
            }
            return newValue;
        }
        else {
            return value;
        }
    };
    TransformOperationExecutor.prototype.applyCustomTransformations = function (value, target, key, obj, transformationType) {
        var _this = this;
        var metadatas = defaultMetadataStorage.findTransformMetadatas(target, key, this.transformationType);
        // apply versioning options
        if (this.options.version !== undefined) {
            metadatas = metadatas.filter(function (metadata) {
                if (!metadata.options)
                    return true;
                return _this.checkVersion(metadata.options.since, metadata.options.until);
            });
        }
        // apply grouping options
        if (this.options.groups && this.options.groups.length) {
            metadatas = metadatas.filter(function (metadata) {
                if (!metadata.options)
                    return true;
                return _this.checkGroups(metadata.options.groups);
            });
        }
        else {
            metadatas = metadatas.filter(function (metadata) {
                return !metadata.options || !metadata.options.groups || !metadata.options.groups.length;
            });
        }
        metadatas.forEach(function (metadata) {
            value = metadata.transformFn({ value: value, key: key, obj: obj, type: transformationType, options: _this.options });
        });
        return value;
    };
    // preventing circular references
    TransformOperationExecutor.prototype.isCircular = function (object) {
        return this.recursionStack.has(object);
    };
    TransformOperationExecutor.prototype.getReflectedType = function (target, propertyName) {
        if (!target)
            return undefined;
        var meta = defaultMetadataStorage.findTypeMetadata(target, propertyName);
        return meta ? meta.reflectedType : undefined;
    };
    TransformOperationExecutor.prototype.getKeys = function (target, object, isMap) {
        var _this = this;
        // determine exclusion strategy
        var strategy = defaultMetadataStorage.getStrategy(target);
        if (strategy === 'none')
            strategy = this.options.strategy || 'exposeAll'; // exposeAll is default strategy
        // get all keys that need to expose
        var keys = [];
        if (strategy === 'exposeAll' || isMap) {
            if (object instanceof Map) {
                keys = Array.from(object.keys());
            }
            else {
                keys = Object.keys(object);
            }
        }
        if (isMap) {
            // expose & exclude do not apply for map keys only to fields
            return keys;
        }
        /**
         * If decorators are ignored but we don't want the extraneous values, then we use the
         * metadata to decide which property is needed, but doesn't apply the decorator effect.
         */
        if (this.options.ignoreDecorators && this.options.excludeExtraneousValues && target) {
            var exposedProperties = defaultMetadataStorage.getExposedProperties(target, this.transformationType);
            var excludedProperties = defaultMetadataStorage.getExcludedProperties(target, this.transformationType);
            keys = __spreadArray(__spreadArray([], exposedProperties, true), excludedProperties, true);
        }
        if (!this.options.ignoreDecorators && target) {
            // add all exposed to list of keys
            var exposedProperties = defaultMetadataStorage.getExposedProperties(target, this.transformationType);
            if (this.transformationType === TransformationType.PLAIN_TO_CLASS) {
                exposedProperties = exposedProperties.map(function (key) {
                    var exposeMetadata = defaultMetadataStorage.findExposeMetadata(target, key);
                    if (exposeMetadata && exposeMetadata.options && exposeMetadata.options.name) {
                        return exposeMetadata.options.name;
                    }
                    return key;
                });
            }
            if (this.options.excludeExtraneousValues) {
                keys = exposedProperties;
            }
            else {
                keys = keys.concat(exposedProperties);
            }
            // exclude excluded properties
            var excludedProperties_1 = defaultMetadataStorage.getExcludedProperties(target, this.transformationType);
            if (excludedProperties_1.length > 0) {
                keys = keys.filter(function (key) {
                    return !excludedProperties_1.includes(key);
                });
            }
            // apply versioning options
            if (this.options.version !== undefined) {
                keys = keys.filter(function (key) {
                    var exposeMetadata = defaultMetadataStorage.findExposeMetadata(target, key);
                    if (!exposeMetadata || !exposeMetadata.options)
                        return true;
                    return _this.checkVersion(exposeMetadata.options.since, exposeMetadata.options.until);
                });
            }
            // apply grouping options
            if (this.options.groups && this.options.groups.length) {
                keys = keys.filter(function (key) {
                    var exposeMetadata = defaultMetadataStorage.findExposeMetadata(target, key);
                    if (!exposeMetadata || !exposeMetadata.options)
                        return true;
                    return _this.checkGroups(exposeMetadata.options.groups);
                });
            }
            else {
                keys = keys.filter(function (key) {
                    var exposeMetadata = defaultMetadataStorage.findExposeMetadata(target, key);
                    return (!exposeMetadata ||
                        !exposeMetadata.options ||
                        !exposeMetadata.options.groups ||
                        !exposeMetadata.options.groups.length);
                });
            }
        }
        // exclude prefixed properties
        if (this.options.excludePrefixes && this.options.excludePrefixes.length) {
            keys = keys.filter(function (key) {
                return _this.options.excludePrefixes.every(function (prefix) {
                    return key.substr(0, prefix.length) !== prefix;
                });
            });
        }
        // make sure we have unique keys
        keys = keys.filter(function (key, index, self) {
            return self.indexOf(key) === index;
        });
        return keys;
    };
    TransformOperationExecutor.prototype.checkVersion = function (since, until) {
        var decision = true;
        if (decision && since)
            decision = this.options.version >= since;
        if (decision && until)
            decision = this.options.version < until;
        return decision;
    };
    TransformOperationExecutor.prototype.checkGroups = function (groups) {
        if (!groups)
            return true;
        return this.options.groups.some(function (optionGroup) { return groups.includes(optionGroup); });
    };
    return TransformOperationExecutor;
}());

/**
 * These are the default options used by any transformation operation.
 */
var defaultOptions = {
    enableCircularCheck: false,
    enableImplicitConversion: false,
    excludeExtraneousValues: false,
    excludePrefixes: undefined,
    exposeDefaultValues: false,
    exposeUnsetFields: true,
    groups: undefined,
    ignoreDecorators: false,
    strategy: undefined,
    targetMaps: undefined,
    version: undefined,
};

var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var ClassTransformer = /** @class */ (function () {
    function ClassTransformer() {
    }
    ClassTransformer.prototype.instanceToPlain = function (object, options) {
        var executor = new TransformOperationExecutor(TransformationType.CLASS_TO_PLAIN, __assign(__assign({}, defaultOptions), options));
        return executor.transform(undefined, object, undefined, undefined, undefined, undefined);
    };
    ClassTransformer.prototype.classToPlainFromExist = function (object, plainObject, options) {
        var executor = new TransformOperationExecutor(TransformationType.CLASS_TO_PLAIN, __assign(__assign({}, defaultOptions), options));
        return executor.transform(plainObject, object, undefined, undefined, undefined, undefined);
    };
    ClassTransformer.prototype.plainToInstance = function (cls, plain, options) {
        var executor = new TransformOperationExecutor(TransformationType.PLAIN_TO_CLASS, __assign(__assign({}, defaultOptions), options));
        return executor.transform(undefined, plain, cls, undefined, undefined, undefined);
    };
    ClassTransformer.prototype.plainToClassFromExist = function (clsObject, plain, options) {
        var executor = new TransformOperationExecutor(TransformationType.PLAIN_TO_CLASS, __assign(__assign({}, defaultOptions), options));
        return executor.transform(clsObject, plain, undefined, undefined, undefined, undefined);
    };
    ClassTransformer.prototype.instanceToInstance = function (object, options) {
        var executor = new TransformOperationExecutor(TransformationType.CLASS_TO_CLASS, __assign(__assign({}, defaultOptions), options));
        return executor.transform(undefined, object, undefined, undefined, undefined, undefined);
    };
    ClassTransformer.prototype.classToClassFromExist = function (object, fromObject, options) {
        var executor = new TransformOperationExecutor(TransformationType.CLASS_TO_CLASS, __assign(__assign({}, defaultOptions), options));
        return executor.transform(fromObject, object, undefined, undefined, undefined, undefined);
    };
    ClassTransformer.prototype.serialize = function (object, options) {
        return JSON.stringify(this.instanceToPlain(object, options));
    };
    /**
     * Deserializes given JSON string to a object of the given class.
     */
    ClassTransformer.prototype.deserialize = function (cls, json, options) {
        var jsonObject = JSON.parse(json);
        return this.plainToInstance(cls, jsonObject, options);
    };
    /**
     * Deserializes given JSON string to an array of objects of the given class.
     */
    ClassTransformer.prototype.deserializeArray = function (cls, json, options) {
        var jsonObject = JSON.parse(json);
        return this.plainToInstance(cls, jsonObject, options);
    };
    return ClassTransformer;
}());

/**
 * Marks the given class or property as excluded. By default the property is excluded in both
 * constructorToPlain and plainToConstructor transformations. It can be limited to only one direction
 * via using the `toPlainOnly` or `toClassOnly` option.
 *
 * Can be applied to class definitions and properties.
 */
function Exclude(options) {
    if (options === void 0) { options = {}; }
    /**
     * NOTE: The `propertyName` property must be marked as optional because
     * this decorator used both as a class and a property decorator and the
     * Typescript compiler will freak out if we make it mandatory as a class
     * decorator only receives one parameter.
     */
    return function (object, propertyName) {
        defaultMetadataStorage.addExcludeMetadata({
            target: object instanceof Function ? object : object.constructor,
            propertyName: propertyName,
            options: options,
        });
    };
}

/**
 * Marks the given class or property as included. By default the property is included in both
 * constructorToPlain and plainToConstructor transformations. It can be limited to only one direction
 * via using the `toPlainOnly` or `toClassOnly` option.
 *
 * Can be applied to class definitions and properties.
 */
function Expose(options) {
    if (options === void 0) { options = {}; }
    /**
     * NOTE: The `propertyName` property must be marked as optional because
     * this decorator used both as a class and a property decorator and the
     * Typescript compiler will freak out if we make it mandatory as a class
     * decorator only receives one parameter.
     */
    return function (object, propertyName) {
        defaultMetadataStorage.addExposeMetadata({
            target: object instanceof Function ? object : object.constructor,
            propertyName: propertyName,
            options: options,
        });
    };
}

/**
 * Return the class instance only with the exposed properties.
 *
 * Can be applied to functions and getters/setters only.
 */
function TransformInstanceToInstance(params) {
    return function (target, propertyKey, descriptor) {
        var classTransformer = new ClassTransformer();
        var originalMethod = descriptor.value;
        descriptor.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var result = originalMethod.apply(this, args);
            var isPromise = !!result && (typeof result === 'object' || typeof result === 'function') && typeof result.then === 'function';
            return isPromise
                ? result.then(function (data) { return classTransformer.instanceToInstance(data, params); })
                : classTransformer.instanceToInstance(result, params);
        };
    };
}

/**
 * Transform the object from class to plain object and return only with the exposed properties.
 *
 * Can be applied to functions and getters/setters only.
 */
function TransformInstanceToPlain(params) {
    return function (target, propertyKey, descriptor) {
        var classTransformer = new ClassTransformer();
        var originalMethod = descriptor.value;
        descriptor.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var result = originalMethod.apply(this, args);
            var isPromise = !!result && (typeof result === 'object' || typeof result === 'function') && typeof result.then === 'function';
            return isPromise
                ? result.then(function (data) { return classTransformer.instanceToPlain(data, params); })
                : classTransformer.instanceToPlain(result, params);
        };
    };
}

/**
 * Return the class instance only with the exposed properties.
 *
 * Can be applied to functions and getters/setters only.
 */
function TransformPlainToInstance(classType, params) {
    return function (target, propertyKey, descriptor) {
        var classTransformer = new ClassTransformer();
        var originalMethod = descriptor.value;
        descriptor.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var result = originalMethod.apply(this, args);
            var isPromise = !!result && (typeof result === 'object' || typeof result === 'function') && typeof result.then === 'function';
            return isPromise
                ? result.then(function (data) { return classTransformer.plainToInstance(classType, data, params); })
                : classTransformer.plainToInstance(classType, result, params);
        };
    };
}

/**
 * Defines a custom logic for value transformation.
 *
 * Can be applied to properties only.
 */
function Transform(transformFn, options) {
    if (options === void 0) { options = {}; }
    return function (target, propertyName) {
        defaultMetadataStorage.addTransformMetadata({
            target: target.constructor,
            propertyName: propertyName,
            transformFn: transformFn,
            options: options,
        });
    };
}

/**
 * Specifies a type of the property.
 * The given TypeFunction can return a constructor. A discriminator can be given in the options.
 *
 * Can be applied to properties only.
 */
function Type(typeFunction, options) {
    if (options === void 0) { options = {}; }
    return function (target, propertyName) {
        var reflectedType = Reflect.getMetadata('design:type', target, propertyName);
        defaultMetadataStorage.addTypeMetadata({
            target: target.constructor,
            propertyName: propertyName,
            reflectedType: reflectedType,
            typeFunction: typeFunction,
            options: options,
        });
    };
}

var classTransformer = new ClassTransformer();
function classToPlain(object, options) {
    return classTransformer.instanceToPlain(object, options);
}
function instanceToPlain(object, options) {
    return classTransformer.instanceToPlain(object, options);
}
function classToPlainFromExist(object, plainObject, options) {
    return classTransformer.classToPlainFromExist(object, plainObject, options);
}
function plainToClass(cls, plain, options) {
    return classTransformer.plainToInstance(cls, plain, options);
}
function plainToInstance(cls, plain, options) {
    return classTransformer.plainToInstance(cls, plain, options);
}
function plainToClassFromExist(clsObject, plain, options) {
    return classTransformer.plainToClassFromExist(clsObject, plain, options);
}
function instanceToInstance(object, options) {
    return classTransformer.instanceToInstance(object, options);
}
function classToClassFromExist(object, fromObject, options) {
    return classTransformer.classToClassFromExist(object, fromObject, options);
}
function serialize(object, options) {
    return classTransformer.serialize(object, options);
}
/**
 * Deserializes given JSON string to a object of the given class.
 *
 * @deprecated This function is being removed. Please use the following instead:
 * ```
 * instanceToClass(cls, JSON.parse(json), options)
 * ```
 */
function deserialize(cls, json, options) {
    return classTransformer.deserialize(cls, json, options);
}
/**
 * Deserializes given JSON string to an array of objects of the given class.
 *
 * @deprecated This function is being removed. Please use the following instead:
 * ```
 * JSON.parse(json).map(value => instanceToClass(cls, value, options))
 * ```
 *
 */
function deserializeArray(cls, json, options) {
    return classTransformer.deserializeArray(cls, json, options);
}

const esm5 = {
	__proto__: null,
	ClassTransformer: ClassTransformer,
	Exclude: Exclude,
	Expose: Expose,
	Transform: Transform,
	TransformInstanceToInstance: TransformInstanceToInstance,
	TransformInstanceToPlain: TransformInstanceToPlain,
	TransformPlainToInstance: TransformPlainToInstance,
	get TransformationType () { return TransformationType; },
	Type: Type,
	classToClassFromExist: classToClassFromExist,
	classToPlain: classToPlain,
	classToPlainFromExist: classToPlainFromExist,
	deserialize: deserialize,
	deserializeArray: deserializeArray,
	instanceToInstance: instanceToInstance,
	instanceToPlain: instanceToPlain,
	plainToClass: plainToClass,
	plainToClassFromExist: plainToClassFromExist,
	plainToInstance: plainToInstance,
	serialize: serialize
};

const require$$1 = /*@__PURE__*/getAugmentedNamespace(esm5);

var _Reflect = {};

/*! *****************************************************************************
Copyright (C) Microsoft. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

var hasRequired_Reflect;

function require_Reflect () {
	if (hasRequired_Reflect) return _Reflect;
	hasRequired_Reflect = 1;
	var Reflect;
	(function (Reflect) {
	    // Metadata Proposal
	    // https://rbuckton.github.io/reflect-metadata/
	    (function (factory) {
	        var root = typeof globalThis === "object" ? globalThis :
	            typeof commonjsGlobal === "object" ? commonjsGlobal :
	                typeof self === "object" ? self :
	                    typeof this === "object" ? this :
	                        sloppyModeThis();
	        var exporter = makeExporter(Reflect);
	        if (typeof root.Reflect !== "undefined") {
	            exporter = makeExporter(root.Reflect, exporter);
	        }
	        factory(exporter, root);
	        if (typeof root.Reflect === "undefined") {
	            root.Reflect = Reflect;
	        }
	        function makeExporter(target, previous) {
	            return function (key, value) {
	                Object.defineProperty(target, key, { configurable: true, writable: true, value: value });
	                if (previous)
	                    previous(key, value);
	            };
	        }
	        function functionThis() {
	            try {
	                return Function("return this;")();
	            }
	            catch (_) { }
	        }
	        function indirectEvalThis() {
	            try {
	                return (void 0, eval)("(function() { return this; })()");
	            }
	            catch (_) { }
	        }
	        function sloppyModeThis() {
	            return functionThis() || indirectEvalThis();
	        }
	    })(function (exporter, root) {
	        var hasOwn = Object.prototype.hasOwnProperty;
	        // feature test for Symbol support
	        var supportsSymbol = typeof Symbol === "function";
	        var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
	        var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
	        var supportsCreate = typeof Object.create === "function"; // feature test for Object.create support
	        var supportsProto = { __proto__: [] } instanceof Array; // feature test for __proto__ support
	        var downLevel = !supportsCreate && !supportsProto;
	        var HashMap = {
	            // create an object in dictionary mode (a.k.a. "slow" mode in v8)
	            create: supportsCreate
	                ? function () { return MakeDictionary(Object.create(null)); }
	                : supportsProto
	                    ? function () { return MakeDictionary({ __proto__: null }); }
	                    : function () { return MakeDictionary({}); },
	            has: downLevel
	                ? function (map, key) { return hasOwn.call(map, key); }
	                : function (map, key) { return key in map; },
	            get: downLevel
	                ? function (map, key) { return hasOwn.call(map, key) ? map[key] : undefined; }
	                : function (map, key) { return map[key]; },
	        };
	        // Load global or shim versions of Map, Set, and WeakMap
	        var functionPrototype = Object.getPrototypeOf(Function);
	        var _Map = typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
	        var _Set = typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
	        var _WeakMap = typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
	        var registrySymbol = supportsSymbol ? Symbol.for("@reflect-metadata:registry") : undefined;
	        var metadataRegistry = GetOrCreateMetadataRegistry();
	        var metadataProvider = CreateMetadataProvider(metadataRegistry);
	        /**
	         * Applies a set of decorators to a property of a target object.
	         * @param decorators An array of decorators.
	         * @param target The target object.
	         * @param propertyKey (Optional) The property key to decorate.
	         * @param attributes (Optional) The property descriptor for the target key.
	         * @remarks Decorators are applied in reverse order.
	         * @example
	         *
	         *     class Example {
	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
	         *         // static staticProperty;
	         *         // property;
	         *
	         *         constructor(p) { }
	         *         static staticMethod(p) { }
	         *         method(p) { }
	         *     }
	         *
	         *     // constructor
	         *     Example = Reflect.decorate(decoratorsArray, Example);
	         *
	         *     // property (on constructor)
	         *     Reflect.decorate(decoratorsArray, Example, "staticProperty");
	         *
	         *     // property (on prototype)
	         *     Reflect.decorate(decoratorsArray, Example.prototype, "property");
	         *
	         *     // method (on constructor)
	         *     Object.defineProperty(Example, "staticMethod",
	         *         Reflect.decorate(decoratorsArray, Example, "staticMethod",
	         *             Object.getOwnPropertyDescriptor(Example, "staticMethod")));
	         *
	         *     // method (on prototype)
	         *     Object.defineProperty(Example.prototype, "method",
	         *         Reflect.decorate(decoratorsArray, Example.prototype, "method",
	         *             Object.getOwnPropertyDescriptor(Example.prototype, "method")));
	         *
	         */
	        function decorate(decorators, target, propertyKey, attributes) {
	            if (!IsUndefined(propertyKey)) {
	                if (!IsArray(decorators))
	                    throw new TypeError();
	                if (!IsObject(target))
	                    throw new TypeError();
	                if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes))
	                    throw new TypeError();
	                if (IsNull(attributes))
	                    attributes = undefined;
	                propertyKey = ToPropertyKey(propertyKey);
	                return DecorateProperty(decorators, target, propertyKey, attributes);
	            }
	            else {
	                if (!IsArray(decorators))
	                    throw new TypeError();
	                if (!IsConstructor(target))
	                    throw new TypeError();
	                return DecorateConstructor(decorators, target);
	            }
	        }
	        exporter("decorate", decorate);
	        // 4.1.2 Reflect.metadata(metadataKey, metadataValue)
	        // https://rbuckton.github.io/reflect-metadata/#reflect.metadata
	        /**
	         * A default metadata decorator factory that can be used on a class, class member, or parameter.
	         * @param metadataKey The key for the metadata entry.
	         * @param metadataValue The value for the metadata entry.
	         * @returns A decorator function.
	         * @remarks
	         * If `metadataKey` is already defined for the target and target key, the
	         * metadataValue for that key will be overwritten.
	         * @example
	         *
	         *     // constructor
	         *     @Reflect.metadata(key, value)
	         *     class Example {
	         *     }
	         *
	         *     // property (on constructor, TypeScript only)
	         *     class Example {
	         *         @Reflect.metadata(key, value)
	         *         static staticProperty;
	         *     }
	         *
	         *     // property (on prototype, TypeScript only)
	         *     class Example {
	         *         @Reflect.metadata(key, value)
	         *         property;
	         *     }
	         *
	         *     // method (on constructor)
	         *     class Example {
	         *         @Reflect.metadata(key, value)
	         *         static staticMethod() { }
	         *     }
	         *
	         *     // method (on prototype)
	         *     class Example {
	         *         @Reflect.metadata(key, value)
	         *         method() { }
	         *     }
	         *
	         */
	        function metadata(metadataKey, metadataValue) {
	            function decorator(target, propertyKey) {
	                if (!IsObject(target))
	                    throw new TypeError();
	                if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey))
	                    throw new TypeError();
	                OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
	            }
	            return decorator;
	        }
	        exporter("metadata", metadata);
	        /**
	         * Define a unique metadata entry on the target.
	         * @param metadataKey A key used to store and retrieve metadata.
	         * @param metadataValue A value that contains attached metadata.
	         * @param target The target object on which to define metadata.
	         * @param propertyKey (Optional) The property key for the target.
	         * @example
	         *
	         *     class Example {
	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
	         *         // static staticProperty;
	         *         // property;
	         *
	         *         constructor(p) { }
	         *         static staticMethod(p) { }
	         *         method(p) { }
	         *     }
	         *
	         *     // constructor
	         *     Reflect.defineMetadata("custom:annotation", options, Example);
	         *
	         *     // property (on constructor)
	         *     Reflect.defineMetadata("custom:annotation", options, Example, "staticProperty");
	         *
	         *     // property (on prototype)
	         *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "property");
	         *
	         *     // method (on constructor)
	         *     Reflect.defineMetadata("custom:annotation", options, Example, "staticMethod");
	         *
	         *     // method (on prototype)
	         *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "method");
	         *
	         *     // decorator factory as metadata-producing annotation.
	         *     function MyAnnotation(options): Decorator {
	         *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
	         *     }
	         *
	         */
	        function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
	            if (!IsObject(target))
	                throw new TypeError();
	            if (!IsUndefined(propertyKey))
	                propertyKey = ToPropertyKey(propertyKey);
	            return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
	        }
	        exporter("defineMetadata", defineMetadata);
	        /**
	         * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
	         * @param metadataKey A key used to store and retrieve metadata.
	         * @param target The target object on which the metadata is defined.
	         * @param propertyKey (Optional) The property key for the target.
	         * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
	         * @example
	         *
	         *     class Example {
	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
	         *         // static staticProperty;
	         *         // property;
	         *
	         *         constructor(p) { }
	         *         static staticMethod(p) { }
	         *         method(p) { }
	         *     }
	         *
	         *     // constructor
	         *     result = Reflect.hasMetadata("custom:annotation", Example);
	         *
	         *     // property (on constructor)
	         *     result = Reflect.hasMetadata("custom:annotation", Example, "staticProperty");
	         *
	         *     // property (on prototype)
	         *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "property");
	         *
	         *     // method (on constructor)
	         *     result = Reflect.hasMetadata("custom:annotation", Example, "staticMethod");
	         *
	         *     // method (on prototype)
	         *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "method");
	         *
	         */
	        function hasMetadata(metadataKey, target, propertyKey) {
	            if (!IsObject(target))
	                throw new TypeError();
	            if (!IsUndefined(propertyKey))
	                propertyKey = ToPropertyKey(propertyKey);
	            return OrdinaryHasMetadata(metadataKey, target, propertyKey);
	        }
	        exporter("hasMetadata", hasMetadata);
	        /**
	         * Gets a value indicating whether the target object has the provided metadata key defined.
	         * @param metadataKey A key used to store and retrieve metadata.
	         * @param target The target object on which the metadata is defined.
	         * @param propertyKey (Optional) The property key for the target.
	         * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
	         * @example
	         *
	         *     class Example {
	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
	         *         // static staticProperty;
	         *         // property;
	         *
	         *         constructor(p) { }
	         *         static staticMethod(p) { }
	         *         method(p) { }
	         *     }
	         *
	         *     // constructor
	         *     result = Reflect.hasOwnMetadata("custom:annotation", Example);
	         *
	         *     // property (on constructor)
	         *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticProperty");
	         *
	         *     // property (on prototype)
	         *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "property");
	         *
	         *     // method (on constructor)
	         *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticMethod");
	         *
	         *     // method (on prototype)
	         *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "method");
	         *
	         */
	        function hasOwnMetadata(metadataKey, target, propertyKey) {
	            if (!IsObject(target))
	                throw new TypeError();
	            if (!IsUndefined(propertyKey))
	                propertyKey = ToPropertyKey(propertyKey);
	            return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
	        }
	        exporter("hasOwnMetadata", hasOwnMetadata);
	        /**
	         * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
	         * @param metadataKey A key used to store and retrieve metadata.
	         * @param target The target object on which the metadata is defined.
	         * @param propertyKey (Optional) The property key for the target.
	         * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
	         * @example
	         *
	         *     class Example {
	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
	         *         // static staticProperty;
	         *         // property;
	         *
	         *         constructor(p) { }
	         *         static staticMethod(p) { }
	         *         method(p) { }
	         *     }
	         *
	         *     // constructor
	         *     result = Reflect.getMetadata("custom:annotation", Example);
	         *
	         *     // property (on constructor)
	         *     result = Reflect.getMetadata("custom:annotation", Example, "staticProperty");
	         *
	         *     // property (on prototype)
	         *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "property");
	         *
	         *     // method (on constructor)
	         *     result = Reflect.getMetadata("custom:annotation", Example, "staticMethod");
	         *
	         *     // method (on prototype)
	         *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "method");
	         *
	         */
	        function getMetadata(metadataKey, target, propertyKey) {
	            if (!IsObject(target))
	                throw new TypeError();
	            if (!IsUndefined(propertyKey))
	                propertyKey = ToPropertyKey(propertyKey);
	            return OrdinaryGetMetadata(metadataKey, target, propertyKey);
	        }
	        exporter("getMetadata", getMetadata);
	        /**
	         * Gets the metadata value for the provided metadata key on the target object.
	         * @param metadataKey A key used to store and retrieve metadata.
	         * @param target The target object on which the metadata is defined.
	         * @param propertyKey (Optional) The property key for the target.
	         * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
	         * @example
	         *
	         *     class Example {
	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
	         *         // static staticProperty;
	         *         // property;
	         *
	         *         constructor(p) { }
	         *         static staticMethod(p) { }
	         *         method(p) { }
	         *     }
	         *
	         *     // constructor
	         *     result = Reflect.getOwnMetadata("custom:annotation", Example);
	         *
	         *     // property (on constructor)
	         *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticProperty");
	         *
	         *     // property (on prototype)
	         *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "property");
	         *
	         *     // method (on constructor)
	         *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticMethod");
	         *
	         *     // method (on prototype)
	         *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "method");
	         *
	         */
	        function getOwnMetadata(metadataKey, target, propertyKey) {
	            if (!IsObject(target))
	                throw new TypeError();
	            if (!IsUndefined(propertyKey))
	                propertyKey = ToPropertyKey(propertyKey);
	            return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
	        }
	        exporter("getOwnMetadata", getOwnMetadata);
	        /**
	         * Gets the metadata keys defined on the target object or its prototype chain.
	         * @param target The target object on which the metadata is defined.
	         * @param propertyKey (Optional) The property key for the target.
	         * @returns An array of unique metadata keys.
	         * @example
	         *
	         *     class Example {
	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
	         *         // static staticProperty;
	         *         // property;
	         *
	         *         constructor(p) { }
	         *         static staticMethod(p) { }
	         *         method(p) { }
	         *     }
	         *
	         *     // constructor
	         *     result = Reflect.getMetadataKeys(Example);
	         *
	         *     // property (on constructor)
	         *     result = Reflect.getMetadataKeys(Example, "staticProperty");
	         *
	         *     // property (on prototype)
	         *     result = Reflect.getMetadataKeys(Example.prototype, "property");
	         *
	         *     // method (on constructor)
	         *     result = Reflect.getMetadataKeys(Example, "staticMethod");
	         *
	         *     // method (on prototype)
	         *     result = Reflect.getMetadataKeys(Example.prototype, "method");
	         *
	         */
	        function getMetadataKeys(target, propertyKey) {
	            if (!IsObject(target))
	                throw new TypeError();
	            if (!IsUndefined(propertyKey))
	                propertyKey = ToPropertyKey(propertyKey);
	            return OrdinaryMetadataKeys(target, propertyKey);
	        }
	        exporter("getMetadataKeys", getMetadataKeys);
	        /**
	         * Gets the unique metadata keys defined on the target object.
	         * @param target The target object on which the metadata is defined.
	         * @param propertyKey (Optional) The property key for the target.
	         * @returns An array of unique metadata keys.
	         * @example
	         *
	         *     class Example {
	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
	         *         // static staticProperty;
	         *         // property;
	         *
	         *         constructor(p) { }
	         *         static staticMethod(p) { }
	         *         method(p) { }
	         *     }
	         *
	         *     // constructor
	         *     result = Reflect.getOwnMetadataKeys(Example);
	         *
	         *     // property (on constructor)
	         *     result = Reflect.getOwnMetadataKeys(Example, "staticProperty");
	         *
	         *     // property (on prototype)
	         *     result = Reflect.getOwnMetadataKeys(Example.prototype, "property");
	         *
	         *     // method (on constructor)
	         *     result = Reflect.getOwnMetadataKeys(Example, "staticMethod");
	         *
	         *     // method (on prototype)
	         *     result = Reflect.getOwnMetadataKeys(Example.prototype, "method");
	         *
	         */
	        function getOwnMetadataKeys(target, propertyKey) {
	            if (!IsObject(target))
	                throw new TypeError();
	            if (!IsUndefined(propertyKey))
	                propertyKey = ToPropertyKey(propertyKey);
	            return OrdinaryOwnMetadataKeys(target, propertyKey);
	        }
	        exporter("getOwnMetadataKeys", getOwnMetadataKeys);
	        /**
	         * Deletes the metadata entry from the target object with the provided key.
	         * @param metadataKey A key used to store and retrieve metadata.
	         * @param target The target object on which the metadata is defined.
	         * @param propertyKey (Optional) The property key for the target.
	         * @returns `true` if the metadata entry was found and deleted; otherwise, false.
	         * @example
	         *
	         *     class Example {
	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
	         *         // static staticProperty;
	         *         // property;
	         *
	         *         constructor(p) { }
	         *         static staticMethod(p) { }
	         *         method(p) { }
	         *     }
	         *
	         *     // constructor
	         *     result = Reflect.deleteMetadata("custom:annotation", Example);
	         *
	         *     // property (on constructor)
	         *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticProperty");
	         *
	         *     // property (on prototype)
	         *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "property");
	         *
	         *     // method (on constructor)
	         *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticMethod");
	         *
	         *     // method (on prototype)
	         *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "method");
	         *
	         */
	        function deleteMetadata(metadataKey, target, propertyKey) {
	            if (!IsObject(target))
	                throw new TypeError();
	            if (!IsUndefined(propertyKey))
	                propertyKey = ToPropertyKey(propertyKey);
	            if (!IsObject(target))
	                throw new TypeError();
	            if (!IsUndefined(propertyKey))
	                propertyKey = ToPropertyKey(propertyKey);
	            var provider = GetMetadataProvider(target, propertyKey, /*Create*/ false);
	            if (IsUndefined(provider))
	                return false;
	            return provider.OrdinaryDeleteMetadata(metadataKey, target, propertyKey);
	        }
	        exporter("deleteMetadata", deleteMetadata);
	        function DecorateConstructor(decorators, target) {
	            for (var i = decorators.length - 1; i >= 0; --i) {
	                var decorator = decorators[i];
	                var decorated = decorator(target);
	                if (!IsUndefined(decorated) && !IsNull(decorated)) {
	                    if (!IsConstructor(decorated))
	                        throw new TypeError();
	                    target = decorated;
	                }
	            }
	            return target;
	        }
	        function DecorateProperty(decorators, target, propertyKey, descriptor) {
	            for (var i = decorators.length - 1; i >= 0; --i) {
	                var decorator = decorators[i];
	                var decorated = decorator(target, propertyKey, descriptor);
	                if (!IsUndefined(decorated) && !IsNull(decorated)) {
	                    if (!IsObject(decorated))
	                        throw new TypeError();
	                    descriptor = decorated;
	                }
	            }
	            return descriptor;
	        }
	        // 3.1.1.1 OrdinaryHasMetadata(MetadataKey, O, P)
	        // https://rbuckton.github.io/reflect-metadata/#ordinaryhasmetadata
	        function OrdinaryHasMetadata(MetadataKey, O, P) {
	            var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
	            if (hasOwn)
	                return true;
	            var parent = OrdinaryGetPrototypeOf(O);
	            if (!IsNull(parent))
	                return OrdinaryHasMetadata(MetadataKey, parent, P);
	            return false;
	        }
	        // 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
	        // https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
	        function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
	            var provider = GetMetadataProvider(O, P, /*Create*/ false);
	            if (IsUndefined(provider))
	                return false;
	            return ToBoolean(provider.OrdinaryHasOwnMetadata(MetadataKey, O, P));
	        }
	        // 3.1.3.1 OrdinaryGetMetadata(MetadataKey, O, P)
	        // https://rbuckton.github.io/reflect-metadata/#ordinarygetmetadata
	        function OrdinaryGetMetadata(MetadataKey, O, P) {
	            var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
	            if (hasOwn)
	                return OrdinaryGetOwnMetadata(MetadataKey, O, P);
	            var parent = OrdinaryGetPrototypeOf(O);
	            if (!IsNull(parent))
	                return OrdinaryGetMetadata(MetadataKey, parent, P);
	            return undefined;
	        }
	        // 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
	        // https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
	        function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
	            var provider = GetMetadataProvider(O, P, /*Create*/ false);
	            if (IsUndefined(provider))
	                return;
	            return provider.OrdinaryGetOwnMetadata(MetadataKey, O, P);
	        }
	        // 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
	        // https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
	        function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
	            var provider = GetMetadataProvider(O, P, /*Create*/ true);
	            provider.OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P);
	        }
	        // 3.1.6.1 OrdinaryMetadataKeys(O, P)
	        // https://rbuckton.github.io/reflect-metadata/#ordinarymetadatakeys
	        function OrdinaryMetadataKeys(O, P) {
	            var ownKeys = OrdinaryOwnMetadataKeys(O, P);
	            var parent = OrdinaryGetPrototypeOf(O);
	            if (parent === null)
	                return ownKeys;
	            var parentKeys = OrdinaryMetadataKeys(parent, P);
	            if (parentKeys.length <= 0)
	                return ownKeys;
	            if (ownKeys.length <= 0)
	                return parentKeys;
	            var set = new _Set();
	            var keys = [];
	            for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
	                var key = ownKeys_1[_i];
	                var hasKey = set.has(key);
	                if (!hasKey) {
	                    set.add(key);
	                    keys.push(key);
	                }
	            }
	            for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
	                var key = parentKeys_1[_a];
	                var hasKey = set.has(key);
	                if (!hasKey) {
	                    set.add(key);
	                    keys.push(key);
	                }
	            }
	            return keys;
	        }
	        // 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
	        // https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
	        function OrdinaryOwnMetadataKeys(O, P) {
	            var provider = GetMetadataProvider(O, P, /*create*/ false);
	            if (!provider) {
	                return [];
	            }
	            return provider.OrdinaryOwnMetadataKeys(O, P);
	        }
	        // 6 ECMAScript Data Types and Values
	        // https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values
	        function Type(x) {
	            if (x === null)
	                return 1 /* Null */;
	            switch (typeof x) {
	                case "undefined": return 0 /* Undefined */;
	                case "boolean": return 2 /* Boolean */;
	                case "string": return 3 /* String */;
	                case "symbol": return 4 /* Symbol */;
	                case "number": return 5 /* Number */;
	                case "object": return x === null ? 1 /* Null */ : 6 /* Object */;
	                default: return 6 /* Object */;
	            }
	        }
	        // 6.1.1 The Undefined Type
	        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-undefined-type
	        function IsUndefined(x) {
	            return x === undefined;
	        }
	        // 6.1.2 The Null Type
	        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-null-type
	        function IsNull(x) {
	            return x === null;
	        }
	        // 6.1.5 The Symbol Type
	        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-symbol-type
	        function IsSymbol(x) {
	            return typeof x === "symbol";
	        }
	        // 6.1.7 The Object Type
	        // https://tc39.github.io/ecma262/#sec-object-type
	        function IsObject(x) {
	            return typeof x === "object" ? x !== null : typeof x === "function";
	        }
	        // 7.1 Type Conversion
	        // https://tc39.github.io/ecma262/#sec-type-conversion
	        // 7.1.1 ToPrimitive(input [, PreferredType])
	        // https://tc39.github.io/ecma262/#sec-toprimitive
	        function ToPrimitive(input, PreferredType) {
	            switch (Type(input)) {
	                case 0 /* Undefined */: return input;
	                case 1 /* Null */: return input;
	                case 2 /* Boolean */: return input;
	                case 3 /* String */: return input;
	                case 4 /* Symbol */: return input;
	                case 5 /* Number */: return input;
	            }
	            var hint = "string" ;
	            var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
	            if (exoticToPrim !== undefined) {
	                var result = exoticToPrim.call(input, hint);
	                if (IsObject(result))
	                    throw new TypeError();
	                return result;
	            }
	            return OrdinaryToPrimitive(input);
	        }
	        // 7.1.1.1 OrdinaryToPrimitive(O, hint)
	        // https://tc39.github.io/ecma262/#sec-ordinarytoprimitive
	        function OrdinaryToPrimitive(O, hint) {
	            var valueOf, result, toString_2; {
	                var toString_1 = O.toString;
	                if (IsCallable(toString_1)) {
	                    var result = toString_1.call(O);
	                    if (!IsObject(result))
	                        return result;
	                }
	                var valueOf = O.valueOf;
	                if (IsCallable(valueOf)) {
	                    var result = valueOf.call(O);
	                    if (!IsObject(result))
	                        return result;
	                }
	            }
	            throw new TypeError();
	        }
	        // 7.1.2 ToBoolean(argument)
	        // https://tc39.github.io/ecma262/2016/#sec-toboolean
	        function ToBoolean(argument) {
	            return !!argument;
	        }
	        // 7.1.12 ToString(argument)
	        // https://tc39.github.io/ecma262/#sec-tostring
	        function ToString(argument) {
	            return "" + argument;
	        }
	        // 7.1.14 ToPropertyKey(argument)
	        // https://tc39.github.io/ecma262/#sec-topropertykey
	        function ToPropertyKey(argument) {
	            var key = ToPrimitive(argument);
	            if (IsSymbol(key))
	                return key;
	            return ToString(key);
	        }
	        // 7.2 Testing and Comparison Operations
	        // https://tc39.github.io/ecma262/#sec-testing-and-comparison-operations
	        // 7.2.2 IsArray(argument)
	        // https://tc39.github.io/ecma262/#sec-isarray
	        function IsArray(argument) {
	            return Array.isArray
	                ? Array.isArray(argument)
	                : argument instanceof Object
	                    ? argument instanceof Array
	                    : Object.prototype.toString.call(argument) === "[object Array]";
	        }
	        // 7.2.3 IsCallable(argument)
	        // https://tc39.github.io/ecma262/#sec-iscallable
	        function IsCallable(argument) {
	            // NOTE: This is an approximation as we cannot check for [[Call]] internal method.
	            return typeof argument === "function";
	        }
	        // 7.2.4 IsConstructor(argument)
	        // https://tc39.github.io/ecma262/#sec-isconstructor
	        function IsConstructor(argument) {
	            // NOTE: This is an approximation as we cannot check for [[Construct]] internal method.
	            return typeof argument === "function";
	        }
	        // 7.2.7 IsPropertyKey(argument)
	        // https://tc39.github.io/ecma262/#sec-ispropertykey
	        function IsPropertyKey(argument) {
	            switch (Type(argument)) {
	                case 3 /* String */: return true;
	                case 4 /* Symbol */: return true;
	                default: return false;
	            }
	        }
	        function SameValueZero(x, y) {
	            return x === y || x !== x && y !== y;
	        }
	        // 7.3 Operations on Objects
	        // https://tc39.github.io/ecma262/#sec-operations-on-objects
	        // 7.3.9 GetMethod(V, P)
	        // https://tc39.github.io/ecma262/#sec-getmethod
	        function GetMethod(V, P) {
	            var func = V[P];
	            if (func === undefined || func === null)
	                return undefined;
	            if (!IsCallable(func))
	                throw new TypeError();
	            return func;
	        }
	        // 7.4 Operations on Iterator Objects
	        // https://tc39.github.io/ecma262/#sec-operations-on-iterator-objects
	        function GetIterator(obj) {
	            var method = GetMethod(obj, iteratorSymbol);
	            if (!IsCallable(method))
	                throw new TypeError(); // from Call
	            var iterator = method.call(obj);
	            if (!IsObject(iterator))
	                throw new TypeError();
	            return iterator;
	        }
	        // 7.4.4 IteratorValue(iterResult)
	        // https://tc39.github.io/ecma262/2016/#sec-iteratorvalue
	        function IteratorValue(iterResult) {
	            return iterResult.value;
	        }
	        // 7.4.5 IteratorStep(iterator)
	        // https://tc39.github.io/ecma262/#sec-iteratorstep
	        function IteratorStep(iterator) {
	            var result = iterator.next();
	            return result.done ? false : result;
	        }
	        // 7.4.6 IteratorClose(iterator, completion)
	        // https://tc39.github.io/ecma262/#sec-iteratorclose
	        function IteratorClose(iterator) {
	            var f = iterator["return"];
	            if (f)
	                f.call(iterator);
	        }
	        // 9.1 Ordinary Object Internal Methods and Internal Slots
	        // https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
	        // 9.1.1.1 OrdinaryGetPrototypeOf(O)
	        // https://tc39.github.io/ecma262/#sec-ordinarygetprototypeof
	        function OrdinaryGetPrototypeOf(O) {
	            var proto = Object.getPrototypeOf(O);
	            if (typeof O !== "function" || O === functionPrototype)
	                return proto;
	            // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
	            // Try to determine the superclass constructor. Compatible implementations
	            // must either set __proto__ on a subclass constructor to the superclass constructor,
	            // or ensure each class has a valid `constructor` property on its prototype that
	            // points back to the constructor.
	            // If this is not the same as Function.[[Prototype]], then this is definately inherited.
	            // This is the case when in ES6 or when using __proto__ in a compatible browser.
	            if (proto !== functionPrototype)
	                return proto;
	            // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
	            var prototype = O.prototype;
	            var prototypeProto = prototype && Object.getPrototypeOf(prototype);
	            if (prototypeProto == null || prototypeProto === Object.prototype)
	                return proto;
	            // If the constructor was not a function, then we cannot determine the heritage.
	            var constructor = prototypeProto.constructor;
	            if (typeof constructor !== "function")
	                return proto;
	            // If we have some kind of self-reference, then we cannot determine the heritage.
	            if (constructor === O)
	                return proto;
	            // we have a pretty good guess at the heritage.
	            return constructor;
	        }
	        // Global metadata registry
	        // - Allows `import "reflect-metadata"` and `import "reflect-metadata/no-conflict"` to interoperate.
	        // - Uses isolated metadata if `Reflect` is frozen before the registry can be installed.
	        /**
	         * Creates a registry used to allow multiple `reflect-metadata` providers.
	         */
	        function CreateMetadataRegistry() {
	            var fallback;
	            if (!IsUndefined(registrySymbol) &&
	                typeof root.Reflect !== "undefined" &&
	                !(registrySymbol in root.Reflect) &&
	                typeof root.Reflect.defineMetadata === "function") {
	                // interoperate with older version of `reflect-metadata` that did not support a registry.
	                fallback = CreateFallbackProvider(root.Reflect);
	            }
	            var first;
	            var second;
	            var rest;
	            var targetProviderMap = new _WeakMap();
	            var registry = {
	                registerProvider: registerProvider,
	                getProvider: getProvider,
	                setProvider: setProvider,
	            };
	            return registry;
	            function registerProvider(provider) {
	                if (!Object.isExtensible(registry)) {
	                    throw new Error("Cannot add provider to a frozen registry.");
	                }
	                switch (true) {
	                    case fallback === provider: break;
	                    case IsUndefined(first):
	                        first = provider;
	                        break;
	                    case first === provider: break;
	                    case IsUndefined(second):
	                        second = provider;
	                        break;
	                    case second === provider: break;
	                    default:
	                        if (rest === undefined)
	                            rest = new _Set();
	                        rest.add(provider);
	                        break;
	                }
	            }
	            function getProviderNoCache(O, P) {
	                if (!IsUndefined(first)) {
	                    if (first.isProviderFor(O, P))
	                        return first;
	                    if (!IsUndefined(second)) {
	                        if (second.isProviderFor(O, P))
	                            return first;
	                        if (!IsUndefined(rest)) {
	                            var iterator = GetIterator(rest);
	                            while (true) {
	                                var next = IteratorStep(iterator);
	                                if (!next) {
	                                    return undefined;
	                                }
	                                var provider = IteratorValue(next);
	                                if (provider.isProviderFor(O, P)) {
	                                    IteratorClose(iterator);
	                                    return provider;
	                                }
	                            }
	                        }
	                    }
	                }
	                if (!IsUndefined(fallback) && fallback.isProviderFor(O, P)) {
	                    return fallback;
	                }
	                return undefined;
	            }
	            function getProvider(O, P) {
	                var providerMap = targetProviderMap.get(O);
	                var provider;
	                if (!IsUndefined(providerMap)) {
	                    provider = providerMap.get(P);
	                }
	                if (!IsUndefined(provider)) {
	                    return provider;
	                }
	                provider = getProviderNoCache(O, P);
	                if (!IsUndefined(provider)) {
	                    if (IsUndefined(providerMap)) {
	                        providerMap = new _Map();
	                        targetProviderMap.set(O, providerMap);
	                    }
	                    providerMap.set(P, provider);
	                }
	                return provider;
	            }
	            function hasProvider(provider) {
	                if (IsUndefined(provider))
	                    throw new TypeError();
	                return first === provider || second === provider || !IsUndefined(rest) && rest.has(provider);
	            }
	            function setProvider(O, P, provider) {
	                if (!hasProvider(provider)) {
	                    throw new Error("Metadata provider not registered.");
	                }
	                var existingProvider = getProvider(O, P);
	                if (existingProvider !== provider) {
	                    if (!IsUndefined(existingProvider)) {
	                        return false;
	                    }
	                    var providerMap = targetProviderMap.get(O);
	                    if (IsUndefined(providerMap)) {
	                        providerMap = new _Map();
	                        targetProviderMap.set(O, providerMap);
	                    }
	                    providerMap.set(P, provider);
	                }
	                return true;
	            }
	        }
	        /**
	         * Gets or creates the shared registry of metadata providers.
	         */
	        function GetOrCreateMetadataRegistry() {
	            var metadataRegistry;
	            if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
	                metadataRegistry = root.Reflect[registrySymbol];
	            }
	            if (IsUndefined(metadataRegistry)) {
	                metadataRegistry = CreateMetadataRegistry();
	            }
	            if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
	                Object.defineProperty(root.Reflect, registrySymbol, {
	                    enumerable: false,
	                    configurable: false,
	                    writable: false,
	                    value: metadataRegistry
	                });
	            }
	            return metadataRegistry;
	        }
	        function CreateMetadataProvider(registry) {
	            // [[Metadata]] internal slot
	            // https://rbuckton.github.io/reflect-metadata/#ordinary-object-internal-methods-and-internal-slots
	            var metadata = new _WeakMap();
	            var provider = {
	                isProviderFor: function (O, P) {
	                    var targetMetadata = metadata.get(O);
	                    if (IsUndefined(targetMetadata))
	                        return false;
	                    return targetMetadata.has(P);
	                },
	                OrdinaryDefineOwnMetadata: OrdinaryDefineOwnMetadata,
	                OrdinaryHasOwnMetadata: OrdinaryHasOwnMetadata,
	                OrdinaryGetOwnMetadata: OrdinaryGetOwnMetadata,
	                OrdinaryOwnMetadataKeys: OrdinaryOwnMetadataKeys,
	                OrdinaryDeleteMetadata: OrdinaryDeleteMetadata,
	            };
	            metadataRegistry.registerProvider(provider);
	            return provider;
	            function GetOrCreateMetadataMap(O, P, Create) {
	                var targetMetadata = metadata.get(O);
	                var createdTargetMetadata = false;
	                if (IsUndefined(targetMetadata)) {
	                    if (!Create)
	                        return undefined;
	                    targetMetadata = new _Map();
	                    metadata.set(O, targetMetadata);
	                    createdTargetMetadata = true;
	                }
	                var metadataMap = targetMetadata.get(P);
	                if (IsUndefined(metadataMap)) {
	                    if (!Create)
	                        return undefined;
	                    metadataMap = new _Map();
	                    targetMetadata.set(P, metadataMap);
	                    if (!registry.setProvider(O, P, provider)) {
	                        targetMetadata.delete(P);
	                        if (createdTargetMetadata) {
	                            metadata.delete(O);
	                        }
	                        throw new Error("Wrong provider for target.");
	                    }
	                }
	                return metadataMap;
	            }
	            // 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
	            // https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
	            function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
	                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
	                if (IsUndefined(metadataMap))
	                    return false;
	                return ToBoolean(metadataMap.has(MetadataKey));
	            }
	            // 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
	            // https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
	            function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
	                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
	                if (IsUndefined(metadataMap))
	                    return undefined;
	                return metadataMap.get(MetadataKey);
	            }
	            // 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
	            // https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
	            function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
	                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ true);
	                metadataMap.set(MetadataKey, MetadataValue);
	            }
	            // 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
	            // https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
	            function OrdinaryOwnMetadataKeys(O, P) {
	                var keys = [];
	                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
	                if (IsUndefined(metadataMap))
	                    return keys;
	                var keysObj = metadataMap.keys();
	                var iterator = GetIterator(keysObj);
	                var k = 0;
	                while (true) {
	                    var next = IteratorStep(iterator);
	                    if (!next) {
	                        keys.length = k;
	                        return keys;
	                    }
	                    var nextValue = IteratorValue(next);
	                    try {
	                        keys[k] = nextValue;
	                    }
	                    catch (e) {
	                        try {
	                            IteratorClose(iterator);
	                        }
	                        finally {
	                            throw e;
	                        }
	                    }
	                    k++;
	                }
	            }
	            function OrdinaryDeleteMetadata(MetadataKey, O, P) {
	                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
	                if (IsUndefined(metadataMap))
	                    return false;
	                if (!metadataMap.delete(MetadataKey))
	                    return false;
	                if (metadataMap.size === 0) {
	                    var targetMetadata = metadata.get(O);
	                    if (!IsUndefined(targetMetadata)) {
	                        targetMetadata.delete(P);
	                        if (targetMetadata.size === 0) {
	                            metadata.delete(targetMetadata);
	                        }
	                    }
	                }
	                return true;
	            }
	        }
	        function CreateFallbackProvider(reflect) {
	            var defineMetadata = reflect.defineMetadata, hasOwnMetadata = reflect.hasOwnMetadata, getOwnMetadata = reflect.getOwnMetadata, getOwnMetadataKeys = reflect.getOwnMetadataKeys, deleteMetadata = reflect.deleteMetadata;
	            var metadataOwner = new _WeakMap();
	            var provider = {
	                isProviderFor: function (O, P) {
	                    var metadataPropertySet = metadataOwner.get(O);
	                    if (!IsUndefined(metadataPropertySet) && metadataPropertySet.has(P)) {
	                        return true;
	                    }
	                    if (getOwnMetadataKeys(O, P).length) {
	                        if (IsUndefined(metadataPropertySet)) {
	                            metadataPropertySet = new _Set();
	                            metadataOwner.set(O, metadataPropertySet);
	                        }
	                        metadataPropertySet.add(P);
	                        return true;
	                    }
	                    return false;
	                },
	                OrdinaryDefineOwnMetadata: defineMetadata,
	                OrdinaryHasOwnMetadata: hasOwnMetadata,
	                OrdinaryGetOwnMetadata: getOwnMetadata,
	                OrdinaryOwnMetadataKeys: getOwnMetadataKeys,
	                OrdinaryDeleteMetadata: deleteMetadata,
	            };
	            return provider;
	        }
	        /**
	         * Gets the metadata provider for an object. If the object has no metadata provider and this is for a create operation,
	         * then this module's metadata provider is assigned to the object.
	         */
	        function GetMetadataProvider(O, P, Create) {
	            var registeredProvider = metadataRegistry.getProvider(O, P);
	            if (!IsUndefined(registeredProvider)) {
	                return registeredProvider;
	            }
	            if (Create) {
	                if (metadataRegistry.setProvider(O, P, metadataProvider)) {
	                    return metadataProvider;
	                }
	                throw new Error("Illegal state.");
	            }
	            return undefined;
	        }
	        // naive Map shim
	        function CreateMapPolyfill() {
	            var cacheSentinel = {};
	            var arraySentinel = [];
	            var MapIterator = /** @class */ (function () {
	                function MapIterator(keys, values, selector) {
	                    this._index = 0;
	                    this._keys = keys;
	                    this._values = values;
	                    this._selector = selector;
	                }
	                MapIterator.prototype["@@iterator"] = function () { return this; };
	                MapIterator.prototype[iteratorSymbol] = function () { return this; };
	                MapIterator.prototype.next = function () {
	                    var index = this._index;
	                    if (index >= 0 && index < this._keys.length) {
	                        var result = this._selector(this._keys[index], this._values[index]);
	                        if (index + 1 >= this._keys.length) {
	                            this._index = -1;
	                            this._keys = arraySentinel;
	                            this._values = arraySentinel;
	                        }
	                        else {
	                            this._index++;
	                        }
	                        return { value: result, done: false };
	                    }
	                    return { value: undefined, done: true };
	                };
	                MapIterator.prototype.throw = function (error) {
	                    if (this._index >= 0) {
	                        this._index = -1;
	                        this._keys = arraySentinel;
	                        this._values = arraySentinel;
	                    }
	                    throw error;
	                };
	                MapIterator.prototype.return = function (value) {
	                    if (this._index >= 0) {
	                        this._index = -1;
	                        this._keys = arraySentinel;
	                        this._values = arraySentinel;
	                    }
	                    return { value: value, done: true };
	                };
	                return MapIterator;
	            }());
	            var Map = /** @class */ (function () {
	                function Map() {
	                    this._keys = [];
	                    this._values = [];
	                    this._cacheKey = cacheSentinel;
	                    this._cacheIndex = -2;
	                }
	                Object.defineProperty(Map.prototype, "size", {
	                    get: function () { return this._keys.length; },
	                    enumerable: true,
	                    configurable: true
	                });
	                Map.prototype.has = function (key) { return this._find(key, /*insert*/ false) >= 0; };
	                Map.prototype.get = function (key) {
	                    var index = this._find(key, /*insert*/ false);
	                    return index >= 0 ? this._values[index] : undefined;
	                };
	                Map.prototype.set = function (key, value) {
	                    var index = this._find(key, /*insert*/ true);
	                    this._values[index] = value;
	                    return this;
	                };
	                Map.prototype.delete = function (key) {
	                    var index = this._find(key, /*insert*/ false);
	                    if (index >= 0) {
	                        var size = this._keys.length;
	                        for (var i = index + 1; i < size; i++) {
	                            this._keys[i - 1] = this._keys[i];
	                            this._values[i - 1] = this._values[i];
	                        }
	                        this._keys.length--;
	                        this._values.length--;
	                        if (SameValueZero(key, this._cacheKey)) {
	                            this._cacheKey = cacheSentinel;
	                            this._cacheIndex = -2;
	                        }
	                        return true;
	                    }
	                    return false;
	                };
	                Map.prototype.clear = function () {
	                    this._keys.length = 0;
	                    this._values.length = 0;
	                    this._cacheKey = cacheSentinel;
	                    this._cacheIndex = -2;
	                };
	                Map.prototype.keys = function () { return new MapIterator(this._keys, this._values, getKey); };
	                Map.prototype.values = function () { return new MapIterator(this._keys, this._values, getValue); };
	                Map.prototype.entries = function () { return new MapIterator(this._keys, this._values, getEntry); };
	                Map.prototype["@@iterator"] = function () { return this.entries(); };
	                Map.prototype[iteratorSymbol] = function () { return this.entries(); };
	                Map.prototype._find = function (key, insert) {
	                    if (!SameValueZero(this._cacheKey, key)) {
	                        this._cacheIndex = -1;
	                        for (var i = 0; i < this._keys.length; i++) {
	                            if (SameValueZero(this._keys[i], key)) {
	                                this._cacheIndex = i;
	                                break;
	                            }
	                        }
	                    }
	                    if (this._cacheIndex < 0 && insert) {
	                        this._cacheIndex = this._keys.length;
	                        this._keys.push(key);
	                        this._values.push(undefined);
	                    }
	                    return this._cacheIndex;
	                };
	                return Map;
	            }());
	            return Map;
	            function getKey(key, _) {
	                return key;
	            }
	            function getValue(_, value) {
	                return value;
	            }
	            function getEntry(key, value) {
	                return [key, value];
	            }
	        }
	        // naive Set shim
	        function CreateSetPolyfill() {
	            var Set = /** @class */ (function () {
	                function Set() {
	                    this._map = new _Map();
	                }
	                Object.defineProperty(Set.prototype, "size", {
	                    get: function () { return this._map.size; },
	                    enumerable: true,
	                    configurable: true
	                });
	                Set.prototype.has = function (value) { return this._map.has(value); };
	                Set.prototype.add = function (value) { return this._map.set(value, value), this; };
	                Set.prototype.delete = function (value) { return this._map.delete(value); };
	                Set.prototype.clear = function () { this._map.clear(); };
	                Set.prototype.keys = function () { return this._map.keys(); };
	                Set.prototype.values = function () { return this._map.keys(); };
	                Set.prototype.entries = function () { return this._map.entries(); };
	                Set.prototype["@@iterator"] = function () { return this.keys(); };
	                Set.prototype[iteratorSymbol] = function () { return this.keys(); };
	                return Set;
	            }());
	            return Set;
	        }
	        // naive WeakMap shim
	        function CreateWeakMapPolyfill() {
	            var UUID_SIZE = 16;
	            var keys = HashMap.create();
	            var rootKey = CreateUniqueKey();
	            return /** @class */ (function () {
	                function WeakMap() {
	                    this._key = CreateUniqueKey();
	                }
	                WeakMap.prototype.has = function (target) {
	                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
	                    return table !== undefined ? HashMap.has(table, this._key) : false;
	                };
	                WeakMap.prototype.get = function (target) {
	                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
	                    return table !== undefined ? HashMap.get(table, this._key) : undefined;
	                };
	                WeakMap.prototype.set = function (target, value) {
	                    var table = GetOrCreateWeakMapTable(target, /*create*/ true);
	                    table[this._key] = value;
	                    return this;
	                };
	                WeakMap.prototype.delete = function (target) {
	                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
	                    return table !== undefined ? delete table[this._key] : false;
	                };
	                WeakMap.prototype.clear = function () {
	                    // NOTE: not a real clear, just makes the previous data unreachable
	                    this._key = CreateUniqueKey();
	                };
	                return WeakMap;
	            }());
	            function CreateUniqueKey() {
	                var key;
	                do
	                    key = "@@WeakMap@@" + CreateUUID();
	                while (HashMap.has(keys, key));
	                keys[key] = true;
	                return key;
	            }
	            function GetOrCreateWeakMapTable(target, create) {
	                if (!hasOwn.call(target, rootKey)) {
	                    if (!create)
	                        return undefined;
	                    Object.defineProperty(target, rootKey, { value: HashMap.create() });
	                }
	                return target[rootKey];
	            }
	            function FillRandomBytes(buffer, size) {
	                for (var i = 0; i < size; ++i)
	                    buffer[i] = Math.random() * 0xff | 0;
	                return buffer;
	            }
	            function GenRandomBytes(size) {
	                if (typeof Uint8Array === "function") {
	                    var array = new Uint8Array(size);
	                    if (typeof crypto !== "undefined") {
	                        crypto.getRandomValues(array);
	                    }
	                    else if (typeof msCrypto !== "undefined") {
	                        msCrypto.getRandomValues(array);
	                    }
	                    else {
	                        FillRandomBytes(array, size);
	                    }
	                    return array;
	                }
	                return FillRandomBytes(new Array(size), size);
	            }
	            function CreateUUID() {
	                var data = GenRandomBytes(UUID_SIZE);
	                // mark as random - RFC 4122 § 4.4
	                data[6] = data[6] & 0x4f | 0x40;
	                data[8] = data[8] & 0xbf | 0x80;
	                var result = "";
	                for (var offset = 0; offset < UUID_SIZE; ++offset) {
	                    var byte = data[offset];
	                    if (offset === 4 || offset === 6 || offset === 8)
	                        result += "-";
	                    if (byte < 16)
	                        result += "0";
	                    result += byte.toString(16).toLowerCase();
	                }
	                return result;
	            }
	        }
	        // uses a heuristic used by v8 and chakra to force an object into dictionary mode.
	        function MakeDictionary(obj) {
	            obj.__ = undefined;
	            delete obj.__;
	            return obj;
	        }
	    });
	})(Reflect || (Reflect = {}));
	return _Reflect;
}

var hasRequiredMessages;

function requireMessages () {
	if (hasRequiredMessages) return messages;
	hasRequiredMessages = 1;
	var __decorate = (messages && messages.__decorate) || function (decorators, target, key, desc) {
	    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	    return c > 3 && r && Object.defineProperty(target, key, r), r;
	};
	Object.defineProperty(messages, "__esModule", { value: true });
	messages.TestCaseStarted = messages.TestCaseFinished = messages.TestStep = messages.StepMatchArgumentsList = messages.StepMatchArgument = messages.Group = messages.TestCase = messages.Snippet = messages.Suggestion = messages.StepDefinitionPattern = messages.StepDefinition = messages.JavaStackTraceElement = messages.JavaMethod = messages.SourceReference = messages.Source = messages.PickleTag = messages.PickleTableRow = messages.PickleTableCell = messages.PickleTable = messages.PickleStepArgument = messages.PickleStep = messages.PickleDocString = messages.Pickle = messages.ParseError = messages.ParameterType = messages.Product = messages.Git = messages.Ci = messages.Meta = messages.Location = messages.Hook = messages.Tag = messages.TableRow = messages.TableCell = messages.Step = messages.Scenario = messages.RuleChild = messages.Rule = messages.FeatureChild = messages.Feature = messages.Examples = messages.DocString = messages.DataTable = messages.Comment = messages.Background = messages.GherkinDocument = messages.Exception = messages.Envelope = messages.Duration = messages.Attachment = void 0;
	messages.TestStepResultStatus = messages.StepKeywordType = messages.StepDefinitionPatternType = messages.SourceMediaType = messages.PickleStepType = messages.HookType = messages.AttachmentContentEncoding = messages.UndefinedParameterType = messages.Timestamp = messages.TestStepStarted = messages.TestStepResult = messages.TestStepFinished = messages.TestRunStarted = messages.TestRunHookStarted = messages.TestRunHookFinished = messages.TestRunFinished = void 0;
	var class_transformer_1 = require$$1;
	require_Reflect();
	var Attachment = /** @class */ (function () {
	    function Attachment() {
	        this.body = '';
	        this.contentEncoding = AttachmentContentEncoding.IDENTITY;
	        this.mediaType = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Source; })
	    ], Attachment.prototype, "source", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Timestamp; })
	    ], Attachment.prototype, "timestamp", void 0);
	    return Attachment;
	}());
	messages.Attachment = Attachment;
	var Duration = /** @class */ (function () {
	    function Duration() {
	        this.seconds = 0;
	        this.nanos = 0;
	    }
	    return Duration;
	}());
	messages.Duration = Duration;
	var Envelope = /** @class */ (function () {
	    function Envelope() {
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Attachment; })
	    ], Envelope.prototype, "attachment", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return GherkinDocument; })
	    ], Envelope.prototype, "gherkinDocument", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Hook; })
	    ], Envelope.prototype, "hook", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Meta; })
	    ], Envelope.prototype, "meta", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return ParameterType; })
	    ], Envelope.prototype, "parameterType", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return ParseError; })
	    ], Envelope.prototype, "parseError", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Pickle; })
	    ], Envelope.prototype, "pickle", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Suggestion; })
	    ], Envelope.prototype, "suggestion", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Source; })
	    ], Envelope.prototype, "source", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return StepDefinition; })
	    ], Envelope.prototype, "stepDefinition", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TestCase; })
	    ], Envelope.prototype, "testCase", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TestCaseFinished; })
	    ], Envelope.prototype, "testCaseFinished", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TestCaseStarted; })
	    ], Envelope.prototype, "testCaseStarted", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TestRunFinished; })
	    ], Envelope.prototype, "testRunFinished", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TestRunStarted; })
	    ], Envelope.prototype, "testRunStarted", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TestStepFinished; })
	    ], Envelope.prototype, "testStepFinished", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TestStepStarted; })
	    ], Envelope.prototype, "testStepStarted", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TestRunHookStarted; })
	    ], Envelope.prototype, "testRunHookStarted", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TestRunHookFinished; })
	    ], Envelope.prototype, "testRunHookFinished", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return UndefinedParameterType; })
	    ], Envelope.prototype, "undefinedParameterType", void 0);
	    return Envelope;
	}());
	messages.Envelope = Envelope;
	var Exception = /** @class */ (function () {
	    function Exception() {
	        this.type = '';
	    }
	    return Exception;
	}());
	messages.Exception = Exception;
	var GherkinDocument = /** @class */ (function () {
	    function GherkinDocument() {
	        this.comments = [];
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Feature; })
	    ], GherkinDocument.prototype, "feature", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Comment; })
	    ], GherkinDocument.prototype, "comments", void 0);
	    return GherkinDocument;
	}());
	messages.GherkinDocument = GherkinDocument;
	var Background = /** @class */ (function () {
	    function Background() {
	        this.location = new Location();
	        this.keyword = '';
	        this.name = '';
	        this.description = '';
	        this.steps = [];
	        this.id = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], Background.prototype, "location", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Step; })
	    ], Background.prototype, "steps", void 0);
	    return Background;
	}());
	messages.Background = Background;
	var Comment = /** @class */ (function () {
	    function Comment() {
	        this.location = new Location();
	        this.text = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], Comment.prototype, "location", void 0);
	    return Comment;
	}());
	messages.Comment = Comment;
	var DataTable = /** @class */ (function () {
	    function DataTable() {
	        this.location = new Location();
	        this.rows = [];
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], DataTable.prototype, "location", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TableRow; })
	    ], DataTable.prototype, "rows", void 0);
	    return DataTable;
	}());
	messages.DataTable = DataTable;
	var DocString = /** @class */ (function () {
	    function DocString() {
	        this.location = new Location();
	        this.content = '';
	        this.delimiter = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], DocString.prototype, "location", void 0);
	    return DocString;
	}());
	messages.DocString = DocString;
	var Examples = /** @class */ (function () {
	    function Examples() {
	        this.location = new Location();
	        this.tags = [];
	        this.keyword = '';
	        this.name = '';
	        this.description = '';
	        this.tableBody = [];
	        this.id = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], Examples.prototype, "location", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Tag; })
	    ], Examples.prototype, "tags", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TableRow; })
	    ], Examples.prototype, "tableHeader", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TableRow; })
	    ], Examples.prototype, "tableBody", void 0);
	    return Examples;
	}());
	messages.Examples = Examples;
	var Feature = /** @class */ (function () {
	    function Feature() {
	        this.location = new Location();
	        this.tags = [];
	        this.language = '';
	        this.keyword = '';
	        this.name = '';
	        this.description = '';
	        this.children = [];
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], Feature.prototype, "location", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Tag; })
	    ], Feature.prototype, "tags", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return FeatureChild; })
	    ], Feature.prototype, "children", void 0);
	    return Feature;
	}());
	messages.Feature = Feature;
	var FeatureChild = /** @class */ (function () {
	    function FeatureChild() {
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Rule; })
	    ], FeatureChild.prototype, "rule", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Background; })
	    ], FeatureChild.prototype, "background", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Scenario; })
	    ], FeatureChild.prototype, "scenario", void 0);
	    return FeatureChild;
	}());
	messages.FeatureChild = FeatureChild;
	var Rule = /** @class */ (function () {
	    function Rule() {
	        this.location = new Location();
	        this.tags = [];
	        this.keyword = '';
	        this.name = '';
	        this.description = '';
	        this.children = [];
	        this.id = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], Rule.prototype, "location", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Tag; })
	    ], Rule.prototype, "tags", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return RuleChild; })
	    ], Rule.prototype, "children", void 0);
	    return Rule;
	}());
	messages.Rule = Rule;
	var RuleChild = /** @class */ (function () {
	    function RuleChild() {
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Background; })
	    ], RuleChild.prototype, "background", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Scenario; })
	    ], RuleChild.prototype, "scenario", void 0);
	    return RuleChild;
	}());
	messages.RuleChild = RuleChild;
	var Scenario = /** @class */ (function () {
	    function Scenario() {
	        this.location = new Location();
	        this.tags = [];
	        this.keyword = '';
	        this.name = '';
	        this.description = '';
	        this.steps = [];
	        this.examples = [];
	        this.id = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], Scenario.prototype, "location", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Tag; })
	    ], Scenario.prototype, "tags", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Step; })
	    ], Scenario.prototype, "steps", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Examples; })
	    ], Scenario.prototype, "examples", void 0);
	    return Scenario;
	}());
	messages.Scenario = Scenario;
	var Step = /** @class */ (function () {
	    function Step() {
	        this.location = new Location();
	        this.keyword = '';
	        this.text = '';
	        this.id = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], Step.prototype, "location", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return DocString; })
	    ], Step.prototype, "docString", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return DataTable; })
	    ], Step.prototype, "dataTable", void 0);
	    return Step;
	}());
	messages.Step = Step;
	var TableCell = /** @class */ (function () {
	    function TableCell() {
	        this.location = new Location();
	        this.value = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], TableCell.prototype, "location", void 0);
	    return TableCell;
	}());
	messages.TableCell = TableCell;
	var TableRow = /** @class */ (function () {
	    function TableRow() {
	        this.location = new Location();
	        this.cells = [];
	        this.id = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], TableRow.prototype, "location", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TableCell; })
	    ], TableRow.prototype, "cells", void 0);
	    return TableRow;
	}());
	messages.TableRow = TableRow;
	var Tag = /** @class */ (function () {
	    function Tag() {
	        this.location = new Location();
	        this.name = '';
	        this.id = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], Tag.prototype, "location", void 0);
	    return Tag;
	}());
	messages.Tag = Tag;
	var Hook = /** @class */ (function () {
	    function Hook() {
	        this.id = '';
	        this.sourceReference = new SourceReference();
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return SourceReference; })
	    ], Hook.prototype, "sourceReference", void 0);
	    return Hook;
	}());
	messages.Hook = Hook;
	var Location = /** @class */ (function () {
	    function Location() {
	        this.line = 0;
	    }
	    return Location;
	}());
	messages.Location = Location;
	var Meta = /** @class */ (function () {
	    function Meta() {
	        this.protocolVersion = '';
	        this.implementation = new Product();
	        this.runtime = new Product();
	        this.os = new Product();
	        this.cpu = new Product();
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Product; })
	    ], Meta.prototype, "implementation", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Product; })
	    ], Meta.prototype, "runtime", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Product; })
	    ], Meta.prototype, "os", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Product; })
	    ], Meta.prototype, "cpu", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Ci; })
	    ], Meta.prototype, "ci", void 0);
	    return Meta;
	}());
	messages.Meta = Meta;
	var Ci = /** @class */ (function () {
	    function Ci() {
	        this.name = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Git; })
	    ], Ci.prototype, "git", void 0);
	    return Ci;
	}());
	messages.Ci = Ci;
	var Git = /** @class */ (function () {
	    function Git() {
	        this.remote = '';
	        this.revision = '';
	    }
	    return Git;
	}());
	messages.Git = Git;
	var Product = /** @class */ (function () {
	    function Product() {
	        this.name = '';
	    }
	    return Product;
	}());
	messages.Product = Product;
	var ParameterType = /** @class */ (function () {
	    function ParameterType() {
	        this.name = '';
	        this.regularExpressions = [];
	        this.preferForRegularExpressionMatch = false;
	        this.useForSnippets = false;
	        this.id = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return SourceReference; })
	    ], ParameterType.prototype, "sourceReference", void 0);
	    return ParameterType;
	}());
	messages.ParameterType = ParameterType;
	var ParseError = /** @class */ (function () {
	    function ParseError() {
	        this.source = new SourceReference();
	        this.message = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return SourceReference; })
	    ], ParseError.prototype, "source", void 0);
	    return ParseError;
	}());
	messages.ParseError = ParseError;
	var Pickle = /** @class */ (function () {
	    function Pickle() {
	        this.id = '';
	        this.uri = '';
	        this.name = '';
	        this.language = '';
	        this.steps = [];
	        this.tags = [];
	        this.astNodeIds = [];
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return PickleStep; })
	    ], Pickle.prototype, "steps", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return PickleTag; })
	    ], Pickle.prototype, "tags", void 0);
	    return Pickle;
	}());
	messages.Pickle = Pickle;
	var PickleDocString = /** @class */ (function () {
	    function PickleDocString() {
	        this.content = '';
	    }
	    return PickleDocString;
	}());
	messages.PickleDocString = PickleDocString;
	var PickleStep = /** @class */ (function () {
	    function PickleStep() {
	        this.astNodeIds = [];
	        this.id = '';
	        this.text = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return PickleStepArgument; })
	    ], PickleStep.prototype, "argument", void 0);
	    return PickleStep;
	}());
	messages.PickleStep = PickleStep;
	var PickleStepArgument = /** @class */ (function () {
	    function PickleStepArgument() {
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return PickleDocString; })
	    ], PickleStepArgument.prototype, "docString", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return PickleTable; })
	    ], PickleStepArgument.prototype, "dataTable", void 0);
	    return PickleStepArgument;
	}());
	messages.PickleStepArgument = PickleStepArgument;
	var PickleTable = /** @class */ (function () {
	    function PickleTable() {
	        this.rows = [];
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return PickleTableRow; })
	    ], PickleTable.prototype, "rows", void 0);
	    return PickleTable;
	}());
	messages.PickleTable = PickleTable;
	var PickleTableCell = /** @class */ (function () {
	    function PickleTableCell() {
	        this.value = '';
	    }
	    return PickleTableCell;
	}());
	messages.PickleTableCell = PickleTableCell;
	var PickleTableRow = /** @class */ (function () {
	    function PickleTableRow() {
	        this.cells = [];
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return PickleTableCell; })
	    ], PickleTableRow.prototype, "cells", void 0);
	    return PickleTableRow;
	}());
	messages.PickleTableRow = PickleTableRow;
	var PickleTag = /** @class */ (function () {
	    function PickleTag() {
	        this.name = '';
	        this.astNodeId = '';
	    }
	    return PickleTag;
	}());
	messages.PickleTag = PickleTag;
	var Source = /** @class */ (function () {
	    function Source() {
	        this.uri = '';
	        this.data = '';
	        this.mediaType = SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN;
	    }
	    return Source;
	}());
	messages.Source = Source;
	var SourceReference = /** @class */ (function () {
	    function SourceReference() {
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return JavaMethod; })
	    ], SourceReference.prototype, "javaMethod", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return JavaStackTraceElement; })
	    ], SourceReference.prototype, "javaStackTraceElement", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Location; })
	    ], SourceReference.prototype, "location", void 0);
	    return SourceReference;
	}());
	messages.SourceReference = SourceReference;
	var JavaMethod = /** @class */ (function () {
	    function JavaMethod() {
	        this.className = '';
	        this.methodName = '';
	        this.methodParameterTypes = [];
	    }
	    return JavaMethod;
	}());
	messages.JavaMethod = JavaMethod;
	var JavaStackTraceElement = /** @class */ (function () {
	    function JavaStackTraceElement() {
	        this.className = '';
	        this.fileName = '';
	        this.methodName = '';
	    }
	    return JavaStackTraceElement;
	}());
	messages.JavaStackTraceElement = JavaStackTraceElement;
	var StepDefinition = /** @class */ (function () {
	    function StepDefinition() {
	        this.id = '';
	        this.pattern = new StepDefinitionPattern();
	        this.sourceReference = new SourceReference();
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return StepDefinitionPattern; })
	    ], StepDefinition.prototype, "pattern", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return SourceReference; })
	    ], StepDefinition.prototype, "sourceReference", void 0);
	    return StepDefinition;
	}());
	messages.StepDefinition = StepDefinition;
	var StepDefinitionPattern = /** @class */ (function () {
	    function StepDefinitionPattern() {
	        this.source = '';
	        this.type = StepDefinitionPatternType.CUCUMBER_EXPRESSION;
	    }
	    return StepDefinitionPattern;
	}());
	messages.StepDefinitionPattern = StepDefinitionPattern;
	var Suggestion = /** @class */ (function () {
	    function Suggestion() {
	        this.id = '';
	        this.pickleStepId = '';
	        this.snippets = [];
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Snippet; })
	    ], Suggestion.prototype, "snippets", void 0);
	    return Suggestion;
	}());
	messages.Suggestion = Suggestion;
	var Snippet = /** @class */ (function () {
	    function Snippet() {
	        this.language = '';
	        this.code = '';
	    }
	    return Snippet;
	}());
	messages.Snippet = Snippet;
	var TestCase = /** @class */ (function () {
	    function TestCase() {
	        this.id = '';
	        this.pickleId = '';
	        this.testSteps = [];
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TestStep; })
	    ], TestCase.prototype, "testSteps", void 0);
	    return TestCase;
	}());
	messages.TestCase = TestCase;
	var Group = /** @class */ (function () {
	    function Group() {
	        this.children = [];
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Group; })
	    ], Group.prototype, "children", void 0);
	    return Group;
	}());
	messages.Group = Group;
	var StepMatchArgument = /** @class */ (function () {
	    function StepMatchArgument() {
	        this.group = new Group();
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Group; })
	    ], StepMatchArgument.prototype, "group", void 0);
	    return StepMatchArgument;
	}());
	messages.StepMatchArgument = StepMatchArgument;
	var StepMatchArgumentsList = /** @class */ (function () {
	    function StepMatchArgumentsList() {
	        this.stepMatchArguments = [];
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return StepMatchArgument; })
	    ], StepMatchArgumentsList.prototype, "stepMatchArguments", void 0);
	    return StepMatchArgumentsList;
	}());
	messages.StepMatchArgumentsList = StepMatchArgumentsList;
	var TestStep = /** @class */ (function () {
	    function TestStep() {
	        this.id = '';
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return StepMatchArgumentsList; })
	    ], TestStep.prototype, "stepMatchArgumentsLists", void 0);
	    return TestStep;
	}());
	messages.TestStep = TestStep;
	var TestCaseFinished = /** @class */ (function () {
	    function TestCaseFinished() {
	        this.testCaseStartedId = '';
	        this.timestamp = new Timestamp();
	        this.willBeRetried = false;
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Timestamp; })
	    ], TestCaseFinished.prototype, "timestamp", void 0);
	    return TestCaseFinished;
	}());
	messages.TestCaseFinished = TestCaseFinished;
	var TestCaseStarted = /** @class */ (function () {
	    function TestCaseStarted() {
	        this.attempt = 0;
	        this.id = '';
	        this.testCaseId = '';
	        this.timestamp = new Timestamp();
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Timestamp; })
	    ], TestCaseStarted.prototype, "timestamp", void 0);
	    return TestCaseStarted;
	}());
	messages.TestCaseStarted = TestCaseStarted;
	var TestRunFinished = /** @class */ (function () {
	    function TestRunFinished() {
	        this.success = false;
	        this.timestamp = new Timestamp();
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Timestamp; })
	    ], TestRunFinished.prototype, "timestamp", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Exception; })
	    ], TestRunFinished.prototype, "exception", void 0);
	    return TestRunFinished;
	}());
	messages.TestRunFinished = TestRunFinished;
	var TestRunHookFinished = /** @class */ (function () {
	    function TestRunHookFinished() {
	        this.testRunHookStartedId = '';
	        this.result = new TestStepResult();
	        this.timestamp = new Timestamp();
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TestStepResult; })
	    ], TestRunHookFinished.prototype, "result", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Timestamp; })
	    ], TestRunHookFinished.prototype, "timestamp", void 0);
	    return TestRunHookFinished;
	}());
	messages.TestRunHookFinished = TestRunHookFinished;
	var TestRunHookStarted = /** @class */ (function () {
	    function TestRunHookStarted() {
	        this.id = '';
	        this.testRunStartedId = '';
	        this.hookId = '';
	        this.timestamp = new Timestamp();
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Timestamp; })
	    ], TestRunHookStarted.prototype, "timestamp", void 0);
	    return TestRunHookStarted;
	}());
	messages.TestRunHookStarted = TestRunHookStarted;
	var TestRunStarted = /** @class */ (function () {
	    function TestRunStarted() {
	        this.timestamp = new Timestamp();
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Timestamp; })
	    ], TestRunStarted.prototype, "timestamp", void 0);
	    return TestRunStarted;
	}());
	messages.TestRunStarted = TestRunStarted;
	var TestStepFinished = /** @class */ (function () {
	    function TestStepFinished() {
	        this.testCaseStartedId = '';
	        this.testStepId = '';
	        this.testStepResult = new TestStepResult();
	        this.timestamp = new Timestamp();
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return TestStepResult; })
	    ], TestStepFinished.prototype, "testStepResult", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Timestamp; })
	    ], TestStepFinished.prototype, "timestamp", void 0);
	    return TestStepFinished;
	}());
	messages.TestStepFinished = TestStepFinished;
	var TestStepResult = /** @class */ (function () {
	    function TestStepResult() {
	        this.duration = new Duration();
	        this.status = TestStepResultStatus.UNKNOWN;
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Duration; })
	    ], TestStepResult.prototype, "duration", void 0);
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Exception; })
	    ], TestStepResult.prototype, "exception", void 0);
	    return TestStepResult;
	}());
	messages.TestStepResult = TestStepResult;
	var TestStepStarted = /** @class */ (function () {
	    function TestStepStarted() {
	        this.testCaseStartedId = '';
	        this.testStepId = '';
	        this.timestamp = new Timestamp();
	    }
	    __decorate([
	        (0, class_transformer_1.Type)(function () { return Timestamp; })
	    ], TestStepStarted.prototype, "timestamp", void 0);
	    return TestStepStarted;
	}());
	messages.TestStepStarted = TestStepStarted;
	var Timestamp = /** @class */ (function () {
	    function Timestamp() {
	        this.seconds = 0;
	        this.nanos = 0;
	    }
	    return Timestamp;
	}());
	messages.Timestamp = Timestamp;
	var UndefinedParameterType = /** @class */ (function () {
	    function UndefinedParameterType() {
	        this.expression = '';
	        this.name = '';
	    }
	    return UndefinedParameterType;
	}());
	messages.UndefinedParameterType = UndefinedParameterType;
	var AttachmentContentEncoding;
	(function (AttachmentContentEncoding) {
	    AttachmentContentEncoding["IDENTITY"] = "IDENTITY";
	    AttachmentContentEncoding["BASE64"] = "BASE64";
	})(AttachmentContentEncoding || (messages.AttachmentContentEncoding = AttachmentContentEncoding = {}));
	var HookType;
	(function (HookType) {
	    HookType["BEFORE_TEST_RUN"] = "BEFORE_TEST_RUN";
	    HookType["AFTER_TEST_RUN"] = "AFTER_TEST_RUN";
	    HookType["BEFORE_TEST_CASE"] = "BEFORE_TEST_CASE";
	    HookType["AFTER_TEST_CASE"] = "AFTER_TEST_CASE";
	    HookType["BEFORE_TEST_STEP"] = "BEFORE_TEST_STEP";
	    HookType["AFTER_TEST_STEP"] = "AFTER_TEST_STEP";
	})(HookType || (messages.HookType = HookType = {}));
	var PickleStepType;
	(function (PickleStepType) {
	    PickleStepType["UNKNOWN"] = "Unknown";
	    PickleStepType["CONTEXT"] = "Context";
	    PickleStepType["ACTION"] = "Action";
	    PickleStepType["OUTCOME"] = "Outcome";
	})(PickleStepType || (messages.PickleStepType = PickleStepType = {}));
	var SourceMediaType;
	(function (SourceMediaType) {
	    SourceMediaType["TEXT_X_CUCUMBER_GHERKIN_PLAIN"] = "text/x.cucumber.gherkin+plain";
	    SourceMediaType["TEXT_X_CUCUMBER_GHERKIN_MARKDOWN"] = "text/x.cucumber.gherkin+markdown";
	})(SourceMediaType || (messages.SourceMediaType = SourceMediaType = {}));
	var StepDefinitionPatternType;
	(function (StepDefinitionPatternType) {
	    StepDefinitionPatternType["CUCUMBER_EXPRESSION"] = "CUCUMBER_EXPRESSION";
	    StepDefinitionPatternType["REGULAR_EXPRESSION"] = "REGULAR_EXPRESSION";
	})(StepDefinitionPatternType || (messages.StepDefinitionPatternType = StepDefinitionPatternType = {}));
	var StepKeywordType;
	(function (StepKeywordType) {
	    StepKeywordType["UNKNOWN"] = "Unknown";
	    StepKeywordType["CONTEXT"] = "Context";
	    StepKeywordType["ACTION"] = "Action";
	    StepKeywordType["OUTCOME"] = "Outcome";
	    StepKeywordType["CONJUNCTION"] = "Conjunction";
	})(StepKeywordType || (messages.StepKeywordType = StepKeywordType = {}));
	var TestStepResultStatus;
	(function (TestStepResultStatus) {
	    TestStepResultStatus["UNKNOWN"] = "UNKNOWN";
	    TestStepResultStatus["PASSED"] = "PASSED";
	    TestStepResultStatus["SKIPPED"] = "SKIPPED";
	    TestStepResultStatus["PENDING"] = "PENDING";
	    TestStepResultStatus["UNDEFINED"] = "UNDEFINED";
	    TestStepResultStatus["AMBIGUOUS"] = "AMBIGUOUS";
	    TestStepResultStatus["FAILED"] = "FAILED";
	})(TestStepResultStatus || (messages.TestStepResultStatus = TestStepResultStatus = {}));
	
	return messages;
}

var hasRequiredParseEnvelope;

function requireParseEnvelope () {
	if (hasRequiredParseEnvelope) return parseEnvelope;
	hasRequiredParseEnvelope = 1;
	Object.defineProperty(parseEnvelope, "__esModule", { value: true });
	parseEnvelope.parseEnvelope = parseEnvelope$1;
	var messages_js_1 = requireMessages();
	var class_transformer_1 = require$$1;
	/**
	 * Parses JSON into an Envelope object. The difference from JSON.parse
	 * is that the resulting objects will have default values (defined in the JSON Schema)
	 * for properties that are absent from the JSON.
	 */
	function parseEnvelope$1(json) {
	    var plain = JSON.parse(json);
	    return (0, class_transformer_1.plainToClass)(messages_js_1.Envelope, plain);
	}
	
	return parseEnvelope;
}

var getWorstTestStepResult = {};

var hasRequiredGetWorstTestStepResult;

function requireGetWorstTestStepResult () {
	if (hasRequiredGetWorstTestStepResult) return getWorstTestStepResult;
	hasRequiredGetWorstTestStepResult = 1;
	Object.defineProperty(getWorstTestStepResult, "__esModule", { value: true });
	getWorstTestStepResult.getWorstTestStepResult = getWorstTestStepResult$1;
	var messages_js_1 = requireMessages();
	var TimeConversion_js_1 = requireTimeConversion();
	/**
	 * Gets the worst result
	 * @param testStepResults
	 */
	function getWorstTestStepResult$1(testStepResults) {
	    return (testStepResults.slice().sort(function (r1, r2) { return ordinal(r2.status) - ordinal(r1.status); })[0] || {
	        status: messages_js_1.TestStepResultStatus.UNKNOWN,
	        duration: (0, TimeConversion_js_1.millisecondsToDuration)(0),
	    });
	}
	function ordinal(status) {
	    return [
	        messages_js_1.TestStepResultStatus.UNKNOWN,
	        messages_js_1.TestStepResultStatus.PASSED,
	        messages_js_1.TestStepResultStatus.SKIPPED,
	        messages_js_1.TestStepResultStatus.PENDING,
	        messages_js_1.TestStepResultStatus.UNDEFINED,
	        messages_js_1.TestStepResultStatus.AMBIGUOUS,
	        messages_js_1.TestStepResultStatus.FAILED,
	    ].indexOf(status);
	}
	
	return getWorstTestStepResult;
}

var version = {};

var hasRequiredVersion;

function requireVersion () {
	if (hasRequiredVersion) return version;
	hasRequiredVersion = 1;
	Object.defineProperty(version, "__esModule", { value: true });
	version.version = void 0;
	// This file is automatically generated using npm scripts
	version.version = '30.1.0';
	
	return version;
}

var hasRequiredSrc$1;

function requireSrc$1 () {
	if (hasRequiredSrc$1) return src;
	hasRequiredSrc$1 = 1;
	(function (exports$1) {
		var __createBinding = (src && src.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    var desc = Object.getOwnPropertyDescriptor(m, k);
		    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		      desc = { enumerable: true, get: function() { return m[k]; } };
		    }
		    Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __setModuleDefault = (src && src.__setModuleDefault) || (Object.create ? (function(o, v) {
		    Object.defineProperty(o, "default", { enumerable: true, value: v });
		}) : function(o, v) {
		    o["default"] = v;
		});
		var __importStar = (src && src.__importStar) || (function () {
		    var ownKeys = function(o) {
		        ownKeys = Object.getOwnPropertyNames || function (o) {
		            var ar = [];
		            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
		            return ar;
		        };
		        return ownKeys(o);
		    };
		    return function (mod) {
		        if (mod && mod.__esModule) return mod;
		        var result = {};
		        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
		        __setModuleDefault(result, mod);
		        return result;
		    };
		})();
		var __exportStar = (src && src.__exportStar) || function(m, exports$1) {
		    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
		};
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.getWorstTestStepResult = exports$1.parseEnvelope = exports$1.version = exports$1.IdGenerator = exports$1.TimeConversion = void 0;
		var TimeConversion = __importStar(requireTimeConversion());
		exports$1.TimeConversion = TimeConversion;
		var IdGenerator = __importStar(requireIdGenerator());
		exports$1.IdGenerator = IdGenerator;
		var parseEnvelope_js_1 = requireParseEnvelope();
		Object.defineProperty(exports$1, "parseEnvelope", { enumerable: true, get: function () { return parseEnvelope_js_1.parseEnvelope; } });
		var getWorstTestStepResult_js_1 = requireGetWorstTestStepResult();
		Object.defineProperty(exports$1, "getWorstTestStepResult", { enumerable: true, get: function () { return getWorstTestStepResult_js_1.getWorstTestStepResult; } });
		var version_js_1 = requireVersion();
		Object.defineProperty(exports$1, "version", { enumerable: true, get: function () { return version_js_1.version; } });
		__exportStar(requireMessages(), exports$1);
		
	} (src));
	return src;
}

var compareStepKeywords = {};

var hasRequiredCompareStepKeywords;

function requireCompareStepKeywords () {
	if (hasRequiredCompareStepKeywords) return compareStepKeywords;
	hasRequiredCompareStepKeywords = 1;
	Object.defineProperty(compareStepKeywords, "__esModule", { value: true });
	compareStepKeywords.compareStepKeywords = compareStepKeywords$1;
	/**
	 * Compares two step keywords based on length. Can be used with Array.sort to
	 * sort keywords by length, descending.
	 *
	 * @param a - the first step keyword
	 * @param b - the second step keyword
	 */
	function compareStepKeywords$1(a, b) {
	    return b.length - a.length;
	}
	
	return compareStepKeywords;
}

var hasRequiredGherkinClassicTokenMatcher;

function requireGherkinClassicTokenMatcher () {
	if (hasRequiredGherkinClassicTokenMatcher) return GherkinClassicTokenMatcher;
	hasRequiredGherkinClassicTokenMatcher = 1;
	var __createBinding = (GherkinClassicTokenMatcher && GherkinClassicTokenMatcher.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (GherkinClassicTokenMatcher && GherkinClassicTokenMatcher.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (GherkinClassicTokenMatcher && GherkinClassicTokenMatcher.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __importDefault = (GherkinClassicTokenMatcher && GherkinClassicTokenMatcher.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(GherkinClassicTokenMatcher, "__esModule", { value: true });
	const gherkin_languages_json_1 = __importDefault(require$$7);
	const Errors_1 = requireErrors();
	const messages = __importStar(requireSrc$1());
	const Parser_1 = requireParser();
	const countSymbols_1 = __importDefault(requireCountSymbols());
	const compareStepKeywords_1 = requireCompareStepKeywords();
	const DIALECT_DICT = gherkin_languages_json_1.default;
	const LANGUAGE_PATTERN = /^\s*#\s*language\s*:\s*([a-zA-Z\-_]+)\s*$/;
	function addKeywordTypeMappings(h, keywords, keywordType) {
	    for (const k of keywords) {
	        if (!(k in h)) {
	            h[k] = [];
	        }
	        h[k].push(keywordType);
	    }
	}
	let GherkinClassicTokenMatcher$1 = class GherkinClassicTokenMatcher {
	    constructor(defaultDialectName = 'en') {
	        this.defaultDialectName = defaultDialectName;
	        this.reset();
	    }
	    changeDialect(newDialectName, location) {
	        const newDialect = DIALECT_DICT[newDialectName];
	        if (!newDialect) {
	            throw Errors_1.NoSuchLanguageException.create(newDialectName, location);
	        }
	        this.dialectName = newDialectName;
	        this.dialect = newDialect;
	        this.initializeKeywordTypes();
	        this.initializeSortedStepKeywords();
	    }
	    reset() {
	        if (this.dialectName !== this.defaultDialectName) {
	            this.changeDialect(this.defaultDialectName);
	        }
	        this.activeDocStringSeparator = null;
	        this.indentToRemove = 0;
	    }
	    initializeKeywordTypes() {
	        this.keywordTypesMap = {};
	        addKeywordTypeMappings(this.keywordTypesMap, this.dialect.given, messages.StepKeywordType.CONTEXT);
	        addKeywordTypeMappings(this.keywordTypesMap, this.dialect.when, messages.StepKeywordType.ACTION);
	        addKeywordTypeMappings(this.keywordTypesMap, this.dialect.then, messages.StepKeywordType.OUTCOME);
	        addKeywordTypeMappings(this.keywordTypesMap, [].concat(this.dialect.and).concat(this.dialect.but), messages.StepKeywordType.CONJUNCTION);
	    }
	    initializeSortedStepKeywords() {
	        this.sortedStepKeywords = []
	            .concat(this.dialect.given)
	            .concat(this.dialect.when)
	            .concat(this.dialect.then)
	            .concat(this.dialect.and)
	            .concat(this.dialect.but)
	            .sort(compareStepKeywords_1.compareStepKeywords);
	    }
	    match_TagLine(token) {
	        if (token.line.startsWith('@')) {
	            this.setTokenMatched(token, Parser_1.TokenType.TagLine, null, null, null, null, this.getTags(token.line));
	            return true;
	        }
	        return false;
	    }
	    match_FeatureLine(token) {
	        return this.matchTitleLine(token, Parser_1.TokenType.FeatureLine, this.dialect.feature);
	    }
	    match_ScenarioLine(token) {
	        return (this.matchTitleLine(token, Parser_1.TokenType.ScenarioLine, this.dialect.scenario) ||
	            this.matchTitleLine(token, Parser_1.TokenType.ScenarioLine, this.dialect.scenarioOutline));
	    }
	    match_BackgroundLine(token) {
	        return this.matchTitleLine(token, Parser_1.TokenType.BackgroundLine, this.dialect.background);
	    }
	    match_ExamplesLine(token) {
	        return this.matchTitleLine(token, Parser_1.TokenType.ExamplesLine, this.dialect.examples);
	    }
	    match_RuleLine(token) {
	        return this.matchTitleLine(token, Parser_1.TokenType.RuleLine, this.dialect.rule);
	    }
	    match_TableRow(token) {
	        if (token.line.startsWith('|')) {
	            // TODO: indent
	            this.setTokenMatched(token, Parser_1.TokenType.TableRow, null, null, null, null, token.line.getTableCells());
	            return true;
	        }
	        return false;
	    }
	    match_Empty(token) {
	        if (token.line.isEmpty) {
	            this.setTokenMatched(token, Parser_1.TokenType.Empty, null, null, 0);
	            return true;
	        }
	        return false;
	    }
	    match_Comment(token) {
	        if (token.line.startsWith('#')) {
	            const text = token.line.getLineText(0); // take the entire line, including leading space
	            this.setTokenMatched(token, Parser_1.TokenType.Comment, text, null, 0);
	            return true;
	        }
	        return false;
	    }
	    match_Language(token) {
	        const match = token.line.trimmedLineText.match(LANGUAGE_PATTERN);
	        if (match) {
	            const newDialectName = match[1];
	            this.setTokenMatched(token, Parser_1.TokenType.Language, newDialectName);
	            this.changeDialect(newDialectName, token.location);
	            return true;
	        }
	        return false;
	    }
	    match_DocStringSeparator(token) {
	        return this.activeDocStringSeparator == null
	            ? // open
	                this._match_DocStringSeparator(token, '"""', true) ||
	                    this._match_DocStringSeparator(token, '```', true)
	            : // close
	                this._match_DocStringSeparator(token, this.activeDocStringSeparator, false);
	    }
	    _match_DocStringSeparator(token, separator, isOpen) {
	        if (token.line.startsWith(separator)) {
	            let mediaType = null;
	            if (isOpen) {
	                mediaType = token.line.getRestTrimmed(separator.length);
	                this.activeDocStringSeparator = separator;
	                this.indentToRemove = token.line.indent;
	            }
	            else {
	                this.activeDocStringSeparator = null;
	                this.indentToRemove = 0;
	            }
	            this.setTokenMatched(token, Parser_1.TokenType.DocStringSeparator, mediaType, separator);
	            return true;
	        }
	        return false;
	    }
	    match_EOF(token) {
	        if (token.isEof) {
	            this.setTokenMatched(token, Parser_1.TokenType.EOF);
	            return true;
	        }
	        return false;
	    }
	    match_StepLine(token) {
	        for (const keyword of this.sortedStepKeywords) {
	            if (token.line.startsWith(keyword)) {
	                const title = token.line.getRestTrimmed(keyword.length);
	                const keywordTypes = this.keywordTypesMap[keyword];
	                let keywordType = keywordTypes[0];
	                if (keywordTypes.length > 1) {
	                    keywordType = messages.StepKeywordType.UNKNOWN;
	                }
	                this.setTokenMatched(token, Parser_1.TokenType.StepLine, title, keyword, null, keywordType);
	                return true;
	            }
	        }
	        return false;
	    }
	    match_Other(token) {
	        const text = token.line.getLineText(this.indentToRemove); // take the entire line, except removing DocString indents
	        this.setTokenMatched(token, Parser_1.TokenType.Other, this.unescapeDocString(text), null, 0);
	        return true;
	    }
	    getTags(line) {
	        const uncommentedLine = line.trimmedLineText.split(/\s#/g, 2)[0];
	        let column = line.indent + 1;
	        const items = uncommentedLine.split('@');
	        const tags = [];
	        for (let i = 0; i < items.length; i++) {
	            const item = items[i].trimRight();
	            if (item.length == 0) {
	                continue;
	            }
	            if (!item.match(/^\S+$/)) {
	                throw Errors_1.ParserException.create('A tag may not contain whitespace', line.lineNumber, column);
	            }
	            const span = { column, text: '@' + item };
	            tags.push(span);
	            column += (0, countSymbols_1.default)(items[i]) + 1;
	        }
	        return tags;
	    }
	    matchTitleLine(token, tokenType, keywords) {
	        for (const keyword of keywords) {
	            if (token.line.startsWithTitleKeyword(keyword)) {
	                const title = token.line.getRestTrimmed(keyword.length + ':'.length);
	                this.setTokenMatched(token, tokenType, title, keyword);
	                return true;
	            }
	        }
	        return false;
	    }
	    setTokenMatched(token, matchedType, text, keyword, indent, keywordType, items) {
	        token.matchedType = matchedType;
	        token.matchedText = text;
	        token.matchedKeyword = keyword;
	        token.matchedKeywordType = keywordType;
	        token.matchedIndent =
	            typeof indent === 'number' ? indent : token.line == null ? 0 : token.line.indent;
	        token.matchedItems = items || [];
	        token.location.column = token.matchedIndent + 1;
	        token.matchedGherkinDialect = this.dialectName;
	    }
	    unescapeDocString(text) {
	        if (this.activeDocStringSeparator === '"""') {
	            return text.replace('\\"\\"\\"', '"""');
	        }
	        if (this.activeDocStringSeparator === '```') {
	            return text.replace('\\`\\`\\`', '```');
	        }
	        return text;
	    }
	};
	GherkinClassicTokenMatcher.default = GherkinClassicTokenMatcher$1;
	
	return GherkinClassicTokenMatcher;
}

var compile = {};

var hasRequiredCompile;

function requireCompile () {
	if (hasRequiredCompile) return compile;
	hasRequiredCompile = 1;
	var __createBinding = (compile && compile.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (compile && compile.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (compile && compile.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	Object.defineProperty(compile, "__esModule", { value: true });
	compile.default = compile$1;
	const messages = __importStar(requireSrc$1());
	const pickleStepTypeFromKeyword = {
	    [messages.StepKeywordType.UNKNOWN]: messages.PickleStepType.UNKNOWN,
	    [messages.StepKeywordType.CONTEXT]: messages.PickleStepType.CONTEXT,
	    [messages.StepKeywordType.ACTION]: messages.PickleStepType.ACTION,
	    [messages.StepKeywordType.OUTCOME]: messages.PickleStepType.OUTCOME,
	    [messages.StepKeywordType.CONJUNCTION]: null
	};
	function compile$1(gherkinDocument, uri, newId) {
	    const pickles = [];
	    if (gherkinDocument.feature == null) {
	        return pickles;
	    }
	    const feature = gherkinDocument.feature;
	    const language = feature.language;
	    const featureTags = feature.tags;
	    let featureBackgroundSteps = [];
	    feature.children.forEach((stepsContainer) => {
	        if (stepsContainer.background) {
	            featureBackgroundSteps = [].concat(stepsContainer.background.steps);
	        }
	        else if (stepsContainer.rule) {
	            compileRule(featureTags, featureBackgroundSteps, stepsContainer.rule, language, pickles, uri, newId);
	        }
	        else if (stepsContainer.scenario.examples.length === 0) {
	            compileScenario(featureTags, featureBackgroundSteps, stepsContainer.scenario, language, pickles, uri, newId);
	        }
	        else {
	            compileScenarioOutline(featureTags, featureBackgroundSteps, stepsContainer.scenario, language, pickles, uri, newId);
	        }
	    });
	    return pickles;
	}
	function compileRule(featureTags, featureBackgroundSteps, rule, language, pickles, uri, newId) {
	    let ruleBackgroundSteps = [].concat(featureBackgroundSteps);
	    const tags = [].concat(featureTags).concat(rule.tags);
	    rule.children.forEach((stepsContainer) => {
	        if (stepsContainer.background) {
	            ruleBackgroundSteps = ruleBackgroundSteps.concat(stepsContainer.background.steps);
	        }
	        else if (stepsContainer.scenario.examples.length === 0) {
	            compileScenario(tags, ruleBackgroundSteps, stepsContainer.scenario, language, pickles, uri, newId);
	        }
	        else {
	            compileScenarioOutline(tags, ruleBackgroundSteps, stepsContainer.scenario, language, pickles, uri, newId);
	        }
	    });
	}
	function compileScenario(inheritedTags, backgroundSteps, scenario, language, pickles, uri, newId) {
	    let lastKeywordType = messages.StepKeywordType.UNKNOWN;
	    const steps = [];
	    if (scenario.steps.length !== 0) {
	        backgroundSteps.forEach((step) => {
	            lastKeywordType = (step.keywordType === messages.StepKeywordType.CONJUNCTION) ?
	                lastKeywordType : step.keywordType;
	            steps.push(pickleStep(step, [], null, newId, lastKeywordType));
	        });
	    }
	    const tags = [].concat(inheritedTags).concat(scenario.tags);
	    scenario.steps.forEach((step) => {
	        lastKeywordType = (step.keywordType === messages.StepKeywordType.CONJUNCTION) ?
	            lastKeywordType : step.keywordType;
	        steps.push(pickleStep(step, [], null, newId, lastKeywordType));
	    });
	    const pickle = {
	        id: newId(),
	        uri,
	        astNodeIds: [scenario.id],
	        tags: pickleTags(tags),
	        name: scenario.name,
	        language,
	        steps,
	    };
	    pickles.push(pickle);
	}
	function compileScenarioOutline(inheritedTags, backgroundSteps, scenario, language, pickles, uri, newId) {
	    scenario.examples
	        .filter((e) => e.tableHeader)
	        .forEach((examples) => {
	        const variableCells = examples.tableHeader.cells;
	        examples.tableBody.forEach((valuesRow) => {
	            let lastKeywordType = messages.StepKeywordType.UNKNOWN;
	            const steps = [];
	            if (scenario.steps.length !== 0) {
	                backgroundSteps.forEach((step) => {
	                    lastKeywordType = (step.keywordType === messages.StepKeywordType.CONJUNCTION) ?
	                        lastKeywordType : step.keywordType;
	                    steps.push(pickleStep(step, [], null, newId, lastKeywordType));
	                });
	            }
	            scenario.steps.forEach((scenarioOutlineStep) => {
	                lastKeywordType = (scenarioOutlineStep.keywordType === messages.StepKeywordType.CONJUNCTION) ?
	                    lastKeywordType : scenarioOutlineStep.keywordType;
	                const step = pickleStep(scenarioOutlineStep, variableCells, valuesRow, newId, lastKeywordType);
	                steps.push(step);
	            });
	            const id = newId();
	            const tags = pickleTags([].concat(inheritedTags).concat(scenario.tags).concat(examples.tags));
	            pickles.push({
	                id,
	                uri,
	                astNodeIds: [scenario.id, valuesRow.id],
	                name: interpolate(scenario.name, variableCells, valuesRow.cells),
	                language,
	                steps,
	                tags,
	            });
	        });
	    });
	}
	function createPickleArguments(step, variableCells, valueCells) {
	    if (step.dataTable) {
	        const argument = step.dataTable;
	        const table = {
	            rows: argument.rows.map((row) => {
	                return {
	                    cells: row.cells.map((cell) => {
	                        return {
	                            value: interpolate(cell.value, variableCells, valueCells),
	                        };
	                    }),
	                };
	            }),
	        };
	        return { dataTable: table };
	    }
	    else if (step.docString) {
	        const argument = step.docString;
	        const docString = {
	            content: interpolate(argument.content, variableCells, valueCells),
	        };
	        if (argument.mediaType) {
	            docString.mediaType = interpolate(argument.mediaType, variableCells, valueCells);
	        }
	        return { docString };
	    }
	}
	function interpolate(name, variableCells, valueCells) {
	    variableCells.forEach((variableCell, n) => {
	        const valueCell = valueCells[n];
	        const valuePattern = '<' + variableCell.value + '>';
	        const escapedPattern = valuePattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
	        const regexp = new RegExp(escapedPattern, 'g');
	        // JS Specific - dollar sign needs to be escaped with another dollar sign
	        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
	        const replacement = valueCell.value.replace(new RegExp('\\$', 'g'), '$$$$');
	        name = name.replace(regexp, replacement);
	    });
	    return name;
	}
	function pickleStep(step, variableCells, valuesRow, newId, keywordType) {
	    const astNodeIds = [step.id];
	    if (valuesRow) {
	        astNodeIds.push(valuesRow.id);
	    }
	    const valueCells = valuesRow ? valuesRow.cells : [];
	    return {
	        id: newId(),
	        text: interpolate(step.text, variableCells, valueCells),
	        type: pickleStepTypeFromKeyword[keywordType],
	        argument: createPickleArguments(step, variableCells, valueCells),
	        astNodeIds: astNodeIds,
	    };
	}
	function pickleTags(tags) {
	    return tags.map(pickleTag);
	}
	function pickleTag(tag) {
	    return {
	        name: tag.name,
	        astNodeId: tag.id,
	    };
	}
	
	return compile;
}

var AstBuilder = {};

var AstNode = {};

var hasRequiredAstNode;

function requireAstNode () {
	if (hasRequiredAstNode) return AstNode;
	hasRequiredAstNode = 1;
	Object.defineProperty(AstNode, "__esModule", { value: true });
	let AstNode$1 = class AstNode {
	    constructor(ruleType) {
	        this.ruleType = ruleType;
	        // eslint-disable-next-line @typescript-eslint/no-explicit-any
	        this.subItems = new Map();
	    }
	    // eslint-disable-next-line @typescript-eslint/no-explicit-any
	    add(type, obj) {
	        let items = this.subItems.get(type);
	        if (items === undefined) {
	            items = [];
	            this.subItems.set(type, items);
	        }
	        items.push(obj);
	    }
	    getSingle(ruleType) {
	        return (this.subItems.get(ruleType) || [])[0];
	    }
	    getItems(ruleType) {
	        return this.subItems.get(ruleType) || [];
	    }
	    getToken(tokenType) {
	        return (this.subItems.get(tokenType) || [])[0];
	    }
	    getTokens(tokenType) {
	        return this.subItems.get(tokenType) || [];
	    }
	};
	AstNode.default = AstNode$1;
	
	return AstNode;
}

var hasRequiredAstBuilder;

function requireAstBuilder () {
	if (hasRequiredAstBuilder) return AstBuilder;
	hasRequiredAstBuilder = 1;
	var __importDefault = (AstBuilder && AstBuilder.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(AstBuilder, "__esModule", { value: true });
	const AstNode_1 = __importDefault(requireAstNode());
	const Parser_1 = requireParser();
	const Errors_1 = requireErrors();
	let AstBuilder$1 = class AstBuilder {
	    constructor(newId) {
	        this.newId = newId;
	        if (!newId) {
	            throw new Error('No newId');
	        }
	        this.reset();
	    }
	    reset() {
	        this.stack = [new AstNode_1.default(Parser_1.RuleType.None)];
	        this.comments = [];
	    }
	    startRule(ruleType) {
	        this.stack.push(new AstNode_1.default(ruleType));
	    }
	    endRule() {
	        const node = this.stack.pop();
	        const transformedNode = this.transformNode(node);
	        this.currentNode().add(node.ruleType, transformedNode);
	    }
	    build(token) {
	        if (token.matchedType === Parser_1.TokenType.Comment) {
	            this.comments.push({
	                location: this.getLocation(token),
	                text: token.matchedText,
	            });
	        }
	        else {
	            this.currentNode().add(token.matchedType, token);
	        }
	    }
	    getResult() {
	        return this.currentNode().getSingle(Parser_1.RuleType.GherkinDocument);
	    }
	    currentNode() {
	        return this.stack[this.stack.length - 1];
	    }
	    getLocation(token, column) {
	        return !column ? token.location : { line: token.location.line, column };
	    }
	    getTags(node) {
	        const tags = [];
	        const tagsNode = node.getSingle(Parser_1.RuleType.Tags);
	        if (!tagsNode) {
	            return tags;
	        }
	        const tokens = tagsNode.getTokens(Parser_1.TokenType.TagLine);
	        for (const token of tokens) {
	            for (const tagItem of token.matchedItems) {
	                tags.push({
	                    location: this.getLocation(token, tagItem.column),
	                    name: tagItem.text,
	                    id: this.newId(),
	                });
	            }
	        }
	        return tags;
	    }
	    getCells(tableRowToken) {
	        return tableRowToken.matchedItems.map((cellItem) => ({
	            location: this.getLocation(tableRowToken, cellItem.column),
	            value: cellItem.text,
	        }));
	    }
	    getDescription(node) {
	        return node.getSingle(Parser_1.RuleType.Description) || '';
	    }
	    getSteps(node) {
	        return node.getItems(Parser_1.RuleType.Step);
	    }
	    getTableRows(node) {
	        const rows = node.getTokens(Parser_1.TokenType.TableRow).map((token) => ({
	            id: this.newId(),
	            location: this.getLocation(token),
	            cells: this.getCells(token),
	        }));
	        this.ensureCellCount(rows);
	        return rows.length === 0 ? [] : rows;
	    }
	    ensureCellCount(rows) {
	        if (rows.length === 0) {
	            return;
	        }
	        const cellCount = rows[0].cells.length;
	        rows.forEach((row) => {
	            if (row.cells.length !== cellCount) {
	                throw Errors_1.AstBuilderException.create('inconsistent cell count within the table', row.location);
	            }
	        });
	    }
	    transformNode(node) {
	        switch (node.ruleType) {
	            case Parser_1.RuleType.Step: {
	                const stepLine = node.getToken(Parser_1.TokenType.StepLine);
	                const dataTable = node.getSingle(Parser_1.RuleType.DataTable);
	                const docString = node.getSingle(Parser_1.RuleType.DocString);
	                const location = this.getLocation(stepLine);
	                const step = {
	                    id: this.newId(),
	                    location,
	                    keyword: stepLine.matchedKeyword,
	                    keywordType: stepLine.matchedKeywordType,
	                    text: stepLine.matchedText,
	                    dataTable: dataTable,
	                    docString: docString,
	                };
	                return step;
	            }
	            case Parser_1.RuleType.DocString: {
	                const separatorToken = node.getTokens(Parser_1.TokenType.DocStringSeparator)[0];
	                const mediaType = separatorToken.matchedText.length > 0 ? separatorToken.matchedText : undefined;
	                const lineTokens = node.getTokens(Parser_1.TokenType.Other);
	                const content = lineTokens.map((t) => t.matchedText).join('\n');
	                const result = {
	                    location: this.getLocation(separatorToken),
	                    content,
	                    delimiter: separatorToken.matchedKeyword,
	                };
	                // conditionally add this like this (needed to make tests pass on node 0.10 as well as 4.0)
	                if (mediaType) {
	                    result.mediaType = mediaType;
	                }
	                return result;
	            }
	            case Parser_1.RuleType.DataTable: {
	                const rows = this.getTableRows(node);
	                const dataTable = {
	                    location: rows[0].location,
	                    rows,
	                };
	                return dataTable;
	            }
	            case Parser_1.RuleType.Background: {
	                const backgroundLine = node.getToken(Parser_1.TokenType.BackgroundLine);
	                const description = this.getDescription(node);
	                const steps = this.getSteps(node);
	                const background = {
	                    id: this.newId(),
	                    location: this.getLocation(backgroundLine),
	                    keyword: backgroundLine.matchedKeyword,
	                    name: backgroundLine.matchedText,
	                    description,
	                    steps,
	                };
	                return background;
	            }
	            case Parser_1.RuleType.ScenarioDefinition: {
	                const tags = this.getTags(node);
	                const scenarioNode = node.getSingle(Parser_1.RuleType.Scenario);
	                const scenarioLine = scenarioNode.getToken(Parser_1.TokenType.ScenarioLine);
	                const description = this.getDescription(scenarioNode);
	                const steps = this.getSteps(scenarioNode);
	                const examples = scenarioNode.getItems(Parser_1.RuleType.ExamplesDefinition);
	                const scenario = {
	                    id: this.newId(),
	                    tags,
	                    location: this.getLocation(scenarioLine),
	                    keyword: scenarioLine.matchedKeyword,
	                    name: scenarioLine.matchedText,
	                    description,
	                    steps,
	                    examples,
	                };
	                return scenario;
	            }
	            case Parser_1.RuleType.ExamplesDefinition: {
	                const tags = this.getTags(node);
	                const examplesNode = node.getSingle(Parser_1.RuleType.Examples);
	                const examplesLine = examplesNode.getToken(Parser_1.TokenType.ExamplesLine);
	                const description = this.getDescription(examplesNode);
	                const examplesTable = examplesNode.getSingle(Parser_1.RuleType.ExamplesTable);
	                const examples = {
	                    id: this.newId(),
	                    tags,
	                    location: this.getLocation(examplesLine),
	                    keyword: examplesLine.matchedKeyword,
	                    name: examplesLine.matchedText,
	                    description,
	                    tableHeader: examplesTable ? examplesTable[0] : undefined,
	                    tableBody: examplesTable ? examplesTable.slice(1) : [],
	                };
	                return examples;
	            }
	            case Parser_1.RuleType.ExamplesTable: {
	                return this.getTableRows(node);
	            }
	            case Parser_1.RuleType.Description: {
	                let lineTokens = node.getTokens(Parser_1.TokenType.Other);
	                // Trim trailing empty lines
	                let end = lineTokens.length;
	                while (end > 0 && lineTokens[end - 1].line.trimmedLineText === '') {
	                    end--;
	                }
	                lineTokens = lineTokens.slice(0, end);
	                return lineTokens.map((token) => token.matchedText).join('\n');
	            }
	            case Parser_1.RuleType.Feature: {
	                const header = node.getSingle(Parser_1.RuleType.FeatureHeader);
	                if (!header) {
	                    return null;
	                }
	                const tags = this.getTags(header);
	                const featureLine = header.getToken(Parser_1.TokenType.FeatureLine);
	                if (!featureLine) {
	                    return null;
	                }
	                const children = [];
	                const background = node.getSingle(Parser_1.RuleType.Background);
	                if (background) {
	                    children.push({
	                        background,
	                    });
	                }
	                for (const scenario of node.getItems(Parser_1.RuleType.ScenarioDefinition)) {
	                    children.push({
	                        scenario,
	                    });
	                }
	                for (const rule of node.getItems(Parser_1.RuleType.Rule)) {
	                    children.push({
	                        rule,
	                    });
	                }
	                const description = this.getDescription(header);
	                const language = featureLine.matchedGherkinDialect;
	                const feature = {
	                    tags,
	                    location: this.getLocation(featureLine),
	                    language,
	                    keyword: featureLine.matchedKeyword,
	                    name: featureLine.matchedText,
	                    description,
	                    children,
	                };
	                return feature;
	            }
	            case Parser_1.RuleType.Rule: {
	                const header = node.getSingle(Parser_1.RuleType.RuleHeader);
	                if (!header) {
	                    return null;
	                }
	                const ruleLine = header.getToken(Parser_1.TokenType.RuleLine);
	                if (!ruleLine) {
	                    return null;
	                }
	                const tags = this.getTags(header);
	                const children = [];
	                const background = node.getSingle(Parser_1.RuleType.Background);
	                if (background) {
	                    children.push({
	                        background,
	                    });
	                }
	                for (const scenario of node.getItems(Parser_1.RuleType.ScenarioDefinition)) {
	                    children.push({
	                        scenario,
	                    });
	                }
	                const description = this.getDescription(header);
	                const rule = {
	                    id: this.newId(),
	                    location: this.getLocation(ruleLine),
	                    keyword: ruleLine.matchedKeyword,
	                    name: ruleLine.matchedText,
	                    description,
	                    children,
	                    tags,
	                };
	                return rule;
	            }
	            case Parser_1.RuleType.GherkinDocument: {
	                const feature = node.getSingle(Parser_1.RuleType.Feature);
	                const gherkinDocument = {
	                    feature,
	                    comments: this.comments,
	                };
	                return gherkinDocument;
	            }
	            default:
	                return node;
	        }
	    }
	};
	AstBuilder.default = AstBuilder$1;
	
	return AstBuilder;
}

var makeSourceEnvelope = {};

var hasRequiredMakeSourceEnvelope;

function requireMakeSourceEnvelope () {
	if (hasRequiredMakeSourceEnvelope) return makeSourceEnvelope;
	hasRequiredMakeSourceEnvelope = 1;
	var __createBinding = (makeSourceEnvelope && makeSourceEnvelope.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (makeSourceEnvelope && makeSourceEnvelope.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (makeSourceEnvelope && makeSourceEnvelope.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	Object.defineProperty(makeSourceEnvelope, "__esModule", { value: true });
	makeSourceEnvelope.default = makeSourceEnvelope$1;
	const messages = __importStar(requireSrc$1());
	function makeSourceEnvelope$1(data, uri) {
	    let mediaType;
	    if (uri.endsWith('.feature')) {
	        mediaType = messages.SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN;
	    }
	    else if (uri.endsWith('.md')) {
	        mediaType = messages.SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_MARKDOWN;
	    }
	    if (!mediaType)
	        throw new Error(`The uri (${uri}) must end with .feature or .md`);
	    return {
	        source: {
	            data,
	            uri,
	            mediaType,
	        },
	    };
	}
	
	return makeSourceEnvelope;
}

var GherkinInMarkdownTokenMatcher = {};

var hasRequiredGherkinInMarkdownTokenMatcher;

function requireGherkinInMarkdownTokenMatcher () {
	if (hasRequiredGherkinInMarkdownTokenMatcher) return GherkinInMarkdownTokenMatcher;
	hasRequiredGherkinInMarkdownTokenMatcher = 1;
	var __createBinding = (GherkinInMarkdownTokenMatcher && GherkinInMarkdownTokenMatcher.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (GherkinInMarkdownTokenMatcher && GherkinInMarkdownTokenMatcher.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (GherkinInMarkdownTokenMatcher && GherkinInMarkdownTokenMatcher.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __importDefault = (GherkinInMarkdownTokenMatcher && GherkinInMarkdownTokenMatcher.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(GherkinInMarkdownTokenMatcher, "__esModule", { value: true });
	const Parser_1 = requireParser();
	const gherkin_languages_json_1 = __importDefault(require$$7);
	const messages = __importStar(requireSrc$1());
	const Errors_1 = requireErrors();
	const compareStepKeywords_1 = requireCompareStepKeywords();
	const DIALECT_DICT = gherkin_languages_json_1.default;
	const DEFAULT_DOC_STRING_SEPARATOR = /^(```[`]*)(.*)/;
	function addKeywordTypeMappings(h, keywords, keywordType) {
	    for (const k of keywords) {
	        if (!(k in h)) {
	            h[k] = [];
	        }
	        h[k].push(keywordType);
	    }
	}
	let GherkinInMarkdownTokenMatcher$1 = class GherkinInMarkdownTokenMatcher {
	    constructor(defaultDialectName = 'en') {
	        this.defaultDialectName = defaultDialectName;
	        this.dialect = DIALECT_DICT[defaultDialectName];
	        this.nonStarStepKeywords = []
	            .concat(this.dialect.given)
	            .concat(this.dialect.when)
	            .concat(this.dialect.then)
	            .concat(this.dialect.and)
	            .concat(this.dialect.but)
	            .filter((value, index, self) => value !== '* ' && self.indexOf(value) === index)
	            .sort(compareStepKeywords_1.compareStepKeywords);
	        this.initializeKeywordTypes();
	        this.stepRegexp = new RegExp(`${KeywordPrefix.BULLET}(${this.nonStarStepKeywords.map(escapeRegExp).join('|')})`);
	        const headerKeywords = []
	            .concat(this.dialect.feature)
	            .concat(this.dialect.background)
	            .concat(this.dialect.rule)
	            .concat(this.dialect.scenarioOutline)
	            .concat(this.dialect.scenario)
	            .concat(this.dialect.examples)
	            .filter((value, index, self) => self.indexOf(value) === index);
	        this.headerRegexp = new RegExp(`${KeywordPrefix.HEADER}(${headerKeywords.map(escapeRegExp).join('|')})`);
	        this.reset();
	    }
	    changeDialect(newDialectName, location) {
	        const newDialect = DIALECT_DICT[newDialectName];
	        if (!newDialect) {
	            throw Errors_1.NoSuchLanguageException.create(newDialectName, location);
	        }
	        this.dialectName = newDialectName;
	        this.dialect = newDialect;
	        this.initializeKeywordTypes();
	    }
	    initializeKeywordTypes() {
	        this.keywordTypesMap = {};
	        addKeywordTypeMappings(this.keywordTypesMap, this.dialect.given, messages.StepKeywordType.CONTEXT);
	        addKeywordTypeMappings(this.keywordTypesMap, this.dialect.when, messages.StepKeywordType.ACTION);
	        addKeywordTypeMappings(this.keywordTypesMap, this.dialect.then, messages.StepKeywordType.OUTCOME);
	        addKeywordTypeMappings(this.keywordTypesMap, [].concat(this.dialect.and).concat(this.dialect.but), messages.StepKeywordType.CONJUNCTION);
	    }
	    // We've made a deliberate choice not to support `# language: [ISO 639-1]` headers or similar
	    // in Markdown. Users should specify a language globally. This can be done in
	    // cucumber-js using the --language [ISO 639-1] option.
	    match_Language(token) {
	        if (!token)
	            throw new Error('no token');
	        return false;
	    }
	    match_Empty(token) {
	        let result = false;
	        if (token.line.isEmpty) {
	            result = true;
	        }
	        if (!this.match_TagLine(token) &&
	            !this.match_FeatureLine(token) &&
	            !this.match_ScenarioLine(token) &&
	            !this.match_BackgroundLine(token) &&
	            !this.match_ExamplesLine(token) &&
	            !this.match_RuleLine(token) &&
	            !this.match_TableRow(token) &&
	            !this.match_Comment(token) &&
	            !this.match_Language(token) &&
	            !this.match_DocStringSeparator(token) &&
	            !this.match_EOF(token) &&
	            !this.match_StepLine(token)) {
	            // neutered
	            result = true;
	        }
	        if (result) {
	            token.matchedType = Parser_1.TokenType.Empty;
	        }
	        return this.setTokenMatched(token, null, result);
	    }
	    match_Other(token) {
	        const text = token.line.getLineText(this.indentToRemove); // take the entire line, except removing DocString indents
	        token.matchedType = Parser_1.TokenType.Other;
	        token.matchedText = text;
	        token.matchedIndent = 0;
	        return this.setTokenMatched(token, null, true);
	    }
	    match_Comment(token) {
	        let result = false;
	        if (token.line.startsWith('|')) {
	            const tableCells = token.line.getTableCells();
	            if (this.isGfmTableSeparator(tableCells))
	                result = true;
	        }
	        return this.setTokenMatched(token, null, result);
	    }
	    match_DocStringSeparator(token) {
	        const match = token.line.trimmedLineText.match(this.activeDocStringSeparator);
	        const [, newSeparator, mediaType] = match || [];
	        let result = false;
	        if (newSeparator) {
	            if (this.activeDocStringSeparator === DEFAULT_DOC_STRING_SEPARATOR) {
	                this.activeDocStringSeparator = new RegExp(`^(${newSeparator})$`);
	                this.indentToRemove = token.line.indent;
	            }
	            else {
	                this.activeDocStringSeparator = DEFAULT_DOC_STRING_SEPARATOR;
	            }
	            token.matchedKeyword = newSeparator;
	            token.matchedType = Parser_1.TokenType.DocStringSeparator;
	            token.matchedText = mediaType || '';
	            result = true;
	        }
	        return this.setTokenMatched(token, null, result);
	    }
	    match_EOF(token) {
	        let result = false;
	        if (token.isEof) {
	            token.matchedType = Parser_1.TokenType.EOF;
	            result = true;
	        }
	        return this.setTokenMatched(token, null, result);
	    }
	    match_FeatureLine(token) {
	        if (this.matchedFeatureLine) {
	            return this.setTokenMatched(token, null, false);
	        }
	        // We first try to match "# Feature: blah"
	        let result = this.matchTitleLine(KeywordPrefix.HEADER, this.dialect.feature, ':', token, Parser_1.TokenType.FeatureLine);
	        // If we didn't match "# Feature: blah", we still match this line
	        // as a FeatureLine.
	        // The reason for this is that users may not want to be constrained by having this as their fist line.
	        if (!result) {
	            token.matchedType = Parser_1.TokenType.FeatureLine;
	            token.matchedText = token.line.trimmedLineText;
	            result = this.setTokenMatched(token, null, true);
	        }
	        this.matchedFeatureLine = result;
	        return result;
	    }
	    match_BackgroundLine(token) {
	        return this.matchTitleLine(KeywordPrefix.HEADER, this.dialect.background, ':', token, Parser_1.TokenType.BackgroundLine);
	    }
	    match_RuleLine(token) {
	        return this.matchTitleLine(KeywordPrefix.HEADER, this.dialect.rule, ':', token, Parser_1.TokenType.RuleLine);
	    }
	    match_ScenarioLine(token) {
	        return (this.matchTitleLine(KeywordPrefix.HEADER, this.dialect.scenario, ':', token, Parser_1.TokenType.ScenarioLine) ||
	            this.matchTitleLine(KeywordPrefix.HEADER, this.dialect.scenarioOutline, ':', token, Parser_1.TokenType.ScenarioLine));
	    }
	    match_ExamplesLine(token) {
	        return this.matchTitleLine(KeywordPrefix.HEADER, this.dialect.examples, ':', token, Parser_1.TokenType.ExamplesLine);
	    }
	    match_StepLine(token) {
	        return this.matchTitleLine(KeywordPrefix.BULLET, this.nonStarStepKeywords, '', token, Parser_1.TokenType.StepLine);
	    }
	    matchTitleLine(prefix, keywords, keywordSuffix, token, matchedType) {
	        const regexp = new RegExp(`${prefix}(${keywords.map(escapeRegExp).join('|')})${keywordSuffix}(.*)`);
	        const match = token.line.match(regexp);
	        let indent = token.line.indent;
	        let result = false;
	        if (match) {
	            token.matchedType = matchedType;
	            token.matchedKeyword = match[2];
	            if (match[2] in this.keywordTypesMap) {
	                // only set the keyword type if this is a step keyword
	                if (this.keywordTypesMap[match[2]].length > 1) {
	                    token.matchedKeywordType = messages.StepKeywordType.UNKNOWN;
	                }
	                else {
	                    token.matchedKeywordType = this.keywordTypesMap[match[2]][0];
	                }
	            }
	            token.matchedText = match[3].trim();
	            indent += match[1].length;
	            result = true;
	        }
	        return this.setTokenMatched(token, indent, result);
	    }
	    setTokenMatched(token, indent, matched) {
	        token.matchedGherkinDialect = this.dialectName;
	        token.matchedIndent = indent !== null ? indent : token.line == null ? 0 : token.line.indent;
	        token.location.column = token.matchedIndent + 1;
	        return matched;
	    }
	    match_TableRow(token) {
	        // Gherkin tables must be indented 2-5 spaces in order to be distinguidedn from non-Gherkin tables
	        if (token.line.lineText.match(/^\s\s\s?\s?\s?\|/)) {
	            const tableCells = token.line.getTableCells();
	            if (this.isGfmTableSeparator(tableCells))
	                return false;
	            token.matchedKeyword = '|';
	            token.matchedType = Parser_1.TokenType.TableRow;
	            token.matchedItems = tableCells;
	            return true;
	        }
	        return false;
	    }
	    isGfmTableSeparator(tableCells) {
	        const separatorValues = tableCells
	            .map((item) => item.text)
	            .filter((value) => value.match(/^:?-+:?$/));
	        return separatorValues.length > 0;
	    }
	    match_TagLine(token) {
	        const tags = [];
	        let m;
	        const re = /`(@[^`]+)`/g;
	        do {
	            m = re.exec(token.line.trimmedLineText);
	            if (m) {
	                tags.push({
	                    column: token.line.indent + m.index + 2,
	                    text: m[1],
	                });
	            }
	        } while (m);
	        if (tags.length === 0)
	            return false;
	        token.matchedType = Parser_1.TokenType.TagLine;
	        token.matchedItems = tags;
	        return true;
	    }
	    reset() {
	        if (this.dialectName !== this.defaultDialectName) {
	            this.changeDialect(this.defaultDialectName);
	        }
	        this.activeDocStringSeparator = DEFAULT_DOC_STRING_SEPARATOR;
	    }
	};
	GherkinInMarkdownTokenMatcher.default = GherkinInMarkdownTokenMatcher$1;
	var KeywordPrefix;
	(function (KeywordPrefix) {
	    // https://spec.commonmark.org/0.29/#bullet-list-marker
	    KeywordPrefix["BULLET"] = "^(\\s*[*+-]\\s*)";
	    KeywordPrefix["HEADER"] = "^(#{1,6}\\s)";
	})(KeywordPrefix || (KeywordPrefix = {}));
	// https://stackoverflow.com/questions/3115150/how-to-escape-regular-expression-special-characters-using-javascript
	function escapeRegExp(text) {
	    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	}
	
	return GherkinInMarkdownTokenMatcher;
}

var hasRequiredGenerateMessages;

function requireGenerateMessages () {
	if (hasRequiredGenerateMessages) return generateMessages;
	hasRequiredGenerateMessages = 1;
	var __createBinding = (generateMessages && generateMessages.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (generateMessages && generateMessages.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (generateMessages && generateMessages.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __importDefault = (generateMessages && generateMessages.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(generateMessages, "__esModule", { value: true });
	generateMessages.default = generateMessages$1;
	const Parser_1 = __importDefault(requireParser());
	const GherkinClassicTokenMatcher_1 = __importDefault(requireGherkinClassicTokenMatcher());
	const messages = __importStar(requireSrc$1());
	const compile_1 = __importDefault(requireCompile());
	const AstBuilder_1 = __importDefault(requireAstBuilder());
	const makeSourceEnvelope_1 = __importDefault(requireMakeSourceEnvelope());
	const GherkinInMarkdownTokenMatcher_1 = __importDefault(requireGherkinInMarkdownTokenMatcher());
	function generateMessages$1(data, uri, mediaType, options) {
	    let tokenMatcher;
	    switch (mediaType) {
	        case messages.SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN:
	            tokenMatcher = new GherkinClassicTokenMatcher_1.default(options.defaultDialect);
	            break;
	        case messages.SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_MARKDOWN:
	            tokenMatcher = new GherkinInMarkdownTokenMatcher_1.default(options.defaultDialect);
	            break;
	        default:
	            throw new Error(`Unsupported media type: ${mediaType}`);
	    }
	    const result = [];
	    try {
	        if (options.includeSource) {
	            result.push((0, makeSourceEnvelope_1.default)(data, uri));
	        }
	        if (!options.includeGherkinDocument && !options.includePickles) {
	            return result;
	        }
	        const parser = new Parser_1.default(new AstBuilder_1.default(options.newId), tokenMatcher);
	        parser.stopAtFirstError = false;
	        const gherkinDocument = parser.parse(data);
	        if (options.includeGherkinDocument) {
	            result.push({
	                gherkinDocument: { ...gherkinDocument, uri },
	            });
	        }
	        if (options.includePickles) {
	            const pickles = (0, compile_1.default)(gherkinDocument, uri, options.newId);
	            for (const pickle of pickles) {
	                result.push({
	                    pickle,
	                });
	            }
	        }
	    }
	    catch (err) {
	        const errors = err.errors || [err];
	        for (const error of errors) {
	            if (!error.location) {
	                // It wasn't a parser error - throw it (this is unexpected)
	                throw error;
	            }
	            result.push({
	                parseError: {
	                    source: {
	                        uri,
	                        location: {
	                            line: error.location.line,
	                            column: error.location.column,
	                        },
	                    },
	                    message: error.message,
	                },
	            });
	        }
	    }
	    return result;
	}
	
	return generateMessages;
}

var hasRequiredSrc;

function requireSrc () {
	if (hasRequiredSrc) return src$1;
	hasRequiredSrc = 1;
	var __createBinding = (src$1 && src$1.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (src$1 && src$1.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (src$1 && src$1.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __importDefault = (src$1 && src$1.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(src$1, "__esModule", { value: true });
	src$1.compile = src$1.GherkinInMarkdownTokenMatcher = src$1.GherkinClassicTokenMatcher = src$1.Errors = src$1.TokenScanner = src$1.AstBuilder = src$1.Parser = src$1.dialects = src$1.makeSourceEnvelope = src$1.generateMessages = void 0;
	const generateMessages_1 = __importDefault(requireGenerateMessages());
	src$1.generateMessages = generateMessages_1.default;
	const makeSourceEnvelope_1 = __importDefault(requireMakeSourceEnvelope());
	src$1.makeSourceEnvelope = makeSourceEnvelope_1.default;
	const Parser_1 = __importDefault(requireParser());
	src$1.Parser = Parser_1.default;
	const AstBuilder_1 = __importDefault(requireAstBuilder());
	src$1.AstBuilder = AstBuilder_1.default;
	const TokenScanner_1 = __importDefault(requireTokenScanner());
	src$1.TokenScanner = TokenScanner_1.default;
	const Errors = __importStar(requireErrors());
	src$1.Errors = Errors;
	const compile_1 = __importDefault(requireCompile());
	src$1.compile = compile_1.default;
	const gherkin_languages_json_1 = __importDefault(require$$7);
	const GherkinClassicTokenMatcher_1 = __importDefault(requireGherkinClassicTokenMatcher());
	src$1.GherkinClassicTokenMatcher = GherkinClassicTokenMatcher_1.default;
	const GherkinInMarkdownTokenMatcher_1 = __importDefault(requireGherkinInMarkdownTokenMatcher());
	src$1.GherkinInMarkdownTokenMatcher = GherkinInMarkdownTokenMatcher_1.default;
	const dialects = gherkin_languages_json_1.default;
	src$1.dialects = dialects;
	
	return src$1;
}

requireSrc();

require_Reflect();

var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
class Attachment {
    constructor() {
        this.body = '';
        this.contentEncoding = AttachmentContentEncoding.IDENTITY;
        this.mediaType = '';
    }
}
__decorate([
    Type(() => Source)
], Attachment.prototype, "source", void 0);
__decorate([
    Type(() => Timestamp)
], Attachment.prototype, "timestamp", void 0);
class Duration {
    constructor() {
        this.seconds = 0;
        this.nanos = 0;
    }
}
class Envelope {
}
__decorate([
    Type(() => Attachment)
], Envelope.prototype, "attachment", void 0);
__decorate([
    Type(() => GherkinDocument)
], Envelope.prototype, "gherkinDocument", void 0);
__decorate([
    Type(() => Hook)
], Envelope.prototype, "hook", void 0);
__decorate([
    Type(() => Meta)
], Envelope.prototype, "meta", void 0);
__decorate([
    Type(() => ParameterType)
], Envelope.prototype, "parameterType", void 0);
__decorate([
    Type(() => ParseError)
], Envelope.prototype, "parseError", void 0);
__decorate([
    Type(() => Pickle)
], Envelope.prototype, "pickle", void 0);
__decorate([
    Type(() => Suggestion)
], Envelope.prototype, "suggestion", void 0);
__decorate([
    Type(() => Source)
], Envelope.prototype, "source", void 0);
__decorate([
    Type(() => StepDefinition)
], Envelope.prototype, "stepDefinition", void 0);
__decorate([
    Type(() => TestCase)
], Envelope.prototype, "testCase", void 0);
__decorate([
    Type(() => TestCaseFinished)
], Envelope.prototype, "testCaseFinished", void 0);
__decorate([
    Type(() => TestCaseStarted)
], Envelope.prototype, "testCaseStarted", void 0);
__decorate([
    Type(() => TestRunFinished)
], Envelope.prototype, "testRunFinished", void 0);
__decorate([
    Type(() => TestRunStarted)
], Envelope.prototype, "testRunStarted", void 0);
__decorate([
    Type(() => TestStepFinished)
], Envelope.prototype, "testStepFinished", void 0);
__decorate([
    Type(() => TestStepStarted)
], Envelope.prototype, "testStepStarted", void 0);
__decorate([
    Type(() => TestRunHookStarted)
], Envelope.prototype, "testRunHookStarted", void 0);
__decorate([
    Type(() => TestRunHookFinished)
], Envelope.prototype, "testRunHookFinished", void 0);
__decorate([
    Type(() => UndefinedParameterType)
], Envelope.prototype, "undefinedParameterType", void 0);
class Exception {
    constructor() {
        this.type = '';
    }
}
class GherkinDocument {
    constructor() {
        this.comments = [];
    }
}
__decorate([
    Type(() => Feature)
], GherkinDocument.prototype, "feature", void 0);
__decorate([
    Type(() => Comment)
], GherkinDocument.prototype, "comments", void 0);
class Background {
    constructor() {
        this.location = new Location();
        this.keyword = '';
        this.name = '';
        this.description = '';
        this.steps = [];
        this.id = '';
    }
}
__decorate([
    Type(() => Location)
], Background.prototype, "location", void 0);
__decorate([
    Type(() => Step)
], Background.prototype, "steps", void 0);
class Comment {
    constructor() {
        this.location = new Location();
        this.text = '';
    }
}
__decorate([
    Type(() => Location)
], Comment.prototype, "location", void 0);
class DataTable {
    constructor() {
        this.location = new Location();
        this.rows = [];
    }
}
__decorate([
    Type(() => Location)
], DataTable.prototype, "location", void 0);
__decorate([
    Type(() => TableRow)
], DataTable.prototype, "rows", void 0);
class DocString {
    constructor() {
        this.location = new Location();
        this.content = '';
        this.delimiter = '';
    }
}
__decorate([
    Type(() => Location)
], DocString.prototype, "location", void 0);
class Examples {
    constructor() {
        this.location = new Location();
        this.tags = [];
        this.keyword = '';
        this.name = '';
        this.description = '';
        this.tableBody = [];
        this.id = '';
    }
}
__decorate([
    Type(() => Location)
], Examples.prototype, "location", void 0);
__decorate([
    Type(() => Tag)
], Examples.prototype, "tags", void 0);
__decorate([
    Type(() => TableRow)
], Examples.prototype, "tableHeader", void 0);
__decorate([
    Type(() => TableRow)
], Examples.prototype, "tableBody", void 0);
class Feature {
    constructor() {
        this.location = new Location();
        this.tags = [];
        this.language = '';
        this.keyword = '';
        this.name = '';
        this.description = '';
        this.children = [];
    }
}
__decorate([
    Type(() => Location)
], Feature.prototype, "location", void 0);
__decorate([
    Type(() => Tag)
], Feature.prototype, "tags", void 0);
__decorate([
    Type(() => FeatureChild)
], Feature.prototype, "children", void 0);
class FeatureChild {
}
__decorate([
    Type(() => Rule)
], FeatureChild.prototype, "rule", void 0);
__decorate([
    Type(() => Background)
], FeatureChild.prototype, "background", void 0);
__decorate([
    Type(() => Scenario)
], FeatureChild.prototype, "scenario", void 0);
class Rule {
    constructor() {
        this.location = new Location();
        this.tags = [];
        this.keyword = '';
        this.name = '';
        this.description = '';
        this.children = [];
        this.id = '';
    }
}
__decorate([
    Type(() => Location)
], Rule.prototype, "location", void 0);
__decorate([
    Type(() => Tag)
], Rule.prototype, "tags", void 0);
__decorate([
    Type(() => RuleChild)
], Rule.prototype, "children", void 0);
class RuleChild {
}
__decorate([
    Type(() => Background)
], RuleChild.prototype, "background", void 0);
__decorate([
    Type(() => Scenario)
], RuleChild.prototype, "scenario", void 0);
class Scenario {
    constructor() {
        this.location = new Location();
        this.tags = [];
        this.keyword = '';
        this.name = '';
        this.description = '';
        this.steps = [];
        this.examples = [];
        this.id = '';
    }
}
__decorate([
    Type(() => Location)
], Scenario.prototype, "location", void 0);
__decorate([
    Type(() => Tag)
], Scenario.prototype, "tags", void 0);
__decorate([
    Type(() => Step)
], Scenario.prototype, "steps", void 0);
__decorate([
    Type(() => Examples)
], Scenario.prototype, "examples", void 0);
class Step {
    constructor() {
        this.location = new Location();
        this.keyword = '';
        this.text = '';
        this.id = '';
    }
}
__decorate([
    Type(() => Location)
], Step.prototype, "location", void 0);
__decorate([
    Type(() => DocString)
], Step.prototype, "docString", void 0);
__decorate([
    Type(() => DataTable)
], Step.prototype, "dataTable", void 0);
class TableCell {
    constructor() {
        this.location = new Location();
        this.value = '';
    }
}
__decorate([
    Type(() => Location)
], TableCell.prototype, "location", void 0);
class TableRow {
    constructor() {
        this.location = new Location();
        this.cells = [];
        this.id = '';
    }
}
__decorate([
    Type(() => Location)
], TableRow.prototype, "location", void 0);
__decorate([
    Type(() => TableCell)
], TableRow.prototype, "cells", void 0);
class Tag {
    constructor() {
        this.location = new Location();
        this.name = '';
        this.id = '';
    }
}
__decorate([
    Type(() => Location)
], Tag.prototype, "location", void 0);
class Hook {
    constructor() {
        this.id = '';
        this.sourceReference = new SourceReference();
    }
}
__decorate([
    Type(() => SourceReference)
], Hook.prototype, "sourceReference", void 0);
class Location {
    constructor() {
        this.line = 0;
    }
}
class Meta {
    constructor() {
        this.protocolVersion = '';
        this.implementation = new Product();
        this.runtime = new Product();
        this.os = new Product();
        this.cpu = new Product();
    }
}
__decorate([
    Type(() => Product)
], Meta.prototype, "implementation", void 0);
__decorate([
    Type(() => Product)
], Meta.prototype, "runtime", void 0);
__decorate([
    Type(() => Product)
], Meta.prototype, "os", void 0);
__decorate([
    Type(() => Product)
], Meta.prototype, "cpu", void 0);
__decorate([
    Type(() => Ci)
], Meta.prototype, "ci", void 0);
class Ci {
    constructor() {
        this.name = '';
    }
}
__decorate([
    Type(() => Git)
], Ci.prototype, "git", void 0);
class Git {
    constructor() {
        this.remote = '';
        this.revision = '';
    }
}
class Product {
    constructor() {
        this.name = '';
    }
}
class ParameterType {
    constructor() {
        this.name = '';
        this.regularExpressions = [];
        this.preferForRegularExpressionMatch = false;
        this.useForSnippets = false;
        this.id = '';
    }
}
__decorate([
    Type(() => SourceReference)
], ParameterType.prototype, "sourceReference", void 0);
class ParseError {
    constructor() {
        this.source = new SourceReference();
        this.message = '';
    }
}
__decorate([
    Type(() => SourceReference)
], ParseError.prototype, "source", void 0);
class Pickle {
    constructor() {
        this.id = '';
        this.uri = '';
        this.name = '';
        this.language = '';
        this.steps = [];
        this.tags = [];
        this.astNodeIds = [];
    }
}
__decorate([
    Type(() => PickleStep)
], Pickle.prototype, "steps", void 0);
__decorate([
    Type(() => PickleTag)
], Pickle.prototype, "tags", void 0);
class PickleDocString {
    constructor() {
        this.content = '';
    }
}
class PickleStep {
    constructor() {
        this.astNodeIds = [];
        this.id = '';
        this.text = '';
    }
}
__decorate([
    Type(() => PickleStepArgument)
], PickleStep.prototype, "argument", void 0);
class PickleStepArgument {
}
__decorate([
    Type(() => PickleDocString)
], PickleStepArgument.prototype, "docString", void 0);
__decorate([
    Type(() => PickleTable)
], PickleStepArgument.prototype, "dataTable", void 0);
class PickleTable {
    constructor() {
        this.rows = [];
    }
}
__decorate([
    Type(() => PickleTableRow)
], PickleTable.prototype, "rows", void 0);
class PickleTableCell {
    constructor() {
        this.value = '';
    }
}
class PickleTableRow {
    constructor() {
        this.cells = [];
    }
}
__decorate([
    Type(() => PickleTableCell)
], PickleTableRow.prototype, "cells", void 0);
class PickleTag {
    constructor() {
        this.name = '';
        this.astNodeId = '';
    }
}
class Source {
    constructor() {
        this.uri = '';
        this.data = '';
        this.mediaType = SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN;
    }
}
class SourceReference {
}
__decorate([
    Type(() => JavaMethod)
], SourceReference.prototype, "javaMethod", void 0);
__decorate([
    Type(() => JavaStackTraceElement)
], SourceReference.prototype, "javaStackTraceElement", void 0);
__decorate([
    Type(() => Location)
], SourceReference.prototype, "location", void 0);
class JavaMethod {
    constructor() {
        this.className = '';
        this.methodName = '';
        this.methodParameterTypes = [];
    }
}
class JavaStackTraceElement {
    constructor() {
        this.className = '';
        this.fileName = '';
        this.methodName = '';
    }
}
class StepDefinition {
    constructor() {
        this.id = '';
        this.pattern = new StepDefinitionPattern();
        this.sourceReference = new SourceReference();
    }
}
__decorate([
    Type(() => StepDefinitionPattern)
], StepDefinition.prototype, "pattern", void 0);
__decorate([
    Type(() => SourceReference)
], StepDefinition.prototype, "sourceReference", void 0);
class StepDefinitionPattern {
    constructor() {
        this.source = '';
        this.type = StepDefinitionPatternType.CUCUMBER_EXPRESSION;
    }
}
class Suggestion {
    constructor() {
        this.id = '';
        this.pickleStepId = '';
        this.snippets = [];
    }
}
__decorate([
    Type(() => Snippet)
], Suggestion.prototype, "snippets", void 0);
class Snippet {
    constructor() {
        this.language = '';
        this.code = '';
    }
}
class TestCase {
    constructor() {
        this.id = '';
        this.pickleId = '';
        this.testSteps = [];
    }
}
__decorate([
    Type(() => TestStep)
], TestCase.prototype, "testSteps", void 0);
class Group {
    constructor() {
        this.children = [];
    }
}
__decorate([
    Type(() => Group)
], Group.prototype, "children", void 0);
class StepMatchArgument {
    constructor() {
        this.group = new Group();
    }
}
__decorate([
    Type(() => Group)
], StepMatchArgument.prototype, "group", void 0);
class StepMatchArgumentsList {
    constructor() {
        this.stepMatchArguments = [];
    }
}
__decorate([
    Type(() => StepMatchArgument)
], StepMatchArgumentsList.prototype, "stepMatchArguments", void 0);
class TestStep {
    constructor() {
        this.id = '';
    }
}
__decorate([
    Type(() => StepMatchArgumentsList)
], TestStep.prototype, "stepMatchArgumentsLists", void 0);
class TestCaseFinished {
    constructor() {
        this.testCaseStartedId = '';
        this.timestamp = new Timestamp();
        this.willBeRetried = false;
    }
}
__decorate([
    Type(() => Timestamp)
], TestCaseFinished.prototype, "timestamp", void 0);
class TestCaseStarted {
    constructor() {
        this.attempt = 0;
        this.id = '';
        this.testCaseId = '';
        this.timestamp = new Timestamp();
    }
}
__decorate([
    Type(() => Timestamp)
], TestCaseStarted.prototype, "timestamp", void 0);
class TestRunFinished {
    constructor() {
        this.success = false;
        this.timestamp = new Timestamp();
    }
}
__decorate([
    Type(() => Timestamp)
], TestRunFinished.prototype, "timestamp", void 0);
__decorate([
    Type(() => Exception)
], TestRunFinished.prototype, "exception", void 0);
class TestRunHookFinished {
    constructor() {
        this.testRunHookStartedId = '';
        this.result = new TestStepResult();
        this.timestamp = new Timestamp();
    }
}
__decorate([
    Type(() => TestStepResult)
], TestRunHookFinished.prototype, "result", void 0);
__decorate([
    Type(() => Timestamp)
], TestRunHookFinished.prototype, "timestamp", void 0);
class TestRunHookStarted {
    constructor() {
        this.id = '';
        this.testRunStartedId = '';
        this.hookId = '';
        this.timestamp = new Timestamp();
    }
}
__decorate([
    Type(() => Timestamp)
], TestRunHookStarted.prototype, "timestamp", void 0);
class TestRunStarted {
    constructor() {
        this.timestamp = new Timestamp();
    }
}
__decorate([
    Type(() => Timestamp)
], TestRunStarted.prototype, "timestamp", void 0);
class TestStepFinished {
    constructor() {
        this.testCaseStartedId = '';
        this.testStepId = '';
        this.testStepResult = new TestStepResult();
        this.timestamp = new Timestamp();
    }
}
__decorate([
    Type(() => TestStepResult)
], TestStepFinished.prototype, "testStepResult", void 0);
__decorate([
    Type(() => Timestamp)
], TestStepFinished.prototype, "timestamp", void 0);
class TestStepResult {
    constructor() {
        this.duration = new Duration();
        this.status = TestStepResultStatus.UNKNOWN;
    }
}
__decorate([
    Type(() => Duration)
], TestStepResult.prototype, "duration", void 0);
__decorate([
    Type(() => Exception)
], TestStepResult.prototype, "exception", void 0);
class TestStepStarted {
    constructor() {
        this.testCaseStartedId = '';
        this.testStepId = '';
        this.timestamp = new Timestamp();
    }
}
__decorate([
    Type(() => Timestamp)
], TestStepStarted.prototype, "timestamp", void 0);
class Timestamp {
    constructor() {
        this.seconds = 0;
        this.nanos = 0;
    }
}
class UndefinedParameterType {
    constructor() {
        this.expression = '';
        this.name = '';
    }
}
var AttachmentContentEncoding;
(function (AttachmentContentEncoding) {
    AttachmentContentEncoding["IDENTITY"] = "IDENTITY";
    AttachmentContentEncoding["BASE64"] = "BASE64";
})(AttachmentContentEncoding || (AttachmentContentEncoding = {}));
var HookType;
(function (HookType) {
    HookType["BEFORE_TEST_RUN"] = "BEFORE_TEST_RUN";
    HookType["AFTER_TEST_RUN"] = "AFTER_TEST_RUN";
    HookType["BEFORE_TEST_CASE"] = "BEFORE_TEST_CASE";
    HookType["AFTER_TEST_CASE"] = "AFTER_TEST_CASE";
    HookType["BEFORE_TEST_STEP"] = "BEFORE_TEST_STEP";
    HookType["AFTER_TEST_STEP"] = "AFTER_TEST_STEP";
})(HookType || (HookType = {}));
var PickleStepType;
(function (PickleStepType) {
    PickleStepType["UNKNOWN"] = "Unknown";
    PickleStepType["CONTEXT"] = "Context";
    PickleStepType["ACTION"] = "Action";
    PickleStepType["OUTCOME"] = "Outcome";
})(PickleStepType || (PickleStepType = {}));
var SourceMediaType;
(function (SourceMediaType) {
    SourceMediaType["TEXT_X_CUCUMBER_GHERKIN_PLAIN"] = "text/x.cucumber.gherkin+plain";
    SourceMediaType["TEXT_X_CUCUMBER_GHERKIN_MARKDOWN"] = "text/x.cucumber.gherkin+markdown";
})(SourceMediaType || (SourceMediaType = {}));
var StepDefinitionPatternType;
(function (StepDefinitionPatternType) {
    StepDefinitionPatternType["CUCUMBER_EXPRESSION"] = "CUCUMBER_EXPRESSION";
    StepDefinitionPatternType["REGULAR_EXPRESSION"] = "REGULAR_EXPRESSION";
})(StepDefinitionPatternType || (StepDefinitionPatternType = {}));
var StepKeywordType;
(function (StepKeywordType) {
    StepKeywordType["UNKNOWN"] = "Unknown";
    StepKeywordType["CONTEXT"] = "Context";
    StepKeywordType["ACTION"] = "Action";
    StepKeywordType["OUTCOME"] = "Outcome";
    StepKeywordType["CONJUNCTION"] = "Conjunction";
})(StepKeywordType || (StepKeywordType = {}));
var TestStepResultStatus;
(function (TestStepResultStatus) {
    TestStepResultStatus["UNKNOWN"] = "UNKNOWN";
    TestStepResultStatus["PASSED"] = "PASSED";
    TestStepResultStatus["SKIPPED"] = "SKIPPED";
    TestStepResultStatus["PENDING"] = "PENDING";
    TestStepResultStatus["UNDEFINED"] = "UNDEFINED";
    TestStepResultStatus["AMBIGUOUS"] = "AMBIGUOUS";
    TestStepResultStatus["FAILED"] = "FAILED";
})(TestStepResultStatus || (TestStepResultStatus = {}));

function makeFeature({ name, description, comments, background, steps }) {
  const lines = [`Feature: ${name ?? ""}`.trim(), ""];
  if (description) {
    lines.push(
      ...description.split("\n").map((s) => `  ${s.trim()}`),
      ""
    );
  }
  if (background && background.length > 0) {
    lines.push(
      "  Background:",
      ...background.map((s) => `    ${s}`),
      ""
    );
  }
  lines.push(
    "  Scenario:",
    ...steps.map((s) => `    ${s}`)
  );
  if (comments) {
    lines.push(
      "",
      ...comments.split("\n").map((s) => `  # ${s.trim()}`)
    );
  }
  return lines.join("\n") + "\n";
}

class JournalBatch {
  constructor(sink) {
    this.sink = sink;
  }
  entries = [];
  log(message, options) {
    if (message) {
      this.entries.push({
        timestamp: Date.now(),
        message,
        type: options.type,
        artifacts: options.artifacts ?? [],
        meta: options.meta ?? {}
      });
    }
    return this;
  }
  async flush() {
    await this.sink.publish(...this.entries);
  }
  debug(message, options = {}) {
    return this.log(message, { ...options, type: "debug" });
  }
  info(message, options = {}) {
    return this.log(message, { ...options, type: "info" });
  }
  title(message, options = {}) {
    return this.log(message, { ...options, type: "title" });
  }
  warn(message, options = {}) {
    return this.log(message, { ...options, type: "warn" });
  }
  error(message, options = {}) {
    return this.log(message, { ...options, type: "error" });
  }
  prepare(message, options = {}) {
    return this.log(message, { ...options, type: "prepare" });
  }
  success(message, options = {}) {
    return this.log(message, { ...options, type: "success" });
  }
  failure(message, options = {}) {
    return this.log(message, { ...options, type: "failure" });
  }
  each(items, fn) {
    for (const item of items) {
      fn(this, item);
    }
    return this;
  }
}

function asFilename(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function statusSymbol(status = void 0) {
  switch (status) {
    case "success":
      return "\u2713";
    case "failure":
      return "\u2718";
    default:
      return "\u25CB";
  }
}

/* globals WorkerGlobalScope, DedicatedWorkerGlobalScope, SharedWorkerGlobalScope, ServiceWorkerGlobalScope */

const isBrowser = globalThis.window?.document !== undefined;

globalThis.process?.versions?.node !== undefined;

globalThis.process?.versions?.bun !== undefined;

globalThis.Deno?.version?.deno !== undefined;

globalThis.process?.versions?.electron !== undefined;

globalThis.navigator?.userAgent?.includes('jsdom') === true;

typeof WorkerGlobalScope !== 'undefined' && globalThis instanceof WorkerGlobalScope;

typeof DedicatedWorkerGlobalScope !== 'undefined' && globalThis instanceof DedicatedWorkerGlobalScope;

typeof SharedWorkerGlobalScope !== 'undefined' && globalThis instanceof SharedWorkerGlobalScope;

typeof ServiceWorkerGlobalScope !== 'undefined' && globalThis instanceof ServiceWorkerGlobalScope;

// Note: I'm intentionally not DRYing up the other variables to keep them "lazy".
const platform = globalThis.navigator?.userAgentData?.platform;

platform === 'macOS'
	|| globalThis.navigator?.platform === 'MacIntel' // Even on Apple silicon Macs.
	|| globalThis.navigator?.userAgent?.includes(' Mac ') === true
	|| globalThis.process?.platform === 'darwin';

platform === 'Windows'
	|| globalThis.navigator?.platform === 'Win32'
	|| globalThis.process?.platform === 'win32';

platform === 'Linux'
	|| globalThis.navigator?.platform?.startsWith('Linux') === true
	|| globalThis.navigator?.userAgent?.includes(' Linux ') === true
	|| globalThis.process?.platform === 'linux';

platform === 'Android'
	|| globalThis.navigator?.platform === 'Android'
	|| globalThis.navigator?.userAgent?.includes(' Android ') === true
	|| globalThis.process?.platform === 'android';

const ESC = '\u001B[';

!isBrowser && process$1.env.TERM_PROGRAM === 'Apple_Terminal';
!isBrowser && process$1.platform === 'win32';

isBrowser ? () => {
	throw new Error('`process.cwd()` only works in Node.js, not the browser.');
} : process$1.cwd;

const cursorUp = (count = 1) => ESC + count + 'A';

const cursorLeft = ESC + 'G';
const eraseDown = ESC + 'J';

const ALIAS = Symbol.for('yaml.alias');
const DOC = Symbol.for('yaml.document');
const MAP = Symbol.for('yaml.map');
const PAIR = Symbol.for('yaml.pair');
const SCALAR$1 = Symbol.for('yaml.scalar');
const SEQ = Symbol.for('yaml.seq');
const NODE_TYPE = Symbol.for('yaml.node.type');
const isAlias = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === ALIAS;
const isDocument = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === DOC;
const isMap = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === MAP;
const isPair = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === PAIR;
const isScalar$1 = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === SCALAR$1;
const isSeq = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === SEQ;
function isCollection$1(node) {
    if (node && typeof node === 'object')
        switch (node[NODE_TYPE]) {
            case MAP:
            case SEQ:
                return true;
        }
    return false;
}
function isNode(node) {
    if (node && typeof node === 'object')
        switch (node[NODE_TYPE]) {
            case ALIAS:
            case MAP:
            case SCALAR$1:
            case SEQ:
                return true;
        }
    return false;
}
const hasAnchor = (node) => (isScalar$1(node) || isCollection$1(node)) && !!node.anchor;

const BREAK$1 = Symbol('break visit');
const SKIP$1 = Symbol('skip children');
const REMOVE$1 = Symbol('remove node');
/**
 * Apply a visitor to an AST node or document.
 *
 * Walks through the tree (depth-first) starting from `node`, calling a
 * `visitor` function with three arguments:
 *   - `key`: For sequence values and map `Pair`, the node's index in the
 *     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
 *     `null` for the root node.
 *   - `node`: The current node.
 *   - `path`: The ancestry of the current node.
 *
 * The return value of the visitor may be used to control the traversal:
 *   - `undefined` (default): Do nothing and continue
 *   - `visit.SKIP`: Do not visit the children of this node, continue with next
 *     sibling
 *   - `visit.BREAK`: Terminate traversal completely
 *   - `visit.REMOVE`: Remove the current node, then continue with the next one
 *   - `Node`: Replace the current node, then continue by visiting it
 *   - `number`: While iterating the items of a sequence or map, set the index
 *     of the next step. This is useful especially if the index of the current
 *     node has changed.
 *
 * If `visitor` is a single function, it will be called with all values
 * encountered in the tree, including e.g. `null` values. Alternatively,
 * separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
 * `Alias` and `Scalar` node. To define the same visitor function for more than
 * one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
 * and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
 * specific defined one will be used for each node.
 */
function visit$1(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE$1)
            node.contents = null;
    }
    else
        visit_(null, node, visitor_, Object.freeze([]));
}
// Without the `as symbol` casts, TS declares these in the `visit`
// namespace using `var`, but then complains about that because
// `unique symbol` must be `const`.
/** Terminate visit traversal completely */
visit$1.BREAK = BREAK$1;
/** Do not visit the children of the current node */
visit$1.SKIP = SKIP$1;
/** Remove the current node */
visit$1.REMOVE = REMOVE$1;
function visit_(key, node, visitor, path) {
    const ctrl = callVisitor(key, node, visitor, path);
    if (isNode(ctrl) || isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visit_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== 'symbol') {
        if (isCollection$1(node)) {
            path = Object.freeze(path.concat(node));
            for (let i = 0; i < node.items.length; ++i) {
                const ci = visit_(i, node.items[i], visitor, path);
                if (typeof ci === 'number')
                    i = ci - 1;
                else if (ci === BREAK$1)
                    return BREAK$1;
                else if (ci === REMOVE$1) {
                    node.items.splice(i, 1);
                    i -= 1;
                }
            }
        }
        else if (isPair(node)) {
            path = Object.freeze(path.concat(node));
            const ck = visit_('key', node.key, visitor, path);
            if (ck === BREAK$1)
                return BREAK$1;
            else if (ck === REMOVE$1)
                node.key = null;
            const cv = visit_('value', node.value, visitor, path);
            if (cv === BREAK$1)
                return BREAK$1;
            else if (cv === REMOVE$1)
                node.value = null;
        }
    }
    return ctrl;
}
/**
 * Apply an async visitor to an AST node or document.
 *
 * Walks through the tree (depth-first) starting from `node`, calling a
 * `visitor` function with three arguments:
 *   - `key`: For sequence values and map `Pair`, the node's index in the
 *     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
 *     `null` for the root node.
 *   - `node`: The current node.
 *   - `path`: The ancestry of the current node.
 *
 * The return value of the visitor may be used to control the traversal:
 *   - `Promise`: Must resolve to one of the following values
 *   - `undefined` (default): Do nothing and continue
 *   - `visit.SKIP`: Do not visit the children of this node, continue with next
 *     sibling
 *   - `visit.BREAK`: Terminate traversal completely
 *   - `visit.REMOVE`: Remove the current node, then continue with the next one
 *   - `Node`: Replace the current node, then continue by visiting it
 *   - `number`: While iterating the items of a sequence or map, set the index
 *     of the next step. This is useful especially if the index of the current
 *     node has changed.
 *
 * If `visitor` is a single function, it will be called with all values
 * encountered in the tree, including e.g. `null` values. Alternatively,
 * separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
 * `Alias` and `Scalar` node. To define the same visitor function for more than
 * one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
 * and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
 * specific defined one will be used for each node.
 */
async function visitAsync(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE$1)
            node.contents = null;
    }
    else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
}
// Without the `as symbol` casts, TS declares these in the `visit`
// namespace using `var`, but then complains about that because
// `unique symbol` must be `const`.
/** Terminate visit traversal completely */
visitAsync.BREAK = BREAK$1;
/** Do not visit the children of the current node */
visitAsync.SKIP = SKIP$1;
/** Remove the current node */
visitAsync.REMOVE = REMOVE$1;
async function visitAsync_(key, node, visitor, path) {
    const ctrl = await callVisitor(key, node, visitor, path);
    if (isNode(ctrl) || isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visitAsync_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== 'symbol') {
        if (isCollection$1(node)) {
            path = Object.freeze(path.concat(node));
            for (let i = 0; i < node.items.length; ++i) {
                const ci = await visitAsync_(i, node.items[i], visitor, path);
                if (typeof ci === 'number')
                    i = ci - 1;
                else if (ci === BREAK$1)
                    return BREAK$1;
                else if (ci === REMOVE$1) {
                    node.items.splice(i, 1);
                    i -= 1;
                }
            }
        }
        else if (isPair(node)) {
            path = Object.freeze(path.concat(node));
            const ck = await visitAsync_('key', node.key, visitor, path);
            if (ck === BREAK$1)
                return BREAK$1;
            else if (ck === REMOVE$1)
                node.key = null;
            const cv = await visitAsync_('value', node.value, visitor, path);
            if (cv === BREAK$1)
                return BREAK$1;
            else if (cv === REMOVE$1)
                node.value = null;
        }
    }
    return ctrl;
}
function initVisitor(visitor) {
    if (typeof visitor === 'object' &&
        (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
            Alias: visitor.Node,
            Map: visitor.Node,
            Scalar: visitor.Node,
            Seq: visitor.Node
        }, visitor.Value && {
            Map: visitor.Value,
            Scalar: visitor.Value,
            Seq: visitor.Value
        }, visitor.Collection && {
            Map: visitor.Collection,
            Seq: visitor.Collection
        }, visitor);
    }
    return visitor;
}
function callVisitor(key, node, visitor, path) {
    if (typeof visitor === 'function')
        return visitor(key, node, path);
    if (isMap(node))
        return visitor.Map?.(key, node, path);
    if (isSeq(node))
        return visitor.Seq?.(key, node, path);
    if (isPair(node))
        return visitor.Pair?.(key, node, path);
    if (isScalar$1(node))
        return visitor.Scalar?.(key, node, path);
    if (isAlias(node))
        return visitor.Alias?.(key, node, path);
    return undefined;
}
function replaceNode(key, path, node) {
    const parent = path[path.length - 1];
    if (isCollection$1(parent)) {
        parent.items[key] = node;
    }
    else if (isPair(parent)) {
        if (key === 'key')
            parent.key = node;
        else
            parent.value = node;
    }
    else if (isDocument(parent)) {
        parent.contents = node;
    }
    else {
        const pt = isAlias(parent) ? 'alias' : 'scalar';
        throw new Error(`Cannot replace node with ${pt} parent`);
    }
}

const escapeChars = {
    '!': '%21',
    ',': '%2C',
    '[': '%5B',
    ']': '%5D',
    '{': '%7B',
    '}': '%7D'
};
const escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, ch => escapeChars[ch]);
class Directives {
    constructor(yaml, tags) {
        /**
         * The directives-end/doc-start marker `---`. If `null`, a marker may still be
         * included in the document's stringified representation.
         */
        this.docStart = null;
        /** The doc-end marker `...`.  */
        this.docEnd = false;
        this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, Directives.defaultTags, tags);
    }
    clone() {
        const copy = new Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
    }
    /**
     * During parsing, get a Directives instance for the current document and
     * update the stream state according to the current version's spec.
     */
    atDocument() {
        const res = new Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
            case '1.1':
                this.atNextDocument = true;
                break;
            case '1.2':
                this.atNextDocument = false;
                this.yaml = {
                    explicit: Directives.defaultYaml.explicit,
                    version: '1.2'
                };
                this.tags = Object.assign({}, Directives.defaultTags);
                break;
        }
        return res;
    }
    /**
     * @param onError - May be called even if the action was successful
     * @returns `true` on success
     */
    add(line, onError) {
        if (this.atNextDocument) {
            this.yaml = { explicit: Directives.defaultYaml.explicit, version: '1.1' };
            this.tags = Object.assign({}, Directives.defaultTags);
            this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
            case '%TAG': {
                if (parts.length !== 2) {
                    onError(0, '%TAG directive should contain exactly two parts');
                    if (parts.length < 2)
                        return false;
                }
                const [handle, prefix] = parts;
                this.tags[handle] = prefix;
                return true;
            }
            case '%YAML': {
                this.yaml.explicit = true;
                if (parts.length !== 1) {
                    onError(0, '%YAML directive should contain exactly one part');
                    return false;
                }
                const [version] = parts;
                if (version === '1.1' || version === '1.2') {
                    this.yaml.version = version;
                    return true;
                }
                else {
                    const isValid = /^\d+\.\d+$/.test(version);
                    onError(6, `Unsupported YAML version ${version}`, isValid);
                    return false;
                }
            }
            default:
                onError(0, `Unknown directive ${name}`, true);
                return false;
        }
    }
    /**
     * Resolves a tag, matching handles to those defined in %TAG directives.
     *
     * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
     *   `'!local'` tag, or `null` if unresolvable.
     */
    tagName(source, onError) {
        if (source === '!')
            return '!'; // non-specific tag
        if (source[0] !== '!') {
            onError(`Not a valid tag: ${source}`);
            return null;
        }
        if (source[1] === '<') {
            const verbatim = source.slice(2, -1);
            if (verbatim === '!' || verbatim === '!!') {
                onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
                return null;
            }
            if (source[source.length - 1] !== '>')
                onError('Verbatim tags must end with a >');
            return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
            onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
            try {
                return prefix + decodeURIComponent(suffix);
            }
            catch (error) {
                onError(String(error));
                return null;
            }
        }
        if (handle === '!')
            return source; // local tag
        onError(`Could not resolve tag: ${source}`);
        return null;
    }
    /**
     * Given a fully resolved tag, returns its printable string form,
     * taking into account current tag prefixes and defaults.
     */
    tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
            if (tag.startsWith(prefix))
                return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === '!' ? tag : `!<${tag}>`;
    }
    toString(doc) {
        const lines = this.yaml.explicit
            ? [`%YAML ${this.yaml.version || '1.2'}`]
            : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && isNode(doc.contents)) {
            const tags = {};
            visit$1(doc.contents, (_key, node) => {
                if (isNode(node) && node.tag)
                    tags[node.tag] = true;
            });
            tagNames = Object.keys(tags);
        }
        else
            tagNames = [];
        for (const [handle, prefix] of tagEntries) {
            if (handle === '!!' && prefix === 'tag:yaml.org,2002:')
                continue;
            if (!doc || tagNames.some(tn => tn.startsWith(prefix)))
                lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join('\n');
    }
}
Directives.defaultYaml = { explicit: false, version: '1.2' };
Directives.defaultTags = { '!!': 'tag:yaml.org,2002:' };

/**
 * Verify that the input string is a valid anchor.
 *
 * Will throw on errors.
 */
function anchorIsValid(anchor) {
    if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
    }
    return true;
}
function anchorNames(root) {
    const anchors = new Set();
    visit$1(root, {
        Value(_key, node) {
            if (node.anchor)
                anchors.add(node.anchor);
        }
    });
    return anchors;
}
/** Find a new anchor name with the given `prefix` and a one-indexed suffix. */
function findNewAnchor(prefix, exclude) {
    for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
            return name;
    }
}
function createNodeAnchors(doc, prefix) {
    const aliasObjects = [];
    const sourceObjects = new Map();
    let prevAnchors = null;
    return {
        onAnchor: (source) => {
            aliasObjects.push(source);
            prevAnchors ?? (prevAnchors = anchorNames(doc));
            const anchor = findNewAnchor(prefix, prevAnchors);
            prevAnchors.add(anchor);
            return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
            for (const source of aliasObjects) {
                const ref = sourceObjects.get(source);
                if (typeof ref === 'object' &&
                    ref.anchor &&
                    (isScalar$1(ref.node) || isCollection$1(ref.node))) {
                    ref.node.anchor = ref.anchor;
                }
                else {
                    const error = new Error('Failed to resolve repeated object (this should not happen)');
                    error.source = source;
                    throw error;
                }
            }
        },
        sourceObjects
    };
}

/**
 * Applies the JSON.parse reviver algorithm as defined in the ECMA-262 spec,
 * in section 24.5.1.1 "Runtime Semantics: InternalizeJSONProperty" of the
 * 2021 edition: https://tc39.es/ecma262/#sec-json.parse
 *
 * Includes extensions for handling Map and Set objects.
 */
function applyReviver(reviver, obj, key, val) {
    if (val && typeof val === 'object') {
        if (Array.isArray(val)) {
            for (let i = 0, len = val.length; i < len; ++i) {
                const v0 = val[i];
                const v1 = applyReviver(reviver, val, String(i), v0);
                // eslint-disable-next-line @typescript-eslint/no-array-delete
                if (v1 === undefined)
                    delete val[i];
                else if (v1 !== v0)
                    val[i] = v1;
            }
        }
        else if (val instanceof Map) {
            for (const k of Array.from(val.keys())) {
                const v0 = val.get(k);
                const v1 = applyReviver(reviver, val, k, v0);
                if (v1 === undefined)
                    val.delete(k);
                else if (v1 !== v0)
                    val.set(k, v1);
            }
        }
        else if (val instanceof Set) {
            for (const v0 of Array.from(val)) {
                const v1 = applyReviver(reviver, val, v0, v0);
                if (v1 === undefined)
                    val.delete(v0);
                else if (v1 !== v0) {
                    val.delete(v0);
                    val.add(v1);
                }
            }
        }
        else {
            for (const [k, v0] of Object.entries(val)) {
                const v1 = applyReviver(reviver, val, k, v0);
                if (v1 === undefined)
                    delete val[k];
                else if (v1 !== v0)
                    val[k] = v1;
            }
        }
    }
    return reviver.call(obj, key, val);
}

/**
 * Recursively convert any node or its contents to native JavaScript
 *
 * @param value - The input value
 * @param arg - If `value` defines a `toJSON()` method, use this
 *   as its first argument
 * @param ctx - Conversion context, originally set in Document#toJS(). If
 *   `{ keep: true }` is not set, output should be suitable for JSON
 *   stringification.
 */
function toJS(value, arg, ctx) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
    if (value && typeof value.toJSON === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        if (!ctx || !hasAnchor(value))
            return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: undefined };
        ctx.anchors.set(value, data);
        ctx.onCreate = res => {
            data.res = res;
            delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
            ctx.onCreate(res);
        return res;
    }
    if (typeof value === 'bigint' && !ctx?.keep)
        return Number(value);
    return value;
}

class NodeBase {
    constructor(type) {
        Object.defineProperty(this, NODE_TYPE, { value: type });
    }
    /** Create a copy of this node.  */
    clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
            copy.range = this.range.slice();
        return copy;
    }
    /** A plain JavaScript representation of this node. */
    toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!isDocument(doc))
            throw new TypeError('A document argument is required');
        const ctx = {
            anchors: new Map(),
            doc,
            keep: true,
            mapAsMap: mapAsMap === true,
            mapKeyWarned: false,
            maxAliasCount: typeof maxAliasCount === 'number' ? maxAliasCount : 100
        };
        const res = toJS(this, '', ctx);
        if (typeof onAnchor === 'function')
            for (const { count, res } of ctx.anchors.values())
                onAnchor(res, count);
        return typeof reviver === 'function'
            ? applyReviver(reviver, { '': res }, '', res)
            : res;
    }
}

class Alias extends NodeBase {
    constructor(source) {
        super(ALIAS);
        this.source = source;
        Object.defineProperty(this, 'tag', {
            set() {
                throw new Error('Alias nodes cannot have tags');
            }
        });
    }
    /**
     * Resolve the value of this alias within `doc`, finding the last
     * instance of the `source` anchor before this node.
     */
    resolve(doc, ctx) {
        let nodes;
        if (ctx?.aliasResolveCache) {
            nodes = ctx.aliasResolveCache;
        }
        else {
            nodes = [];
            visit$1(doc, {
                Node: (_key, node) => {
                    if (isAlias(node) || hasAnchor(node))
                        nodes.push(node);
                }
            });
            if (ctx)
                ctx.aliasResolveCache = nodes;
        }
        let found = undefined;
        for (const node of nodes) {
            if (node === this)
                break;
            if (node.anchor === this.source)
                found = node;
        }
        return found;
    }
    toJSON(_arg, ctx) {
        if (!ctx)
            return { source: this.source };
        const { anchors, doc, maxAliasCount } = ctx;
        const source = this.resolve(doc, ctx);
        if (!source) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new ReferenceError(msg);
        }
        let data = anchors.get(source);
        if (!data) {
            // Resolve anchors for Node.prototype.toJS()
            toJS(source, null, ctx);
            data = anchors.get(source);
        }
        /* istanbul ignore if */
        if (!data || data.res === undefined) {
            const msg = 'This should not happen: Alias anchor was not resolved?';
            throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
            data.count += 1;
            if (data.aliasCount === 0)
                data.aliasCount = getAliasCount(doc, source, anchors);
            if (data.count * data.aliasCount > maxAliasCount) {
                const msg = 'Excessive alias count indicates a resource exhaustion attack';
                throw new ReferenceError(msg);
            }
        }
        return data.res;
    }
    toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
            anchorIsValid(this.source);
            if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
                const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
                throw new Error(msg);
            }
            if (ctx.implicitKey)
                return `${src} `;
        }
        return src;
    }
}
function getAliasCount(doc, node, anchors) {
    if (isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors && source && anchors.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
    }
    else if (isCollection$1(node)) {
        let count = 0;
        for (const item of node.items) {
            const c = getAliasCount(doc, item, anchors);
            if (c > count)
                count = c;
        }
        return count;
    }
    else if (isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors);
        const vc = getAliasCount(doc, node.value, anchors);
        return Math.max(kc, vc);
    }
    return 1;
}

const isScalarValue = (value) => !value || (typeof value !== 'function' && typeof value !== 'object');
class Scalar extends NodeBase {
    constructor(value) {
        super(SCALAR$1);
        this.value = value;
    }
    toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS(this.value, arg, ctx);
    }
    toString() {
        return String(this.value);
    }
}
Scalar.BLOCK_FOLDED = 'BLOCK_FOLDED';
Scalar.BLOCK_LITERAL = 'BLOCK_LITERAL';
Scalar.PLAIN = 'PLAIN';
Scalar.QUOTE_DOUBLE = 'QUOTE_DOUBLE';
Scalar.QUOTE_SINGLE = 'QUOTE_SINGLE';

const defaultTagPrefix = 'tag:yaml.org,2002:';
function findTagObject(value, tagName, tags) {
    if (tagName) {
        const match = tags.filter(t => t.tag === tagName);
        const tagObj = match.find(t => !t.format) ?? match[0];
        if (!tagObj)
            throw new Error(`Tag ${tagName} not found`);
        return tagObj;
    }
    return tags.find(t => t.identify?.(value) && !t.format);
}
function createNode(value, tagName, ctx) {
    if (isDocument(value))
        value = value.contents;
    if (isNode(value))
        return value;
    if (isPair(value)) {
        const map = ctx.schema[MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
    }
    if (value instanceof String ||
        value instanceof Number ||
        value instanceof Boolean ||
        (typeof BigInt !== 'undefined' && value instanceof BigInt) // not supported everywhere
    ) {
        // https://tc39.es/ecma262/#sec-serializejsonproperty
        value = value.valueOf();
    }
    const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
    // Detect duplicate references to the same object & use Alias nodes for all
    // after first. The `ref` wrapper allows for circular references to resolve.
    let ref = undefined;
    if (aliasDuplicateObjects && value && typeof value === 'object') {
        ref = sourceObjects.get(value);
        if (ref) {
            ref.anchor ?? (ref.anchor = onAnchor(value));
            return new Alias(ref.anchor);
        }
        else {
            ref = { anchor: null, node: null };
            sourceObjects.set(value, ref);
        }
    }
    if (tagName?.startsWith('!!'))
        tagName = defaultTagPrefix + tagName.slice(2);
    let tagObj = findTagObject(value, tagName, schema.tags);
    if (!tagObj) {
        if (value && typeof value.toJSON === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            value = value.toJSON();
        }
        if (!value || typeof value !== 'object') {
            const node = new Scalar(value);
            if (ref)
                ref.node = node;
            return node;
        }
        tagObj =
            value instanceof Map
                ? schema[MAP]
                : Symbol.iterator in Object(value)
                    ? schema[SEQ]
                    : schema[MAP];
    }
    if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
    }
    const node = tagObj?.createNode
        ? tagObj.createNode(ctx.schema, value, ctx)
        : typeof tagObj?.nodeClass?.from === 'function'
            ? tagObj.nodeClass.from(ctx.schema, value, ctx)
            : new Scalar(value);
    if (tagName)
        node.tag = tagName;
    else if (!tagObj.default)
        node.tag = tagObj.tag;
    if (ref)
        ref.node = node;
    return node;
}

function collectionFromPath(schema, path, value) {
    let v = value;
    for (let i = path.length - 1; i >= 0; --i) {
        const k = path[i];
        if (typeof k === 'number' && Number.isInteger(k) && k >= 0) {
            const a = [];
            a[k] = v;
            v = a;
        }
        else {
            v = new Map([[k, v]]);
        }
    }
    return createNode(v, undefined, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
            throw new Error('This should not happen, please report a bug.');
        },
        schema,
        sourceObjects: new Map()
    });
}
// Type guard is intentionally a little wrong so as to be more useful,
// as it does not cover untypable empty non-string iterables (e.g. []).
const isEmptyPath = (path) => path == null ||
    (typeof path === 'object' && !!path[Symbol.iterator]().next().done);
class Collection extends NodeBase {
    constructor(type, schema) {
        super(type);
        Object.defineProperty(this, 'schema', {
            value: schema,
            configurable: true,
            enumerable: false,
            writable: true
        });
    }
    /**
     * Create a copy of this collection.
     *
     * @param schema - If defined, overwrites the original's schema
     */
    clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
            copy.schema = schema;
        copy.items = copy.items.map(it => isNode(it) || isPair(it) ? it.clone(schema) : it);
        if (this.range)
            copy.range = this.range.slice();
        return copy;
    }
    /**
     * Adds a value to the collection. For `!!map` and `!!omap` the value must
     * be a Pair instance or a `{ key, value }` object, which may not have a key
     * that already exists in the map.
     */
    addIn(path, value) {
        if (isEmptyPath(path))
            this.add(value);
        else {
            const [key, ...rest] = path;
            const node = this.get(key, true);
            if (isCollection$1(node))
                node.addIn(rest, value);
            else if (node === undefined && this.schema)
                this.set(key, collectionFromPath(this.schema, rest, value));
            else
                throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
    }
    /**
     * Removes a value from the collection.
     * @returns `true` if the item was found and removed.
     */
    deleteIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
            return this.delete(key);
        const node = this.get(key, true);
        if (isCollection$1(node))
            return node.deleteIn(rest);
        else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
    /**
     * Returns item at `key`, or `undefined` if not found. By default unwraps
     * scalar values from their surrounding node; to disable set `keepScalar` to
     * `true` (collections are always returned intact).
     */
    getIn(path, keepScalar) {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (rest.length === 0)
            return !keepScalar && isScalar$1(node) ? node.value : node;
        else
            return isCollection$1(node) ? node.getIn(rest, keepScalar) : undefined;
    }
    hasAllNullValues(allowScalar) {
        return this.items.every(node => {
            if (!isPair(node))
                return false;
            const n = node.value;
            return (n == null ||
                (allowScalar &&
                    isScalar$1(n) &&
                    n.value == null &&
                    !n.commentBefore &&
                    !n.comment &&
                    !n.tag));
        });
    }
    /**
     * Checks if the collection includes a value with the key `key`.
     */
    hasIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
            return this.has(key);
        const node = this.get(key, true);
        return isCollection$1(node) ? node.hasIn(rest) : false;
    }
    /**
     * Sets a value in this collection. For `!!set`, `value` needs to be a
     * boolean to add/remove the item from the set.
     */
    setIn(path, value) {
        const [key, ...rest] = path;
        if (rest.length === 0) {
            this.set(key, value);
        }
        else {
            const node = this.get(key, true);
            if (isCollection$1(node))
                node.setIn(rest, value);
            else if (node === undefined && this.schema)
                this.set(key, collectionFromPath(this.schema, rest, value));
            else
                throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
    }
}

/**
 * Stringifies a comment.
 *
 * Empty comment lines are left empty,
 * lines consisting of a single space are replaced by `#`,
 * and all other lines are prefixed with a `#`.
 */
const stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, '#');
function indentComment(comment, indent) {
    if (/^\n+$/.test(comment))
        return comment.substring(1);
    return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
}
const lineComment = (str, indent, comment) => str.endsWith('\n')
    ? indentComment(comment, indent)
    : comment.includes('\n')
        ? '\n' + indentComment(comment, indent)
        : (str.endsWith(' ') ? '' : ' ') + comment;

const FOLD_FLOW = 'flow';
const FOLD_BLOCK = 'block';
const FOLD_QUOTED = 'quoted';
/**
 * Tries to keep input at up to `lineWidth` characters, splitting only on spaces
 * not followed by newlines or spaces unless `mode` is `'quoted'`. Lines are
 * terminated with `\n` and started with `indent`.
 */
function foldFlowLines(text, indent, mode = 'flow', { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
    if (!lineWidth || lineWidth < 0)
        return text;
    if (lineWidth < minContentWidth)
        minContentWidth = 0;
    const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
    if (text.length <= endStep)
        return text;
    const folds = [];
    const escapedFolds = {};
    let end = lineWidth - indent.length;
    if (typeof indentAtStart === 'number') {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
            folds.push(0);
        else
            end = lineWidth - indentAtStart;
    }
    let split = undefined;
    let prev = undefined;
    let overflow = false;
    let i = -1;
    let escStart = -1;
    let escEnd = -1;
    if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
            end = i + endStep;
    }
    for (let ch; (ch = text[(i += 1)]);) {
        if (mode === FOLD_QUOTED && ch === '\\') {
            escStart = i;
            switch (text[i + 1]) {
                case 'x':
                    i += 3;
                    break;
                case 'u':
                    i += 5;
                    break;
                case 'U':
                    i += 9;
                    break;
                default:
                    i += 1;
            }
            escEnd = i;
        }
        if (ch === '\n') {
            if (mode === FOLD_BLOCK)
                i = consumeMoreIndentedLines(text, i, indent.length);
            end = i + indent.length + endStep;
            split = undefined;
        }
        else {
            if (ch === ' ' &&
                prev &&
                prev !== ' ' &&
                prev !== '\n' &&
                prev !== '\t') {
                // space surrounded by non-space can be replaced with newline + indent
                const next = text[i + 1];
                if (next && next !== ' ' && next !== '\n' && next !== '\t')
                    split = i;
            }
            if (i >= end) {
                if (split) {
                    folds.push(split);
                    end = split + endStep;
                    split = undefined;
                }
                else if (mode === FOLD_QUOTED) {
                    // white-space collected at end may stretch past lineWidth
                    while (prev === ' ' || prev === '\t') {
                        prev = ch;
                        ch = text[(i += 1)];
                        overflow = true;
                    }
                    // Account for newline escape, but don't break preceding escape
                    const j = i > escEnd + 1 ? i - 2 : escStart - 1;
                    // Bail out if lineWidth & minContentWidth are shorter than an escape string
                    if (escapedFolds[j])
                        return text;
                    folds.push(j);
                    escapedFolds[j] = true;
                    end = j + endStep;
                    split = undefined;
                }
                else {
                    overflow = true;
                }
            }
        }
        prev = ch;
    }
    if (overflow && onOverflow)
        onOverflow();
    if (folds.length === 0)
        return text;
    if (onFold)
        onFold();
    let res = text.slice(0, folds[0]);
    for (let i = 0; i < folds.length; ++i) {
        const fold = folds[i];
        const end = folds[i + 1] || text.length;
        if (fold === 0)
            res = `\n${indent}${text.slice(0, end)}`;
        else {
            if (mode === FOLD_QUOTED && escapedFolds[fold])
                res += `${text[fold]}\\`;
            res += `\n${indent}${text.slice(fold + 1, end)}`;
        }
    }
    return res;
}
/**
 * Presumes `i + 1` is at the start of a line
 * @returns index of last newline in more-indented block
 */
function consumeMoreIndentedLines(text, i, indent) {
    let end = i;
    let start = i + 1;
    let ch = text[start];
    while (ch === ' ' || ch === '\t') {
        if (i < start + indent) {
            ch = text[++i];
        }
        else {
            do {
                ch = text[++i];
            } while (ch && ch !== '\n');
            end = i;
            start = i + 1;
            ch = text[start];
        }
    }
    return end;
}

const getFoldOptions = (ctx, isBlock) => ({
    indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
    lineWidth: ctx.options.lineWidth,
    minContentWidth: ctx.options.minContentWidth
});
// Also checks for lines starting with %, as parsing the output as YAML 1.1 will
// presume that's starting a new document.
const containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
function lineLengthOverLimit(str, lineWidth, indentLength) {
    if (!lineWidth || lineWidth < 0)
        return false;
    const limit = lineWidth - indentLength;
    const strLen = str.length;
    if (strLen <= limit)
        return false;
    for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === '\n') {
            if (i - start > limit)
                return true;
            start = i + 1;
            if (strLen - start <= limit)
                return false;
        }
    }
    return true;
}
function doubleQuotedString(value, ctx) {
    const json = JSON.stringify(value);
    if (ctx.options.doubleQuotedAsJSON)
        return json;
    const { implicitKey } = ctx;
    const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
    const indent = ctx.indent || (containsDocumentMarker(value) ? '  ' : '');
    let str = '';
    let start = 0;
    for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === ' ' && json[i + 1] === '\\' && json[i + 2] === 'n') {
            // space before newline needs to be escaped to not be folded
            str += json.slice(start, i) + '\\ ';
            i += 1;
            start = i;
            ch = '\\';
        }
        if (ch === '\\')
            switch (json[i + 1]) {
                case 'u':
                    {
                        str += json.slice(start, i);
                        const code = json.substr(i + 2, 4);
                        switch (code) {
                            case '0000':
                                str += '\\0';
                                break;
                            case '0007':
                                str += '\\a';
                                break;
                            case '000b':
                                str += '\\v';
                                break;
                            case '001b':
                                str += '\\e';
                                break;
                            case '0085':
                                str += '\\N';
                                break;
                            case '00a0':
                                str += '\\_';
                                break;
                            case '2028':
                                str += '\\L';
                                break;
                            case '2029':
                                str += '\\P';
                                break;
                            default:
                                if (code.substr(0, 2) === '00')
                                    str += '\\x' + code.substr(2);
                                else
                                    str += json.substr(i, 6);
                        }
                        i += 5;
                        start = i + 1;
                    }
                    break;
                case 'n':
                    if (implicitKey ||
                        json[i + 2] === '"' ||
                        json.length < minMultiLineLength) {
                        i += 1;
                    }
                    else {
                        // folding will eat first newline
                        str += json.slice(start, i) + '\n\n';
                        while (json[i + 2] === '\\' &&
                            json[i + 3] === 'n' &&
                            json[i + 4] !== '"') {
                            str += '\n';
                            i += 2;
                        }
                        str += indent;
                        // space after newline needs to be escaped to not be folded
                        if (json[i + 2] === ' ')
                            str += '\\';
                        i += 1;
                        start = i + 1;
                    }
                    break;
                default:
                    i += 1;
            }
    }
    str = start ? str + json.slice(start) : json;
    return implicitKey
        ? str
        : foldFlowLines(str, indent, FOLD_QUOTED, getFoldOptions(ctx, false));
}
function singleQuotedString(value, ctx) {
    if (ctx.options.singleQuote === false ||
        (ctx.implicitKey && value.includes('\n')) ||
        /[ \t]\n|\n[ \t]/.test(value) // single quoted string can't have leading or trailing whitespace around newline
    )
        return doubleQuotedString(value, ctx);
    const indent = ctx.indent || (containsDocumentMarker(value) ? '  ' : '');
    const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&\n${indent}`) + "'";
    return ctx.implicitKey
        ? res
        : foldFlowLines(res, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function quotedString(value, ctx) {
    const { singleQuote } = ctx.options;
    let qs;
    if (singleQuote === false)
        qs = doubleQuotedString;
    else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
            qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
            qs = doubleQuotedString;
        else
            qs = singleQuote ? singleQuotedString : doubleQuotedString;
    }
    return qs(value, ctx);
}
// The negative lookbehind avoids a polynomial search,
// but isn't supported yet on Safari: https://caniuse.com/js-regexp-lookbehind
let blockEndNewlines;
try {
    blockEndNewlines = new RegExp('(^|(?<!\n))\n+(?!\n|$)', 'g');
}
catch {
    blockEndNewlines = /\n+(?!\n|$)/g;
}
function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
    const { blockQuote, commentString, lineWidth } = ctx.options;
    // 1. Block can't end in whitespace unless the last line is non-empty.
    // 2. Strings consisting of only whitespace are best rendered explicitly.
    if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
    }
    const indent = ctx.indent ||
        (ctx.forceBlockIndent || containsDocumentMarker(value) ? '  ' : '');
    const literal = blockQuote === 'literal'
        ? true
        : blockQuote === 'folded' || type === Scalar.BLOCK_FOLDED
            ? false
            : type === Scalar.BLOCK_LITERAL
                ? true
                : !lineLengthOverLimit(value, lineWidth, indent.length);
    if (!value)
        return literal ? '|\n' : '>\n';
    // determine chomping from whitespace at value end
    let chomp;
    let endStart;
    for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== '\n' && ch !== '\t' && ch !== ' ')
            break;
    }
    let end = value.substring(endStart);
    const endNlPos = end.indexOf('\n');
    if (endNlPos === -1) {
        chomp = '-'; // strip
    }
    else if (value === end || endNlPos !== end.length - 1) {
        chomp = '+'; // keep
        if (onChompKeep)
            onChompKeep();
    }
    else {
        chomp = ''; // clip
    }
    if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === '\n')
            end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
    }
    // determine indent indicator from whitespace at value start
    let startWithSpace = false;
    let startEnd;
    let startNlPos = -1;
    for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === ' ')
            startWithSpace = true;
        else if (ch === '\n')
            startNlPos = startEnd;
        else
            break;
    }
    let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
    if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
    }
    const indentSize = indent ? '2' : '1'; // root is at -1
    // Leading | or > is added later
    let header = (startWithSpace ? indentSize : '') + chomp;
    if (comment) {
        header += ' ' + commentString(comment.replace(/ ?[\r\n]+/g, ' '));
        if (onComment)
            onComment();
    }
    if (!literal) {
        const foldedValue = value
            .replace(/\n+/g, '\n$&')
            .replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, '$1$2') // more-indented lines aren't folded
            //                ^ more-ind. ^ empty     ^ capture next empty lines only at end of indent
            .replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== 'folded' && type !== Scalar.BLOCK_FOLDED) {
            foldOptions.onOverflow = () => {
                literalFallback = true;
            };
        }
        const body = foldFlowLines(`${start}${foldedValue}${end}`, indent, FOLD_BLOCK, foldOptions);
        if (!literalFallback)
            return `>${header}\n${indent}${body}`;
    }
    value = value.replace(/\n+/g, `$&${indent}`);
    return `|${header}\n${indent}${start}${value}${end}`;
}
function plainString(item, ctx, onComment, onChompKeep) {
    const { type, value } = item;
    const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
    if ((implicitKey && value.includes('\n')) ||
        (inFlow && /[[\]{},]/.test(value))) {
        return quotedString(value, ctx);
    }
    if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        // not allowed:
        // - '-' or '?'
        // - start with an indicator character (except [?:-]) or /[?-] /
        // - '\n ', ': ' or ' \n' anywhere
        // - '#' not preceded by a non-space char
        // - end with ' ' or ':'
        return implicitKey || inFlow || !value.includes('\n')
            ? quotedString(value, ctx)
            : blockString(item, ctx, onComment, onChompKeep);
    }
    if (!implicitKey &&
        !inFlow &&
        type !== Scalar.PLAIN &&
        value.includes('\n')) {
        // Where allowed & type not set explicitly, prefer block style for multiline strings
        return blockString(item, ctx, onComment, onChompKeep);
    }
    if (containsDocumentMarker(value)) {
        if (indent === '') {
            ctx.forceBlockIndent = true;
            return blockString(item, ctx, onComment, onChompKeep);
        }
        else if (implicitKey && indent === indentStep) {
            return quotedString(value, ctx);
        }
    }
    const str = value.replace(/\n+/g, `$&\n${indent}`);
    // Verify that output will be parsed as a string, as e.g. plain numbers and
    // booleans get parsed with those types in v1.2 (e.g. '42', 'true' & '0.9e-3'),
    // and others in v1.1.
    if (actualString) {
        const test = (tag) => tag.default && tag.tag !== 'tag:yaml.org,2002:str' && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
            return quotedString(value, ctx);
    }
    return implicitKey
        ? str
        : foldFlowLines(str, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function stringifyString(item, ctx, onComment, onChompKeep) {
    const { implicitKey, inFlow } = ctx;
    const ss = typeof item.value === 'string'
        ? item
        : Object.assign({}, item, { value: String(item.value) });
    let { type } = item;
    if (type !== Scalar.QUOTE_DOUBLE) {
        // force double quotes on control characters & unpaired surrogates
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
            type = Scalar.QUOTE_DOUBLE;
    }
    const _stringify = (_type) => {
        switch (_type) {
            case Scalar.BLOCK_FOLDED:
            case Scalar.BLOCK_LITERAL:
                return implicitKey || inFlow
                    ? quotedString(ss.value, ctx) // blocks are not valid inside flow containers
                    : blockString(ss, ctx, onComment, onChompKeep);
            case Scalar.QUOTE_DOUBLE:
                return doubleQuotedString(ss.value, ctx);
            case Scalar.QUOTE_SINGLE:
                return singleQuotedString(ss.value, ctx);
            case Scalar.PLAIN:
                return plainString(ss, ctx, onComment, onChompKeep);
            default:
                return null;
        }
    };
    let res = _stringify(type);
    if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = (implicitKey && defaultKeyType) || defaultStringType;
        res = _stringify(t);
        if (res === null)
            throw new Error(`Unsupported default string type ${t}`);
    }
    return res;
}

function createStringifyContext(doc, options) {
    const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment,
        defaultKeyType: null,
        defaultStringType: 'PLAIN',
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: 'false',
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: 'null',
        simpleKeys: false,
        singleQuote: null,
        trueStr: 'true',
        verifyAliasOrder: true
    }, doc.schema.toStringOptions, options);
    let inFlow;
    switch (opt.collectionStyle) {
        case 'block':
            inFlow = false;
            break;
        case 'flow':
            inFlow = true;
            break;
        default:
            inFlow = null;
    }
    return {
        anchors: new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? ' ' : '',
        indent: '',
        indentStep: typeof opt.indent === 'number' ? ' '.repeat(opt.indent) : '  ',
        inFlow,
        options: opt
    };
}
function getTagObject(tags, item) {
    if (item.tag) {
        const match = tags.filter(t => t.tag === item.tag);
        if (match.length > 0)
            return match.find(t => t.format === item.format) ?? match[0];
    }
    let tagObj = undefined;
    let obj;
    if (isScalar$1(item)) {
        obj = item.value;
        let match = tags.filter(t => t.identify?.(obj));
        if (match.length > 1) {
            const testMatch = match.filter(t => t.test);
            if (testMatch.length > 0)
                match = testMatch;
        }
        tagObj =
            match.find(t => t.format === item.format) ?? match.find(t => !t.format);
    }
    else {
        obj = item;
        tagObj = tags.find(t => t.nodeClass && obj instanceof t.nodeClass);
    }
    if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? 'null' : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
    }
    return tagObj;
}
// needs to be called before value stringifier to allow for circular anchor refs
function stringifyProps(node, tagObj, { anchors, doc }) {
    if (!doc.directives)
        return '';
    const props = [];
    const anchor = (isScalar$1(node) || isCollection$1(node)) && node.anchor;
    if (anchor && anchorIsValid(anchor)) {
        anchors.add(anchor);
        props.push(`&${anchor}`);
    }
    const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
    if (tag)
        props.push(doc.directives.tagString(tag));
    return props.join(' ');
}
function stringify$2(item, ctx, onComment, onChompKeep) {
    if (isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
    if (isAlias(item)) {
        if (ctx.doc.directives)
            return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
            throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        }
        else {
            if (ctx.resolvedAliases)
                ctx.resolvedAliases.add(item);
            else
                ctx.resolvedAliases = new Set([item]);
            item = item.resolve(ctx.doc);
        }
    }
    let tagObj = undefined;
    const node = isNode(item)
        ? item
        : ctx.doc.createNode(item, { onTagObj: o => (tagObj = o) });
    tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
    const props = stringifyProps(node, tagObj, ctx);
    if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
    const str = typeof tagObj.stringify === 'function'
        ? tagObj.stringify(node, ctx, onComment, onChompKeep)
        : isScalar$1(node)
            ? stringifyString(node, ctx, onComment, onChompKeep)
            : node.toString(ctx, onComment, onChompKeep);
    if (!props)
        return str;
    return isScalar$1(node) || str[0] === '{' || str[0] === '['
        ? `${props} ${str}`
        : `${props}\n${ctx.indent}${str}`;
}

function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
    const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
    let keyComment = (isNode(key) && key.comment) || null;
    if (simpleKeys) {
        if (keyComment) {
            throw new Error('With simple keys, key nodes cannot have comments');
        }
        if (isCollection$1(key) || (!isNode(key) && typeof key === 'object')) {
            const msg = 'With simple keys, collection cannot be used as a key value';
            throw new Error(msg);
        }
    }
    let explicitKey = !simpleKeys &&
        (!key ||
            (keyComment && value == null && !ctx.inFlow) ||
            isCollection$1(key) ||
            (isScalar$1(key)
                ? key.type === Scalar.BLOCK_FOLDED || key.type === Scalar.BLOCK_LITERAL
                : typeof key === 'object'));
    ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
    });
    let keyCommentDone = false;
    let chompKeep = false;
    let str = stringify$2(key, ctx, () => (keyCommentDone = true), () => (chompKeep = true));
    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
            throw new Error('With simple keys, single line scalar must not span more than 1024 characters');
        explicitKey = true;
    }
    if (ctx.inFlow) {
        if (allNullValues || value == null) {
            if (keyCommentDone && onComment)
                onComment();
            return str === '' ? '?' : explicitKey ? `? ${str}` : str;
        }
    }
    else if ((allNullValues && !simpleKeys) || (value == null && explicitKey)) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
            str += lineComment(str, ctx.indent, commentString(keyComment));
        }
        else if (chompKeep && onChompKeep)
            onChompKeep();
        return str;
    }
    if (keyCommentDone)
        keyComment = null;
    if (explicitKey) {
        if (keyComment)
            str += lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}\n${indent}:`;
    }
    else {
        str = `${str}:`;
        if (keyComment)
            str += lineComment(str, ctx.indent, commentString(keyComment));
    }
    let vsb, vcb, valueComment;
    if (isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
    }
    else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === 'object')
            value = doc.createNode(value);
    }
    ctx.implicitKey = false;
    if (!explicitKey && !keyComment && isScalar$1(value))
        ctx.indentAtStart = str.length + 1;
    chompKeep = false;
    if (!indentSeq &&
        indentStep.length >= 2 &&
        !ctx.inFlow &&
        !explicitKey &&
        isSeq(value) &&
        !value.flow &&
        !value.tag &&
        !value.anchor) {
        // If indentSeq === false, consider '- ' as part of indentation where possible
        ctx.indent = ctx.indent.substring(2);
    }
    let valueCommentDone = false;
    const valueStr = stringify$2(value, ctx, () => (valueCommentDone = true), () => (chompKeep = true));
    let ws = ' ';
    if (keyComment || vsb || vcb) {
        ws = vsb ? '\n' : '';
        if (vcb) {
            const cs = commentString(vcb);
            ws += `\n${indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === '' && !ctx.inFlow) {
            if (ws === '\n')
                ws = '\n\n';
        }
        else {
            ws += `\n${ctx.indent}`;
        }
    }
    else if (!explicitKey && isCollection$1(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf('\n');
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
            let hasPropsLine = false;
            if (hasNewline && (vs0 === '&' || vs0 === '!')) {
                let sp0 = valueStr.indexOf(' ');
                if (vs0 === '&' &&
                    sp0 !== -1 &&
                    sp0 < nl0 &&
                    valueStr[sp0 + 1] === '!') {
                    sp0 = valueStr.indexOf(' ', sp0 + 1);
                }
                if (sp0 === -1 || nl0 < sp0)
                    hasPropsLine = true;
            }
            if (!hasPropsLine)
                ws = `\n${ctx.indent}`;
        }
    }
    else if (valueStr === '' || valueStr[0] === '\n') {
        ws = '';
    }
    str += ws + valueStr;
    if (ctx.inFlow) {
        if (valueCommentDone && onComment)
            onComment();
    }
    else if (valueComment && !valueCommentDone) {
        str += lineComment(str, ctx.indent, commentString(valueComment));
    }
    else if (chompKeep && onChompKeep) {
        onChompKeep();
    }
    return str;
}

function warn(logLevel, warning) {
    if (logLevel === 'debug' || logLevel === 'warn') {
        console.warn(warning);
    }
}

// If the value associated with a merge key is a single mapping node, each of
// its key/value pairs is inserted into the current mapping, unless the key
// already exists in it. If the value associated with the merge key is a
// sequence, then this sequence is expected to contain mapping nodes and each
// of these nodes is merged in turn according to its order in the sequence.
// Keys in mapping nodes earlier in the sequence override keys specified in
// later mapping nodes. -- http://yaml.org/type/merge.html
const MERGE_KEY = '<<';
const merge = {
    identify: value => value === MERGE_KEY ||
        (typeof value === 'symbol' && value.description === MERGE_KEY),
    default: 'key',
    tag: 'tag:yaml.org,2002:merge',
    test: /^<<$/,
    resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
    }),
    stringify: () => MERGE_KEY
};
const isMergeKey = (ctx, key) => (merge.identify(key) ||
    (isScalar$1(key) &&
        (!key.type || key.type === Scalar.PLAIN) &&
        merge.identify(key.value))) &&
    ctx?.doc.schema.tags.some(tag => tag.tag === merge.tag && tag.default);
function addMergeToJSMap(ctx, map, value) {
    value = ctx && isAlias(value) ? value.resolve(ctx.doc) : value;
    if (isSeq(value))
        for (const it of value.items)
            mergeValue(ctx, map, it);
    else if (Array.isArray(value))
        for (const it of value)
            mergeValue(ctx, map, it);
    else
        mergeValue(ctx, map, value);
}
function mergeValue(ctx, map, value) {
    const source = ctx && isAlias(value) ? value.resolve(ctx.doc) : value;
    if (!isMap(source))
        throw new Error('Merge sources must be maps or map aliases');
    const srcMap = source.toJSON(null, ctx, Map);
    for (const [key, value] of srcMap) {
        if (map instanceof Map) {
            if (!map.has(key))
                map.set(key, value);
        }
        else if (map instanceof Set) {
            map.add(key);
        }
        else if (!Object.prototype.hasOwnProperty.call(map, key)) {
            Object.defineProperty(map, key, {
                value,
                writable: true,
                enumerable: true,
                configurable: true
            });
        }
    }
    return map;
}

function addPairToJSMap(ctx, map, { key, value }) {
    if (isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
    // TODO: Should drop this special case for bare << handling
    else if (isMergeKey(ctx, key))
        addMergeToJSMap(ctx, map, value);
    else {
        const jsKey = toJS(key, '', ctx);
        if (map instanceof Map) {
            map.set(jsKey, toJS(value, jsKey, ctx));
        }
        else if (map instanceof Set) {
            map.add(jsKey);
        }
        else {
            const stringKey = stringifyKey(key, jsKey, ctx);
            const jsValue = toJS(value, stringKey, ctx);
            if (stringKey in map)
                Object.defineProperty(map, stringKey, {
                    value: jsValue,
                    writable: true,
                    enumerable: true,
                    configurable: true
                });
            else
                map[stringKey] = jsValue;
        }
    }
    return map;
}
function stringifyKey(key, jsKey, ctx) {
    if (jsKey === null)
        return '';
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    if (typeof jsKey !== 'object')
        return String(jsKey);
    if (isNode(key) && ctx?.doc) {
        const strCtx = createStringifyContext(ctx.doc, {});
        strCtx.anchors = new Set();
        for (const node of ctx.anchors.keys())
            strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
            let jsonStr = JSON.stringify(strKey);
            if (jsonStr.length > 40)
                jsonStr = jsonStr.substring(0, 36) + '..."';
            warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
            ctx.mapKeyWarned = true;
        }
        return strKey;
    }
    return JSON.stringify(jsKey);
}

function createPair(key, value, ctx) {
    const k = createNode(key, undefined, ctx);
    const v = createNode(value, undefined, ctx);
    return new Pair(k, v);
}
class Pair {
    constructor(key, value = null) {
        Object.defineProperty(this, NODE_TYPE, { value: PAIR });
        this.key = key;
        this.value = value;
    }
    clone(schema) {
        let { key, value } = this;
        if (isNode(key))
            key = key.clone(schema);
        if (isNode(value))
            value = value.clone(schema);
        return new Pair(key, value);
    }
    toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? new Map() : {};
        return addPairToJSMap(ctx, pair, this);
    }
    toString(ctx, onComment, onChompKeep) {
        return ctx?.doc
            ? stringifyPair(this, ctx, onComment, onChompKeep)
            : JSON.stringify(this);
    }
}

function stringifyCollection(collection, ctx, options) {
    const flow = ctx.inFlow ?? collection.flow;
    const stringify = flow ? stringifyFlowCollection : stringifyBlockCollection;
    return stringify(collection, ctx, options);
}
function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
    const { indent, options: { commentString } } = ctx;
    const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
    let chompKeep = false; // flag for the preceding node's status
    const lines = [];
    for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (isNode(item)) {
            if (!chompKeep && item.spaceBefore)
                lines.push('');
            addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
            if (item.comment)
                comment = item.comment;
        }
        else if (isPair(item)) {
            const ik = isNode(item.key) ? item.key : null;
            if (ik) {
                if (!chompKeep && ik.spaceBefore)
                    lines.push('');
                addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
            }
        }
        chompKeep = false;
        let str = stringify$2(item, itemCtx, () => (comment = null), () => (chompKeep = true));
        if (comment)
            str += lineComment(str, itemIndent, commentString(comment));
        if (chompKeep && comment)
            chompKeep = false;
        lines.push(blockItemPrefix + str);
    }
    let str;
    if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
    }
    else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
            const line = lines[i];
            str += line ? `\n${indent}${line}` : '\n';
        }
    }
    if (comment) {
        str += '\n' + indentComment(commentString(comment), indent);
        if (onComment)
            onComment();
    }
    else if (chompKeep && onChompKeep)
        onChompKeep();
    return str;
}
function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
    const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
    itemIndent += indentStep;
    const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
    });
    let reqNewline = false;
    let linesAtValue = 0;
    const lines = [];
    for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (isNode(item)) {
            if (item.spaceBefore)
                lines.push('');
            addCommentBefore(ctx, lines, item.commentBefore, false);
            if (item.comment)
                comment = item.comment;
        }
        else if (isPair(item)) {
            const ik = isNode(item.key) ? item.key : null;
            if (ik) {
                if (ik.spaceBefore)
                    lines.push('');
                addCommentBefore(ctx, lines, ik.commentBefore, false);
                if (ik.comment)
                    reqNewline = true;
            }
            const iv = isNode(item.value) ? item.value : null;
            if (iv) {
                if (iv.comment)
                    comment = iv.comment;
                if (iv.commentBefore)
                    reqNewline = true;
            }
            else if (item.value == null && ik?.comment) {
                comment = ik.comment;
            }
        }
        if (comment)
            reqNewline = true;
        let str = stringify$2(item, itemCtx, () => (comment = null));
        if (i < items.length - 1)
            str += ',';
        if (comment)
            str += lineComment(str, itemIndent, commentString(comment));
        if (!reqNewline && (lines.length > linesAtValue || str.includes('\n')))
            reqNewline = true;
        lines.push(str);
        linesAtValue = lines.length;
    }
    const { start, end } = flowChars;
    if (lines.length === 0) {
        return start + end;
    }
    else {
        if (!reqNewline) {
            const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
            reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
            let str = start;
            for (const line of lines)
                str += line ? `\n${indentStep}${indent}${line}` : '\n';
            return `${str}\n${indent}${end}`;
        }
        else {
            return `${start}${fcPadding}${lines.join(' ')}${fcPadding}${end}`;
        }
    }
}
function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
    if (comment && chompKeep)
        comment = comment.replace(/^\n+/, '');
    if (comment) {
        const ic = indentComment(commentString(comment), indent);
        lines.push(ic.trimStart()); // Avoid double indent on first line
    }
}

function findPair(items, key) {
    const k = isScalar$1(key) ? key.value : key;
    for (const it of items) {
        if (isPair(it)) {
            if (it.key === key || it.key === k)
                return it;
            if (isScalar$1(it.key) && it.key.value === k)
                return it;
        }
    }
    return undefined;
}
class YAMLMap extends Collection {
    static get tagName() {
        return 'tag:yaml.org,2002:map';
    }
    constructor(schema) {
        super(MAP, schema);
        this.items = [];
    }
    /**
     * A generic collection parsing method that can be extended
     * to other node classes that inherit from YAMLMap
     */
    static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
            if (typeof replacer === 'function')
                value = replacer.call(obj, key, value);
            else if (Array.isArray(replacer) && !replacer.includes(key))
                return;
            if (value !== undefined || keepUndefined)
                map.items.push(createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
            for (const [key, value] of obj)
                add(key, value);
        }
        else if (obj && typeof obj === 'object') {
            for (const key of Object.keys(obj))
                add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === 'function') {
            map.items.sort(schema.sortMapEntries);
        }
        return map;
    }
    /**
     * Adds a value to the collection.
     *
     * @param overwrite - If not set `true`, using a key that is already in the
     *   collection will throw. Otherwise, overwrites the previous value.
     */
    add(pair, overwrite) {
        let _pair;
        if (isPair(pair))
            _pair = pair;
        else if (!pair || typeof pair !== 'object' || !('key' in pair)) {
            // In TypeScript, this never happens.
            _pair = new Pair(pair, pair?.value);
        }
        else
            _pair = new Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
            if (!overwrite)
                throw new Error(`Key ${_pair.key} already set`);
            // For scalars, keep the old node & its comments and anchors
            if (isScalar$1(prev.value) && isScalarValue(_pair.value))
                prev.value.value = _pair.value;
            else
                prev.value = _pair.value;
        }
        else if (sortEntries) {
            const i = this.items.findIndex(item => sortEntries(_pair, item) < 0);
            if (i === -1)
                this.items.push(_pair);
            else
                this.items.splice(i, 0, _pair);
        }
        else {
            this.items.push(_pair);
        }
    }
    delete(key) {
        const it = findPair(this.items, key);
        if (!it)
            return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
    }
    get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && isScalar$1(node) ? node.value : node) ?? undefined;
    }
    has(key) {
        return !!findPair(this.items, key);
    }
    set(key, value) {
        this.add(new Pair(key, value), true);
    }
    /**
     * @param ctx - Conversion context, originally set in Document#toJS()
     * @param {Class} Type - If set, forces the returned collection type
     * @returns Instance of Type, Map, or Object
     */
    toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? new Map() : {};
        if (ctx?.onCreate)
            ctx.onCreate(map);
        for (const item of this.items)
            addPairToJSMap(ctx, map, item);
        return map;
    }
    toString(ctx, onComment, onChompKeep) {
        if (!ctx)
            return JSON.stringify(this);
        for (const item of this.items) {
            if (!isPair(item))
                throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
            ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection(this, ctx, {
            blockItemPrefix: '',
            flowChars: { start: '{', end: '}' },
            itemIndent: ctx.indent || '',
            onChompKeep,
            onComment
        });
    }
}

const map = {
    collection: 'map',
    default: true,
    nodeClass: YAMLMap,
    tag: 'tag:yaml.org,2002:map',
    resolve(map, onError) {
        if (!isMap(map))
            onError('Expected a mapping for this tag');
        return map;
    },
    createNode: (schema, obj, ctx) => YAMLMap.from(schema, obj, ctx)
};

class YAMLSeq extends Collection {
    static get tagName() {
        return 'tag:yaml.org,2002:seq';
    }
    constructor(schema) {
        super(SEQ, schema);
        this.items = [];
    }
    add(value) {
        this.items.push(value);
    }
    /**
     * Removes a value from the collection.
     *
     * `key` must contain a representation of an integer for this to succeed.
     * It may be wrapped in a `Scalar`.
     *
     * @returns `true` if the item was found and removed.
     */
    delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== 'number')
            return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
    }
    get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== 'number')
            return undefined;
        const it = this.items[idx];
        return !keepScalar && isScalar$1(it) ? it.value : it;
    }
    /**
     * Checks if the collection includes a value with the key `key`.
     *
     * `key` must contain a representation of an integer for this to succeed.
     * It may be wrapped in a `Scalar`.
     */
    has(key) {
        const idx = asItemIndex(key);
        return typeof idx === 'number' && idx < this.items.length;
    }
    /**
     * Sets a value in this collection. For `!!set`, `value` needs to be a
     * boolean to add/remove the item from the set.
     *
     * If `key` does not contain a representation of an integer, this will throw.
     * It may be wrapped in a `Scalar`.
     */
    set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== 'number')
            throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (isScalar$1(prev) && isScalarValue(value))
            prev.value = value;
        else
            this.items[idx] = value;
    }
    toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
            ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
            seq.push(toJS(item, String(i++), ctx));
        return seq;
    }
    toString(ctx, onComment, onChompKeep) {
        if (!ctx)
            return JSON.stringify(this);
        return stringifyCollection(this, ctx, {
            blockItemPrefix: '- ',
            flowChars: { start: '[', end: ']' },
            itemIndent: (ctx.indent || '') + '  ',
            onChompKeep,
            onComment
        });
    }
    static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
            let i = 0;
            for (let it of obj) {
                if (typeof replacer === 'function') {
                    const key = obj instanceof Set ? it : String(i++);
                    it = replacer.call(obj, key, it);
                }
                seq.items.push(createNode(it, undefined, ctx));
            }
        }
        return seq;
    }
}
function asItemIndex(key) {
    let idx = isScalar$1(key) ? key.value : key;
    if (idx && typeof idx === 'string')
        idx = Number(idx);
    return typeof idx === 'number' && Number.isInteger(idx) && idx >= 0
        ? idx
        : null;
}

const seq = {
    collection: 'seq',
    default: true,
    nodeClass: YAMLSeq,
    tag: 'tag:yaml.org,2002:seq',
    resolve(seq, onError) {
        if (!isSeq(seq))
            onError('Expected a sequence for this tag');
        return seq;
    },
    createNode: (schema, obj, ctx) => YAMLSeq.from(schema, obj, ctx)
};

const string = {
    identify: value => typeof value === 'string',
    default: true,
    tag: 'tag:yaml.org,2002:str',
    resolve: str => str,
    stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString(item, ctx, onComment, onChompKeep);
    }
};

const nullTag = {
    identify: value => value == null,
    createNode: () => new Scalar(null),
    default: true,
    tag: 'tag:yaml.org,2002:null',
    test: /^(?:~|[Nn]ull|NULL)?$/,
    resolve: () => new Scalar(null),
    stringify: ({ source }, ctx) => typeof source === 'string' && nullTag.test.test(source)
        ? source
        : ctx.options.nullStr
};

const boolTag = {
    identify: value => typeof value === 'boolean',
    default: true,
    tag: 'tag:yaml.org,2002:bool',
    test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
    resolve: str => new Scalar(str[0] === 't' || str[0] === 'T'),
    stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
            const sv = source[0] === 't' || source[0] === 'T';
            if (value === sv)
                return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
};

function stringifyNumber({ format, minFractionDigits, tag, value }) {
    if (typeof value === 'bigint')
        return String(value);
    const num = typeof value === 'number' ? value : Number(value);
    if (!isFinite(num))
        return isNaN(num) ? '.nan' : num < 0 ? '-.inf' : '.inf';
    let n = JSON.stringify(value);
    if (!format &&
        minFractionDigits &&
        (!tag || tag === 'tag:yaml.org,2002:float') &&
        /^\d/.test(n)) {
        let i = n.indexOf('.');
        if (i < 0) {
            i = n.length;
            n += '.';
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
            n += '0';
    }
    return n;
}

const floatNaN$1 = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: str => str.slice(-3).toLowerCase() === 'nan'
        ? NaN
        : str[0] === '-'
            ? Number.NEGATIVE_INFINITY
            : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber
};
const floatExp$1 = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    format: 'EXP',
    test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
    resolve: str => parseFloat(str),
    stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber(node);
    }
};
const float$1 = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
    resolve(str) {
        const node = new Scalar(parseFloat(str));
        const dot = str.indexOf('.');
        if (dot !== -1 && str[str.length - 1] === '0')
            node.minFractionDigits = str.length - dot - 1;
        return node;
    },
    stringify: stringifyNumber
};

const intIdentify$2 = (value) => typeof value === 'bigint' || Number.isInteger(value);
const intResolve$1 = (str, offset, radix, { intAsBigInt }) => (intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix));
function intStringify$1(node, radix, prefix) {
    const { value } = node;
    if (intIdentify$2(value) && value >= 0)
        return prefix + value.toString(radix);
    return stringifyNumber(node);
}
const intOct$1 = {
    identify: value => intIdentify$2(value) && value >= 0,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'OCT',
    test: /^0o[0-7]+$/,
    resolve: (str, _onError, opt) => intResolve$1(str, 2, 8, opt),
    stringify: node => intStringify$1(node, 8, '0o')
};
const int$1 = {
    identify: intIdentify$2,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    test: /^[-+]?[0-9]+$/,
    resolve: (str, _onError, opt) => intResolve$1(str, 0, 10, opt),
    stringify: stringifyNumber
};
const intHex$1 = {
    identify: value => intIdentify$2(value) && value >= 0,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'HEX',
    test: /^0x[0-9a-fA-F]+$/,
    resolve: (str, _onError, opt) => intResolve$1(str, 2, 16, opt),
    stringify: node => intStringify$1(node, 16, '0x')
};

const schema$2 = [
    map,
    seq,
    string,
    nullTag,
    boolTag,
    intOct$1,
    int$1,
    intHex$1,
    floatNaN$1,
    floatExp$1,
    float$1
];

function intIdentify$1(value) {
    return typeof value === 'bigint' || Number.isInteger(value);
}
const stringifyJSON = ({ value }) => JSON.stringify(value);
const jsonScalars = [
    {
        identify: value => typeof value === 'string',
        default: true,
        tag: 'tag:yaml.org,2002:str',
        resolve: str => str,
        stringify: stringifyJSON
    },
    {
        identify: value => value == null,
        createNode: () => new Scalar(null),
        default: true,
        tag: 'tag:yaml.org,2002:null',
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
    },
    {
        identify: value => typeof value === 'boolean',
        default: true,
        tag: 'tag:yaml.org,2002:bool',
        test: /^true$|^false$/,
        resolve: str => str === 'true',
        stringify: stringifyJSON
    },
    {
        identify: intIdentify$1,
        default: true,
        tag: 'tag:yaml.org,2002:int',
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify$1(value) ? value.toString() : JSON.stringify(value)
    },
    {
        identify: value => typeof value === 'number',
        default: true,
        tag: 'tag:yaml.org,2002:float',
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: str => parseFloat(str),
        stringify: stringifyJSON
    }
];
const jsonError = {
    default: true,
    tag: '',
    test: /^/,
    resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
    }
};
const schema$1 = [map, seq].concat(jsonScalars, jsonError);

const binary = {
    identify: value => value instanceof Uint8Array, // Buffer inherits from Uint8Array
    default: false,
    tag: 'tag:yaml.org,2002:binary',
    /**
     * Returns a Buffer in node and an Uint8Array in browsers
     *
     * To use the resulting buffer as an image, you'll want to do something like:
     *
     *   const blob = new Blob([buffer], { type: 'image/jpeg' })
     *   document.querySelector('#photo').src = URL.createObjectURL(blob)
     */
    resolve(src, onError) {
        if (typeof atob === 'function') {
            // On IE 11, atob() can't handle newlines
            const str = atob(src.replace(/[\n\r]/g, ''));
            const buffer = new Uint8Array(str.length);
            for (let i = 0; i < str.length; ++i)
                buffer[i] = str.charCodeAt(i);
            return buffer;
        }
        else {
            onError('This environment does not support reading binary tags; either Buffer or atob is required');
            return src;
        }
    },
    stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
            return '';
        const buf = value; // checked earlier by binary.identify()
        let str;
        if (typeof btoa === 'function') {
            let s = '';
            for (let i = 0; i < buf.length; ++i)
                s += String.fromCharCode(buf[i]);
            str = btoa(s);
        }
        else {
            throw new Error('This environment does not support writing binary tags; either Buffer or btoa is required');
        }
        type ?? (type = Scalar.BLOCK_LITERAL);
        if (type !== Scalar.QUOTE_DOUBLE) {
            const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
            const n = Math.ceil(str.length / lineWidth);
            const lines = new Array(n);
            for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
                lines[i] = str.substr(o, lineWidth);
            }
            str = lines.join(type === Scalar.BLOCK_LITERAL ? '\n' : ' ');
        }
        return stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
    }
};

function resolvePairs(seq, onError) {
    if (isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
            let item = seq.items[i];
            if (isPair(item))
                continue;
            else if (isMap(item)) {
                if (item.items.length > 1)
                    onError('Each pair must have its own sequence indicator');
                const pair = item.items[0] || new Pair(new Scalar(null));
                if (item.commentBefore)
                    pair.key.commentBefore = pair.key.commentBefore
                        ? `${item.commentBefore}\n${pair.key.commentBefore}`
                        : item.commentBefore;
                if (item.comment) {
                    const cn = pair.value ?? pair.key;
                    cn.comment = cn.comment
                        ? `${item.comment}\n${cn.comment}`
                        : item.comment;
                }
                item = pair;
            }
            seq.items[i] = isPair(item) ? item : new Pair(item);
        }
    }
    else
        onError('Expected a sequence for this tag');
    return seq;
}
function createPairs(schema, iterable, ctx) {
    const { replacer } = ctx;
    const pairs = new YAMLSeq(schema);
    pairs.tag = 'tag:yaml.org,2002:pairs';
    let i = 0;
    if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
            if (typeof replacer === 'function')
                it = replacer.call(iterable, String(i++), it);
            let key, value;
            if (Array.isArray(it)) {
                if (it.length === 2) {
                    key = it[0];
                    value = it[1];
                }
                else
                    throw new TypeError(`Expected [key, value] tuple: ${it}`);
            }
            else if (it && it instanceof Object) {
                const keys = Object.keys(it);
                if (keys.length === 1) {
                    key = keys[0];
                    value = it[key];
                }
                else {
                    throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
                }
            }
            else {
                key = it;
            }
            pairs.items.push(createPair(key, value, ctx));
        }
    return pairs;
}
const pairs = {
    collection: 'seq',
    default: false,
    tag: 'tag:yaml.org,2002:pairs',
    resolve: resolvePairs,
    createNode: createPairs
};

class YAMLOMap extends YAMLSeq {
    constructor() {
        super();
        this.add = YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.prototype.set.bind(this);
        this.tag = YAMLOMap.tag;
    }
    /**
     * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
     * but TypeScript won't allow widening the signature of a child method.
     */
    toJSON(_, ctx) {
        if (!ctx)
            return super.toJSON(_);
        const map = new Map();
        if (ctx?.onCreate)
            ctx.onCreate(map);
        for (const pair of this.items) {
            let key, value;
            if (isPair(pair)) {
                key = toJS(pair.key, '', ctx);
                value = toJS(pair.value, key, ctx);
            }
            else {
                key = toJS(pair, '', ctx);
            }
            if (map.has(key))
                throw new Error('Ordered maps must not include duplicate keys');
            map.set(key, value);
        }
        return map;
    }
    static from(schema, iterable, ctx) {
        const pairs = createPairs(schema, iterable, ctx);
        const omap = new this();
        omap.items = pairs.items;
        return omap;
    }
}
YAMLOMap.tag = 'tag:yaml.org,2002:omap';
const omap = {
    collection: 'seq',
    identify: value => value instanceof Map,
    nodeClass: YAMLOMap,
    default: false,
    tag: 'tag:yaml.org,2002:omap',
    resolve(seq, onError) {
        const pairs = resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs.items) {
            if (isScalar$1(key)) {
                if (seenKeys.includes(key.value)) {
                    onError(`Ordered maps must not include duplicate keys: ${key.value}`);
                }
                else {
                    seenKeys.push(key.value);
                }
            }
        }
        return Object.assign(new YAMLOMap(), pairs);
    },
    createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
};

function boolStringify({ value, source }, ctx) {
    const boolObj = value ? trueTag : falseTag;
    if (source && boolObj.test.test(source))
        return source;
    return value ? ctx.options.trueStr : ctx.options.falseStr;
}
const trueTag = {
    identify: value => value === true,
    default: true,
    tag: 'tag:yaml.org,2002:bool',
    test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
    resolve: () => new Scalar(true),
    stringify: boolStringify
};
const falseTag = {
    identify: value => value === false,
    default: true,
    tag: 'tag:yaml.org,2002:bool',
    test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
    resolve: () => new Scalar(false),
    stringify: boolStringify
};

const floatNaN = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === 'nan'
        ? NaN
        : str[0] === '-'
            ? Number.NEGATIVE_INFINITY
            : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber
};
const floatExp = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    format: 'EXP',
    test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str.replace(/_/g, '')),
    stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber(node);
    }
};
const float = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
    resolve(str) {
        const node = new Scalar(parseFloat(str.replace(/_/g, '')));
        const dot = str.indexOf('.');
        if (dot !== -1) {
            const f = str.substring(dot + 1).replace(/_/g, '');
            if (f[f.length - 1] === '0')
                node.minFractionDigits = f.length;
        }
        return node;
    },
    stringify: stringifyNumber
};

const intIdentify = (value) => typeof value === 'bigint' || Number.isInteger(value);
function intResolve(str, offset, radix, { intAsBigInt }) {
    const sign = str[0];
    if (sign === '-' || sign === '+')
        offset += 1;
    str = str.substring(offset).replace(/_/g, '');
    if (intAsBigInt) {
        switch (radix) {
            case 2:
                str = `0b${str}`;
                break;
            case 8:
                str = `0o${str}`;
                break;
            case 16:
                str = `0x${str}`;
                break;
        }
        const n = BigInt(str);
        return sign === '-' ? BigInt(-1) * n : n;
    }
    const n = parseInt(str, radix);
    return sign === '-' ? -1 * n : n;
}
function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? '-' + prefix + str.substr(1) : prefix + str;
    }
    return stringifyNumber(node);
}
const intBin = {
    identify: intIdentify,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'BIN',
    test: /^[-+]?0b[0-1_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
    stringify: node => intStringify(node, 2, '0b')
};
const intOct = {
    identify: intIdentify,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'OCT',
    test: /^[-+]?0[0-7_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
    stringify: node => intStringify(node, 8, '0')
};
const int = {
    identify: intIdentify,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    test: /^[-+]?[0-9][0-9_]*$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber
};
const intHex = {
    identify: intIdentify,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'HEX',
    test: /^[-+]?0x[0-9a-fA-F_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: node => intStringify(node, 16, '0x')
};

class YAMLSet extends YAMLMap {
    constructor(schema) {
        super(schema);
        this.tag = YAMLSet.tag;
    }
    add(key) {
        let pair;
        if (isPair(key))
            pair = key;
        else if (key &&
            typeof key === 'object' &&
            'key' in key &&
            'value' in key &&
            key.value === null)
            pair = new Pair(key.key, null);
        else
            pair = new Pair(key, null);
        const prev = findPair(this.items, pair.key);
        if (!prev)
            this.items.push(pair);
    }
    /**
     * If `keepPair` is `true`, returns the Pair matching `key`.
     * Otherwise, returns the value of that Pair's key.
     */
    get(key, keepPair) {
        const pair = findPair(this.items, key);
        return !keepPair && isPair(pair)
            ? isScalar$1(pair.key)
                ? pair.key.value
                : pair.key
            : pair;
    }
    set(key, value) {
        if (typeof value !== 'boolean')
            throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = findPair(this.items, key);
        if (prev && !value) {
            this.items.splice(this.items.indexOf(prev), 1);
        }
        else if (!prev && value) {
            this.items.push(new Pair(key));
        }
    }
    toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
    }
    toString(ctx, onComment, onChompKeep) {
        if (!ctx)
            return JSON.stringify(this);
        if (this.hasAllNullValues(true))
            return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
            throw new Error('Set items must all have null values');
    }
    static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
            for (let value of iterable) {
                if (typeof replacer === 'function')
                    value = replacer.call(iterable, value, value);
                set.items.push(createPair(value, null, ctx));
            }
        return set;
    }
}
YAMLSet.tag = 'tag:yaml.org,2002:set';
const set = {
    collection: 'map',
    identify: value => value instanceof Set,
    nodeClass: YAMLSet,
    default: false,
    tag: 'tag:yaml.org,2002:set',
    createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
    resolve(map, onError) {
        if (isMap(map)) {
            if (map.hasAllNullValues(true))
                return Object.assign(new YAMLSet(), map);
            else
                onError('Set items must all have null values');
        }
        else
            onError('Expected a mapping for this tag');
        return map;
    }
};

/** Internal types handle bigint as number, because TS can't figure it out. */
function parseSexagesimal(str, asBigInt) {
    const sign = str[0];
    const parts = sign === '-' || sign === '+' ? str.substring(1) : str;
    const num = (n) => asBigInt ? BigInt(n) : Number(n);
    const res = parts
        .replace(/_/g, '')
        .split(':')
        .reduce((res, p) => res * num(60) + num(p), num(0));
    return (sign === '-' ? num(-1) * res : res);
}
/**
 * hhhh:mm:ss.sss
 *
 * Internal types handle bigint as number, because TS can't figure it out.
 */
function stringifySexagesimal(node) {
    let { value } = node;
    let num = (n) => n;
    if (typeof value === 'bigint')
        num = n => BigInt(n);
    else if (isNaN(value) || !isFinite(value))
        return stringifyNumber(node);
    let sign = '';
    if (value < 0) {
        sign = '-';
        value *= num(-1);
    }
    const _60 = num(60);
    const parts = [value % _60]; // seconds, including ms
    if (value < 60) {
        parts.unshift(0); // at least one : is required
    }
    else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60); // minutes
        if (value >= 60) {
            value = (value - parts[0]) / _60;
            parts.unshift(value); // hours
        }
    }
    return (sign +
        parts
            .map(n => String(n).padStart(2, '0'))
            .join(':')
            .replace(/000000\d*$/, '') // % 60 may introduce error
    );
}
const intTime = {
    identify: value => typeof value === 'bigint' || Number.isInteger(value),
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'TIME',
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
    resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
    stringify: stringifySexagesimal
};
const floatTime = {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    format: 'TIME',
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
    resolve: str => parseSexagesimal(str, false),
    stringify: stringifySexagesimal
};
const timestamp = {
    identify: value => value instanceof Date,
    default: true,
    tag: 'tag:yaml.org,2002:timestamp',
    // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
    // may be omitted altogether, resulting in a date format. In such a case, the time part is
    // assumed to be 00:00:00Z (start of day, UTC).
    test: RegExp('^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})' + // YYYY-Mm-Dd
        '(?:' + // time is optional
        '(?:t|T|[ \\t]+)' + // t | T | whitespace
        '([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)' + // Hh:Mm:Ss(.ss)?
        '(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?' + // Z | +5 | -03:30
        ')?$'),
    resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
            throw new Error('!!timestamp expects a date, starting with yyyy-mm-dd');
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + '00').substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== 'Z') {
            let d = parseSexagesimal(tz, false);
            if (Math.abs(d) < 30)
                d *= 60;
            date -= 60000 * d;
        }
        return new Date(date);
    },
    stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, '') ?? ''
};

const schema = [
    map,
    seq,
    string,
    nullTag,
    trueTag,
    falseTag,
    intBin,
    intOct,
    int,
    intHex,
    floatNaN,
    floatExp,
    float,
    binary,
    merge,
    omap,
    pairs,
    set,
    intTime,
    floatTime,
    timestamp
];

const schemas = new Map([
    ['core', schema$2],
    ['failsafe', [map, seq, string]],
    ['json', schema$1],
    ['yaml11', schema],
    ['yaml-1.1', schema]
]);
const tagsByName = {
    binary,
    bool: boolTag,
    float: float$1,
    floatExp: floatExp$1,
    floatNaN: floatNaN$1,
    floatTime,
    int: int$1,
    intHex: intHex$1,
    intOct: intOct$1,
    intTime,
    map,
    merge,
    null: nullTag,
    omap,
    pairs,
    seq,
    set,
    timestamp
};
const coreKnownTags = {
    'tag:yaml.org,2002:binary': binary,
    'tag:yaml.org,2002:merge': merge,
    'tag:yaml.org,2002:omap': omap,
    'tag:yaml.org,2002:pairs': pairs,
    'tag:yaml.org,2002:set': set,
    'tag:yaml.org,2002:timestamp': timestamp
};
function getTags(customTags, schemaName, addMergeTag) {
    const schemaTags = schemas.get(schemaName);
    if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge)
            ? schemaTags.concat(merge)
            : schemaTags.slice();
    }
    let tags = schemaTags;
    if (!tags) {
        if (Array.isArray(customTags))
            tags = [];
        else {
            const keys = Array.from(schemas.keys())
                .filter(key => key !== 'yaml11')
                .map(key => JSON.stringify(key))
                .join(', ');
            throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
    }
    if (Array.isArray(customTags)) {
        for (const tag of customTags)
            tags = tags.concat(tag);
    }
    else if (typeof customTags === 'function') {
        tags = customTags(tags.slice());
    }
    if (addMergeTag)
        tags = tags.concat(merge);
    return tags.reduce((tags, tag) => {
        const tagObj = typeof tag === 'string' ? tagsByName[tag] : tag;
        if (!tagObj) {
            const tagName = JSON.stringify(tag);
            const keys = Object.keys(tagsByName)
                .map(key => JSON.stringify(key))
                .join(', ');
            throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags.includes(tagObj))
            tags.push(tagObj);
        return tags;
    }, []);
}

const sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
class Schema {
    constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat)
            ? getTags(compat, 'compat')
            : compat
                ? getTags(null, compat)
                : null;
        this.name = (typeof schema === 'string' && schema) || 'core';
        this.knownTags = resolveKnownTags ? coreKnownTags : {};
        this.tags = getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, MAP, { value: map });
        Object.defineProperty(this, SCALAR$1, { value: string });
        Object.defineProperty(this, SEQ, { value: seq });
        // Used by createMap()
        this.sortMapEntries =
            typeof sortMapEntries === 'function'
                ? sortMapEntries
                : sortMapEntries === true
                    ? sortMapEntriesByKey
                    : null;
    }
    clone() {
        const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
    }
}

function stringifyDocument(doc, options) {
    const lines = [];
    let hasDirectives = options.directives === true;
    if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
            lines.push(dir);
            hasDirectives = true;
        }
        else if (doc.directives.docStart)
            hasDirectives = true;
    }
    if (hasDirectives)
        lines.push('---');
    const ctx = createStringifyContext(doc, options);
    const { commentString } = ctx.options;
    if (doc.commentBefore) {
        if (lines.length !== 1)
            lines.unshift('');
        const cs = commentString(doc.commentBefore);
        lines.unshift(indentComment(cs, ''));
    }
    let chompKeep = false;
    let contentComment = null;
    if (doc.contents) {
        if (isNode(doc.contents)) {
            if (doc.contents.spaceBefore && hasDirectives)
                lines.push('');
            if (doc.contents.commentBefore) {
                const cs = commentString(doc.contents.commentBefore);
                lines.push(indentComment(cs, ''));
            }
            // top-level block scalars need to be indented if followed by a comment
            ctx.forceBlockIndent = !!doc.comment;
            contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? undefined : () => (chompKeep = true);
        let body = stringify$2(doc.contents, ctx, () => (contentComment = null), onChompKeep);
        if (contentComment)
            body += lineComment(body, '', commentString(contentComment));
        if ((body[0] === '|' || body[0] === '>') &&
            lines[lines.length - 1] === '---') {
            // Top-level block scalars with a preceding doc marker ought to use the
            // same line for their header.
            lines[lines.length - 1] = `--- ${body}`;
        }
        else
            lines.push(body);
    }
    else {
        lines.push(stringify$2(doc.contents, ctx));
    }
    if (doc.directives?.docEnd) {
        if (doc.comment) {
            const cs = commentString(doc.comment);
            if (cs.includes('\n')) {
                lines.push('...');
                lines.push(indentComment(cs, ''));
            }
            else {
                lines.push(`... ${cs}`);
            }
        }
        else {
            lines.push('...');
        }
    }
    else {
        let dc = doc.comment;
        if (dc && chompKeep)
            dc = dc.replace(/^\n+/, '');
        if (dc) {
            if ((!chompKeep || contentComment) && lines[lines.length - 1] !== '')
                lines.push('');
            lines.push(indentComment(commentString(dc), ''));
        }
    }
    return lines.join('\n') + '\n';
}

class Document {
    constructor(value, replacer, options) {
        /** A comment before this Document */
        this.commentBefore = null;
        /** A comment immediately after this Document */
        this.comment = null;
        /** Errors encountered during parsing. */
        this.errors = [];
        /** Warnings encountered during parsing. */
        this.warnings = [];
        Object.defineProperty(this, NODE_TYPE, { value: DOC });
        let _replacer = null;
        if (typeof replacer === 'function' || Array.isArray(replacer)) {
            _replacer = replacer;
        }
        else if (options === undefined && replacer) {
            options = replacer;
            replacer = undefined;
        }
        const opt = Object.assign({
            intAsBigInt: false,
            keepSourceTokens: false,
            logLevel: 'warn',
            prettyErrors: true,
            strict: true,
            stringKeys: false,
            uniqueKeys: true,
            version: '1.2'
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
            this.directives = options._directives.atDocument();
            if (this.directives.yaml.explicit)
                version = this.directives.yaml.version;
        }
        else
            this.directives = new Directives({ version });
        this.setSchema(version, options);
        // @ts-expect-error We can't really know that this matches Contents.
        this.contents =
            value === undefined ? null : this.createNode(value, _replacer, options);
    }
    /**
     * Create a deep copy of this Document and its contents.
     *
     * Custom Node values that inherit from `Object` still refer to their original instances.
     */
    clone() {
        const copy = Object.create(Document.prototype, {
            [NODE_TYPE]: { value: DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
            copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        // @ts-expect-error We can't really know that this matches Contents.
        copy.contents = isNode(this.contents)
            ? this.contents.clone(copy.schema)
            : this.contents;
        if (this.range)
            copy.range = this.range.slice();
        return copy;
    }
    /** Adds a value to the document. */
    add(value) {
        if (assertCollection(this.contents))
            this.contents.add(value);
    }
    /** Adds a value to the document. */
    addIn(path, value) {
        if (assertCollection(this.contents))
            this.contents.addIn(path, value);
    }
    /**
     * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
     *
     * If `node` already has an anchor, `name` is ignored.
     * Otherwise, the `node.anchor` value will be set to `name`,
     * or if an anchor with that name is already present in the document,
     * `name` will be used as a prefix for a new unique anchor.
     * If `name` is undefined, the generated anchor will use 'a' as a prefix.
     */
    createAlias(node, name) {
        if (!node.anchor) {
            const prev = anchorNames(this);
            node.anchor =
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                !name || prev.has(name) ? findNewAnchor(name || 'a', prev) : name;
        }
        return new Alias(node.anchor);
    }
    createNode(value, replacer, options) {
        let _replacer = undefined;
        if (typeof replacer === 'function') {
            value = replacer.call({ '': value }, '', value);
            _replacer = replacer;
        }
        else if (Array.isArray(replacer)) {
            const keyToStr = (v) => typeof v === 'number' || v instanceof String || v instanceof Number;
            const asStr = replacer.filter(keyToStr).map(String);
            if (asStr.length > 0)
                replacer = replacer.concat(asStr);
            _replacer = replacer;
        }
        else if (options === undefined && replacer) {
            options = replacer;
            replacer = undefined;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = createNodeAnchors(this, 
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        anchorPrefix || 'a');
        const ctx = {
            aliasDuplicateObjects: aliasDuplicateObjects ?? true,
            keepUndefined: keepUndefined ?? false,
            onAnchor,
            onTagObj,
            replacer: _replacer,
            schema: this.schema,
            sourceObjects
        };
        const node = createNode(value, tag, ctx);
        if (flow && isCollection$1(node))
            node.flow = true;
        setAnchors();
        return node;
    }
    /**
     * Convert a key and a value into a `Pair` using the current schema,
     * recursively wrapping all values as `Scalar` or `Collection` nodes.
     */
    createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair(k, v);
    }
    /**
     * Removes a value from the document.
     * @returns `true` if the item was found and removed.
     */
    delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
    }
    /**
     * Removes a value from the document.
     * @returns `true` if the item was found and removed.
     */
    deleteIn(path) {
        if (isEmptyPath(path)) {
            if (this.contents == null)
                return false;
            // @ts-expect-error Presumed impossible if Strict extends false
            this.contents = null;
            return true;
        }
        return assertCollection(this.contents)
            ? this.contents.deleteIn(path)
            : false;
    }
    /**
     * Returns item at `key`, or `undefined` if not found. By default unwraps
     * scalar values from their surrounding node; to disable set `keepScalar` to
     * `true` (collections are always returned intact).
     */
    get(key, keepScalar) {
        return isCollection$1(this.contents)
            ? this.contents.get(key, keepScalar)
            : undefined;
    }
    /**
     * Returns item at `path`, or `undefined` if not found. By default unwraps
     * scalar values from their surrounding node; to disable set `keepScalar` to
     * `true` (collections are always returned intact).
     */
    getIn(path, keepScalar) {
        if (isEmptyPath(path))
            return !keepScalar && isScalar$1(this.contents)
                ? this.contents.value
                : this.contents;
        return isCollection$1(this.contents)
            ? this.contents.getIn(path, keepScalar)
            : undefined;
    }
    /**
     * Checks if the document includes a value with the key `key`.
     */
    has(key) {
        return isCollection$1(this.contents) ? this.contents.has(key) : false;
    }
    /**
     * Checks if the document includes a value at `path`.
     */
    hasIn(path) {
        if (isEmptyPath(path))
            return this.contents !== undefined;
        return isCollection$1(this.contents) ? this.contents.hasIn(path) : false;
    }
    /**
     * Sets a value in this document. For `!!set`, `value` needs to be a
     * boolean to add/remove the item from the set.
     */
    set(key, value) {
        if (this.contents == null) {
            // @ts-expect-error We can't really know that this matches Contents.
            this.contents = collectionFromPath(this.schema, [key], value);
        }
        else if (assertCollection(this.contents)) {
            this.contents.set(key, value);
        }
    }
    /**
     * Sets a value in this document. For `!!set`, `value` needs to be a
     * boolean to add/remove the item from the set.
     */
    setIn(path, value) {
        if (isEmptyPath(path)) {
            // @ts-expect-error We can't really know that this matches Contents.
            this.contents = value;
        }
        else if (this.contents == null) {
            // @ts-expect-error We can't really know that this matches Contents.
            this.contents = collectionFromPath(this.schema, Array.from(path), value);
        }
        else if (assertCollection(this.contents)) {
            this.contents.setIn(path, value);
        }
    }
    /**
     * Change the YAML version and schema used by the document.
     * A `null` version disables support for directives, explicit tags, anchors, and aliases.
     * It also requires the `schema` option to be given as a `Schema` instance value.
     *
     * Overrides all previously set schema options.
     */
    setSchema(version, options = {}) {
        if (typeof version === 'number')
            version = String(version);
        let opt;
        switch (version) {
            case '1.1':
                if (this.directives)
                    this.directives.yaml.version = '1.1';
                else
                    this.directives = new Directives({ version: '1.1' });
                opt = { resolveKnownTags: false, schema: 'yaml-1.1' };
                break;
            case '1.2':
            case 'next':
                if (this.directives)
                    this.directives.yaml.version = version;
                else
                    this.directives = new Directives({ version });
                opt = { resolveKnownTags: true, schema: 'core' };
                break;
            case null:
                if (this.directives)
                    delete this.directives;
                opt = null;
                break;
            default: {
                const sv = JSON.stringify(version);
                throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
            }
        }
        // Not using `instanceof Schema` to allow for duck typing
        if (options.schema instanceof Object)
            this.schema = options.schema;
        else if (opt)
            this.schema = new Schema(Object.assign(opt, options));
        else
            throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
    }
    // json & jsonArg are only used from toJSON()
    toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
            anchors: new Map(),
            doc: this,
            keep: !json,
            mapAsMap: mapAsMap === true,
            mapKeyWarned: false,
            maxAliasCount: typeof maxAliasCount === 'number' ? maxAliasCount : 100
        };
        const res = toJS(this.contents, jsonArg ?? '', ctx);
        if (typeof onAnchor === 'function')
            for (const { count, res } of ctx.anchors.values())
                onAnchor(res, count);
        return typeof reviver === 'function'
            ? applyReviver(reviver, { '': res }, '', res)
            : res;
    }
    /**
     * A JSON representation of the document `contents`.
     *
     * @param jsonArg Used by `JSON.stringify` to indicate the array index or
     *   property name.
     */
    toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
    }
    /** A YAML representation of the document. */
    toString(options = {}) {
        if (this.errors.length > 0)
            throw new Error('Document with errors cannot be stringified');
        if ('indent' in options &&
            (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
            const s = JSON.stringify(options.indent);
            throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument(this, options);
    }
}
function assertCollection(contents) {
    if (isCollection$1(contents))
        return true;
    throw new Error('Expected a YAML collection as document contents');
}

class YAMLError extends Error {
    constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
    }
}
class YAMLParseError extends YAMLError {
    constructor(pos, code, message) {
        super('YAMLParseError', pos, code, message);
    }
}
class YAMLWarning extends YAMLError {
    constructor(pos, code, message) {
        super('YAMLWarning', pos, code, message);
    }
}
const prettifyError = (src, lc) => (error) => {
    if (error.pos[0] === -1)
        return;
    error.linePos = error.pos.map(pos => lc.linePos(pos));
    const { line, col } = error.linePos[0];
    error.message += ` at line ${line}, column ${col}`;
    let ci = col - 1;
    let lineStr = src
        .substring(lc.lineStarts[line - 1], lc.lineStarts[line])
        .replace(/[\n\r]+$/, '');
    // Trim to max 80 chars, keeping col position near the middle
    if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = '…' + lineStr.substring(trimStart);
        ci -= trimStart - 1;
    }
    if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + '…';
    // Include previous line in context if pointing at line start
    if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        // Regexp won't match if start is trimmed
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
            prev = prev.substring(0, 79) + '…\n';
        lineStr = prev + lineStr;
    }
    if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end && end.line === line && end.col > col) {
            count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = ' '.repeat(ci) + '^'.repeat(count);
        error.message += `:\n\n${lineStr}\n${pointer}\n`;
    }
};

function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
    let spaceBefore = false;
    let atNewline = startOnNewline;
    let hasSpace = startOnNewline;
    let comment = '';
    let commentSep = '';
    let hasNewline = false;
    let reqSpace = false;
    let tab = null;
    let anchor = null;
    let tag = null;
    let newlineAfterProp = null;
    let comma = null;
    let found = null;
    let start = null;
    for (const token of tokens) {
        if (reqSpace) {
            if (token.type !== 'space' &&
                token.type !== 'newline' &&
                token.type !== 'comma')
                onError(token.offset, 'MISSING_CHAR', 'Tags and anchors must be separated from the next token by white space');
            reqSpace = false;
        }
        if (tab) {
            if (atNewline && token.type !== 'comment' && token.type !== 'newline') {
                onError(tab, 'TAB_AS_INDENT', 'Tabs are not allowed as indentation');
            }
            tab = null;
        }
        switch (token.type) {
            case 'space':
                // At the doc level, tabs at line start may be parsed
                // as leading white space rather than indentation.
                // In a flow collection, only the parser handles indent.
                if (!flow &&
                    (indicator !== 'doc-start' || next?.type !== 'flow-collection') &&
                    token.source.includes('\t')) {
                    tab = token;
                }
                hasSpace = true;
                break;
            case 'comment': {
                if (!hasSpace)
                    onError(token, 'MISSING_CHAR', 'Comments must be separated from other tokens by white space characters');
                const cb = token.source.substring(1) || ' ';
                if (!comment)
                    comment = cb;
                else
                    comment += commentSep + cb;
                commentSep = '';
                atNewline = false;
                break;
            }
            case 'newline':
                if (atNewline) {
                    if (comment)
                        comment += token.source;
                    else if (!found || indicator !== 'seq-item-ind')
                        spaceBefore = true;
                }
                else
                    commentSep += token.source;
                atNewline = true;
                hasNewline = true;
                if (anchor || tag)
                    newlineAfterProp = token;
                hasSpace = true;
                break;
            case 'anchor':
                if (anchor)
                    onError(token, 'MULTIPLE_ANCHORS', 'A node can have at most one anchor');
                if (token.source.endsWith(':'))
                    onError(token.offset + token.source.length - 1, 'BAD_ALIAS', 'Anchor ending in : is ambiguous', true);
                anchor = token;
                start ?? (start = token.offset);
                atNewline = false;
                hasSpace = false;
                reqSpace = true;
                break;
            case 'tag': {
                if (tag)
                    onError(token, 'MULTIPLE_TAGS', 'A node can have at most one tag');
                tag = token;
                start ?? (start = token.offset);
                atNewline = false;
                hasSpace = false;
                reqSpace = true;
                break;
            }
            case indicator:
                // Could here handle preceding comments differently
                if (anchor || tag)
                    onError(token, 'BAD_PROP_ORDER', `Anchors and tags must be after the ${token.source} indicator`);
                if (found)
                    onError(token, 'UNEXPECTED_TOKEN', `Unexpected ${token.source} in ${flow ?? 'collection'}`);
                found = token;
                atNewline =
                    indicator === 'seq-item-ind' || indicator === 'explicit-key-ind';
                hasSpace = false;
                break;
            case 'comma':
                if (flow) {
                    if (comma)
                        onError(token, 'UNEXPECTED_TOKEN', `Unexpected , in ${flow}`);
                    comma = token;
                    atNewline = false;
                    hasSpace = false;
                    break;
                }
            // else fallthrough
            default:
                onError(token, 'UNEXPECTED_TOKEN', `Unexpected ${token.type} token`);
                atNewline = false;
                hasSpace = false;
        }
    }
    const last = tokens[tokens.length - 1];
    const end = last ? last.offset + last.source.length : offset;
    if (reqSpace &&
        next &&
        next.type !== 'space' &&
        next.type !== 'newline' &&
        next.type !== 'comma' &&
        (next.type !== 'scalar' || next.source !== '')) {
        onError(next.offset, 'MISSING_CHAR', 'Tags and anchors must be separated from the next token by white space');
    }
    if (tab &&
        ((atNewline && tab.indent <= parentIndent) ||
            next?.type === 'block-map' ||
            next?.type === 'block-seq'))
        onError(tab, 'TAB_AS_INDENT', 'Tabs are not allowed as indentation');
    return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
    };
}

function containsNewline(key) {
    if (!key)
        return null;
    switch (key.type) {
        case 'alias':
        case 'scalar':
        case 'double-quoted-scalar':
        case 'single-quoted-scalar':
            if (key.source.includes('\n'))
                return true;
            if (key.end)
                for (const st of key.end)
                    if (st.type === 'newline')
                        return true;
            return false;
        case 'flow-collection':
            for (const it of key.items) {
                for (const st of it.start)
                    if (st.type === 'newline')
                        return true;
                if (it.sep)
                    for (const st of it.sep)
                        if (st.type === 'newline')
                            return true;
                if (containsNewline(it.key) || containsNewline(it.value))
                    return true;
            }
            return false;
        default:
            return true;
    }
}

function flowIndentCheck(indent, fc, onError) {
    if (fc?.type === 'flow-collection') {
        const end = fc.end[0];
        if (end.indent === indent &&
            (end.source === ']' || end.source === '}') &&
            containsNewline(fc)) {
            const msg = 'Flow end indicator should be more indented than parent';
            onError(end, 'BAD_INDENT', msg, true);
        }
    }
}

function mapIncludes(ctx, items, search) {
    const { uniqueKeys } = ctx.options;
    if (uniqueKeys === false)
        return false;
    const isEqual = typeof uniqueKeys === 'function'
        ? uniqueKeys
        : (a, b) => a === b || (isScalar$1(a) && isScalar$1(b) && a.value === b.value);
    return items.some(pair => isEqual(pair.key, search));
}

const startColMsg = 'All mapping items must start at the same column';
function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLMap;
    const map = new NodeClass(ctx.schema);
    if (ctx.atRoot)
        ctx.atRoot = false;
    let offset = bm.offset;
    let commentEnd = null;
    for (const collItem of bm.items) {
        const { start, key, sep, value } = collItem;
        // key properties
        const keyProps = resolveProps(start, {
            indicator: 'explicit-key-ind',
            next: key ?? sep?.[0],
            offset,
            onError,
            parentIndent: bm.indent,
            startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
            if (key) {
                if (key.type === 'block-seq')
                    onError(offset, 'BLOCK_AS_IMPLICIT_KEY', 'A block sequence may not be used as an implicit map key');
                else if ('indent' in key && key.indent !== bm.indent)
                    onError(offset, 'BAD_INDENT', startColMsg);
            }
            if (!keyProps.anchor && !keyProps.tag && !sep) {
                commentEnd = keyProps.end;
                if (keyProps.comment) {
                    if (map.comment)
                        map.comment += '\n' + keyProps.comment;
                    else
                        map.comment = keyProps.comment;
                }
                continue;
            }
            if (keyProps.newlineAfterProp || containsNewline(key)) {
                onError(key ?? start[start.length - 1], 'MULTILINE_IMPLICIT_KEY', 'Implicit keys need to be on a single line');
            }
        }
        else if (keyProps.found?.indent !== bm.indent) {
            onError(offset, 'BAD_INDENT', startColMsg);
        }
        // key value
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key
            ? composeNode(ctx, key, keyProps, onError)
            : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
            flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (mapIncludes(ctx, map.items, keyNode))
            onError(keyStart, 'DUPLICATE_KEY', 'Map keys must be unique');
        // value properties
        const valueProps = resolveProps(sep ?? [], {
            indicator: 'map-value-ind',
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: bm.indent,
            startOnNewline: !key || key.type === 'block-scalar'
        });
        offset = valueProps.end;
        if (valueProps.found) {
            if (implicitKey) {
                if (value?.type === 'block-map' && !valueProps.hasNewline)
                    onError(offset, 'BLOCK_AS_IMPLICIT_KEY', 'Nested mappings are not allowed in compact mappings');
                if (ctx.options.strict &&
                    keyProps.start < valueProps.found.offset - 1024)
                    onError(keyNode.range, 'KEY_OVER_1024_CHARS', 'The : indicator must be at most 1024 chars after the start of an implicit block mapping key');
            }
            // value value
            const valueNode = value
                ? composeNode(ctx, value, valueProps, onError)
                : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
            if (ctx.schema.compat)
                flowIndentCheck(bm.indent, value, onError);
            offset = valueNode.range[2];
            const pair = new Pair(keyNode, valueNode);
            if (ctx.options.keepSourceTokens)
                pair.srcToken = collItem;
            map.items.push(pair);
        }
        else {
            // key with no value
            if (implicitKey)
                onError(keyNode.range, 'MISSING_CHAR', 'Implicit map keys need to be followed by map values');
            if (valueProps.comment) {
                if (keyNode.comment)
                    keyNode.comment += '\n' + valueProps.comment;
                else
                    keyNode.comment = valueProps.comment;
            }
            const pair = new Pair(keyNode);
            if (ctx.options.keepSourceTokens)
                pair.srcToken = collItem;
            map.items.push(pair);
        }
    }
    if (commentEnd && commentEnd < offset)
        onError(commentEnd, 'IMPOSSIBLE', 'Map comment with trailing content');
    map.range = [bm.offset, offset, commentEnd ?? offset];
    return map;
}

function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLSeq;
    const seq = new NodeClass(ctx.schema);
    if (ctx.atRoot)
        ctx.atRoot = false;
    if (ctx.atKey)
        ctx.atKey = false;
    let offset = bs.offset;
    let commentEnd = null;
    for (const { start, value } of bs.items) {
        const props = resolveProps(start, {
            indicator: 'seq-item-ind',
            next: value,
            offset,
            onError,
            parentIndent: bs.indent,
            startOnNewline: true
        });
        if (!props.found) {
            if (props.anchor || props.tag || value) {
                if (value && value.type === 'block-seq')
                    onError(props.end, 'BAD_INDENT', 'All sequence items must start at the same column');
                else
                    onError(offset, 'MISSING_CHAR', 'Sequence item without - indicator');
            }
            else {
                commentEnd = props.end;
                if (props.comment)
                    seq.comment = props.comment;
                continue;
            }
        }
        const node = value
            ? composeNode(ctx, value, props, onError)
            : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
            flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
    }
    seq.range = [bs.offset, offset, commentEnd ?? offset];
    return seq;
}

function resolveEnd(end, offset, reqSpace, onError) {
    let comment = '';
    if (end) {
        let hasSpace = false;
        let sep = '';
        for (const token of end) {
            const { source, type } = token;
            switch (type) {
                case 'space':
                    hasSpace = true;
                    break;
                case 'comment': {
                    if (reqSpace && !hasSpace)
                        onError(token, 'MISSING_CHAR', 'Comments must be separated from other tokens by white space characters');
                    const cb = source.substring(1) || ' ';
                    if (!comment)
                        comment = cb;
                    else
                        comment += sep + cb;
                    sep = '';
                    break;
                }
                case 'newline':
                    if (comment)
                        sep += source;
                    hasSpace = true;
                    break;
                default:
                    onError(token, 'UNEXPECTED_TOKEN', `Unexpected ${type} at node end`);
            }
            offset += source.length;
        }
    }
    return { comment, offset };
}

const blockMsg = 'Block collections are not allowed within flow collections';
const isBlock = (token) => token && (token.type === 'block-map' || token.type === 'block-seq');
function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
    const isMap = fc.start.source === '{';
    const fcName = isMap ? 'flow map' : 'flow sequence';
    const NodeClass = (tag?.nodeClass ?? (isMap ? YAMLMap : YAMLSeq));
    const coll = new NodeClass(ctx.schema);
    coll.flow = true;
    const atRoot = ctx.atRoot;
    if (atRoot)
        ctx.atRoot = false;
    if (ctx.atKey)
        ctx.atKey = false;
    let offset = fc.offset + fc.start.source.length;
    for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep, value } = collItem;
        const props = resolveProps(start, {
            flow: fcName,
            indicator: 'explicit-key-ind',
            next: key ?? sep?.[0],
            offset,
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
        });
        if (!props.found) {
            if (!props.anchor && !props.tag && !sep && !value) {
                if (i === 0 && props.comma)
                    onError(props.comma, 'UNEXPECTED_TOKEN', `Unexpected , in ${fcName}`);
                else if (i < fc.items.length - 1)
                    onError(props.start, 'UNEXPECTED_TOKEN', `Unexpected empty item in ${fcName}`);
                if (props.comment) {
                    if (coll.comment)
                        coll.comment += '\n' + props.comment;
                    else
                        coll.comment = props.comment;
                }
                offset = props.end;
                continue;
            }
            if (!isMap && ctx.options.strict && containsNewline(key))
                onError(key, // checked by containsNewline()
                'MULTILINE_IMPLICIT_KEY', 'Implicit keys of flow sequence pairs need to be on a single line');
        }
        if (i === 0) {
            if (props.comma)
                onError(props.comma, 'UNEXPECTED_TOKEN', `Unexpected , in ${fcName}`);
        }
        else {
            if (!props.comma)
                onError(props.start, 'MISSING_CHAR', `Missing , between ${fcName} items`);
            if (props.comment) {
                let prevItemComment = '';
                loop: for (const st of start) {
                    switch (st.type) {
                        case 'comma':
                        case 'space':
                            break;
                        case 'comment':
                            prevItemComment = st.source.substring(1);
                            break loop;
                        default:
                            break loop;
                    }
                }
                if (prevItemComment) {
                    let prev = coll.items[coll.items.length - 1];
                    if (isPair(prev))
                        prev = prev.value ?? prev.key;
                    if (prev.comment)
                        prev.comment += '\n' + prevItemComment;
                    else
                        prev.comment = prevItemComment;
                    props.comment = props.comment.substring(prevItemComment.length + 1);
                }
            }
        }
        if (!isMap && !sep && !props.found) {
            // item is a value in a seq
            // → key & sep are empty, start does not include ? or :
            const valueNode = value
                ? composeNode(ctx, value, props, onError)
                : composeEmptyNode(ctx, props.end, sep, null, props, onError);
            coll.items.push(valueNode);
            offset = valueNode.range[2];
            if (isBlock(value))
                onError(valueNode.range, 'BLOCK_IN_FLOW', blockMsg);
        }
        else {
            // item is a key+value pair
            // key value
            ctx.atKey = true;
            const keyStart = props.end;
            const keyNode = key
                ? composeNode(ctx, key, props, onError)
                : composeEmptyNode(ctx, keyStart, start, null, props, onError);
            if (isBlock(key))
                onError(keyNode.range, 'BLOCK_IN_FLOW', blockMsg);
            ctx.atKey = false;
            // value properties
            const valueProps = resolveProps(sep ?? [], {
                flow: fcName,
                indicator: 'map-value-ind',
                next: value,
                offset: keyNode.range[2],
                onError,
                parentIndent: fc.indent,
                startOnNewline: false
            });
            if (valueProps.found) {
                if (!isMap && !props.found && ctx.options.strict) {
                    if (sep)
                        for (const st of sep) {
                            if (st === valueProps.found)
                                break;
                            if (st.type === 'newline') {
                                onError(st, 'MULTILINE_IMPLICIT_KEY', 'Implicit keys of flow sequence pairs need to be on a single line');
                                break;
                            }
                        }
                    if (props.start < valueProps.found.offset - 1024)
                        onError(valueProps.found, 'KEY_OVER_1024_CHARS', 'The : indicator must be at most 1024 chars after the start of an implicit flow sequence key');
                }
            }
            else if (value) {
                if ('source' in value && value.source && value.source[0] === ':')
                    onError(value, 'MISSING_CHAR', `Missing space after : in ${fcName}`);
                else
                    onError(valueProps.start, 'MISSING_CHAR', `Missing , or : between ${fcName} items`);
            }
            // value value
            const valueNode = value
                ? composeNode(ctx, value, valueProps, onError)
                : valueProps.found
                    ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError)
                    : null;
            if (valueNode) {
                if (isBlock(value))
                    onError(valueNode.range, 'BLOCK_IN_FLOW', blockMsg);
            }
            else if (valueProps.comment) {
                if (keyNode.comment)
                    keyNode.comment += '\n' + valueProps.comment;
                else
                    keyNode.comment = valueProps.comment;
            }
            const pair = new Pair(keyNode, valueNode);
            if (ctx.options.keepSourceTokens)
                pair.srcToken = collItem;
            if (isMap) {
                const map = coll;
                if (mapIncludes(ctx, map.items, keyNode))
                    onError(keyStart, 'DUPLICATE_KEY', 'Map keys must be unique');
                map.items.push(pair);
            }
            else {
                const map = new YAMLMap(ctx.schema);
                map.flow = true;
                map.items.push(pair);
                const endRange = (valueNode ?? keyNode).range;
                map.range = [keyNode.range[0], endRange[1], endRange[2]];
                coll.items.push(map);
            }
            offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
    }
    const expectedEnd = isMap ? '}' : ']';
    const [ce, ...ee] = fc.end;
    let cePos = offset;
    if (ce && ce.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
    else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot
            ? `${name} must end with a ${expectedEnd}`
            : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? 'MISSING_CHAR' : 'BAD_INDENT', msg);
        if (ce && ce.source.length !== 1)
            ee.unshift(ce);
    }
    if (ee.length > 0) {
        const end = resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
            if (coll.comment)
                coll.comment += '\n' + end.comment;
            else
                coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
    }
    else {
        coll.range = [fc.offset, cePos, cePos];
    }
    return coll;
}

function resolveCollection(CN, ctx, token, onError, tagName, tag) {
    const coll = token.type === 'block-map'
        ? resolveBlockMap(CN, ctx, token, onError, tag)
        : token.type === 'block-seq'
            ? resolveBlockSeq(CN, ctx, token, onError, tag)
            : resolveFlowCollection(CN, ctx, token, onError, tag);
    const Coll = coll.constructor;
    // If we got a tagName matching the class, or the tag name is '!',
    // then use the tagName from the node class used to create it.
    if (tagName === '!' || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
    }
    if (tagName)
        coll.tag = tagName;
    return coll;
}
function composeCollection(CN, ctx, token, props, onError) {
    const tagToken = props.tag;
    const tagName = !tagToken
        ? null
        : ctx.directives.tagName(tagToken.source, msg => onError(tagToken, 'TAG_RESOLVE_FAILED', msg));
    if (token.type === 'block-seq') {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken
            ? anchor.offset > tagToken.offset
                ? anchor
                : tagToken
            : (anchor ?? tagToken);
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
            const message = 'Missing newline after block sequence props';
            onError(lastProp, 'MISSING_CHAR', message);
        }
    }
    const expType = token.type === 'block-map'
        ? 'map'
        : token.type === 'block-seq'
            ? 'seq'
            : token.start.source === '{'
                ? 'map'
                : 'seq';
    // shortcut: check if it's a generic YAMLMap or YAMLSeq
    // before jumping into the custom tag logic.
    if (!tagToken ||
        !tagName ||
        tagName === '!' ||
        (tagName === YAMLMap.tagName && expType === 'map') ||
        (tagName === YAMLSeq.tagName && expType === 'seq')) {
        return resolveCollection(CN, ctx, token, onError, tagName);
    }
    let tag = ctx.schema.tags.find(t => t.tag === tagName && t.collection === expType);
    if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt && kt.collection === expType) {
            ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
            tag = kt;
        }
        else {
            if (kt) {
                onError(tagToken, 'BAD_COLLECTION_TYPE', `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? 'scalar'}`, true);
            }
            else {
                onError(tagToken, 'TAG_RESOLVE_FAILED', `Unresolved tag: ${tagName}`, true);
            }
            return resolveCollection(CN, ctx, token, onError, tagName);
        }
    }
    const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
    const res = tag.resolve?.(coll, msg => onError(tagToken, 'TAG_RESOLVE_FAILED', msg), ctx.options) ?? coll;
    const node = isNode(res)
        ? res
        : new Scalar(res);
    node.range = coll.range;
    node.tag = tagName;
    if (tag?.format)
        node.format = tag.format;
    return node;
}

function resolveBlockScalar(ctx, scalar, onError) {
    const start = scalar.offset;
    const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
    if (!header)
        return { value: '', type: null, comment: '', range: [start, start, start] };
    const type = header.mode === '>' ? Scalar.BLOCK_FOLDED : Scalar.BLOCK_LITERAL;
    const lines = scalar.source ? splitLines(scalar.source) : [];
    // determine the end of content & start of chomping
    let chompStart = lines.length;
    for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === '' || content === '\r')
            chompStart = i;
        else
            break;
    }
    // shortcut for empty contents
    if (chompStart === 0) {
        const value = header.chomp === '+' && lines.length > 0
            ? '\n'.repeat(Math.max(1, lines.length - 1))
            : '';
        let end = start + header.length;
        if (scalar.source)
            end += scalar.source.length;
        return { value, type, comment: header.comment, range: [start, end, end] };
    }
    // find the indentation level to trim from start
    let trimIndent = scalar.indent + header.indent;
    let offset = scalar.offset + header.length;
    let contentStart = 0;
    for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === '' || content === '\r') {
            if (header.indent === 0 && indent.length > trimIndent)
                trimIndent = indent.length;
        }
        else {
            if (indent.length < trimIndent) {
                const message = 'Block scalars with more-indented leading empty lines must use an explicit indentation indicator';
                onError(offset + indent.length, 'MISSING_CHAR', message);
            }
            if (header.indent === 0)
                trimIndent = indent.length;
            contentStart = i;
            if (trimIndent === 0 && !ctx.atRoot) {
                const message = 'Block scalar values in collections must be indented';
                onError(offset, 'BAD_INDENT', message);
            }
            break;
        }
        offset += indent.length + content.length + 1;
    }
    // include trailing more-indented empty lines in content
    for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
            chompStart = i + 1;
    }
    let value = '';
    let sep = '';
    let prevMoreIndented = false;
    // leading whitespace is kept intact
    for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + '\n';
    for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === '\r';
        if (crlf)
            content = content.slice(0, -1);
        /* istanbul ignore if already caught in lexer */
        if (content && indent.length < trimIndent) {
            const src = header.indent
                ? 'explicit indentation indicator'
                : 'first line';
            const message = `Block scalar lines must not be less indented than their ${src}`;
            onError(offset - content.length - (crlf ? 2 : 1), 'BAD_INDENT', message);
            indent = '';
        }
        if (type === Scalar.BLOCK_LITERAL) {
            value += sep + indent.slice(trimIndent) + content;
            sep = '\n';
        }
        else if (indent.length > trimIndent || content[0] === '\t') {
            // more-indented content within a folded block
            if (sep === ' ')
                sep = '\n';
            else if (!prevMoreIndented && sep === '\n')
                sep = '\n\n';
            value += sep + indent.slice(trimIndent) + content;
            sep = '\n';
            prevMoreIndented = true;
        }
        else if (content === '') {
            // empty line
            if (sep === '\n')
                value += '\n';
            else
                sep = '\n';
        }
        else {
            value += sep + content;
            sep = ' ';
            prevMoreIndented = false;
        }
    }
    switch (header.chomp) {
        case '-':
            break;
        case '+':
            for (let i = chompStart; i < lines.length; ++i)
                value += '\n' + lines[i][0].slice(trimIndent);
            if (value[value.length - 1] !== '\n')
                value += '\n';
            break;
        default:
            value += '\n';
    }
    const end = start + header.length + scalar.source.length;
    return { value, type, comment: header.comment, range: [start, end, end] };
}
function parseBlockScalarHeader({ offset, props }, strict, onError) {
    /* istanbul ignore if should not happen */
    if (props[0].type !== 'block-scalar-header') {
        onError(props[0], 'IMPOSSIBLE', 'Block scalar header not found');
        return null;
    }
    const { source } = props[0];
    const mode = source[0];
    let indent = 0;
    let chomp = '';
    let error = -1;
    for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === '-' || ch === '+'))
            chomp = ch;
        else {
            const n = Number(ch);
            if (!indent && n)
                indent = n;
            else if (error === -1)
                error = offset + i;
        }
    }
    if (error !== -1)
        onError(error, 'UNEXPECTED_TOKEN', `Block scalar header includes extra characters: ${source}`);
    let hasSpace = false;
    let comment = '';
    let length = source.length;
    for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
            case 'space':
                hasSpace = true;
            // fallthrough
            case 'newline':
                length += token.source.length;
                break;
            case 'comment':
                if (strict && !hasSpace) {
                    const message = 'Comments must be separated from other tokens by white space characters';
                    onError(token, 'MISSING_CHAR', message);
                }
                length += token.source.length;
                comment = token.source.substring(1);
                break;
            case 'error':
                onError(token, 'UNEXPECTED_TOKEN', token.message);
                length += token.source.length;
                break;
            /* istanbul ignore next should not happen */
            default: {
                const message = `Unexpected token in block scalar header: ${token.type}`;
                onError(token, 'UNEXPECTED_TOKEN', message);
                const ts = token.source;
                if (ts && typeof ts === 'string')
                    length += ts.length;
            }
        }
    }
    return { mode, indent, chomp, comment, length };
}
/** @returns Array of lines split up as `[indent, content]` */
function splitLines(source) {
    const split = source.split(/\n( *)/);
    const first = split[0];
    const m = first.match(/^( *)/);
    const line0 = m?.[1]
        ? [m[1], first.slice(m[1].length)]
        : ['', first];
    const lines = [line0];
    for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
    return lines;
}

function resolveFlowScalar(scalar, strict, onError) {
    const { offset, type, source, end } = scalar;
    let _type;
    let value;
    const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
    switch (type) {
        case 'scalar':
            _type = Scalar.PLAIN;
            value = plainValue(source, _onError);
            break;
        case 'single-quoted-scalar':
            _type = Scalar.QUOTE_SINGLE;
            value = singleQuotedValue(source, _onError);
            break;
        case 'double-quoted-scalar':
            _type = Scalar.QUOTE_DOUBLE;
            value = doubleQuotedValue(source, _onError);
            break;
        /* istanbul ignore next should not happen */
        default:
            onError(scalar, 'UNEXPECTED_TOKEN', `Expected a flow scalar value, but found: ${type}`);
            return {
                value: '',
                type: null,
                comment: '',
                range: [offset, offset + source.length, offset + source.length]
            };
    }
    const valueEnd = offset + source.length;
    const re = resolveEnd(end, valueEnd, strict, onError);
    return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
    };
}
function plainValue(source, onError) {
    let badChar = '';
    switch (source[0]) {
        /* istanbul ignore next should not happen */
        case '\t':
            badChar = 'a tab character';
            break;
        case ',':
            badChar = 'flow indicator character ,';
            break;
        case '%':
            badChar = 'directive indicator character %';
            break;
        case '|':
        case '>': {
            badChar = `block scalar indicator ${source[0]}`;
            break;
        }
        case '@':
        case '`': {
            badChar = `reserved character ${source[0]}`;
            break;
        }
    }
    if (badChar)
        onError(0, 'BAD_SCALAR_START', `Plain value cannot start with ${badChar}`);
    return foldLines(source);
}
function singleQuotedValue(source, onError) {
    if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, 'MISSING_CHAR', "Missing closing 'quote");
    return foldLines(source.slice(1, -1)).replace(/''/g, "'");
}
function foldLines(source) {
    /**
     * The negative lookbehind here and in the `re` RegExp is to
     * prevent causing a polynomial search time in certain cases.
     *
     * The try-catch is for Safari, which doesn't support this yet:
     * https://caniuse.com/js-regexp-lookbehind
     */
    let first, line;
    try {
        first = new RegExp('(.*?)(?<![ \t])[ \t]*\r?\n', 'sy');
        line = new RegExp('[ \t]*(.*?)(?:(?<![ \t])[ \t]*)?\r?\n', 'sy');
    }
    catch {
        first = /(.*?)[ \t]*\r?\n/sy;
        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
    }
    let match = first.exec(source);
    if (!match)
        return source;
    let res = match[1];
    let sep = ' ';
    let pos = first.lastIndex;
    line.lastIndex = pos;
    while ((match = line.exec(source))) {
        if (match[1] === '') {
            if (sep === '\n')
                res += sep;
            else
                sep = '\n';
        }
        else {
            res += sep + match[1];
            sep = ' ';
        }
        pos = line.lastIndex;
    }
    const last = /[ \t]*(.*)/sy;
    last.lastIndex = pos;
    match = last.exec(source);
    return res + sep + (match?.[1] ?? '');
}
function doubleQuotedValue(source, onError) {
    let res = '';
    for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === '\r' && source[i + 1] === '\n')
            continue;
        if (ch === '\n') {
            const { fold, offset } = foldNewline(source, i);
            res += fold;
            i = offset;
        }
        else if (ch === '\\') {
            let next = source[++i];
            const cc = escapeCodes[next];
            if (cc)
                res += cc;
            else if (next === '\n') {
                // skip escaped newlines, but still trim the following line
                next = source[i + 1];
                while (next === ' ' || next === '\t')
                    next = source[++i + 1];
            }
            else if (next === '\r' && source[i + 1] === '\n') {
                // skip escaped CRLF newlines, but still trim the following line
                next = source[++i + 1];
                while (next === ' ' || next === '\t')
                    next = source[++i + 1];
            }
            else if (next === 'x' || next === 'u' || next === 'U') {
                const length = { x: 2, u: 4, U: 8 }[next];
                res += parseCharCode(source, i + 1, length, onError);
                i += length;
            }
            else {
                const raw = source.substr(i - 1, 2);
                onError(i - 1, 'BAD_DQ_ESCAPE', `Invalid escape sequence ${raw}`);
                res += raw;
            }
        }
        else if (ch === ' ' || ch === '\t') {
            // trim trailing whitespace
            const wsStart = i;
            let next = source[i + 1];
            while (next === ' ' || next === '\t')
                next = source[++i + 1];
            if (next !== '\n' && !(next === '\r' && source[i + 2] === '\n'))
                res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        }
        else {
            res += ch;
        }
    }
    if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, 'MISSING_CHAR', 'Missing closing "quote');
    return res;
}
/**
 * Fold a single newline into a space, multiple newlines to N - 1 newlines.
 * Presumes `source[offset] === '\n'`
 */
function foldNewline(source, offset) {
    let fold = '';
    let ch = source[offset + 1];
    while (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        if (ch === '\r' && source[offset + 2] !== '\n')
            break;
        if (ch === '\n')
            fold += '\n';
        offset += 1;
        ch = source[offset + 1];
    }
    if (!fold)
        fold = ' ';
    return { fold, offset };
}
const escapeCodes = {
    '0': '\0', // null character
    a: '\x07', // bell character
    b: '\b', // backspace
    e: '\x1b', // escape character
    f: '\f', // form feed
    n: '\n', // line feed
    r: '\r', // carriage return
    t: '\t', // horizontal tab
    v: '\v', // vertical tab
    N: '\u0085', // Unicode next line
    _: '\u00a0', // Unicode non-breaking space
    L: '\u2028', // Unicode line separator
    P: '\u2029', // Unicode paragraph separator
    ' ': ' ',
    '"': '"',
    '/': '/',
    '\\': '\\',
    '\t': '\t'
};
function parseCharCode(source, offset, length, onError) {
    const cc = source.substr(offset, length);
    const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
    const code = ok ? parseInt(cc, 16) : NaN;
    if (isNaN(code)) {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, 'BAD_DQ_ESCAPE', `Invalid escape sequence ${raw}`);
        return raw;
    }
    return String.fromCodePoint(code);
}

function composeScalar(ctx, token, tagToken, onError) {
    const { value, type, comment, range } = token.type === 'block-scalar'
        ? resolveBlockScalar(ctx, token, onError)
        : resolveFlowScalar(token, ctx.options.strict, onError);
    const tagName = tagToken
        ? ctx.directives.tagName(tagToken.source, msg => onError(tagToken, 'TAG_RESOLVE_FAILED', msg))
        : null;
    let tag;
    if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[SCALAR$1];
    }
    else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
    else if (token.type === 'scalar')
        tag = findScalarTagByTest(ctx, value, token, onError);
    else
        tag = ctx.schema[SCALAR$1];
    let scalar;
    try {
        const res = tag.resolve(value, msg => onError(tagToken ?? token, 'TAG_RESOLVE_FAILED', msg), ctx.options);
        scalar = isScalar$1(res) ? res : new Scalar(res);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, 'TAG_RESOLVE_FAILED', msg);
        scalar = new Scalar(value);
    }
    scalar.range = range;
    scalar.source = value;
    if (type)
        scalar.type = type;
    if (tagName)
        scalar.tag = tagName;
    if (tag.format)
        scalar.format = tag.format;
    if (comment)
        scalar.comment = comment;
    return scalar;
}
function findScalarTagByName(schema, value, tagName, tagToken, onError) {
    if (tagName === '!')
        return schema[SCALAR$1]; // non-specific tag
    const matchWithTest = [];
    for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
            if (tag.default && tag.test)
                matchWithTest.push(tag);
            else
                return tag;
        }
    }
    for (const tag of matchWithTest)
        if (tag.test?.test(value))
            return tag;
    const kt = schema.knownTags[tagName];
    if (kt && !kt.collection) {
        // Ensure that the known tag is available for stringifying,
        // but does not get used by default.
        schema.tags.push(Object.assign({}, kt, { default: false, test: undefined }));
        return kt;
    }
    onError(tagToken, 'TAG_RESOLVE_FAILED', `Unresolved tag: ${tagName}`, tagName !== 'tag:yaml.org,2002:str');
    return schema[SCALAR$1];
}
function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
    const tag = schema.tags.find(tag => (tag.default === true || (atKey && tag.default === 'key')) &&
        tag.test?.test(value)) || schema[SCALAR$1];
    if (schema.compat) {
        const compat = schema.compat.find(tag => tag.default && tag.test?.test(value)) ??
            schema[SCALAR$1];
        if (tag.tag !== compat.tag) {
            const ts = directives.tagString(tag.tag);
            const cs = directives.tagString(compat.tag);
            const msg = `Value may be parsed as either ${ts} or ${cs}`;
            onError(token, 'TAG_RESOLVE_FAILED', msg, true);
        }
    }
    return tag;
}

function emptyScalarPosition(offset, before, pos) {
    if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
            let st = before[i];
            switch (st.type) {
                case 'space':
                case 'comment':
                case 'newline':
                    offset -= st.source.length;
                    continue;
            }
            // Technically, an empty scalar is immediately after the last non-empty
            // node, but it's more useful to place it after any whitespace.
            st = before[++i];
            while (st?.type === 'space') {
                offset += st.source.length;
                st = before[++i];
            }
            break;
        }
    }
    return offset;
}

const CN = { composeNode, composeEmptyNode };
function composeNode(ctx, token, props, onError) {
    const atKey = ctx.atKey;
    const { spaceBefore, comment, anchor, tag } = props;
    let node;
    let isSrcToken = true;
    switch (token.type) {
        case 'alias':
            node = composeAlias(ctx, token, onError);
            if (anchor || tag)
                onError(token, 'ALIAS_PROPS', 'An alias node must not specify any properties');
            break;
        case 'scalar':
        case 'single-quoted-scalar':
        case 'double-quoted-scalar':
        case 'block-scalar':
            node = composeScalar(ctx, token, tag, onError);
            if (anchor)
                node.anchor = anchor.source.substring(1);
            break;
        case 'block-map':
        case 'block-seq':
        case 'flow-collection':
            node = composeCollection(CN, ctx, token, props, onError);
            if (anchor)
                node.anchor = anchor.source.substring(1);
            break;
        default: {
            const message = token.type === 'error'
                ? token.message
                : `Unsupported token (type: ${token.type})`;
            onError(token, 'UNEXPECTED_TOKEN', message);
            node = composeEmptyNode(ctx, token.offset, undefined, null, props, onError);
            isSrcToken = false;
        }
    }
    if (anchor && node.anchor === '')
        onError(anchor, 'BAD_ALIAS', 'Anchor cannot be an empty string');
    if (atKey &&
        ctx.options.stringKeys &&
        (!isScalar$1(node) ||
            typeof node.value !== 'string' ||
            (node.tag && node.tag !== 'tag:yaml.org,2002:str'))) {
        const msg = 'With stringKeys, all keys must be strings';
        onError(tag ?? token, 'NON_STRING_KEY', msg);
    }
    if (spaceBefore)
        node.spaceBefore = true;
    if (comment) {
        if (token.type === 'scalar' && token.source === '')
            node.comment = comment;
        else
            node.commentBefore = comment;
    }
    // @ts-expect-error Type checking misses meaning of isSrcToken
    if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
    return node;
}
function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
    const token = {
        type: 'scalar',
        offset: emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ''
    };
    const node = composeScalar(ctx, token, tag, onError);
    if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === '')
            onError(anchor, 'BAD_ALIAS', 'Anchor cannot be an empty string');
    }
    if (spaceBefore)
        node.spaceBefore = true;
    if (comment) {
        node.comment = comment;
        node.range[2] = end;
    }
    return node;
}
function composeAlias({ options }, { offset, source, end }, onError) {
    const alias = new Alias(source.substring(1));
    if (alias.source === '')
        onError(offset, 'BAD_ALIAS', 'Alias cannot be an empty string');
    if (alias.source.endsWith(':'))
        onError(offset + source.length - 1, 'BAD_ALIAS', 'Alias ending in : is ambiguous', true);
    const valueEnd = offset + source.length;
    const re = resolveEnd(end, valueEnd, options.strict, onError);
    alias.range = [offset, valueEnd, re.offset];
    if (re.comment)
        alias.comment = re.comment;
    return alias;
}

function composeDoc(options, directives, { offset, start, value, end }, onError) {
    const opts = Object.assign({ _directives: directives }, options);
    const doc = new Document(undefined, opts);
    const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
    };
    const props = resolveProps(start, {
        indicator: 'doc-start',
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
    });
    if (props.found) {
        doc.directives.docStart = true;
        if (value &&
            (value.type === 'block-map' || value.type === 'block-seq') &&
            !props.hasNewline)
            onError(props.end, 'MISSING_CHAR', 'Block collection cannot start on same line with directives-end marker');
    }
    // @ts-expect-error If Contents is set, let's trust the user
    doc.contents = value
        ? composeNode(ctx, value, props, onError)
        : composeEmptyNode(ctx, props.end, start, null, props, onError);
    const contentEnd = doc.contents.range[2];
    const re = resolveEnd(end, contentEnd, false, onError);
    if (re.comment)
        doc.comment = re.comment;
    doc.range = [offset, contentEnd, re.offset];
    return doc;
}

function getErrorPos(src) {
    if (typeof src === 'number')
        return [src, src + 1];
    if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
    const { offset, source } = src;
    return [offset, offset + (typeof source === 'string' ? source.length : 1)];
}
function parsePrelude(prelude) {
    let comment = '';
    let atComment = false;
    let afterEmptyLine = false;
    for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
            case '#':
                comment +=
                    (comment === '' ? '' : afterEmptyLine ? '\n\n' : '\n') +
                        (source.substring(1) || ' ');
                atComment = true;
                afterEmptyLine = false;
                break;
            case '%':
                if (prelude[i + 1]?.[0] !== '#')
                    i += 1;
                atComment = false;
                break;
            default:
                // This may be wrong after doc-end, but in that case it doesn't matter
                if (!atComment)
                    afterEmptyLine = true;
                atComment = false;
        }
    }
    return { comment, afterEmptyLine };
}
/**
 * Compose a stream of CST nodes into a stream of YAML Documents.
 *
 * ```ts
 * import { Composer, Parser } from 'yaml'
 *
 * const src: string = ...
 * const tokens = new Parser().parse(src)
 * const docs = new Composer().compose(tokens)
 * ```
 */
class Composer {
    constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
            const pos = getErrorPos(source);
            if (warning)
                this.warnings.push(new YAMLWarning(pos, code, message));
            else
                this.errors.push(new YAMLParseError(pos, code, message));
        };
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        this.directives = new Directives({ version: options.version || '1.2' });
        this.options = options;
    }
    decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        //console.log({ dc: doc.comment, prelude, comment })
        if (comment) {
            const dc = doc.contents;
            if (afterDoc) {
                doc.comment = doc.comment ? `${doc.comment}\n${comment}` : comment;
            }
            else if (afterEmptyLine || doc.directives.docStart || !dc) {
                doc.commentBefore = comment;
            }
            else if (isCollection$1(dc) && !dc.flow && dc.items.length > 0) {
                let it = dc.items[0];
                if (isPair(it))
                    it = it.key;
                const cb = it.commentBefore;
                it.commentBefore = cb ? `${comment}\n${cb}` : comment;
            }
            else {
                const cb = dc.commentBefore;
                dc.commentBefore = cb ? `${comment}\n${cb}` : comment;
            }
        }
        if (afterDoc) {
            Array.prototype.push.apply(doc.errors, this.errors);
            Array.prototype.push.apply(doc.warnings, this.warnings);
        }
        else {
            doc.errors = this.errors;
            doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
    }
    /**
     * Current stream status information.
     *
     * Mostly useful at the end of input for an empty stream.
     */
    streamInfo() {
        return {
            comment: parsePrelude(this.prelude).comment,
            directives: this.directives,
            errors: this.errors,
            warnings: this.warnings
        };
    }
    /**
     * Compose tokens into documents.
     *
     * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
     * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
     */
    *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
            yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
    }
    /** Advance the composer by one CST token. */
    *next(token) {
        switch (token.type) {
            case 'directive':
                this.directives.add(token.source, (offset, message, warning) => {
                    const pos = getErrorPos(token);
                    pos[0] += offset;
                    this.onError(pos, 'BAD_DIRECTIVE', message, warning);
                });
                this.prelude.push(token.source);
                this.atDirectives = true;
                break;
            case 'document': {
                const doc = composeDoc(this.options, this.directives, token, this.onError);
                if (this.atDirectives && !doc.directives.docStart)
                    this.onError(token, 'MISSING_CHAR', 'Missing directives-end/doc-start indicator line');
                this.decorate(doc, false);
                if (this.doc)
                    yield this.doc;
                this.doc = doc;
                this.atDirectives = false;
                break;
            }
            case 'byte-order-mark':
            case 'space':
                break;
            case 'comment':
            case 'newline':
                this.prelude.push(token.source);
                break;
            case 'error': {
                const msg = token.source
                    ? `${token.message}: ${JSON.stringify(token.source)}`
                    : token.message;
                const error = new YAMLParseError(getErrorPos(token), 'UNEXPECTED_TOKEN', msg);
                if (this.atDirectives || !this.doc)
                    this.errors.push(error);
                else
                    this.doc.errors.push(error);
                break;
            }
            case 'doc-end': {
                if (!this.doc) {
                    const msg = 'Unexpected doc-end without preceding document';
                    this.errors.push(new YAMLParseError(getErrorPos(token), 'UNEXPECTED_TOKEN', msg));
                    break;
                }
                this.doc.directives.docEnd = true;
                const end = resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
                this.decorate(this.doc, true);
                if (end.comment) {
                    const dc = this.doc.comment;
                    this.doc.comment = dc ? `${dc}\n${end.comment}` : end.comment;
                }
                this.doc.range[2] = end.offset;
                break;
            }
            default:
                this.errors.push(new YAMLParseError(getErrorPos(token), 'UNEXPECTED_TOKEN', `Unsupported token ${token.type}`));
        }
    }
    /**
     * Call at end of input to yield any remaining document.
     *
     * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
     * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
     */
    *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
            this.decorate(this.doc, true);
            yield this.doc;
            this.doc = null;
        }
        else if (forceDoc) {
            const opts = Object.assign({ _directives: this.directives }, this.options);
            const doc = new Document(undefined, opts);
            if (this.atDirectives)
                this.onError(endOffset, 'MISSING_CHAR', 'Missing directives-end indicator line');
            doc.range = [0, endOffset, endOffset];
            this.decorate(doc, false);
            yield doc;
        }
    }
}

function resolveAsScalar(token, strict = true, onError) {
    if (token) {
        const _onError = (pos, code, message) => {
            const offset = typeof pos === 'number' ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
            if (onError)
                onError(offset, code, message);
            else
                throw new YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
            case 'scalar':
            case 'single-quoted-scalar':
            case 'double-quoted-scalar':
                return resolveFlowScalar(token, strict, _onError);
            case 'block-scalar':
                return resolveBlockScalar({ options: { strict } }, token, _onError);
        }
    }
    return null;
}
/**
 * Create a new scalar token with `value`
 *
 * Values that represent an actual string but may be parsed as a different type should use a `type` other than `'PLAIN'`,
 * as this function does not support any schema operations and won't check for such conflicts.
 *
 * @param value The string representation of the value, which will have its content properly indented.
 * @param context.end Comments and whitespace after the end of the value, or after the block scalar header. If undefined, a newline will be added.
 * @param context.implicitKey Being within an implicit key may affect the resolved type of the token's value.
 * @param context.indent The indent level of the token.
 * @param context.inFlow Is this scalar within a flow collection? This may affect the resolved type of the token's value.
 * @param context.offset The offset position of the token.
 * @param context.type The preferred type of the scalar token. If undefined, the previous type of the `token` will be used, defaulting to `'PLAIN'`.
 */
function createScalarToken(value, context) {
    const { implicitKey = false, indent, inFlow = false, offset = -1, type = 'PLAIN' } = context;
    const source = stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? ' '.repeat(indent) : '',
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
    });
    const end = context.end ?? [
        { type: 'newline', offset: -1, indent, source: '\n' }
    ];
    switch (source[0]) {
        case '|':
        case '>': {
            const he = source.indexOf('\n');
            const head = source.substring(0, he);
            const body = source.substring(he + 1) + '\n';
            const props = [
                { type: 'block-scalar-header', offset, indent, source: head }
            ];
            if (!addEndtoBlockProps(props, end))
                props.push({ type: 'newline', offset: -1, indent, source: '\n' });
            return { type: 'block-scalar', offset, indent, props, source: body };
        }
        case '"':
            return { type: 'double-quoted-scalar', offset, indent, source, end };
        case "'":
            return { type: 'single-quoted-scalar', offset, indent, source, end };
        default:
            return { type: 'scalar', offset, indent, source, end };
    }
}
/**
 * Set the value of `token` to the given string `value`, overwriting any previous contents and type that it may have.
 *
 * Best efforts are made to retain any comments previously associated with the `token`,
 * though all contents within a collection's `items` will be overwritten.
 *
 * Values that represent an actual string but may be parsed as a different type should use a `type` other than `'PLAIN'`,
 * as this function does not support any schema operations and won't check for such conflicts.
 *
 * @param token Any token. If it does not include an `indent` value, the value will be stringified as if it were an implicit key.
 * @param value The string representation of the value, which will have its content properly indented.
 * @param context.afterKey In most cases, values after a key should have an additional level of indentation.
 * @param context.implicitKey Being within an implicit key may affect the resolved type of the token's value.
 * @param context.inFlow Being within a flow collection may affect the resolved type of the token's value.
 * @param context.type The preferred type of the scalar token. If undefined, the previous type of the `token` will be used, defaulting to `'PLAIN'`.
 */
function setScalarValue(token, value, context = {}) {
    let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
    let indent = 'indent' in token ? token.indent : null;
    if (afterKey && typeof indent === 'number')
        indent += 2;
    if (!type)
        switch (token.type) {
            case 'single-quoted-scalar':
                type = 'QUOTE_SINGLE';
                break;
            case 'double-quoted-scalar':
                type = 'QUOTE_DOUBLE';
                break;
            case 'block-scalar': {
                const header = token.props[0];
                if (header.type !== 'block-scalar-header')
                    throw new Error('Invalid block scalar header');
                type = header.source[0] === '>' ? 'BLOCK_FOLDED' : 'BLOCK_LITERAL';
                break;
            }
            default:
                type = 'PLAIN';
        }
    const source = stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? ' '.repeat(indent) : '',
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
    });
    switch (source[0]) {
        case '|':
        case '>':
            setBlockScalarValue(token, source);
            break;
        case '"':
            setFlowScalarValue(token, source, 'double-quoted-scalar');
            break;
        case "'":
            setFlowScalarValue(token, source, 'single-quoted-scalar');
            break;
        default:
            setFlowScalarValue(token, source, 'scalar');
    }
}
function setBlockScalarValue(token, source) {
    const he = source.indexOf('\n');
    const head = source.substring(0, he);
    const body = source.substring(he + 1) + '\n';
    if (token.type === 'block-scalar') {
        const header = token.props[0];
        if (header.type !== 'block-scalar-header')
            throw new Error('Invalid block scalar header');
        header.source = head;
        token.source = body;
    }
    else {
        const { offset } = token;
        const indent = 'indent' in token ? token.indent : -1;
        const props = [
            { type: 'block-scalar-header', offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, 'end' in token ? token.end : undefined))
            props.push({ type: 'newline', offset: -1, indent, source: '\n' });
        for (const key of Object.keys(token))
            if (key !== 'type' && key !== 'offset')
                delete token[key];
        Object.assign(token, { type: 'block-scalar', indent, props, source: body });
    }
}
/** @returns `true` if last token is a newline */
function addEndtoBlockProps(props, end) {
    if (end)
        for (const st of end)
            switch (st.type) {
                case 'space':
                case 'comment':
                    props.push(st);
                    break;
                case 'newline':
                    props.push(st);
                    return true;
            }
    return false;
}
function setFlowScalarValue(token, source, type) {
    switch (token.type) {
        case 'scalar':
        case 'double-quoted-scalar':
        case 'single-quoted-scalar':
            token.type = type;
            token.source = source;
            break;
        case 'block-scalar': {
            const end = token.props.slice(1);
            let oa = source.length;
            if (token.props[0].type === 'block-scalar-header')
                oa -= token.props[0].source.length;
            for (const tok of end)
                tok.offset += oa;
            delete token.props;
            Object.assign(token, { type, source, end });
            break;
        }
        case 'block-map':
        case 'block-seq': {
            const offset = token.offset + source.length;
            const nl = { type: 'newline', offset, indent: token.indent, source: '\n' };
            delete token.items;
            Object.assign(token, { type, source, end: [nl] });
            break;
        }
        default: {
            const indent = 'indent' in token ? token.indent : -1;
            const end = 'end' in token && Array.isArray(token.end)
                ? token.end.filter(st => st.type === 'space' ||
                    st.type === 'comment' ||
                    st.type === 'newline')
                : [];
            for (const key of Object.keys(token))
                if (key !== 'type' && key !== 'offset')
                    delete token[key];
            Object.assign(token, { type, indent, source, end });
        }
    }
}

/**
 * Stringify a CST document, token, or collection item
 *
 * Fair warning: This applies no validation whatsoever, and
 * simply concatenates the sources in their logical order.
 */
const stringify$1 = (cst) => 'type' in cst ? stringifyToken(cst) : stringifyItem(cst);
function stringifyToken(token) {
    switch (token.type) {
        case 'block-scalar': {
            let res = '';
            for (const tok of token.props)
                res += stringifyToken(tok);
            return res + token.source;
        }
        case 'block-map':
        case 'block-seq': {
            let res = '';
            for (const item of token.items)
                res += stringifyItem(item);
            return res;
        }
        case 'flow-collection': {
            let res = token.start.source;
            for (const item of token.items)
                res += stringifyItem(item);
            for (const st of token.end)
                res += st.source;
            return res;
        }
        case 'document': {
            let res = stringifyItem(token);
            if (token.end)
                for (const st of token.end)
                    res += st.source;
            return res;
        }
        default: {
            let res = token.source;
            if ('end' in token && token.end)
                for (const st of token.end)
                    res += st.source;
            return res;
        }
    }
}
function stringifyItem({ start, key, sep, value }) {
    let res = '';
    for (const st of start)
        res += st.source;
    if (key)
        res += stringifyToken(key);
    if (sep)
        for (const st of sep)
            res += st.source;
    if (value)
        res += stringifyToken(value);
    return res;
}

const BREAK = Symbol('break visit');
const SKIP = Symbol('skip children');
const REMOVE = Symbol('remove item');
/**
 * Apply a visitor to a CST document or item.
 *
 * Walks through the tree (depth-first) starting from the root, calling a
 * `visitor` function with two arguments when entering each item:
 *   - `item`: The current item, which included the following members:
 *     - `start: SourceToken[]` – Source tokens before the key or value,
 *       possibly including its anchor or tag.
 *     - `key?: Token | null` – Set for pair values. May then be `null`, if
 *       the key before the `:` separator is empty.
 *     - `sep?: SourceToken[]` – Source tokens between the key and the value,
 *       which should include the `:` map value indicator if `value` is set.
 *     - `value?: Token` – The value of a sequence item, or of a map pair.
 *   - `path`: The steps from the root to the current node, as an array of
 *     `['key' | 'value', number]` tuples.
 *
 * The return value of the visitor may be used to control the traversal:
 *   - `undefined` (default): Do nothing and continue
 *   - `visit.SKIP`: Do not visit the children of this token, continue with
 *      next sibling
 *   - `visit.BREAK`: Terminate traversal completely
 *   - `visit.REMOVE`: Remove the current item, then continue with the next one
 *   - `number`: Set the index of the next step. This is useful especially if
 *     the index of the current token has changed.
 *   - `function`: Define the next visitor for this item. After the original
 *     visitor is called on item entry, next visitors are called after handling
 *     a non-empty `key` and when exiting the item.
 */
function visit(cst, visitor) {
    if ('type' in cst && cst.type === 'document')
        cst = { start: cst.start, value: cst.value };
    _visit(Object.freeze([]), cst, visitor);
}
// Without the `as symbol` casts, TS declares these in the `visit`
// namespace using `var`, but then complains about that because
// `unique symbol` must be `const`.
/** Terminate visit traversal completely */
visit.BREAK = BREAK;
/** Do not visit the children of the current item */
visit.SKIP = SKIP;
/** Remove the current item */
visit.REMOVE = REMOVE;
/** Find the item at `path` from `cst` as the root */
visit.itemAtPath = (cst, path) => {
    let item = cst;
    for (const [field, index] of path) {
        const tok = item?.[field];
        if (tok && 'items' in tok) {
            item = tok.items[index];
        }
        else
            return undefined;
    }
    return item;
};
/**
 * Get the immediate parent collection of the item at `path` from `cst` as the root.
 *
 * Throws an error if the collection is not found, which should never happen if the item itself exists.
 */
visit.parentCollection = (cst, path) => {
    const parent = visit.itemAtPath(cst, path.slice(0, -1));
    const field = path[path.length - 1][0];
    const coll = parent?.[field];
    if (coll && 'items' in coll)
        return coll;
    throw new Error('Parent collection not found');
};
function _visit(path, item, visitor) {
    let ctrl = visitor(item, path);
    if (typeof ctrl === 'symbol')
        return ctrl;
    for (const field of ['key', 'value']) {
        const token = item[field];
        if (token && 'items' in token) {
            for (let i = 0; i < token.items.length; ++i) {
                const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
                if (typeof ci === 'number')
                    i = ci - 1;
                else if (ci === BREAK)
                    return BREAK;
                else if (ci === REMOVE) {
                    token.items.splice(i, 1);
                    i -= 1;
                }
            }
            if (typeof ctrl === 'function' && field === 'key')
                ctrl = ctrl(item, path);
        }
    }
    return typeof ctrl === 'function' ? ctrl(item, path) : ctrl;
}

/** The byte order mark */
const BOM = '\u{FEFF}';
/** Start of doc-mode */
const DOCUMENT = '\x02'; // C0: Start of Text
/** Unexpected end of flow-mode */
const FLOW_END = '\x18'; // C0: Cancel
/** Next token is a scalar value */
const SCALAR = '\x1f'; // C0: Unit Separator
/** @returns `true` if `token` is a flow or block collection */
const isCollection = (token) => !!token && 'items' in token;
/** @returns `true` if `token` is a flow or block scalar; not an alias */
const isScalar = (token) => !!token &&
    (token.type === 'scalar' ||
        token.type === 'single-quoted-scalar' ||
        token.type === 'double-quoted-scalar' ||
        token.type === 'block-scalar');
/* istanbul ignore next */
/** Get a printable representation of a lexer token */
function prettyToken(token) {
    switch (token) {
        case BOM:
            return '<BOM>';
        case DOCUMENT:
            return '<DOC>';
        case FLOW_END:
            return '<FLOW_END>';
        case SCALAR:
            return '<SCALAR>';
        default:
            return JSON.stringify(token);
    }
}
/** Identify the type of a lexer token. May return `null` for unknown tokens. */
function tokenType(source) {
    switch (source) {
        case BOM:
            return 'byte-order-mark';
        case DOCUMENT:
            return 'doc-mode';
        case FLOW_END:
            return 'flow-error-end';
        case SCALAR:
            return 'scalar';
        case '---':
            return 'doc-start';
        case '...':
            return 'doc-end';
        case '':
        case '\n':
        case '\r\n':
            return 'newline';
        case '-':
            return 'seq-item-ind';
        case '?':
            return 'explicit-key-ind';
        case ':':
            return 'map-value-ind';
        case '{':
            return 'flow-map-start';
        case '}':
            return 'flow-map-end';
        case '[':
            return 'flow-seq-start';
        case ']':
            return 'flow-seq-end';
        case ',':
            return 'comma';
    }
    switch (source[0]) {
        case ' ':
        case '\t':
            return 'space';
        case '#':
            return 'comment';
        case '%':
            return 'directive-line';
        case '*':
            return 'alias';
        case '&':
            return 'anchor';
        case '!':
            return 'tag';
        case "'":
            return 'single-quoted-scalar';
        case '"':
            return 'double-quoted-scalar';
        case '|':
        case '>':
            return 'block-scalar-header';
    }
    return null;
}

const cst = {
	__proto__: null,
	BOM: BOM,
	DOCUMENT: DOCUMENT,
	FLOW_END: FLOW_END,
	SCALAR: SCALAR,
	createScalarToken: createScalarToken,
	isCollection: isCollection,
	isScalar: isScalar,
	prettyToken: prettyToken,
	resolveAsScalar: resolveAsScalar,
	setScalarValue: setScalarValue,
	stringify: stringify$1,
	tokenType: tokenType,
	visit: visit
};

/*
START -> stream

stream
  directive -> line-end -> stream
  indent + line-end -> stream
  [else] -> line-start

line-end
  comment -> line-end
  newline -> .
  input-end -> END

line-start
  doc-start -> doc
  doc-end -> stream
  [else] -> indent -> block-start

block-start
  seq-item-start -> block-start
  explicit-key-start -> block-start
  map-value-start -> block-start
  [else] -> doc

doc
  line-end -> line-start
  spaces -> doc
  anchor -> doc
  tag -> doc
  flow-start -> flow -> doc
  flow-end -> error -> doc
  seq-item-start -> error -> doc
  explicit-key-start -> error -> doc
  map-value-start -> doc
  alias -> doc
  quote-start -> quoted-scalar -> doc
  block-scalar-header -> line-end -> block-scalar(min) -> line-start
  [else] -> plain-scalar(false, min) -> doc

flow
  line-end -> flow
  spaces -> flow
  anchor -> flow
  tag -> flow
  flow-start -> flow -> flow
  flow-end -> .
  seq-item-start -> error -> flow
  explicit-key-start -> flow
  map-value-start -> flow
  alias -> flow
  quote-start -> quoted-scalar -> flow
  comma -> flow
  [else] -> plain-scalar(true, 0) -> flow

quoted-scalar
  quote-end -> .
  [else] -> quoted-scalar

block-scalar(min)
  newline + peek(indent < min) -> .
  [else] -> block-scalar(min)

plain-scalar(is-flow, min)
  scalar-end(is-flow) -> .
  peek(newline + (indent < min)) -> .
  [else] -> plain-scalar(min)
*/
function isEmpty(ch) {
    switch (ch) {
        case undefined:
        case ' ':
        case '\n':
        case '\r':
        case '\t':
            return true;
        default:
            return false;
    }
}
const hexDigits = new Set('0123456789ABCDEFabcdef');
const tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
const flowIndicatorChars = new Set(',[]{}');
const invalidAnchorChars = new Set(' ,[]{}\n\r\t');
const isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
/**
 * Splits an input string into lexical tokens, i.e. smaller strings that are
 * easily identifiable by `tokens.tokenType()`.
 *
 * Lexing starts always in a "stream" context. Incomplete input may be buffered
 * until a complete token can be emitted.
 *
 * In addition to slices of the original input, the following control characters
 * may also be emitted:
 *
 * - `\x02` (Start of Text): A document starts with the next token
 * - `\x18` (Cancel): Unexpected end of flow-mode (indicates an error)
 * - `\x1f` (Unit Separator): Next token is a scalar value
 * - `\u{FEFF}` (Byte order mark): Emitted separately outside documents
 */
class Lexer {
    constructor() {
        /**
         * Flag indicating whether the end of the current buffer marks the end of
         * all input
         */
        this.atEnd = false;
        /**
         * Explicit indent set in block scalar header, as an offset from the current
         * minimum indent, so e.g. set to 1 from a header `|2+`. Set to -1 if not
         * explicitly set.
         */
        this.blockScalarIndent = -1;
        /**
         * Block scalars that include a + (keep) chomping indicator in their header
         * include trailing empty lines, which are otherwise excluded from the
         * scalar's contents.
         */
        this.blockScalarKeep = false;
        /** Current input */
        this.buffer = '';
        /**
         * Flag noting whether the map value indicator : can immediately follow this
         * node within a flow context.
         */
        this.flowKey = false;
        /** Count of surrounding flow collection levels. */
        this.flowLevel = 0;
        /**
         * Minimum level of indentation required for next lines to be parsed as a
         * part of the current scalar value.
         */
        this.indentNext = 0;
        /** Indentation level of the current line. */
        this.indentValue = 0;
        /** Position of the next \n character. */
        this.lineEndPos = null;
        /** Stores the state of the lexer if reaching the end of incpomplete input */
        this.next = null;
        /** A pointer to `buffer`; the current position of the lexer. */
        this.pos = 0;
    }
    /**
     * Generate YAML tokens from the `source` string. If `incomplete`,
     * a part of the last line may be left as a buffer for the next call.
     *
     * @returns A generator of lexical tokens
     */
    *lex(source, incomplete = false) {
        if (source) {
            if (typeof source !== 'string')
                throw TypeError('source is not a string');
            this.buffer = this.buffer ? this.buffer + source : source;
            this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? 'stream';
        while (next && (incomplete || this.hasChars(1)))
            next = yield* this.parseNext(next);
    }
    atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === ' ' || ch === '\t')
            ch = this.buffer[++i];
        if (!ch || ch === '#' || ch === '\n')
            return true;
        if (ch === '\r')
            return this.buffer[i + 1] === '\n';
        return false;
    }
    charAt(n) {
        return this.buffer[this.pos + n];
    }
    continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
            let indent = 0;
            while (ch === ' ')
                ch = this.buffer[++indent + offset];
            if (ch === '\r') {
                const next = this.buffer[indent + offset + 1];
                if (next === '\n' || (!next && !this.atEnd))
                    return offset + indent + 1;
            }
            return ch === '\n' || indent >= this.indentNext || (!ch && !this.atEnd)
                ? offset + indent
                : -1;
        }
        if (ch === '-' || ch === '.') {
            const dt = this.buffer.substr(offset, 3);
            if ((dt === '---' || dt === '...') && isEmpty(this.buffer[offset + 3]))
                return -1;
        }
        return offset;
    }
    getLine() {
        let end = this.lineEndPos;
        if (typeof end !== 'number' || (end !== -1 && end < this.pos)) {
            end = this.buffer.indexOf('\n', this.pos);
            this.lineEndPos = end;
        }
        if (end === -1)
            return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === '\r')
            end -= 1;
        return this.buffer.substring(this.pos, end);
    }
    hasChars(n) {
        return this.pos + n <= this.buffer.length;
    }
    setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
    }
    peek(n) {
        return this.buffer.substr(this.pos, n);
    }
    *parseNext(next) {
        switch (next) {
            case 'stream':
                return yield* this.parseStream();
            case 'line-start':
                return yield* this.parseLineStart();
            case 'block-start':
                return yield* this.parseBlockStart();
            case 'doc':
                return yield* this.parseDocument();
            case 'flow':
                return yield* this.parseFlowCollection();
            case 'quoted-scalar':
                return yield* this.parseQuotedScalar();
            case 'block-scalar':
                return yield* this.parseBlockScalar();
            case 'plain-scalar':
                return yield* this.parsePlainScalar();
        }
    }
    *parseStream() {
        let line = this.getLine();
        if (line === null)
            return this.setNext('stream');
        if (line[0] === BOM) {
            yield* this.pushCount(1);
            line = line.substring(1);
        }
        if (line[0] === '%') {
            let dirEnd = line.length;
            let cs = line.indexOf('#');
            while (cs !== -1) {
                const ch = line[cs - 1];
                if (ch === ' ' || ch === '\t') {
                    dirEnd = cs - 1;
                    break;
                }
                else {
                    cs = line.indexOf('#', cs + 1);
                }
            }
            while (true) {
                const ch = line[dirEnd - 1];
                if (ch === ' ' || ch === '\t')
                    dirEnd -= 1;
                else
                    break;
            }
            const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
            yield* this.pushCount(line.length - n); // possible comment
            this.pushNewline();
            return 'stream';
        }
        if (this.atLineEnd()) {
            const sp = yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - sp);
            yield* this.pushNewline();
            return 'stream';
        }
        yield DOCUMENT;
        return yield* this.parseLineStart();
    }
    *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
            return this.setNext('line-start');
        if (ch === '-' || ch === '.') {
            if (!this.atEnd && !this.hasChars(4))
                return this.setNext('line-start');
            const s = this.peek(3);
            if ((s === '---' || s === '...') && isEmpty(this.charAt(3))) {
                yield* this.pushCount(3);
                this.indentValue = 0;
                this.indentNext = 0;
                return s === '---' ? 'doc' : 'stream';
            }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
            this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
    }
    *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
            return this.setNext('block-start');
        if ((ch0 === '-' || ch0 === '?' || ch0 === ':') && isEmpty(ch1)) {
            const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
            this.indentNext = this.indentValue + 1;
            this.indentValue += n;
            return yield* this.parseBlockStart();
        }
        return 'doc';
    }
    *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
            return this.setNext('doc');
        let n = yield* this.pushIndicators();
        switch (line[n]) {
            case '#':
                yield* this.pushCount(line.length - n);
            // fallthrough
            case undefined:
                yield* this.pushNewline();
                return yield* this.parseLineStart();
            case '{':
            case '[':
                yield* this.pushCount(1);
                this.flowKey = false;
                this.flowLevel = 1;
                return 'flow';
            case '}':
            case ']':
                // this is an error
                yield* this.pushCount(1);
                return 'doc';
            case '*':
                yield* this.pushUntil(isNotAnchorChar);
                return 'doc';
            case '"':
            case "'":
                return yield* this.parseQuotedScalar();
            case '|':
            case '>':
                n += yield* this.parseBlockScalarHeader();
                n += yield* this.pushSpaces(true);
                yield* this.pushCount(line.length - n);
                yield* this.pushNewline();
                return yield* this.parseBlockScalar();
            default:
                return yield* this.parsePlainScalar();
        }
    }
    *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
            nl = yield* this.pushNewline();
            if (nl > 0) {
                sp = yield* this.pushSpaces(false);
                this.indentValue = indent = sp;
            }
            else {
                sp = 0;
            }
            sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
            return this.setNext('flow');
        if ((indent !== -1 && indent < this.indentNext && line[0] !== '#') ||
            (indent === 0 &&
                (line.startsWith('---') || line.startsWith('...')) &&
                isEmpty(line[3]))) {
            // Allowing for the terminal ] or } at the same (rather than greater)
            // indent level as the initial [ or { is technically invalid, but
            // failing here would be surprising to users.
            const atFlowEndMarker = indent === this.indentNext - 1 &&
                this.flowLevel === 1 &&
                (line[0] === ']' || line[0] === '}');
            if (!atFlowEndMarker) {
                // this is an error
                this.flowLevel = 0;
                yield FLOW_END;
                return yield* this.parseLineStart();
            }
        }
        let n = 0;
        while (line[n] === ',') {
            n += yield* this.pushCount(1);
            n += yield* this.pushSpaces(true);
            this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
            case undefined:
                return 'flow';
            case '#':
                yield* this.pushCount(line.length - n);
                return 'flow';
            case '{':
            case '[':
                yield* this.pushCount(1);
                this.flowKey = false;
                this.flowLevel += 1;
                return 'flow';
            case '}':
            case ']':
                yield* this.pushCount(1);
                this.flowKey = true;
                this.flowLevel -= 1;
                return this.flowLevel ? 'flow' : 'doc';
            case '*':
                yield* this.pushUntil(isNotAnchorChar);
                return 'flow';
            case '"':
            case "'":
                this.flowKey = true;
                return yield* this.parseQuotedScalar();
            case ':': {
                const next = this.charAt(1);
                if (this.flowKey || isEmpty(next) || next === ',') {
                    this.flowKey = false;
                    yield* this.pushCount(1);
                    yield* this.pushSpaces(true);
                    return 'flow';
                }
            }
            // fallthrough
            default:
                this.flowKey = false;
                return yield* this.parsePlainScalar();
        }
    }
    *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
            while (end !== -1 && this.buffer[end + 1] === "'")
                end = this.buffer.indexOf("'", end + 2);
        }
        else {
            // double-quote
            while (end !== -1) {
                let n = 0;
                while (this.buffer[end - 1 - n] === '\\')
                    n += 1;
                if (n % 2 === 0)
                    break;
                end = this.buffer.indexOf('"', end + 1);
            }
        }
        // Only looking for newlines within the quotes
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf('\n', this.pos);
        if (nl !== -1) {
            while (nl !== -1) {
                const cs = this.continueScalar(nl + 1);
                if (cs === -1)
                    break;
                nl = qb.indexOf('\n', cs);
            }
            if (nl !== -1) {
                // this is an error caused by an unexpected unindent
                end = nl - (qb[nl - 1] === '\r' ? 2 : 1);
            }
        }
        if (end === -1) {
            if (!this.atEnd)
                return this.setNext('quoted-scalar');
            end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? 'flow' : 'doc';
    }
    *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
            const ch = this.buffer[++i];
            if (ch === '+')
                this.blockScalarKeep = true;
            else if (ch > '0' && ch <= '9')
                this.blockScalarIndent = Number(ch) - 1;
            else if (ch !== '-')
                break;
        }
        return yield* this.pushUntil(ch => isEmpty(ch) || ch === '#');
    }
    *parseBlockScalar() {
        let nl = this.pos - 1; // may be -1 if this.pos === 0
        let indent = 0;
        let ch;
        loop: for (let i = this.pos; (ch = this.buffer[i]); ++i) {
            switch (ch) {
                case ' ':
                    indent += 1;
                    break;
                case '\n':
                    nl = i;
                    indent = 0;
                    break;
                case '\r': {
                    const next = this.buffer[i + 1];
                    if (!next && !this.atEnd)
                        return this.setNext('block-scalar');
                    if (next === '\n')
                        break;
                } // fallthrough
                default:
                    break loop;
            }
        }
        if (!ch && !this.atEnd)
            return this.setNext('block-scalar');
        if (indent >= this.indentNext) {
            if (this.blockScalarIndent === -1)
                this.indentNext = indent;
            else {
                this.indentNext =
                    this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
            }
            do {
                const cs = this.continueScalar(nl + 1);
                if (cs === -1)
                    break;
                nl = this.buffer.indexOf('\n', cs);
            } while (nl !== -1);
            if (nl === -1) {
                if (!this.atEnd)
                    return this.setNext('block-scalar');
                nl = this.buffer.length;
            }
        }
        // Trailing insufficiently indented tabs are invalid.
        // To catch that during parsing, we include them in the block scalar value.
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === ' ')
            ch = this.buffer[++i];
        if (ch === '\t') {
            while (ch === '\t' || ch === ' ' || ch === '\r' || ch === '\n')
                ch = this.buffer[++i];
            nl = i - 1;
        }
        else if (!this.blockScalarKeep) {
            do {
                let i = nl - 1;
                let ch = this.buffer[i];
                if (ch === '\r')
                    ch = this.buffer[--i];
                const lastChar = i; // Drop the line if last char not more indented
                while (ch === ' ')
                    ch = this.buffer[--i];
                if (ch === '\n' && i >= this.pos && i + 1 + indent > lastChar)
                    nl = i;
                else
                    break;
            } while (true);
        }
        yield SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
    }
    *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while ((ch = this.buffer[++i])) {
            if (ch === ':') {
                const next = this.buffer[i + 1];
                if (isEmpty(next) || (inFlow && flowIndicatorChars.has(next)))
                    break;
                end = i;
            }
            else if (isEmpty(ch)) {
                let next = this.buffer[i + 1];
                if (ch === '\r') {
                    if (next === '\n') {
                        i += 1;
                        ch = '\n';
                        next = this.buffer[i + 1];
                    }
                    else
                        end = i;
                }
                if (next === '#' || (inFlow && flowIndicatorChars.has(next)))
                    break;
                if (ch === '\n') {
                    const cs = this.continueScalar(i + 1);
                    if (cs === -1)
                        break;
                    i = Math.max(i, cs - 2); // to advance, but still account for ' #'
                }
            }
            else {
                if (inFlow && flowIndicatorChars.has(ch))
                    break;
                end = i;
            }
        }
        if (!ch && !this.atEnd)
            return this.setNext('plain-scalar');
        yield SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? 'flow' : 'doc';
    }
    *pushCount(n) {
        if (n > 0) {
            yield this.buffer.substr(this.pos, n);
            this.pos += n;
            return n;
        }
        return 0;
    }
    *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
            yield s;
            this.pos += s.length;
            return s.length;
        }
        else if (allowEmpty)
            yield '';
        return 0;
    }
    *pushIndicators() {
        switch (this.charAt(0)) {
            case '!':
                return ((yield* this.pushTag()) +
                    (yield* this.pushSpaces(true)) +
                    (yield* this.pushIndicators()));
            case '&':
                return ((yield* this.pushUntil(isNotAnchorChar)) +
                    (yield* this.pushSpaces(true)) +
                    (yield* this.pushIndicators()));
            case '-': // this is an error
            case '?': // this is an error outside flow collections
            case ':': {
                const inFlow = this.flowLevel > 0;
                const ch1 = this.charAt(1);
                if (isEmpty(ch1) || (inFlow && flowIndicatorChars.has(ch1))) {
                    if (!inFlow)
                        this.indentNext = this.indentValue + 1;
                    else if (this.flowKey)
                        this.flowKey = false;
                    return ((yield* this.pushCount(1)) +
                        (yield* this.pushSpaces(true)) +
                        (yield* this.pushIndicators()));
                }
            }
        }
        return 0;
    }
    *pushTag() {
        if (this.charAt(1) === '<') {
            let i = this.pos + 2;
            let ch = this.buffer[i];
            while (!isEmpty(ch) && ch !== '>')
                ch = this.buffer[++i];
            return yield* this.pushToIndex(ch === '>' ? i + 1 : i, false);
        }
        else {
            let i = this.pos + 1;
            let ch = this.buffer[i];
            while (ch) {
                if (tagChars.has(ch))
                    ch = this.buffer[++i];
                else if (ch === '%' &&
                    hexDigits.has(this.buffer[i + 1]) &&
                    hexDigits.has(this.buffer[i + 2])) {
                    ch = this.buffer[(i += 3)];
                }
                else
                    break;
            }
            return yield* this.pushToIndex(i, false);
        }
    }
    *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === '\n')
            return yield* this.pushCount(1);
        else if (ch === '\r' && this.charAt(1) === '\n')
            return yield* this.pushCount(2);
        else
            return 0;
    }
    *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
            ch = this.buffer[++i];
        } while (ch === ' ' || (allowTabs && ch === '\t'));
        const n = i - this.pos;
        if (n > 0) {
            yield this.buffer.substr(this.pos, n);
            this.pos = i;
        }
        return n;
    }
    *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
            ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
    }
}

/**
 * Tracks newlines during parsing in order to provide an efficient API for
 * determining the one-indexed `{ line, col }` position for any offset
 * within the input.
 */
class LineCounter {
    constructor() {
        this.lineStarts = [];
        /**
         * Should be called in ascending order. Otherwise, call
         * `lineCounter.lineStarts.sort()` before calling `linePos()`.
         */
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        /**
         * Performs a binary search and returns the 1-indexed { line, col }
         * position of `offset`. If `line === 0`, `addNewLine` has never been
         * called or `offset` is before the first known newline.
         */
        this.linePos = (offset) => {
            let low = 0;
            let high = this.lineStarts.length;
            while (low < high) {
                const mid = (low + high) >> 1; // Math.floor((low + high) / 2)
                if (this.lineStarts[mid] < offset)
                    low = mid + 1;
                else
                    high = mid;
            }
            if (this.lineStarts[low] === offset)
                return { line: low + 1, col: 1 };
            if (low === 0)
                return { line: 0, col: offset };
            const start = this.lineStarts[low - 1];
            return { line: low, col: offset - start + 1 };
        };
    }
}

function includesToken(list, type) {
    for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
            return true;
    return false;
}
function findNonEmptyIndex(list) {
    for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
            case 'space':
            case 'comment':
            case 'newline':
                break;
            default:
                return i;
        }
    }
    return -1;
}
function isFlowToken(token) {
    switch (token?.type) {
        case 'alias':
        case 'scalar':
        case 'single-quoted-scalar':
        case 'double-quoted-scalar':
        case 'flow-collection':
            return true;
        default:
            return false;
    }
}
function getPrevProps(parent) {
    switch (parent.type) {
        case 'document':
            return parent.start;
        case 'block-map': {
            const it = parent.items[parent.items.length - 1];
            return it.sep ?? it.start;
        }
        case 'block-seq':
            return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
            return [];
    }
}
/** Note: May modify input array */
function getFirstKeyStartProps(prev) {
    if (prev.length === 0)
        return [];
    let i = prev.length;
    loop: while (--i >= 0) {
        switch (prev[i].type) {
            case 'doc-start':
            case 'explicit-key-ind':
            case 'map-value-ind':
            case 'seq-item-ind':
            case 'newline':
                break loop;
        }
    }
    while (prev[++i]?.type === 'space') {
        /* loop */
    }
    return prev.splice(i, prev.length);
}
function fixFlowSeqItems(fc) {
    if (fc.start.type === 'flow-seq-start') {
        for (const it of fc.items) {
            if (it.sep &&
                !it.value &&
                !includesToken(it.start, 'explicit-key-ind') &&
                !includesToken(it.sep, 'map-value-ind')) {
                if (it.key)
                    it.value = it.key;
                delete it.key;
                if (isFlowToken(it.value)) {
                    if (it.value.end)
                        Array.prototype.push.apply(it.value.end, it.sep);
                    else
                        it.value.end = it.sep;
                }
                else
                    Array.prototype.push.apply(it.start, it.sep);
                delete it.sep;
            }
        }
    }
}
/**
 * A YAML concrete syntax tree (CST) parser
 *
 * ```ts
 * const src: string = ...
 * for (const token of new Parser().parse(src)) {
 *   // token: Token
 * }
 * ```
 *
 * To use the parser with a user-provided lexer:
 *
 * ```ts
 * function* parse(source: string, lexer: Lexer) {
 *   const parser = new Parser()
 *   for (const lexeme of lexer.lex(source))
 *     yield* parser.next(lexeme)
 *   yield* parser.end()
 * }
 *
 * const src: string = ...
 * const lexer = new Lexer()
 * for (const token of parse(src, lexer)) {
 *   // token: Token
 * }
 * ```
 */
class Parser {
    /**
     * @param onNewLine - If defined, called separately with the start position of
     *   each new line (in `parse()`, including the start of input).
     */
    constructor(onNewLine) {
        /** If true, space and sequence indicators count as indentation */
        this.atNewLine = true;
        /** If true, next token is a scalar value */
        this.atScalar = false;
        /** Current indentation level */
        this.indent = 0;
        /** Current offset since the start of parsing */
        this.offset = 0;
        /** On the same line with a block map key */
        this.onKeyLine = false;
        /** Top indicates the node that's currently being built */
        this.stack = [];
        /** The source of the current token, set in parse() */
        this.source = '';
        /** The type of the current token, set in parse() */
        this.type = '';
        // Must be defined after `next()`
        this.lexer = new Lexer();
        this.onNewLine = onNewLine;
    }
    /**
     * Parse `source` as a YAML stream.
     * If `incomplete`, a part of the last line may be left as a buffer for the next call.
     *
     * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
     *
     * @returns A generator of tokens representing each directive, document, and other structure.
     */
    *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
            this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
            yield* this.next(lexeme);
        if (!incomplete)
            yield* this.end();
    }
    /**
     * Advance the parser by the `source` of one lexical token.
     */
    *next(source) {
        this.source = source;
        if (this.atScalar) {
            this.atScalar = false;
            yield* this.step();
            this.offset += source.length;
            return;
        }
        const type = tokenType(source);
        if (!type) {
            const message = `Not a YAML token: ${source}`;
            yield* this.pop({ type: 'error', offset: this.offset, message, source });
            this.offset += source.length;
        }
        else if (type === 'scalar') {
            this.atNewLine = false;
            this.atScalar = true;
            this.type = 'scalar';
        }
        else {
            this.type = type;
            yield* this.step();
            switch (type) {
                case 'newline':
                    this.atNewLine = true;
                    this.indent = 0;
                    if (this.onNewLine)
                        this.onNewLine(this.offset + source.length);
                    break;
                case 'space':
                    if (this.atNewLine && source[0] === ' ')
                        this.indent += source.length;
                    break;
                case 'explicit-key-ind':
                case 'map-value-ind':
                case 'seq-item-ind':
                    if (this.atNewLine)
                        this.indent += source.length;
                    break;
                case 'doc-mode':
                case 'flow-error-end':
                    return;
                default:
                    this.atNewLine = false;
            }
            this.offset += source.length;
        }
    }
    /** Call at end of input to push out any remaining constructions */
    *end() {
        while (this.stack.length > 0)
            yield* this.pop();
    }
    get sourceToken() {
        const st = {
            type: this.type,
            offset: this.offset,
            indent: this.indent,
            source: this.source
        };
        return st;
    }
    *step() {
        const top = this.peek(1);
        if (this.type === 'doc-end' && (!top || top.type !== 'doc-end')) {
            while (this.stack.length > 0)
                yield* this.pop();
            this.stack.push({
                type: 'doc-end',
                offset: this.offset,
                source: this.source
            });
            return;
        }
        if (!top)
            return yield* this.stream();
        switch (top.type) {
            case 'document':
                return yield* this.document(top);
            case 'alias':
            case 'scalar':
            case 'single-quoted-scalar':
            case 'double-quoted-scalar':
                return yield* this.scalar(top);
            case 'block-scalar':
                return yield* this.blockScalar(top);
            case 'block-map':
                return yield* this.blockMap(top);
            case 'block-seq':
                return yield* this.blockSequence(top);
            case 'flow-collection':
                return yield* this.flowCollection(top);
            case 'doc-end':
                return yield* this.documentEnd(top);
        }
        /* istanbul ignore next should not happen */
        yield* this.pop();
    }
    peek(n) {
        return this.stack[this.stack.length - n];
    }
    *pop(error) {
        const token = error ?? this.stack.pop();
        /* istanbul ignore if should not happen */
        if (!token) {
            const message = 'Tried to pop an empty stack';
            yield { type: 'error', offset: this.offset, source: '', message };
        }
        else if (this.stack.length === 0) {
            yield token;
        }
        else {
            const top = this.peek(1);
            if (token.type === 'block-scalar') {
                // Block scalars use their parent rather than header indent
                token.indent = 'indent' in top ? top.indent : 0;
            }
            else if (token.type === 'flow-collection' && top.type === 'document') {
                // Ignore all indent for top-level flow collections
                token.indent = 0;
            }
            if (token.type === 'flow-collection')
                fixFlowSeqItems(token);
            switch (top.type) {
                case 'document':
                    top.value = token;
                    break;
                case 'block-scalar':
                    top.props.push(token); // error
                    break;
                case 'block-map': {
                    const it = top.items[top.items.length - 1];
                    if (it.value) {
                        top.items.push({ start: [], key: token, sep: [] });
                        this.onKeyLine = true;
                        return;
                    }
                    else if (it.sep) {
                        it.value = token;
                    }
                    else {
                        Object.assign(it, { key: token, sep: [] });
                        this.onKeyLine = !it.explicitKey;
                        return;
                    }
                    break;
                }
                case 'block-seq': {
                    const it = top.items[top.items.length - 1];
                    if (it.value)
                        top.items.push({ start: [], value: token });
                    else
                        it.value = token;
                    break;
                }
                case 'flow-collection': {
                    const it = top.items[top.items.length - 1];
                    if (!it || it.value)
                        top.items.push({ start: [], key: token, sep: [] });
                    else if (it.sep)
                        it.value = token;
                    else
                        Object.assign(it, { key: token, sep: [] });
                    return;
                }
                /* istanbul ignore next should not happen */
                default:
                    yield* this.pop();
                    yield* this.pop(token);
            }
            if ((top.type === 'document' ||
                top.type === 'block-map' ||
                top.type === 'block-seq') &&
                (token.type === 'block-map' || token.type === 'block-seq')) {
                const last = token.items[token.items.length - 1];
                if (last &&
                    !last.sep &&
                    !last.value &&
                    last.start.length > 0 &&
                    findNonEmptyIndex(last.start) === -1 &&
                    (token.indent === 0 ||
                        last.start.every(st => st.type !== 'comment' || st.indent < token.indent))) {
                    if (top.type === 'document')
                        top.end = last.start;
                    else
                        top.items.push({ start: last.start });
                    token.items.splice(-1, 1);
                }
            }
        }
    }
    *stream() {
        switch (this.type) {
            case 'directive-line':
                yield { type: 'directive', offset: this.offset, source: this.source };
                return;
            case 'byte-order-mark':
            case 'space':
            case 'comment':
            case 'newline':
                yield this.sourceToken;
                return;
            case 'doc-mode':
            case 'doc-start': {
                const doc = {
                    type: 'document',
                    offset: this.offset,
                    start: []
                };
                if (this.type === 'doc-start')
                    doc.start.push(this.sourceToken);
                this.stack.push(doc);
                return;
            }
        }
        yield {
            type: 'error',
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML stream`,
            source: this.source
        };
    }
    *document(doc) {
        if (doc.value)
            return yield* this.lineEnd(doc);
        switch (this.type) {
            case 'doc-start': {
                if (findNonEmptyIndex(doc.start) !== -1) {
                    yield* this.pop();
                    yield* this.step();
                }
                else
                    doc.start.push(this.sourceToken);
                return;
            }
            case 'anchor':
            case 'tag':
            case 'space':
            case 'comment':
            case 'newline':
                doc.start.push(this.sourceToken);
                return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
            this.stack.push(bv);
        else {
            yield {
                type: 'error',
                offset: this.offset,
                message: `Unexpected ${this.type} token in YAML document`,
                source: this.source
            };
        }
    }
    *scalar(scalar) {
        if (this.type === 'map-value-ind') {
            const prev = getPrevProps(this.peek(2));
            const start = getFirstKeyStartProps(prev);
            let sep;
            if (scalar.end) {
                sep = scalar.end;
                sep.push(this.sourceToken);
                delete scalar.end;
            }
            else
                sep = [this.sourceToken];
            const map = {
                type: 'block-map',
                offset: scalar.offset,
                indent: scalar.indent,
                items: [{ start, key: scalar, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
        }
        else
            yield* this.lineEnd(scalar);
    }
    *blockScalar(scalar) {
        switch (this.type) {
            case 'space':
            case 'comment':
            case 'newline':
                scalar.props.push(this.sourceToken);
                return;
            case 'scalar':
                scalar.source = this.source;
                // block-scalar source includes trailing newline
                this.atNewLine = true;
                this.indent = 0;
                if (this.onNewLine) {
                    let nl = this.source.indexOf('\n') + 1;
                    while (nl !== 0) {
                        this.onNewLine(this.offset + nl);
                        nl = this.source.indexOf('\n', nl) + 1;
                    }
                }
                yield* this.pop();
                break;
            /* istanbul ignore next should not happen */
            default:
                yield* this.pop();
                yield* this.step();
        }
    }
    *blockMap(map) {
        const it = map.items[map.items.length - 1];
        // it.sep is true-ish if pair already has key or : separator
        switch (this.type) {
            case 'newline':
                this.onKeyLine = false;
                if (it.value) {
                    const end = 'end' in it.value ? it.value.end : undefined;
                    const last = Array.isArray(end) ? end[end.length - 1] : undefined;
                    if (last?.type === 'comment')
                        end?.push(this.sourceToken);
                    else
                        map.items.push({ start: [this.sourceToken] });
                }
                else if (it.sep) {
                    it.sep.push(this.sourceToken);
                }
                else {
                    it.start.push(this.sourceToken);
                }
                return;
            case 'space':
            case 'comment':
                if (it.value) {
                    map.items.push({ start: [this.sourceToken] });
                }
                else if (it.sep) {
                    it.sep.push(this.sourceToken);
                }
                else {
                    if (this.atIndentedComment(it.start, map.indent)) {
                        const prev = map.items[map.items.length - 2];
                        const end = prev?.value?.end;
                        if (Array.isArray(end)) {
                            Array.prototype.push.apply(end, it.start);
                            end.push(this.sourceToken);
                            map.items.pop();
                            return;
                        }
                    }
                    it.start.push(this.sourceToken);
                }
                return;
        }
        if (this.indent >= map.indent) {
            const atMapIndent = !this.onKeyLine && this.indent === map.indent;
            const atNextItem = atMapIndent &&
                (it.sep || it.explicitKey) &&
                this.type !== 'seq-item-ind';
            // For empty nodes, assign newline-separated not indented empty tokens to following node
            let start = [];
            if (atNextItem && it.sep && !it.value) {
                const nl = [];
                for (let i = 0; i < it.sep.length; ++i) {
                    const st = it.sep[i];
                    switch (st.type) {
                        case 'newline':
                            nl.push(i);
                            break;
                        case 'space':
                            break;
                        case 'comment':
                            if (st.indent > map.indent)
                                nl.length = 0;
                            break;
                        default:
                            nl.length = 0;
                    }
                }
                if (nl.length >= 2)
                    start = it.sep.splice(nl[1]);
            }
            switch (this.type) {
                case 'anchor':
                case 'tag':
                    if (atNextItem || it.value) {
                        start.push(this.sourceToken);
                        map.items.push({ start });
                        this.onKeyLine = true;
                    }
                    else if (it.sep) {
                        it.sep.push(this.sourceToken);
                    }
                    else {
                        it.start.push(this.sourceToken);
                    }
                    return;
                case 'explicit-key-ind':
                    if (!it.sep && !it.explicitKey) {
                        it.start.push(this.sourceToken);
                        it.explicitKey = true;
                    }
                    else if (atNextItem || it.value) {
                        start.push(this.sourceToken);
                        map.items.push({ start, explicitKey: true });
                    }
                    else {
                        this.stack.push({
                            type: 'block-map',
                            offset: this.offset,
                            indent: this.indent,
                            items: [{ start: [this.sourceToken], explicitKey: true }]
                        });
                    }
                    this.onKeyLine = true;
                    return;
                case 'map-value-ind':
                    if (it.explicitKey) {
                        if (!it.sep) {
                            if (includesToken(it.start, 'newline')) {
                                Object.assign(it, { key: null, sep: [this.sourceToken] });
                            }
                            else {
                                const start = getFirstKeyStartProps(it.start);
                                this.stack.push({
                                    type: 'block-map',
                                    offset: this.offset,
                                    indent: this.indent,
                                    items: [{ start, key: null, sep: [this.sourceToken] }]
                                });
                            }
                        }
                        else if (it.value) {
                            map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                        }
                        else if (includesToken(it.sep, 'map-value-ind')) {
                            this.stack.push({
                                type: 'block-map',
                                offset: this.offset,
                                indent: this.indent,
                                items: [{ start, key: null, sep: [this.sourceToken] }]
                            });
                        }
                        else if (isFlowToken(it.key) &&
                            !includesToken(it.sep, 'newline')) {
                            const start = getFirstKeyStartProps(it.start);
                            const key = it.key;
                            const sep = it.sep;
                            sep.push(this.sourceToken);
                            // @ts-expect-error type guard is wrong here
                            delete it.key;
                            // @ts-expect-error type guard is wrong here
                            delete it.sep;
                            this.stack.push({
                                type: 'block-map',
                                offset: this.offset,
                                indent: this.indent,
                                items: [{ start, key, sep }]
                            });
                        }
                        else if (start.length > 0) {
                            // Not actually at next item
                            it.sep = it.sep.concat(start, this.sourceToken);
                        }
                        else {
                            it.sep.push(this.sourceToken);
                        }
                    }
                    else {
                        if (!it.sep) {
                            Object.assign(it, { key: null, sep: [this.sourceToken] });
                        }
                        else if (it.value || atNextItem) {
                            map.items.push({ start, key: null, sep: [this.sourceToken] });
                        }
                        else if (includesToken(it.sep, 'map-value-ind')) {
                            this.stack.push({
                                type: 'block-map',
                                offset: this.offset,
                                indent: this.indent,
                                items: [{ start: [], key: null, sep: [this.sourceToken] }]
                            });
                        }
                        else {
                            it.sep.push(this.sourceToken);
                        }
                    }
                    this.onKeyLine = true;
                    return;
                case 'alias':
                case 'scalar':
                case 'single-quoted-scalar':
                case 'double-quoted-scalar': {
                    const fs = this.flowScalar(this.type);
                    if (atNextItem || it.value) {
                        map.items.push({ start, key: fs, sep: [] });
                        this.onKeyLine = true;
                    }
                    else if (it.sep) {
                        this.stack.push(fs);
                    }
                    else {
                        Object.assign(it, { key: fs, sep: [] });
                        this.onKeyLine = true;
                    }
                    return;
                }
                default: {
                    const bv = this.startBlockValue(map);
                    if (bv) {
                        if (bv.type === 'block-seq') {
                            if (!it.explicitKey &&
                                it.sep &&
                                !includesToken(it.sep, 'newline')) {
                                yield* this.pop({
                                    type: 'error',
                                    offset: this.offset,
                                    message: 'Unexpected block-seq-ind on same line with key',
                                    source: this.source
                                });
                                return;
                            }
                        }
                        else if (atMapIndent) {
                            map.items.push({ start });
                        }
                        this.stack.push(bv);
                        return;
                    }
                }
            }
        }
        yield* this.pop();
        yield* this.step();
    }
    *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
            case 'newline':
                if (it.value) {
                    const end = 'end' in it.value ? it.value.end : undefined;
                    const last = Array.isArray(end) ? end[end.length - 1] : undefined;
                    if (last?.type === 'comment')
                        end?.push(this.sourceToken);
                    else
                        seq.items.push({ start: [this.sourceToken] });
                }
                else
                    it.start.push(this.sourceToken);
                return;
            case 'space':
            case 'comment':
                if (it.value)
                    seq.items.push({ start: [this.sourceToken] });
                else {
                    if (this.atIndentedComment(it.start, seq.indent)) {
                        const prev = seq.items[seq.items.length - 2];
                        const end = prev?.value?.end;
                        if (Array.isArray(end)) {
                            Array.prototype.push.apply(end, it.start);
                            end.push(this.sourceToken);
                            seq.items.pop();
                            return;
                        }
                    }
                    it.start.push(this.sourceToken);
                }
                return;
            case 'anchor':
            case 'tag':
                if (it.value || this.indent <= seq.indent)
                    break;
                it.start.push(this.sourceToken);
                return;
            case 'seq-item-ind':
                if (this.indent !== seq.indent)
                    break;
                if (it.value || includesToken(it.start, 'seq-item-ind'))
                    seq.items.push({ start: [this.sourceToken] });
                else
                    it.start.push(this.sourceToken);
                return;
        }
        if (this.indent > seq.indent) {
            const bv = this.startBlockValue(seq);
            if (bv) {
                this.stack.push(bv);
                return;
            }
        }
        yield* this.pop();
        yield* this.step();
    }
    *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === 'flow-error-end') {
            let top;
            do {
                yield* this.pop();
                top = this.peek(1);
            } while (top && top.type === 'flow-collection');
        }
        else if (fc.end.length === 0) {
            switch (this.type) {
                case 'comma':
                case 'explicit-key-ind':
                    if (!it || it.sep)
                        fc.items.push({ start: [this.sourceToken] });
                    else
                        it.start.push(this.sourceToken);
                    return;
                case 'map-value-ind':
                    if (!it || it.value)
                        fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
                    else if (it.sep)
                        it.sep.push(this.sourceToken);
                    else
                        Object.assign(it, { key: null, sep: [this.sourceToken] });
                    return;
                case 'space':
                case 'comment':
                case 'newline':
                case 'anchor':
                case 'tag':
                    if (!it || it.value)
                        fc.items.push({ start: [this.sourceToken] });
                    else if (it.sep)
                        it.sep.push(this.sourceToken);
                    else
                        it.start.push(this.sourceToken);
                    return;
                case 'alias':
                case 'scalar':
                case 'single-quoted-scalar':
                case 'double-quoted-scalar': {
                    const fs = this.flowScalar(this.type);
                    if (!it || it.value)
                        fc.items.push({ start: [], key: fs, sep: [] });
                    else if (it.sep)
                        this.stack.push(fs);
                    else
                        Object.assign(it, { key: fs, sep: [] });
                    return;
                }
                case 'flow-map-end':
                case 'flow-seq-end':
                    fc.end.push(this.sourceToken);
                    return;
            }
            const bv = this.startBlockValue(fc);
            /* istanbul ignore else should not happen */
            if (bv)
                this.stack.push(bv);
            else {
                yield* this.pop();
                yield* this.step();
            }
        }
        else {
            const parent = this.peek(2);
            if (parent.type === 'block-map' &&
                ((this.type === 'map-value-ind' && parent.indent === fc.indent) ||
                    (this.type === 'newline' &&
                        !parent.items[parent.items.length - 1].sep))) {
                yield* this.pop();
                yield* this.step();
            }
            else if (this.type === 'map-value-ind' &&
                parent.type !== 'flow-collection') {
                const prev = getPrevProps(parent);
                const start = getFirstKeyStartProps(prev);
                fixFlowSeqItems(fc);
                const sep = fc.end.splice(1, fc.end.length);
                sep.push(this.sourceToken);
                const map = {
                    type: 'block-map',
                    offset: fc.offset,
                    indent: fc.indent,
                    items: [{ start, key: fc, sep }]
                };
                this.onKeyLine = true;
                this.stack[this.stack.length - 1] = map;
            }
            else {
                yield* this.lineEnd(fc);
            }
        }
    }
    flowScalar(type) {
        if (this.onNewLine) {
            let nl = this.source.indexOf('\n') + 1;
            while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf('\n', nl) + 1;
            }
        }
        return {
            type,
            offset: this.offset,
            indent: this.indent,
            source: this.source
        };
    }
    startBlockValue(parent) {
        switch (this.type) {
            case 'alias':
            case 'scalar':
            case 'single-quoted-scalar':
            case 'double-quoted-scalar':
                return this.flowScalar(this.type);
            case 'block-scalar-header':
                return {
                    type: 'block-scalar',
                    offset: this.offset,
                    indent: this.indent,
                    props: [this.sourceToken],
                    source: ''
                };
            case 'flow-map-start':
            case 'flow-seq-start':
                return {
                    type: 'flow-collection',
                    offset: this.offset,
                    indent: this.indent,
                    start: this.sourceToken,
                    items: [],
                    end: []
                };
            case 'seq-item-ind':
                return {
                    type: 'block-seq',
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [this.sourceToken] }]
                };
            case 'explicit-key-ind': {
                this.onKeyLine = true;
                const prev = getPrevProps(parent);
                const start = getFirstKeyStartProps(prev);
                start.push(this.sourceToken);
                return {
                    type: 'block-map',
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, explicitKey: true }]
                };
            }
            case 'map-value-ind': {
                this.onKeyLine = true;
                const prev = getPrevProps(parent);
                const start = getFirstKeyStartProps(prev);
                return {
                    type: 'block-map',
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                };
            }
        }
        return null;
    }
    atIndentedComment(start, indent) {
        if (this.type !== 'comment')
            return false;
        if (this.indent <= indent)
            return false;
        return start.every(st => st.type === 'newline' || st.type === 'space');
    }
    *documentEnd(docEnd) {
        if (this.type !== 'doc-mode') {
            if (docEnd.end)
                docEnd.end.push(this.sourceToken);
            else
                docEnd.end = [this.sourceToken];
            if (this.type === 'newline')
                yield* this.pop();
        }
    }
    *lineEnd(token) {
        switch (this.type) {
            case 'comma':
            case 'doc-start':
            case 'doc-end':
            case 'flow-seq-end':
            case 'flow-map-end':
            case 'map-value-ind':
                yield* this.pop();
                yield* this.step();
                break;
            case 'newline':
                this.onKeyLine = false;
            // fallthrough
            case 'space':
            case 'comment':
            default:
                // all other values are errors
                if (token.end)
                    token.end.push(this.sourceToken);
                else
                    token.end = [this.sourceToken];
                if (this.type === 'newline')
                    yield* this.pop();
        }
    }
}

function parseOptions(options) {
    const prettyErrors = options.prettyErrors !== false;
    const lineCounter = options.lineCounter || (prettyErrors && new LineCounter()) || null;
    return { lineCounter, prettyErrors };
}
/**
 * Parse the input as a stream of YAML documents.
 *
 * Documents should be separated from each other by `...` or `---` marker lines.
 *
 * @returns If an empty `docs` array is returned, it will be of type
 *   EmptyStream and contain additional stream information. In
 *   TypeScript, you should use `'empty' in docs` as a type guard for it.
 */
function parseAllDocuments(source, options = {}) {
    const { lineCounter, prettyErrors } = parseOptions(options);
    const parser = new Parser(lineCounter?.addNewLine);
    const composer = new Composer(options);
    const docs = Array.from(composer.compose(parser.parse(source)));
    if (prettyErrors && lineCounter)
        for (const doc of docs) {
            doc.errors.forEach(prettifyError(source, lineCounter));
            doc.warnings.forEach(prettifyError(source, lineCounter));
        }
    if (docs.length > 0)
        return docs;
    return Object.assign([], { empty: true }, composer.streamInfo());
}
/** Parse an input string into a single YAML.Document */
function parseDocument(source, options = {}) {
    const { lineCounter, prettyErrors } = parseOptions(options);
    const parser = new Parser(lineCounter?.addNewLine);
    const composer = new Composer(options);
    // `doc` is always set by compose.end(true) at the very latest
    let doc = null;
    for (const _doc of composer.compose(parser.parse(source), true, source.length)) {
        if (!doc)
            doc = _doc;
        else if (doc.options.logLevel !== 'silent') {
            doc.errors.push(new YAMLParseError(_doc.range.slice(0, 2), 'MULTIPLE_DOCS', 'Source contains multiple documents; please use YAML.parseAllDocuments()'));
            break;
        }
    }
    if (prettyErrors && lineCounter) {
        doc.errors.forEach(prettifyError(source, lineCounter));
        doc.warnings.forEach(prettifyError(source, lineCounter));
    }
    return doc;
}
function parse(src, reviver, options) {
    let _reviver = undefined;
    if (typeof reviver === 'function') {
        _reviver = reviver;
    }
    else if (options === undefined && reviver && typeof reviver === 'object') {
        options = reviver;
    }
    const doc = parseDocument(src, options);
    if (!doc)
        return null;
    doc.warnings.forEach(warning => warn(doc.options.logLevel, warning));
    if (doc.errors.length > 0) {
        if (doc.options.logLevel !== 'silent')
            throw doc.errors[0];
        else
            doc.errors = [];
    }
    return doc.toJS(Object.assign({ reviver: _reviver }, options));
}
function stringify(value, replacer, options) {
    let _replacer = null;
    if (typeof replacer === 'function' || Array.isArray(replacer)) {
        _replacer = replacer;
    }
    else if (options === undefined && replacer) {
        options = replacer;
    }
    if (typeof options === 'string')
        options = options.length;
    if (typeof options === 'number') {
        const indent = Math.round(options);
        options = indent < 1 ? undefined : indent > 8 ? { indent: 8 } : { indent };
    }
    if (value === undefined) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
            return undefined;
    }
    if (isDocument(value) && !_replacer)
        return value.toString(options);
    return new Document(value, _replacer, options).toString(options);
}

const YAML = {
	__proto__: null,
	Alias: Alias,
	CST: cst,
	Composer: Composer,
	Document: Document,
	Lexer: Lexer,
	LineCounter: LineCounter,
	Pair: Pair,
	Parser: Parser,
	Scalar: Scalar,
	Schema: Schema,
	YAMLError: YAMLError,
	YAMLMap: YAMLMap,
	YAMLParseError: YAMLParseError,
	YAMLSeq: YAMLSeq,
	YAMLWarning: YAMLWarning,
	isAlias: isAlias,
	isCollection: isCollection$1,
	isDocument: isDocument,
	isMap: isMap,
	isNode: isNode,
	isPair: isPair,
	isScalar: isScalar$1,
	isSeq: isSeq,
	parse: parse,
	parseAllDocuments: parseAllDocuments,
	parseDocument: parseDocument,
	stringify: stringify,
	visit: visit$1,
	visitAsync: visitAsync
};

function colorize(type, text) {
  switch (type) {
    case "debug":
    case "prepare":
      return `\x1B[90m${text}\x1B[0m`;
    case "warn":
      return `\x1B[33m${text}\x1B[0m`;
    case "error":
    case "failure":
      return `\x1B[31m${text}\x1B[0m`;
    case "success":
      return `\x1B[32m${text}\x1B[0m`;
    case "title":
      return `\x1B[1m${text}\x1B[0m`;
    case "info":
    default:
      return text;
  }
}
class CliSink {
  stream;
  verbosity;
  artifactPath;
  writeFile;
  entries = [];
  constructor(options = {}) {
    this.stream = options.stream ?? process.stdout;
    this.verbosity = options.verbosity ?? 1;
    this.artifactPath = options.artifactPath;
    this.writeFile = options.writeFile ?? writeFile;
  }
  async publish(...entries) {
    for (const entry of entries) {
      if (entry.type === "debug" && this.verbosity < 2) continue;
      if (entry.type !== "error" && this.verbosity < 1) continue;
      if (entry.type === "title") this.endSection();
      this.replace(entry) || this.append(entry);
      await this.storeArtifacts(entry.artifacts);
    }
  }
  endSection() {
    this.entries = [];
  }
  replace(entry) {
    if (entry.type !== "start" && entry.type !== "success" && entry.type !== "failure") return false;
    const index = this.entries.findLastIndex(
      (e) => e.message === entry.message && (e.type === "prepare" || e.type === "start" && entry.type !== "start")
    );
    if (index < 0) return false;
    const oldTexts = this.entries.slice(index).map((e) => this.format(e));
    const oldLength = oldTexts.reduce((total, current) => total + current.split("\n").length, 0);
    this.entries[index] = entry;
    const newTexts = this.entries.slice(index).map((e) => this.format(e));
    this.stream.write(cursorUp(oldLength));
    this.stream.write(cursorLeft);
    this.stream.write(newTexts.join("\n") + "\n");
    this.stream.write(eraseDown);
    return true;
  }
  append(entry) {
    this.entries.push(entry);
    const text = this.format(entry);
    this.stream.write(text + "\n");
  }
  format(entry) {
    const lines = [];
    const message = entry.message.trim();
    if (["prepare", "start", "success", "failure"].includes(entry.type)) {
      const prefix = colorize(entry.type, statusSymbol(entry.type));
      lines.push(`${prefix} ${message}`);
    } else {
      lines.push(colorize(entry.type, message));
    }
    if (this.verbosity >= 3) {
      if (entry.meta && Object.values(entry.meta).length && Object.keys(entry.meta).length) {
        const yaml = YAML.stringify(entry.meta).trimEnd();
        lines.push(colorize("debug", `[Meta]
${yaml}`));
      }
    }
    return lines.join("\n");
  }
  async storeArtifacts(artifacts) {
    if (!this.artifactPath || artifacts.length === 0) return;
    for (const artifact of artifacts) {
      const data = await artifact.bytes();
      await this.writeFile(`${this.artifactPath}/${artifact.name}`, data);
    }
  }
}

class NoSink {
  async publish() {
  }
}

class Journal {
  constructor(sink) {
    this.sink = sink;
  }
  static nil() {
    return new Journal(new NoSink());
  }
  async log(message, options) {
    const entry = {
      timestamp: Date.now(),
      message,
      type: options.type,
      artifacts: options.artifacts ?? [],
      meta: options.meta ?? {}
    };
    await this.sink.publish(entry);
  }
  batch() {
    return new JournalBatch(this.sink);
  }
  async do(message, callback, metaFn) {
    try {
      await this.start(message);
      const result = await callback();
      const { meta, artifacts } = metaFn?.(result) ?? {};
      await this.success(message, { meta, artifacts });
      return result;
    } catch (e) {
      await this.failure(message);
      throw e;
    }
  }
  async debug(message, options = {}) {
    await this.log(message, { ...options, type: "debug" });
  }
  async info(message, options = {}) {
    await this.log(message, { ...options, type: "info" });
  }
  async warn(message, options = {}) {
    await this.log(message, { ...options, type: "warn" });
  }
  async error(message, options = {}) {
    await this.log(message, { ...options, type: "error" });
  }
  async title(message, options = {}) {
    await this.log(message, { ...options, type: "title" });
  }
  async prepare(message, options = {}) {
    await this.log(message, { ...options, type: "prepare" });
  }
  async start(message, options = {}) {
    await this.log(message, { ...options, type: "start" });
  }
  async success(message, options = {}) {
    await this.log(message, { ...options, type: "success" });
  }
  async failure(message, options = {}) {
    await this.log(message, { ...options, type: "failure" });
  }
}

function disableEcho() {
  process.stdout.write("\x1B[?25l");
  process.stdout.write("\x1B[8m");
}
function enableEcho() {
  process.stdout.write("\x1B[0m");
  process.stdout.write("\x1B[?25h");
}
function readKey() {
  const { stdin } = process;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  disableEcho();
  return new Promise((resolve) => {
    const handler = (pressed) => {
      stdin.removeListener("data", handler);
      stdin.setRawMode(false);
      stdin.pause();
      enableEcho();
      resolve(pressed);
    };
    stdin.on("data", handler);
  });
}
async function readOption(limit) {
  while (true) {
    const key = await readKey();
    if (key === "") return -1;
    const opt = key >= "0" && key <= "9" ? Number(key) : null;
    if (!opt || opt > limit) {
      process.stdout.write("\x1B[33mInvalid option selected\x1B[0m\n");
      continue;
    }
    return opt - 1;
  }
}
async function runExplore(info, actions, storagePath) {
  const { stdout } = process;
  while (actions.length > 0) {
    stdout.write(`
\x1B[1m${info.title}\x1B[0m
`);
    stdout.write("What do you want to test? Choose one of the following options:\n");
    let count = 1;
    for (const action of actions) {
      stdout.write(`${count++}. ${action.name}
`);
    }
    const opt = await readOption(actions.length);
    if (opt < 0) return;
    stdout.write("\n");
    const { status, feature } = await actions[opt].run();
    actions.splice(opt, 1);
    if (storagePath && status === "passed" && feature) {
      await fs.writeFile(`${storagePath}/${asFilename(feature.name)}.feature`, makeFeature(feature));
    }
  }
}

const program = new Command();
function createJournal({ verbose, silent, artifactPath }) {
  const verbosity = verbose ? 3 : silent ? 0 : 1;
  return new Journal(new CliSink({ verbosity, artifactPath }));
}
async function readStdin() {
  return await new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    const isTTY = Boolean(process.stdin.isTTY);
    if (isTTY) {
      console.error("Enter instructions. Finish with Ctrl-D (Unix/macOS/Linux) or Ctrl-Z then Enter (Windows).");
    }
    process.stdin.on("data", (chunk) => data += chunk);
    process.stdin.on("end", () => resolve(data));
    process.stdin.resume();
  });
}
program.name("letsrunit").description("Run tests like a vibe coder").version("0.1.0");
program.command("explore").argument("<target>", "Target URL or project").option("-v, --verbose", "Enable verbose logging", false).option("-s, --silent", "Only output errors", false).option("-o, --save <path>", "Path to save .feature file", "").action(async (target, opts) => {
  const journal = createJournal({ ...opts, artifactPath: opts.save });
  const { status } = await explore(target, { headless: false, journal }, async (info, actions) => {
    journal.sink.endSection();
    await runExplore(info, actions, opts.save);
  });
  process.exit(status === "passed" ? 0 : 1);
});
program.command("generate").argument("<target>", "Target URL or project").option("-v, --verbose", "Enable verbose logging", false).option("-s, --silent", "Only output errors", false).option("-o, --save <path>", "Path to save .feature file", "").action(async (target, opts) => {
  const instructions = (await readStdin()).trim();
  if (!instructions) {
    console.error("No instructions provided");
    process.exit(1);
  }
  const journal = createJournal({ ...opts, artifactPath: opts.save });
  const { feature, status } = await generate(target, { description: instructions }, { headless: false, journal });
  if (opts.save && feature) {
    await fs__default.writeFile(`${opts.save}/${asFilename(feature.name)}.feature`, makeFeature(feature));
  }
  process.exit(status === "passed" ? 0 : 1);
});
program.command("test").argument("<target>", "Target URL or project").option("-v, --verbose", "Enable verbose logging", false).option("-s, --silent", "Only output errors", false).action(async (target, opts) => {
  await runTest(target, { headless: false, journal: createJournal(opts) });
});
program.parse();
