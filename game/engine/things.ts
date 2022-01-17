import { Vector, Points } from 'xor4-lib/math';
import { Place } from './places';

export class Durability extends Points {}
export class Uses extends Points {}
export interface Destination {
  place: Place
  position: Vector
}

export abstract class Thing {
  abstract name: string
  public position: Vector = new Vector();
  public velocity: Vector = new Vector();
  public durability: Durability = new Durability();
  public appearance: string;
  public isStatic: boolean = false;
  private value: string;
  public blocking: boolean = true;

  get label() {
    return `${this.appearance} ${this.name}`;
  }

  read() {
    return this.value;
  }

  write(value: string) {
    this.value = value;
  }

  render() {
    return this.appearance;
  }
}

export abstract class Item extends Thing {}
export abstract class Equipment extends Thing {}
