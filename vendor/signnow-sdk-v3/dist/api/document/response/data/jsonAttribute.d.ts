export interface JsonAttribute {
    page_number: number;
    x: number;
    y: number;
    width: number;
    height: number;
    required: boolean;
    name?: string;
    label?: string;
    bold?: boolean;
    underline?: boolean;
    max_lines?: number;
    validator_id?: string;
}
