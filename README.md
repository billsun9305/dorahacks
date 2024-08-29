# Donation Smart Contract

This project contains a Solidity smart contract for managing donations in ETH and ERC20 tokens, along with comprehensive tests and an interaction script.

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
npm run test
```


## Contract Interaction Script

The project includes an interaction script (`scripts/interact.js`) that demonstrates how to deploy and interact with the Donation contract and a mock ERC20 token.

To run the interaction script:
```
npm run interact
``` 

This script does the following:
1. Deploys the Donation contract and a MockERC20 token contract
2. Mints tokens to two donor accounts
3. Makes ETH and token donations from both donors
4. Retrieves and displays the donation history
5. Shows the total balance of both ETH and tokens in the contract


## Deploying the Contract

1. Compile the contract:
    ```
    npm run compile
    ```
2. Deploy the contract:
    ```
    npm run localnet
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