import { BaseClass } from '../../../types/baseClass';
import { Field } from './data/field';
export declare class DocumentPrefillPut implements BaseClass {
    private documentId;
    private fields;
    private queryParams;
    constructor(documentId: string, fields: Field[]);
    getPayload(): Record<string, string | Field[]>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_id: string;
    };
}
