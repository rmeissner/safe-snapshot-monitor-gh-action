import { context } from '@actions/github'
import { toolkit } from "./config";

let defaultBranch: string | undefined

export const getDefaultBranch = async (): Promise<string> => {
    if (!defaultBranch) {
        const repoInfo = await toolkit.repos.get({
            ...context.repo
        })
        defaultBranch = repoInfo.data.default_branch
    }
    return defaultBranch
}

export const branchExists = async (branch: string): Promise<boolean> => {
    try {
        await toolkit.repos.getBranch({
            ...context.repo,
            branch
        })
        return true
    } catch (error) {
        if (error.name === 'HttpError' && error.status === 404) {
            return false
        } else {
            throw Error(error)
        }
    }
}

export const createBranchPrWithCommit = async (branch: string, commit: string) => {

    console.log("Create branch", branch)
    await toolkit.git.createRef({
        ...context.repo,
        ref: `refs/heads/${branch}`,
        sha: commit
    })

    console.log("Create PR", branch)
    const defaultBranch = await getDefaultBranch()
    const pr = await toolkit.pulls.create({
        ...context.repo,
        title: `Check ${branch}`,
        head: branch,
        base: defaultBranch
    })

    return pr.data.id
}