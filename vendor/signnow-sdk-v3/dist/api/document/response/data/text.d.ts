export interface Text {
    id: string;
    font: string;
    size: string;
    data: string;
    page_number: string;
    x: string;
    y: string;
    subtype: string;
    created: string;
    align: string;
    is_width_fixed: boolean;
    allow_editing: boolean;
    owner_as_recipient?: boolean | null;
    user_id?: string | null;
    email?: string;
    width?: string;
    height?: string;
    line_height?: number;
    color?: string | null;
    italic?: boolean;
    underline?: boolean;
    bold?: boolean;
    original_font_size?: string | null;
    prefill_content_type?: string | null;
    integration_object_id?: string | null;
}
