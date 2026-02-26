import { useState } from "react";
import server from "./server";
import { secp256k1 } from "ethereum-cryptography/secp256k1";
import { toHex } from "ethereum-cryptography/utils";

const trunc = (addr) => `${addr.slice(0, 8)}…${addr.slice(-6)}`;

function Wallet({ address, setAddress, balance, setBalance, setPrivateKey, accounts, onSwitch }) {
  const [lookupAddr, setLookupAddr] = useState("");
  const [lookupBalance, setLookupBalance] = useState(null);
  const [copied, setCopied] = useState(false);

  async function generateWallet() {
    try {
      const privKeyBytes = secp256k1.utils.randomPrivateKey();
      const pubKey = secp256k1.getPublicKey(privKeyBytes);
      const derivedAddress = "0x" + toHex(pubKey.slice(-20));
      setPrivateKey(toHex(privKeyBytes));
      setAddress(derivedAddress);
      const { data } = await server.get(`balance/${derivedAddress}`);
      setBalance(data.balance);
    } catch (err) {
      alert(err.message);
    }
  }

  async function selectAccount(evt) {
    const selected = accounts.find((a) => a.address === evt.target.value);
    if (!selected) return;
    setPrivateKey(selected.privateKey);
    setAddress(selected.address);
    const { data } = await server.get(`balance/${selected.address}`);
    setBalance(data.balance);
  }

  async function refreshBalance() {
    const { data } = await server.get(`balance/${address}`);
    setBalance(data.balance);
  }

  async function copyAddress() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function checkBalance() {
    if (!/^0x[0-9a-fA-F]{40}$/.test(lookupAddr)) return;
    const { data } = await server.get(`balance/${lookupAddr}`);
    setLookupBalance(data.balance);
  }

  const loading = accounts.length === 0;

  return (
    <div className="container wallet">
      <h2>Your Wallet</h2>

      {address ? (
        <>
          <div className="address-chip">
            <div>
              <div className="address-label">Address</div>
              <div className="address-value">{address}</div>
            </div>
            <button type="button" className={`copy-btn ${copied ? "copied" : ""}`} onClick={copyAddress}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>

          <div className="balance-card">
            <div className="balance-left">
              <div className="balance-label">Balance</div>
              <div className="balance-amount">{balance}</div>
            </div>
            <div className="balance-actions">
              <button type="button" className="btn-ghost" onClick={refreshBalance}>↻ Refresh</button>
              <button type="button" className="btn-ghost switch-btn" onClick={onSwitch}>⇄ Switch</button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="wallet-actions">
            <select onChange={selectAccount} defaultValue="" disabled={loading}>
              <option value="" disabled>
                {loading ? "Loading accounts…" : "Select existing wallet…"}
              </option>
              {accounts.map(({ address }) => (
                <option key={address} value={address} title={address}>
                  {trunc(address)}
                </option>
              ))}
            </select>

            <div className="or-divider">or</div>

            <button type="button" className="generate-btn" onClick={generateWallet}>
              + Generate New Wallet
            </button>
          </div>

          <hr className="section-divider" />

          <div className="lookup-section">
            <h2>Check Any Balance</h2>
            <div className="lookup-row">
              <label>
                Wallet address
                <input
                  placeholder="0x..."
                  value={lookupAddr}
                  onChange={(e) => { setLookupAddr(e.target.value); setLookupBalance(null); }}
                />
              </label>
              <button type="button" className="btn-outline" onClick={checkBalance}>Check</button>
            </div>

            {lookupBalance !== null && (
              <div className="lookup-result">
                <div className="lookup-result-label">Balance</div>
                <div className="lookup-result-amount">{lookupBalance}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Wallet;
