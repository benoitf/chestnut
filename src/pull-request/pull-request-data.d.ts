declare namespace Github {

  export interface IPullRequestDataRepoOwner {
    login: string;
  }

  export interface IPullRequestDataRepo {
    name: string;
    owner: IPullRequestDataRepoOwner;
  }

  export interface IPullRequestDataBase {
    repo: IPullRequestDataRepo;
    ref: string;

  }

  export interface IPullRequestDataUser {
    login: string;
    html_url: string;
    avatar_url: string;
  }

  export interface IPullRequestData {
    merged: boolean;
    number: number;
    base: IPullRequestDataBase;
    user: IPullRequestDataUser;
    merged_by: IPullRequestDataUser;
    html_url: string;
    body: string;
    title: string;
  }

}
