import * as GitHub from "github";
import { Notifier } from "../notify/notifier";

/**
 * Add a label on a specific issue and notify the notifier.
 */
export class AddLabel {

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

  public add(labelsToAdd: string[], link: string): void {
    const params: GitHub.IssuesAddLabelsParams = Object.create(null);
    params.owner = this.owner;
    params.repo = this.repo;
    params.number = this.issueNumber;
    params.labels = labelsToAdd;

    this.githubPush.issues.addLabels(params, (err, res) => {
      this.notifier.notify("Added the label **" + labelsToAdd + "** on issue " + this.issueNumber + ":" + link);
    });
  }
}
