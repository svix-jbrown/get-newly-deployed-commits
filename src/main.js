import * as core from "@actions/core";
import * as github from "@actions/github";

async function getPreviousCommit(octokit, owner, repo, environment, sha) {
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/deployments",
    {
      owner,
      repo,
      environment,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  let saw_sha = false;

  for (const row of response.data) {
    if (row.sha == sha) {
      saw_sha = true;
    } else if (saw_sha) {
      return row.sha;
    }
  }

  if (!saw_sha) {
    return response.data?.[0]?.sha;
  }
}

async function getCommitsInRange(octokit, owner, repo, sha, previousSha) {
  let commits = [];

  let page = 1;

  while (page < 5) {
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/commits",
      {
        owner,
        repo,
        sha,
        page,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
    if (response.data.length == 0) {
      return commits;
    }
    for (const commit of response.data) {
      if (commit.sha == previousSha) {
        return commits;
      }
      commits.push(commit);
    }
    page += 1;
  }
  console.warn(
    `failed to find previousSha ${previousSha} after 5 pages; maybe it isn't an ancestor`,
  );
  return [];
}

async function getCommits(octokit) {
  const owner = core.getInput("owner");
  const repo = core.getInput("repo");
  const environment = core.getInput("environment");
  const sha = core.getInput("sha");

  const previousSha = await getPreviousCommit(
    octokit,
    owner,
    repo,
    environment,
    sha,
  );

  if (previousSha === null) {
    return null;
  }

  const commits = await getCommitsInRange(
    octokit,
    owner,
    repo,
    sha,
    previousSha,
  );

  const metadata = {
    authors: new Set(),
    commits: new Set(),
    numCommits: 0,
    previousSha: previousSha,
  };

  for (const commit of commits) {
    metadata.numCommits += 1;
    metadata.authors.add(commit.author.login);
    metadata.commits.add(commit.sha);
  }

  metadata.authors = Array.from(metadata.authors);
  metadata.authors.sort();

  metadata.commits = Array.from(metadata.commits);

  return metadata;
}

function populateOutput(metadata) {
  core.setOutput("authors", metadata.authors.join(" "));
  core.setOutput("commits", metadata.commits.join(" "));
  core.setOutput("num-commits", metadata.numCommits);
  core.setOutput("previous-sha", metadata.previousSha);
}

export async function run() {
  try {
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    const metadata = await getCommits(octokit);
    populateOutput(metadata);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

// vim: set ts=2 sw=2 sts=0:
