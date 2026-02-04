import { Plan } from './plan';
import { Marketplace } from './marketplace';
import { GatewaySubscription } from './gatewaySubscription';
export interface Subscription {
    serial_number: string;
    name: string;
    term: number;
    seats: number;
    used_seats: number;
    expired_at: number;
    created_at: number;
    updated_at: number;
    key: string;
    version: string;
    plan: Plan;
    admin_email: string;
    status: string;
    marketplace?: Marketplace;
    gateway_subscription?: GatewaySubscription;
}
