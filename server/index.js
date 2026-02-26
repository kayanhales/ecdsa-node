const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes, toHex } = require("ethereum-cryptography/utils");

const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3042;

const { generateKeyPair } = require("./scripts/generateKeys");

app.use(cors());
app.use(express.json());

// Generate key pairs and persist addresses in balances on every server start
const initialBalances = [100, 50, 75];
const keyPairs = initialBalances.map(() => generateKeyPair());
const balances = {};
keyPairs.forEach(({ address }, i) => {
  balances[address] = initialBalances[i];
});

// Write keys to file for testing (overwritten each start)
const keysPath = path.join(__dirname, "test-keys.json");
const keysForFile = keyPairs.map((kp, i) => ({
  address: kp.address,
  privateKey: kp.privateKey,
  publicKey: kp.publicKey,
  balance: initialBalances[i],
}));
fs.writeFileSync(keysPath, JSON.stringify(keysForFile, null, 2));

// Returns test accounts (address + private key) for the client to use for signing.
// Private keys are only sent here — never accepted back from the client.
app.get("/accounts", (req, res) => {
  res.send(keyPairs.map(({ address, privateKey }) => ({ address, privateKey })));
});

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  if (balances[address] === undefined) {
    balances[address] = 100; // faucet: new wallets start with 100
  }
  res.send({ balance: balances[address] });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, signature, recovery } = req.body;

  // 1. Reconstruct the exact same hash the client signed
  const message = `${recipient}:${amount}`;
  const msgHash = keccak256(utf8ToBytes(message));

  // 2. Recover the public key from the signature
  const sig = secp256k1.Signature.fromCompact(signature).addRecoveryBit(recovery);
  const publicKey = sig.recoverPublicKey(msgHash).toRawBytes();

  // 3. Derive the address from the recovered public key
  const recoveredAddress = "0x" + toHex(publicKey.slice(-20));

  // 4. Validate: recovered address must match the claimed sender
  if (recoveredAddress !== sender) {
    return res.status(400).send({ message: "Invalid signature!" });
  }

  // rest of your existing balance logic...
  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    return res.status(400).send({ message: "Not enough funds!" });
  }

  balances[sender] -= amount;
  balances[recipient] += amount;
  res.send({ balance: balances[sender] });
});

/*app.post("/send", (req, res) => {
  const { sender, recipient, amount } = req.body;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});*/


app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
  console.log("Accounts (address -> private key -> public key):");
  keyPairs.forEach(({ address, privateKey, publicKey }) => {
    console.log(`  ${address} -> ${privateKey} -> ${publicKey}`);
  });
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
