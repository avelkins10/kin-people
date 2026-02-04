export interface Viewer {
    email: string;
    role: string;
    order: number;
    subject: string;
    message: string;
    close_redirect_uri?: string;
    redirect_target?: string;
}
