import { BaseClass } from '../../../types/baseClass';
import { Field } from './data/field';
import { Line } from './data/line/line';
import { Check } from './data/check';
import { Radiobutton } from './data/radiobutton/radiobutton';
import { Signature } from './data/signature';
import { Text } from './data/text';
import { Attachment } from './data/attachment';
import { Hyperlink } from './data/hyperlink';
import { IntegrationObject } from './data/integrationObject';
import { DeactivateElement } from './data/deactivateElement';
export declare class DocumentPut implements BaseClass {
    private documentId;
    private fields;
    private lines;
    private checks;
    private radiobuttons;
    private signatures;
    private texts;
    private attachments;
    private hyperlinks;
    private integrationObjects;
    private deactivateElements;
    private documentName;
    private clientTimestamp;
    private queryParams;
    constructor(documentId: string, fields: Field[], lines?: Line[], checks?: Check[], radiobuttons?: Radiobutton[], signatures?: Signature[], texts?: Text[], attachments?: Attachment[], hyperlinks?: Hyperlink[], integrationObjects?: IntegrationObject[], deactivateElements?: DeactivateElement[], documentName?: string | null, clientTimestamp?: string);
    getPayload(): Record<string, string | Field[] | Line[] | Check[] | Radiobutton[] | Signature[] | Text[] | Attachment[] | Hyperlink[] | IntegrationObject[] | DeactivateElement[] | null>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_id: string;
    };
}
