
import * as Octokit from "@octokit/rest";
import { isUndefined } from "util";
import { CommentInfo } from "../comment/comment-info";
import { IssueInfo } from "../issue/issue-info";
export class PullRequestInfo {

  private pullRequestData: Octokit.PullsGetResponse;
  private issueData: IssueInfo;
  private commentData: CommentInfo | undefined;

  constructor(pullRequestData: Octokit.PullsGetResponse, issueData: IssueInfo, commentInfo?: CommentInfo | undefined) {
    this.pullRequestData = pullRequestData;
    this.issueData = issueData;
    this.commentData = commentInfo;
  }

  public title(): string {
    return this.pullRequestData.title;
  }

  public isMerged(): boolean {
    return this.pullRequestData.merged;
  }

  public mergingBranch(): string {
    return this.pullRequestData.base.ref;
  }

  public issueInfo(): IssueInfo {
    return this.issueData;
  }

  public commentInfo(): CommentInfo | null {
    return isUndefined(this.commentData) ? null : this.commentData;
  }

  public repoOwner(): string {
    return this.pullRequestData.base.repo.owner.login;
  }

  public repoName(): string {
    return this.pullRequestData.base.repo.name;
  }

  public number(): number {
    return this.pullRequestData.number;
  }

  public userName(): string {
    return this.pullRequestData.user.login;
  }
  public userAvatarUrl(): string {
    return this.pullRequestData.user.avatar_url;
  }

  public userHomePage(): string {
    return this.pullRequestData.user.html_url;
  }

  public mergedByUserName(): string {
    return this.pullRequestData.merged_by.login;
  }
  public mergedByUserAvatarUrl(): string {
    return this.pullRequestData.merged_by.avatar_url;
  }

  public mergedByUserHomePage(): string {
    return this.pullRequestData.merged_by.html_url;
  }

  public humanUrl(): string {
    return this.pullRequestData.html_url;
  }

  public getReferencedIssue(): string {

    const regex: RegExp = /### What issues does this PR fix or reference\?[\s\S]*?#(\d*)/gm;
    let referenceAnIssue = regex.exec(this.pullRequestData.body);
    if (referenceAnIssue !== null && referenceAnIssue.length > 0 && referenceAnIssue[1].length > 0) {
      return "https://api.github.com/repos/" + this.repoOwner()
        + "/" + this.repoName() + "/issues/" + referenceAnIssue[1];
    }
    const regex2: RegExp =
      /### What issues does this PR fix or reference\?[^]*(https:\/\/github\.com\/(.*)\/issues\/(\d*))[^]*/gm;
    referenceAnIssue = regex2.exec(this.pullRequestData.body);
    if (referenceAnIssue !== null) {
      return "https://api.github.com/repos/" + referenceAnIssue[2] + "/issues/" + referenceAnIssue[3];
    }

    const regex3: RegExp =
      /### What issues does this PR fix or reference\?[^]*(https:\/\/github\.com\/(.*)\/pull\/(\d*))[^]*/gm;
    referenceAnIssue = regex3.exec(this.pullRequestData.body);
    if (referenceAnIssue !== null) {
      return "https://api.github.com/repos/" + referenceAnIssue[2] + "/issues/" + referenceAnIssue[3];
    }

    return "";

  }

}
