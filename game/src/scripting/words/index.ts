import { Dictionary } from '../dictionary';
import { IMeaning, InterpretMeaningFn, WordArguments } from '../meaning';
import * as math from './math.operators';
import * as stack from './stack.operators';
import * as combinators from './combinators';

// Create a record entry for each synonym of each word
function spreadWords(
  words: Record<string, IMeaning<WordArguments>>,
): Record<string, InterpretMeaningFn<WordArguments>> {
  return Object.fromEntries(Object.entries(words).reduce((map, [key, word]) => {
    map.set(key, word.interpret);
    word.words?.forEach((synonym) => {
      map.set(synonym, word.interpret);
    });
    return map;
  }, new Map<string, InterpretMeaningFn<WordArguments>>()));
}

export const defaultWords = Dictionary.from({
  ...spreadWords(math),
  ...spreadWords(stack),
  ...spreadWords(combinators),
});
