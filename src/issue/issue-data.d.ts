/**
 * Declare definitions of what can be stored in a github issue.
 */
declare namespace Github {

  export interface IssueDataMilestone {
    title: string;
  }

  export interface IssueDataLabel {
    name: string;
  }

  export interface IssueData {
    labels: IssueDataLabel[];
    milestone: IssueDataMilestone;
    number: number;
    html_url: string;

  }

}
