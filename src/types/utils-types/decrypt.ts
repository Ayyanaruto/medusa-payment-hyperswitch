export interface DecryptionInput {
  key: string;
  ciphertext: string;
  tag: string;
  iv: string;
}