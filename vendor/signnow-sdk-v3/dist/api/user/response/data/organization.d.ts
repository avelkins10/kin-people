import { Domain } from './domain';
import { Logo } from './logo';
import { ActiveLogo } from './activeLogo';
import { Team } from './team';
export interface Organization {
    is_admin: boolean;
    is_superadmin: boolean;
    is_workspace: boolean;
    id?: string;
    name?: string;
    deleted?: string;
    created?: string;
    updated?: string;
    domains?: Domain[];
    logos?: Logo[];
    active_logo?: ActiveLogo[];
    teams?: Team[];
}
