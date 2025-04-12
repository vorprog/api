import { generateKeyPairSync, createPublicKey } from 'node:crypto';
import * as z from 'zod';

export const AppVersion = process.env.APP_BUILD_VERSION; // injected at build time

const generatePrivateKey = () => {
  const keyPairSyncResult = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  return keyPairSyncResult.privateKey;
}

export const HttpPort = z.number().default(8080).parse(process.env.HTTP_PORT);
export const S3DataBucket = z.string().default("").parse(process.env.S3_DATA_BUCKET);
export const AWSDefaultRegion = z.string().default('us-west-2').parse(process.env.AWS_DEFAULT_REGION);
export const LineByteLength = z.number().default(100).parse(process.env.LINE_BYTE_LENGTH);
export const FileLineLength = z.number().default(100).parse(process.env.PARTITION_LINE_LENGTH);
export const DataS3Bucket = z.string().default('default-bucket').parse(process.env.DATA_S3_BUCKET);
export const PrivateKey = z.string().default(generatePrivateKey()).parse(process.env.RSA_PRIVATE_KEY);
export const PublicKey = createPublicKey(PrivateKey);