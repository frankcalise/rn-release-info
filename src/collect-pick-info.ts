/**
 *
 *  1. Get the project ID for the latest React Native Release project based on argv version, format: React Native 0.76 Releases
 *  2. Get the issues with a target release of "0.76.0-rc2*" for example
 *  3. Find the issues in the "Inbox" status column
 *  4. Look at the issue body for "Link to commit or PR to be picked" (there can be multiple)
 *     a. Identify if the comment is a link to a PR or a commit
 *       i. PR format: Identify the issue number from the text, e.g.: facebook/react-native#46420 should be 46420
 *      ii. Commit format: Identify the commit hash from the text, e.g.: facebook/react-native@81e8c39
 *  5. Look up the new issue by the number and get the latest comments in DESC order
 *    a. Obtain the `react-native-bot` comment body of This pull request was successfully merged by [user] in [hash]
 *    b. Record the hash and datetime
 */

import { parseCommitLinks, parsePullRequestLinks } from "./parsing";
import {
  queryCommitInfo,
  queryProjectID,
  queryProjectInbox,
  queryPullRequest,
} from "./queries";

function formatResultLine(commitHash: string, date: string, title: string) {
  return `${commitHash.substring(0, 7)} : ${date} : ${title}`;
}

// accept argument from bun argv
const targetRelease = process.argv[2];
if (!targetRelease) {
  console.error("Please provide a targetRelease in the format of '0.76.0-rc3'");
  process.exit(1);
} else {
  // regex for 0.76.0-rc3 format
  const releaseRegex = /^0\.\d+\.\d+-rc\d+$/;
  if (!releaseRegex.test(targetRelease)) {
    console.error(
      "Please provide a targetRelease in the format of '0.76.0-rc3'"
    );
    process.exit(1);
  } else {
    console.log("Target release", targetRelease);
  }
}

const itemsToDiscuss: string[] = [];
let pickCount = 0;

const projectID = await queryProjectID(targetRelease);
const inboxIssues = await queryProjectInbox({ projectID, targetRelease });

// foreach issue in inboxIssues, call query issue
for (const issue of inboxIssues) {
  const issueNumber = issue.content.number;
  const issueTitle = issue.content.title;
  const issueBody = issue.content.body;
  const issueCreatedAt = issue.content.createdAt;
  const issueURL = issue.content.url;

  let flagged = false;
  const output: string[] = [];

  // look for pull requests in the issue body
  const pullRequestLinks = parsePullRequestLinks(issueBody);
  if (pullRequestLinks.length > 0) {
    for (const pullRequest of pullRequestLinks) {
      // get the pull request number on the end
      const prData = await queryPullRequest(
        Number.parseInt(pullRequest.substring(pullRequest.lastIndexOf("/") + 1))
      );

      if (prData) {
        output.push(
          formatResultLine(prData.commitHash, issueCreatedAt, issueTitle)
        );
      } else {
        flagged = true;
        // itemsToDiscuss.push(`#${issueNumber} - ${issueTitle} (${pullRequest})`);
      }
    }
  }

  // look for commits in the issue body
  const commitLinks = parseCommitLinks(issueBody);
  if (commitLinks.length > 0) {
    for (const commit of commitLinks) {
      const commitHash = commit.substring(commit.lastIndexOf("/") + 1);
      const commitInfo = await queryCommitInfo(commitHash);
      const parseCommitMessage = commitInfo.message.split("\n");

      output.push(
        formatResultLine(
          commitHash,
          commitInfo.committedDate,
          `${issueTitle} (${parseCommitMessage[0]})`
        )
      );
    }
  }

  if (output.length > 0 && !flagged) {
    pickCount += output.length;
    output.forEach((line) => console.log(line));
  } else {
    itemsToDiscuss.push(`#${issueNumber} : ${issueTitle} : ${issueURL}`);
  }
}

console.log(`\nTotal picks (${pickCount})`);
if (itemsToDiscuss.length > 0) {
  console.log(`\nTo discuss (${itemsToDiscuss.length}):`);
  itemsToDiscuss.forEach((item) => console.log(item));
}
