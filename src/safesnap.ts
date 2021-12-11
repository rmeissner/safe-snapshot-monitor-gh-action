import { ProposalDetails, SafeSnapData, SnapshotMessage } from "./types";

export const getSafeSnapData = (proposal: SnapshotMessage<ProposalDetails>): SafeSnapData => {
    if (!proposal.data.message.plugins) throw Error("No plugins")
    const pluginData = JSON.parse(proposal.data.message.plugins)
    if (!pluginData.safeSnap) throw Error("No SafeSnap found")
    if (!pluginData.safeSnap.safes) throw Error("No Safe in SafeSnap found")
    if (!Array.isArray(pluginData.safeSnap.safes) || pluginData.safeSnap.safes.length != 1) throw Error("Unsupported Safes")
    const safesnapData = pluginData.safeSnap.safes[0]
    if (!safesnapData.realityAddress) throw Error("Invalid SafeSnap realityAddress")
    if (!Array.isArray(safesnapData.txs)) throw Error("Invalid SafeSnap transactions")
    return safesnapData
}

// TODO: extract into library
export const isSafeSnapProposal = (proposal: SnapshotMessage<ProposalDetails>): boolean => {
    try {
        return getSafeSnapData(proposal).txs.length > 0
    } catch (e) {
        return false
    }
}