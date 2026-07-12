export interface SupabaseErrorLike {
  message: string;
}

export interface RpcClient {
  rpc<T>(
    functionName: string,
    args?: Record<string, unknown>,
  ): Promise<{ data: T | null; error: SupabaseErrorLike | null }>;
}

export function asRpcClient(client: unknown): RpcClient {
  return client as RpcClient;
}

export function firstRpcRow<T>(rows: T[] | null | undefined): T | null {
  return rows?.[0] ?? null;
}
