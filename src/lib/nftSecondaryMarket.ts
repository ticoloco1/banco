import { createClient } from '@supabase/supabase-js';
import { createWalletClient, getAddress, http, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygon } from 'viem/chains';

const ERC721_TRANSFER_ABI = [
  {
    name: 'safeTransferFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

export function getDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function operatorPrivateKey() {
  const raw = (process.env.POLYGON_NFT_MARKET_OPERATOR_PRIVATE_KEY || '').trim();
  if (!raw) throw new Error('POLYGON_NFT_MARKET_OPERATOR_PRIVATE_KEY missing');
  return (raw.startsWith('0x') ? raw : `0x${raw}`) as `0x${string}`;
}

export function canRunOnchainTransfer() {
  return Boolean((process.env.POLYGON_NFT_MARKET_OPERATOR_PRIVATE_KEY || '').trim());
}

export async function transferNftOwnershipOnPolygon(params: {
  contractAddress: string;
  fromWallet: string;
  toWallet: string;
  tokenId: string;
}): Promise<{ txHash: string }> {
  if (!isAddress(params.contractAddress) || !isAddress(params.fromWallet) || !isAddress(params.toWallet)) {
    throw new Error('Invalid contract/from/to wallet');
  }
  const tokenId = BigInt(String(params.tokenId));
  const account = privateKeyToAccount(operatorPrivateKey());
  const wallet = createWalletClient({
    account,
    chain: polygon,
    transport: http(process.env.POLYGON_RPC_URL?.trim() || undefined),
  });
  const txHash = await wallet.writeContract({
    address: getAddress(params.contractAddress),
    abi: ERC721_TRANSFER_ABI,
    functionName: 'safeTransferFrom',
    args: [getAddress(params.fromWallet), getAddress(params.toWallet), tokenId],
  });
  return { txHash };
}
