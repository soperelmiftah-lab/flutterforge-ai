/**
 * @module features/integrations/github
 *
 * GitHub adapter — repo import/export, commit & PR creation, and OAuth wiring.
 * Planned (Phase 4).
 */

export interface GitHubConfig {
  token: string;
  defaultOwner?: string;
}

export const githubConfig: GitHubConfig | null = null;

export interface RepoRef {
  owner: string;
  name: string;
  branch?: string;
}

/** Import a project from a GitHub repo. NOT IMPLEMENTED in Phase 1. */
export async function importRepo(_ref: RepoRef): Promise<{ projectId: string }> {
  throw new Error("GitHub integration arrives in Phase 4.");
}

/** Push a project to a GitHub repo. NOT IMPLEMENTED in Phase 1. */
export async function pushRepo(
  _projectId: string,
  _ref: RepoRef
): Promise<{ commitSha: string }> {
  throw new Error("GitHub integration arrives in Phase 4.");
}
