export interface Plan {
    id: number;
    plan_id: string;
    name: string;
    price: string;
    billing_cycle: number;
    active: boolean;
    groups: string[];
    level: string;
    type: string;
    api_requests: number;
    unit_price: number;
    is_trial: boolean;
    is_marketplace: boolean;
}
