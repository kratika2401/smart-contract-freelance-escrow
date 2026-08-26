// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FreelanceEscrow {

    // =========================================================
    // 1. PROJECT STATES
    // =========================================================

    enum ProjectState {
        CREATED,
        FUNDED,
        COMPLETED,
        CANCELLED
    }

    // =========================================================
    // 2. ESCROW STRUCTURE
    // =========================================================

    struct Escrow {
        uint256 projectId;
        address payable client;
        address payable freelancer;
        uint256 amount;
        ProjectState state;
        uint256 createdAt;
    }

    // =========================================================
    // 3. STATE VARIABLES
    // =========================================================

    uint256 private nextProjectId = 1;

    mapping(uint256 => Escrow) public escrows;

    // =========================================================
    // 4. EVENTS
    // =========================================================

    event EscrowCreated(
        uint256 indexed projectId,
        address indexed client,
        address indexed freelancer,
        uint256 amount
    );

    event FundsDeposited(
        uint256 indexed projectId,
        uint256 amount
    );

    event PaymentReleased(
        uint256 indexed projectId,
        address indexed freelancer,
        uint256 amount
    );

    event RefundIssued(
        uint256 indexed projectId,
        address indexed client,
        uint256 amount
    );

    // =========================================================
    // 5. MODIFIERS
    // =========================================================

    modifier escrowExists(uint256 projectId) {
        require(
            projectId > 0 && projectId < nextProjectId,
            "Escrow does not exist"
        );
        _;
    }

    modifier onlyClient(uint256 projectId) {
        require(
            msg.sender == escrows[projectId].client,
            "Only client can perform this action"
        );
        _;
    }

    // =========================================================
    // 6. CREATE ESCROW
    // =========================================================

    function createEscrow(
        address payable freelancer,
        uint256 amount
    )
        external
        returns (uint256)
    {
        require(
            freelancer != address(0),
            "Invalid freelancer address"
        );

        require(
            freelancer != payable(msg.sender),
            "Client and freelancer must be different"
        );

        require(
            amount > 0,
            "Escrow amount must be greater than zero"
        );

        uint256 projectId = nextProjectId;

        escrows[projectId] = Escrow({
            projectId: projectId,
            client: payable(msg.sender),
            freelancer: freelancer,
            amount: amount,
            state: ProjectState.CREATED,
            createdAt: block.timestamp
        });

        nextProjectId++;

        emit EscrowCreated(
            projectId,
            msg.sender,
            freelancer,
            amount
        );

        return projectId;
    }

    // =========================================================
    // 7. FUND ESCROW
    // =========================================================

    function fundEscrow(
        uint256 projectId
    )
        external
        payable
        escrowExists(projectId)
        onlyClient(projectId)
    {
        Escrow storage escrow = escrows[projectId];

        require(
            escrow.state == ProjectState.CREATED,
            "Escrow is not in CREATED state"
        );

        require(
            msg.value == escrow.amount,
            "Incorrect funding amount"
        );

        escrow.state = ProjectState.FUNDED;

        emit FundsDeposited(
            projectId,
            msg.value
        );
    }

    // =========================================================
    // 8. APPROVE AND RELEASE PAYMENT
    // =========================================================

    function approveAndReleasePayment(
        uint256 projectId
    )
        external
        escrowExists(projectId)
        onlyClient(projectId)
    {
        Escrow storage escrow = escrows[projectId];

        require(
            escrow.state == ProjectState.FUNDED,
            "Escrow is not funded"
        );

        uint256 paymentAmount = escrow.amount;

        // Change state before sending ETH.
        // This follows the Checks-Effects-Interactions pattern.
        escrow.state = ProjectState.COMPLETED;

        (bool success, ) = escrow.freelancer.call{
            value: paymentAmount
        }("");

        require(
            success,
            "Payment transfer failed"
        );

        emit PaymentReleased(
            projectId,
            escrow.freelancer,
            paymentAmount
        );
    }

    // =========================================================
    // 9. CANCEL AND REFUND
    // =========================================================

    function cancelAndRefund(
        uint256 projectId
    )
        external
        escrowExists(projectId)
        onlyClient(projectId)
    {
        Escrow storage escrow = escrows[projectId];

        require(
            escrow.state == ProjectState.CREATED ||
            escrow.state == ProjectState.FUNDED,
            "Escrow cannot be cancelled"
        );

        // -----------------------------------------------------
        // CASE 1:
        // Escrow was created but never funded.
        // No money needs to be returned.
        // -----------------------------------------------------

        if (escrow.state == ProjectState.CREATED) {

            escrow.state = ProjectState.CANCELLED;

            emit RefundIssued(
                projectId,
                escrow.client,
                0
            );

            return;
        }

        // -----------------------------------------------------
        // CASE 2:
        // Escrow was funded.
        // Return the locked amount to the client.
        // -----------------------------------------------------

        uint256 refundAmount = escrow.amount;

        escrow.state = ProjectState.CANCELLED;

        (bool success, ) = escrow.client.call{
            value: refundAmount
        }("");

        require(
            success,
            "Refund transfer failed"
        );

        emit RefundIssued(
            projectId,
            escrow.client,
            refundAmount
        );
    }

    // =========================================================
    // 10. GET ESCROW DETAILS
    // =========================================================

    function getEscrowDetails(
        uint256 projectId
    )
        external
        view
        escrowExists(projectId)
        returns (
            uint256,
            address,
            address,
            uint256,
            ProjectState,
            uint256
        )
    {
        Escrow memory escrow = escrows[projectId];

        return (
            escrow.projectId,
            escrow.client,
            escrow.freelancer,
            escrow.amount,
            escrow.state,
            escrow.createdAt
        );
    }

    // =========================================================
    // 11. GET CONTRACT BALANCE
    // =========================================================

    function getContractBalance()
        external
        view
        returns (uint256)
    {
        return address(this).balance;
    }

    // =========================================================
    // 12. GET NEXT PROJECT ID
    // =========================================================

    function getNextProjectId()
        external
        view
        returns (uint256)
    {
        return nextProjectId;
    }

    // =========================================================
    // 13. RECEIVE ETH
    // =========================================================

    receive() external payable {}
}