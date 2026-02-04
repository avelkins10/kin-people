import { RequestHeader } from './requestHeader';
import { RequestContent } from './requestContent';
export interface Data {
    id: string;
    application_name: string;
    entity_id: string;
    entity_type: string;
    event_subscription_id: string;
    event_subscription_active: boolean;
    event_name: string;
    callback_url: string;
    request_method: string;
    duration: number;
    request_start_time: number;
    request_end_time: number;
    request_content: RequestContent;
    response_content: string;
    response_status_code: number;
    request_headers?: RequestHeader;
}
