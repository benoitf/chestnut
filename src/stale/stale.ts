
import * as Octokit from "@octokit/rest";
import { IssueHandler } from "../issue/issue-handler";
import { Issues } from "../issue/issues";
import { Logger } from "../log/logger";
import { Notifier } from "../notify/notifier";
import { IPullRequestHandler } from "../pull-request/pull-request-handler";
import { PullRequests } from "../pull-request/pull-requests";
import { IssueInfo } from "../issue/issue-info";
import { stringify } from "querystring";
import { Actions } from "../action/actions";
import { FlagStaleIssue } from "../tasks/flag-stale-issue";

/**
 * Manage the stale issues
 */
export class Stale {

    private githubRead: Octokit;
    private githubPush: Octokit;
    private notifier: Notifier;
    private logger: Logger;

    private CHECK_STALE_DAYS = 180;
    private ROT_AFTER_STALE_DAYS = 7;
    private BT = '`';
    
    private issueHandlers: IssueHandler[] = [];

    private readonly STALE_MESSAGE = `Issues go stale after ${this.BT}${this.CHECK_STALE_DAYS}${this.BT} days of inactivity.\n ${this.BT}lifecycle/stale${this.BT} issues rot after an additional ${this.BT}${this.ROT_AFTER_STALE_DAYS}${this.BT} days of inactivity and eventually close.\nMark the issue as fresh with /remove-lifecycle stale.\nIf this issue is safe to close now please do so.\n\nAdd ${this.BT}lifecycle/frozen${this.BT} label to not flag this issue as being stale.`
    
    constructor(
        githubRead: Octokit,
        githubPush: Octokit,
        notifier: Notifier,
        logger: Logger,
    ) {
        this.githubRead = githubRead;
        this.githubPush = githubPush;
        this.notifier = notifier;
        this.logger = logger;
        this.issueHandlers.push(new FlagStaleIssue(this.STALE_MESSAGE));
    }


    public async compute(): Promise<void> {

        // compute 180 days from now in the past
        const beforeDate = new Date();
        beforeDate.setDate(beforeDate.getDate() - this.CHECK_STALE_DAYS);
        
        const simpleDate = beforeDate.toISOString().substring(0, 10);
        // check delay of issues (24h, 72h for monday, etc)
        this.logger.debug("Stale before date", simpleDate);

        // get all issues not updated since this date and that are not in frozen state

        const options = this.githubRead.search.issuesAndPullRequests.endpoint.merge({
            q: `repo:eclipse/che state:open updated:<=${simpleDate} -label:lifecycle/frozen`,
            sort: 'created',
            order: 'asc',
            per_page: 100,
          });


        //this.logger.debug('Request is' + `GET /search/issues?q=repo%3Aeclipse%2Fche+is:issue+updated%3A%3C%3D${simpleDate}+-label%3Alifecycle%2Ffrozen+state:open&sort=created&order=asc`);
        const response = await this.githubRead.paginate(options);
        this.handleStaleIssues(response, beforeDate);
    }

    protected handleStaleIssues(data: any, beforeDate: Date): void {
        this.logger.debug("we are in handleStaleIssues... and array is ", data.length);

        // ok so now for each issue, need to flag it as stale and add label on it

        // for now, only took first 5 issues
        const updatedData = data;
        if (updatedData.length > 1) {
            updatedData.length = 1;
        }

        this.logger.debug("we are in handleStaleIssues... and updatedData array is ", updatedData.length);

        // for each issue, grab details
        const issuesInfos: IssueInfo[] = data.map((issueData: any) => new IssueInfo(issueData, 'che'));

        issuesInfos.forEach(issueInfo => {
            // flag
            const actions = new Actions(this.githubPush, this.notifier, 'eclipse', 'che', issueInfo.number());
            this.issueHandlers.forEach((handler: IssueHandler) => handler.execute(issueInfo, actions, this.notifier));
        });

    }

}
