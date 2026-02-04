import { Radio } from './radio';
export interface Radiobutton {
    page_number: number;
    x: number;
    y: number;
    line_height: number;
    status: number;
    is_printed: number;
    size: number;
    subtype: string;
    name: string;
    font: string;
    radio: Radio[];
    field_id?: string;
}
