import * as GitHub from "@octokit/rest";
import { Notifier } from "../notify/notifier";
import { AddLabel } from "./add-label";
import { RemoveLabel } from "./remove-label";
import { SetMilestone } from "./set-milestone";

/**
 * Actions are helpers for the tasks that needs to perform some "actions" on the github repository
 */
export class Actions {
  private addLabel: AddLabel;
  private setMilestone: SetMilestone;
  private removeLabel: RemoveLabel;

  constructor(githubPush: GitHub, notifier: Notifier, owner: string, repo: string, issueNumber: number) {
    this.addLabel = new AddLabel(githubPush, notifier, owner, repo, issueNumber);
    this.removeLabel = new RemoveLabel(githubPush, notifier, owner, repo, issueNumber);
    this.setMilestone = new SetMilestone(githubPush, notifier, owner, repo, issueNumber);
  }

  public getAddLabels(): AddLabel {
    return this.addLabel;
  }
  public getRemoveLabel(): RemoveLabel {
    return this.removeLabel;
  }

  public getSetMilestone(): SetMilestone {
    return this.setMilestone;
  }

}
