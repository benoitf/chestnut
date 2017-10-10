import { CronJob } from "cron";
import * as GitHub from "github";
import * as https from "https";
import Hubot = require("hubot");
import { Logger } from "./log/logger";
import { Notifications } from "./notifications/notifications";
import { Notifier } from "./notify/notifier";
import { IPullRequestHandler } from "./pull-request/pull-request-handler";
import { AddCodeReviewLabelOnPendingPR } from "./tasks/add-code-review-label-on-pending-pr";
import { AddKindFromLinkedIssueOnPendingPR } from "./tasks/add-kind-from-linked-issue-on-pending-pr";
import { AddMilestoneOnMergedPR } from "./tasks/add-milestone-on-merged-pr";
import { AddTargetBranchIfNotMaster } from "./tasks/add-target-branch-if-not-master";
import { DisplayPullRequestNotification } from "./tasks/display-pull-request-notification";
import { RemoveCodeReviewLabelOnMergedPR } from "./tasks/remove-code-review-label-on-merged-pr";

export = (robot: Hubot.Robot): void => {

  let cheVersion: string;
  let cheMilestoneNumber: number;
  let che6Version: string;
  let che6MilestoneNumber: number;
  let addMilestoneCheOnMergedPR: AddMilestoneOnMergedPR;

  const githubRead: GitHub = new GitHub();
  const githubReadToken: string = process.env.HUBOT_GITHUB_TOKEN || "";
  if ("" === githubReadToken) {
    throw new Error("Unable to start as HUBOT_GITHUB_TOKEN is missing");
  }
  githubRead.authenticate({
    token: githubReadToken,
    type: "oauth",
  });

  const githubPush: GitHub = new GitHub();
  const githubPushToken: string = process.env.HUBOT_GITHUB_PUSH_TOKEN || "";
  if ("" === githubPushToken) {
    throw new Error("Unable to start as HUBOT_GITHUB_PUSH_TOKEN is missing");
  }
  githubPush.authenticate({
    token: githubPushToken,
    type: "oauth",
  });

  const notifier: Notifier = new Notifier(robot);
  const logger: Logger = new Logger();
  let notifications: Notifications | null = null;

  function check(): void {
    grabCheMasterMilestone();
  }

  function grabCheMasterMilestone(): void {
    // first, get che latest version

    const grabCheVersion: any = /<\/parent>[^]*<version>(\d+\.\d+\.\d)(?:-.*)?<\/version>[^]*<packaging>/gm;

    https.get("https://raw.githubusercontent.com/eclipse/che/master/pom.xml", (resp: any) => {
      let data = "";

      resp.on("data", (chunk: string) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on("end", () => {

        const parsedVersion = grabCheVersion.exec(data);
        if (parsedVersion) {
          cheVersion = parsedVersion[1];

        }

        const issuesGetMilestonesParams: GitHub.IssuesGetMilestonesParams = Object.create(null);
        issuesGetMilestonesParams.owner = "eclipse";
        issuesGetMilestonesParams.repo = "che";

        githubRead.issues.getMilestones(issuesGetMilestonesParams, (err: any, res: any) => {
          if (res) {

            let foundMilestone: boolean = false;
            const milestonesData = res.data;
            milestonesData.forEach((milestone: any) => {
              if (milestone.title === cheVersion) {
                foundMilestone = true;
                cheMilestoneNumber = parseInt(milestone.number);
              }

            });

            if (foundMilestone) {
              grabChe6Milestone();
            }
          }

        });

      });

    }).on("error", (err: any) => {
      logger.error("Error: " + err.message);
    });

  }

  function grabChe6Milestone(): void {
    // first, get che latest version

    const grabChe6Version: any =
      /<\/parent>[^]*<version>(\d+\.\d+\.\d(?:-.*\d)*)(?:-SNAPSHOT)?<\/version>[^]*<packaging>/gm;

    https.get("https://raw.githubusercontent.com/eclipse/che/che6/pom.xml", (resp: any) => {
      let data = "";

      resp.on("data", (chunk: string) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on("end", () => {

        const parsedVersion = grabChe6Version.exec(data);
        if (parsedVersion) {
          che6Version = parsedVersion[1];

        }

        const issuesGetMilestonesParams: GitHub.IssuesGetMilestonesParams = Object.create(null);
        issuesGetMilestonesParams.owner = "eclipse";
        issuesGetMilestonesParams.repo = "che";

        githubRead.issues.getMilestones(issuesGetMilestonesParams, (err: any, res: any) => {
          if (res) {

            let foundMilestone: boolean = false;
            const milestonesData = res.data;
            milestonesData.forEach((milestone: any) => {
              if (milestone.title === che6Version) {
                foundMilestone = true;
                che6MilestoneNumber = parseInt(milestone.number);
              }

            });

            if (foundMilestone) {
              performCheck();
            }
          }

        });

      });

    }).on("error", (err: any) => {
      logger.error("Error: " + err.message);
    });

  }

  function performCheck(): void {
    if (notifications === null) {

      const pullRequestHandlers: IPullRequestHandler[] = [];
      const addCodeReviewLabelOnPendingPR: AddCodeReviewLabelOnPendingPR
        = new AddCodeReviewLabelOnPendingPR();
      pullRequestHandlers.push(addCodeReviewLabelOnPendingPR);
      const addKindFromLinkedIssueOnPendingPR: AddKindFromLinkedIssueOnPendingPR
        = new AddKindFromLinkedIssueOnPendingPR(githubRead);
      pullRequestHandlers.push(addKindFromLinkedIssueOnPendingPR);

      addMilestoneCheOnMergedPR = new AddMilestoneOnMergedPR(cheMilestoneNumber, che6MilestoneNumber);
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

      notifications = new Notifications(githubRead, githubPush, notifier, logger, pullRequestHandlers);

    } else {
      addMilestoneCheOnMergedPR.updateMilestoneNumber(cheMilestoneNumber, che6MilestoneNumber);
    }
    notifications.check();
  }

  const pattern = "*/10 * * * *";
  const timezone = "Europe/Paris";
  const job: CronJob = new CronJob(pattern, () => {
    check();
  }, () => undefined, false, timezone, null, true);
  job.start();

};
