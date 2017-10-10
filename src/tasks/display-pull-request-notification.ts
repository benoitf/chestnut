import { Actions } from "../action/actions";
import { CommentInfo } from "../comment/comment-info";
import { Notifier } from "../notify/notifier";
import { IPullRequestHandler } from "../pull-request/pull-request-handler";
import { PullRequestInfo } from "../pull-request/pull-request-info";
export class DisplayPullRequestNotification implements IPullRequestHandler {

  public execute(pullRequestInfo: PullRequestInfo, actions: Actions, notifier: Notifier): void {

    let content: string = "!["
      + pullRequestInfo.userName()
      + "](" + pullRequestInfo.userAvatarUrl()
      + " =18 " + '"'
      + pullRequestInfo.userName()
      + '"' + ") PR of ["
      + pullRequestInfo.userName()
      + "]("
      + pullRequestInfo.userHomePage()
      + ")";

    content += " _" + pullRequestInfo.title() + "_";
    content += " [" + pullRequestInfo.repoOwner()
      + "/" + pullRequestInfo.repoName()
      + "@" + pullRequestInfo.mergingBranch()
      + "#" + pullRequestInfo.number()
      + "](" + pullRequestInfo.humanUrl() + ")";

    if (pullRequestInfo.isMerged()) {
      content += " -- **merged** by !["
        + pullRequestInfo.mergedByUserName()
        + "](" + pullRequestInfo.mergedByUserAvatarUrl()
        + " =18 " + '"'
        + pullRequestInfo.mergedByUserName()
        + '"' + ") ["
        + pullRequestInfo.mergedByUserName()
        + "]("
        + pullRequestInfo.mergedByUserHomePage()
        + ")\n";
    } else {
      const commentInfo: CommentInfo | null = pullRequestInfo.commentInfo();
      if (commentInfo !== null) {
        content += " commented by !["
          + commentInfo.userName()
          + "](" + commentInfo.userAvatarUrl()
          + " =18 " + '"'
          + commentInfo.userName()
          + '"' + ") ["
          + commentInfo.userName()
          + "]("
          + commentInfo.userHomePage()
          + ") [link](" + commentInfo.humanUrl() + ")\n";
        const lines = commentInfo.body().split("\n");
        lines.forEach((line: string) => {
          content += ">" + line + "\n";
        });
      } else {
        content += "\n";
      }
    }

    notifier.publishContent(content);
  }
}
