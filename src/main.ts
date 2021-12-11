import * as core from '@actions/core'
import axios, { AxiosResponse } from 'axios'
import { stat } from 'fs'
import { branchExists, createBranchPrWithCommit, getDefaultBranch } from './branches'
import { createFileCommitOnDefault, fileExists, toFileContent } from './files'
import { isSafeSnapProposal } from './safesnap'
import { MultiSigTrigger, Proposal, ProposalDetails, Proposals, Query, SafeSnapTrigger, SnapshotMessage } from "./types"
import { triggerToBranch, triggerToDetailsPath } from './utils'

async function run(): Promise<void> {
  try {
    const safeAddress: string = core.getInput('safe-address')
    const snapshotApi: string = core.getInput('snapshot-api')
    const snapshotSpace: string = core.getInput('snapshot-space')
    const proposalState: string = core.getInput('proposal-state')
    const ipfsUrl: string = core.getInput('ipfs-url')

    const proposals: Proposal[] = []
    const states = proposalState.split(",")
    if (states.length == 0) states.push("active", "pending")
    for (const state of states) {
      const proposalsResponse: AxiosResponse<Query<Proposals>> = await axios.post(
        `${snapshotApi}`,
        {
          "operationName": "Proposals",
          "variables": {
            "first": 1000,
            "space": snapshotSpace,
            "state": proposalState,
            "state_in": ["pending"]
          },
          "query": "query Proposals($first: Int!, $state: String!, $space: String) { proposals( first: $first where: {space: $space, state: $state} ) { ipfs } }"
        }
      )
      proposals.push(...proposalsResponse.data.data.proposals)
    }
    for (const proposal of proposals) {
      console.log("Sync proposal", proposal)
      const proposalDetailsResponse: AxiosResponse<SnapshotMessage<ProposalDetails>> = await axios.get(
        `${ipfsUrl}/${proposal.ipfs}`
      )
      const proposalDetails: SnapshotMessage<ProposalDetails> = proposalDetailsResponse.data
      if (!isSafeSnapProposal(proposalDetails)) {
        console.log("Not a SafeSnap proposal:", proposal)
        continue
      }
      const trigger: SafeSnapTrigger = {
        type: 'safesnap',
        id: proposal.ipfs
      }
      const details = {
        space: {
          safe: safeAddress
        },
        proposal: proposalDetails
      }
      console.log(JSON.stringify(details, null, 3))

      // TODO: extract into library
      const defaultBranch = await getDefaultBranch()
      const path = triggerToDetailsPath(trigger)
      if (await fileExists(defaultBranch, path)) {
        console.log("Transaction details already merged")
        continue
      }
      const branch = triggerToBranch(trigger)
      if (await branchExists(branch)) {
        console.log("Transaction details already proposed")
        continue
      }
      const commit = await createFileCommitOnDefault(path, toFileContent(details))
      const pr = await createBranchPrWithCommit(branch, commit)
      console.log("Opened PR " + pr)
    }

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()