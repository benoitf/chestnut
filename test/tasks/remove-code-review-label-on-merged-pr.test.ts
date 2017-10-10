import "mocha";
import {anyString, instance, mock, verify, when} from "ts-mockito";
import {Actions} from "../../src/action/actions";
import {PullRequestInfo} from "../../src/pull-request/pull-request-info";
import {Notifier} from "../../src/notify/notifier";
import {IssueInfo} from "../../src/issue/issue-info";
import {RemoveCodeReviewLabelOnMergedPR} from "../../src/tasks/remove-code-review-label-on-merged-pr";
import {RemoveLabel} from "../../src/action/remove-label";

describe("Remove Code Review label on merged PR", () => {
  it("checkCallIsPerformed", () => {
    const codeReview: RemoveCodeReviewLabelOnMergedPR = new RemoveCodeReviewLabelOnMergedPR();
    const pullRequestInfo: PullRequestInfo = mock(PullRequestInfo);
    const issueInfo: IssueInfo = mock(IssueInfo);
    const removeLabel: RemoveLabel = mock(RemoveLabel);
    const actions: Actions = mock(Actions);
    const notifier: Notifier = mock(Notifier);
    when(actions.getRemoveLabel()).thenReturn(instance(removeLabel));
    when(pullRequestInfo.issueInfo()).thenReturn(instance(issueInfo));
    when(issueInfo.hasLabel("status/code-review")).thenReturn(true);
    when(issueInfo.hasStatus()).thenReturn(true);
    when(pullRequestInfo.isMerged()).thenReturn(true);
    codeReview.execute(instance(pullRequestInfo), instance(actions), instance(notifier));
    verify(removeLabel.remove("status/code-review", anyString())).times(1);
  });
});
