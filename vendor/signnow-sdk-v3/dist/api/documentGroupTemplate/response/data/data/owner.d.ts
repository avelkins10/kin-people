import { Organization } from './organization';
export interface Owner {
    id: string;
    email: string;
    organization: Organization;
}
