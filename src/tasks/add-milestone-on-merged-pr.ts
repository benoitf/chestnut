import { Actions } from "../action/actions";
import { Notifier } from "../notify/notifier";
import { IPullRequestHandler } from "../pull-request/pull-request-handler";
import { PullRequestInfo } from "../pull-request/pull-request-info";

export class AddMilestoneOnMergedPR implements IPullRequestHandler {
  private cheMilestoneNumber: number;

  constructor(cheMilestoneNumber: number) {
    this.cheMilestoneNumber = cheMilestoneNumber;
  }
  public execute(pullRequestInfo: PullRequestInfo, actions: Actions, notifier: Notifier): void {
    if (this.cheMilestoneNumber === 0) {
      return;
    }

    if (pullRequestInfo.isMerged() && pullRequestInfo.issueInfo().milestone() === ""
      && pullRequestInfo.repoOwner() === "eclipse" && pullRequestInfo.repoName() === "che") {
      // need to add milestone on the issue but only if it's for master
      if (pullRequestInfo.mergingBranch() === "master") {
        actions.getSetMilestone().set(this.cheMilestoneNumber, "applied");
      }
    }

  }

  public updateMilestoneNumber(cheMilestoneNumber: number): void {
    this.cheMilestoneNumber = cheMilestoneNumber;
  }

}
