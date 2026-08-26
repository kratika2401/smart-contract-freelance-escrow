import { network } from "hardhat";

async function main() {
  console.log("======================================");
  console.log("Freelance Escrow Deployment");
  console.log("======================================\n");

  // Connect to the local Hardhat network
  const { ethers } = await network.connect();

  // Get local Hardhat accounts
  const [client, freelancer, arbitrator, platform] =
    await ethers.getSigners();

  console.log("Client Address:");
  console.log(client.address);

  console.log("\nFreelancer Address:");
  console.log(freelancer.address);

  console.log("\nArbitrator Address:");
  console.log(arbitrator.address);

  console.log("\nPlatform Address:");
  console.log(platform.address);

  console.log("\n--------------------------------------");
  console.log("Deploying FreelanceEscrow...");
  console.log("--------------------------------------\n");

  // Get the contract factory
  const FreelanceEscrow =
    await ethers.getContractFactory("FreelanceEscrow");

  // Deploy the contract
  const escrow = await FreelanceEscrow.deploy();

  // Wait until deployment is confirmed
  await escrow.waitForDeployment();

  // Get deployed contract address
  const contractAddress = await escrow.getAddress();

  console.log("======================================");
  console.log("CONTRACT DEPLOYED SUCCESSFULLY");
  console.log("======================================");

  console.log("\nContract Address:");
  console.log(contractAddress);

  console.log("\nNetwork:");
  console.log("Hardhat Localhost");

  console.log("\nRPC URL:");
  console.log("http://127.0.0.1:8545");

  console.log("\n======================================");
  console.log("Deployment completed!");
  console.log("======================================");
}

main().catch((error) => {
  console.error("\nDeployment failed:");
  console.error(error);
  process.exitCode = 1;
});