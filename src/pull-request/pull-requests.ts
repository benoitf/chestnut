import * as GitHub from "github";
import { Actions } from "../action/actions";
import { CommentInfo } from "../comment/comment-info";
import { IssueInfo } from "../issue/issue-info";
import { Logger } from "../log/logger";
import { Notifier } from "../notify/notifier";
import { IPullRequestHandler } from "./pull-request-handler";
import { PullRequestInfo } from "./pull-request-info";
/**
 * Manage the Pull Requests notifications by analyzing and grabbing issue data and comment Data.
 */
export class PullRequests {

  private githubRead: GitHub;
  private githubPush: GitHub;
  private notifier: Notifier;
  private logger: Logger;
  private handlers: IPullRequestHandler[];

  constructor(
    githubRead: GitHub,
    githubPush: GitHub,
    notifier: Notifier,
    logger: Logger,
    handlers: IPullRequestHandler[]) {
    this.githubRead = githubRead;
    this.githubPush = githubPush;
    this.notifier = notifier;
    this.logger = logger;
    this.handlers = handlers;
  }

  public analyze(owner: string, repo: string, pullRequestNumber: number, commentId: string): void {

    if (commentId.length > 0) {
      const params: GitHub.IssuesGetCommentParams = Object.create(null);
      params.owner = owner;
      params.repo = repo;
      params.id = commentId;
      this.githubRead.issues.getComment(params, (err, res) => {
        if (err) {
          this.logger.error("----> unable to get PR comment : ", err);
        } else {
          this.doHandlePullRequest(owner, repo, pullRequestNumber, new CommentInfo(res.data));
        }
      });
    } else {
      this.doHandlePullRequest(owner, repo, pullRequestNumber);
    }

  }

  protected doHandlePullRequest(
    owner: string, repo: string,
    pullRequestNumber: number,
    commentInfo?: CommentInfo | undefined): void {
    const params: GitHub.PullRequestsGetParams = Object.create(null);
    params.owner = owner;
    params.repo = repo;
    params.number = pullRequestNumber;

    this.githubRead.pullRequests.get(params, (err, res) => {
      if (res) {
        const pullRequestData: Github.IPullRequestData = res.data;
        this.completePullRequestData(owner, repo, pullRequestNumber, commentInfo, pullRequestData);
      }
    });
  }

  protected completePullRequestData(
    owner: string,
    repo: string,
    pullRequestNumber: number,
    commentInfo: CommentInfo | undefined,
    pullRequestData: Github.IPullRequestData): void {

    const params: GitHub.IssuesGetParams = Object.create(null);
    params.owner = owner;
    params.repo = repo;
    params.number = pullRequestNumber;

    this.githubRead.issues.get(params, (err: any, res: any) => {

      const issueInfo: IssueInfo = new IssueInfo(res.data);
      const pullRequestInfo: PullRequestInfo = new PullRequestInfo(pullRequestData, issueInfo, commentInfo);
      const actions = new Actions(this.githubPush, this.notifier, pullRequestInfo.repoOwner(),
        pullRequestInfo.repoName(), pullRequestInfo.number());
      this.handlers.forEach((handler: IPullRequestHandler) => handler.execute(pullRequestInfo, actions, this.notifier));
    });
  }
}
