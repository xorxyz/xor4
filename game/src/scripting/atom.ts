import { IAction, SerializableType } from '../shared/interfaces';
import { Queue } from '../shared/queue';
import { Dictionary } from './dictionary';
import { Stack } from './stack';

export class Atom {
  readonly type: string;
  readonly lexeme: string;
  readonly value: any;

  constructor(type: string, lexeme: string) {
    this.type = type;
    this.lexeme = lexeme;
  }

  toString(): string {
    return this.lexeme;
  }

  toJS() {
    if (this.value instanceof Array) {
      return this.value.map(atom => atom.toJS());
    }
    return this.value;
  }

  // eslint-disable-next-line class-methods-use-this
  execute(_: Stack, __: Dictionary, ___: Queue<Atom>): IAction | null {
    throw new Error('execute() method is not implemented');
  }

  // eslint-disable-next-line class-methods-use-this
  serialize(): SerializableType {
    throw new Error('serialize() method is not implemented');
  }

  // eslint-disable-next-line class-methods-use-this
  clone(): Atom {
    throw new Error('clone() method is not implemented');
  }
}
