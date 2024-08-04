import { Group, Identity, generateProof } from "@semaphore-protocol/core"
import { expect } from "chai"
import { encodeBytes32String } from "ethers"
import { run } from "hardhat"
// @ts-ignore: typechain folder will be generated after contracts compilation
import { Validators } from "../typechain-types"

describe("Validators", () => {
    let validatorsContract: Validators
    let semaphoreContract: string

    const groupId = 0
    const group = new Group()
    const users: Identity[] = []

    before(async () => {
        const { semaphore } = await run("deploy:semaphore", {
            logs: false
        })

        validatorsContract = await run("deploy", { logs: false, semaphore: await semaphore.getAddress() })
        semaphoreContract = semaphore

        users.push(new Identity())
        users.push(new Identity())
    })

    describe("# joinGroup", () => {
        it("Should allow users to join the group", async () => {
            for await (const [i, user] of users.entries()) {
                const transaction = validatorsContract.joinGroup(user.commitment)

                group.addMember(user.commitment)

                await expect(transaction)
                    .to.emit(semaphoreContract, "MemberAdded")
                    .withArgs(groupId, i, user.commitment, group.root)
            }
        })
    })

    describe("# castVote", () => {
        it("Should allow validators to cast vote anonymously", async () => {
            const voteObj = {
                claimId : "392323123123123131313",
                vote: 0, // 0: for 1: against -1: abstain
            }
            const vote = encodeBytes32String(JSON.stringify(voteObj))

            const fullProof = await generateProof(users[1], group, vote, groupId)

            const transaction = validatorsContract.castVote(
                fullProof.merkleTreeDepth,
                fullProof.merkleTreeRoot,
                fullProof.nullifier,
                vote,
                fullProof.points
            )

            await expect(transaction)
                .to.emit(semaphoreContract, "ProofValidated")
                .withArgs(
                    groupId,
                    fullProof.merkleTreeDepth,
                    fullProof.merkleTreeRoot,
                    fullProof.nullifier,
                    fullProof.message,
                    groupId,
                    fullProof.points
                )
        })
    })
})
