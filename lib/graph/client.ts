import gremlin from "gremlin";

const { DriverRemoteConnection } = gremlin.driver;
const { GraphTraversalSource, traversal: anonTraversal } = gremlin.process;

const GREMLIN_URL = process.env.GREMLIN_URL || "ws://localhost:8182/gremlin";
const CONNECTION_TIMEOUT_MS = 3_000; // 3s — fail fast if graph isn't running
const BACKOFF_MS = 60_000; // Don't retry for 1 min after a connection failure

let connection: InstanceType<typeof DriverRemoteConnection> | null = null;
let traversalSource: InstanceType<typeof GraphTraversalSource> | null = null;
let lastFailure = 0;

/** Race a promise against a timeout */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

/** Check if graph is available (not in backoff from recent failure) */
export function isGraphAvailable(): boolean {
  if (lastFailure === 0) return true;
  return Date.now() - lastFailure > BACKOFF_MS;
}

/** Get or create a Gremlin connection (with timeout) */
export async function getConnection(): Promise<
  InstanceType<typeof DriverRemoteConnection>
> {
  if (connection) return connection;

  if (!isGraphAvailable()) {
    throw new Error("Graph unavailable (in backoff after connection failure)");
  }

  try {
    // Use GraphSON serializer (not GraphBinary) for JanusGraph compatibility
    const conn = new DriverRemoteConnection(GREMLIN_URL, {
      mimeType: "application/vnd.gremlin-v3.0+json",
    });
    await withTimeout(conn.open(), CONNECTION_TIMEOUT_MS, "Gremlin connection");
    connection = conn;
    lastFailure = 0;
    return connection;
  } catch (err) {
    lastFailure = Date.now();
    connection = null;
    traversalSource = null;
    throw err;
  }
}

/** Get a reusable graph traversal source */
export async function getTraversalSource(): Promise<
  InstanceType<typeof GraphTraversalSource>
> {
  if (traversalSource) return traversalSource;

  const conn = await getConnection();
  traversalSource = anonTraversal().with_(conn);
  return traversalSource;
}

/** Submit a raw Gremlin script string (for schema operations) */
export async function submitScript(script: string): Promise<unknown> {
  const client = new gremlin.driver.Client(GREMLIN_URL);
  try {
    const result = await client.submit(script);
    return result.toArray();
  } finally {
    await client.close();
  }
}

/** Close the Gremlin connection */
export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.close();
    connection = null;
    traversalSource = null;
  }
}

// Re-export useful gremlin modules
export const { statics: __ } = gremlin.process;
export const { t, P, order, column, direction, cardinality } = gremlin.process;
export type { GraphTraversalSource };
