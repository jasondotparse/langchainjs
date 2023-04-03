/* eslint-disable tree-shaking/no-side-effects-in-initialization */
import { test, jest } from '@jest/globals';
import fs from 'fs';
import { S3Loader } from '../s3.js';

const fsMock = {
  ...fs,
  mkdtempSync: jest.fn().mockReturnValue('/tmp/s3fileloader-12345'),
  mkdirSync: jest.fn().mockImplementation(() => {
    console.log('Mock mkdirSync invoked');
  }),
  writeFileSync: jest.fn().mockImplementation(() => {
    console.log('Mock writeFileSync invoked');
  }),
};

const UnstructuredLoaderMock = jest.fn().mockImplementation(() => ({
  load: jest.fn().mockImplementation(() => ['fake document']),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation(() => ({
      Body: {
        on: jest.fn().mockImplementation((event: any, callback: any) => {
          if (event === 'data') {
            callback(Buffer.from('Mock file content'));
          } else if (event === 'end') {
            callback(undefined);
          }
        }),
        pipe: jest.fn(),
      }
    }))
  })),
  GetObjectCommand: jest.fn(),
}));

test('Test S3 loader', async () => {
  const loader = new S3Loader(
    "test-bucket-123", 
    "AccountingOverview.pdf", 
    "http://localhost:8000/general/v0/general",
    fsMock as any,
    UnstructuredLoaderMock as any
  );

  const result = await loader.load();

  expect(fsMock.mkdtempSync).toHaveBeenCalled();
  expect(fsMock.mkdirSync).toHaveBeenCalled();
  expect(fsMock.writeFileSync).toHaveBeenCalled();
  expect(UnstructuredLoaderMock).toHaveBeenCalledWith(
    "http://localhost:8000/general/v0/general", 
    "/tmp/s3fileloader-12345/AccountingOverview.pdf"
  );
  expect(result).toEqual(['fake document']);
});
