import { Env } from "./env";
import { forward, functions } from "./functions";
import { Id, JsonRpcError, JsonRpcRequest } from "./rpc";

function json(data: unknown, options: ResponseInit = {}) {
  console.log("<<<", data);

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
    ...options,
  });
}

function respondError(error: JsonRpcError, id: Id = null) {
  return json({ jsonrpc: "2.0", error, id }, { status: 400 });
}

function respond(result: unknown, id: Id = null) {
  return json({ jsonrpc: "2.0", result, id }, { status: 200 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let data: unknown;

    try {
      data = await request.json();
    } catch {
      return respondError(JsonRpcError.ParseError);
    }

    let input: JsonRpcRequest;

    try {
      input = await JsonRpcRequest.parseAsync(data);
    } catch {
      return respondError(JsonRpcError.InvalidRequestError);
    }

    console.log(">>>", input);
    const method = functions.get(input.method);
    if (!method) {
      return respondError(JsonRpcError.MethodNotFoundError, input.id);
    }

    if (method === forward) {
      const response = await fetch(
        `https://mainnet.infura.io/v3/${env.INFURA_KEY}`,
        {
          headers: request.headers,
          method: request.method,
          signal: request.signal,
          body: JSON.stringify(input),
        }
      );

      return response;
    }

    try {
      const parameters = Array.isArray(input.params)
        ? input.params
        : [input.params];

      const result = await method(env, ...parameters);
      return respond(result, input.id);
    } catch (error) {
      console.log(error);

      if (error instanceof JsonRpcError) {
        return respondError(error, input.id);
      }

      if (error instanceof Error) {
        let code = 400;

        if (
          "code" in error &&
          typeof error.code === "number" &&
          Number.isSafeInteger(error.code)
        ) {
          code = error.code;
        }

        return respondError(new JsonRpcError(error.message, code));
      }

      return respondError(JsonRpcError.InternalError);
    }
  },
};
