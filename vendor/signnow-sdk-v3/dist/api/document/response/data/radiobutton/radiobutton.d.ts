import { Radio } from './radio';
export interface Radiobutton {
    id: string;
    user_id: string;
    name: string;
    server_created_timestamp: string;
    x: string;
    y: string;
    size: string;
    line_height: string;
    page_number: string;
    is_printed: boolean;
    font: string;
    original_font_size: string;
    radio: Radio[];
}
