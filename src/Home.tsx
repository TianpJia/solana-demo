import { useMemo, type FC } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  UnsafeBurnerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";
import { Wallet } from "./wallet/Wallet";
import { TxListener } from "./TxListener/TxListener";
import { RaydiumSwap } from "./transaction/raydiumSwap/RaydiumSwap";

export const Home: FC = () => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;
  // const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  // const endpoint =
  //   "https://mainnet.helius-rpc.com/?api-key=55e26ca4-1245-4d39-a0bc-60329bde9922";

  const wallets = useMemo(
    () => [
      new UnsafeBurnerWalletAdapter(),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Wallet></Wallet>
          {/* <TxListener programId="HwGqFnPY6H2sGFoDUMYqr63geoR6Tb8yrfnKGLMnARzj"></TxListener> */}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
