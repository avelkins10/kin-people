import { Data } from './data/data';
import { Meta } from './data/meta/meta';
export interface FreeFormInviteGet {
    meta: Meta;
    data?: Data[];
}
