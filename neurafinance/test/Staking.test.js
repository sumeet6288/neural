const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking", function () {
  let NeuronToken, token, Staking, staking, owner, addr1, addr2;
  const BOND_45_DAYS = 45 * 24 * 60 * 60;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    NeuronToken = await ethers.getContractFactory("NeuronToken");
    token = await NeuronToken.deploy();
    await token.waitForDeployment();

    Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(await token.getAddress());
    await staking.waitForDeployment();

    // Authorize staking contract to mint rewards
    await token.authorizeMinter(await staking.getAddress());
    
    // Transfer tokens to addr1 for testing
    await token.transfer(addr1.address, ethers.parseEther("10000"));
    await token.transfer(addr2.address, ethers.parseEther("10000"));
  });

  describe("Staking", function () {
    it("Should allow flexible staking", async function () {
      const amount = ethers.parseEther("1000");
      await token.connect(addr1).approve(await staking.getAddress(), amount);
      await staking.connect(addr1).stake(amount, 0); // 0 = flexible

      const stakeInfo = await staking.getStakeInfo(addr1.address, 0);
      expect(stakeInfo.amount).to.equal(amount);
      expect(stakeInfo.isFlexible).to.be.true;
      expect(stakeInfo.active).to.be.true;
    });

    it("Should allow bond staking", async function () {
      const amount = ethers.parseEther("1000");
      await token.connect(addr1).approve(await staking.getAddress(), amount);
      await staking.connect(addr1).stake(amount, BOND_45_DAYS);

      const stakeInfo = await staking.getStakeInfo(addr1.address, 0);
      expect(stakeInfo.amount).to.equal(amount);
      expect(stakeInfo.isFlexible).to.be.false;
      expect(stakeInfo.active).to.be.true;
    });

    it("Should track total staked correctly", async function () {
      const amount = ethers.parseEther("1000");
      await token.connect(addr1).approve(await staking.getAddress(), amount);
      await staking.connect(addr1).stake(amount, 0);

      expect(await staking.getTotalStaked(addr1.address)).to.equal(amount);
      expect(await staking.globalTotalStaked()).to.equal(amount);
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      await token.connect(addr1).approve(await staking.getAddress(), amount);
      await staking.connect(addr1).stake(amount, 0);
    });

    it("Should allow unstaking flexible stakes", async function () {
      // Fund staking contract with reward tokens
      await token.transfer(await staking.getAddress(), ethers.parseEther("10000"));
      
      const stakeInfoBefore = await staking.getStakeInfo(addr1.address, 0);
      expect(stakeInfoBefore.active).to.be.true;
      
      await staking.connect(addr1).unstake(0);
      
      const stakeInfoAfter = await staking.getStakeInfo(addr1.address, 0);
      expect(stakeInfoAfter.active).to.be.false;
    });

    it("Should not allow unstaking bond before lock period", async function () {
      const amount = ethers.parseEther("1000");
      await token.connect(addr1).approve(await staking.getAddress(), amount);
      await staking.connect(addr1).stake(amount, BOND_45_DAYS);

      await expect(
        staking.connect(addr1).unstake(1)
      ).to.be.revertedWith("Staking: bond still locked");
    });
  });

  describe("Reward Rates", function () {
    it("Should return correct flexible rate", async function () {
      const rate = await staking.getRewardRate(0);
      expect(rate).to.equal(500); // 5% APY
    });

    it("Should return correct bond rates", async function () {
      expect(await staking.getRewardRate(BOND_45_DAYS)).to.equal(1500); // 15%
    });

    it("Should allow owner to update reward rates", async function () {
      await staking.setRewardRates(600, [1600, 2600, 4100, 8100]);
      expect(await staking.flexibleRate()).to.equal(600);
    });
  });
});
