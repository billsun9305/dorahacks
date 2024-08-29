pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Donation is Ownable, ReentrancyGuard {
    
    struct DonationInfo {
        uint256 ethAmount;
        mapping(address => uint256) tokenAmounts;
        address[] tokenAddresses;
    }

    mapping (address => DonationInfo) public donationInfo;
    address[] public donors;
    mapping(address => bool) private addedToDonors;

    event DonationReceived(address indexed donor, uint256 amount);
    event TokenDonationReceived(address indexed donor, address indexed token, uint256 amount);

    constructor() Ownable(msg.sender) {}
    
    // Function to accept ETH donations
    function donate() external payable nonReentrant {
        require(msg.value > 0, "Donation must be greater than zero");
        if (!addedToDonors[msg.sender]) {
            donors.push(msg.sender);
            addedToDonors[msg.sender] = true;
        }
        donationInfo[msg.sender].ethAmount += msg.value;
        emit DonationReceived(msg.sender, msg.value);
    }

    // Function to accept ERC20 token donations
    function donateERC20(IERC20 token, uint256 amount) external nonReentrant {
        require(amount > 0, "Donation must be greater than zero");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        if (!addedToDonors[msg.sender]) {
            donors.push(msg.sender);
            addedToDonors[msg.sender] = true;
        }
        if (donationInfo[msg.sender].tokenAmounts[address(token)] == 0) {
            donationInfo[msg.sender].tokenAddresses.push(address(token));
        }
        donationInfo[msg.sender].tokenAmounts[address(token)] += amount;
        emit TokenDonationReceived(msg.sender, address(token), amount);
    }

    // Get donation total of an address
    function getDonationTotal(address donor) external view returns (uint256) {
        return donationInfo[donor].ethAmount;
    }

    // Get ERC20 donation total of an address for a specific token
    function getERC20DonationTotal(address token, address donor) external view returns (uint256) {
        return donationInfo[donor].tokenAmounts[token];
    }

    // Get all donors and their donation totals
    function getAllDonations() external view returns (address[] memory, uint256[] memory, address[][] memory, uint256[][] memory) {
        uint256[] memory ethAmounts = new uint256[](donors.length);
        address[][] memory tokenAddresses = new address[][](donors.length);
        uint256[][] memory tokenAmounts = new uint256[][](donors.length);

        for (uint i = 0; i < donors.length; i++) {
            address donor = donors[i];
            ethAmounts[i] = donationInfo[donor].ethAmount;
            
            uint256 tokenCount = donationInfo[donor].tokenAddresses.length;
            tokenAddresses[i] = new address[](tokenCount);
            tokenAmounts[i] = new uint256[](tokenCount);

            for (uint j = 0; j < tokenCount; j++) {
                address tokenAddress = donationInfo[donor].tokenAddresses[j];
                tokenAddresses[i][j] = tokenAddress;
                tokenAmounts[i][j] = donationInfo[donor].tokenAmounts[tokenAddress];
            }
        }

        return (donors, ethAmounts, tokenAddresses, tokenAmounts);
    }

    // Withdraw the ETH donations by the owner
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        require(balance >= amount, "Insufficient funds to withdraw");
        payable(owner()).transfer(amount);
    }

    // Withdraw the ERC20 donations by the owner
    function withdrawERC20(IERC20 token, uint256 amount) external onlyOwner nonReentrant {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");
        require(balance >= amount, "Insufficient funds to withdraw");
        require(token.transfer(owner(), amount), "Transfer failed");
    }
}
