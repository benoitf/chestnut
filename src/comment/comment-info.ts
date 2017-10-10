/**
 * Info is a high level of the underlying data associated to an issue.
 */
export class CommentInfo {

  private commentData: Github.ICommentData;

  constructor(commentData: Github.ICommentData) {
    this.commentData = commentData;
  }

  public humanUrl(): string {
    return this.commentData.html_url;
  }

  public userName(): string {
    return this.commentData.user.login;
  }
  public userAvatarUrl(): string {
    return this.commentData.user.avatar_url;
  }

  public userHomePage(): string {
    return this.commentData.user.html_url;
  }

  public id(): string {
    return this.commentData.id;
  }

  public body(): string {
    return this.commentData.body;
  }

}
