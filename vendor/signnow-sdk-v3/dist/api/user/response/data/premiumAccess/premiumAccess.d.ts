import { User } from './user';
import { Subscription } from './subscription';
import { Api } from './api';
export interface PremiumAccess {
    subscription: Subscription;
    api: Api;
    error?: boolean;
    user?: User;
    active?: boolean;
    plan?: string;
    business?: boolean;
    trial?: boolean;
    credit_card?: boolean;
}
