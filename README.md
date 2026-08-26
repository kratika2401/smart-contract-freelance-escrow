# smart-contract-freelance-escrow
Freelance Escrow - Smart Contract Project

A blockchain-based freelance escrow platform that securely manages payments between clients and freelancers using Ethereum smart contracts.

Project Overview

Freelance Escrow is a decentralized application (DApp) designed to protect both clients and freelancers during digital projects.

The client creates an escrow project by specifying:

Freelancer wallet address

Escrow payment amount

The payment can then be funded into the smart contract. Once the work is approved, the smart contract releases the payment directly to the freelancer.

If the project needs to be cancelled, the client can receive a refund according to the escrow state.

Objectives

Secure freelance payments using blockchain technology

Remove unnecessary payment intermediaries

Hold funds securely inside a smart contract

Automate payment release

Provide transparent transaction states

Demonstrate Ethereum smart contract development

Integrate a React frontend with MetaMask

Test smart contract functionality using Hardhat

Technologies Used

Blockchain

Solidity

Ethereum

Hardhat

Hardhat Localhost Network

Frontend

React

TypeScript

Vite

CSS

Web3

Ethers.js

MetaMask

Testing

Hardhat

Mocha

Chai

Smart Contract

The main smart contract is:

contracts/FreelanceEscrow.sol

The contract implements four project states:

CREATED
FUNDED
COMPLETED
CANCELLED

Main Functions

createEscrow()

Creates a new freelance escrow project using a freelancer address and escrow amount.

fundEscrow()

The client deposits the exact escrow amount into the smart contract.

State transition:

CREATED → FUNDED

approveAndReleasePayment()

The client approves the completed work and the escrow payment is transferred to the freelancer.

State transition:

FUNDED → COMPLETED

cancelAndRefund()

The client can cancel an escrow in the CREATED or FUNDED state. If funded, the locked amount is returned to the client.

State transitions:

CREATED → CANCELLED
FUNDED → CANCELLED

getEscrowDetails()

Returns project ID, client, freelancer, amount, state and creation timestamp.

getContractBalance()

Returns the ETH currently held by the smart contract.

getNextProjectId()

Returns the next project ID.

Smart Contract Workflow

                ┌─────────────────┐
                │  Create Escrow  │
                └────────┬────────┘
                         │
                         ▼
                   ┌───────────┐
                   │  CREATED  │
                   └─────┬─────┘
                         │
                    Fund Escrow
                         │
                         ▼
                   ┌───────────┐
                   │  FUNDED   │
                   └─────┬─────┘
                         │
                ┌────────┴─────────┐
                │                  │
                ▼                  ▼
       Approve & Release     Cancel & Refund
                │                  │
                ▼                  ▼
          ┌───────────┐      ┌───────────┐
          │ COMPLETED │      │ CANCELLED │
          └───────────┘      └───────────┘

Security Considerations

The smart contract includes validation checks for:

Zero freelancer addresses

Same client and freelancer addresses

Zero escrow amounts

Unauthorized funding

Unauthorized payment release

Unauthorized cancellation

Incorrect funding amounts

Release before funding

Cancellation of completed projects

Non-existent projects

Payment and refund functions update the project state before ETH transfers.

Frontend Features

MetaMask wallet connection

Hardhat Localhost network switching

Create Escrow interface

Freelancer address and amount input

Project information display

Fund Escrow

Approve & Release Payment

Cancel & Refund

Project state display

Connected wallet display

Transaction status messages

Local Development Setup

1. Install dependencies

npm install

2. Start Hardhat Localhost

npx hardhat node

Keep this terminal running.

RPC:

http://127.0.0.1:8545

3. Deploy the smart contract

npx hardhat run scripts/deploy.ts --network localhost

4. Verify deployment

npx hardhat run scripts/checkDeployment.ts --network localhost

5. Start the frontend

cd frontend
npm install
npm run dev

Testing

Run:

npx hardhat test

Final automated test result:

20 passing
0 failing

The test suite covers deployment, project creation, multiple projects, validation, funding, incorrect funding, authorization, payment release, cancellation, refunds, project details, contract balance and direct ETH transfers.

Deployment

The smart contract was successfully deployed on Hardhat Localhost.

Network

Hardhat Localhost

RPC URL

http://127.0.0.1:8545

Contract Address

0x5FbDB2315678afecb367f032d93F642f64180aa3

Deployment output confirmed:

CONTRACT DEPLOYED SUCCESSFULLY

Deployment Verification

The deployed contract was verified using:

npx hardhat run scripts/checkDeployment.ts --network localhost

Verification confirmed:

Contract connected successfully

Contract balance: 0.0 ETH

Next Project ID: 1

Contract verification successful

Demonstrated Project Lifecycle

Project Creation

Project #1
State: CREATED
Amount: 1.0 ETH

Funding

State: FUNDED
Amount: 1.0 ETH

Payment Release

State: COMPLETED

Cancellation and Refund

State: CANCELLED

Project Structure

Smart-Contract-Freelance-Escrow/
│
├── contracts/
│   └── FreelanceEscrow.sol
│
├── test/
│   └── FreelanceEscrow.test.ts
│
├── scripts/
│   ├── deploy.ts
│   ├── checkDeployment.ts
│   └── send-op-tx.ts
│
├── frontend/
│   ├── src/
│   │   ├── contract/
│   │   │   └── FreelanceEscrow.json
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── artifacts/
├── cache/
├── reports/
├── screenshots/
├── hardhat.config.ts
├── package.json
├── package-lock.json
└── README.md

Screenshots and Evidence

Evidence includes:

MetaMask wallet connection

Hardhat Localhost connection

Escrow creation

CREATED state

Escrow funding

FUNDED state

Payment release

COMPLETED state

Escrow cancellation

CANCELLED state

Automated smart contract testing

Successful deployment

Deployment verification

Key Results

Wallet Connection              ✓
Escrow Creation                ✓
Escrow Funding                 ✓
Payment Release                ✓
Cancellation / Refund          ✓
Smart Contract Testing         ✓
20 Automated Tests Passing     ✓
Contract Deployment            ✓
Contract Verification          ✓
React + MetaMask Integration   ✓

Advantages

Secure payment handling through smart contracts

Transparent project state transitions

Reduced dependence on centralized payment intermediaries

Automated payment release

Blockchain-based transaction records

Client authorization for important escrow operations

Local blockchain environment for development and testing

React frontend for user interaction

Limitations

This project currently runs on the Hardhat Localhost blockchain for development and demonstration.

The current implementation does not include:

Production Ethereum deployment

Real-world dispute resolution

Freelancer work submission verification

Multi-party arbitration

Production database

User authentication outside wallet authentication

Future Enhancements

Freelancer work submission system

Dispute resolution mechanism

Arbitrator-based dispute handling

Project descriptions and deadlines

Transaction history

Production deployment on an Ethereum testnet

Improved role-based access control

Event-based frontend updates

Notification system

Multi-project dashboard

Project search and filtering

Conclusion

The Freelance Escrow project demonstrates how Ethereum smart contracts can be used to securely manage freelance payments.

The system successfully implements escrow creation, funding, payment release, cancellation, refund handling, project state management, MetaMask wallet integration and React frontend interaction.

The smart contract was tested using Hardhat, Mocha and Chai with:

20 passing tests
0 failing tests

The contract was successfully deployed and verified on the Hardhat Localhost network.

This project demonstrates the integration of blockchain smart contracts, Web3 wallet interaction, automated testing and a React-based frontend into a complete decentralized application.
