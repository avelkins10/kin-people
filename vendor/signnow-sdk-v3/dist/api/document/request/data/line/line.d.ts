export interface Line {
    x: number;
    y: number;
    width: number;
    height: number;
    subtype: string;
    page_number: number;
    fill_color: string;
    line_width: number;
    control_points?: number[];
}
