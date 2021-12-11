import { context } from "@actions/github/lib/utils"
import { toolkit } from "./config"
import { getDefaultBranch } from "./branches"

export const toFileContent = (content: any) => JSON.stringify(content, null, 3)

export const fileExists = async (branch: string, path: string): Promise<boolean> => {
    try {
        await toolkit.repos.getContent({
            ...context.repo,
            path,
            ref: branch
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

export const createFileCommitOnDefault = async (path: string, content: string): Promise<string> => {
    const defaultBranch = await getDefaultBranch()
    // Get the current "master" reference, to get the current master's sha
    const ref = await toolkit.git.getRef({
        ...context.repo,
        ref: `heads/${defaultBranch}`
    })

    // Get the tree associated with master, and the content
    // of the template file to open the PR with.
    const tree = await toolkit.git.getTree({
        ...context.repo,
        tree_sha: ref.data.object.sha
    })

    // Create a new blob with the existing template content
    const blob = await toolkit.git.createBlob({
        ...context.repo,
        content: content,
        encoding: "utf8"
    })

    const newTree = await toolkit.git.createTree({
        ...context.repo,
        tree: [{
            path,
            sha: blob.data.sha,
            mode: '100644',
            type: 'blob'
        }],
        base_tree: tree.data.sha
    })

    // Create a commit and a reference using the new tree
    const commit = await toolkit.git.createCommit({
        ...context.repo,
        message: 'Add details',
        parents: [ref.data.object.sha],
        tree: newTree.data.sha
    })
    return commit.data.sha
}