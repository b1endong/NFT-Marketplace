// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract KSeaNFTMarketplace is ReentrancyGuard, IERC721Receiver {
    /*//////////////////////////////////////////////////////////////
                                 ERROR
    //////////////////////////////////////////////////////////////*/

    error Marketplace__NotOwner();
    error Marketplace__ItemNotFound();
    error Marketplace__TransferFailed();
    error Marketplace__PriceMustBeAboveZero();
    error Marketplace__NotOwnerOfNft();
    error Marketplace__NotApprovedForMarketplace();
    error Marketplace__MustPayListingFee();
    error Marketplace__ItemAlreadySold();
    error Marketplace__ItemNotListed();
    error Marketplace__InvalidSale();

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

    event MarketItemSale(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address indexed nftContract,
        address payable seller,
        address payable owner,
        uint256 price,
        uint256 fee,
        bool isSold
    );

    event Withdrawals(address indexed to, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        if (msg.sender != _owner) {
            revert Marketplace__NotOwner();
        }
        _;
    }

    modifier itemExists(uint256 itemId) {
        if (itemId <= 0 || itemId > _tokenCounter) {
            revert Marketplace__ItemNotFound();
        }
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

    function withdraw() public onlyOwner nonReentrant {
        uint256 amount = _pendingWithdrawals;
        _pendingWithdrawals = 0;
        (bool success, ) = _owner.call{value: amount}("");
        if (!success) {
            revert Marketplace__TransferFailed();
        }
        emit Withdrawals(_owner, amount);
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTION
    //////////////////////////////////////////////////////////////*/

    function createMarketItems(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price
    ) public payable nonReentrant {
        // Validate inputs
        if (_price <= 0) {
            revert Marketplace__PriceMustBeAboveZero();
        }
        IERC721 nft = IERC721(_nftContract);

        // Validate ownership
        if (nft.ownerOf(_tokenId) != msg.sender) {
            revert Marketplace__NotOwnerOfNft();
        }

        // Validate approval
        if (
            nft.getApproved(_tokenId) != address(this) &&
            !nft.isApprovedForAll(msg.sender, address(this))
        ) {
            revert Marketplace__NotApprovedForMarketplace();
        }

        if (msg.value != listingPrice) {
            revert Marketplace__MustPayListingFee();
        }

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

    function cancelListingMarketItem(
        uint256 itemId
    ) public nonReentrant itemExists(itemId) {
        marketItem storage item = _idToMarketItem[itemId];
        //Check error
        if (item.seller != msg.sender) {
            revert Marketplace__NotOwnerOfNft();
        }
        if (item.isSold) {
            revert Marketplace__ItemAlreadySold();
        }
        if (item.owner != address(this)) {
            revert Marketplace__ItemNotListed();
        }
        IERC721 nft = IERC721(item.nftContract);

        //Cancel listing
        nft.safeTransferFrom(address(this), item.seller, item.tokenId);
        item.owner = payable(item.seller);
        item.isCancel = true;

        emit CancelListingMarketItem(
            itemId,
            item.tokenId,
            item.nftContract,
            item.seller,
            item.owner,
            item.isCancel
        );
        item.seller = payable(address(0));
    }

    function buyMarketItem(
        uint256 itemId
    ) public payable nonReentrant itemExists(itemId) {
        marketItem storage item = _idToMarketItem[itemId];
        //Check error
        if (item.seller == msg.sender) {
            revert Marketplace__InvalidSale();
        }

        if (item.isSold) {
            revert Marketplace__ItemAlreadySold();
        }

        if (item.isCancel || item.owner != address(this)) {
            revert Marketplace__ItemNotListed();
        }

        //Calculate fee
        require(msg.value == item.price, "Please submit the asking price");
        uint256 fee = (msg.value * feePercentage) / 100;
        uint256 sellerProceeds = msg.value - fee;
        _pendingWithdrawals += fee;

        //Pay the seller
        (bool success, ) = item.seller.call{value: sellerProceeds}("");
        require(success, "Transfer to seller failed");

        //Update item
        item.owner = payable(msg.sender);
        item.seller = payable(address(0));
        item.isSold = true;
        _itemSold++;

        //Transfer NFT to buyer
        IERC721 nft = IERC721(item.nftContract);
        nft.safeTransferFrom(address(this), msg.sender, item.tokenId);

        emit MarketItemSale(
            itemId,
            item.tokenId,
            item.nftContract,
            item.seller,
            item.owner,
            item.price,
            fee,
            item.isSold
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

    function getAllActiveNfts() public view returns (marketItem[] memory) {
        uint256 totalItemCount = _tokenCounter;
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (
                _idToMarketItem[i].owner == address(this) &&
                !_idToMarketItem[i].isSold &&
                !_idToMarketItem[i].isCancel
            ) {
                itemCount += 1;
            }
        }

        marketItem[] memory items = new marketItem[](itemCount);
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (
                _idToMarketItem[i].owner == address(this) &&
                !_idToMarketItem[i].isSold &&
                !_idToMarketItem[i].isCancel
            ) {
                items[currentIndex] = _idToMarketItem[i];
                currentIndex += 1;
            }
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
