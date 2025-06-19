import {
  type ApiV3PoolInfoStandardItemCpmm,
  type CpmmKeys,
  type CpmmRpcData,
  CurveCalculator,
} from "@raydium-io/raydium-sdk-v2";
import { initSdk } from "../config";
import BN from "bn.js";
import { isValidCpmm } from "./utils";
import { NATIVE_MINT } from "@solana/spl-token";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const raydiumCpmmSwap = async (
  poolId: string,
  slippage = 0.001,
  amount = 10, // 始终表示SOL的数量
  action: "buy" | "sell" = "buy"
) => {
  try {
    const raydium = await initSdk();

    let inputAmount: BN;
    let inputMint: string;
    let outputMint: string = NATIVE_MINT.toBase58(); // 默认输出是SOL

    let poolInfo: ApiV3PoolInfoStandardItemCpmm;
    let poolKeys: CpmmKeys | undefined;
    let rpcData: CpmmRpcData;

    if (raydium.cluster === "mainnet") {
      const data = await raydium.api.fetchPoolById({ ids: poolId });
      poolInfo = data[0] as ApiV3PoolInfoStandardItemCpmm;
      if (!isValidCpmm(poolInfo.programId))
        throw new Error("target pool is not CPMM pool");
      rpcData = await raydium.cpmm.getRpcPoolInfo(poolInfo.id, true);
    } else {
      const data = await raydium.cpmm.getPoolInfoFromRpc(poolId);
      poolInfo = data.poolInfo;
      poolKeys = data.poolKeys;
      rpcData = data.rpcData;
      console.log({
        baseReserve: rpcData.baseReserve.toString(), // 通常是 SOL 的储备
        quoteReserve: rpcData.quoteReserve.toString(), // 另一种代币的储备
      });
    }

    // 确定交易对中的代币
    const solMint = NATIVE_MINT.toBase58();
    const tokenMint =
      poolInfo.mintA.address === solMint
        ? poolInfo.mintB.address
        : poolInfo.mintA.address;

    if (action === "buy") {
      // 买入：用SOL买代币
      inputMint = solMint;
      inputAmount = new BN(amount * LAMPORTS_PER_SOL);
    } else {
      // 卖出：计算需要多少代币才能获得指定数量的SOL
      inputMint = tokenMint;

      // 计算反向交换：从想要的SOL数量计算需要的代币数量
      const desiredSolAmount = new BN(amount * LAMPORTS_PER_SOL);
      console.info(
        desiredSolAmount.toString(),
        rpcData.configInfo!.tradeFeeRate.toString()
      );
      // 使用CurveCalculator计算需要的代币输入量
      const calculateResult = CurveCalculator.swap(
        desiredSolAmount,
        poolInfo.mintA.address !== solMint
          ? rpcData.quoteReserve
          : rpcData.baseReserve, // 代币储备
        poolInfo.mintA.address !== solMint
          ? rpcData.baseReserve
          : rpcData.quoteReserve, // SOL储备
        rpcData.configInfo!.tradeFeeRate
      );

      inputAmount = calculateResult.destinationAmountSwapped;
      console.info(
        calculateResult.destinationAmountSwapped.toString(),
        "swap result"
      );
    }

    const baseIn = inputMint === poolInfo.mintA.address;

    // 执行实际交换
    const swapResult = CurveCalculator.swap(
      inputAmount,
      baseIn ? rpcData.baseReserve : rpcData.quoteReserve,
      baseIn ? rpcData.quoteReserve : rpcData.baseReserve,
      rpcData.configInfo!.tradeFeeRate
    );

    const { execute } = await raydium.cpmm.swap({
      poolInfo,
      poolKeys,
      inputAmount,
      swapResult,
      slippage,
      baseIn,
    });

    const { txId } = await execute({ sendAndConfirm: true });
    console.log(`${action === "buy" ? "Bought" : "Sold"}:`, {
      action,
      inputMint,
      outputMint,
      inputAmount: inputAmount.toString(),
      expectedOutput: swapResult.destinationAmountSwapped.toString(),
      txId: `https://explorer.solana.com/tx/${txId}`,
    });
  } catch (error) {
    console.error("Swap failed:", error);
  }
};
