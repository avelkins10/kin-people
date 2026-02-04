import { Response } from 'node-fetch';
export declare class SignNowApiException extends Error {
    private response;
    constructor(message: string, response: Response);
    getResponse(): Response;
}
