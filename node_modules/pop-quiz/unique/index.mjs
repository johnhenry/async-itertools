// deno-lint-ignore-file no-fallthrough
export const unique = function* (kind = Number, prefix = "") {
  let i = 0;
  switch (kind) {
    case "symbol":
      while (true) {
        yield Symbol.for(`${prefix}:${i++}`);
      }
    case "string":
      while (true) {
        yield String(`${prefix}:${i++}`);
      }
    case "bigint":
      while (true) {
        yield BigInt(i++);
      }
    case "number":
    default:
      while (true) {
        yield i++;
      }
  }
};
export default unique;
