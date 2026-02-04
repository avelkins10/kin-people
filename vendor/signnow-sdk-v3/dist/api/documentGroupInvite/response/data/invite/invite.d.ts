import { Step } from './step';
export interface Invite {
    id: string;
    status: string;
    steps: Step[];
}
