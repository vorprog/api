const startTimestamp = new Date();

import { isMainThread, parentPort, workerData, threadId, Worker } from 'node:worker_threads';
import * as fs from 'node:fs';
import { faker } from '@faker-js/faker';

// import * as z from 'zod';
// import { times } from 'lodash';
// import S3 from 'aws-sdk/clients/s3';

const lineByteLength = 100;
const partitionLineLength = 100;
const msEpochReservations: { [key: number]: number } = {};
const msEpochReservationLimit = 1000;
let averageMemoryUsage = process.memoryUsage().heapUsed;

const _throw = (m: string): never => { throw new Error(m) };
const sampleMemoryUsage = () => averageMemoryUsage = (averageMemoryUsage + process.memoryUsage().heapUsed) / 2;

const attemptReserveId = (p?: { millisecondEpoch?: number, attempt?: number, maxAttempts?: number }): bigint | boolean => {
  const ms = p?.millisecondEpoch || new Date().getTime();
  if (msEpochReservations[ms] === undefined) { msEpochReservations[ms] = 0; }
  else if (msEpochReservations[ms] < (msEpochReservationLimit-1)) msEpochReservations[ms]++;
  else {
    const attempt = p?.attempt || 1;
    const maxAttempts = p?.maxAttempts || 10;
    if (attempt < maxAttempts) return attemptReserveId({ millisecondEpoch: ms + 1, attempt: attempt + 1, maxAttempts: maxAttempts });
    else return false;
  }

  const uniqueMsInt = msEpochReservations[ms];
  return BigInt(ms) * BigInt(msEpochReservationLimit) + BigInt(uniqueMsInt);
}

const generateId = () => {
  const result = attemptReserveId();
  if (typeof result !== 'bigint') throw new Error(`Could not reserve an id`);
  return result;
}

const reserveId = (p?: { date?: Date }) => {
  const millisecondEpoch = p?.date?.getTime() || new Date().getTime();
  const result = attemptReserveId({ millisecondEpoch: millisecondEpoch, maxAttempts: 1 });
  if (typeof result !== 'bigint') throw new Error(`Could not reserve id for millisecond epoch: ${millisecondEpoch}`);
  return result;
}

const writeLine = async (params: { file: fs.promises.FileHandle, row: number, schema: Object }) => {
  const { file: fd, row, schema: data } = params;
  if (row < 0 || row > partitionLineLength) throw new Error(`Line number ${row} is out of range`);

  const dataString = row === 0 ? Object.keys(data).join(`,`) :
    Object.values(data).map(v => {
      return v === null ? '' :
        typeof v === 'string' ? v.replace(/"/g, `'`).replace(/,/g, `;`).trim() :
          typeof v === 'bigint' ? encodeBigIntb64v2(v) :
            typeof v === 'number' ? v :
              typeof v === 'boolean' ? v ? '1' : '0' :
                _throw(`Unhandled type ${typeof v}`);
    }).join(`,`);

  const fillerLength = lineByteLength - (Buffer.byteLength(dataString) + 1);
  if (fillerLength < 0) throw new Error(`Content for line ${row} is ${fillerLength} too long: ${dataString}`);

  const arrayBufferView = [
    Buffer.from(dataString),
    Buffer.alloc(fillerLength).fill(' '),
    Buffer.from('\n'),
  ];

  sampleMemoryUsage();
  return await fd.writev(arrayBufferView, row * lineByteLength);
}

const readLine = async (p: { file: fs.promises.FileHandle, row: number, schema?: Object }) => {
  const { file: fd, row, schema } = p;
  if (row < 0 || row > partitionLineLength) throw new Error(`Line number ${row} is out of range`);

  const buffer = Buffer.alloc(lineByteLength);
  await fd.read(buffer, 0, lineByteLength, row * lineByteLength);
  const stringArrayResult = buffer.toString().trim().split(',');

  if (!schema) return stringArrayResult;

  const objectResult = {};
  Object.entries(schema).forEach(([key, value]) => {
    const type = typeof value;
    const index = Object.keys(schema).indexOf(key);
    const stringValue = stringArrayResult[index];

    if (type === 'string') objectResult[key] = stringValue;
    if (type === 'number') objectResult[key] = parseInt(stringValue);
    if (type === 'bigint') objectResult[key] = decodeBigIntb64v2(stringValue);
    if (type === 'boolean') objectResult[key] = stringValue === '1';
  });

  return objectResult;
}

const workerThread = async () => {
  console.log(`Worker ${threadId} started`);
  await fs.promises.mkdir(`${__dirname}/data`, { recursive: true });
  const fd = await fs.promises.open(`${__dirname}/data/${threadId}.csv`, 'w+', 0o666);

  for (let i = 0; i < 100; i++) {
    const data = {
      id: reserveId(),
      email: faker.internet.email(),
      comment: "hello, \"friend\"   ",
      val: faker.number.int({ min: 0, max: 100 }),
      isAdmin: faker.datatype.boolean(),
    };

    await writeLine({ file: fd, row: i, schema: data });
  }

  const testData = { id: generateId(), email: null, comment: "hello, \"friend\"" };
  await writeLine({ file: fd, row: 66, schema: testData });
  const readResult = await readLine({ file: fd, row: 67, schema: { id: BigInt(0), email: '', comment: '', val: 0, isAdmin: false } });
  console.log(readResult);

  // // const uuidOriginal = BigInt("0x292626557c5b4e91ba69317a49597ebe");
  // const uuid = BigInt("0xffffffffffffffffffffffffffffffff");
  // const currentId = BigInt(new Date().getTime()) * BigInt(1000) + BigInt(1);
  // const currentId2 = BigInt(new Date().getTime() + faker.number.int({min: 1000, max: 100000 })) * BigInt(1000) + BigInt(1);
  // const futureId = (BigInt(new Date('2600-01-01').getTime())*BigInt(1000)+BigInt(1));

  const uuid = BigInt(new Date().getTime()) * BigInt(1000) + BigInt(1);
  const encodedUuid = encodeBigIntb64v2(uuid);
  const decodedUuid = decodeBigIntb64v2(encodedUuid);
  console.log(uuid, encodedUuid, decodedUuid);
  console.log(msEpochReservations);

  await fd.close();

  console.log(`The script uses approximately ${Math.round(averageMemoryUsage / 1024 / 1024 * 100) / 100} MB`);
  parentPort?.postMessage({ threadId, time: new Date().getTime() - startTimestamp.getTime() });
}

if (!isMainThread) workerThread();
else new Worker(__filename, { workerData: { foo: 'bar' } }).on('message', (msg) => console.log(msg));

const base64Charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const encodeBigIntb64v2 = (big: bigint) => {
  let result = "";
  for (let n = big; n > BigInt(0); n >>= BigInt(6)) {
    result = base64Charset[Number(n & BigInt(63))] + result;
  }
  return result;
}

const decodeBigIntb64v2 = (str: string) => {
  let result = BigInt(0);
  for (let i = 0; i < str.length; i++) {
    result = (result << BigInt(6)) + BigInt(base64Charset.indexOf(str[i]));
  }
  return result;
}
