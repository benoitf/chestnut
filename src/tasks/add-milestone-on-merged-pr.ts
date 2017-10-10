import { Actions } from "../action/actions";
import { Notifier } from "../notify/notifier";
import { IPullRequestHandler } from "../pull-request/pull-request-handler";
import { PullRequestInfo } from "../pull-request/pull-request-info";

export class AddMilestoneOnMergedPR implements IPullRequestHandler {
  private cheMilestoneNumber: number;
  private che6milestoneNumber: number;

  constructor(cheMilestoneNumber: number, che6milestoneNumber: number) {
    this.cheMilestoneNumber = cheMilestoneNumber;
    this.che6milestoneNumber = che6milestoneNumber;
  }
  public execute(pullRequestInfo: PullRequestInfo, actions: Actions, notifier: Notifier): void {

    if (pullRequestInfo.isMerged() && pullRequestInfo.issueInfo().milestone() === ""
      && pullRequestInfo.repoOwner() === "eclipse" && pullRequestInfo.repoName() === "che") {
      // need to add milestone on the issue but only if it's for master
      if (pullRequestInfo.mergingBranch() === "master") {
        actions.getSetMilestone().set(this.cheMilestoneNumber, "applied");
      }
      if (pullRequestInfo.mergingBranch() === "che6") {
        actions.getSetMilestone().set(this.che6milestoneNumber, "applied");
      }

    }

  }

  public updateMilestoneNumber(cheMilestoneNumber: number, che6milestoneNumber: number): void {
    this.cheMilestoneNumber = cheMilestoneNumber;
    this.che6milestoneNumber = che6milestoneNumber;
  }

}
