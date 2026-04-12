const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NeuronToken", function () {
  let NeuronToken, token, owner, addr1, addr2, treasury, liquidity, rewards;

  beforeEach(async function () {
    [owner, addr1, addr2, treasury, liquidity, rewards] = await ethers.getSigners();
    NeuronToken = await ethers.getContractFactory("NeuronToken");
    token = await NeuronToken.deploy();
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply to owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("NeuraFinance Token");
      expect(await token.symbol()).to.equal("NEURON");
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await token.transfer(addr1.address, 1000);
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(1000);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);
      await expect(
        token.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("NeuronToken: insufficient balance");
      expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      await token.authorizeMinter(owner.address);
      await token.mint(addr1.address, 1000);
      expect(await token.balanceOf(addr1.address)).to.equal(1000);
    });

    it("Should not allow non-authorized to mint", async function () {
      await expect(
        token.connect(addr1).mint(addr1.address, 1000)
      ).to.be.revertedWith("NeuronToken: not authorized");
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their tokens", async function () {
      await token.transfer(addr1.address, 1000);
      await token.connect(addr1).burn(500);
      expect(await token.balanceOf(addr1.address)).to.equal(500);
    });
  });

  describe("Fee Configuration", function () {
    it("Should set fee recipients", async function () {
      await token.setFeeRecipients(treasury.address, liquidity.address, rewards.address);
      expect(await token.treasuryRecipient()).to.equal(treasury.address);
      expect(await token.liquidityRecipient()).to.equal(liquidity.address);
      expect(await token.rewardsRecipient()).to.equal(rewards.address);
    });

    it("Should set fee percentages", async function () {
      await token.setFeePercentages(300, 500);
      expect(await token.buyFee()).to.equal(300);
      expect(await token.sellFee()).to.equal(500);
    });
  });

  describe("Whitelist", function () {
    it("Should whitelist addresses", async function () {
      await token.whitelistAddress(addr1.address, true);
      expect(await token.isWhitelisted(addr1.address)).to.be.true;
    });

    it("Should remove addresses from whitelist", async function () {
      await token.whitelistAddress(addr1.address, true);
      await token.whitelistAddress(addr1.address, false);
      expect(await token.isWhitelisted(addr1.address)).to.be.false;
    });
  });
});
