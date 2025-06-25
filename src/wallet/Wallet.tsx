import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useEffect, useState, type FC } from "react";
import styles from "./index.module.css";
import WalletInfo from "../walletInfo/WalletInfo";
import CreateToken from "../createToken/CreateToken";
import { CreateAssociatedToken } from "../createAssociatedToken/CreateAssociatedToken";
import MintTokens from "../mintToken/MintToken";
import { Tabs } from "antd";
import TokenTransfer from "../tokenTransfer/tokenTransfer";
import PumpSwap from "../transaction/pumpSwap/pumpSwap";
import { RaydiumSwap } from "../transaction/raydiumSwap/RaydiumSwap";
import { CreatePoolComponent } from "../transaction/raydiumSwap/creaetCpmmPool";
import { TxListener } from "../TxListener/TxListener";

export const Wallet: FC = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(0);
  useEffect(() => {
    const updateBalance = async () => {
      if (!connection || !publicKey) {
        return;
      }
      try {
        connection.onAccountChange(
          publicKey,
          (updatedAccountInfo) => {
            setBalance(updatedAccountInfo.lamports / LAMPORTS_PER_SOL);
          },
          { commitment: "confirmed" }
        );

        const accountInfo = await connection.getAccountInfo(publicKey);
        if (accountInfo) {
          setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
        } else {
          throw new Error("Account not found");
        }
      } catch (error) {
        console.info("Failed to retrieve account info", error);
      }
    };
    updateBalance();
  }, [connection, publicKey]);
  return (
    <div className={styles.container}>
      <WalletMultiButton />
      <WalletDisconnectButton />
      <p>{publicKey ? `Balance: ${balance} SOL` : ""}</p>
      <Tabs
        defaultActiveKey="listener"
        items={[
          {
            label: "Raydium监听",
            key: "listener",
            children: <TxListener></TxListener>,
          },
          {
            label: "Raydium交易",
            key: "transaction",
            children: <RaydiumSwap></RaydiumSwap>,
          },
          {
            label: "pumpfun交易",
            key: "pumpSwap",
            children: <PumpSwap></PumpSwap>,
          },
          {
            label: "创建代币",
            key: "createToken",
            children: <CreateToken></CreateToken>,
          },
          {
            label: "创建关联账户",
            key: "createAssociated",
            children: <CreateAssociatedToken />,
          },
          // {
          //   label: "IPFS上传",
          //   key: "upload",
          //   children: "",
          // },
          // {
          //   label: "设置Metadata",
          //   key: "setMetadata",
          //   children: "",
          // },
          {
            label: "铸造代币",
            key: "mint",
            children: <MintTokens></MintTokens>,
          },
          {
            label: "创建Cpmm流动性池",
            key: "createPool",
            children: <CreatePoolComponent />,
          },
        ]}
      />
    </div>
  );
};
