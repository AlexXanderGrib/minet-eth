import { z } from "zod";

const id = z.union([z.string(), z.number().int().finite(), z.null()]);
export type Id = z.infer<typeof id>;

const jsonrpc = z.literal("2.0");

export class JsonRpcError extends Error {
  static readonly ParseError = new JsonRpcError("Parse error", -32700);
  static readonly InvalidRequestError = new JsonRpcError(
    "Invalid Request",
    -32600
  );
  static readonly MethodNotFoundError = new JsonRpcError(
    "Method not found",
    -32601
  );
  static readonly InvalidParamsError = new JsonRpcError(
    "Invalid params",
    -32602
  );
  static readonly InternalError = new JsonRpcError("Internal error", -32603);

  readonly code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    Object.freeze(this);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

export const JsonRpcRequest = z.object({
  jsonrpc,
  method: z.string(),
  params: z.any().array().or(z.record(z.any())),
  id,
});

export type JsonRpcRequest = z.infer<typeof JsonRpcRequest>;

export const JsonRpcResponse = z.object({
  jsonrpc,
  result: z.any().optional(),
  error: z.instanceof(JsonRpcError).optional(),
  id,
});

export type JsonRpcResponse = z.infer<typeof JsonRpcResponse>;
