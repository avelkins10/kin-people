export interface Line {
    id: string;
    page_number: string;
    subtype: string;
    x: string;
    y: string;
    width: string;
    height: string;
    line_width: string;
    control_points: number[];
    created: string;
    allow_editing: boolean;
    user_id?: string | null;
    email?: string;
    fill_color?: string | null;
}
