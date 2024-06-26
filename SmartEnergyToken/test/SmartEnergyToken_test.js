const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("smartEnergyToken contract", function () {
    let smartEnergyToken;
    let ico;
    let ICO;
    let owner;
    let address1;
    let address2;
    let address3;
    let addresses;
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    let Contract;
    let spender;

    beforeEach(async function () {
        Contract = await ethers.getContractFactory("SmartEnergyToken");
        [owner, address1, address2,address3,spender, ...addresses] = await ethers.getSigners();
        smartEnergyToken = await Contract.deploy();
        await smartEnergyToken.waitForDeployment();

        ICO = await ethers.getContractFactory("ICO");
        ico = await ICO.deploy(smartEnergyToken,100);
        await ico.waitForDeployment();
    });
    it("Should deploy SmartEnergyToken the contract correctly", async function () {
        expect(await smartEnergyToken.name()).to.equal("Smart Energy Token");
        expect(await smartEnergyToken.symbol()).to.equal("SET");
        expect(await smartEnergyToken.totalSupply()).to.equal("500000000000000000000000000000");
      });
      it("Should transfer tokens successfully", async function () {
        const initialBalance = await smartEnergyToken.balanceOf(owner.address);
        const transferAmount = BigInt(100);
        
        await smartEnergyToken.transfer(address1.address, transferAmount);
        await smartEnergyToken.connect(address1).transfer(address2.address, "50");
        
        const finalBalanceOwner = await smartEnergyToken.balanceOf(owner.address);
        const finalBalanceReceiver = await smartEnergyToken.balanceOf(address1.address);
        const finalBalanceReceiver2 = await smartEnergyToken.balanceOf(address2.address);
        
        
        expect(finalBalanceOwner).to.equal(initialBalance - (transferAmount));
        expect(finalBalanceReceiver).to.equal(transferAmount - BigInt(50));
        expect(finalBalanceReceiver2).to.equal("50");
    });

    it("Should emit Transfer and Approval events", async function () {
        const transferTx = await smartEnergyToken.transfer(address1.address, 1000);
        await expect(transferTx).to.emit(smartEnergyToken, "Transfer").withArgs(owner.address, address1.address, 1000);
    
        const approveTx = await smartEnergyToken.approve(address2.address, 1000);
        await expect(approveTx).to.emit(smartEnergyToken, "Approval").withArgs(owner.address, address2.address, 1000);
        
        
      });
      it("Should allow self-transfer without changing balance", async function () {
        const initialBalance = await smartEnergyToken.balanceOf(owner.address);
        
        await smartEnergyToken.transfer(owner.address, 100);
        
        const finalBalance = await smartEnergyToken.balanceOf(owner.address);
        
        expect(finalBalance).to.equal(initialBalance);
    });

    it("burn tokens from owner account", async function () {
 
        // Get the initial balance of address1
        const initialBalance = await smartEnergyToken.balanceOf(owner.address);
    
        // Check if the Transfer event was emitted with the correct arguments
         expect(await smartEnergyToken.connect(owner).burn(BigInt(100)));
        //   .to.emit(smartEnergyToken, "Transfer")
        //   .withArgs(owner.address, zeroAddress, BigInt(50));
    
        // Get the updated balance of address1 after burning
        const updatedBalance = await smartEnergyToken.balanceOf(owner.address);
    
        // Calculate the expected balance after burning
        const expectedBalance = initialBalance - BigInt(50);
    
        // Check if the balance has been updated correctly after burning
        expect(updatedBalance).not.equal(expectedBalance);
    });
    it("revert when burning more tokens than balance", async function () {
          let totalBalanceOfOwner = await smartEnergyToken.balanceOf(owner.address);
          let increasesBalances = totalBalanceOfOwner + BigInt(100);
           // Attempt to burn more tokens than balance
           await expect(smartEnergyToken.connect(owner).burn(increasesBalances))
             .to.be.reverted;
        });

        it("Should burn all tokens from an owner account", async function () {

            const TotalBalance = await smartEnergyToken.balanceOf(owner.address);
        
            // Burn all tokens from the owner's account
             await expect(smartEnergyToken.connect(owner).burn(TotalBalance))
              .to.emit(smartEnergyToken, "Transfer")
              .withArgs(owner.address, zeroAddress, TotalBalance);
        
            const updatedBalance = await smartEnergyToken.balanceOf(owner.address);
    
            // Check owner's balance after burning
            expect(updatedBalance).to.equal(0);
          });
          it("transfer tokens from owner to another account", async function () {
            const ownerBalanceBefore = await smartEnergyToken.balanceOf(owner.address);
            const address2BalanceBefore = await smartEnergyToken.balanceOf(address2.address);
        
            const amount = BigInt(100, 18); // Transfer 100 tokens with 18 decimals
            await smartEnergyToken.connect(owner).transfer(address2.address, amount);
        
            const ownerBalanceAfter = await smartEnergyToken.balanceOf(owner.address);
            const address2BalanceAfter = await smartEnergyToken.balanceOf(address2.address);
        
            expect(ownerBalanceAfter).to.equal(ownerBalanceBefore - (amount));
            expect(address2BalanceAfter).to.equal(address2BalanceBefore + (amount));
        }); 
        it("Should allow transfer zero tokens without any changes in owner balance", async function () {
            const ownerBalanceBefore = await smartEnergyToken.balanceOf(owner.address);
            const address2BalanceBefore = await smartEnergyToken.balanceOf(address2.address);
        
             expect(await smartEnergyToken.connect(owner).transfer(address2.address, 0));
        
            const ownerBalanceAfter = await smartEnergyToken.balanceOf(owner.address);
            const address2BalanceAfter = await smartEnergyToken.balanceOf(address2.address);
        
        
            expect(ownerBalanceAfter).to.equal(ownerBalanceBefore);
            expect(address2BalanceAfter).to.equal(address2BalanceBefore);
        });
        it("Not allow transfer more tokens than balance", async function () {
            const ownerBalanceBefore = await smartEnergyToken.balanceOf(owner.address);
            const address2BalanceBefore = await smartEnergyToken.balanceOf(address2.address);
        
            const amount = ownerBalanceBefore + (BigInt(1,18)); // Transfer amount greater than owner's balance
            await expect(smartEnergyToken.connect(owner).transfer(address2.address, amount)).to.be.reverted;
        
            const ownerBalanceAfter = await smartEnergyToken.balanceOf(owner.address);
            const address2BalanceAfter = await smartEnergyToken.balanceOf(address2.address);
        
            expect(ownerBalanceAfter).to.equal(ownerBalanceBefore);
            expect(address2BalanceAfter).to.equal(address2BalanceBefore);
        });
        
        it("Not allow transfer tokens to zero address", async function () {
            const ownerBalanceBefore = await smartEnergyToken.balanceOf(owner.address);
            const address2BalanceBefore = await smartEnergyToken.balanceOf(zeroAddress);
        
            const amount = BigInt(100, 18); // Transfer 100 tokens with 18 decimals
            await expect(smartEnergyToken.connect(owner).transfer(zeroAddress, amount)).to.be.reverted;
        
            const ownerBalanceAfter = await smartEnergyToken.balanceOf(owner.address);
            const address2BalanceAfter = await smartEnergyToken.balanceOf(zeroAddress);
        
            expect(ownerBalanceAfter).to.equal(ownerBalanceBefore);
            expect(address2BalanceAfter).to.equal(address2BalanceBefore);
        });

        it(" allow approval of tokens", async function () {
            const amount = BigInt(100);
        
            await smartEnergyToken.connect(owner).approve(spender.address, amount);
        
            const updatedAllowance = await smartEnergyToken.allowance(owner.address, spender.address);
            expect(updatedAllowance).to.equal(amount);
        });
        it(" transfer allowed tokens from approved account", async function () {
            const amountToApprove = BigInt(100);
            const amountToTransfer = BigInt(50);
        
            await smartEnergyToken.connect(owner).approve(spender.address, amountToApprove);
            const allowanceBefore = await smartEnergyToken.allowance(owner.address, spender.address);
            const balanceFromBefore = await smartEnergyToken.balanceOf(owner.address);
            const balanceToBefore = await smartEnergyToken.balanceOf(address1.address);
        
            await (smartEnergyToken.connect(spender).transferFrom(owner.address, address1.address, amountToTransfer))
               
        
            const allowanceAfter = await smartEnergyToken.allowance(owner.address, spender.address);
            const balanceFromAfter = await smartEnergyToken.balanceOf(owner.address);
            const balanceToAfter = await smartEnergyToken.balanceOf(address1.address);
        
            expect(allowanceBefore).to.equal(amountToApprove);
            expect(allowanceAfter).to.equal(amountToApprove - amountToTransfer);
            expect(balanceFromAfter).to.equal(balanceFromBefore - amountToTransfer);
            expect(balanceToAfter).to.equal(balanceToBefore + amountToTransfer);
        });
        it(" not allow transfer more tokens than allowed", async function () {
            const amountToApprove = BigInt(100);
            const amountToTransfer = BigInt(150);
        
            await smartEnergyToken.connect(owner).approve(spender.address, amountToApprove);
            const allowanceBefore = await smartEnergyToken.allowance(owner.address, spender.address);
            const balanceFromBefore = await smartEnergyToken.balanceOf(owner.address);
            const balanceToBefore = await smartEnergyToken.balanceOf(address1.address);
        
            await expect(smartEnergyToken.connect(spender).transferFrom(owner.address, address1.address, amountToTransfer))
                .to.be.reverted;
        
            const allowanceAfter = await smartEnergyToken.allowance(owner.address, spender.address);
            const balanceFromAfter = await smartEnergyToken.balanceOf(owner.address);
            const balanceToAfter = await smartEnergyToken.balanceOf(address1.address);
        
            expect(allowanceBefore).to.equal(amountToApprove);
            expect(allowanceAfter).to.equal(allowanceBefore);
            expect(balanceFromAfter).to.equal(balanceFromBefore);
            expect(balanceToAfter).to.equal(balanceToBefore);
        });

    describe("ICOs smart contract",async function(){
        it("check correct owner",async function(){
            const icosOwner =await ico.owner();
            expect(await owner.address).to.equal(icosOwner);
        });
        it("Transfer ownership from owner to another address", async function () {
            await ico.transferOwnership(address1.address);
            expect(await ico.owner()).to.equal(address1.address);
        });
        it("check onlyOwner modifire", async function () {
          expect (await ico.transferOwnership(address1.address)).to.be.reverted;
        });
    it("transfer all Smart Energy Token into ico contract",async function(){
        await smartEnergyToken.connect(owner).transfer(ico,smartEnergyToken.balanceOf(owner.address));
        let totalToken = await ico.availableToken();
        console.log(totalToken);
        expect(await ico.availableToken()).to.equal("500000000000000000000000000000");

    });
    it("buy token using address1",async function(){
        await smartEnergyToken.connect(owner).transfer(ico,smartEnergyToken.balanceOf(owner.address));
        expect(await ico.availableToken()).to.equal("500000000000000000000000000000");
        let numberOfToken = 10;
        let totalCost = 100*numberOfToken;
        await ico.connect(address1).buyTokens(numberOfToken, { value: totalCost });
        expect (await smartEnergyToken.balanceOf(address1.address)).to.equal("10000000000000000000");
        let balanceAfterTransfer = 500000000000000000000000000000n - 10000000000000000000n;
        console.log(await ico.availableToken());
        console.log(await smartEnergyToken.balanceOf(address1.address));
        expect(await ico.availableToken()).to.equal(balanceAfterTransfer);
    });
    it("buy token using address1 and transfer to address2",async function(){
        await smartEnergyToken.connect(owner).transfer(ico,smartEnergyToken.balanceOf(owner.address));
        expect(await ico.availableToken()).to.equal("500000000000000000000000000000");
        let numberOfToken = 10;
        let totalCost = 100*numberOfToken;
        await ico.connect(address1).buyTokens(numberOfToken, { value: totalCost });
        expect (await smartEnergyToken.balanceOf(address1.address)).to.equal("10000000000000000000");
        let balanceAfterTransfer = 500000000000000000000000000000n - 10000000000000000000n;
        console.log(await ico.availableToken());
        console.log(await smartEnergyToken.balanceOf(address1.address));
        expect(await ico.availableToken()).to.equal(balanceAfterTransfer);
        await smartEnergyToken.connect(address1).transfer(address2.address,"2000000000000000000");
        expect(await smartEnergyToken.balanceOf(address2.address)).to.equal("2000000000000000000");
        expect(await smartEnergyToken.balanceOf(address1.address)).to.equal(10000000000000000000n-2000000000000000000n);
    });
    it("Should revert if insufficient ETH sent", async function () {

        const numberOfTokens = 5;
        const totalCost = numberOfTokens * 100;
    
        // Attempt to buy tokens with insufficient ETH
        await expect(ico.connect(address1).buyTokens(numberOfTokens, { value: totalCost - 1 }))
          .to.be.revertedWith("Insufficient ETH sent");
      });
      it("recover tokens", async function () {
        const ownerInitialBalance = await smartEnergyToken.balanceOf(owner.address);
        await smartEnergyToken.connect(owner).transfer(ico,smartEnergyToken.balanceOf(owner.address));
 
        // Call recoverToken function
        await ico.connect(owner).recoverToken();
    
        // Check if tokens are transferred back to the owner
        const ownerFinalBalance = await smartEnergyToken.balanceOf(owner.address);
        expect(await ownerInitialBalance).to.equal(ownerFinalBalance);
      });
      it("should revert try to recover tokens from non-owner address", async function () {
        await smartEnergyToken.connect(owner).transfer(ico,smartEnergyToken.balanceOf(owner.address));
        // Call recoverToken function will reverted
        await expect(ico.connect(address1).recoverToken()).to.reverted;
      });
      it("Should return available tokens", async function () {
        //transfer token to ico contract
        await smartEnergyToken.connect(owner).transfer(ico,smartEnergyToken.balanceOf(owner.address));

        // Call availableToken function
        const availableTokens = await ico.availableToken();
    
        // Check if the returned value matches the balance of tokens held by the ICO contract
        const expectedTokens = await smartEnergyToken.balanceOf(ico);
        expect(availableTokens).to.equal(expectedTokens);
      });
    });
       
        
});