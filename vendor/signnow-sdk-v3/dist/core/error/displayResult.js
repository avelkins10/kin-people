"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayResult = displayResult;
const signNowApiException_1 = require("./signNowApiException");
async function displayResult(result) {
    if (result instanceof Error) {
        if (result instanceof signNowApiException_1.SignNowApiException) {
            try {
                const response = result.getResponse();
                const responseText = await response.text();
                console.error('Error response:', JSON.parse(responseText));
            }
            catch (err) {
                console.error('Error parsing response text:', err instanceof Error ? err.message : err);
            }
        }
        else {
            console.error('Error message:', result.message);
        }
    }
    else {
        console.log('API response:', result);
    }
}
