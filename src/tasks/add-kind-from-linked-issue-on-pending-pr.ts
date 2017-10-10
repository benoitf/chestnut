import * as GitHub from "github";
import { Actions } from "../action/actions";
import { IssueInfo } from "../issue/issue-info";
import { Notifier } from "../notify/notifier";
import { IPullRequestHandler } from "../pull-request/pull-request-handler";
import { PullRequestInfo } from "../pull-request/pull-request-info";
export class AddKindFromLinkedIssueOnPendingPR implements IPullRequestHandler {
  private githubRead: GitHub;

  constructor(githubRead: GitHub) {
    this.githubRead = githubRead;
  }

  public execute(pullRequestInfo: PullRequestInfo, actions: Actions, notifier: Notifier): void {

    // check kind of PR/issues for merged or unmerged
    if (pullRequestInfo.issueInfo().hasKind()) {
      return;
    }

    const referencedIssue: any = pullRequestInfo.getReferencedIssue();

    if (referencedIssue !== null && referencedIssue.length > 0) {
      const parsingRegexp = /(?:\/repos\/)(.*)\/(.*)(?:\/issues\/)(\d+)/g;

      const parsing = parsingRegexp.exec(referencedIssue);

      const params: GitHub.IssuesGetParams = Object.create(null);

      if (parsing === null || parsing.length !== 4) {
        notifier.error("ERROR : unable to extract issue from referencedIssue: "
          + referencedIssue + ", got match =", parsing);
        return;
      }

      params.owner = parsing[1];
      params.repo = parsing[2];
      params.number = parseInt(parsing[3]);

      this.githubRead.issues.get(params, (err: any, res: any) => {

        if (err) {
          if (err.code === 404) {
            notifier.notify("Link from PR " + pullRequestInfo.humanUrl()
              + " to " + referencedIssue + " is an unacessible issue (err 404)");
          } else {
            notifier.error("Error while getting referenced isssue:", params.owner, params.repo, params.number, err);
          }
        }

        if (res) {
          const linkedIssueInfo = new IssueInfo(res.data);

          // ok now there are labels on the associated issue, check if there is a kind
          if (linkedIssueInfo.hasKind()) {
            // get the kind and apply it to the PR
            let applyLabels: string[] = linkedIssueInfo.getKindLabels();

            // replace epic by task for linked epic issues
            if (applyLabels.length === 1 && applyLabels[0] === "kind/epic") {
              applyLabels = ["kind/task"];

            }
            actions.getAddLabels().add(applyLabels, ". Label is coming from linked issue "
              + linkedIssueInfo.humanUrl());

          } else {
            notifier.notify("Cannot find any kind/label on the referenced issue "
              + params.number + " in PR " + pullRequestInfo.humanUrl() + " , try to detect...");
            this.tryToDetectAutomatically(pullRequestInfo, actions, notifier);
          }
        }

      });

    } else {
      this.tryToDetectAutomatically(pullRequestInfo, actions, notifier);

    }

  }

  /* Try to find automatically the kind/ type */
  protected tryToDetectAutomatically(pullRequestInfo: PullRequestInfo, actions: Actions, notifier: Notifier): void {
    // no referenced issue, try to use the title and search for "Fix" keyword
    const title: string = pullRequestInfo.title();
    const regexFix = /.*fix.*/gi;
    const regexEnhancements = /^(add|implement|update|change|disable).*/gi;
    if (regexFix.exec(title) != null) {
      const help: string = "No referenced issue on the PR"
        + pullRequestInfo.humanUrl() + " but found a title "
        + title + " matching the regexp fix ==> bug";
      actions.getAddLabels().add(["kind/bug"], help);
      notifier.notify(help);
    } else if (regexEnhancements.exec(title) != null) {
      const help: string = "No referenced issue on the PR "
        + pullRequestInfo.humanUrl() + " but found a title "
        + title + " matching regexEnhancements ==> enhancement";
      actions.getAddLabels().add(["kind/enhancement"], help);
    } else {
      notifier.notify("Unable to find linked issue from "
        + pullRequestInfo.humanUrl() + " or detect automatically the kind of this PR");

    }
  }
}
