import { findMergeComment } from "./parsing"

export async function queryProjectID(targetRelease: string): Promise<string> {
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
  `

  const proc = Bun.spawn(["gh", "api", "graphql", "-f", `query=${query}`])

  const queryResponse = await new Response(proc.stdout).text()
  const data = JSON.parse(queryResponse).data

  // find the project id where the title includes the first two numbers of the target release
  const project = data.organization.projectsV2.nodes.find((node: any) => {
    const semVer = targetRelease.split(".")
    return node.title.includes(`${semVer[0]}.${semVer[1]}`)
  })

  return project.id
}

export async function queryProjectInbox({
  projectID,
  targetRelease,
}: {
  projectID: string
  targetRelease: string
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
                  url
                }
              }
            }
          }
        }
      }
    }
  `

  const proc = Bun.spawn(["gh", "api", "graphql", "-f", `query=${query}`])

  const queryResponse = await new Response(proc.stdout).text()
  const data = JSON.parse(queryResponse).data.node.items.nodes

  // Find the issues in group (requested target release) that are in the "Inbox" status
  const filteredIssues = data.filter((item: any) => {
    const fieldValues = item.fieldValues.nodes
    // filter fieldValues out if it is an empty object
    const filteredFieldValues = fieldValues.filter((field: any) => Object.keys(field).length > 0)

    const statusField = filteredFieldValues.find((field: any) => field?.field.name === "Status")
    const targetReleaseField = filteredFieldValues.find(
      (field: any) => field?.field.name === "Target Release"
    )
    const titleField = filteredFieldValues.find((field: any) => field?.field.name === "Title")

    if (statusField !== undefined && targetReleaseField !== undefined) {
      return (
        // TODO if this is an older RC that you want to check how it would have run, status needs to be Done / Picked
        statusField.name === "Inbox" &&
        (targetReleaseField.name as string).indexOf(targetRelease) > -1 &&
        titleField.text.indexOf("Test Report") === -1
      )
    }
    return false
  })

  return filteredIssues
}

export async function queryPullRequest(num: number) {
  const owner = "facebook"
  const repo = "react-native"

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
  `

  const proc = Bun.spawn(["gh", "api", "graphql", "-f", `query=${query}`])

  const output = await new Response(proc.stdout).text()
  const data = JSON.parse(output).data

  const mergeInfo = findMergeComment(data.repository.pullRequest.comments.nodes)

  return mergeInfo
}

export async function queryCommitInfo(commitHash: string) {
  const query = `
{
  repository(owner: "facebook", name: "react-native") {
    object(expression: "${commitHash}") {
      ... on Commit {
        oid
        message
        committedDate
        author {
          name
          email
        }
      }
    }
  }
}`

  const proc = Bun.spawn(["gh", "api", "graphql", "-f", `query=${query.trim()}`])
  const output = await new Response(proc.stdout).text()
  const data = JSON.parse(output).data

  return data.repository.object
}
