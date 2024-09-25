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
  queryCommitFilesChanged,
} from "./queries";

// accept sort argument from bun argv, either "asc" or "desc" from --sort=asc
const sortArg = process.argv.includes("--sort")
  ? process.argv[process.argv.indexOf("--sort") + 1]
  : "desc";

// accept verbose from bun argv as --verbose or -v
const verboseArg =
  process.argv.includes("--verbose") || process.argv.includes("-v");

function formatResultLine(commitHash: string, date: string, title: string) {
  const line = `${commitHash.substring(0, 7)} : ${date}`;
  return verboseArg ? `${line} : ${title}` : line;
}

const fmtRed = "\x1b[31m";
const fmtReset = "\x1b[0m";
const fmtBold = "\x1b[1m";

const maxWidth = process.stdout.columns;

function formatFileCollisions(files: string[]): string {
  const prefix = ' - ';
  const output: string[] = []; 
  const limit = prefix.length + 4;
  for (const file of files) {
    let label = file;
    if ((file.length + prefix.length) > maxWidth) {
      label = '...' + file.substr(file.length + prefix.length + 3 - maxWidth);
    }
    output.push(`${prefix}${fmtRed}${fmtBold}${label}${fmtReset}`);
  }
  return output.join('\n');
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

const projectID = await queryProjectID(targetRelease);
const inboxIssues = await queryProjectInbox({ projectID, targetRelease });

interface PickInfo {
  commitHash: string;
  createdAt: string;
  title: string;
  files: Set<string>;
}

const allPickItems: PickInfo[] = [];
const allFiles: Map<string, number> = new Map();

// foreach issue in inboxIssues, call query issue
for (const issue of inboxIssues) {
  const { number: issueNumber, title, body, createdAt, url } = issue.content;

  let flagged = false;
  const output: PickInfo[] = [];

  // look for pull requests in the issue body
  const pullRequestLinks = parsePullRequestLinks(body);
  if (pullRequestLinks.length > 0) {
    for (const pullRequest of pullRequestLinks) {
      // get the pull request number on the end
      const prData = await queryPullRequest(
        Number.parseInt(pullRequest.substring(pullRequest.lastIndexOf("/") + 1))
      );

      if (prData) {
        const commitHash: string = prData.commitHash;
        const files = queryCommitFilesChanged(commitHash);
        output.push({ commitHash, createdAt, title, files });
      } else {
        flagged = true;
        // TODO
        // item has a PR but no commit info yet (could be a PR to the target release branch directly)
        // itemsToDiscuss.push(`#${issueNumber} - ${issueTitle} (${pullRequest})`);
      }
    }
  }

  // look for commits in the issue body
  const commitLinks = parseCommitLinks(body);
  if (commitLinks.length > 0) {
    for (const commit of commitLinks) {
      const commitHash = commit.substring(commit.lastIndexOf("/") + 1);
      const commitInfo = await queryCommitInfo(commitHash);
      const parseCommitMessage = commitInfo.message.split("\n");
      const files = queryCommitFilesChanged(commitHash);

      output.push({
        commitHash: commitHash,
        createdAt: commitInfo.committedDate,
        title: `${title} (${parseCommitMessage[0]})`,
        files,
      });
    }
  }

  // Check for files where collisions are likely
  for (const {files} of output) {
    for (const file of files) {
      const count = allFiles.get(file) ?? 0;
      allFiles.set(file, count + 1);
    }
  }

  if (output.length > 0 && !flagged) {
    allPickItems.push(...output);
  } else {
    itemsToDiscuss.push(`#${issueNumber} : ${title} : ${url}`);
  }
}

// sort allPickItems by date depending on sortArg
const sortedPicks = allPickItems.sort((a, b) => {
  return sortArg === "asc"
    ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});

for (const pick of sortedPicks) {
  console.log(formatResultLine(pick.commitHash, pick.createdAt, pick.title));
  const collisions = Array.from(pick.files).filter(file => (allFiles.get(file) ?? 0) > 1);
  console.log(formatFileCollisions(collisions));
}

console.log(`\nTotal picks (${allPickItems.length})`);
if (itemsToDiscuss.length > 0) {
  console.log(`\nTo discuss (${itemsToDiscuss.length}):`);
  itemsToDiscuss.forEach((item) => console.log(item));
}
