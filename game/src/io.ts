import { IAction } from '../lib/actions.v2';

export interface HistoryEvent {
  tick: number,
  agentId: number,
  action: IAction
}

export interface SaveFileContents {
  name: string,
  stats: {
    level: number,
    gold: number,
    time: number
  },
  history: Array<HistoryEvent>
}

export type SaveGameId = 0 | 1 | 2

export type SaveGameDict = Record<SaveGameId, SaveFileContents>

export type ExitFn = () => void

export type SaveFn = (saveGameId: SaveGameId, contents: SaveFileContents) => Promise<void>

export type LoadFn = (saveGameId: SaveGameId) => Promise<SaveFileContents>
