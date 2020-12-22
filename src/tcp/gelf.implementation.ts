import net from 'net';
import { queue, QueueObject } from 'async';
import debug from 'debug';
import { hostname } from 'os';
import { EventEmitter } from 'events';
import { clearTimeout } from 'timers';
import { Level, IGelfOptions, IGelfMessage, IGelfMeta } from '../interfaces/gelf.interface';

const log = debug('TCP_GELF');

const TIMEOUT = 5000;

export class TCPGelf extends EventEmitter {
  private client: net.Socket;
  private timeout?: NodeJS.Timeout;
  private retries = 0;

  private q: QueueObject<() => Promise<void>> = queue((job, callback) => {
    job().then(
      () => callback(),
      (err) => callback(err),
    );
  }, 1);

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
    this.defaults = {
      ...this.defaults,
      ...defaults,
    };
    this.q.drain(() => {
      log('DRAIN Q', this.q.idle());
    });

    this.client = new net.Socket();
    this.client.on('data', (chunk) => {
      log(chunk);
    });

    this.client.on('connect', () => {
      log('Connected');
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }
    });

    this.client.on('ready', () => {
      log('ready');
      if (this.q.paused) {
        this.q.resume();
      }
    });

    this.client.on('close', (hadError) => {
      if (hadError) {
        log('onClose had error', hadError);
        if (!this.q.paused) {
          this.q.pause();
        }

        if (!this.timeout) {
          this.reconnect();
        }
      }
    });

    this.client.on('error', (err) => {
      this.emit('error', err);
      if (!this.q.paused) {
        this.q.pause();
      }

      this.client.end();
      this.client.destroy();

      if (!this.timeout) {
        this.reconnect();
      }
    });

    this.client.on('drain', () => {
      log('Socket drain');
    });

    this.client.connect(port, host);
  }

  public async dispose(): Promise<void> {
    log('Disconnecting');
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }

    await this.q.drain();

    this.client.end();
    this.client.destroy();
  }

  public send(message: IGelfMessage, meta?: IGelfMeta) {
    const msg = JSON.stringify({ ...this.defaults, ...message, ...meta });
    const packet = Buffer.concat([Buffer.from(msg), Buffer.from('\0', 'ascii')]);

    this.q.push(
      () =>
        new Promise((res, rej) => {
          this.client.write(packet, (err) => {
            log(this.client.bufferSize);
            if (err) {
              rej(err);
            } else {
              res(undefined);
            }
          });
        }),
    );
  }
}
