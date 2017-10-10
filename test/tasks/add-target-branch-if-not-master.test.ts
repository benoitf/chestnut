import "mocha";
import {anyString, deepEqual, instance, mock, verify, when} from "ts-mockito";
import {Actions} from "../../src/action/actions";
import {PullRequestInfo} from "../../src/pull-request/pull-request-info";
import {AddLabel} from "../../src/action/add-label";
import {Notifier} from "../../src/notify/notifier";
import {IssueInfo} from "../../src/issue/issue-info";
import {AddTargetBranchIfNotMaster} from "../../src/tasks/add-target-branch-if-not-master";

describe("Add Target Branch if not on master branch", () => {
  it("checkCallIsPerformed", () => {
    const addTargetBranchIfNotMaster: AddTargetBranchIfNotMaster = new AddTargetBranchIfNotMaster();
    const pullRequestInfo: PullRequestInfo = mock(PullRequestInfo);
    const issueInfo: IssueInfo = mock(IssueInfo);
    const addLabel: AddLabel = mock(AddLabel);
    const actions: Actions = mock(Actions);
    const notifier: Notifier = mock(Notifier);
    when(actions.getAddLabels()).thenReturn(instance(addLabel));
    when(pullRequestInfo.issueInfo()).thenReturn(instance(issueInfo));
    when(issueInfo.hasStatus()).thenReturn(true);
    when(pullRequestInfo.isMerged()).thenReturn(false);
    addTargetBranchIfNotMaster.execute(instance(pullRequestInfo), instance(actions), instance(notifier));
    verify(addLabel.add(deepEqual(["target/branch"]), anyString())).times(1);
  });
});
