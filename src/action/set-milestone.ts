import * as GitHub from "github";
import { Notifier } from "../notify/notifier";

/**
 * Set the milestone on a specific issue and notify the notifier.
 */
export class SetMilestone {

  private githubPush: GitHub;
  private notifier: Notifier;
  private owner: string;
  private repo: string;
  private issueNumber: number;

  constructor(githubPush: GitHub, notifier: Notifier, owner: string, repo: string, issueNumber: number) {
    this.githubPush = githubPush;
    this.notifier = notifier;
    this.owner = owner;
    this.repo = repo;
    this.issueNumber = issueNumber;
  }

  public set(version: number, link: string): void {

    const issuesEditParams: GitHub.IssuesEditParams = Object.create(null);
    issuesEditParams.owner = this.owner;
    issuesEditParams.repo = this.repo;
    issuesEditParams.number = this.issueNumber;
    issuesEditParams.milestone = version;

    this.githubPush.issues.edit(issuesEditParams, (err, res) => {
      if (err) {
        this.notifier.notify("Error when applying the milestone" + link + "error: " + err);
      } else {
        this.notifier.notify("Applied the milestone with version " + version + " on PR "
          + this.issueNumber + " : " + link);
      }
    });
  }
}
