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

  useEffect(() => {
    server.get("accounts").then(({ data }) => setAccounts(data));
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
    </div>
  );
}

export default App;
