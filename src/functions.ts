import { Env } from "./env";
import { hex } from "./utils";

export const forward: unique symbol = Symbol.for("rpc.forward");
export type forward = typeof forward;

type RpcFunction = (env: Env, ...parameters: any[]) => any;

const functions = new Map<string, RpcFunction | forward>();

{
  const forwardedMethods = [
    "eth_protocolVersion",
    "eth_blockNumber",
    "eth_syncing",
    "eth_gasPrice",
    "eth_hashrate",
    "eth_mining",
    "web3_sha3",
    "eth_sign",
    "eth_signTransaction",
    "eth_sendTransaction",
    "eth_sendRawTransaction",
    "eth_estimateGas",
    "eth_getCompilers",
  ];

  for (const method of forwardedMethods) {
    functions.set(method, forward);
  }
}

{
  const CHAIN_ID = 1;
  const staticMethods = {
    eth_chainId: hex(CHAIN_ID),
    net_version: CHAIN_ID.toString(),
    net_listening: true,
    net_peerCount: hex(100),
    web3_clientVersion: "Geth/v1.11.5-omnibus-65be78cc/linux-amd64/go1.19.7",
  };

  for (const [method, value] of Object.entries(staticMethods)) {
    functions.set(method, () => value);
  }
}

functions.set("eth_getBalance", async (env, address: string = "") => {
  const value = await env.balances.get(address.toLocaleLowerCase());
  const balance = Number.parseFloat(value ?? "0");

  return hex(BigInt((balance * 1e18).toFixed(0)));
});

export { functions };
