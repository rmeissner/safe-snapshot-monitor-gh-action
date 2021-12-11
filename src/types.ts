export interface SafeSnapData {
    realityAddress: string,
    txs: any[],
}

export interface ProposalDetails {
    space: string,
    plugins: string,
}

export interface MessageData<T> {
    message: T
}

export interface SnapshotMessage<T> {
    data: MessageData<T>
}

export interface Proposal {
    ipfs: string
}

export interface Proposals {
    proposals: Proposal[]
}

export interface Query<T> {
    data: T
}

export interface MultiSigTrigger {
    type: "multisig",
    id: string
}

export interface SafeSnapTrigger {
    type: "safesnap",
    id: string
}

export type Trigger = MultiSigTrigger | SafeSnapTrigger