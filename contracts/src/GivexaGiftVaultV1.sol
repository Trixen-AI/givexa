// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IGivexaAssetRegistryV1} from "./interfaces/IGivexaAssetRegistryV1.sol";
import {IGivexaFeeControllerV1} from "./interfaces/IGivexaFeeControllerV1.sol";

/// @title GivexaGiftVaultV1
/// @notice Non-upgradeable bearer gift vault for approved Robinhood Chain Stock Tokens.
/// @dev Creation can be paused, while claims, cancellation, and recovery remain available.
contract GivexaGiftVaultV1 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum StoredStatus {
        None,
        Active,
        Claimed,
        Cancelled,
        Recovered
    }

    enum DisplayStatus {
        Nonexistent,
        Scheduled,
        Active,
        Expired,
        Claimed,
        Cancelled,
        Returned
    }

    struct Gift {
        address sender;
        address asset;
        uint128 principal;
        uint40 createdAt;
        uint40 unlockAt;
        uint40 expiresAt;
        StoredStatus status;
        bytes32 secretHash;
        bytes32 claimCodeHash;
    }

    struct CreateGiftParams {
        address asset;
        uint128 principal;
        bytes32 secretHash;
        bytes32 claimCodeHash;
        uint40 unlockAt;
        uint32 expiryDuration;
    }

    error ZeroAddress();
    error CreationPaused();
    error NotGuardian();
    error UnsupportedAsset(address asset);
    error ZeroPrincipal();
    error EmptySecretHash();
    error ScheduleTooSoon(uint256 earliestAllowed);
    error ScheduleTooFar(uint256 latestAllowed);
    error ExpiryOutOfRange(uint256 minimum, uint256 maximum);
    error GiftNotFound(uint256 giftId);
    error GiftNotActive(uint256 giftId);
    error GiftLocked(uint256 unlockAt);
    error GiftExpired(uint256 expiresAt);
    error GiftNotExpired(uint256 expiresAt);
    error NotGiftSender();
    error InvalidSecret();
    error InvalidClaimCode();
    error UnexpectedTransferAmount(uint256 expected, uint256 actual);
    error InsolventAsset(address asset, uint256 balance, uint256 liability);
    error InsufficientExcess(uint256 requested, uint256 available);

    uint256 public constant MIN_SCHEDULE_DELAY = 10 minutes;
    uint256 public constant MAX_SCHEDULE_DELAY = 365 days;
    uint256 public constant MIN_EXPIRY_DURATION = 7 days;
    uint256 public constant MAX_EXPIRY_DURATION = 365 days;
    bytes32 public constant SECRET_DOMAIN = keccak256("GIVEXA_BEARER_SECRET_V1");
    bytes32 public constant CLAIM_CODE_DOMAIN = keccak256("GIVEXA_CLAIM_CODE_V1");

    IGivexaAssetRegistryV1 public immutable assetRegistry;
    IGivexaFeeControllerV1 public immutable feeController;
    address public guardian;
    bool public creationPaused;
    uint256 public nextGiftId = 1;

    mapping(uint256 giftId => Gift giftData) private _gifts;
    mapping(address asset => uint256 amount) public totalEscrowed;

    event GiftCreated(
        uint256 indexed giftId,
        address indexed sender,
        address indexed asset,
        uint256 principal,
        uint256 fee,
        uint40 unlockAt,
        uint40 expiresAt,
        bytes32 secretHash,
        bool claimCodeRequired
    );
    event GiftClaimed(uint256 indexed giftId, address indexed recipient, uint256 principal);
    event GiftCancelled(uint256 indexed giftId, address indexed sender, uint256 principal);
    event GiftRecovered(uint256 indexed giftId, address indexed caller, address indexed sender, uint256 principal);
    event CreationPauseChanged(bool paused, address indexed caller);
    event GuardianChanged(address indexed oldGuardian, address indexed newGuardian);
    event ExcessSwept(address indexed asset, address indexed recipient, uint256 amount);

    constructor(
        address initialOwner,
        address initialGuardian,
        IGivexaAssetRegistryV1 registry,
        IGivexaFeeControllerV1 fees
    ) Ownable(initialOwner) {
        if (
            initialOwner == address(0) || initialGuardian == address(0) || address(registry) == address(0)
                || address(fees) == address(0)
        ) revert ZeroAddress();
        assetRegistry = registry;
        feeController = fees;
        guardian = initialGuardian;
        emit GuardianChanged(address(0), initialGuardian);
    }

    function createGift(CreateGiftParams calldata params) external nonReentrant returns (uint256 giftId) {
        if (creationPaused) revert CreationPaused();
        if (!assetRegistry.isSupported(params.asset)) revert UnsupportedAsset(params.asset);
        if (params.principal == 0) revert ZeroPrincipal();
        if (params.secretHash == bytes32(0)) revert EmptySecretHash();
        if (params.expiryDuration < MIN_EXPIRY_DURATION || params.expiryDuration > MAX_EXPIRY_DURATION) {
            revert ExpiryOutOfRange(MIN_EXPIRY_DURATION, MAX_EXPIRY_DURATION);
        }

        uint40 nowTimestamp = uint40(block.timestamp);
        uint40 unlockAt = params.unlockAt;
        if (unlockAt == 0) {
            unlockAt = nowTimestamp;
        } else {
            uint256 earliest = block.timestamp + MIN_SCHEDULE_DELAY;
            uint256 latest = block.timestamp + MAX_SCHEDULE_DELAY;
            if (unlockAt < earliest) revert ScheduleTooSoon(earliest);
            if (unlockAt > latest) revert ScheduleTooFar(latest);
        }
        uint40 expiresAt = unlockAt + params.expiryDuration;

        uint256 fee = feeController.quoteFee(params.principal);
        address treasury = feeController.treasury();
        if (treasury == address(0)) revert ZeroAddress();

        IERC20 token = IERC20(params.asset);
        _pullExact(token, msg.sender, address(this), params.principal);
        if (fee != 0) _pullExact(token, msg.sender, treasury, fee);

        giftId = nextGiftId++;
        _gifts[giftId] = Gift({
            sender: msg.sender,
            asset: params.asset,
            principal: params.principal,
            createdAt: nowTimestamp,
            unlockAt: unlockAt,
            expiresAt: expiresAt,
            status: StoredStatus.Active,
            secretHash: params.secretHash,
            claimCodeHash: params.claimCodeHash
        });
        totalEscrowed[params.asset] += params.principal;

        emit GiftCreated(
            giftId,
            msg.sender,
            params.asset,
            params.principal,
            fee,
            unlockAt,
            expiresAt,
            params.secretHash,
            params.claimCodeHash != bytes32(0)
        );
    }

    function claim(uint256 giftId, bytes32 secret, bytes calldata claimCode) external nonReentrant {
        Gift storage giftData = _activeGift(giftId);
        if (block.timestamp < giftData.unlockAt) revert GiftLocked(giftData.unlockAt);
        if (block.timestamp >= giftData.expiresAt) revert GiftExpired(giftData.expiresAt);
        if (hashSecret(secret) != giftData.secretHash) revert InvalidSecret();
        if (giftData.claimCodeHash != bytes32(0) && hashClaimCode(secret, claimCode) != giftData.claimCodeHash) {
            revert InvalidClaimCode();
        }

        uint256 principal = giftData.principal;
        address asset = giftData.asset;
        giftData.status = StoredStatus.Claimed;
        totalEscrowed[asset] -= principal;
        _pushExact(IERC20(asset), msg.sender, principal);
        emit GiftClaimed(giftId, msg.sender, principal);
    }

    function cancel(uint256 giftId) external nonReentrant {
        Gift storage giftData = _activeGift(giftId);
        if (msg.sender != giftData.sender) revert NotGiftSender();
        uint256 principal = giftData.principal;
        address asset = giftData.asset;
        giftData.status = StoredStatus.Cancelled;
        totalEscrowed[asset] -= principal;
        _pushExact(IERC20(asset), msg.sender, principal);
        emit GiftCancelled(giftId, msg.sender, principal);
    }

    function recoverExpired(uint256 giftId) external nonReentrant {
        Gift storage giftData = _activeGift(giftId);
        if (block.timestamp < giftData.expiresAt) revert GiftNotExpired(giftData.expiresAt);
        uint256 principal = giftData.principal;
        address asset = giftData.asset;
        address sender = giftData.sender;
        giftData.status = StoredStatus.Recovered;
        totalEscrowed[asset] -= principal;
        _pushExact(IERC20(asset), sender, principal);
        emit GiftRecovered(giftId, msg.sender, sender, principal);
    }

    function pauseCreation() external {
        if (msg.sender != guardian && msg.sender != owner()) revert NotGuardian();
        if (creationPaused) return;
        creationPaused = true;
        emit CreationPauseChanged(true, msg.sender);
    }

    function unpauseCreation() external onlyOwner {
        if (!creationPaused) return;
        creationPaused = false;
        emit CreationPauseChanged(false, msg.sender);
    }

    function setGuardian(address newGuardian) external onlyOwner {
        if (newGuardian == address(0)) revert ZeroAddress();
        address oldGuardian = guardian;
        guardian = newGuardian;
        emit GuardianChanged(oldGuardian, newGuardian);
    }

    /// @notice Recovers only tokens above recorded gift liabilities.
    function sweepExcess(address asset, address recipient, uint256 amount) external onlyOwner nonReentrant {
        if (recipient == address(0)) revert ZeroAddress();
        IERC20 token = IERC20(asset);
        uint256 balance = token.balanceOf(address(this));
        uint256 liability = totalEscrowed[asset];
        if (balance < liability) revert InsolventAsset(asset, balance, liability);
        uint256 available = balance - liability;
        if (amount > available) revert InsufficientExcess(amount, available);
        _pushExact(token, recipient, amount);
        emit ExcessSwept(asset, recipient, amount);
    }

    function gift(uint256 giftId) external view returns (Gift memory) {
        Gift memory value = _gifts[giftId];
        if (value.status == StoredStatus.None) revert GiftNotFound(giftId);
        return value;
    }

    function displayStatus(uint256 giftId) public view returns (DisplayStatus) {
        Gift storage value = _gifts[giftId];
        if (value.status == StoredStatus.None) return DisplayStatus.Nonexistent;
        if (value.status == StoredStatus.Claimed) return DisplayStatus.Claimed;
        if (value.status == StoredStatus.Cancelled) return DisplayStatus.Cancelled;
        if (value.status == StoredStatus.Recovered) return DisplayStatus.Returned;
        if (block.timestamp < value.unlockAt) return DisplayStatus.Scheduled;
        if (block.timestamp >= value.expiresAt) return DisplayStatus.Expired;
        return DisplayStatus.Active;
    }

    function hashSecret(bytes32 secret) public view returns (bytes32) {
        return keccak256(abi.encode(SECRET_DOMAIN, block.chainid, address(this), secret));
    }

    function hashClaimCode(bytes32 secret, bytes calldata claimCode) public view returns (bytes32) {
        return keccak256(abi.encode(CLAIM_CODE_DOMAIN, block.chainid, address(this), secret, claimCode));
    }

    function _activeGift(uint256 giftId) internal view returns (Gift storage value) {
        value = _gifts[giftId];
        if (value.status == StoredStatus.None) revert GiftNotFound(giftId);
        if (value.status != StoredStatus.Active) revert GiftNotActive(giftId);
    }

    function _pullExact(IERC20 token, address from, address recipient, uint256 amount) internal {
        uint256 beforeBalance = token.balanceOf(recipient);
        token.safeTransferFrom(from, recipient, amount);
        uint256 received = token.balanceOf(recipient) - beforeBalance;
        if (received != amount) revert UnexpectedTransferAmount(amount, received);
    }

    function _pushExact(IERC20 token, address recipient, uint256 amount) internal {
        uint256 beforeBalance = token.balanceOf(recipient);
        token.safeTransfer(recipient, amount);
        uint256 received = token.balanceOf(recipient) - beforeBalance;
        if (received != amount) revert UnexpectedTransferAmount(amount, received);
    }
}
