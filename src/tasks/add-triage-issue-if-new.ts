import { Actions } from "../action/actions";
import { IssueHandler } from "../issue/issue-handler";
import { IssueInfo } from "../issue/issue-info";
import { Notifier } from "../notify/notifier";

export class AddTriageIssueIfNew implements IssueHandler {

  public execute(issueInfo: IssueInfo, actions: Actions, notifier: Notifier): void {
    // already a status, ignore it
    if (issueInfo.isClosed() || issueInfo.hasStatus() || issueInfo.repositoryName() !== "che" || issueInfo.milestone() != "" || issueInfo.hasSeverity()
       || issueInfo.hasLabel("automated")) {
      return;
    }

    // Time of the issue
    const now = new Date();

    const fice_minutes = 1000 * 60 * 5;
    if ((now.getTime() - fice_minutes) > issueInfo.getCreated()) {
      // issue too old
      notifier.notify("The issue " + issueInfo.humanUrl() + " is too old for triage, ignoring it");
      return;
    }

    const info: string = "Add status/need-triage as issue was created < 5MN ago";

    actions.getAddLabels().add(["status/need-triage"], info);

  }
}
