import { useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  type Context,
  type TransactionSignature,
} from "@solana/web3.js";
import { useState } from "react";
import {
  checkForDexInteraction,
  checkLiquidity,
  DEX_PROGRAM_IDS,
  isInvokedCreateProgram,
  isPoolInitialized,
  isRaydiumSwap,
  parseRaydiumSwap,
} from "./listenerService";
import {
  CREATE_CPMM_POOL_PROGRAM,
  DEVNET_PROGRAM_ID,
} from "@raydium-io/raydium-sdk-v2";
export function TxListener() {
  const [transactions, setTxs] = useState<any[]>([]);
  const { connection } = useConnection();
  const [subId, setSubId] = useState<number | null>(null);
  const user1 = "kiwiC4pg5mC4N5AhpXc4Av3V6oV7Sn2p3CqB7NeHbJJ";
  const user2 = "HwGqFnPY6H2sGFoDUMYqr63geoR6Tb8yrfnKGLMnARzj";
  const user3 = "suqh5sHtr8HyJ7q8scBimULPkPpA557prMG47xCHQfK";

  const startListen = () => {
    const subId = connection.onLogs(
      // CREATE_CPMM_POOL_PROGRAM,
      new PublicKey(user3),
      async (logs, ctx) => {
        handleTransaction(logs.signature, logs.logs || [], ctx);
      },
      "processed"
    );
    setSubId(subId);
  };

  const stopListen = () => {
    if (subId !== null) {
      connection.removeOnLogsListener(subId);
      setSubId(null);
    }
  };

  async function handleTransaction(
    signature: TransactionSignature,
    logs: string[],
    ctx: Context
  ): Promise<void> {
    // Check if transaction interacts with target DEXs
    // const isDexTransaction = checkForDexInteraction(logs);
    // if (!isDexTransaction) {
    //   return;
    // }

    // if (isPoolInitialized(logs)) {
    //   console.info(logs, new Date().toISOString());
    // } else {
    //   return;
    // }

    // checkLiquidity(logs);

    // if (!isRaydiumSwap(logs)) {
    //   return;
    // }
    console.info(logs);
    // parseRaydiumSwap(logs);
    setTxs((prev) => [
      {
        signature: signature,
        slot: ctx.slot,
        logs: logs,
      },
      ...prev.slice(0, 10),
    ]);
  }

  return (
    <div>
      <h3>实时交易流</h3>
      <button
        onClick={() => {
          startListen();
        }}
        className="transfer-button"
        disabled={typeof subId === "number"}
      >
        Start Listen
      </button>
      <button
        onClick={() => {
          stopListen();
        }}
        className="transfer-button"
        disabled={subId === null}
      >
        Stop Listen
      </button>
      {transactions.map((tx) => (
        <div key={tx.signature}>
          <a href={`https://solscan.io/tx/${tx.signature}`} target="_blank">
            {tx.signature.slice(0, 10)}...{tx.signature.slice(-5)}
          </a>
        </div>
      ))}
    </div>
  );
}
