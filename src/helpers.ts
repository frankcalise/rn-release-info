import { spawnSync } from "bun"

// Function to check if the user is authenticated with `gh`
export function checkGhCliAuthenticated(): boolean {
  const result = spawnSync(["gh", "auth", "status"], {
    stdout: "pipe",
    stderr: "pipe",
  })

  return result.exitCode === 0
}

// Function to check if the `gh` CLI is installed
export function checkGhCliInstalled(): boolean {
  const result = spawnSync(["gh", "--version"], {
    stdout: "pipe",
    stderr: "pipe",
  })

  if (result.exitCode !== 0) {
    return false
  }
  return true
}
