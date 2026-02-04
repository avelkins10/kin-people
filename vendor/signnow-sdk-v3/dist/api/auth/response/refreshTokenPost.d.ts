export interface RefreshTokenPost {
    expires_in: number;
    token_type: string;
    access_token: string;
    refresh_token: string;
    scope: string;
    last_login: number;
}
