export function parsePullRequestLinks(issueBody: string): string[] {
  // Regular expression to match GitHub pull request links
  const pullRequestRegex = /https:\/\/github\.com\/\S+\/pull\/\d+/g;

  // Find all matches of the pull request links
  const matches = issueBody.match(pullRequestRegex);

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
