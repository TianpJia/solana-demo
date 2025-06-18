import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC,
  DEVNET_PROGRAM_ID,
  getCpmmPdaAmmConfigId,
} from "@raydium-io/raydium-sdk-v2";
import { PublicKey, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { useEffect, useState } from "react";
import { txVersion } from "../config";

const RAY = "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const CreatePoolComponent = () => {
  const { connection } = useConnection();
  const { publicKey, signAllTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);

  const createPool = async (
    inputMintA: string = RAY,
    inputMintB: string = USDC
  ) => {
    if (!publicKey || !signAllTransactions) {
      alert("请先连接钱包");
      return;
    }

    setLoading(true);
    try {
      // 1. 初始化 Raydium SDK（不传 owner）
      const { Raydium } = await import("@raydium-io/raydium-sdk-v2");
      const raydium = await Raydium.load({
        connection,
        cluster: "devnet", // 或 'mainnet-beta'
        disableFeatureCheck: true,
      });

      // 2. 获取代币信息
      const mintA = await raydium.token.getTokenInfo(inputMintA);
      const mintB = await raydium.token.getTokenInfo(inputMintB);

      // 3. 获取费用配置（适配 Devnet）
      const feeConfigs = await raydium.api.getCpmmConfigs();
      if (raydium.cluster === "devnet") {
        feeConfigs.forEach((config) => {
          config.id = getCpmmPdaAmmConfigId(
            DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
            config.index
          ).publicKey.toBase58();
        });
      }

      // 4. 构建创建池的交易
      const makeTxData = await raydium.cpmm.createPool({
        programId: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, // 使用 Devnet 程序 ID
        poolFeeAccount: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC,
        mintA,
        mintB,
        mintAAmount: new BN(100),
        mintBAmount: new BN(100),
        startTime: new BN(0),
        feeConfig: feeConfigs[0],
        associatedOnly: false,
        ownerInfo: {
          useSOLBalance: true,
        },
        txVersion, // 或根据需求调整
      });

      // const { txId } = await execute({ sendAndConfirm: true });

      // console.log("池创建成功", {
      //   txId: txId,
      //   poolKeys: Object.keys(extInfo.address).reduce(
      //     (acc, cur) => ({
      //       ...acc,
      //       [cur]:
      //         extInfo.address[cur as keyof typeof extInfo.address].toString(),
      //     }),
      //     {}
      //   ),
      // });
    } catch (error) {
      console.error("创建池失败:", error);
      alert(
        `创建池失败: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => createPool()} disabled={!publicKey || loading}>
        {loading ? "处理中..." : "创建 RAY-USDC 流动性池"}
      </button>
      {txId && (
        <p>
          交易成功！查看:{" "}
          <a
            href={`https://explorer.solana.com/tx/${txId}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Solana Explorer
          </a>
        </p>
      )}
    </div>
  );
};
