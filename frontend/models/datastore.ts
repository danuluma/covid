import { Regions } from "./regions";

export type DatastoreThunks = {
  regions: Thunk<Regions>;
  geoData: Thunk<any>;
  containments: Thunk<any>;
};

export class Datastore {
  constructor(private thunks: DatastoreThunks) {}

  get containments() {
    return this.thunks.containments.poll();
  }

  get regions() {
    return this.thunks.regions.poll();
  }

  get geoData() {
    return this.thunks.geoData.poll();
  }
}

let i = 0;

export class Thunk<T> {
  private name: string;
  private promise: Promise<T> | null = null;

  constructor(private thunk: () => Promise<T>, name?: string) {
    this.name = name ?? `${i++}`;
    console.trace(`Created thunk ${this.name}`);
  }

  static fetch(input: RequestInfo, init?: RequestInit): Thunk<Response> {
    let name = typeof input === "string" ? input : undefined;
    return new Thunk(() => fetch(input, init), name);
  }

  static fetchThen<T>(
    input: RequestInfo,
    f: (obj: Response) => T | PromiseLike<T>
  ): Thunk<T> {
    let name = typeof input === "string" ? input : undefined;
    return new Thunk<T>(() => fetch(input).then(f), name);
  }

  static fetchJson<T = any>(input: RequestInfo, init?: RequestInit): Thunk<T> {
    let name = typeof input === "string" ? input : undefined;
    return new Thunk(() => fetch(input, init).then(res => res.json()), name);
  }

  poll() {
    console.trace(`Poll thunk ${this.name}`);
    if (this.promise === null) {
      console.trace(`Resolving thunk ${this.name}`);
      this.promise = this.thunk();
    }
    return this.promise;
  }

  map<V>(f: (v: T) => V | PromiseLike<V>): Thunk<V> {
    return new Thunk(() => this.poll().then(f));
  }
}
