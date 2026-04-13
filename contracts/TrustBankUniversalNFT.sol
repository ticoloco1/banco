// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * TrustBank — fábrica NFT com URI dinâmica por token (compatível OpenSea / Rarible).
 *
 * O `tokenURI` deve resolver para JSON com pelo menos:
 * - "name" (string)
 * - "description" (string, opcional)
 * - "image" (string URL ou IPFS)
 * - "animation_url" (string URL, opcional — vídeo / HTML)
 * - "attributes" (array de { "trait_type": "...", "value": "..." | number })
 *
 * Exemplo: https://docs.opensea.io/docs/metadata-standards
 *
 * Deploy: definir `initialOwner` como carteira que pode mintar (tesouraria / backend).
 */
contract TrustBankUniversalNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor(address initialOwner) ERC721("TrustBank Universal", "TBU") Ownable(initialOwner) {}

    function mint(address to, string calldata metadataUri) external onlyOwner returns (uint256 tokenId) {
        tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataUri);
    }

    function currentTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
}
