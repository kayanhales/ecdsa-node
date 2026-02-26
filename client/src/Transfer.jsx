import { useState, useEffect } from "react";
import server from "./server";
import { secp256k1 } from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes, toHex, hexToBytes } from "ethereum-cryptography/utils";

const trunc = (addr) => `${addr.slice(0, 8)}…${addr.slice(-6)}`;

function Transfer({ address, setBalance, privateKey, transactions, addTransaction }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");
  const [recipientBalance, setRecipientBalance] = useState(null);

  // Debounced recipient balance preview
  useEffect(() => {
    setRecipientBalance(null);
    if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) return;
    const timer = setTimeout(async () => {
      try {
        const { data } = await server.get(`balance/${recipient}`);
        setRecipientBalance(data.balance);
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [recipient]);

  async function transfer(evt) {
    evt.preventDefault();
    setError("");

    if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
      setError("Enter a valid recipient address.");
      return;
    }
    if (!sendAmount || parseInt(sendAmount) <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }

    setStatus("sending");
    try {
      const message = `${recipient}:${sendAmount}`;
      const msgHash = keccak256(utf8ToBytes(message));
      const sig = secp256k1.sign(msgHash, hexToBytes(privateKey));

      const { data: { balance } } = await server.post("send", {
        sender: address,
        recipient,
        amount: parseInt(sendAmount),
        signature: toHex(sig.toCompactRawBytes()),
        recovery: sig.recovery,
      });

      setBalance(balance);
      addTransaction({ from: address, to: recipient, amount: parseInt(sendAmount), time: Date.now() });
      setStatus("sent");
      setSendAmount("");
      setRecipient("");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (ex) {
      setError(ex.response?.data?.message ?? ex.message);
      setStatus("idle");
    }
  }

  const sending = status === "sending";
  const sent = status === "sent";

  return (
    <div className="transfer-col">
      <form className="container transfer" onSubmit={transfer}>
        <h2>Send Transaction</h2>

        <label>
          Amount
          <input
            type="number"
            placeholder="0"
            value={sendAmount}
            onChange={(e) => setSendAmount(e.target.value)}
            min="1"
            disabled={sending}
          />
        </label>

        <label>
          Recipient address
          <input
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={sending}
          />
        </label>

        {recipientBalance !== null && (
          <div className="recipient-preview">
            Recipient current balance: <span>{recipientBalance}</span>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        <button
          type="submit"
          className={`transfer-submit${sent ? " transfer-sent" : ""}`}
          disabled={sending || sent}
        >
          {sending ? "Sending…" : sent ? "✓ Sent!" : "Send →"}
        </button>
      </form>

      {transactions.length > 0 && (
        <div className="container tx-history">
          <h2>Transaction History</h2>
          {transactions.map((tx, i) => (
            <div key={i} className="tx-item">
              <div className="tx-addresses">
                <span className="tx-addr">{trunc(tx.from)}</span>
                <span className="tx-arrow">→</span>
                <span className="tx-addr">{trunc(tx.to)}</span>
              </div>
              <div className="tx-amount">−{tx.amount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Transfer;
