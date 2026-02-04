import { Action } from './action';
export interface Step {
    id: string;
    status: string;
    order: number;
    actions: Action[];
}
