export interface Hyperlink {
    id: string;
    page_number: string;
    x: string;
    y: string;
    font: string;
    size: string;
    data: string;
    label: string;
    line_height: string;
    original_font_size: string;
    created: string;
    allow_editing: boolean;
    user_id?: string | null;
    email?: string;
}
