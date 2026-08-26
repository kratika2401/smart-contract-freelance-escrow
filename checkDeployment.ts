import { network } from "hardhat";

async function main() {
  console.log("======================================");
  console.log("FreelanceEscrow Deployment Check");
  console.log("======================================\n");

  const { ethers } = await network.connect();

  const contractAddress =
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  console.log("Connecting to contract:");
  console.log(contractAddress);

  const escrow = await ethers.getContractAt(
    "FreelanceEscrow",
    contractAddress
  );

  console.log("\nContract connected successfully.");

  const balance = await escrow.getContractBalance();

  console.log("\nContract Balance:");
  console.log(ethers.formatEther(balance), "ETH");

  const nextProjectId = await escrow.getNextProjectId();

  console.log("\nNext Project ID:");
  console.log(nextProjectId.toString());

  console.log("\n======================================");
  console.log("CONTRACT VERIFICATION SUCCESSFUL");
  console.log("======================================");
}

main().catch((error) => {
  console.error("\nVerification failed:");
  console.error(error);
  process.exitCode = 1;
});