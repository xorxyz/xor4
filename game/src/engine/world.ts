import { Stack, Vector } from '../shared';
import { Area } from './area';
import { BodyType, Thing } from './thing';
import { Agent, AgentType, IFacing } from './agent';
import {
  Bug, King, Man, Spirit,
} from './agents';
import { Tree, Wall } from './things';
import words from './words';

/** @category World */
export type Memory = Array<Thing>

/** @category World */
export type DataStack = Stack<Thing>

export interface Position {
  area: Vector,
  cell: Vector,
  facing: IFacing
}

export type AgentTypeName = 'king' | 'bug' | 'man' | 'spirit'
export type BodyTypeName = 'tree' | 'wall'

export const AgentTypeDict: Record<AgentTypeName, new () => AgentType> = {
  king: King,
  bug: Bug,
  man: Man,
  spirit: Spirit,
};

export const BodyTypeDict: Record<BodyTypeName, new () => BodyType> = {
  tree: Tree,
  wall: Wall,
};

/** @category World */
export class World {
  public tick = 0;
  public areas: Array<Area>;
  public agents: Set<Agent> = new Set();
  public things: Set<Thing> = new Set();
  public origin = new Area(0, 0);
  public creator: Agent;
  public hero: Agent;
  public counter = 0;

  constructor(areas: Array<Area> = []) {
    this.areas = [this.origin, ...areas];
    this.creator = this.spawn('king', this.origin);
    this.hero = this.creator;
  }

  spawn(agentType: AgentTypeName, area: Area, position?: Vector) {
    const AgentTypeCtor = AgentTypeDict[agentType];
    const agent = new Agent(this.counter++, new AgentTypeCtor(), words);
    this.agents.add(agent);
    area.put(agent, position);
    return agent;
  }

  create(bodyType: BodyTypeName, area: Area, position?: Vector) {
    const BodyTypeCtor = BodyTypeDict[bodyType];
    console.log(bodyType, bodyType, 'ctor', BodyTypeCtor);
    const thing = new Thing(this.counter++, new BodyTypeCtor());
    this.things.add(thing);
    area.put(thing, position);
    return thing;
  }

  find(agent: Agent): Area | null {
    return this.areas.find((area) => area.has(agent)) || null;
  }

  clear() {
    this.areas.forEach((area) => area.clear());
  }
}
