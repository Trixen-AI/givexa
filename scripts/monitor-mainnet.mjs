#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPublicClient,
  defineChain,
  getAddress,
  http,
  keccak256,
  stringToHex,
  zeroAddress,
} from "viem";
import {
  MonitorReport,
  expectedProvenanceHash,
  hasRuntimeCode,
  isTwoOfThreeSafe,
  sameAddress,
  toJsonSafe,
} from "./lib/monitor-policy.mjs";

const ROOT_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEPLOYMENT_PATH = resolve(
  ROOT_DIRECTORY,
  "contracts/deployments/robinhood-mainnet.json",
);
const ASSET_MANIFEST_PATH = resolve(
  ROOT_DIRECTORY,
  "contracts/deployments/robinhood-mainnet.assets.json",
);
const JSON_OUTPUT = process.argv.includes("--json");
const EXPECTED_CHAIN_ID = 4663;

const ownableAbi = [
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
];

const vaultAbi = [
  ...ownableAbi,
  {
    type: "function",
    name: "guardian",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "creationPaused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "assetRegistry",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "feeController",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "nextGiftId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
];

const feeControllerAbi = [
  ...ownableAbi,
  {
    type: "function",
    name: "feeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint16" }],
  },
  {
    type: "function",
    name: "treasury",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "MAX_FEE_BPS",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint16" }],
  },
];

const assetRegistryAbi = [
  ...ownableAbi,
  {
    type: "function",
    name: "REQUIRED_DECIMALS",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "isSupported",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "assetConfig",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "registered", type: "bool" },
          { name: "supported", type: "bool" },
          { name: "symbol", type: "bytes32" },
          { name: "provenanceHash", type: "bytes32" },
        ],
      },
    ],
  },
];

const timelockAbi = [
  {
    type: "function",
    name: "getMinDelay",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  ...["DEFAULT_ADMIN_ROLE", "PROPOSER_ROLE", "CANCELLER_ROLE", "EXECUTOR_ROLE"].map(
    (name) => ({
      type: "function",
      name,
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "bytes32" }],
    }),
  ),
  {
    type: "function",
    name: "hasRole",
    stateMutability: "view",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
];

const safeAbi = [
  {
    type: "function",
    name: "getThreshold",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getOwners",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
  },
];

const stockTokenAbi = [
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "uiMultiplier",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
];

function parseExpectedFeeBps(deployment) {
  const configured = process.env.GIVEXA_EXPECTED_FEE_BPS;
  if (configured === undefined || configured === "") {
    return BigInt(deployment.contracts.feeController.initialFeeBps);
  }
  if (!/^\d+$/.test(configured)) {
    throw new Error("GIVEXA_EXPECTED_FEE_BPS must be a non-negative integer");
  }
  return BigInt(configured);
}

function runtimeCodeSummary(bytecode) {
  return {
    bytes: (bytecode.length - 2) / 2,
    keccak256: keccak256(bytecode),
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function read(client, address, abi, functionName, args = []) {
  return client.readContract({ address, abi, functionName, args });
}

async function checkRuntimeCode(client, report, id, address) {
  const bytecode = await client.getBytecode({ address });
  report.check(`${id}.bytecode`, hasRuntimeCode(bytecode), {
    expected: "non-empty runtime bytecode",
    actual: bytecode ? `${(bytecode.length - 2) / 2} bytes` : "missing",
  });
  if (hasRuntimeCode(bytecode)) {
    report.info(`${id}.runtime-code`, runtimeCodeSummary(bytecode));
  }
}

async function run() {
  const rpcUrl = process.env.ROBINHOOD_RPC_URL;
  if (!rpcUrl) {
    throw new Error("ROBINHOOD_RPC_URL is required");
  }

  const [deployment, assetManifest] = await Promise.all([
    readJson(DEPLOYMENT_PATH),
    readJson(ASSET_MANIFEST_PATH),
  ]);
  const report = new MonitorReport();
  const expectedFeeBps = parseExpectedFeeBps(deployment);
  const allowCreationPaused = process.env.GIVEXA_ALLOW_CREATION_PAUSED === "true";

  report.check("manifest.chain-id", deployment.network.chainId === EXPECTED_CHAIN_ID, {
    expected: EXPECTED_CHAIN_ID,
    actual: deployment.network.chainId,
  });
  report.check("manifest.asset-count", assetManifest.assets.length === 10, {
    expected: 10,
    actual: assetManifest.assets.length,
  });
  report.check(
    "manifest.asset-addresses-unique",
    new Set(assetManifest.assets.map(({ address }) => getAddress(address))).size ===
      assetManifest.assets.length,
    { expected: assetManifest.assets.length, actual: assetManifest.assets.length },
  );

  const robinhoodChain = defineChain({
    id: EXPECTED_CHAIN_ID,
    name: "Robinhood Chain Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
    blockExplorers: {
      default: {
        name: "Robinhood Chain Blockscout",
        url: deployment.network.explorer,
      },
    },
  });
  const client = createPublicClient({
    chain: robinhoodChain,
    transport: http(rpcUrl, { retryCount: 2, retryDelay: 500, timeout: 15_000 }),
    batch: { multicall: false },
  });

  const [chainId, blockNumber] = await Promise.all([
    client.getChainId(),
    client.getBlockNumber(),
  ]);
  report.check("network.chain-id", chainId === EXPECTED_CHAIN_ID, {
    expected: EXPECTED_CHAIN_ID,
    actual: chainId,
  });
  report.info("network.latest-block", blockNumber);

  const registryAddress = getAddress(deployment.contracts.assetRegistry.address);
  const feeControllerAddress = getAddress(deployment.contracts.feeController.address);
  const vaultAddress = getAddress(deployment.contracts.giftVault.address);
  const timelockAddress = getAddress(deployment.contracts.timelock.address);
  const safeAddress = getAddress(deployment.governance.safe);
  const treasuryAddress = getAddress(deployment.governance.treasury);

  for (const [id, address] of [
    ["asset-registry", registryAddress],
    ["fee-controller", feeControllerAddress],
    ["gift-vault", vaultAddress],
    ["timelock", timelockAddress],
    ["safe", safeAddress],
  ]) {
    await checkRuntimeCode(client, report, id, address);
  }

  const [
    registryOwner,
    requiredDecimals,
    feeOwner,
    feeBps,
    maxFeeBps,
    treasury,
    vaultOwner,
    guardian,
    creationPaused,
    vaultRegistry,
    vaultFeeController,
    nextGiftId,
    minDelay,
    threshold,
    owners,
  ] = await Promise.all([
    read(client, registryAddress, assetRegistryAbi, "owner"),
    read(client, registryAddress, assetRegistryAbi, "REQUIRED_DECIMALS"),
    read(client, feeControllerAddress, feeControllerAbi, "owner"),
    read(client, feeControllerAddress, feeControllerAbi, "feeBps"),
    read(client, feeControllerAddress, feeControllerAbi, "MAX_FEE_BPS"),
    read(client, feeControllerAddress, feeControllerAbi, "treasury"),
    read(client, vaultAddress, vaultAbi, "owner"),
    read(client, vaultAddress, vaultAbi, "guardian"),
    read(client, vaultAddress, vaultAbi, "creationPaused"),
    read(client, vaultAddress, vaultAbi, "assetRegistry"),
    read(client, vaultAddress, vaultAbi, "feeController"),
    read(client, vaultAddress, vaultAbi, "nextGiftId"),
    read(client, timelockAddress, timelockAbi, "getMinDelay"),
    read(client, safeAddress, safeAbi, "getThreshold"),
    read(client, safeAddress, safeAbi, "getOwners"),
  ]);

  for (const [id, actual] of [
    ["asset-registry.owner", registryOwner],
    ["fee-controller.owner", feeOwner],
    ["gift-vault.owner", vaultOwner],
  ]) {
    report.check(id, sameAddress(actual, timelockAddress), {
      expected: timelockAddress,
      actual,
    });
  }
  report.check("asset-registry.required-decimals", Number(requiredDecimals) === 18, {
    expected: 18,
    actual: requiredDecimals,
  });
  report.check("fee-controller.fee-within-cap", BigInt(feeBps) <= BigInt(maxFeeBps), {
    expected: `at most ${maxFeeBps}`,
    actual: feeBps,
  });
  report.check("fee-controller.expected-fee", BigInt(feeBps) === expectedFeeBps, {
    expected: expectedFeeBps,
    actual: feeBps,
    detail: "Update the public GIVEXA_EXPECTED_FEE_BPS baseline after an authorized change.",
  });
  report.check("fee-controller.treasury", sameAddress(treasury, treasuryAddress), {
    expected: treasuryAddress,
    actual: treasury,
  });
  report.check("gift-vault.guardian", sameAddress(guardian, safeAddress), {
    expected: safeAddress,
    actual: guardian,
  });
  report.check("gift-vault.creation-active", !creationPaused || allowCreationPaused, {
    expected: allowCreationPaused ? "false, or true during acknowledged maintenance" : false,
    actual: creationPaused,
  });
  report.check("gift-vault.asset-registry", sameAddress(vaultRegistry, registryAddress), {
    expected: registryAddress,
    actual: vaultRegistry,
  });
  report.check(
    "gift-vault.fee-controller",
    sameAddress(vaultFeeController, feeControllerAddress),
    { expected: feeControllerAddress, actual: vaultFeeController },
  );
  report.info("gift-vault.created-gift-count", BigInt(nextGiftId) - 1n);
  report.check("timelock.minimum-delay", BigInt(minDelay) === 172800n, {
    expected: 172800,
    actual: minDelay,
  });
  report.check("safe.two-of-three", isTwoOfThreeSafe(threshold, owners), {
    expected: { threshold: 2, ownerCount: 3, uniqueOwners: true },
    actual: { threshold, ownerCount: owners.length, uniqueOwners: new Set(owners).size },
  });

  const [adminRole, proposerRole, cancellerRole, executorRole] = await Promise.all([
    read(client, timelockAddress, timelockAbi, "DEFAULT_ADMIN_ROLE"),
    read(client, timelockAddress, timelockAbi, "PROPOSER_ROLE"),
    read(client, timelockAddress, timelockAbi, "CANCELLER_ROLE"),
    read(client, timelockAddress, timelockAbi, "EXECUTOR_ROLE"),
  ]);
  const [
    timelockIsAdmin,
    safeIsAdmin,
    safeIsProposer,
    safeIsCanceller,
    executorIsOpen,
  ] = await Promise.all([
    read(client, timelockAddress, timelockAbi, "hasRole", [adminRole, timelockAddress]),
    read(client, timelockAddress, timelockAbi, "hasRole", [adminRole, safeAddress]),
    read(client, timelockAddress, timelockAbi, "hasRole", [proposerRole, safeAddress]),
    read(client, timelockAddress, timelockAbi, "hasRole", [cancellerRole, safeAddress]),
    read(client, timelockAddress, timelockAbi, "hasRole", [executorRole, zeroAddress]),
  ]);
  report.check("timelock.self-admin", timelockIsAdmin, {
    expected: true,
    actual: timelockIsAdmin,
  });
  report.check("timelock.safe-not-admin", !safeIsAdmin, {
    expected: false,
    actual: safeIsAdmin,
  });
  report.check("timelock.safe-proposer", safeIsProposer, {
    expected: true,
    actual: safeIsProposer,
  });
  report.check("timelock.safe-canceller", safeIsCanceller, {
    expected: true,
    actual: safeIsCanceller,
  });
  report.check("timelock.permissionless-executor", executorIsOpen, {
    expected: true,
    actual: executorIsOpen,
  });

  for (const asset of assetManifest.assets) {
    const address = getAddress(asset.address);
    const id = `asset.${asset.symbol}`;
    await checkRuntimeCode(client, report, id, address);
    const [supported, config, symbol, decimals, uiMultiplier] = await Promise.all([
      read(client, registryAddress, assetRegistryAbi, "isSupported", [address]),
      read(client, registryAddress, assetRegistryAbi, "assetConfig", [address]),
      read(client, address, stockTokenAbi, "symbol"),
      read(client, address, stockTokenAbi, "decimals"),
      read(client, address, stockTokenAbi, "uiMultiplier"),
    ]);
    const registered = config.registered ?? config[0];
    const configSupported = config.supported ?? config[1];
    const configSymbol = config.symbol ?? config[2];
    const provenanceHash = config.provenanceHash ?? config[3];
    const expectedSymbol = stringToHex(asset.symbol, { size: 32 });
    const expectedProvenance = expectedProvenanceHash({
      manifestHash: deployment.assetManifest.sha256,
      chainId: EXPECTED_CHAIN_ID,
      asset: address,
      symbol: asset.symbol,
    });

    report.check(`${id}.registered`, registered, { expected: true, actual: registered });
    report.check(`${id}.supported`, supported && configSupported, {
      expected: true,
      actual: { isSupported: supported, configSupported },
    });
    report.check(`${id}.registry-symbol`, configSymbol.toLowerCase() === expectedSymbol.toLowerCase(), {
      expected: expectedSymbol,
      actual: configSymbol,
    });
    report.check(`${id}.provenance`, provenanceHash.toLowerCase() === expectedProvenance.toLowerCase(), {
      expected: expectedProvenance,
      actual: provenanceHash,
    });
    report.check(`${id}.token-symbol`, symbol === asset.symbol, {
      expected: asset.symbol,
      actual: symbol,
    });
    report.check(`${id}.decimals`, Number(decimals) === 18, {
      expected: 18,
      actual: decimals,
    });
    report.check(`${id}.ui-multiplier`, BigInt(uiMultiplier) > 0n, {
      expected: "greater than zero",
      actual: uiMultiplier,
    });
  }

  const output = {
    monitor: "givexa-robinhood-mainnet",
    checkedAt: new Date().toISOString(),
    chainId,
    blockNumber,
    summary: report.summary(),
    checks: report.checks,
  };

  if (JSON_OUTPUT) {
    process.stdout.write(`${JSON.stringify(toJsonSafe(output), null, 2)}\n`);
  } else {
    console.log(`Givexa mainnet monitor at block ${blockNumber}`);
    for (const check of report.checks) {
      const label = check.status === "pass" ? "PASS" : check.status === "fail" ? "FAIL" : "INFO";
      console.log(`[${label}] ${check.id}`);
      if (check.status === "fail") {
        console.log(`       expected: ${JSON.stringify(check.expected)}`);
        console.log(`       actual:   ${JSON.stringify(check.actual)}`);
      }
    }
    const summary = report.summary();
    console.log(
      `Summary: ${summary.passed} passed, ${summary.failed} failed, ${summary.informational} informational`,
    );
  }

  if (report.failed.length > 0) process.exitCode = 1;
}

run().catch((error) => {
  const safeFailure = {
    monitor: "givexa-robinhood-mainnet",
    status: "fatal",
    error: error?.name ?? "Error",
    message:
      error?.message === "ROBINHOOD_RPC_URL is required" ||
      error?.message?.startsWith("GIVEXA_EXPECTED_FEE_BPS")
        ? error.message
        : "The public RPC or an onchain read failed. The RPC URL was not logged.",
  };
  if (JSON_OUTPUT) {
    process.stderr.write(`${JSON.stringify(safeFailure, null, 2)}\n`);
  } else {
    console.error(`[FATAL] ${safeFailure.message}`);
  }
  process.exitCode = 1;
});
