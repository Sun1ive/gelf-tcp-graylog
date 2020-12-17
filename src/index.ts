import net from 'net';
import debug from 'debug';
import { hostname } from 'os';
import { EventEmitter } from 'events';
import { clearTimeout } from 'timers';

const log = debug('TCP_GELF');

const TIMEOUT = 5000;

export const enum Level {
  EMERGENCY,
  ALERT,
  CRITICAL,
  ERROR,
  WARNING,
  NOTICE,
  INFO,
  DEBUG,
}

type IDefaultOptions = {
  host: string;
  tag: string;
  version: '1.1';
  level: Level;
};

type IGelfOptions = {
  port: number;
  host: string;
  defaults?: IDefaultOptions;
};

type IGelfMessage = {
  short_message: string;
  full_message?: string;
  level?: Level;
  host?: string;
  tag?: string;
  line?: number;
  facility?: string;
};

export class TCPGelf extends EventEmitter {
  private client: net.Socket;
  private timeout?: NodeJS.Timeout;
  private retries = 0;
  private isConnected = false;

  private defaults = {
    host: hostname(),
    tag: 'Node.js',
    facility: 'Node.js',
    version: '1.1',
    level: Level.INFO,
  };

  private reconnect = (): void => {
    const { host, port } = this.options;
    this.retries = this.retries += 1;

    this.timeout = setTimeout(() => {
      log('Reconnect attempt %d', this.retries);
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }

      this.client.connect(port, host);
    }, TIMEOUT);
  };

  public constructor(private readonly options: IGelfOptions) {
    super();
    const { port, host, defaults } = this.options;
    this.client = new net.Socket();
    this.defaults = {
      ...this.defaults,
      ...defaults,
    };

    this.client.on('connect', () => {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }

      this.isConnected = true;
    });

    this.client.on('close', (hadError) => {
      if (hadError) {
        log('onClose had error', hadError);
        if (!this.timeout) {
          this.reconnect();
        }
      }
    });

    this.client.on('error', (err) => {
      log(err);
      this.emit('error', err);

      this.client.end();
      this.client.destroy();

      if (!this.timeout) {
        this.reconnect();
      }
    });

    this.client.connect(port, host);
  }

  public dispose(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }

    this.client.end();
    this.client.destroy();
  }

  public send(message: IGelfMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Socket is not connected'));
      }

      const msg = JSON.stringify({ ...this.defaults, ...message });
      const packet = Buffer.concat([Buffer.from(msg), Buffer.from('\0', 'ascii')]);

      this.client.write(packet, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
