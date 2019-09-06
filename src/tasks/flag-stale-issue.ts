import { Actions } from "../action/actions";
import { IssueHandler } from "../issue/issue-handler";
import { IssueInfo } from "../issue/issue-info";
import { Notifier } from "../notify/notifier";

export class FlagStaleIssue implements IssueHandler {

  constructor(readonly message: string) {

  }

  public execute(issueInfo: IssueInfo, actions: Actions, notifier: Notifier): void {
    // already have 
    if (issueInfo.hasLabel('lifecycle/frozen') || issueInfo.hasLabel('lifecycle/stale')) {
      return;
    }

    const info: string = "Add lifecycle/stale as issue is inactive";
    actions.getAddLabels().add(["lifecycle/stale"], info);

    notifier.notify('Adding lifecycle/stale on issue ' + issueInfo.humanUrl());
    notifier.notify('Adding comment ' + this.message + ' on ' + issueInfo.humanUrl());
    actions.getAddComment().comment(this.message);
  }
}
