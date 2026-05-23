/// <reference types="@cloudflare/workers-types" />

declare module "cloudflare:workers" {
  export const env: {
    AUTOWAY_OPS_KV: KVNamespace;
    autoway_ops_live: D1Database;
    autoway_ops_snapshots: Queue;
    AUTOWAY_PUSH_SECRET: string;
  };
}
