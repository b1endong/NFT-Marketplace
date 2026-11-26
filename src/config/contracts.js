// Địa chỉ contract đã deploy (lấy từ contract/broadcast/*/11155111/run-latest.json).
// Có thể ghi đè bằng biến môi trường trong file .env ở thư mục gốc (xem .env.example).
const env = import.meta.env;

export const CHAIN = {
    id: 11155111,
    hexId: "0xaa36a7",
    name: "Sepolia",
    currency: {name: "Sepolia Ether", symbol: "ETH", decimals: 18},
    rpcUrl: env.VITE_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    explorer: "https://sepolia.etherscan.io",
};

export const ADDRESSES = {
    nft: env.VITE_NFT_ADDRESS || "0x061668d46d4cd5e8b99baf8e18b9cff6c348d95c",
    marketplace:
        env.VITE_MARKETPLACE_ADDRESS ||
        "0x16b64458f52eecd8b4a1d61c747678a9ada21c55",
    auction:
        env.VITE_AUCTION_ADDRESS || "0x178793ec0531188365663063e9e2d27c4f466ad0",
};

const MARKET_ITEM =
    "tuple(uint256 itemId, uint256 tokenId, address nftContract, address seller, address owner, uint256 price, bool isSold, bool isCancel)";

const AUCTION =
    "tuple(uint256 itemId, address owner, uint256 startingBid, uint256 highestBid, address highestBidder, uint256 endTime, bool isActive)";

export const NFT_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function createToken(string tokenURI) returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address to, uint256 tokenId)",
    "function getApproved(uint256 tokenId) view returns (address)",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "error ERC721NonexistentToken(uint256 tokenId)",
    "error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner)",
    "error ERC721InsufficientApproval(address operator, uint256 tokenId)",
    "error ERC721InvalidReceiver(address receiver)",
];

export const MARKETPLACE_ABI = [
    "function listingPrice() view returns (uint256)",
    "function feePercentage() view returns (uint256)",
    "function getOwner() view returns (address)",
    "function getPendingWithdrawals() view returns (uint256)",
    "function getTokenCounter() view returns (uint256)",
    `function getAllNfts() view returns (${MARKET_ITEM}[])`,
    `function getAllActiveNfts() view returns (${MARKET_ITEM}[])`,
    `function getUserNft(address user) view returns (${MARKET_ITEM}[])`,
    "function createMarketItems(address _nftContract, uint256 _tokenId, uint256 _price) payable",
    "function cancelListingMarketItem(uint256 itemId)",
    "function buyMarketItem(uint256 itemId) payable",
    "function withdraw()",
    "function updateListingPrice(uint256 newListingPrice)",
    "function updateFeePercentage(uint256 newFeePercentage)",
    "event MarketItemCreated(uint256 indexed itemId, uint256 indexed tokenId, address indexed nftContract, address seller, address owner, uint256 price, bool isSold, bool isCancel)",
    "event MarketItemSale(uint256 indexed itemId, uint256 indexed tokenId, address indexed nftContract, address seller, address owner, uint256 price, uint256 fee, bool isSold)",
    "error Marketplace__NotOwner()",
    "error Marketplace__ItemNotFound()",
    "error Marketplace__TransferFailed()",
    "error Marketplace__PriceMustBeAboveZero()",
    "error Marketplace__NotOwnerOfNft()",
    "error Marketplace__NotApprovedForMarketplace()",
    "error Marketplace__MustPayListingFee()",
    "error Marketplace__ItemAlreadySold()",
    "error Marketplace__ItemNotListed()",
    "error Marketplace__InvalidSale()",
    "error Marketplace__NotAuctionModule()",
];

export const AUCTION_ABI = [
    "function maxDuration() view returns (uint256)",
    `function getAuction(uint256 itemId) view returns (${AUCTION})`,
    "function getUserRefundableAmount(uint256 itemId, address user) view returns (uint256)",
    "function createAuction(uint256 itemId, uint256 duration)",
    "function placeBid(uint256 itemId) payable",
    "function refundBid(uint256 itemId)",
    "function settleAuction(uint256 itemId)",
    "function cancelAuction(uint256 itemId)",
    "error Auction__NotSeller()",
    "error Auction__HasBids()",
    "error Auction__DurationMustBeGreaterThanZero()",
    "error Auction__AuctionAlreadyActive()",
    "error Auction__AuctionNotActive()",
    "error Auction__BidNotHighEnough()",
    "error Auction__InvalidBidder()",
    "error Auction__AlreadyHighestBidder()",
    "error Auction__RefundFailed()",
    "error Auction__NoBidPlaced()",
    "error Auction__NotHighestBidder()",
    "error Auction__NotEnded()",
    "error Auction__DurationMustBeLessThanMax()",
    "error Auction__TransferFailed()",
    "error Auction__NftTransferFailed()",
    // Lỗi từ marketplace có thể nổi lên qua getActiveMarketItem()
    "error Marketplace__ItemNotFound()",
    "error Marketplace__ItemAlreadySold()",
    "error Marketplace__ItemNotListed()",
];
