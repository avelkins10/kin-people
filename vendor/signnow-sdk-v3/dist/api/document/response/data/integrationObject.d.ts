import { JsonAttribute } from './jsonAttribute';
export interface IntegrationObject {
    id: string;
    page_number: string;
    font: string;
    size: string;
    data: string;
    x: string;
    y: string;
    json_attributes: JsonAttribute;
    line_height: number;
    user_id?: string | null;
    email?: string | null;
    api_integration_id?: string | null;
    created?: string;
    allow_editing?: boolean;
    width?: string;
    height?: string;
}
