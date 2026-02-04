export interface IntegrationObject {
    x: number;
    y: number;
    size: number;
    width: number;
    height: number;
    page_number: number;
    font: string;
    data: string;
    status: number;
    color: string;
    created: number;
    active: boolean;
    line_height: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    field_id?: string;
    api_integration_id?: string | null;
}
