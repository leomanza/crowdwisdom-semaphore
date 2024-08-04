//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract Curators {
    ISemaphore public semaphore;

    uint256 public groupId;

    constructor(address semaphoreAddress) {
        semaphore = ISemaphore(semaphoreAddress);

        groupId = semaphore.createGroup(address(this));
    }

    function joinGroup(uint256 identityCommitment) external {
        semaphore.addMember(groupId, identityCommitment);
    }

    function requestClaim(
        uint256 merkleTreeDepth,
        uint256 merkleTreeRoot,
        uint256 nullifier,
        uint256 claim,
        uint256[8] calldata points
    ) external {
        ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof(
            merkleTreeDepth,
            merkleTreeRoot,
            nullifier,
            claim,
            groupId,
            points
        );

        semaphore.validateProof(groupId, proof);
    }
}
