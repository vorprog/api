import { S3Client, S3, Bucket, ListObjectsCommand, GetObjectCommand, UploadPartCommand } from '@aws-sdk/client-s3';
import { FileHandle, open, watch } from 'node:fs/promises'

import { S3DataBucket, AWSDefaultRegion, FileLineLength } from './config';
import { Log, compress, uncompress } from "./utility";
import { WriteLine, ReadLine } from './writer';

type DataFile = {
  file: FileHandle;
  rowRanges: Array<[number, number]>;
}

const data = {
  files: {
    users: [] as Array<DataFile>,
    events: [] as Array<DataFile>,
    sessions: [] as Array<DataFile>,
  } as Record<string, Array<DataFile>>,
}

const s3 = new S3({ region: AWSDefaultRegion });

const downloadFiles = async () => {
  const response = await s3.listObjectsV2({ Bucket: S3DataBucket });

  for (const s3Object of response.Contents) {
    const response = await s3.getObject({
      Bucket: S3DataBucket,
      Key: s3Object.Key,
    })
    const compressedContent = await response.Body.transformToString();
    const content = await uncompress(compressedContent);

    const file = await open(`./data/${s3Object.Key}`, 'w+', 0o666);
    await file.write(content);

    const filenameParts = s3Object.Key.split('.')[0].split('_');
    const prefix = filenameParts[0];
    const dataFiles = data.files[prefix];

    if (parseInt(filenameParts[1]) !== dataFiles.length)
      throw new Error(`Expected ${prefix}_${filenameParts[1]}, but got ${s3Object.Key}`);

    dataFiles.push({ file, rowRanges: [] });
  }
}

const createFiles = async () => {
  for (const prefix of Object.keys(data.files))
    if (data.files[prefix].length === 0) {
      const file = await open(`./data/${prefix}_0.csv`, 'w+', 0o666);
      await WriteLine({ file, row: 0, data: {} });
      data.files[prefix].push({ file, rowRanges: [] });
    }
}

const watchFileChanges = async () => {
  const asyncIterable = watch('./data', { recursive: true });

  for await (const fileChangeInfo of asyncIterable) {
    const filenameParts = fileChangeInfo.filename.split('.')[0].split('_');
    const prefix = filenameParts[0];
    const fileIndex = parseInt(filenameParts[1]);
    const file = data.files[prefix][fileIndex].file

    const content = await file.readFile({ encoding: 'utf-8' });
    const compressedContent = await compress(content);
    const uploadCommandOutput = await s3.copyObject({
      Bucket: S3DataBucket,
      Key: fileChangeInfo.filename,
      CopySource: fileChangeInfo.filename,
      // TODO: need a proper upload command
    })

    if (uploadCommandOutput.$metadata.httpStatusCode !== 200)
      Log({ error: [, uploadCommandOutput.$metadata] });

    Log({ s3_upload: uploadCommandOutput.$metadata });
  }
}

export const init = async () => {
  await downloadFiles();
  await createFiles();
  watchFileChanges();
}
