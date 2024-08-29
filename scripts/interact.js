const hre = require("hardhat");

async function main() {
  const Donation = await hre.ethers.getContractFactory("Donation");
  const donation = await Donation.deploy();
  await donation.waitForDeployment();
  console.log("Donation contract deployed to:", await donation.getAddress());

  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy("MockToken", "MTK");
  await mockToken.waitForDeployment();
  console.log("MockERC20 contract deployed to:", await mockToken.getAddress());

  const [donor1, donor2] = await hre.ethers.getSigners();

  // Mint tokens to donors
  const twoMKR = hre.ethers.parseUnits("2", 18);
  const fiftyFiveMKR = hre.ethers.parseUnits("55", 18);
  await mockToken.mint(donor1.address, twoMKR);
  await mockToken.mint(donor2.address, fiftyFiveMKR);

  // Donate 1 ETH and 2 MTK from donor1
  const oneEth = hre.ethers.parseEther("1.0");
  await donation.connect(donor1).donate({ value: oneEth });
  await mockToken.connect(donor1).approve(await donation.getAddress(), twoMKR);
  await donation.connect(donor1).donateERC20(await mockToken.getAddress(), twoMKR);
  console.log("Donor1 donated 1 ETH and 2 MTK");

  // Donate 10 ETH and 55 MTK from donor2
  const tenEth = hre.ethers.parseEther("10.0");
  await donation.connect(donor2).donate({ value: tenEth });
  await mockToken.connect(donor2).approve(await donation.getAddress(), fiftyFiveMKR);
  await donation.connect(donor2).donateERC20(await mockToken.getAddress(), fiftyFiveMKR);
  console.log("Donor2 donated 10 ETH and 55 MTK");

  // Get donation history
  const [donors, ethAmounts, tokenAddresses, tokenAmounts] = await donation.getAllDonations();

  console.log("\nDonation History:");
  for (let i = 0; i < donors.length; i++) {
    console.log(`Donor${i + 1}: ${donors[i]}`);
    console.log(`ETH Amount: ${hre.ethers.formatEther(ethAmounts[i])} ETH`);
    
    if (tokenAddresses[i].length > 0) {
      console.log("Token Donations:");
      for (let j = 0; j < tokenAddresses[i].length; j++) {
        console.log(`- Token: ${tokenAddresses[i][j]}`);
        console.log(`- Amount: ${hre.ethers.formatUnits(tokenAmounts[i][j], 18)}`);
      }
    } else {
      console.log("No token donations");
    }
    console.log();
  }

  const ethBalance = await hre.ethers.provider.getBalance(await donation.getAddress());
  const tokenBalance = await mockToken.balanceOf(await donation.getAddress());
  console.log(`\nTotal contract balance:`);
  console.log(`ETH: ${hre.ethers.formatEther(ethBalance)} ETH`);
  console.log(`MTK: ${hre.ethers.formatUnits(tokenBalance, 18)} MTK`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});