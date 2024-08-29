# Donation Smart Contract

This project contains a Solidity smart contract for managing donations in ETH and ERC20 tokens, along with comprehensive tests.

## Features

- Accept ETH donations
- Accept ERC20 token donations
- Track donation history and totals per donor
- Allow owner to withdraw funds

## Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- Hardhat

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

## Running Tests

Execute the test suite with:
    ```
    npx hardhat test
    ```


## Contract Overview

The `Donation` contract allows:
- Users to donate ETH and ERC20 tokens
- Contract owner to withdraw accumulated funds
- Querying of donation totals and history

## Test Suite

The test file (`test/Donation.js`) covers:
- Contract deployment
- ETH and ERC20 token donations
- Donation history retrieval
- Withdrawal functionality
- Error cases