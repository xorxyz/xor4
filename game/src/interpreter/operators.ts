import { debug, Stack } from '../shared';
import {
  ExecuteArgs, Factor, Literal,
} from './types';
import { LiteralNumber, LiteralString, LiteralTruth } from './literals';

export class Operator extends Factor {
  signature: Array<string>;
  execute: (args: ExecuteArgs) => unknown;
  aliases: Array<string>;

  constructor(
    aliases: Array<string>,
    signature: Array<string>,
    execute: (args: ExecuteArgs) => unknown,
  ) {
    super(aliases[0]);
    this.signature = signature;
    this.execute = execute;
    this.aliases = aliases;
  }

  validate(stack: Stack<Factor>) {
    if (!this.signature.length) return;

    if (this.signature.length > stack.length) {
      debug(this.signature.length, stack.length);
      throw new Error(
        `${this.aliases[0]}: missing operand(s), expected [${this.signature.join(' ')}]`,
      );
    }

    const args = stack.slice(-this.signature.length);

    args.forEach((arg: Factor, i) => {
      const type = this.signature[i];
      if (!(arg instanceof Literal)) {
        throw new Error(`${this.aliases[0]}: arg not instanceof Literal`);
      }
      if (type !== 'any' && arg.type !== type) {
        throw new Error(`${this.aliases[0]}:`
          + 'signature doesn\'t match stack type. \n'
          + `expected: '${type}' got: '${arg.type}' at arg ${i}`);
      }
    });
  }

  toString() {
    return this.lexeme;
  }
}

export const sum = new Operator(['+', 'sum', 'add'], ['number', 'number'], ({ stack }) => {
  const b = stack.pop() as LiteralNumber;
  const a = stack.pop() as LiteralNumber;
  const result = a.value + b.value;

  stack.push(new LiteralNumber(result));
});

export const difference = new Operator(['-', 'minus'], ['number', 'number'], ({ stack }) => {
  const [b] = stack.popN(1);
  const [a] = stack.popN(1);
  const result = (a as LiteralNumber).value - (b as LiteralNumber).value;

  stack.push(new LiteralNumber(result));
});

export const product = new Operator(['*', 'mul'], ['number', 'number'], ({ stack }) => {
  const [b] = stack.popN(1);
  const [a] = stack.popN(1);
  const result = (a as LiteralNumber).value * (b as LiteralNumber).value;

  stack.push(new LiteralNumber(result));
});

export const division = new Operator(['/', 'quotient'], ['number', 'number'], ({ stack }) => {
  const [b] = stack.popN(1);
  const [a] = stack.popN(1);
  const result = (a as LiteralNumber).value / (b as LiteralNumber).value;

  stack.push(new LiteralNumber(result));
});

export const dup = new Operator(['dup'], ['any'], ({ stack }) => {
  const a = stack.pop();

  if (!a) return;

  stack.push(a);
  stack.push(a);
});

export const dupd = new Operator(['dupd'], ['any', 'any'], ({ stack }) => {
  const a = stack.pop() as Factor;
  const b = stack.pop() as Factor;

  stack.push(b);
  stack.push(b);
  stack.push(a);
});

export const swap = new Operator(['swap'], ['any', 'any'], ({ stack }) => {
  const a = stack.pop();
  const b = stack.pop();

  if (!a || !b) return;

  stack.push(a);
  stack.push(b);
});

export const swapd = new Operator(['swapd'], ['any', 'any', 'any'], ({ stack }) => {
  const a = stack.pop() as Factor;
  const b = stack.pop() as Factor;
  const c = stack.pop() as Factor;

  stack.push(b);
  stack.push(c);
  stack.push(a);
});

export const pop = new Operator(['pop'], ['any'], ({ stack }) => {
  stack.pop();
});

export const popd = new Operator(['popd'], ['any', 'any'], ({ stack }) => {
  const a = stack.pop() as Factor;
  stack.pop();
  stack.push(a);
});

export const cat = new Operator(['cat'], ['string', 'string'], ({ stack }) => {
  const b = stack.pop() as LiteralString;
  const a = stack.pop() as LiteralString;

  stack.push(new LiteralString(a.value + b.value));
});

export const clear = new Operator(['clear'], [], ({ stack }) => {
  stack.popN(stack.length);
});

export const typeOf = new Operator(['typeof'], ['any'], ({ stack }) => {
  const a = stack.pop();

  if (a) {
    stack.push(a);
    stack.push(new LiteralString(a.type));
  }
});

export const equals = new Operator(['=='], ['any', 'any'], ({ stack }) => {
  const a = stack.pop() as Factor;
  const b = stack.pop() as Factor;

  const result = new LiteralTruth(a.type === b.type && a.value === b.value);

  stack.push(result);
});

export const notEquals = new Operator(['!='], ['any', 'any'], ({ stack }) => {
  const a = stack.pop() as Factor;
  const b = stack.pop() as Factor;

  const result = new LiteralTruth(a.type !== b.type || a.value !== b.value);

  stack.push(result);
});

const operators = {};

[
  equals, notEquals,
  sum, difference, product, division,
  dup, dupd, pop, popd,
  swap, swapd, cat, clear, typeOf,
].forEach((operator) => {
  operator.aliases.forEach((alias) => {
    operators[alias] = operator;
  });
});

export default operators;
