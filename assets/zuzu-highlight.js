(function () {
	'use strict';

	if ( typeof document === 'undefined' ) {
		return;
	}

	var STYLE_ID = 'zuzu-highlight-js-style';
	var KEYWORDS = new Set( [
		'__argc__', '__file__', '__global__', '__system__',
		'as', 'assert', 'async', 'await', 'but', 'case',
		'catch', 'class', 'clear', 'const', 'continue',
		'debug', 'die', 'do', 'else', 'extends', 'false', 'fn',
		'for', 'from', 'function', 'get', 'has', 'if', 'import', 'last',
		'let', 'method', 'new', 'next', 'null', 'print', 'return', 'say',
		'self', 'set', 'spawn', 'static', 'super', 'switch', 'throw', 'trait',
		'true', 'try', 'unless', 'warn', 'weak', 'while', 'with'
	] );

	var WORD_OPERATORS = new Set( [
		'abs', 'and', 'and?', 'butnot', 'butnot?', 'can', 'ceil', 'cmp',
		'cmpi', 'default', 'divides', 'does', 'eq', 'eqi', 'equivalentof',
		'floor', 'ge', 'gei', 'gt', 'gti', 'in', 'instanceof', 'int',
		'intersection', 'lc', 'le', 'lei', 'length', 'lt', 'lti', 'mod',
		'nand', 'nand?', 'ne', 'nei', 'nor', 'nor?', 'not', 'onlyif',
		'onlyif?', 'or', 'or?', 'round', 'sqrt', 'subsetof', 'supersetof',
		'typeof', 'uc', 'union', 'xnor', 'xnor?', 'xor', 'xor?'
	] );

	var BUILTIN_TYPES = new Set( [
		'Any', 'Array', 'AssertionException', 'Bag', 'BinaryString',
		'Boolean', 'CancelledException', 'ChannelClosedException', 'Class',
		'Collection', 'Dict', 'Exception', 'Function', 'Null', 'Number',
		'Object', 'Pair', 'PairList', 'Regexp', 'Set', 'String', 'Task',
		'TimeoutException', 'Trait', 'TypeException'
	] );
	var IDENTIFIER_SOURCE = '(?:[A-Za-z]|_[A-Za-z0-9_])[A-Za-z0-9_]*';
	var IDENTIFIER_FLAGS = '';
	try {
		new RegExp( '\\p{ID_Start}', 'u' );
		IDENTIFIER_SOURCE = '(?:\\p{ID_Start}|_[\\p{ID_Continue}_])[\\p{ID_Continue}_]*';
		IDENTIFIER_FLAGS = 'u';
	} catch ( err ) {
	}
	var IDENTIFIER_RE = new RegExp( '^(?:' + IDENTIFIER_SOURCE + ')$', IDENTIFIER_FLAGS );
	var TOKEN_PATTERN_SOURCE = [
		'\\/\\/[^\\n]*',
		'\\/\\*[\\s\\S]*?\\*\\/',
		'"""[\\s\\S]*?"""',
		"'''[\\s\\S]*?'''",
		'```[\\s\\S]*?```',
		'"(?:\\\\.|[^"\\\\])*"',
		"'(?:\\\\.|[^'\\\\])*'",
		'`(?:\\\\.|[^`\\\\])*`',
		'\\/(?![\\/\\*=\\s])(?:\\\\.|\\[[^\\]\\\\]*(?:\\\\.[^\\]\\\\]*)*\\]|\\$\\{[^}]*\\}|[^\\/\\\\\\n])+\\/[ig]*',
		'0x[\\da-fA-F]+',
		'0b[01]+',
		'0o[0-7]+',
		'\\d+(?:\\.\\d+)?(?:E[+-]?\\d+)?',
		'⊤|⊥|∅',
		'\\b(?:and|or|xor|nand|nor|xnor|onlyif|butnot)\\?',
		'\\.\\.\\.',
		'\\^\\^',
		'<<<|>>>',
		'\\*\\*=',
		'\\?:=',
		'<=>',
		'\\?:',
		'=>',
		'->|→',
		'\\|>|<\\|',
		'@\\?|@@',
		'~=',
		':=',
		'\\.\\(',
		'\\{\\{|\\}\\}',
		'<<|>>',
		'«|»',
		'\\.\\.',
		'⋀\\?|⋁\\?|⊻\\?|⊼\\?|⊽\\?|↔\\?|⊨\\?|⊭\\?',
		'==|!=|<=|>=',
		'≠|≤|≥|≡|≢|≶|≷',
		'∣|∤',
		'\\+=|-=|\\*=|\\/=|%=|_=',
		'\\+\\+|--',
		'\\*\\*',
		'⊂⊃',
		'×=|÷=',
		'[+\\-*/%<>=!?:|&.^~×÷⋀⋁⊻⊼⊽↔⊨⊭¬∈∉⋃⋂∖\\\\⊂⊃@√⌊⌋⌈⌉▷◁]',
		'[{}()[\\],;.]',
		'\\s+',
		IDENTIFIER_SOURCE
	].join( '|' );
	var TOKEN_PATTERN_FLAGS = 'g' + IDENTIFIER_FLAGS;

	function escapeHtml( text ) {
		return text
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );
	}

	function classifyToken( token, nextToken ) {
		if ( /^\s+$/.test( token ) ) {
			return 'ws';
		}

		if ( /^\/\//.test( token ) || /^\/\*/.test( token ) ) {
			return 'comment';
		}

		if ( /^(?:"""[\s\S]*?"""|'''[\s\S]*?'''|```[\s\S]*?```|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)$/s.test( token ) ) {
			return 'string';
		}

		if ( /^\/(?![\/\*=\s])(?:\\.|\[[^\]\\]*(?:\\.[^\]\\]*)*\]|\$\{[^}]*\}|[^\/\\\n])+\/[ig]*$/.test( token ) ) {
			return 'string';
		}

		if ( /^(?:0x[\da-fA-F]+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?(?:E[+-]?\d+)?)$/.test( token ) ) {
			return 'number';
		}

		if ( /^[⊤⊥∅]$/.test( token ) ) {
			return 'literal';
		}

		if ( token === '^^' ) {
			return 'ident';
		}

		if ( /^(?:\.\.\.|<<<|>>>|\*\*=|\?:=|<=>|\?:|=>|->|→|\|>|<\||@\?|@@|~=|:=|\.\(|\{\{|\}\}|<<|>>|«|»|\.\.|⋀\?|⋁\?|⊻\?|⊼\?|⊽\?|↔\?|⊨\?|⊭\?|==|!=|<=|>=|≠|≤|≥|≡|≢|≶|≷|∣|∤|\+=|-=|\*=|\/=|%=|_=|\+\+|--|\*\*|⊂⊃|×=|÷=|[+\-*/%<>=!?:|&.^~×÷⋀⋁⊻⊼⊽↔⊨⊭¬∈∉⋃⋂∖\\⊂⊃«»@√⌊⌋⌈⌉▷◁])$/.test( token ) ) {
			return 'operator';
		}

		if ( /^[{}()[\],;.]$/.test( token ) ) {
			return 'punct';
		}

		if ( IDENTIFIER_RE.test( token ) && KEYWORDS.has( token ) ) {
			return 'keyword';
		}

		if (
			token === 'default'
			&& nextToken === ':'
		) {
			return 'keyword';
		}

		if ( WORD_OPERATORS.has( token ) ) {
			return 'operator';
		}

		if ( IDENTIFIER_RE.test( token ) && BUILTIN_TYPES.has( token ) ) {
			return 'keyword';
		}

		if ( IDENTIFIER_RE.test( token ) ) {
			return 'ident';
		}

		return 'plain';
	}

	function tokenizeCode( source ) {
		var tokenPattern = new RegExp( TOKEN_PATTERN_SOURCE, TOKEN_PATTERN_FLAGS );
		var parts = [];
		var match;
		var lastIndex = 0;

		while ( ( match = tokenPattern.exec( source ) ) !== null ) {
			if ( match.index > lastIndex ) {
				parts.push( {
					token: source.slice( lastIndex, match.index ),
					isToken: false
				} );
			}

			parts.push( {
				token: match[0],
				isToken: true
			} );
			lastIndex = tokenPattern.lastIndex;
		}

		if ( lastIndex < source.length ) {
			parts.push( {
				token: source.slice( lastIndex ),
				isToken: false
			} );
		}

		var html = '';
		parts.forEach( function ( part, idx ) {
			var token = part.token;
			if ( !part.isToken ) {
				html += escapeHtml( token );
				return;
			}

			var type = classifyToken( token, nextSignificantToken( parts, idx ) );
			if ( type === 'ws' || type === 'plain' ) {
				html += escapeHtml( token );
			} else {
				html += '<span class="zuzu-hl-' + type + '">' + escapeHtml( token ) + '</span>';
			}
		} );

		return html;
	}

	function nextSignificantToken( parts, idx ) {
		for ( var look = idx + 1; look < parts.length; look++ ) {
			if ( !parts[look].isToken || /^\s+$/.test( parts[look].token ) ) {
				continue;
			}
			return parts[look].token;
		}

		return '';
	}

	function tokenize( source ) {
		var html = '';
		var inPod = false;
		var codeLines = [];
		var lines = source.match( /[^\n]*\n|[^\n]+/g ) || [];
		var flushCode = function () {
			if ( codeLines.length === 0 ) {
				return;
			}
			html += tokenizeCode( codeLines.join( '' ) );
			codeLines = [];
		};

		lines.forEach( function ( line ) {
			if ( !inPod && /^=\w+\b/.test( line ) ) {
				flushCode();
				inPod = true;
			}

			if ( inPod ) {
				html += escapeHtml( line );
				if ( /^=cut\b/.test( line ) ) {
					inPod = false;
				}
				return;
			}

			codeLines.push( line );
		} );

		flushCode();

		return html;
	}

	function ensureStyle() {
		if ( document.getElementById( STYLE_ID ) ) {
			return;
		}

		var style = document.createElement( 'style' );
		style.id = STYLE_ID;
		style.textContent = [
			'.zuzu-highlight { color: #d9dde7; background: #1f2430; }',
			'.zuzu-highlight .zuzu-hl-keyword { color: #ffcc66; font-weight: 600; }',
			'.zuzu-highlight .zuzu-hl-string { color: #95e6cb; }',
			'.zuzu-highlight .zuzu-hl-literal { color: #f29e74; }',
			'.zuzu-highlight .zuzu-hl-number { color: #f29e74; }',
			'.zuzu-highlight .zuzu-hl-comment { color: #5c6773; font-style: italic; }',
			'.zuzu-highlight .zuzu-hl-operator { color: #89ddff; }',
			'.zuzu-highlight .zuzu-hl-punct { color: #c3a6ff; }',
			'.zuzu-highlight .zuzu-hl-ident { color: #d9dde7; }'
		].join( '\n' );
		document.head.appendChild( style );
	}

	function highlightElement( element ) {
		if ( !element || element.dataset.zuzuHighlighted === '1' ) {
			return;
		}

		var target = element;
		if ( element.matches( 'pre.zuzu-highlight' ) ) {
			var childCode = element.querySelector( ':scope > code' );
			if ( childCode ) {
				target = childCode;
			}
		}

		if ( target.dataset.zuzuHighlighted === '1' ) {
			element.dataset.zuzuHighlighted = '1';
			return;
		}

		target.innerHTML = tokenize( target.textContent || '' );
		target.dataset.zuzuHighlighted = '1';
		element.dataset.zuzuHighlighted = '1';
	}

	function runHighlight() {
		ensureStyle();
		var nodes = document.querySelectorAll( 'pre.zuzu-highlight, code.zuzu-highlight' );
		nodes.forEach( highlightElement );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', runHighlight, { once: true } );
	} else {
		runHighlight();
	}
})();
