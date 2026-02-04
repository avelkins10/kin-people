import { JsonAttribute } from './jsonAttribute';
export interface Field {
    id: string;
    type: string;
    role_id: string;
    json_attributes: JsonAttribute;
    role: string;
    originator: string;
    fulfiller?: string | null;
    field_request_id?: string | null;
    field_request_canceled?: string | null;
    element_id?: string | null;
    field_id?: string | null;
    template_field_id?: string | null;
}
