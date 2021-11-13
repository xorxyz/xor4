import { createServer, Server, Socket } from 'net';
import Connection from './connection';
import { Engine } from '../engine/engine';
import { Terminal } from '../ui/terminal';
import { Agent, Cursor, CursorAgentType, Hero, Wizard } from '../engine/agents';

export interface Params { src?: string }

export default class GameServer {
  private i: number = 0
  private engine: Engine
  private tcpServer: Server
  private connections: Set<Connection> = new Set()
  private terminals: Set<Terminal> = new Set()

  constructor(engine: Engine) {
    this.engine = engine;
    this.tcpServer = createServer(this.onConnection.bind(this));

    process.on('beforeExit', () => this.tcpServer.close());
  }

  async onConnection(socket: Socket) {
    const id = this.i++;
    const player = new Hero(new Wizard());
    const cursor = new Cursor(new CursorAgentType());

    player.name = 'Guest';
    player.hp.increase(10);
    player.mp.increase(10);
    player.position.setXY(4,4)

    cursor.position.setXY(8, 5)

    this.engine.world.rooms[0].add(player);
    this.engine.world.rooms[0].add(cursor);

    const connection = new Connection(player, socket, () => {
      const room = this.engine.world.find(player)
      
      if (room) {
        room.remove(player);
        room.remove(cursor);
      }

      this.connections.delete(connection);
    });

    const terminal = new Terminal(id, connection, cursor);

    this.connections.add(connection);
    this.terminals.add(terminal);

    socket.on('data', (buf: Buffer) => {
      console.log(buf);
      terminal.handleInput(buf.toString('hex'));
    });

    socket.on('error', connection.disconnect);
    socket.on('end', connection.disconnect);
    socket.on('close', connection.disconnect);
  }

  listen(...args): void {
    this.tcpServer.listen(...args);
  }
}
