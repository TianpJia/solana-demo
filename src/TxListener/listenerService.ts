import { PublicKey } from "@solana/web3.js";

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
