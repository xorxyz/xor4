import { debug } from '../shared';
import { Factor, Literal } from './types';
import { LiteralTruth, Quotation } from './literals';
import { Operator } from './operators';

export class Combinator extends Operator {}

export const concat = new Combinator(['concat'], ['quotation', 'quotation'], ({ stack }) => {
  const a = stack.pop() as Quotation;
  const b = stack.pop() as Quotation;

  stack.push(new Quotation(b.value.concat(a.value)));
});

// [b] [a] -> [[b] a]
export const cons = new Combinator(['cons'], ['any', 'quotation'], ({ stack }) => {
  const b = stack.pop() as Quotation;
  const a = stack.pop() as Literal;

  const next = new Quotation();

  next.add(a);
  b.value.forEach((factor) => {
    next.add(factor);
  });

  stack.push(next);
});

// a -> [a]
export const unit = new Combinator(['unit'], ['any'], ({ stack }) => {
  const a = stack.pop() as Factor;
  const next = new Quotation();

  next.add(a);
  stack.push(next);
});

export const i = new Combinator(['i'], ['quotation'], ({ stack, exec }) => {
  const program = stack.pop() as Quotation;

  exec(program.toString().slice(1, -1));
});

export const map = new Combinator(['map'], ['quotation', 'quotation'], ({ stack, exec }) => {
  const program = stack.pop() as Quotation;
  const list = stack.pop() as Quotation;

  const programs = list.value.map((f) => new Quotation([f, ...program.value]));

  exec(programs.map((p) => p.toString().slice(1, -1)).join(' '));
});

export const filter = new Combinator(['filter'], ['quotation', 'quotation'], ({ stack, exec }) => {
  const program = stack.pop() as Quotation;
  const list = stack.pop() as Quotation;

  const results = new Quotation();

  console.log('filtering:', list.toString(), program.toString());

  const fns = list.value.map((item) => (done: () => void) => {
    stack.push(item);
    console.log(`executing: ${program.toString()}`, 'with stack:', stack.map((f) => f.toString()));
    exec(program.dequote(), () => {
      const v = stack.pop();
      console.log('top of stack', v);
      if (v instanceof LiteralTruth && v.value === true) {
        results.add(item);
      }
      done();
    });
  });

  runSeries(fns, () => {
    stack.push(results);
  });
});

function runSeries(arr: Array<(cb: () => void) => void>, callback: () => void) {
  if (!arr.length) {
    callback();
    return;
  }

  const next = arr.shift() as (cb) => void;

  next(() => runSeries(arr, callback));
}

// [C] [B] [A] -> B || A
export const ifte = new Combinator(['ifte'], ['quotation', 'quotation', 'quotation'], ({ stack, exec }) => {
  const a = stack.pop() as Quotation;
  const b = stack.pop() as Quotation;
  const c = stack.pop() as Quotation;

  exec(c.toString().slice(1, -1), () => {
    const tested = stack.pop();

    debug('result of test:', tested);
    const selectedProgram = tested && tested.value
      ? b
      : a;

    exec(selectedProgram.toString().slice(1, -1));
  });
});

const combinators = {};

[
  concat, cons, unit,
  i,
  map, filter, ifte,
].forEach((combinator) => {
  combinator.aliases.forEach((alias) => {
    combinators[alias] = combinator;
  });
});

export default combinators;
