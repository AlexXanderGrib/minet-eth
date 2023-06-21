export function hex(number: number | bigint) {
  return "0x" + BigInt(number).toString(16);
}
