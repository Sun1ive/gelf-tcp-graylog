import debug from 'debug';

const log = debug('TCP_QUEUE_IMPL');

interface IQueue {}

export class Queue<T> implements IQueue {
  private _innerQueue: T[] = [];

  public constructor() {}
}
