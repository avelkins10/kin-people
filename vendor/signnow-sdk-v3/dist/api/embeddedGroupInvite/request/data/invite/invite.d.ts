import { Signer } from './signer';
export interface Invite {
    order: number;
    signers: Signer[];
}
