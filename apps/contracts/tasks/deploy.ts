import { task, types } from "hardhat/config"

task("deploy", "Deploy a Curators contract")
    .addOptionalParam("semaphore", "Semaphore contract address", undefined, types.string)
    .addOptionalParam("logs", "Print the logs", true, types.boolean)
    .setAction(async ({ logs, semaphore: semaphoreAddress }, { ethers, run }) => {
        if (!semaphoreAddress) {
            const { semaphore } = await run("deploy:semaphore", {
                logs
            })

            semaphoreAddress = await semaphore.getAddress()
        }

        const CuratorsFactory = await ethers.getContractFactory("Curators")

        const curatorContract = await CuratorsFactory.deploy(semaphoreAddress)

        await curatorContract.waitForDeployment()

        const groupId = await curatorContract.groupId()

        if (logs) {
            console.info(
                `Curators contract has been deployed to: ${await curatorContract.getAddress()} (groupId: ${groupId})`
            )
        }

        return curatorContract
    })
