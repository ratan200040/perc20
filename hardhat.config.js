require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
    networks: {
        swisstronik: {
              url: "https://json-rpc.testnet.swisstronik.com/",
                    accounts: [`0x${process.env.PRIVATE_KEY}`],
                        },
                          },
                          };
                          EOL
                          echo "Hardhat configuration completed."

                          read -p "Enter the NFT name: " NFT_NAME
                          read -p "Enter the NFT symbol: " NFT_SYMBOL

                          echo "Creating PrivateNFT.sol contract..."
                          mkdir -p contracts
                          cat <<EOL > contracts/PrivateNFT.sol
                          // SPDX-License-Identifier: MIT
                          // Compatible with OpenZeppelin Contracts ^5.0.0
                          pragma solidity ^0.8.20;

                          import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
                          import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
                          import "@openzeppelin/contracts/access/Ownable.sol";

                          contract PrivateNFT is ERC721, ERC721Burnable, Ownable {
                              constructor(address initialOwner)
                                      ERC721("","")
                                              Ownable(initialOwner)
                                                  {}

                                                      function safeMint(address to, uint256 tokenId) public onlyOwner {
                                                              _safeMint(to, tokenId);
                                                                  }

                                                                      function balanceOf(address owner) public view override returns (uint256) {
                                                                              require(msg.sender == owner, "PrivateNFT: msg.sender != owner");
                                                                                      return super.balanceOf(owner);
                                                                                          }

                                                                                              function ownerOf(uint256 tokenId) public view override returns (address) {
                                                                                                      address owner = super.ownerOf(tokenId);
                                                                                                              require(msg.sender == owner, "PrivateNFT: msg.sender != owner");
                                                                                                                      return owner;
                                                                                                                          }

                                                                                                                              function tokenURI(uint256 tokenId) public view override returns (string memory) {
                                                                                                                                      address owner = super.ownerOf(tokenId);
                                                                                                                                              require(msg.sender == owner, "PrivateNFT: msg.sender != owner");
                                                                                                                                                      return super.tokenURI(tokenId);
                                                                                                                                                          }
                                                                                                                                                          }
                                                                                                                                                          EOL
                                                                                                                                                          echo "PrivateNFT.sol contract created."

                                                                                                                                                          echo "Compiling the contract..."
                                                                                                                                                          npx hardhat compile
                                                                                                                                                          echo "Contract compiled."

                                                                                                                                                          echo "Creating deploy.js script..."
                                                                                                                                                          mkdir -p scripts
                                                                                                                                                          cat <<EOL > scripts/deploy.js
                                                                                                                                                          const hre = require("hardhat");
                                                                                                                                                          const fs = require("fs");

                                                                                                                                                          async function main() {
                                                                                                                                                            const [deployer] = await hre.ethers.getSigners();
                                                                                                                                                              const contractFactory = await hre.ethers.getContractFactory("PrivateNFT");
                                                                                                                                                                const contract = await contractFactory.deploy(deployer.address);
                                                                                                                                                                  await contract.waitForDeployment();
                                                                                                                                                                    const deployedContract = await contract.getAddress();
                                                                                                                                                                      fs.writeFileSync("contract.txt", deployedContract);
                                                                                                                                                                        console.log(`Contract deployed to ${deployedContract}`);
                                                                                                                                                                        }

                                                                                                                                                                        main().catch((error) => {
                                                                                                                                                                          console.error(error);
                                                                                                                                                                            process.exitCode = 1;
                                                                                                                                                                            });
                                                                                                                                                                            EOL
                                                                                                                                                                            echo "deploy.js script created."

                                                                                                                                                                            echo "Deploying the contract..."
                                                                                                                                                                            npx hardhat run scripts/deploy.js --network swisstronik
                                                                                                                                                                            echo "Contract deployed."

                                                                                                                                                                            echo "Creating mint.js script..."
                                                                                                                                                                            cat <<EOL > scripts/mint.js
                                                                                                                                                                            const hre = require("hardhat");
                                                                                                                                                                            const fs = require("fs");
                                                                                                                                                                            const { encryptDataField, decryptNodeResponse } = require("@swisstronik/utils");

                                                                                                                                                                            const sendShieldedTransaction = async (signer, destination, data, value) => {
                                                                                                                                                                              const rpcLink = hre.network.config.url;
                                                                                                                                                                                const [encryptedData] = await encryptDataField(rpcLink, data);
                                                                                                                                                                                  return await signer.sendTransaction({
                                                                                                                                                                                      from: signer.address,
                                                                                                                                                                                          to: destination,
                                                                                                                                                                                              data: encryptedData,
                                                                                                                                                                                                  value,
                                                                                                                                                                                                    });
                                                                                                                                                                                                    };

                                                                                                                                                                                                    async function main() {
                                                                                                                                                                                                      const contractAddress = fs.readFileSync("contract.txt", "utf8").trim();
                                                                                                                                                                                                        const [signer] = await hre.ethers.getSigners();
                                                                                                                                                                                                          const contractFactory = await hre.ethers.getContractFactory("PrivateNFT");
                                                                                                                                                                                                            const contract = contractFactory.attach(contractAddress);
                                                                                                                                                                                                              const functionName = "safeMint";
                                                                                                                                                                                                                const safeMintTx = await sendShieldedTransaction(
                                                                                                                                                                                                                    signer,
                                                                                                                                                                                                                        contractAddress,
                                                                                                                                                                                                                            contract.interface.encodeFunctionData(functionName, [signer.address, 1]),
                                                                                                                                                                                                                                0
                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                    await safeMintTx.wait();
                                                                                                                                                                                                                                      console.log("Transaction Receipt: ", `Minting NFT has been success! Transaction hash: https://explorer-evm.testnet.swisstronik.com/tx/${safeMintTx.hash}`);
                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                      main().catch((error) => {
                                                                                                                                                                                                                                        console.error(error);
                                                                                                                                                                                                                                          process.exitCode = 1;
                                                                                                                                                                                                                                          });
                                                                                                                                                                                                                                          EOL
                                                                                                                                                                                                                                          echo "mint.js script created."

                                                                                                                                                                                                                                          echo "Minting NFT..."
                                                                                                                                                                                                                                          npx hardhat run scripts/mint.js --network swisstronik
                                                                                                                                                                                                                                          echo "NFT minted."

                                                                                                                                                                                                                                          echo "Done! Subscribe: https://t.me/GaCryptOfficial"