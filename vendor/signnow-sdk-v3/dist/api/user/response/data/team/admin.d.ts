export interface Admin {
    id: string;
    is_secondary: string;
    email: string;
    billing: number;
    document_access: number;
    primary: boolean;
}
