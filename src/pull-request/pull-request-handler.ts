import { Actions } from "../action/actions";
import { Notifier } from "../notify/notifier";
import { PullRequestInfo } from "./pull-request-info";

export interface IPullRequestHandler {

  execute(pullRequestInfo: PullRequestInfo, action: Actions, notifier: Notifier): void;

}
