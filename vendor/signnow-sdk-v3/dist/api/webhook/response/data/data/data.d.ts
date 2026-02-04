import { JsonAttribute } from './jsonAttribute';
import { Content } from './content';
export interface Data {
    id: string;
    event: string;
    entity_id: number;
    action: string;
    json_attributes: JsonAttribute;
    created: number;
    content?: Content;
}
