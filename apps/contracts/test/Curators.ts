import { Group, Identity, generateProof } from "@semaphore-protocol/core"
import { expect } from "chai"
import { encodeBytes32String } from "ethers"
import { run } from "hardhat"
// @ts-ignore: typechain folder will be generated after contracts compilation
import { Curators } from "../typechain-types"

describe("Curators", () => {
    let curatorContract: Curators
    let semaphoreContract: string

    const groupId = 0
    const group = new Group()
    const users: Identity[] = []

    before(async () => {
        const { semaphore } = await run("deploy:semaphore", {
            logs: false
        })

        curatorContract = await run("deploy", { logs: false, semaphore: await semaphore.getAddress() })
        semaphoreContract = semaphore

        users.push(new Identity())
        users.push(new Identity())
    })

    describe("# joinGroup", () => {
        it("Should allow users to join the group", async () => {
            for await (const [i, user] of users.entries()) {
                const transaction = curatorContract.joinGroup(user.commitment)

                group.addMember(user.commitment)

                await expect(transaction)
                    .to.emit(semaphoreContract, "MemberAdded")
                    .withArgs(groupId, i, user.commitment, group.root)
            }
        })
    })

    describe("# requestClaim", () => {
        it("Should allow curators to send a claim anonymously", async () => {
            const claimObj = {
                contentUrl : "https://example.com/a-article-about-cats",
                note: "fake news: cats are the worst",
            }
            const claim = encodeBytes32String(JSON.stringify(claimObj))

            const fullProof = await generateProof(users[1], group, claim, groupId)

            const transaction = curatorContract.requestClaim(
                fullProof.merkleTreeDepth,
                fullProof.merkleTreeRoot,
                fullProof.nullifier,
                claim,
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
