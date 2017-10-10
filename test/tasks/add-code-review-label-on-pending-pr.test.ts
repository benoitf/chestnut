import "mocha";
import {anyString, deepEqual, instance, mock, verify, when} from "ts-mockito";
import {Actions} from "../../src/action/actions";
import {PullRequestInfo} from "../../src/pull-request/pull-request-info";
import {AddCodeReviewLabelOnPendingPR} from "../../src/tasks/add-code-review-label-on-pending-pr";
import {AddLabel} from "../../src/action/add-label";
import {Notifier} from "../../src/notify/notifier";
import {IssueInfo} from "../../src/issue/issue-info";

describe("Add Code Review label on pending PR", () => {
  it("checkCallIsPerformed", () => {
    const codeReview: AddCodeReviewLabelOnPendingPR = new AddCodeReviewLabelOnPendingPR();
    const pullRequestInfo: PullRequestInfo = mock(PullRequestInfo);
    const issueInfo: IssueInfo = mock(IssueInfo);
    const addLabel: AddLabel = mock(AddLabel);
    const actions: Actions = mock(Actions);
    const notifier: Notifier = mock(Notifier);
    when(actions.getAddLabels()).thenReturn(instance(addLabel));
    when(pullRequestInfo.issueInfo()).thenReturn(instance(issueInfo));
    when(issueInfo.hasStatus()).thenReturn(false);
    when(pullRequestInfo.isMerged()).thenReturn(false);
    codeReview.execute(instance(pullRequestInfo), instance(actions), instance(notifier));
    verify(addLabel.add(deepEqual(["status/code-review"]), anyString())).times(1);
  });
});
