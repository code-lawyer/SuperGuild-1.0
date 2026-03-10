import { IS_MAINNET } from './chain-config';

/**
 * DirectPay contract — self-managed collab payment router.
 * Zero-escrow: USDC passes through atomically, contract balance always 0.
 */
export const DIRECT_PAY_ADDRESS: `0x${string}` = IS_MAINNET
    ? '0x0000000000000000000000000000000000000000' // TODO: mainnet address
    : '0xDc0f7BF5c7C026f8000e00a40d0f93a28c04bf65'; // Arbitrum Sepolia

export const DIRECT_PAY_ABI = [
    {
        type: 'function',
        name: 'pay',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'collabId', type: 'bytes32' },
            { name: 'worker',   type: 'address' },
            { name: 'amount',   type: 'uint256' },
        ],
        outputs: [],
    },
    {
        type: 'event',
        name: 'Paid',
        inputs: [
            { name: 'collabId',  type: 'bytes32',  indexed: true },
            { name: 'publisher', type: 'address',  indexed: true },
            { name: 'worker',    type: 'address',  indexed: true },
            { name: 'amount',    type: 'uint256',  indexed: false },
        ],
    },
] as const;

/** ERC-20 ABI subset (approve, allowance, transfer — for USDC operations) */
export const ERC20_APPROVE_ABI = [
    {
        type: 'function',
        name: 'approve',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount',  type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        type: 'function',
        name: 'allowance',
        stateMutability: 'view',
        inputs: [
            { name: 'owner',   type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'transfer',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to',     type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const;
