import { EventEmitter } from 'events';
import debug from 'debug';

const log = debug('TCP_QUEUE_IMPL');

interface ITask {
  job: (next: (err?: any, val?: any) => void) => void;
}

export enum EVENTS {
  NEW_JOB = 'newJob',
  DRAIN = 'drain',
  ERROR = 'error',
  NEXT = 'next',
}

export class Queue extends EventEmitter {
  private _queue: ITask[] = [];
  private _started = false;
  private _pending = 0;

  private process = () => {
    const task = this._queue.shift();

    const next = (err?: any, val?: any): void => {
      log('Call results %o %o', err, val);

      this._pending -= 1;
      if (this._pending === 0) {
        this.emit(EVENTS.DRAIN, true);
      } else {
        this.emit(EVENTS.NEXT);
      }
    };

    if (task && typeof task.job === 'function') {
      task.job(next);
    }
  };

  public constructor() {
    super();
    this.on(EVENTS.DRAIN, () => console.log('DRAIN'));
    this.on(EVENTS.NEXT, this.process);
  }

  public push(task: ITask) {
    this._queue.push(task);
    this._pending += 1;

    if (this._started) {
      this.emit(EVENTS.NEXT);
    }
  }

  public start() {
    if (this._started) {
      throw new Error('Already started');
    }
    log('started');

    this._started = true;
    this.emit(EVENTS.NEXT);
  }

  public stop() {
    this.clear();
    this._started = false;
  }

  public clear() {
    this._queue = [];
  }
}
