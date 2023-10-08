import { Vector } from '../shared/vector';

export type LayerName = 'lower' | 'middle' | 'upper'

export class Cell {
  readonly position: Vector;

  private layers = new Map<LayerName, null | number>();

  constructor(x: number, y: number) {
    this.position = new Vector(x, y);
  }

  get(layer: LayerName = 'middle'): number {
    return this.layers.get(layer) || 0;
  }

  put(layer: LayerName, id: number): void {
    if (this.layers.get(layer)) throw new Error('There is already something here.');
    this.layers.set(layer, id);
  }

  remove(id: number): void {
    [...this.layers.entries()].forEach(([key, value]) => {
      if (value === id) {
        this.layers.set(key, null);
      }
    });
  }

  contains(id: number): boolean {
    return [...this.layers.values()].includes(id);
  }

  find(id: number): LayerName[] {
    const layer = [...this.layers.entries()]
      .filter(([_, value]) => value === id)
      .map(([key]) => key);

    if (!layer.length) throw new Error(`Entity &${id} is not in cell ${this.position.label}`);

    return layer;
  }
}
