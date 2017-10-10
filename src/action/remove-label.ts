import * as GitHub from "github";
import { Notifier } from "../notify/notifier";

/**
 * Remove a label on a specific issue and notify the notifier.
 */
export class RemoveLabel {

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

  public remove(labelToRemove: string, link: string): void {
    const params: GitHub.IssuesRemoveLabelParams = Object.create(null);
    params.owner = this.owner;
    params.repo = this.repo;
    params.number = this.issueNumber;
    params.name = labelToRemove;

    this.githubPush.issues.removeLabel(params, (err, res) => {
      if (err) {
        this.notifier.error("Unable to remove the label  " + labelToRemove
          + " on issue " + this.issueNumber + ":" + err);
      }
      if (res) {
        this.notifier.notify("Removed the label " + labelToRemove + " on issue " + this.issueNumber + ":" + link);
      }
    });
  }
}
