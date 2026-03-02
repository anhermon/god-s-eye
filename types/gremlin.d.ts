declare module "gremlin" {
  class DriverRemoteConnection {
    constructor(url: string, options?: Record<string, unknown>);
    open(): Promise<void>;
    close(): Promise<void>;
  }

  class Graph {
    traversal(): GraphTraversalSource;
  }

  class Client {
    constructor(url: string, options?: Record<string, unknown>);
    submit(script: string, bindings?: Record<string, unknown>): Promise<ResultSet>;
    close(): Promise<void>;
  }

  interface ResultSet {
    toArray(): unknown[];
  }

  class GraphTraversalSource {
    withRemote(connection: DriverRemoteConnection): GraphTraversalSource;
    V(...args: unknown[]): GraphTraversal;
    E(...args: unknown[]): GraphTraversal;
    addV(label: string): GraphTraversal;
    addE(label: string): GraphTraversal;
  }

  class GraphTraversal {
    V(...args: unknown[]): GraphTraversal;
    E(...args: unknown[]): GraphTraversal;
    has(...args: unknown[]): GraphTraversal;
    hasLabel(...args: unknown[]): GraphTraversal;
    property(...args: unknown[]): GraphTraversal;
    values(...args: unknown[]): GraphTraversal;
    out(...args: unknown[]): GraphTraversal;
    in_(...args: unknown[]): GraphTraversal;
    both(...args: unknown[]): GraphTraversal;
    outE(...args: unknown[]): GraphTraversal;
    inE(...args: unknown[]): GraphTraversal;
    inV(): GraphTraversal;
    outV(): GraphTraversal;
    as(label: string): GraphTraversal;
    select(...args: unknown[]): GraphTraversal;
    where(traversal: GraphTraversal): GraphTraversal;
    fold(): GraphTraversal;
    unfold(): GraphTraversal;
    coalesce(...args: GraphTraversal[]): GraphTraversal;
    addV(label: string): GraphTraversal;
    addE(label: string): GraphTraversal;
    to(traversal: GraphTraversal): GraphTraversal;
    from_(traversal: GraphTraversal): GraphTraversal;
    project(...keys: string[]): GraphTraversal;
    by(...args: unknown[]): GraphTraversal;
    order(...args: unknown[]): GraphTraversal;
    limit(...args: unknown[]): GraphTraversal;
    dedup(): GraphTraversal;
    groupCount(): GraphTraversal;
    repeat(traversal: GraphTraversal): GraphTraversal;
    times(count: number): GraphTraversal;
    simplePath(): GraphTraversal;
    constant(value: unknown): GraphTraversal;
    local: GraphTraversal;
    next(): Promise<{ value: unknown; done: boolean }>;
    toList(): Promise<unknown[]>;
  }

  const statics: {
    [key: string]: (...args: unknown[]) => GraphTraversal;
  } & {
    V(...args: unknown[]): GraphTraversal;
    unfold(): GraphTraversal;
    addV(label: string): GraphTraversal;
    addE(label: string): GraphTraversal;
    select(...args: unknown[]): GraphTraversal;
    values(...args: unknown[]): GraphTraversal;
    coalesce(...args: unknown[]): GraphTraversal;
    constant(value: unknown): GraphTraversal;
    inV(): GraphTraversal;
    outV(): GraphTraversal;
    out(...args: unknown[]): GraphTraversal;
    in_(...args: unknown[]): GraphTraversal;
    both(...args: unknown[]): GraphTraversal;
    has(...args: unknown[]): GraphTraversal;
    hasLabel(...args: unknown[]): GraphTraversal;
    local: GraphTraversal;
  };

  const t: {
    id: unknown;
    key: unknown;
    label: unknown;
    value: unknown;
  };

  const P: {
    eq(value: unknown): unknown;
    neq(value: unknown): unknown;
    lt(value: unknown): unknown;
    lte(value: unknown): unknown;
    gt(value: unknown): unknown;
    gte(value: unknown): unknown;
    inside(low: unknown, high: unknown): unknown;
    between(low: unknown, high: unknown): unknown;
    within(...values: unknown[]): unknown;
    without(...values: unknown[]): unknown;
  };

  const order: {
    asc: unknown;
    desc: unknown;
  };

  const column: {
    keys: unknown;
    values: unknown;
  };

  const direction: {
    IN: unknown;
    OUT: unknown;
    BOTH: unknown;
  };

  const cardinality: {
    single: unknown;
    list: unknown;
    set: unknown;
  };

  namespace driver {
    export { DriverRemoteConnection, Client };
  }

  namespace structure {
    export { Graph };
  }

  class AnonymousTraversalSource {
    with_(connection: DriverRemoteConnection): GraphTraversalSource;
  }

  function traversal(): AnonymousTraversalSource;

  namespace process {
    export {
      GraphTraversalSource,
      GraphTraversal,
      AnonymousTraversalSource,
      traversal,
      statics,
      t,
      P,
      order,
      column,
      direction,
      cardinality,
    };
  }
}
