function getLinkToCommitOrPullRequestSection(issueBody: string): string {
  // Use a regular expression to find the "Link to commit or PR to be picked" section
  const sectionRegex =
    /### Link to commit or PR to be picked\s+([\s\S]*?)\s+###/i;
  const sectionMatch = issueBody.match(sectionRegex);

  if (!sectionMatch) {
    // If the section is not found, return an empty array
    return "";
  }

  // Extract the content of the "Link to commit or PR to be picked" section
  const sectionContent = sectionMatch[1];

  return sectionContent;
}

export function parsePullRequestLinks(issueBody: string): string[] {
  const sectionContent = getLinkToCommitOrPullRequestSection(issueBody);
  // Regular expression to match GitHub pull request links
  const pullRequestRegex =
    /https:\/\/github\.com\/facebook\/react\-native\/pull\/\d+/g;

  // Find all matches of the pull request links
  const matches = sectionContent.match(pullRequestRegex);

  // Return the matched links or an empty array if no matches are found
  return matches || [];
}

export function findMergeComment(comments: any[]) {
  const botComment = comments.find(
    (comment) =>
      comment.author.login === "react-native-bot" &&
      comment.body.includes("This pull request was successfully merged by")
  );

  if (botComment) {
    // Extract the full-length commit hash using regex
    const commitHashMatch = botComment.body.match(/in \*\*([a-f0-9]{40})\*\*/);
    const commitHash = commitHashMatch ? commitHashMatch[1] : null;
    const timestamp = botComment.createdAt;

    return { commitHash, timestamp };
  }

  return null;
}

export function parseCommitLinks(issueBody: string): string[] {
  const sectionContent = getLinkToCommitOrPullRequestSection(issueBody);

  // Regular expression to match GitHub pull request links
  const pullRequestRegex =
    /https:\/\/github\.com\/facebook\S+\/commit\/([a-f0-9]{40})/g;

  // Find all matches of the pull request links
  const matches = sectionContent.match(pullRequestRegex);

  // Return the matched links or an empty array if no matches are found
  return matches || [];
}
