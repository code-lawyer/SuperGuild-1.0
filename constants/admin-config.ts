/**
 * Admin access configuration.
 *
 * Primary gate : Token #3 "The First Flame" NFT (Privilege NFT ERC-1155).
 * Fallback gate: hardcoded wallet address for cases where NFT cannot be verified.
 *
 * Both AdminGuard (page protection) and Header (nav icon) must use this constant
 * so the two gates stay in sync.
 */
export const ADMIN_FALLBACK_WALLET = '0xe358b67c35810312e7afdc9adbe5c14e66baec6';
