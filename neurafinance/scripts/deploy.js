const { ethers } = require("hardhat");

async function main() {
  console.log("==========================================");
  console.log("NeuraFinance Contract Deployment");
  console.log("==========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  console.log("\n");

  // Deploy contracts in order
  const contracts = {};

  // 1. Deploy NeuronToken
  console.log("1. Deploying NeuronToken...");
  const NeuronToken = await ethers.getContractFactory("NeuronToken");
  contracts.neuronToken = await NeuronToken.deploy();
  await contracts.neuronToken.waitForDeployment();
  console.log("   NeuronToken deployed to:", await contracts.neuronToken.getAddress());

  // 2. Deploy Stablecoin
  console.log("2. Deploying Stablecoin (nUSD)...");
  const Stablecoin = await ethers.getContractFactory("Stablecoin");
  contracts.stablecoin = await Stablecoin.deploy();
  await contracts.stablecoin.waitForDeployment();
  console.log("   Stablecoin deployed to:", await contracts.stablecoin.getAddress());

  // 3. Deploy Treasury
  console.log("3. Deploying Treasury...");
  const Treasury = await ethers.getContractFactory("Treasury");
  contracts.treasury = await Treasury.deploy(
    await contracts.neuronToken.getAddress(),
    await contracts.stablecoin.getAddress()
  );
  await contracts.treasury.waitForDeployment();
  console.log("   Treasury deployed to:", await contracts.treasury.getAddress());

  // 4. Deploy Staking
  console.log("4. Deploying Staking...");
  const Staking = await ethers.getContractFactory("Staking");
  contracts.staking = await Staking.deploy(await contracts.neuronToken.getAddress());
  await contracts.staking.waitForDeployment();
  console.log("   Staking deployed to:", await contracts.staking.getAddress());

  // 5. Deploy Referral
  console.log("5. Deploying Referral...");
  const Referral = await ethers.getContractFactory("Referral");
  contracts.referral = await Referral.deploy(await contracts.neuronToken.getAddress());
  await contracts.referral.waitForDeployment();
  console.log("   Referral deployed to:", await contracts.referral.getAddress());

  // 6. Deploy DAO
  console.log("6. Deploying DAO...");
  const DAO = await ethers.getContractFactory("DAO");
  contracts.dao = await DAO.deploy(
    await contracts.staking.getAddress(),
    await contracts.neuronToken.getAddress()
  );
  await contracts.dao.waitForDeployment();
  console.log("   DAO deployed to:", await contracts.dao.getAddress());

  // 7. Deploy Lending
  console.log("7. Deploying Lending...");
  const Lending = await ethers.getContractFactory("Lending");
  contracts.lending = await Lending.deploy(
    await contracts.neuronToken.getAddress(),
    await contracts.stablecoin.getAddress(),
    await contracts.treasury.getAddress()
  );
  await contracts.lending.waitForDeployment();
  console.log("   Lending deployed to:", await contracts.lending.getAddress());

  // 8. Deploy AI Engine
  console.log("8. Deploying AI Engine...");
  const AIEngine = await ethers.getContractFactory("AIEngine");
  contracts.aiEngine = await AIEngine.deploy(
    await contracts.neuronToken.getAddress(),
    await contracts.treasury.getAddress(),
    await contracts.staking.getAddress()
  );
  await contracts.aiEngine.waitForDeployment();
  console.log("   AI Engine deployed to:", await contracts.aiEngine.getAddress());

  console.log("\n==========================================");
  console.log("Setting up contract relationships...");
  console.log("==========================================\n");

  // Set up contract relationships
  
  // Authorize minters
  console.log("Authorizing minters...");
  await contracts.neuronToken.authorizeMinter(await contracts.staking.getAddress());
  await contracts.neuronToken.authorizeMinter(await contracts.referral.getAddress());
  await contracts.neuronToken.authorizeMinter(await contracts.aiEngine.getAddress());
  await contracts.stablecoin.authorizeMinter(await contracts.lending.getAddress());

  // Set fee recipients
  console.log("Setting fee recipients...");
  await contracts.neuronToken.setFeeRecipients(
    await contracts.treasury.getAddress(),
    await contracts.treasury.getAddress(), // Liquidity recipient (simplified)
    await contracts.staking.getAddress()   // Rewards recipient
  );

  // Set staking contract in referral
  console.log("Setting staking contract in referral...");
  await contracts.referral.setStakingContract(await contracts.staking.getAddress());

  // Set referral contract in staking
  console.log("Setting referral contract in staking...");
  await contracts.staking.setReferralContract(await contracts.referral.getAddress());

  // Set AI Engine
  console.log("Setting AI Engine in token...");
  await contracts.neuronToken.setAIEngine(await contracts.aiEngine.getAddress());

  // Set treasury in stablecoin
  console.log("Setting treasury in stablecoin...");
  await contracts.stablecoin.setTreasury(await contracts.treasury.getAddress());

  // Authorize AI Engine in treasury
  console.log("Authorizing AI Engine in treasury...");
  await contracts.treasury.authorizeCaller(await contracts.aiEngine.getAddress());

  console.log("\n==========================================");
  console.log("Deployment Summary");
  console.log("==========================================");
  console.log("NeuronToken:  ", await contracts.neuronToken.getAddress());
  console.log("Stablecoin:   ", await contracts.stablecoin.getAddress());
  console.log("Treasury:     ", await contracts.treasury.getAddress());
  console.log("Staking:      ", await contracts.staking.getAddress());
  console.log("Referral:     ", await contracts.referral.getAddress());
  console.log("DAO:          ", await contracts.dao.getAddress());
  console.log("Lending:      ", await contracts.lending.getAddress());
  console.log("AI Engine:    ", await contracts.aiEngine.getAddress());
  console.log("==========================================\n");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    contracts: {
      NeuronToken: await contracts.neuronToken.getAddress(),
      Stablecoin: await contracts.stablecoin.getAddress(),
      Treasury: await contracts.treasury.getAddress(),
      Staking: await contracts.staking.getAddress(),
      Referral: await contracts.referral.getAddress(),
      DAO: await contracts.dao.getAddress(),
      Lending: await contracts.lending.getAddress(),
      AIEngine: await contracts.aiEngine.getAddress(),
    },
    timestamp: new Date().toISOString(),
  };

  console.log("Deployment Info (JSON):");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
