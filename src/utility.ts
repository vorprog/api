import * as crypto from 'node:crypto';
import { IncomingMessage } from 'node:http';
import { PrivateKey, PublicKey } from './config';

const base64Charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
let averageMemoryUsage = process.memoryUsage().heapUsed;

const jsonStringify = (obj) => JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value);

export const VerifyJwt = (token: string) => {
  const parts = token.split('.');
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
  const encryptedSignature = Buffer.from(parts[2], 'base64url');

  if (header.alg === 'ES256') {
    const signature = crypto.createVerify('SHA256');
    signature.update(parts[0] + '.' + parts[1]);
    return signature.verify(PublicKey, encryptedSignature);
  }
}

export const GenerateJwt = (payload: any) => {
  const encodedHeader = Buffer.from(JSON.stringify({ alg: 'ES256', typ: 'JWT' })).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createSign('SHA256');
  signature.update(encodedHeader + '.' + encodedPayload);
  const encryptedSignature = signature.sign(PrivateKey);
  const encodedSignature = Buffer.from(encryptedSignature).toString('base64url');
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export const Log = (data: string | object) => {
  const stackTrace = new Error().stack;
  const stackCall = stackTrace?.split('\n')?.[2]?.trim();
  const stackLine = stackCall?.split(' ')?.[2];
  const stackLineFilePaths = stackLine?.split('/');
  const firstInstanceofSrc = stackLineFilePaths?.indexOf('src');

  const jsonString = jsonStringify({
    c: stackLineFilePaths?.slice(firstInstanceofSrc).join('/'),
    t: new Date().getTime(),
    d: data
  });
  console.log(jsonString);
}

export const ThrowErr = (m: string): never => { throw new Error(m) };

export const SampleMemoryUsage = () => averageMemoryUsage = (averageMemoryUsage + process.memoryUsage().heapUsed) / 2;
export const GetMemoryUsage = () => Math.round(averageMemoryUsage / 1024 / 1024 * 100) / 100

export const encodeBigIntb64v2 = (big: bigint) => {
  let result = "";
  for (let n = big; n > BigInt(0); n >>= BigInt(6)) {
    result = base64Charset[Number(n & BigInt(63))] + result;
  }
  return result;
}

export const decodeBigIntb64v2 = (str: string) => {
  let result = BigInt(0);
  for (let i = 0; i < str.length; i++) {
    result = (result << BigInt(6)) + BigInt(base64Charset.indexOf(str[i]));
  }
  return result;
}

export const GetCountryCIDRs = async (countryCode: string) => {
  const cloudflareChinaIpResponse = await fetch('https://api.cloudflare.com/client/v4/ips?networks=jdcloud');
  const cloudflareChinaIpJson = await cloudflareChinaIpResponse.json();
  const cloudflareChinaIpCidrs = cloudflareChinaIpJson.result.ipv4_cidrs;

  const awsIpResponse = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json'); // TODO
}

export const GetHttpRequestBody = async (request: IncomingMessage) : Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => body += chunk);
    request.on('end', () => resolve(body));
    request.on('error', (error) => reject(error));
  });
};