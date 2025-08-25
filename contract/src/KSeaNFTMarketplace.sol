// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract KSeaNFTMarketplace is ReentrancyGuard, IERC721Receiver {
    /*//////////////////////////////////////////////////////////////
                                 ERROR
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                            TYPE DECLARATION
    //////////////////////////////////////////////////////////////*/

    struct marketItem {
        uint256 itemId;
        uint256 tokenId;
        address nftContract;
        address payable seller;
        address payable owner;
        uint256 price;
        bool isSold;
        bool isCancel;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    address public immutable _owner;
    uint256 public listingPrice;
    uint256 public feePercentage;
    uint256 private _tokenCounter;
    uint256 private _itemSold;
    uint256 private _pendingWithdrawals;

    mapping(uint256 => marketItem) private _idToMarketItem;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event MarketItemCreated(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address indexed nftContract,
        address payable seller,
        address payable owner,
        uint256 price,
        bool isSold,
        bool isCancel
    );

    event CancelListingMarketItem(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address indexed nftContract,
        address payable seller,
        address payable owner,
        bool isCancel
    );

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        require(msg.sender == _owner, "Only Owner can call this function");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(uint256 _listingPrice, uint256 _feePercentage) {
        _owner = payable(msg.sender);
        listingPrice = _listingPrice;
        feePercentage = _feePercentage;
    }

    /*//////////////////////////////////////////////////////////////
                                 ADMIN
    //////////////////////////////////////////////////////////////*/

    function updateListingPrice(uint256 newListingPrice) public onlyOwner {
        listingPrice = newListingPrice;
    }

    function updateFeePercentage(uint256 newFeePercentage) public onlyOwner {
        feePercentage = newFeePercentage;
    }

    /*//////////////////////////////////////////////////////////////
                            ACTION FUNCTION
    //////////////////////////////////////////////////////////////*/

    function createMarketItems(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price
    ) external payable nonReentrant {
        // Validate inputs
        require(_price > 0, "Price must be greater than 0");
        IERC721 nft = IERC721(_nftContract);

        // Validate ownership
        require(
            nft.ownerOf(_tokenId) == msg.sender,
            "Only the owner can create market items"
        );

        // Validate approval
        require(
            nft.getApproved(_tokenId) == address(this) ||
                nft.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        require(msg.value == listingPrice, "Must pay listing fee");

        _pendingWithdrawals += msg.value;

        // Transfer NFT to marketplace
        _tokenCounter++;
        _idToMarketItem[_tokenCounter] = marketItem({
            itemId: _tokenCounter,
            tokenId: _tokenId,
            nftContract: _nftContract,
            seller: payable(msg.sender),
            owner: payable(address(this)),
            price: _price,
            isSold: false,
            isCancel: false
        });

        nft.safeTransferFrom(msg.sender, address(this), _tokenId);

        emit MarketItemCreated(
            _tokenCounter,
            _tokenId,
            _nftContract,
            payable(msg.sender),
            payable(address(this)),
            _price,
            false,
            false
        );
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function cancelListingMarketItem(uint256 itemId) public nonReentrant {
        marketItem storage item = _idToMarketItem[itemId];
        //Check error
        require(item.seller == msg.sender, "Not the owner");
        require(!item.isSold, "Item already sold");
        require(item.owner == address(this), "Item not listed");
        IERC721 nft = IERC721(item.nftContract);

        //Cancel listing
        nft.safeTransferFrom(address(this), item.seller, item.tokenId);
        item.owner = payable(item.seller);
        item.seller = payable(address(0));
        item.isCancel = true;

        emit CancelListingMarketItem(
            itemId,
            item.tokenId,
            item.nftContract,
            item.seller,
            item.owner,
            item.isCancel
        );
    }

    /*//////////////////////////////////////////////////////////////
                            GETTER FUNCTION
    //////////////////////////////////////////////////////////////*/

    function getAllNfts() public view returns (marketItem[] memory) {
        marketItem[] memory items = new marketItem[](_tokenCounter);
        for (uint256 i = 1; i <= _tokenCounter; i++) {
            items[i - 1] = _idToMarketItem[i];
        }
        return items;
    }

    function getMyNfts() public view returns (marketItem[] memory) {
        uint256 totalItemCount = _tokenCounter;
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (
                _idToMarketItem[i].owner == msg.sender ||
                _idToMarketItem[i].seller == msg.sender
            ) {
                itemCount += 1;
            }
        }

        marketItem[] memory items = new marketItem[](itemCount);
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (
                _idToMarketItem[i].owner == msg.sender ||
                _idToMarketItem[i].seller == msg.sender
            ) {
                items[currentIndex] = _idToMarketItem[i];
                currentIndex += 1;
            }
        }
        return items;
    }

    function getUserNft(
        address user
    ) public view returns (marketItem[] memory) {
        uint256 totalItemCount = _tokenCounter;
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (
                _idToMarketItem[i].owner == user ||
                _idToMarketItem[i].seller == user
            ) {
                itemCount += 1;
            }
        }

        marketItem[] memory items = new marketItem[](itemCount);
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (
                _idToMarketItem[i].owner == user ||
                _idToMarketItem[i].seller == user
            ) {
                items[currentIndex] = _idToMarketItem[i];
                currentIndex += 1;
            }
        }
        return items;
    }

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function getFeePercentage() public view returns (uint256) {
        return feePercentage;
    }

    function getOwner() public view returns (address) {
        return _owner;
    }

    function getPendingWithdrawals() public view returns (uint256) {
        return _pendingWithdrawals;
    }

    function getTokenCounter() public view returns (uint256) {
        return _tokenCounter;
    }
}
