import {
  type ApiSwapV1Out,
  type PoolKeys,
  ALL_PROGRAM_ID,
  DEV_API_URLS,
  swapBaseOutAutoAccount,
} from "@raydium-io/raydium-sdk-v2";
import { PublicKey } from "@solana/web3.js";
import axios, { type AxiosResponse } from "axios";
import { connection, initSdk } from "../config";

// 1. 获取 Raydium 的 Swap 路由
export const getSwapRoute = async (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippage: number,
  txVersion: string
) => {
  const { data: swapResponse } = await axios.get<ApiSwapV1Out>(
    `${
      DEV_API_URLS.SWAP_HOST
    }/compute/swap-base-out?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${
      slippage * 100
    }&txVersion=${txVersion}`
  );
  return swapResponse;
};

export const getDevSwapRoute = async (poolAddress: string) => {
  const poolAccount = await connection.getAccountInfo(
    new PublicKey(poolAddress)
  );
  return poolAccount;
};

export const getPoolInfo = async (swapResponse: any) => {
  const res = await axios.get<AxiosResponse<PoolKeys[]>>(
    DEV_API_URLS.BASE_HOST +
      DEV_API_URLS.POOL_KEY_BY_ID +
      `?ids=${swapResponse.data.routePlan.map((r: any) => r.poolId).join(",")}`
  );
  return res;
};

export const buidSwapInstruction = (
  publicKey: PublicKey,
  inputAccount: PublicKey,
  outputAccount: PublicKey,
  swapResponse: any,
  poolKeys: PoolKeys[]
) => {
  const ins = swapBaseOutAutoAccount({
    programId: ALL_PROGRAM_ID.Router,
    wallet: publicKey, // 使用钱包的 publicKey
    inputAccount,
    outputAccount,
    routeInfo: swapResponse,
    poolKeys,
  });

  return ins;
};

export const getCpmmPool = async (poolId: string) => {
  const raydium = await initSdk();
  const res = await raydium.cpmm.getRpcPoolInfos([poolId]);
  const poolInfo = res[poolId];
  console.log("pool price:", poolInfo.poolPrice);
  console.log("cpmm pool infos:", res);
  return poolInfo;
};

export const getCpmmPoolFromRPC = async (poolId: string) => {
  const raydium = await initSdk();
  const res = await raydium.cpmm.getPoolInfoFromRpc(poolId);
  console.log("cpmm pool infos:", res);
  return res;
};
