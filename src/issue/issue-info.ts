import * as Octokit from "@octokit/rest";
/**
 * Info is a high level of the underlying data associated to an issue.
 */
export class IssueInfo {

  private issueData: Octokit.IssuesGetResponse;
  private repoName: string;

  constructor(issueData: Octokit.IssuesGetResponse, repoName: string) {
    this.issueData = issueData;
    this.repoName = repoName;
  }

  public repositoryName(): string {
    return this.repoName;
  }

  public number(): number {
    return this.issueData.number;
  }

  // labels
  public labels(): string[] {
    const labels: string[] = [];
    if (this.issueData.labels) {
      this.issueData.labels.forEach((label: any) => {
        labels.push(label.name);
      });
    }
    return labels;
  }

  public humanUrl(): string {
    return this.issueData.html_url;
  }

  public milestone(): string {
    // milestone
    let milestone: string;
    if (this.issueData.milestone) {
      milestone = this.issueData.milestone.title;
    } else {
      milestone = "";
    }
    return milestone;
  }

  public hasMatchingLabel(labelName: string): boolean {
    let labelFound: boolean = false;

    this.labels().forEach((label) => {
      if (label.lastIndexOf(labelName + "/") === 0) {
        labelFound = true;
      }
    });
    return labelFound;

  }

  public hasLabel(labelName: string): boolean {
    return this.labels().indexOf(labelName) > -1;
  }

  public getLabels(labelNamePrefix: string): string[] {
    const matchingLabels: string[] = [];
    this.labels().forEach((label) => {
      if (label.lastIndexOf(labelNamePrefix + "/") === 0) {
        matchingLabels.push(label);
      }
    });
    return matchingLabels;

  }

  public getKindLabels(): string[] {
    return this.getLabels("kind");
  }

  public hasStatus(): boolean {
    return this.hasMatchingLabel("status");

  }

  public hasKind(): boolean {
    return this.hasMatchingLabel("kind");

  }

  public isTargetBranch(): boolean {
    return this.labels().indexOf("target/branch") > -1;
  }

  public isClosed(): boolean {
    return this.issueData.state === "closed";
  }

  public getCreated(): number {
    return new Date(this.issueData.created_at).getTime();
  }

}
