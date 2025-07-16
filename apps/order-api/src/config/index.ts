import { BlockchainName, TokenName } from "universal-sdk";

// Define the allowed token names from the SDK
export const ALLOWED_TOKENS: TokenName[] = [
    'ADA', 'ALGO', 'BCH', 'BTC', 'DOGE', 'DOT', 'LTC', 'NEAR', 'SOL', 'XRP', 
    'ETH', 'AVAX', 'SHIB', 'LINK', 'MATIC', 'UNI', 'APT', 'STX', 'MKR', 'RNDR', 
    'SUI', 'SEI', 'PEPE', 'TRUMP', 'XLM', 'HBAR', 'ICP', 'AAVE', 'ETC', 'FET', 
    'ATOM', 'INJ', 'IMX', 'GRT', 'JASMY', 'LDO', 'QNT', 'SAND', 'XTZ', 'EOS', 
    'HNT', 'AXS', 'MANA', 'EGLD', 'APE', 'ZEC', 'CHZ', 'MINA', 'ROSE', 'LPT', 
    'KSM', 'BLUR', 'ZK', 'VET', 'SNX', 'GMT', 'STRK', 'PNUT', 'OP', 'ONDO', 
    'MOVE', 'JTO', 'FLOW', 'FLOKI', 'FLR', 'FIL', 'ENS', 'WIF', 'CRV', 'CRO', 
    'TIA', 'BONK', 'ARB', '1INCH'
  ];
  
  // Define the allowed blockchain names from the SDK
export const ALLOWED_BLOCKCHAINS: BlockchainName[] = ['ARBITRUM', 'BASE', 'POLYGON', 'WORLD'];
  
export const addressRegex = /^0x[a-fA-F0-9]{40}$/;