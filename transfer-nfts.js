require("dotenv").config();
const {
  AccountCreateTransaction,
  LocalProvider,
  NftId,
  TransferTransaction,
  TokenCreateTransaction,
  TokenAssociateTransaction,
  TokenType,
  TokenMintTransaction,
  TokenSupplyType,
  Wallet,
} = require("@hashgraph/sdk");

async function main() {
  /* Preapre the scenario:
  1) Create a new account with 2 Hbar balance
  2) Create a new NFT collection
  3) Associate the account to the NFT collection
  4) Mint 10 tokens
  */
  const { wallet, tokenId, senderID, recipientID } = await prepareTheScenario();

  // Transfer 10 NFTs from treasury to a new user account, and get 1 Hbar from the user
  // NOTE ABOUT GETTING 1 HBAR: this only demonstrate the atomic swap feature. In this case it works only because the
  // recipient has been created with the same key of the sender (the treasury). In other cases, the tx should have been
  // signer by the recipient also
  process.stdout.write(
    "Sending 10 tokens and getting 1 Hbar in the same transaction: "
  );
  let i = 1;
  let transaction = await new TransferTransaction()
    .addNftTransfer(new NftId(tokenId, i++), senderID, recipientID)
    .addNftTransfer(new NftId(tokenId, i++), senderID, recipientID)
    .addNftTransfer(new NftId(tokenId, i++), senderID, recipientID)
    .addNftTransfer(new NftId(tokenId, i++), senderID, recipientID)
    .addNftTransfer(new NftId(tokenId, i++), senderID, recipientID)
    .addNftTransfer(new NftId(tokenId, i++), senderID, recipientID)
    .addNftTransfer(new NftId(tokenId, i++), senderID, recipientID)
    .addNftTransfer(new NftId(tokenId, i++), senderID, recipientID)
    .addNftTransfer(new NftId(tokenId, i++), senderID, recipientID)
    .addNftTransfer(new NftId(tokenId, i++), senderID, recipientID)
    .addHbarTransfer(senderID, 1)
    .addHbarTransfer(recipientID, -1)
    .setMaxTransactionFee(10) // This TX should costs ~1 Hbar, but just in case
    .freezeWithSigner(wallet);

  signedTx = await transaction.signWithSigner(wallet);
  txResponse = await signedTx.executeWithSigner(wallet);
  receipt = await wallet.getProvider().waitForReceipt(txResponse);
  console.log(receipt.status.toString());
  console.log(
    "Details here: https://testnet.mirrornode.hedera.com/api/v1/transactions/" +
      getTxId(txResponse.transactionId.toString())
  );

  process.exit(0);
}

/***
 * Prepare the test scenario
 */
let prepareTheScenario = async function () {
  if (
    process.env.OPERATOR_ID == null ||
    process.env.OPERATOR_KEY == null ||
    process.env.HEDERA_NETWORK == null ||
    process.env.OPERATOR_PUBLIC_KEY == null
  ) {
    throw new Error(
      "Environment variables OPERATOR_ID, OPERATOR_KEY, OPERATOR_PUBLIC_KEY, and HEDERA_NETWORK are required."
    );
  }

  const wallet = new Wallet(
    process.env.OPERATOR_ID,
    process.env.OPERATOR_KEY,
    new LocalProvider()
  );

  console.log("Preparing the test scenario");

  // Create a new account
  process.stdout.write(" - Creating new account: ");
  let transaction = await new AccountCreateTransaction()
    .setKey(wallet.publicKey)
    .setInitialBalance(2)
    .freezeWithSigner(wallet);
  let signedTx = await transaction.signWithSigner(wallet);
  let txResponse = await signedTx.executeWithSigner(wallet);
  let receipt = await wallet.getProvider().waitForReceipt(txResponse);
  const userAccountID = receipt.accountId;
  console.log(receipt.accountId.toString());

  // Create a new token
  process.stdout.write(" - Creating a new NFT collection: ");
  transaction = await new TokenCreateTransaction()
    .setTokenType(TokenType.NonFungibleUnique)
    .setTokenSymbol("TST")
    .setTokenName("Test")
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(wallet.accountId)
    .setSupplyKey(wallet.publicKey)
    .freezeWithSigner(wallet);
  signedTx = await transaction.signWithSigner(wallet);
  txResponse = await signedTx.executeWithSigner(wallet);
  receipt = await wallet.getProvider().waitForReceipt(txResponse);
  const tokenId = receipt.tokenId;
  console.log(tokenId.toString());

  // Associate the new token to the new account
  process.stdout.write(" - Associate the collection with the account: ");
  transaction = await new TokenAssociateTransaction()
    .setAccountId(userAccountID)
    .setTokenIds([tokenId])
    .freezeWithSigner(wallet);
  signedTx = await transaction.signWithSigner(wallet);
  txResponse = await signedTx.executeWithSigner(wallet);
  receipt = await wallet.getProvider().waitForReceipt(txResponse);
  console.log(receipt.status.toString());

  // Mint 10 tokens. Fire and forget, we don't care about the receipts
  process.stdout.write(" - Minting 10 tokens: ");
  for (let index = 0; index < 10; index++) {
    let mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata(new Uint8Array(1))
      .freezeWithSigner(wallet);
    await (await mintTx.signWithSigner(wallet)).executeWithSigner(wallet);
    process.stdout.write("+");
  }
  console.log(" Done.");
  console.log("Test scenario ready");
  console.log("");

  let senderID = wallet.accountId;
  let recipientID = userAccountID;
  return { wallet, tokenId, senderID, recipientID };
};

let getTxId = function (id) {
  return id.split("@")[0] + "-" + id.split("@")[1].replace(/\./g, "-");
};

void main();
