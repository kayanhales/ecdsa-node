const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { toHex } = require("ethereum-cryptography/utils");

/**
 * Generates a new key pair and returns private key, public key, and address.
 * @returns {{ privateKey: string, publicKey: string, address: string }}
 */
function generateKeyPair() {
  const privateKey = secp256k1.utils.randomPrivateKey();
  const publicKey = secp256k1.getPublicKey(privateKey);
  const address = "0x" + toHex(publicKey.slice(-20));
  return {
    privateKey: toHex(privateKey),
    publicKey: toHex(publicKey),
    address,
  };
}

module.exports = { generateKeyPair };