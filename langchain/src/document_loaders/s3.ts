import fs from 'fs';
import path from 'path';
import os from 'os';
import { BaseDocumentLoader } from "./base.js";
import { UnstructuredLoader } from './unstructured.js';
// import { UnstructuredLoader } from "./unstructured.js";

export class S3Loader extends BaseDocumentLoader {
  bucket: string;

  key: string;

  unstructuredAPIUrl: string;

  constructor(bucket: string, key: string, unstructuredAPIUrl: string) {
    super();
    this.unstructuredAPIUrl = unstructuredAPIUrl;
    this.bucket = bucket;
    this.key = key;
  }

  async load() {
    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3' as any);

      const s3Client = new S3Client();

      const getObjectCommand = new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.key,
      });

      const response = await s3Client.send(getObjectCommand);

      const objectData = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        response.Body.on("data", (chunk: any) => chunks.push(chunk));
        response.Body.on("end", () => resolve(Buffer.concat(chunks)));
        response.Body.on("error", reject);
      });

      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 's3fileloader-'));

      const filePath = path.join(tempDir, this.key);

      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      fs.writeFileSync(
        filePath, 
        objectData
      );

      console.log(`Downloaded file ${this.key} from S3 bucket ${this.bucket} to ${filePath}`);

      const unstructuredLoader = new UnstructuredLoader(
        this.unstructuredAPIUrl,
        filePath
      );

      const docs = await unstructuredLoader.load();

      return docs;
    } catch (e) {
      console.error(e);
      throw new Error(
        "Failed to load aws-sdk'. Please install it with eg. `npm install aws-sdk'`."
      );
    }
  }
}