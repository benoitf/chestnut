import { Actions } from "../action/actions";
import { Notifier } from "../notify/notifier";
import { IssueInfo } from "./issue-info";

export interface IssueHandler {

  execute(issueInfo: IssueInfo, action: Actions, notifier: Notifier): void;

}
