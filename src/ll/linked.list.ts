interface Node {
  prev: Node | null;
  next: Node | null;
  data: any;
}

interface ILinkedList {
  head: null | Node;
  tail: null | Node;
  length: number;
}

class Node {
  public prev: Node | null;
  public next: Node | null;

  public constructor(data: any) {
    this.data = data;
    this.next = null;
    this.prev = null;
  }
}

export class LinkedList implements ILinkedList {
  public head: Node | null;
  public tail: Node | null;
  public length: number;

  public constructor() {
    this.length = 0;
    this.head = null;
    this.tail = null;
  }

  public isEmpty() {
    return this.length === 0;
  }

  public insertLast(data: any) {
    const node = new Node(data);
    if (!this.head) {
      this.head = node;
      this.tail = node;

      this.tail.next = this.head;
      this.head.prev = this.tail;
    } else {
      const prev = this.tail;
      if (prev) {
        this.tail = node;
        prev.next = this.tail;
        this.tail.prev = prev;
      }
    }

    this.length += 1;
  }

  public insertFirst(data: any) {
    const node = new Node(data);
    if (!this.head) {
      this.head = node;
    } else {
      const head = this.head;
      if (!this.tail) {
        this.tail = head;
        this.tail.next = node;
        this.tail.prev = node;
      }

      this.head = node;
      this.head.prev = this.tail;
      this.head.next = head;
    }

    this.length += 1;
  }
}

if (require.main === module) {
  const ll = new LinkedList();
  // ll.insertLast({ hello: 'world' });
  // ll.insertLast({ hello: 'testing' });

  ll.insertFirst({ test: 42 });
  ll.insertFirst({ foo: 66 });
  ll.insertLast({ key: 'str' });

  console.dir({ tail: ll.tail, head: ll.head });
}
