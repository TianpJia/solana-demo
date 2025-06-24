import { PublicKey } from "@solana/web3.js";
import { getCpmmPoolFromRPC } from "../transaction/raydiumSwap/raydiumService";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  CREATE_CPMM_POOL_PROGRAM,
  DEVNET_PROGRAM_ID,
} from "@raydium-io/raydium-sdk-v2";

export const DEX_PROGRAM_IDS = {
  RAYDIUM: new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"),
  ORCA: new PublicKey("9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP"),
  // Add more DEXs as needed
};

const TARGET_DEXS = ["RAYDIUM"];

/**
 * Check if the transaction logs indicate interaction with our target DEXs
 * @param logs Transaction logs
 * @returns true if the transaction interacts with target DEXs
 */
export function checkForDexInteraction(logs: string[]): boolean {
  // Skip if no logs available
  if (!logs || logs.length === 0) {
    return false;
  }

  // Check for program invocations matching our target DEXs
  for (const log of logs) {
    for (const dexName of TARGET_DEXS) {
      const dexProgramId =
        DEX_PROGRAM_IDS[dexName as keyof typeof DEX_PROGRAM_IDS];
      if (dexProgramId && log.includes(`Program ${dexProgramId.toString()}`)) {
        return true;
      }
    }
  }

  return false;
}

export function isPoolInitialized(logs: string[]): boolean {
  return logs.some((log) => log.endsWith("Instruction: Initialize"));
}

export function hasLiquidity(logs: string[]): boolean {
  return logs.some((log) => log.includes("liquidity"));
}

export function isInvokedCreateProgram(logs: string[]): boolean {
  return logs.some((log) => log.includes(CREATE_CPMM_POOL_PROGRAM.toBase58()));
}

export const filterNewRaydiumPool = (logs: string[]) => {};

export function checkLiquidity(logs: string[]) {
  console.log("New Raydium Pool Created:", logs);

  // const { poolInfo, poolKeys, rpcData } = await getCpmmPoolFromRPC(poolId);

  // console.info(poolInfo, poolKeys, rpcData);
}

export function isRaydiumSwap(logs: string[]): boolean {
  return !!logs.find((log) => log.includes("Instruction: Swap"));
}

export function parseRaydiumSwap(logs: string[]) {
  const tokenA = logs
    .find((log) => log.includes("token_a="))
    ?.split("token_a=")[1];
  const tokenB = logs
    .find((log) => log.includes("token_b="))
    ?.split("token_b=")[1];
  const amountIn = logs
    .find((log) => log.includes("amount_in="))
    ?.split("amount_in=")[1];
  const amountOut = logs
    .find((log) => log.includes("amount_out="))
    ?.split("amount_out=")[1];
  // console.info(logs, { tokenA, tokenB, amountIn, amountOut });
  return { tokenA, tokenB, amountIn, amountOut };
}
