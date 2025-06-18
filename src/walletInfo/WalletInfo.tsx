// components/WalletAddressForm.tsx
import { useState } from "react";
import { fetchWalletInfo } from "./walletInfoService";

export default function WalletInfo() {
  const [address, setAddress] = useState("");
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const [info] = await Promise.all([fetchWalletInfo(address)]);
      setWalletInfo(info);
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="wallet-info-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Solana wallet address"
          required
          pattern="[1-9A-HJ-NP-Za-km-z]{32,44}" // Base58格式验证
        />
        <button type="submit">查询</button>
      </form>

      {error && <div className="error">{error}</div>}

      {walletInfo && (
        <div className="wallet-details">
          <h3>钱包信息</h3>
          <p>
            <strong>地址:</strong> {walletInfo.address}
          </p>
          <p>
            <strong>余额:</strong> {walletInfo.balance} SOL
          </p>
          <p>
            <strong>是否可执行:</strong> {walletInfo.executable ? "是" : "否"}
          </p>
        </div>
      )}
    </div>
  );
}
