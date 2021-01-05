import { EventEmitter } from 'events';
import Clock from './clock';
import { 
  Component, Entity, GameSystem, SystemComponents, SystemComponentMap
} from '../lib/ecs';

export default class Engine extends EventEmitter {
  private clock: Clock = new Clock()

  private entities: Array<Entity> = []
  private components: Array<Component> = []
  private systems: Array<GameSystem> = []

  private systemComponents: SystemComponentMap = new Map()

  constructor() {
    super()
    this.clock.on('tick', this.update.bind(this));

    this.systems.forEach((system) => {
      const componentMap = this.componentsOf(system);
      this.systemComponents.set(system, componentMap);
    });
  }

  start() { this.clock.start(); }
  pause() { this.clock.pause(); }

  register (gameSystem: GameSystem) {
    this.systems.push(gameSystem)
  }

  componentsOf(gameSystem: GameSystem): SystemComponents {
    const components: SystemComponents = new Map();

    gameSystem.componentTypes.forEach((type) => {
      components.set(type, this.components.filter((component) => {
        return component.type === type;
      }));
    });

    return components;
  }

  create(components: Array<Component>) {
    const entity = new Entity(components);

    this.entities.push(entity);
  }

  update() {
    this.systems.forEach((system) => {
      const componentMap = this.systemComponents.get(system);
      if (!componentMap) {
        console.error('missing components for system:', system);
        return false;
      }

      return system.update(componentMap);
    });
  }

  destroy(id) {
    this.entities.find((e) => e.id === id);
  }
}
