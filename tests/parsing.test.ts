import { describe, it, expect } from "bun:test"
import { parseCommitLinks, parsePullRequestLinks } from "../src/parsing"

describe("parse gh issue body", () => {
  it("should parse single commit hash links", () => {
    const item = {
      body: "### Target Branch(es)\n\n0.76\n\n### Link to commit or PR to be picked\n\nhttps://github.com/facebook/react-native/commit/1e59f2e3f8f0ab3ee4173bddaa089bbecf61d1eb\n\n### Description\n\nBuild settings in Xcode could be either a concatenation of strings or an array.\r\nThis fix handle both cases properly.",
    }

    const results = parseCommitLinks(item.body)
    expect(results).toHaveLength(1)
    expect(results[0]).toBe(
      "https://github.com/facebook/react-native/commit/1e59f2e3f8f0ab3ee4173bddaa089bbecf61d1eb"
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
