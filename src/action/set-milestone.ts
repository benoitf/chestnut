import * as Octokit from "@octokit/rest";
import { Notifier } from "../notify/notifier";

/**
 * Set the milestone on a specific issue and notify the notifier.
 */
export class SetMilestone {

  private githubPush: Octokit;
  private notifier: Notifier;
  private owner: string;
  private repo: string;
  private issueNumber: number;

  constructor(githubPush: Octokit, notifier: Notifier, owner: string, repo: string, issueNumber: number) {
    this.githubPush = githubPush;
    this.notifier = notifier;
    this.owner = owner;
    this.repo = repo;
    this.issueNumber = issueNumber;
  }

  public async set(milestone: number, link: string): Promise<void> {

    const issuesUpdateParams: Octokit.IssuesUpdateParams = {owner: this.owner, repo: this.repo, milestone, issue_number: this.issueNumber};
    await this.githubPush.issues.update(issuesUpdateParams);
    this.notifier.notify("Applied the milestone with version " + milestone + " on PR "
          + this.issueNumber + " : " + link);
  }
}
