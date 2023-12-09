import { time } from "console";

const base64Charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
let averageMemoryUsage = process.memoryUsage().heapUsed;

const jsonStringify = (obj) => JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value);

export const Log = (data) => {
  const stackTrace = new Error().stack;
  const stackCall = stackTrace?.split('\n')?.[2]?.trim();
  const stackLine =  stackCall?.split(' ')?.[2];
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
