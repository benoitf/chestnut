
import { Actions } from "../action/actions";
import { Notifier } from "../notify/notifier";
import { IPullRequestHandler } from "../pull-request/pull-request-handler";
import { PullRequestInfo } from "../pull-request/pull-request-info";

export class RemoveCodeReviewLabelOnMergedPR implements IPullRequestHandler {

  public execute(pullRequestInfo: PullRequestInfo, actions: Actions, notifier: Notifier): void {

    if (pullRequestInfo.isMerged() && pullRequestInfo.issueInfo().hasLabel("status/code-review")) {
      actions.getRemoveLabel().remove("status/code-review", "Removed label code-review");
    }
  }
}
