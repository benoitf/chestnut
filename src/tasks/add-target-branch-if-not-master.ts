import { Actions } from "../action/actions";
import { Notifier } from "../notify/notifier";
import { IPullRequestHandler } from "../pull-request/pull-request-handler";
import { PullRequestInfo } from "../pull-request/pull-request-info";
export class AddTargetBranchIfNotMaster implements IPullRequestHandler {

  public execute(pullRequestInfo: PullRequestInfo, actions: Actions, notifier: Notifier): void {

    if (pullRequestInfo.repoOwner() === "eclipse" && pullRequestInfo.repoName() === "che"
      && pullRequestInfo.mergingBranch() === "che6" && !pullRequestInfo.issueInfo().hasLabel("target/che6")) {
      const info: string = "need to add target/che6"
        + pullRequestInfo.number()
        + " for branch "
        + pullRequestInfo.mergingBranch()
        + ", current labels : "
        + pullRequestInfo.issueInfo().labels();

      actions.getAddLabels().add(["target/che6"], info);

    } else if (pullRequestInfo.mergingBranch() !== "master" && !pullRequestInfo.issueInfo().isTargetBranch()
      && !pullRequestInfo.issueInfo().hasMatchingLabel("target")) {
      // PR that goes to a branch, check there is target/branch
      const info: string = "need to add target/branch"
        + pullRequestInfo.number()
        + " for branch "
        + pullRequestInfo.mergingBranch()
        + ", current labels : "
        + pullRequestInfo.issueInfo().labels();

      actions.getAddLabels().add(["target/branch"], info);

    }

  }
}
