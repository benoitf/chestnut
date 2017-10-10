/**
 * Declare definitions of what can be stored in a github comment.
 */
declare namespace Github {

  export interface ICommentDataUser {
    login: string;
    html_url: string;
    avatar_url: string;
  }

  export interface ICommentData {
    body: string;
    user: ICommentDataUser;
    html_url: string;
    id: string;

  }

}
