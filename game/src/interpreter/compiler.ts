import { Scanner, Token, TokenType } from './lexer';
import { Factor, Term } from './types';
import literals, {
  LiteralNumber, LiteralRef, LiteralString, LiteralVector, Quotation,
} from './literals';
import operators, { Operator } from './operators';
import combinators from './combinators';
import syscalls from './syscalls';
import { Vector } from '../shared';

export type Dictionary = Record<string, Factor>

export class Compiler {
  private scanner = new Scanner();
  tokens: Array<Token>;
  dict: Dictionary = {
    ...literals,
    ...operators,
    ...combinators,
    ...syscalls,
  };
  level = 0;
  quotations: Array<Quotation> = [];

  constructor(dict?: Dictionary) {
    this.dict = {
      ...this.dict,
      ...dict,
      help: new Operator(['help'], [], () => {
        throw new Error(`Available words: ${Object.keys(this.dict).sort().join(', ')}.\n`);
      }),
    };
  }

  compile(code: string): Term {
    this.level = 0;
    this.quotations = [];

    const tokens = this.scanner.scan(code);
    const term: Term = tokens.reduce(this.newParseToken.bind(this), []);
    if (this.level !== 0) {
      this.level = 0;
      throw new Error('Unbalanced brackets.');
    }

    return term;
  }

  newParseToken(factors: Array<Factor>, token: Token, index: number) {
    if (token.type === TokenType.LEFT_BRACKET) {
      this.level += 1;
      this.quotations[this.level] = new Quotation();
      return factors;
    }

    if (token.type === TokenType.NUMBER) {
      const literalNumber = new LiteralNumber(token.literal);
      if (this.level === 0) {
        factors.push(literalNumber);
      } else {
        this.quotations[this.level].value.push(literalNumber);
      }
      return factors;
    }

    if (token.type === TokenType.STRING) {
      const literalString = new LiteralString(token.literal);
      if (this.level === 0) {
        factors.push(literalString);
      } else {
        this.quotations[this.level].value.push(literalString);
      }
      return factors;
    }

    if (token.type === TokenType.REF) {
      const literalRef = new LiteralRef(token.literal);
      if (this.level === 0) {
        factors.push(literalRef);
      } else {
        this.quotations[this.level].value.push(literalRef);
      }
      return factors;
    }

    if (token.type === TokenType.RIGHT_BRACKET) {
      let closingQuotation: Quotation | LiteralVector = this.quotations[this.level];

      // Parse the quotation as a LiteralVector if it's a list of 2 numbers
      if (closingQuotation.value.length === 2) {
        const [x, y] = closingQuotation.value.map((item) => item.value);
        if (typeof x === 'number' && typeof y === 'number') {
          closingQuotation = new LiteralVector(new Vector(x, y));
        }
      }

      if (this.level === 1) {
        factors.push(closingQuotation);
      } else {
        if (!this.quotations[this.level - 1]) {
          throw new Error(']: Unbalanced brackets.');
        }
        this.quotations[this.level - 1].value.push(closingQuotation);
      }
      this.level -= 1;
      return factors;
    }

    if (token.type === TokenType.EOF) {
      return factors;
    }

    if (Object.keys(this.dict).includes(token.lexeme)) {
      const word = this.dict[token.lexeme];
      if (this.level === 0) {
        factors.push(word);
      } else {
        this.quotations[this.level].value.push(word);
      }
      return factors;
    }

    throw new Error(`'${token.lexeme}' is not a recognized word.`);
  }
}

function isVector(q: Quotation) {
  return q.value.length === 2 && q.value.every((v) => v.type === 'number');
}
