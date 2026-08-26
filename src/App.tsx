import { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

import FreelanceEscrowArtifact from "./contract/FreelanceEscrow.json";

// ============================================================
// CONTRACT CONFIGURATION
// ============================================================

const CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const HARDHAT_CHAIN_ID = "0x7A69";
const HARDHAT_CHAIN_ID_DECIMAL = "31337";
const HARDHAT_RPC = "http://127.0.0.1:8545";

// ============================================================
// TYPES
// ============================================================

type Project = {
  id: number;
  client: string;
  freelancer: string;
  amount: string;
  state: string;
  createdAt: string;
};

// ============================================================
// APP
// ============================================================

function App() {
  // ----------------------------------------------------------
  // WALLET
  // ----------------------------------------------------------

  const [account, setAccount] = useState("");
  const [connecting, setConnecting] = useState(false);

  // ----------------------------------------------------------
  // PROJECT
  // ----------------------------------------------------------

  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);

  // ----------------------------------------------------------
  // CONTRACT BALANCE
  // ----------------------------------------------------------

  const [contractBalance, setContractBalance] = useState("0");

  // ----------------------------------------------------------
  // CREATE ESCROW MODAL
  // ----------------------------------------------------------

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [freelancerAddress, setFreelancerAddress] = useState("");
  const [escrowAmount, setEscrowAmount] = useState("");

  const [creating, setCreating] = useState(false);

  // ----------------------------------------------------------
  // TRANSACTION STATES
  // ----------------------------------------------------------

  const [funding, setFunding] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================================
  // GET ETHEREUM PROVIDER
  // ==========================================================

  const getEthereum = () => {
    const ethereum = (window as any).ethereum;

    if (!ethereum) {
      throw new Error(
        "MetaMask is not installed. Please install MetaMask."
      );
    }

    return ethereum;
  };

  // ==========================================================
  // GET CONTRACT
  // ==========================================================

  const getContract = async () => {
    const ethereum = getEthereum();

    const provider = new ethers.BrowserProvider(ethereum);

    const signer = await provider.getSigner();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      FreelanceEscrowArtifact.abi,
      signer
    );

    return contract;
  };

  // ==========================================================
  // CONNECT WALLET
  // ==========================================================

  const connectWallet = async () => {
    setError("");
    setSuccess("");

    try {
      setConnecting(true);

      const ethereum = getEthereum();

      // ------------------------------------------------------
      // SWITCH TO HARDHAT LOCALHOST
      // ------------------------------------------------------

      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [
            {
              chainId: HARDHAT_CHAIN_ID,
            },
          ],
        });
      } catch (switchError: any) {
        // ----------------------------------------------------
        // NETWORK DOES NOT EXIST → ADD IT
        // ----------------------------------------------------

        if (switchError.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: HARDHAT_CHAIN_ID,
                chainName: "Hardhat Localhost",
                rpcUrls: [HARDHAT_RPC],
                nativeCurrency: {
                  name: "Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      // ------------------------------------------------------
      // REQUEST ACCOUNT
      // ------------------------------------------------------

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No MetaMask account found.");
      }

      setAccount(accounts[0]);

      // ------------------------------------------------------
      // VERIFY NETWORK
      // ------------------------------------------------------

      const provider = new ethers.BrowserProvider(ethereum);

      const network = await provider.getNetwork();

      const chainId = network.chainId.toString();

      console.log("Connected account:", accounts[0]);
      console.log("Connected chain:", chainId);

      if (chainId !== HARDHAT_CHAIN_ID_DECIMAL) {
        throw new Error(
          "Please connect to Hardhat Localhost."
        );
      }

      setSuccess("Wallet connected successfully.");

      // ------------------------------------------------------
      // LOAD PROJECT
      // ------------------------------------------------------

      await loadLatestProject(accounts[0]);

    } catch (err: any) {
      console.error("Wallet connection failed:", err);

      if (err.code === 4001) {
        setError("MetaMask connection was rejected.");
      } else {
        setError(
          err?.reason ||
            err?.shortMessage ||
            err?.message ||
            "Wallet connection failed."
        );
      }
    } finally {
      setConnecting(false);
    }
  };

  // ==========================================================
  // LOAD LATEST PROJECT FROM BLOCKCHAIN
  // ==========================================================

  const loadLatestProject = async (walletAddress?: string) => {
    setError("");
    setLoadingProject(true);

    try {
      const ethereum = getEthereum();

      const provider = new ethers.BrowserProvider(ethereum);

      const network = await provider.getNetwork();

      if (
        network.chainId.toString() !==
        HARDHAT_CHAIN_ID_DECIMAL
      ) {
        throw new Error(
          "Please connect MetaMask to Hardhat Localhost."
        );
      }

      // ------------------------------------------------------
      // READ CONTRACT
      // ------------------------------------------------------

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        FreelanceEscrowArtifact.abi,
        provider
      );

      // ------------------------------------------------------
      // GET NEXT PROJECT ID
      // ------------------------------------------------------

      const nextProjectId =
        await contract.getNextProjectId();

      const nextId = Number(nextProjectId);

      console.log("Next Project ID:", nextId);

      // No project exists
      if (nextId <= 1) {
        setProject(null);
        setContractBalance("0");
        return;
      }

      // ------------------------------------------------------
      // LATEST PROJECT ID
      // ------------------------------------------------------

      const latestProjectId = nextId - 1;

      // ------------------------------------------------------
      // GET PROJECT DETAILS
      // ------------------------------------------------------

      const details =
        await contract.getEscrowDetails(
          latestProjectId
        );

      const states = [
        "CREATED",
        "FUNDED",
        "COMPLETED",
        "CANCELLED",
      ];

      const loadedProject: Project = {
        id: latestProjectId,

        client: details[1],

        freelancer: details[2],

        amount: ethers.formatEther(details[3]),

        state:
          states[Number(details[4])] ||
          "UNKNOWN",

        createdAt: new Date(
          Number(details[5]) * 1000
        ).toLocaleString(),
      };

      console.log(
        "Latest project:",
        loadedProject
      );

      setProject(loadedProject);

      // ------------------------------------------------------
      // CONTRACT BALANCE
      // ------------------------------------------------------

      const balance =
        await contract.getContractBalance();

      setContractBalance(
        ethers.formatEther(balance)
      );

    } catch (err: any) {
      console.error(
        "Loading project failed:",
        err
      );

      setError(
        err?.reason ||
          err?.shortMessage ||
          err?.message ||
          "Failed to load project."
      );
    } finally {
      setLoadingProject(false);
    }
  };

  // ==========================================================
  // CREATE ESCROW
  // ==========================================================

  const createEscrow = async () => {
    setError("");
    setSuccess("");

    try {
      if (!account) {
        throw new Error(
          "Please connect your wallet first."
        );
      }

      if (!freelancerAddress.trim()) {
        throw new Error(
          "Please enter freelancer address."
        );
      }

      if (
        !ethers.isAddress(
          freelancerAddress.trim()
        )
      ) {
        throw new Error(
          "Please enter a valid freelancer address."
        );
      }

      if (!escrowAmount.trim()) {
        throw new Error(
          "Please enter escrow amount."
        );
      }

      const amount =
        ethers.parseEther(escrowAmount);

      if (amount <= 0n) {
        throw new Error(
          "Escrow amount must be greater than zero."
        );
      }

      if (
        freelancerAddress.toLowerCase() ===
        account.toLowerCase()
      ) {
        throw new Error(
          "Client and freelancer must be different."
        );
      }

      setCreating(true);

      const contract =
        await getContract();

      // ------------------------------------------------------
      // CREATE ESCROW
      // ------------------------------------------------------

      const tx =
        await contract.createEscrow(
          freelancerAddress.trim(),
          amount
        );

      console.log(
        "Create escrow transaction:",
        tx.hash
      );

      await tx.wait();

      // ------------------------------------------------------
      // GET CREATED PROJECT ID
      // ------------------------------------------------------

      const nextProjectId =
        await contract.getNextProjectId();

      const createdProjectId =
        Number(nextProjectId) - 1;

      setShowCreateModal(false);

      setFreelancerAddress("");
      setEscrowAmount("");

      setSuccess(
        `Escrow created successfully — Project ID: ${createdProjectId}`
      );

      alert(
        `Escrow created successfully!\n\nProject ID: ${createdProjectId}\nAmount: ${escrowAmount} ETH`
      );

      // ------------------------------------------------------
      // LOAD PROJECT AGAIN
      // ------------------------------------------------------

      await loadLatestProject(account);

    } catch (err: any) {
      console.error(
        "Create escrow failed:",
        err
      );

      if (err.code === 4001) {
        setError(
          "Transaction rejected in MetaMask."
        );
      } else {
        setError(
          err?.reason ||
            err?.shortMessage ||
            err?.message ||
            "Failed to create escrow."
        );
      }
    } finally {
      setCreating(false);
    }
  };

  // ==========================================================
  // FUND ESCROW
  // ==========================================================

  const fundEscrow = async () => {
    setError("");
    setSuccess("");

    try {
      if (!project) {
        throw new Error(
          "No project available."
        );
      }

      setFunding(true);

      const contract =
        await getContract();

      const amount =
        ethers.parseEther(
          project.amount
        );

      const tx =
        await contract.fundEscrow(
          project.id,
          {
            value: amount,
          }
        );

      console.log(
        "Fund transaction:",
        tx.hash
      );

      await tx.wait();

      setSuccess(
        `Project #${project.id} funded successfully.`
      );

      await loadLatestProject(account);

    } catch (err: any) {
      console.error(
        "Funding failed:",
        err
      );

      if (err.code === 4001) {
        setError(
          "Funding transaction rejected."
        );
      } else {
        setError(
          err?.reason ||
            err?.shortMessage ||
            err?.message ||
            "Failed to fund escrow."
        );
      }
    } finally {
      setFunding(false);
    }
  };

  // ==========================================================
  // APPROVE AND RELEASE
  // ==========================================================

  const approveAndRelease = async () => {
    setError("");
    setSuccess("");

    try {
      if (!project) {
        throw new Error(
          "No project available."
        );
      }

      setReleasing(true);

      const contract =
        await getContract();

      const tx =
        await contract.approveAndReleasePayment(
          project.id
        );

      console.log(
        "Release transaction:",
        tx.hash
      );

      await tx.wait();

      setSuccess(
        `Payment released successfully for Project #${project.id}.`
      );

      await loadLatestProject(account);

    } catch (err: any) {
      console.error(
        "Release failed:",
        err
      );

      if (err.code === 4001) {
        setError(
          "Release transaction rejected."
        );
      } else {
        setError(
          err?.reason ||
            err?.shortMessage ||
            err?.message ||
            "Failed to release payment."
        );
      }
    } finally {
      setReleasing(false);
    }
  };

  // ==========================================================
  // CANCEL AND REFUND
  // ==========================================================

  const cancelAndRefund = async () => {
    setError("");
    setSuccess("");

    try {
      if (!project) {
        throw new Error(
          "No project available."
        );
      }

      const confirmed =
        window.confirm(
          `Are you sure you want to cancel Project #${project.id}?`
        );

      if (!confirmed) {
        return;
      }

      setCancelling(true);

      const contract =
        await getContract();

      const tx =
        await contract.cancelAndRefund(
          project.id
        );

      console.log(
        "Cancel transaction:",
        tx.hash
      );

      await tx.wait();

      setSuccess(
        `Project #${project.id} cancelled successfully.`
      );

      await loadLatestProject(account);

    } catch (err: any) {
      console.error(
        "Cancel failed:",
        err
      );

      if (err.code === 4001) {
        setError(
          "Cancel transaction rejected."
        );
      } else {
        setError(
          err?.reason ||
            err?.shortMessage ||
            err?.message ||
            "Failed to cancel escrow."
        );
      }
    } finally {
      setCancelling(false);
    }
  };

  // ==========================================================
  // WALLET ACCOUNT CHANGE
  // ==========================================================

  useEffect(() => {
    const ethereum = (window as any).ethereum;

    if (!ethereum) {
      return;
    }

    const handleAccountsChanged = (
      accounts: string[]
    ) => {
      if (accounts.length === 0) {
        setAccount("");
        setProject(null);
      } else {
        setAccount(accounts[0]);
        loadLatestProject(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    ethereum.on(
      "chainChanged",
      handleChainChanged
    );

    return () => {
      ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

      ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, []);

  // ==========================================================
  // LOAD PROJECT WHEN ACCOUNT EXISTS
  // ==========================================================

  useEffect(() => {
    if (!account) {
      return;
    }

    loadLatestProject(account);
  }, [account]);

  // ==========================================================
  // SHORT ADDRESS
  // ==========================================================

  const shortAddress = account
    ? `${account.slice(
        0,
        6
      )}...${account.slice(-4)}`
    : "";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="app">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="navbar">

        <div className="brand">

          <div className="brand-icon">
            E
          </div>

          <div>
            <h2>EscrowX</h2>
            <span>
              Freelance Escrow
            </span>
          </div>

        </div>

        <div className="nav-links">

          <a href="#dashboard">
            Dashboard
          </a>

          <a href="#how-it-works">
            How It Works
          </a>

          <a href="#about">
            About
          </a>

        </div>

        <button
          className="connect-btn"
          onClick={connectWallet}
          disabled={connecting}
        >
          {connecting
            ? "Connecting..."
            : account
            ? shortAddress
            : "Connect Wallet"}
        </button>

      </nav>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>

        {/* ===================================================
            HERO
        =================================================== */}

        <section
          className="hero"
          id="dashboard"
        >

          <div className="hero-content">

            <div className="badge">
              ● Blockchain-Powered Escrow
            </div>

            <h1>
              Freelance Payments,
              <span>
                {" "}
                Secured by Smart Contracts.
              </span>
            </h1>

            <p>
              A decentralized escrow platform
              that protects clients and
              freelancers by holding payments
              securely until the agreed work is
              completed.
            </p>

            {/* -----------------------------------------------
                BUTTONS
            ------------------------------------------------ */}

            <div className="hero-buttons">

              <button
                className="primary-btn"
                onClick={() => {
                  setError("");
                  setSuccess("");

                  if (!account) {
                    setError(
                      "Please connect your wallet first."
                    );
                    return;
                  }

                  setShowCreateModal(true);
                }}
              >
                Create Escrow
              </button>

              <button
                className="secondary-btn"
                onClick={() => {
                  setError("");
                  setSuccess("");

                  if (!account) {
                    setError(
                      "Please connect your wallet first."
                    );
                    return;
                  }

                  loadLatestProject(account);
                }}
              >
                View My Projects
              </button>

            </div>

            {/* -----------------------------------------------
                ERROR
            ------------------------------------------------ */}

            {error && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background:
                    "rgba(255, 70, 70, 0.12)",
                  border:
                    "1px solid rgba(255, 70, 70, 0.35)",
                  color: "#ff8c8c",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {/* -----------------------------------------------
                SUCCESS
            ------------------------------------------------ */}

            {success && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background:
                    "rgba(50, 255, 140, 0.10)",
                  border:
                    "1px solid rgba(50, 255, 140, 0.30)",
                  color: "#65e6a0",
                  fontSize: "14px",
                }}
              >
                ✓ {success}
              </div>
            )}

            {/* -----------------------------------------------
                CONNECTED WALLET
            ------------------------------------------------ */}

            {account && (
              <div
                style={{
                  marginTop: "15px",
                  fontSize: "13px",
                  color: "#8f8aa8",
                }}
              >
                Connected wallet:
                {" "}
                {account}
              </div>
            )}

          </div>

          {/* =================================================
              ESCROW OVERVIEW CARD
          ================================================= */}

          <div className="hero-card">

            <div className="card-header">

              <span>
                Escrow Overview
              </span>

              <span className="status">
                ●{" "}
                {account
                  ? "Connected"
                  : "Active"}
              </span>

            </div>

            <div className="balance">

              <small>
                Total Escrow Balance
              </small>

              <h2>
                {Number(contractBalance).toFixed(
                  4
                )} ETH
              </h2>

              <span>
                Secured on local blockchain
              </span>

            </div>

            <div className="card-stats">

              <div>
                <small>
                  Active Projects
                </small>

                <strong>
                  {project &&
                  project.state === "FUNDED"
                    ? "1"
                    : "0"}
                </strong>
              </div>

              <div>
                <small>
                  Completed
                </small>

                <strong>
                  {project &&
                  project.state ===
                    "COMPLETED"
                    ? "1"
                    : "0"}
                </strong>
              </div>

              <div>
                <small>
                  Pending
                </small>

                <strong>
                  {project &&
                  project.state === "CREATED"
                    ? "1"
                    : "0"}
                </strong>
              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            PROJECT SECTION
        =================================================== */}

        <section
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding:
              "40px 30px 80px",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "25px",
            }}
          >

            <div>

              <span
                style={{
                  color: "#8c62ff",
                  fontSize: "12px",
                  fontWeight: "700",
                  letterSpacing:
                    "1.5px",
                }}
              >
                BLOCKCHAIN PROJECT
              </span>

              <h2
                style={{
                  marginTop: "8px",
                  fontSize: "30px",
                }}
              >
                My Latest Escrow
              </h2>

            </div>

            {loadingProject && (
              <span
                style={{
                  color: "#9c96b5",
                }}
              >
                Loading...
              </span>
            )}

          </div>

          {/* -------------------------------------------------
              NO PROJECT
          ------------------------------------------------- */}

          {!loadingProject &&
            !project && (
              <div
                style={{
                  padding: "30px",
                  borderRadius: "16px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  background:
                    "rgba(255,255,255,0.03)",
                  color: "#9c96b5",
                }}
              >
                No project created yet.
                <br />
                Create your first escrow
                project above.
              </div>
            )}

          {/* -------------------------------------------------
              PROJECT CARD
          ------------------------------------------------- */}

          {project && (
            <div
              style={{
                padding: "30px",
                borderRadius: "18px",
                border:
                  "1px solid rgba(140,98,255,0.25)",
                background:
                  "rgba(255,255,255,0.035)",
              }}
            >

              {/* Project Header */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: "25px",
                }}
              >

                <div>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: "22px",
                    }}
                  >
                    Project #{project.id}
                  </h3>

                  <p
                    style={{
                      marginTop: "7px",
                      color: "#858099",
                      fontSize: "13px",
                    }}
                  >
                    Created:
                    {" "}
                    {project.createdAt}
                  </p>

                </div>

                <div
                  style={{
                    padding:
                      "8px 14px",
                    borderRadius: "20px",
                    background:
                      "rgba(140,98,255,0.12)",
                    color: "#a985ff",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {project.state}
                </div>

              </div>

              {/* Project Details */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, 1fr)",
                  gap: "15px",
                }}
              >

                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background:
                      "rgba(255,255,255,0.035)",
                  }}
                >

                  <small
                    style={{
                      color: "#817b99",
                    }}
                  >
                    Client
                  </small>

                  <p
                    style={{
                      marginTop: "8px",
                      wordBreak:
                        "break-all",
                      fontSize: "13px",
                    }}
                  >
                    {project.client}
                  </p>

                </div>

                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background:
                      "rgba(255,255,255,0.035)",
                  }}
                >

                  <small
                    style={{
                      color: "#817b99",
                    }}
                  >
                    Freelancer
                  </small>

                  <p
                    style={{
                      marginTop: "8px",
                      wordBreak:
                        "break-all",
                      fontSize: "13px",
                    }}
                  >
                    {project.freelancer}
                  </p>

                </div>

                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background:
                      "rgba(255,255,255,0.035)",
                  }}
                >

                  <small
                    style={{
                      color: "#817b99",
                    }}
                  >
                    Escrow Amount
                  </small>

                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "20px",
                      fontWeight: "700",
                    }}
                  >
                    {project.amount} ETH
                  </p>

                </div>

              </div>

              {/* =================================================
                  PROJECT ACTIONS
              ================================================= */}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "25px",
                  flexWrap: "wrap",
                }}
              >

                {/* FUND */}

                {project.state ===
                  "CREATED" && (
                  <button
                    className="primary-btn"
                    onClick={fundEscrow}
                    disabled={funding}
                  >
                    {funding
                      ? "Funding..."
                      : `Fund Escrow (${project.amount} ETH)`}
                  </button>
                )}

                {/* RELEASE */}

                {project.state ===
                  "FUNDED" && (
                  <button
                    className="primary-btn"
                    onClick={
                      approveAndRelease
                    }
                    disabled={releasing}
                  >
                    {releasing
                      ? "Releasing..."
                      : "Approve & Release Payment"}
                  </button>
                )}

                {/* CANCEL */}

                {(project.state ===
                  "CREATED" ||
                  project.state ===
                    "FUNDED") && (
                  <button
                    className="secondary-btn"
                    onClick={
                      cancelAndRefund
                    }
                    disabled={cancelling}
                  >
                    {cancelling
                      ? "Cancelling..."
                      : "Cancel & Refund"}
                  </button>
                )}

              </div>

            </div>
          )}

        </section>

        {/* ===================================================
            FEATURES
        =================================================== */}

        <section
          className="features"
          id="how-it-works"
        >

          <div className="section-heading">

            <span>
              WHY ESCROWX
            </span>

            <h2>
              Simple. Secure. Transparent.
            </h2>

            <p>
              Smart contracts automate the
              payment process and remove the
              need for unnecessary intermediaries.
            </p>

          </div>

          <div className="feature-grid">

            <div className="feature-card">

              <div className="feature-icon">
                🔒
              </div>

              <h3>
                Secure Payments
              </h3>

              <p>
                Funds remain locked inside
                the smart contract until the
                correct conditions are
                satisfied.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                ⚡
              </div>

              <h3>
                Automated Release
              </h3>

              <p>
                Once the client approves
                completed work, the smart
                contract releases the payment
                to the freelancer.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                ◈
              </div>

              <h3>
                Blockchain Transparency
              </h3>

              <p>
                Transactions and escrow
                states can be verified directly
                on the blockchain.
              </p>

            </div>

          </div>

        </section>

        {/* ===================================================
            HOW IT WORKS
        =================================================== */}

        <section className="steps-section">

          <div className="section-heading">

            <span>
              HOW IT WORKS
            </span>

            <h2>
              Four simple steps
            </h2>

          </div>

          <div className="steps">

            <div className="step">

              <div className="step-number">
                01
              </div>

              <h3>
                Create
              </h3>

              <p>
                Client creates an escrow
                project with the freelancer.
              </p>

            </div>

            <div className="step">

              <div className="step-number">
                02
              </div>

              <h3>
                Fund
              </h3>

              <p>
                Client deposits the agreed
                ETH amount into escrow.
              </p>

            </div>

            <div className="step">

              <div className="step-number">
                03
              </div>

              <h3>
                Complete
              </h3>

              <p>
                Freelancer completes the
                work and submits it for
                approval.
              </p>

            </div>

            <div className="step">

              <div className="step-number">
                04
              </div>

              <h3>
                Release
              </h3>

              <p>
                Client approves the work
                and payment is released.
              </p>

            </div>

          </div>

        </section>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer id="about">

          <div>

            <h3>
              EscrowX
            </h3>

            <p>
              Decentralized freelance escrow
              powered by Ethereum smart
              contracts.
            </p>

          </div>

          <div className="footer-right">

            <span>
              Smart Contract
            </span>

            <span>
              Hardhat Localhost
            </span>

            <span>
              React + TypeScript
            </span>

          </div>

        </footer>

      </main>

      {/* =====================================================
          CREATE ESCROW MODAL
      ===================================================== */}

      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "#171525",
              border:
                "1px solid rgba(255,255,255,0.12)",
              borderRadius: "18px",
              padding: "30px",
              boxShadow:
                "0 25px 80px rgba(0,0,0,0.5)",
            }}
          >

            {/* Modal Header */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "25px",
              }}
            >

              <div>

                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  Create Escrow
                </h2>

                <p
                  style={{
                    marginTop: "8px",
                    color: "#8e89a3",
                    fontSize: "14px",
                  }}
                >
                  Create a new freelance
                  payment escrow.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowCreateModal(false)
                }
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#aaa",
                  fontSize: "25px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>

            </div>

            {/* Freelancer */}

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#ddd",
                fontSize: "14px",
              }}
            >
              Freelancer Address
            </label>

            <input
              type="text"
              value={freelancerAddress}
              onChange={(e) =>
                setFreelancerAddress(
                  e.target.value
                )
              }
              placeholder="0x..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "15px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                background: "#0f0d19",
                color: "#fff",
                outline: "none",
                marginBottom: "20px",
              }}
            />

            {/* Amount */}

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#ddd",
                fontSize: "14px",
              }}
            >
              Escrow Amount (ETH)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={escrowAmount}
              onChange={(e) =>
                setEscrowAmount(
                  e.target.value
                )
              }
              placeholder="1"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "15px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                background: "#0f0d19",
                color: "#fff",
                outline: "none",
                marginBottom: "25px",
              }}
            />

            {/* Modal Buttons */}

            <div
              style={{
                display: "flex",
                gap: "12px",
              }}
            >

              <button
                className="secondary-btn"
                onClick={() =>
                  setShowCreateModal(false)
                }
                disabled={creating}
                style={{
                  flex: 1,
                }}
              >
                Cancel
              </button>

              <button
                className="primary-btn"
                onClick={createEscrow}
                disabled={creating}
                style={{
                  flex: 1,
                }}
              >
                {creating
                  ? "Creating..."
                  : "Create Escrow"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default App;