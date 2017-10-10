import "mocha";
import {PullRequestInfo} from "../../src/pull-request/pull-request-info";
import * as assert from "assert";
import {IssueInfo} from "../../src/issue/issue-info";
import {instance, mock} from "ts-mockito";
import {CommentInfo} from "../../src/comment/comment-info";

describe("Pull Request Info", () => {

  const issueInfo: IssueInfo = instance(mock(IssueInfo));
  const commentInfo: CommentInfo = instance(mock(CommentInfo));
  let pullRequestInfo : PullRequestInfo;

  before(() => {
    var fs = require('fs');
    var contents = fs.readFileSync('./test/pull-request/prdata', 'utf8');
    pullRequestInfo = new PullRequestInfo(JSON.parse(contents), issueInfo, commentInfo);
  });

  it("checkHumanUrl", () => {
    assert.equal(pullRequestInfo.humanUrl(), "https://github.com/eclipse/che/pull/6339");
  });

  it("checkTitle", () => {
    assert.equal(pullRequestInfo.title(), "Add support to VS Code style snippets in code completion");
  });

  it("checkIsMerged", () => {
    assert.equal(pullRequestInfo.isMerged(), true);
  });

  it("checkMergingBranch", () => {
    assert.equal(pullRequestInfo.mergingBranch(), "master");
  });

  it("checkIssueInfo", () => {
    assert.equal(pullRequestInfo.issueInfo(), issueInfo);
  });

  it("checkRepoOwner", () => {
    assert.equal(pullRequestInfo.repoOwner(), "eclipse");
  });

  it("checkRepoName", () => {
    assert.equal(pullRequestInfo.repoName(), "che");
  });

  it("checkNumber", () => {
    assert.equal(pullRequestInfo.number(), 6339);
  });

  it("checkUserName", () => {
    assert.equal(pullRequestInfo.userName(), "tsmaeder");
  });

  it("checkUserAvatarUrl", () => {
    assert.equal(pullRequestInfo.userAvatarUrl(), "https://avatars3.githubusercontent.com/u/13163770?v=4");
  });

  it("checkUserHomePage", () => {
    assert.equal(pullRequestInfo.userHomePage(), "https://github.com/tsmaeder");
  });

  it("checkReferencedIssue", () => {
    assert.equal(pullRequestInfo.getReferencedIssue(), "https://api.github.com/repos/eclipse/che/issues/5365");
  });



});
