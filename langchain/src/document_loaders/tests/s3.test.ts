import { test, jest } from '@jest/globals';
import { S3Loader } from '../s3.js';

jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation(() => ({
          Body: {
            on: jest.fn().mockImplementation((event: any, callback: any) => {
              if (event === 'data') {
                console.log('Mocking S3 file download... chunk received');
                callback(Buffer.from('Mock file content'));
              } else if (event === 'end') {
                console.log('Mocking S3 file download... end');
                callback(undefined);
              }
            }),
            pipe: jest.fn(),
          }
        }))
    })),
    GetObjectCommand: jest.fn(),
  })
);

test('Test S3 loader', async () => {
  const loader = new S3Loader(
    "test-bucket-123", 
    "AccountingOverview.pdf", 
    "http://localhost:8000/general/v0/general"
  );
  await loader.load();
});
