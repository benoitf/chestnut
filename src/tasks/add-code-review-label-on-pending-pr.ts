import { Actions } from "../action/actions";
import { IssueInfo } from "../issue/issue-info";
import { Notifier } from "../notify/notifier";
import { IPullRequestHandler } from "../pull-request/pull-request-handler";
import { PullRequestInfo } from "../pull-request/pull-request-info";
export class AddCodeReviewLabelOnPendingPR implements IPullRequestHandler {

  public execute(pullRequestInfo: PullRequestInfo, actions: Actions, notifier: Notifier): void {
    // if not merged, add the code-review status if there is no other status label
    if (!pullRequestInfo.isMerged()) {
      const issueInfo: IssueInfo = pullRequestInfo.issueInfo();
      if (!issueInfo.hasStatus()) {
        const callbackInfo: string = "Existing labels on "
          + pullRequestInfo.humanUrl() + " are '" + pullRequestInfo.issueInfo().labels() + "'";
        actions.getAddLabels().add(["status/code-review"], callbackInfo);
      }
    }
  }
}
