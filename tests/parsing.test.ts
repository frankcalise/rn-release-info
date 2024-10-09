import { describe, it, expect } from "bun:test"
import { findMergeComment, parseCommitLinks, parsePullRequestLinks } from "../src/parsing"

describe("parse gh issue body", () => {
  it("should parse single commit hash links", () => {
    const item = {
      body: "### Target Branch(es)\n\n0.76\n\n### Link to commit or PR to be picked\n\nhttps://github.com/facebook/react-native/commit/1e59f2e3f8f0ab3ee4173bddaa089bbecf61d1eb\n\n### Description\n\nBuild settings in Xcode could be either a concatenation of strings or an array.\r\nThis fix handle both cases properly.",
    }

    const results = parseCommitLinks(item.body)
    expect(results).toHaveLength(1)
    expect(results[0]).toBe(
      "https://github.com/facebook/react-native/commit/1e59f2e3f8f0ab3ee4173bddaa089bbecf61d1eb",
    )
  })

  // it("should parse multiple commit hash links", () => {})

  it("should parse single PR links", () => {
    const item = {
      body: "### Target Branch(es)\n\n0.76\n\n### Link to commit or PR to be picked\n\nhttps://github.com/facebook/react-native/pull/46560\n\n### Description\n\nThis fixes the `init` behavior for 0.76",
    }

    const results = parsePullRequestLinks(item.body)
    expect(results).toHaveLength(1)
    expect(results[0]).toBe("https://github.com/facebook/react-native/pull/46560")
  })
})

describe("parse merge commit", () => {
  it("should parse commit hash from `facebook-github-bot`", () => {
    const comments = {
      nodes: [
        {
          author: {
            login: "facebook-github-bot",
          },
          body: "This pull request was **exported** from Phabricator. Differential Revision: [D58684366](https://www.internalfb.com/diff/D58684366)",
          createdAt: "2024-06-17T18:54:16Z",
        },
        {
          author: {
            login: "analysis-bot",
          },
          body: "Branch: main",
          createdAt: "2024-06-17T19:28:57Z",
        },
        {
          author: {
            login: "facebook-github-bot",
          },
          body: "This pull request was **exported** from Phabricator. Differential Revision: [D58684366](https://www.internalfb.com/diff/D58684366)",
          createdAt: "2024-06-17T22:06:14Z",
        },
        {
          author: {
            login: "facebook-github-bot",
          },
          body: "This pull request has been merged in facebook/react-native@8a3ffb6d23f169752891eddc7dad9e34cb2d861c.",
          createdAt: "2024-06-20T17:43:02Z",
        },
        {
          author: {
            login: "github-actions",
          },
          body: "This pull request was successfully merged by @alanleedev in **8a3ffb6d23f169752891eddc7dad9e34cb2d861c**.\\<sup>[When will my fix make it into a release?](https://github.com/reactwg/react-native-releases/blob/main/docs/faq.md#when-will-my-fix-make-it-into-a-release) | [How to file a pick request?](https://github.com/reactwg/react-native-releases/blob/main/docs/faq.md#how-to-open-a-pick-request)</sup>",
          createdAt: "2024-06-20T17:43:05Z",
        },
      ],
    }

    const results = findMergeComment(comments.nodes)
    expect(results?.commitHash).toBe("8a3ffb6d23f169752891eddc7dad9e34cb2d861c")
    expect(results?.timestamp).toBe("2024-06-20T17:43:02Z")
  })

  it("should parse commit hash from `react-native-bot`", () => {
    const comments = {
      nodes: [
        {
          author: {
            login: "react-native-bot",
          },
          body: "This pull request was successfully merged by @cortinico in **6eb21ca1fba158a7972b28889f1a55280b803ed4**\n\n<sup>[When will my fix make it into a release?](https://github.com/reactwg/react-native-releases/blob/main/docs/faq.md#when-will-my-fix-make-it-into-a-release) | [How to file a pick request?](https://github.com/reactwg/react-native-releases/blob/main/docs/faq.md#how-to-open-a-pick-request)</sup>",
          createdAt: "2024-09-27T15:44:34Z",
        },
      ],
    }
    const results = findMergeComment(comments.nodes)
    expect(results?.commitHash).toBe("6eb21ca1fba158a7972b28889f1a55280b803ed4")
    expect(results?.timestamp).toBe("2024-09-27T15:44:34Z")
  })
})
