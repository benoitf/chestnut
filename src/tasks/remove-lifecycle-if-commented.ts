import * as Octokit from "@octokit/rest";

import { Actions } from "../action/actions";
import { IssueHandler } from "../issue/issue-handler";
import { IssueInfo } from "../issue/issue-info";
import { Notifier } from "../notify/notifier";

export class RemoveLifecycleIfCommented implements IssueHandler {

  constructor(readonly githubRead: Octokit, githubPush: Octokit) {

  }


  public execute(issueInfo: IssueInfo, actions: Actions, notifier: Notifier): void {
    // Ignore issues that are not in stale state
    if (issueInfo.isClosed() || !issueInfo.hasLabel("lifecycle/stale") || issueInfo.repositoryName() !== "che") {
      return;
    }

    // Time of the issue
    const now = new Date();

    // get only last comments in a row of 20mn
    const last_20_minutes = 1000 * 60 * 20;
    const inThePast = new Date(now.getTime() - last_20_minutes);

    const options = this.githubRead.issues.listComments.endpoint.merge({
      owner: 'eclipse',
      repo: 'che',
      issue_number: issueInfo.number(),
      since: inThePast.toISOString(),
      per_page: 100,
    });

    this.githubRead.paginate(options).then((response) => this.handleComments(issueInfo, response, actions, notifier));
  }

  protected handleComments(issueInfo: IssueInfo, data: Array<any>, actions: Actions, notifier: Notifier): void {
    // reverse order
    if (data.length === 0) {
      return
    }

    // reverse
    const commentsDescOrder = data.reverse();

    // check every body of each comment
    const needToRemoveStale = commentsDescOrder.some(comment => {
      if (comment.body) {
        return '/remove-lifecycle stale' === comment.body.trim()
      }
      return false
    })


    if (needToRemoveStale) {
      // we will remove stale label
      actions.getRemoveLabel().remove('lifecycle/stale', "Removed label lifecycle/stale");

      notifier.notify(`Removing lifecycle/stale label on issue ${issueInfo.number()} as requested order`);
    }


  }

}
