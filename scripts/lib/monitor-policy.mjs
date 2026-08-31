import {
  encodeAbiParameters,
  getAddress,
  isAddress,
  keccak256,
  parseAbiParameters,
  stringToHex,
} from "viem";

const PROVENANCE_PARAMETERS = parseAbiParameters(
  "bytes32 manifestHash, uint256 chainId, address asset, bytes32 symbol",
);

export function sameAddress(actual, expected) {
  if (!isAddress(actual) || !isAddress(expected)) return false;
  return getAddress(actual) === getAddress(expected);
}

export function isTwoOfThreeSafe(threshold, owners) {
  if (BigInt(threshold) !== 2n || owners.length !== 3) return false;
  const normalized = owners.map((owner) => {
    if (!isAddress(owner)) return null;
    return getAddress(owner);
  });

  return normalized.every(Boolean) && new Set(normalized).size === 3;
}

export function expectedProvenanceHash({ manifestHash, chainId, asset, symbol }) {
  return keccak256(
    encodeAbiParameters(PROVENANCE_PARAMETERS, [
      manifestHash,
      BigInt(chainId),
      getAddress(asset),
      stringToHex(symbol, { size: 32 }),
    ]),
  );
}

export function hasRuntimeCode(bytecode) {
  return typeof bytecode === "string" && bytecode !== "0x" && bytecode.length > 2;
}

export function toJsonSafe(value) {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, toJsonSafe(nested)]),
    );
  }
  return value;
}

export class MonitorReport {
  #checks = [];

  check(id, condition, { expected, actual, detail } = {}) {
    this.#checks.push({
      id,
      status: condition ? "pass" : "fail",
      expected: toJsonSafe(expected),
      actual: toJsonSafe(actual),
      detail,
    });
  }

  info(id, actual, detail) {
    this.#checks.push({
      id,
      status: "info",
      actual: toJsonSafe(actual),
      detail,
    });
  }

  get checks() {
    return [...this.#checks];
  }

  get failed() {
    return this.#checks.filter((check) => check.status === "fail");
  }

  get passed() {
    return this.#checks.filter((check) => check.status === "pass");
  }

  summary() {
    return {
      passed: this.passed.length,
      failed: this.failed.length,
      informational: this.#checks.filter((check) => check.status === "info").length,
      total: this.#checks.length,
    };
  }
}
