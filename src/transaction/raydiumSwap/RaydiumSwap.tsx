import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  USDCMint,
  getATAAddress,
  printSimulate,
  addComputeBudget,
  DEVNET_PROGRAM_ID,
} from "@raydium-io/raydium-sdk-v2";
import {
  buidSwapInstruction,
  getCpmmPool,
  getPoolInfo,
  getSwapRoute,
} from "./raydiumService";
import { createPool } from "./createCpmmPool";
import { raydiumCpmmSwap } from "./swap";
import { useEffect, useState } from "react";
import { initSdk } from "../config";

const custom_poolId = "3Mmok2Rj2ktoz31Qs4VMxFy5jLGR4CpLVd6EwJ9KYToL";

export const RaydiumSwap = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [amount, setAmount] = useState(0);
  const [cpmmPoolId, setCpmmPoolId] = useState("");

  const swapBaseOutInstruction = async (
    inputPublicKey: PublicKey = USDCMint
  ) => {
    if (!publicKey || !signTransaction) {
      throw new Error("Wallet not connected");
    }

    const inputMint = inputPublicKey.toBase58();
    const outputMint = NATIVE_MINT.toBase58();
    const amount = 100000;
    const slippage = 0.5; // 0.5%
    const txVersion: "LEGACY" | "VO" = "LEGACY";

    // 1. 获取 Raydium 的 Swap 路由
    const swapResponse = await getSwapRoute(
      inputMint,
      outputMint,
      amount,
      slippage,
      txVersion
    );

    if (!swapResponse.success) {
      throw new Error(swapResponse.msg);
    }

    // 2. 获取流动性池信息
    const res = await getPoolInfo(swapResponse);
    console.info(res, swapResponse);

    const allMints = res.data.data.map((r) => [r.mintA, r.mintB]).flat();
    const [mintAProgram, mintBProgram] = [
      allMints.find((m) => m.address === inputMint)!.programId,
      allMints.find((m) => m.address === outputMint)!.programId,
    ];

    // 3. 获取输入/输出代币的 ATA
    const inputAccount = getATAAddress(
      publicKey,
      new PublicKey(inputMint),
      new PublicKey(mintAProgram)
    ).publicKey;
    const outputAccount = getATAAddress(
      publicKey,
      new PublicKey(outputMint),
      new PublicKey(mintBProgram)
    ).publicKey;

    // 4. 构建 Swap 指令
    const frontRunIns = buidSwapInstruction(
      publicKey,
      inputAccount,
      outputAccount,
      swapResponse,
      res.data.data
    );

    // const backRunIns = buidSwapInstruction(
    //   publicKey,
    //   outputAccount,
    //   inputAccount,
    //   swapResponse,
    //   res.data.data
    // );

    // 5. 添加计算预算
    const { instructions } = addComputeBudget({
      units: 600000,
      microLamports: 6000000,
    });

    // 6. 构建交易
    const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const tx = new Transaction();
    instructions.forEach((ins) => tx.add(ins));
    tx.add(frontRunIns);

    //To do. Wait target transaction?

    // tx.add(backRunIns);
    tx.feePayer = publicKey;
    tx.recentBlockhash = recentBlockhash;

    // 7. 使用钱包签名（而不是 tx.sign(owner)）
    const signedTx = await signTransaction(tx);

    // 8. 模拟交易
    printSimulate([signedTx]);

    // 9. 发送交易（可选）
    const txId = await connection.sendRawTransaction(signedTx.serialize());
    console.log("Transaction sent:", txId);
  };

  const swapToken = async () => {
    raydiumCpmmSwap(cpmmPoolId, 0.001, amount);
  };

  const createCpmmPool = () => {
    if (!publicKey || !signAllTransactions) {
      return;
    }
    createPool(
      publicKey,
      signAllTransactions,
      "GuCjj3qXmcXkuPLfu9WK6AuPc28fQmsEct35rtrYSxuk",
      NATIVE_MINT.toBase58()
    );
  };

  const fetchPoolInfo = () => {
    if (!cpmmPoolId) {
      console.info("Invalid pool address");
      return;
    }
    getCpmmPool(cpmmPoolId);
  };

  useEffect(() => {
    if (!publicKey || !signAllTransactions) {
      return;
    }
    initSdk({
      loadToken: true,
      publicKey,
      signAllTransactions,
    });
  }, [publicKey, signAllTransactions]);

  return (
    <>
      <div className="token-transfer-container">
        <h2>代币转账</h2>

        <button
          onClick={() => {
            createCpmmPool();
          }}
          disabled={!publicKey}
        >
          Create Cpmm Pool
        </button>

        {publicKey && (
          <div className="form-container">
            {/* 收款地址 */}
            <div className="form-group">
              <label
                onClick={() => {
                  fetchPoolInfo();
                }}
              >
                <a> Cpmm Pool Address</a>
              </label>
              <input
                type="text"
                value={cpmmPoolId}
                onChange={(e) => setCpmmPoolId(e.target.value)}
                placeholder="输入cpmm池子地址"
              />
            </div>

            <div className="form-group">
              <label>Amout to buy in SOL</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <button
              onClick={() => {
                swapToken();
              }}
              className="transfer-button"
              disabled={!publicKey}
            >
              Swap
            </button>
          </div>
        )}

        <style>{`
        .token-transfer-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          border-radius: 8px;
          background: #1e1e1e;
          color: white;
        }
        .form-container {
          margin-top: 20px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
          button{
          margin-left:5px;
          }
          input {
          width: 90%;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #444;
          background: #2d2d2d;
          color: white;
        }
        .token-selector {
          position: relative;
        }
        .popular-tokens {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .token-chip {
          padding: 4px 8px;
          background: #333;
          border-radius: 12px;
          font-size: 12px;
          cursor: pointer;
          border: none;
          color: white;
        }
        .token-chip:hover {
          background: #444;
        }
        .balance-info {
          margin: 10px 0;
          font-size: 14px;
          color: #aaa;
        }
        .transfer-button {
          width: 100%;
          padding: 12px;
          background: #14f195;
          color: black;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 10px;
        }
        .transfer-button:disabled {
          background: #555;
          cursor: not-allowed;
        }
        .transaction-result {
          margin-top: 15px;
          text-align: center;
        }
        .transaction-result a {
          color: #14f195;
        }
      `}</style>
      </div>
    </>
  );
};
