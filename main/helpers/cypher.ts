import crypto from "crypto";

export interface CypherData {
  iv: string;
  encryptedData: string;
}

export default class Cypher {
  private algorithm: string = "aes-256-cbc";
  private key: Buffer = Buffer.from("pXHriPqFLi5zJU37698Qn6NmvHM3Fj4b");
  private iv: Buffer = crypto.randomBytes(16);

  encrypt(secret: string): CypherData {
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.key),
      this.iv
    );

    let encrypted = cipher.update(secret);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const data: CypherData = {
      iv: this.iv.toString("hex"),
      encryptedData: encrypted.toString("hex"),
    };

    return data;
  }

  decrypt(cypherData: CypherData): string {
    if (!cypherData) {
      return null;
    }

    const iv = Buffer.from(cypherData.iv, "hex");
    const encryptedData = Buffer.from(cypherData.encryptedData, "hex");

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.key),
      iv
    );

    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const secret = decrypted.toString();

    return secret;
  }
}
