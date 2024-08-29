const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Donation", function () {
  async function deploy() {
    const [owner, donor1, donor2] = await ethers.getSigners();

    const Donation = await ethers.getContractFactory("Donation");
    const donation = await Donation.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("MockToken", "MTK");

    return { donation, mockToken, owner, donor1, donor2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { donation, owner } = await loadFixture(deploy);

      expect(await donation.owner()).to.equal(owner.address);
    });
  });

  describe("ETH Donations", function () {
    it("Should donate 1 ETH", async function () {
      const { donation, donor1 } = await loadFixture(deploy);
      const initialBalance = await ethers.provider.getBalance(donor1);

      const ONE_ETH = ethers.parseEther("1.0");
      await expect(donation.connect(donor1).donate({ value: ONE_ETH }))
        .to.emit(donation, "DonationReceived")
        .withArgs(donor1.address, ONE_ETH);
      expect(await donation.getDonationTotal(donor1.address)).to.equal(ONE_ETH);

      const finalBalance = await ethers.provider.getBalance(donor1);
      const expectedBalance = initialBalance - ONE_ETH;
      expect(finalBalance).to.lessThan(expectedBalance);
    });

    it("Should fail when donating 0 ETH", async function () {
      const { donation, donor1 } = await loadFixture(deploy);
      await expect(donation.connect(donor1).donate({ value: 0 }))
        .to.be.revertedWith("Donation must be greater than zero");
    });

    it("Should accumulate multiple donations", async function () {
      const { donation, donor1 } = await loadFixture(deploy);
      const ONE_ETH = ethers.parseEther("1.0");
      await donation.connect(donor1).donate({ value: ONE_ETH });
      await donation.connect(donor1).donate({ value: ONE_ETH });
      expect(await donation.getDonationTotal(donor1.address)).to.equal(ethers.parseEther("2.0"));
    });
  });

  describe("Donation History", function () {
    it("Should return all donations correctly", async function () {
      const { donation, mockToken, donor1, donor2 } = await loadFixture(deploy);
  
      // Donate ETH
      await donation.connect(donor1).donate({ value: ethers.parseEther("1.0") });
      await donation.connect(donor2).donate({ value: ethers.parseEther("2.0") });
  
      // Donate ERC20 tokens
      const tokenAmount1 = ethers.parseEther("100");
      const tokenAmount2 = ethers.parseEther("200");
      await mockToken.mint(donor1.address, tokenAmount1);
      await mockToken.mint(donor2.address, tokenAmount2);
      await mockToken.connect(donor1).approve(await donation.getAddress(), tokenAmount1);
      await mockToken.connect(donor2).approve(await donation.getAddress(), tokenAmount2);
      await donation.connect(donor1).donateERC20(await mockToken.getAddress(), tokenAmount1);
      await donation.connect(donor2).donateERC20(await mockToken.getAddress(), tokenAmount2);
  
      const [donors, ethAmounts, tokenAddresses, tokenAmounts] = await donation.getAllDonations();
  
      expect(donors).to.have.lengthOf(2);
      expect(donors).to.include(donor1.address);
      expect(donors).to.include(donor2.address);
  
      const donor1Index = donors.indexOf(donor1.address);
      const donor2Index = donors.indexOf(donor2.address);
  
      expect(ethAmounts[donor1Index]).to.equal(ethers.parseEther("1.0"));
      expect(ethAmounts[donor2Index]).to.equal(ethers.parseEther("2.0"));
  
      expect(tokenAddresses[donor1Index]).to.have.lengthOf(1);
      expect(tokenAddresses[donor2Index]).to.have.lengthOf(1);
      expect(tokenAddresses[donor1Index][0]).to.equal(await mockToken.getAddress());
      expect(tokenAddresses[donor2Index][0]).to.equal(await mockToken.getAddress());
  
      expect(tokenAmounts[donor1Index]).to.have.lengthOf(1);
      expect(tokenAmounts[donor2Index]).to.have.lengthOf(1);
      expect(tokenAmounts[donor1Index][0]).to.equal(tokenAmount1);
      expect(tokenAmounts[donor2Index][0]).to.equal(tokenAmount2);
    });
  });

  describe("ERC20 Donations", function () {
    it("Should donate ERC20 tokens", async function () {
      const { donation, mockToken, donor1 } = await loadFixture(deploy);
      const amount = ethers.parseEther("100");
      await mockToken.mint(donor1.address, amount);
      await mockToken.connect(donor1).approve(await donation.getAddress(), amount);
      
      await expect(donation.connect(donor1).donateERC20(await mockToken.getAddress(), amount))
        .to.emit(donation, "TokenDonationReceived")
        .withArgs(donor1.address, await mockToken.getAddress(), amount);
      
      expect(await donation.getERC20DonationTotal(await mockToken.getAddress(), donor1.address)).to.equal(amount);
    });

    it("Should fail when donating 0 tokens", async function () {
      const { donation, mockToken, donor1 } = await loadFixture(deploy);
      await expect(donation.connect(donor1).donateERC20(await mockToken.getAddress(), 0))
        .to.be.revertedWith("Donation must be greater than zero");
    });
  });

  describe("Withdrawals", function () {
    it("Should allow owner to withdraw ETH", async function () {
      const { donation, owner, donor1 } = await loadFixture(deploy);
      const ONE_ETH = ethers.parseEther("1.0");
      await donation.connect(donor1).donate({ value: ONE_ETH });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      await donation.connect(owner).withdraw(ONE_ETH);
      const finalBalance = await ethers.provider.getBalance(owner.address);

      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should allow owner to withdraw ERC20 tokens", async function () {
      const { donation, mockToken, owner, donor1 } = await loadFixture(deploy);
      const amount = ethers.parseEther("100");
      await mockToken.mint(donor1.address, amount);
      await mockToken.connect(donor1).approve(await donation.getAddress(), amount);
      await donation.connect(donor1).donateERC20(await mockToken.getAddress(), amount);

      await expect(donation.connect(owner).withdrawERC20(await mockToken.getAddress(), amount))
        .to.changeTokenBalances(
          mockToken,
          [donation, owner],
          [-amount, amount]
        );
    });

    it("Should fail when non-owner tries to withdraw", async function () {
      const { donation, donor1 } = await loadFixture(deploy);
      await expect(donation.connect(donor1).withdraw(ethers.parseEther("1.0")))
        .to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount");
    });

    it("Should fail when withdrawing more than available balance", async function () {
      const { donation, owner } = await loadFixture(deploy);
      await expect(donation.connect(owner).withdraw(ethers.parseEther("1.0")))
        .to.be.revertedWith("No funds to withdraw");
    });
  });
});
