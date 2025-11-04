import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@parity/hardhat-polkadot";

const passetHubPrivateKey = vars.has("PASSET_HUB_PRIVATE_KEY")
  ? vars.get("PASSET_HUB_PRIVATE_KEY")
  : undefined;

const passetHubAccountUri = vars.has("PASSET_HUB_ACCOUNT_URI")
  ? vars.get("PASSET_HUB_ACCOUNT_URI")
  : undefined;

const passetHubConfig: Record<string, unknown> = {
  url: "https://passethub-athens.public.blastapi.io",
  polkavm: true,
  ethNetwork: "sepolia",
};

if (passetHubPrivateKey) {
  passetHubConfig.secretKey = passetHubPrivateKey;
}

if (passetHubAccountUri) {
  passetHubConfig.accountUri = passetHubAccountUri;
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },
  resolc: {
    compilerSource: "npm",
  },
  networks: {
    hardhat: {
      polkavm: true,
    },
    localNode: {
      url: "http://127.0.0.1:8545",
      polkavm: true,
      initialBalance: "1000000000000000000000000000",
      type: "init",
    },
    passetHub: passetHubConfig,
  },
};

export default config;
