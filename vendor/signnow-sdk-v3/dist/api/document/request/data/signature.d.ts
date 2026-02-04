export interface Signature {
    x: number;
    y: number;
    width: number;
    height: number;
    page_number: number;
    data: string;
    subtype?: string;
    signature_request_id?: string;
    field_id?: string;
    signing_reason?: string;
    owner_as_recipient?: boolean;
}
