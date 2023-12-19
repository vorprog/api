import { generateKeyPairSync, createPublicKey } from 'node:crypto';
import * as z from 'zod';

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
export const LineByteLength = z.number().default(100).parse(process.env.LINE_BYTE_LENGTH);
export const PartitionLineLength = z.number().default(100).parse(process.env.PARTITION_LINE_LENGTH);
export const MsEpochReservationLimit = z.number().default(1000).parse(process.env.MS_EPOCH_RESERVATION_LIMIT);
export const DataS3Bucket = z.string().default('default-bucket').parse(process.env.DATA_S3_BUCKET);
export const PrivateKey = z.string().default(generatePrivateKey()).parse(process.env.RSA_PRIVATE_KEY);
export const PublicKey = createPublicKey(PrivateKey);