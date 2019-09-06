
import * as Octokit from "@octokit/rest";
import { IssueHandler } from "../issue/issue-handler";
import { Issues } from "../issue/issues";
import { Logger } from "../log/logger";
import { Notifier } from "../notify/notifier";
import { IPullRequestHandler } from "../pull-request/pull-request-handler";
import { PullRequests } from "../pull-request/pull-requests";
import { IssueInfo } from "../issue/issue-info";
import { stringify } from "querystring";

/**
 * Manage the Triage Report
 */
export class TriageReport {

    private githubRead: Octokit;
    private githubPush: Octokit;
    private notifier: Notifier;
    private logger: Logger;

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
    }


    public async report(date: Date): Promise<void> {

        // report the notification for the given date

        const afterDate = new Date("03 September 2019 23:00 UTC");

        // check delay of issues (24h, 72h for monday, etc)
        this.logger.debug("Report notifs after date", afterDate);


        // get all issues after this date
        const response = await this.githubRead.paginate(`GET /repos/:owner/:repo/issues?state=all&since=${afterDate.toISOString()}`, { owner: 'eclipse', repo: 'che' });
        this.handleIssues(response, afterDate);
    }

    protected handleIssues(data: any, afterDate: Date): void {
        this.logger.debug("we are in handleNotifications... and array is ", data.length);

        // for each issue, grab details

        const rawIssuesInfos: IssueInfo[] = data.map((issueData: any) => new IssueInfo(issueData, 'che'));

        // remove old created
        const issuesInfos: IssueInfo[] = rawIssuesInfos.filter(issueInfo => new Date(issueInfo.getCreated()).getTime() > afterDate.getTime());

        // only for issues
        const onlyIssuesInfos: IssueInfo[] = issuesInfos.filter(issueInfo => !issueInfo.isPullRequest());

        const opened = onlyIssuesInfos.filter(issueInfo => issueInfo.isOpen()).length;
        const closed = onlyIssuesInfos.filter(issueInfo => issueInfo.isClosed()).length;

        let report = '--------\n';
        report += '## Che issues Triage\n';
        report += '--------\n';
        report += '### Summary\n';

        if (opened > 0) {
            report += `${opened} Opened issues`
        }

        if (closed > 0) {
            if (opened > 0) {
                report += ', ';
            }
            report += `${closed} Closed issues`
        }

        // now report issues per milestone
        report += `\n\n### Severity:\n`


        // create map and add entry per severity
        const severityMap = new Map<string, IssueInfo[]>();
        const unsorted: IssueInfo[] = [];
        severityMap.set("without severity", unsorted);
        onlyIssuesInfos.forEach(issueInfo => {
            const severityLabelInfo = issueInfo.getSeverityLabels().join(' ');
            if (severityLabelInfo !== "") {
                let existingIssuesInfo: IssueInfo[] | undefined = severityMap.get(severityLabelInfo);
                if (!existingIssuesInfo) {
                    existingIssuesInfo = [];

                    severityMap.set(severityLabelInfo, existingIssuesInfo);
                }
                existingIssuesInfo.push(issueInfo);
            } else {
                unsorted.push(issueInfo);
            }
        })

        // sort the map
        const sortedMap = new Map(Array.from(severityMap).sort((a: [string, IssueInfo[]], b: [string, IssueInfo[]]) => { return a[0].localeCompare(b[0]) }));

        // display each milestone if one
        sortedMap.forEach((severityIssuesInfos: IssueInfo[], severityName) => {
            if (severityIssuesInfos.length > 0) {
                report += `\n####   &nbsp;&nbsp;&nbsp; ${severityName}:\n`;
                severityIssuesInfos.sort((a: IssueInfo, b: IssueInfo) => a.number() - b.number()).forEach(severityIssueInfo => {
                    const done = severityIssueInfo.isClosed() ? "X" : " ";

                    // severity
                    const milestoneLabel = severityIssueInfo.milestone();
                    let severityInfo;
                    if (milestoneLabel.length > 0) {
                        severityInfo = `**[${milestoneLabel}]**`;
                    } else {
                        severityInfo = ""
                    }

                    // kind
                    const kindLabels = severityIssueInfo.getKindLabels().map(label => label.substring('kind/'.length));
                    let kindInfo;
                    if (kindLabels.length > 0) {
                        kindInfo = `_[${kindLabels.join(' ')}]_`;
                    } else {
                        kindInfo = ""
                    }
                    

                    report += `- [${done}] [#${severityIssueInfo.number()}](${severityIssueInfo.humanUrl()}) ${kindInfo} ${severityInfo} ${severityIssueInfo.title()}\n`;
                })
            }
        });

        // Displays status informations
        // status/info-needed
        // status/duplicate 

        const wantedLabels = ['status/info-needed', 'status/duplicate'];
        wantedLabels.forEach(wantedLabel => {
            const wantedIssues = onlyIssuesInfos.filter(issueInfo => issueInfo.hasLabel(wantedLabel));
            if (wantedIssues.length > 0) {
                report += `\n\n### ${wantedLabel} label:\n`
                wantedIssues.forEach(wantedIssue => {
                    const done = wantedIssue.isClosed() ? "X" : " ";
                    report += `- [${done}] [#${wantedIssue.number()}](${wantedIssue.humanUrl()}) ${wantedIssue.title()}\n`;
                });
            }
        });



        const onlyPRInfos: IssueInfo[] = issuesInfos.filter(issueInfo => issueInfo.isPullRequest()).sort((a: IssueInfo, b: IssueInfo) => a.number() - b.number());
        if (onlyPRInfos.length > 0) {
            const opened = onlyPRInfos.filter(issueInfo => issueInfo.isOpen()).length;
            const closed = onlyPRInfos.filter(issueInfo => issueInfo.isClosed()).length;
    
            report += `\n\n### Pull Requests:\n`;
            if (opened > 0) {
                report += `${opened} Opened PR`
            }
    
            if (closed > 0) {
                if (opened > 0) {
                    report += ', ';
                }
                report += `${closed} Closed PR`
            }

            report += '\n';

            onlyPRInfos.forEach(issuePRInfo => {
                const done = issuePRInfo.isClosed() ? "X" : " ";
                report += `- [${done}] [#${issuePRInfo.number()}](${issuePRInfo.humanUrl()}) ${issuePRInfo.title()}\n`;
            });
        }

        report += `\n\n--------\n`;


        this.notifier.displayReport(report);
        this.notifier.displayReport("```\n" + report + "```\n");


    }

}
