export interface EncryptionResult {
  ciphertext: string;
  tag: Buffer;
  iv: string;
}
