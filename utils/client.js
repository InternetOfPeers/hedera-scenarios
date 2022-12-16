const { Client } = require("@hashgraph/sdk");

async function getClient(network) {
  //Grab your Hedera testnet account ID and private key from your .env file
  const myAccountId = process.env.OPERATOR_ID;
  const myPrivateKey = process.env.OPERATOR_KEY;
  if(network == "") network = process.env.HEDERA_NETWORK;

  // If we weren't able to grab it, we should throw a new error
  if (myAccountId == null || myPrivateKey == null) {
    throw new Error(
      "Environment variables myAccountId and myPrivateKey must be present"
    );
  }

  // Create our connection to the Hedera network
  let client;
  if(network == "mainnet") client = Client.forMainnet()
  else if(network == "previewnet") client = Client.forPreviewnet()
  else client = Client.forTestnet()

  client.setOperator(myAccountId, myPrivateKey);

  return client;
}
module.exports = getClient;
