import { DisplayJsonAttribute } from './displayJsonAttribute';
export interface FieldValidator {
    id: string;
    name: string;
    regex_expression: string;
    description: string;
    scope: string;
    error_message?: string;
    display_json_attributes?: DisplayJsonAttribute;
    formula_calculation?: string;
}
