import * as Octokit from "@octokit/rest";
import { CronJob } from "cron";
import * as https from "https";
import Hubot = require("hubot");
import { IssueHandler } from "./issue/issue-handler";
import { Logger } from "./log/logger";
import { Notifications } from "./notifications/notifications";
import { Notifier } from "./notify/notifier";
import { IPullRequestHandler } from "./pull-request/pull-request-handler";
import { AddCodeReviewLabelOnPendingPR } from "./tasks/add-code-review-label-on-pending-pr";
import { AddKindFromLinkedIssueOnPendingPR } from "./tasks/add-kind-from-linked-issue-on-pending-pr";
import { AddMilestoneOnMergedPR } from "./tasks/add-milestone-on-merged-pr";
import { AddTargetBranchIfNotMaster } from "./tasks/add-target-branch-if-not-master";
import { AddTriageIssueIfNew } from "./tasks/add-triage-issue-if-new";
import { DisplayPullRequestNotification } from "./tasks/display-pull-request-notification";
import { RemoveCodeReviewLabelOnMergedPR } from "./tasks/remove-code-review-label-on-merged-pr";
import { TriageReport } from "./triage/triage-report";
import { Stale } from "./stale/stale";
import { RemoveLifecycleIfCommented } from "./tasks/remove-lifecycle-if-commented";

export = (robot: Hubot.Robot<void>): void => {
  let cheVersion: string;
  let cheMilestoneNumber: number;
  let addMilestoneCheOnMergedPR: AddMilestoneOnMergedPR;

  const githubReadToken: string = process.env.HUBOT_GITHUB_TOKEN || "";
  if ("" === githubReadToken) {
    throw new Error("Unable to start as HUBOT_GITHUB_TOKEN is missing");
  }
  const githubRead: Octokit = new Octokit({ auth: `token ${githubReadToken}` });

  const githubPushToken: string = process.env.HUBOT_GITHUB_PUSH_TOKEN || "";
  if ("" === githubPushToken) {
    throw new Error("Unable to start as HUBOT_GITHUB_PUSH_TOKEN is missing");
  }
  const githubPush: Octokit = new Octokit({ auth: `token ${githubPushToken}` });

  const notifier: Notifier = new Notifier(robot);
  const logger: Logger = new Logger();
  let notifications: Notifications | null = null;

  check();
  //reportTriage();
  //flagStale();

  async function check(): Promise<void> {
    await grabCheMasterMilestone();
  }

  async function grabCheMasterMilestone(): Promise<void> {

    cheMilestoneNumber = 0;
    // first, get che latest version
    const grabCheVersion: any =
      /<\/parent>[^]*<version>(\d+\.\d+\.\d(?:-.*\d)*)(?:-SNAPSHOT)?<\/version>[^]*<packaging>/gm;

    https.get("https://raw.githubusercontent.com/eclipse/che/master/pom.xml", (resp: any) => {
      let data = "";

      resp.on("data", (chunk: string) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on("end", async () => {

        const parsedVersion = grabCheVersion.exec(data);
        if (parsedVersion) {
          cheVersion = parsedVersion[1];

        }

        const issuesGetMilestonesParams: Octokit.IssuesListMilestonesForRepoParams = {
          owner: "eclipse",
          repo: "che",
        };

        const response: Octokit.Response<Octokit.IssuesListMilestonesForRepoResponse> = await githubRead.issues.listMilestonesForRepo(issuesGetMilestonesParams);
        response.data.forEach((milestone: Octokit.IssuesListMilestonesForRepoResponseItem) => {
          if (milestone.title === cheVersion) {
            cheMilestoneNumber = milestone.number;
          }

        });
        await performCheck();

      });

    }).on("error", (err: any) => {
      logger.error("Error: " + err.message);
    });

  }


  async function reportTriage(): Promise<void> {
   const triageReport = new TriageReport(githubRead, githubPush, notifier, logger);
   triageReport.report(new Date());
  }

  async function flagStale(): Promise<void> {
    const stale = new Stale(githubRead, githubPush, notifier, logger);
    stale.compute();
   }
   

  async function performCheck(): Promise<void> {
    if (notifications === null) {

      let pullRequestHandlers: IPullRequestHandler[] = [];
      const issueHandlers: IssueHandler[] = [];
      const addCodeReviewLabelOnPendingPR: AddCodeReviewLabelOnPendingPR
        = new AddCodeReviewLabelOnPendingPR();
      pullRequestHandlers.push(addCodeReviewLabelOnPendingPR);
      const addKindFromLinkedIssueOnPendingPR: AddKindFromLinkedIssueOnPendingPR
        = new AddKindFromLinkedIssueOnPendingPR(githubRead);
      pullRequestHandlers.push(addKindFromLinkedIssueOnPendingPR);
      addMilestoneCheOnMergedPR = new AddMilestoneOnMergedPR(cheMilestoneNumber);
      pullRequestHandlers.push(addMilestoneCheOnMergedPR);
      const addTargetBranchIfNotMaster: AddTargetBranchIfNotMaster
        = new AddTargetBranchIfNotMaster();
      pullRequestHandlers.push(addTargetBranchIfNotMaster);
      const displayPullRequestNotification: DisplayPullRequestNotification
        = new DisplayPullRequestNotification();
      pullRequestHandlers.push(displayPullRequestNotification);
      const removeCodeReviewLabelOnMergedPR: RemoveCodeReviewLabelOnMergedPR
        = new RemoveCodeReviewLabelOnMergedPR();
      pullRequestHandlers.push(removeCodeReviewLabelOnMergedPR);

      const addTriageIssueIfNew = new AddTriageIssueIfNew();
      issueHandlers.push(addTriageIssueIfNew);
      const removeLifecycleIfCommented = new RemoveLifecycleIfCommented(githubRead, githubPush);
      issueHandlers.push(removeLifecycleIfCommented);


      notifications = new Notifications(githubRead, githubPush, notifier, logger, pullRequestHandlers, issueHandlers);

    } else {
      addMilestoneCheOnMergedPR.updateMilestoneNumber(cheMilestoneNumber);
    }
    await notifications.check();
  }

  const pattern = "*/2 * * * *";
  const timezone = "Europe/Paris";
  const job: CronJob = new CronJob(pattern, () => {
    try {
      check();
    } catch (err) {
      console.log('error on check', err);
    }
  }, () => undefined, false, timezone, null, true);
  job.start();

};
