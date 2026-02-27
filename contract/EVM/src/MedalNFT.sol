// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IVCPToken.sol";

/**
 * @title MedalNFT (ERC-7496 Dynamic Traits Edition)
 * @dev 2026 "Sovereign Edition" Achievement Medals.
 * Integrated with ERC-7496 to provide dynamic on-chain traits for 3D rendering.
 */
contract MedalNFT is ERC721, Ownable {
    IVCPToken public vcpToken;
    
    // CID of the 3D models stored on Arweave
    string public baseArweaveURI;
    
    // ERC-7496 Trait Keys
    bytes32 public constant TRAIT_GLOW = "glow_intensity";
    bytes32 public constant TRAIT_RANK = "reputation_rank";

    event TraitUpdated(bytes32 indexed traitKey, uint256 tokenId, bytes32 traitValue);

    constructor(address _vcpToken, string memory _baseURI) 
        ERC721("Super Guild Medal", "SGM") 
        Ownable(msg.sender) 
    {
        vcpToken = IVCPToken(_vcpToken);
        baseArweaveURI = _baseURI;
    }

    /**
     * @dev Simple minting for demonstration/milestone.
     * In production, this would be tied to specific VCP milestones.
     */
    function mint(address to, uint256 tokenId) external onlyOwner {
        _safeMint(to, tokenId);
    }

    /**
     * @dev Set the base Arweave gateway URL
     */
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseArweaveURI = _newBaseURI;
    }

    /**
     * @dev ERC-7496 Implementation: Get dynamic trait values.
     * Traits are derived from the account's VCP balance (Reputation).
     * VCP uses decimals=0, so thresholds are plain integers.
     */
    function getTraitValue(uint256 tokenId, bytes32 traitKey) public view returns (bytes32) {
        address owner = ownerOf(tokenId);
        uint256 vcpBalance = vcpToken.balanceOf(owner);
        uint256 threshold = 1000;

        if (traitKey == TRAIT_GLOW) {
            // Glow intensity increases with VCP balance (max 255)
            uint256 glow = vcpBalance > threshold ? 255 : (vcpBalance * 255) / threshold;
            return bytes32(glow);
        } else if (traitKey == TRAIT_RANK) {
            // Rank categories: 0=Novice, 1=Geek, 2=Master
            uint256 rank = vcpBalance < 100 ? 0 : (vcpBalance < 500 ? 1 : 2);
            return bytes32(rank);
        }

        
        return bytes32(0);
    }

    /**
     * @dev Overridden _baseURI to point to Arweave
     */
    function _baseURI() internal view override returns (string memory) {
        return baseArweaveURI;
    }
}
