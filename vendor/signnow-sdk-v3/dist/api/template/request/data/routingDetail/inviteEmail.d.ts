export interface InviteEmail {
    email: string;
    subject: string;
    message: string;
    allow_reassign: string;
    expiration_days?: number;
    reminder?: number;
}
