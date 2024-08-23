const dotenv = require("dotenv");
dotenv.config();
const { ethers } = require("ethers");
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const contractPath = path.resolve(__dirname, "../artifacts/contracts/TransferUSDC.sol/TransferUSDC.json");
const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const abi = contractJson.abi;
let gasEstimate;

describe("Get gas estimation then call transferUSDC with new gas limit + 10%", function () {
  async function setup() {
    const privateKey = process.env.PRIVATE_KEY;
    const provider = new ethers.JsonRpcProvider(process.env.AVALANCHE_FUJI_RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    const amount = ethers.parseUnits("1", 6); // 1 USDC

    const fujiTransferUSDCAddress = "0x50478Dae7141ED5023C520543464d451589b7A0F"; // Fuji
    const SwapTestnetUSDCAddress = "0x6c33634b43610204f6bA77d9B156EfFfDd01177c"; // Sepolia
    const CrossChainReceiverAddress = "0x2d2dCf4754F36c3aA628D8AF2F29bd45933E4491"; //sepolia
    const destinationChainSelector = "16015286601757825753";

    return {
      fujiTransferUSDCAddress,
      SwapTestnetUSDCAddress,
      CrossChainReceiverAddress,
      signer,
      destinationChainSelector,
      amount,
    };
  }

  it("Should send USDC to receiver and return ccipReceive gas", async function () {
    const greenCheckmark = "\x1b[32m✔\x1b[0m";

    const {
      fujiTransferUSDCAddress,
      CrossChainReceiverAddress,
      signer,
      destinationChainSelector,
      amount,
    } = await loadFixture(setup);

    console.log("Estimating gas for transferUsdc() !");

    // Create a contract instance
    const fujiTransferUSDCContract = new ethers.Contract(
      fujiTransferUSDCAddress,
      abi,
      signer
    );

    // Estimate gas using ethers
    try {
      gasEstimate = await fujiTransferUSDCContract.transferUsdc.estimateGas(
        destinationChainSelector,
        CrossChainReceiverAddress,
        1000000,
        500000
      );
      console.log(gasEstimate)
      console.log(`${greenCheckmark} Estimated gas: ${gasEstimate.toString()}`);
    } catch (error) {
      console.log(error);
    }

    let gasLimit = (BigInt(gasEstimate) * BigInt(110)) / BigInt(100);

    console.log(`${greenCheckmark} New Gas Limit + 10%: `, gasLimit.toString());
    console.log("Calling transferUsdc() !");
    try {
      const txResponse = await fujiTransferUSDCContract.transferUsdc(
        destinationChainSelector,
        CrossChainReceiverAddress,
        amount,
        gasLimit
      );
      await txResponse.wait();
      console.log(`${greenCheckmark} Transaction successful!`);
      console.log(
        `${greenCheckmark} TransferUSDC transaction hash: `,
        txResponse.hash
      );
    } catch (error) {
      console.log(error);
    }
  });
});
