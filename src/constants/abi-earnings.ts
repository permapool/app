export const earningsAddress = '0xd02A9521f40D2C36524F53A6f3972de5eB24578D';
export const earningsAbi = [
  {
    "inputs": [
      {
        "internalType": "contract IUniswapV3Pool",
        "name": "pool",
        "type": "address"
      },
      {
        "internalType": "int24",
        "name": "tickLower",
        "type": "int24"
      },
      {
        "internalType": "int24",
        "name": "tickUpper",
        "type": "int24"
      }
    ],
    "name": "getPending",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getUnclaimedFees",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];