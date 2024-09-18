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

import {
  findMergeComment,
  parseCommitLinks,
  parsePullRequestLinks,
} from "./parsing-utils";

// Account for Original and Pick to 0.76 links
// Can be multiple pick links

async function queryProjectID(targetRelease: string): Promise<string> {
  const query = `
    {
      organization(login: "reactwg") {
        projectsV2(first: 10) {
          nodes {
            id
            title
          }
        }
      }
    }
  `;

  const proc = Bun.spawn(["gh", "api", "graphql", "-f", `query=${query}`]);

  const queryResponse = await new Response(proc.stdout).text();
  const data = JSON.parse(queryResponse).data;

  // find the project id where the title includes the first two numbers of the target release
  const project = data.organization.projectsV2.nodes.find((node: any) => {
    const semVer = targetRelease.split(".");
    return node.title.includes(`${semVer[0]}.${semVer[1]}`);
  });

  return project.id;
}

async function queryProjectInbox({
  projectID,
  targetRelease,
}: {
  projectID: string;
  targetRelease: string;
}) {
  const query = `
   {
      node(id: "${projectID}") {
        ... on ProjectV2 {
          items(first: 80, orderBy: {field: POSITION, direction: DESC}) {
            nodes {
              id
              fieldValues(first: 8) {
                nodes {
                  ... on ProjectV2ItemFieldTextValue {
                    text
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldDateValue {
                    date
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                }
              }
              content {
                ... on Issue {
                  number
                  title
                  body
                  createdAt
                }
              }
            }
          }
        }
      }
    }
  `;

  const proc = Bun.spawn(["gh", "api", "graphql", "-f", `query=${query}`]);

  const queryResponse = await new Response(proc.stdout).text();
  const data = JSON.parse(queryResponse).data.node.items.nodes;

  // Find the issues in group (requested target release) that are in the "Inbox" status
  const filteredIssues = data.filter((item: any) => {
    const fieldValues = item.fieldValues.nodes;
    // filter fieldValues out if it is an empty object
    const filteredFieldValues = fieldValues.filter(
      (field: any) => Object.keys(field).length > 0
    );

    const statusField = filteredFieldValues.find(
      (field: any) => field?.field.name === "Status"
    );
    const targetReleaseField = filteredFieldValues.find(
      (field: any) => field?.field.name === "Target Release"
    );

    if (statusField !== undefined && targetReleaseField !== undefined) {
      return (
        statusField.name === "Done / Picked" &&
        (targetReleaseField.name as string).indexOf(targetRelease) > -1
      );
    }
    return false;
  });

  return filteredIssues;
}

async function queryPullRequest(num: number) {
  const owner = "facebook";
  const repo = "react-native";

  const query = `
    {
      repository(owner: "${owner}", name: "${repo}") {
        pullRequest(number: ${num}) {
          comments(first: 50) {
            nodes {
              author {
                login
              }
              body
              createdAt
            }
          }
        }
      }
    }
  `;

  const proc = Bun.spawn(["gh", "api", "graphql", "-f", `query=${query}`]);

  const output = await new Response(proc.stdout).text();
  const data = JSON.parse(output).data;

  const mergeInfo = findMergeComment(
    data.repository.pullRequest.comments.nodes
  );

  return mergeInfo;
}

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

const projectID = await queryProjectID(targetRelease);
const inboxIssues = await queryProjectInbox({ projectID, targetRelease });

// foreach issue in inboxIssues, call query issue
for (const issue of inboxIssues) {
  const issueNumber = issue.content.number;
  const issueTitle = issue.content.title;
  const issueBody = issue.content.body;
  const issueCreatedAt = issue.content.createdAt;
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
        itemsToDiscuss.push(`#${issueNumber} - ${issueTitle} (${pullRequest})`);
      }
    }
  }

  // look for commits in the issue body
  const commitLinks = parseCommitLinks(issueBody);
  if (commitLinks.length > 0) {
    for (const commit of commitLinks) {
      const commitHash = commit.substring(commit.lastIndexOf("/") + 1);
      output.push(formatResultLine(commitHash, issueCreatedAt, issueTitle));
    }
  }

  output.forEach((line) => console.log(`${flagged ? "! " : ""} ${line}`));
}

if (itemsToDiscuss.length > 0) {
  console.log("\nTo discuss:");
  itemsToDiscuss.forEach((item) => console.log(item));
}
