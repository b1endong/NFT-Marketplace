const FRIENDLY = {
    Marketplace__NotOwner: "Only the marketplace owner can do this.",
    Marketplace__ItemNotFound: "This listing does not exist.",
    Marketplace__TransferFailed: "ETH transfer failed.",
    Marketplace__PriceMustBeAboveZero: "Price must be greater than 0.",
    Marketplace__NotOwnerOfNft: "You are not the owner of this NFT.",
    Marketplace__NotApprovedForMarketplace:
        "The marketplace is not approved to transfer this NFT.",
    Marketplace__MustPayListingFee: "You must pay the exact listing fee.",
    Marketplace__ItemAlreadySold: "This NFT has already been sold.",
    Marketplace__ItemNotListed: "This NFT is not listed.",
    Marketplace__InvalidSale: "You cannot buy your own NFT.",
    Auction__NotSeller: "Only the seller can do this.",
    Auction__HasBids: "The auction already has bids and cannot be cancelled.",
    Auction__DurationMustBeGreaterThanZero: "Duration must be greater than 0.",
    Auction__DurationMustBeLessThanMax: "Duration exceeds the maximum allowed.",
    Auction__AuctionAlreadyActive: "An auction is already running for this NFT.",
    Auction__AuctionNotActive: "This auction is not active.",
    Auction__BidNotHighEnough: "Your bid is not high enough.",
    Auction__InvalidBidder: "The seller cannot bid on their own NFT.",
    Auction__AlreadyHighestBidder: "You are already the highest bidder.",
    Auction__RefundFailed: "Refund failed.",
    Auction__NoBidPlaced: "You have nothing to refund.",
    Auction__NotEnded: "The auction has not ended yet.",
    Auction__TransferFailed: "Payment transfer failed.",
    Auction__NftTransferFailed: "NFT transfer to the winner failed.",
};

// Lấy thông báo dễ đọc từ lỗi ethers / ví.
export function parseError(err) {
    if (!err) return "Unknown error";
    if (err.code === "ACTION_REJECTED" || err?.info?.error?.code === 4001) {
        return "Transaction rejected in wallet.";
    }
    const name = err.revert?.name;
    if (name) return FRIENDLY[name] || name;
    if (err.reason) return err.reason;
    if (err.code === "INSUFFICIENT_FUNDS") return "Insufficient funds for gas.";
    return err.shortMessage || err.message || String(err);
}
