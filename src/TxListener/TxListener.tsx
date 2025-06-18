import { useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  type Context,
  type TransactionSignature,
} from "@solana/web3.js";
import { useEffect, useState } from "react";
import { checkForDexInteraction } from "./listenerService";

export function TxListener({ programId }: { programId: string }) {
  const [transactions, setTxs] = useState<any[]>([]);
  const { connection } = useConnection();

  async function handleTransaction(
    signature: TransactionSignature,
    logs: string[],
    ctx: Context
  ): Promise<void> {
    // Check if transaction interacts with target DEXs
    const isDexTransaction = checkForDexInteraction(logs);
    if (!isDexTransaction) {
      return;
    }
    console.info("log changes", logs, ctx);
    setTxs((prev) => [
      {
        signature: signature,
        slot: ctx.slot,
        logs: logs,
      },
      ...prev.slice(0, 10),
    ]);
    // Get the full transaction details
    // const txInfo = await connection.getTransaction(logs.signature, {
    //   maxSupportedTransactionVersion: 0,
    //   commitment: "confirmed",
    // });
    // if (!txInfo || !txInfo.transaction) {
    //   return;
    // }

    // const {
    //   transaction: { signatures },
    //   meta,
    //   transaction,
    // } = txInfo;
    // if (!signatures || !meta || !transaction) {
    //   return;
    // }
  }

  useEffect(() => {
    if (!connection) {
      return;
    }
    const subId = connection.onLogs(
      // new PublicKey(programId),
      "all",
      async (logs, ctx) => {
        handleTransaction(logs.signature, logs.logs || [], ctx);
      },
      "processed"
    );
    return () => {
      connection.removeOnLogsListener(subId);
    };
  }, [programId]);

  return (
    <div>
      <h3>实时交易流</h3>
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
