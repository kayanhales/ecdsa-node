import { useState, useEffect } from "react";
import Wallet from "./Wallet";
import Transfer from "./Transfer";
import "./App.scss";
import server from "./server";

function App() {
  const [balance, setBalance] = useState(0);
  const [address, setAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [serverStatus, setServerStatus] = useState("loading"); // loading | slow | awake

  useEffect(() => {
    const slowTimer = setTimeout(() => {
      setServerStatus((s) => s === "loading" ? "slow" : s);
    }, 3000);

    server.get("accounts").then(({ data }) => {
      clearTimeout(slowTimer);
      setAccounts(data);
      setServerStatus("awake");
    });

    return () => clearTimeout(slowTimer);
  }, []);

  function resetWallet() {
    setAddress("");
    setPrivateKey("");
    setBalance(0);
  }

  function addTransaction(tx) {
    setTransactions((prev) => [tx, ...prev]);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">S</div>
        <h1>Signet</h1>
        <span className="tagline">Sign it. Send it. Done. ECDSA-secured.</span>
      </header>

      {serverStatus !== "awake" && (
        <div className={`server-banner ${serverStatus === "slow" ? "server-banner--slow" : ""}`}>
          {serverStatus === "slow"
            ? "⏳ Server is waking up from sleep — this may take ~30 seconds. Hang tight!"
            : "Connecting to server…"}
        </div>
      )}

      <div className="app">
        <Wallet
          balance={balance}
          setBalance={setBalance}
          address={address}
          setAddress={setAddress}
          setPrivateKey={setPrivateKey}
          accounts={accounts}
          onSwitch={resetWallet}
        />
        {privateKey && (
          <Transfer
            setBalance={setBalance}
            address={address}
            privateKey={privateKey}
            transactions={transactions}
            addTransaction={addTransaction}
          />
        )}
      </div>

      <footer className="app-footer">
        <span>Built by a mom in tech</span>
        <span className="footer-dot">·</span>
        <a href="https://github.com/kayanhales" target="_blank" rel="noreferrer">
          github.com/kayanhales
        </a>
        <span className="footer-dot">·</span>
        <a href="https://github.com/kayanhales/ecdsa-node" target="_blank" rel="noreferrer">
          view repo
        </a>
      </footer>
    </div>
  );
}

export default App;
