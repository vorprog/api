import * as fs from 'fs';
import { encodeBigIntb64v2, decodeBigIntb64v2, ThrowErr, SampleMemoryUsage } from './utility';
import { PartitionLineLength, LineByteLength } from './config';

const formatValue = (v) => v === null ? '' :
  typeof v === 'string' ? v.replace(/"/g, `'`).replace(/,/g, `;`).trim() :
    typeof v === 'bigint' ? encodeBigIntb64v2(v) :
      typeof v === 'number' ? v.toString() :
        typeof v === 'boolean' ? v ? '1' : '0' :
          ThrowErr(`Unhandled type ${typeof v}`);

export const WriteLine = async (params: { file: fs.promises.FileHandle, row: number, schema: Object }) => {
  const { file, row, schema: data } = params;
  if (row < 0 || row > PartitionLineLength) throw new Error(`Line number ${row} is out of range`);

  const stringValues = row === 0 ? Object.keys(data) : Object.values(data).map(formatValue);
  const dataString = stringValues.join(',');

  const fillerLength = LineByteLength - (Buffer.byteLength(dataString) + 1);
  if (fillerLength < 0) throw new Error(`Content for line ${row} is ${fillerLength} too long: ${dataString}`);

  const arrayBufferView = [
    Buffer.from(dataString),
    Buffer.alloc(fillerLength).fill(' '),
    Buffer.from('\n'),
  ];

  SampleMemoryUsage();
  return await file.writev(arrayBufferView, row * LineByteLength);
}

export const ReadLine = async (p: { file: fs.promises.FileHandle, row: number, schema?: Object }) => {
  const { file, row, schema } = p;
  if (row < 0 || row > PartitionLineLength) throw new Error(`Line number ${row} is out of range`);

  const buffer = Buffer.alloc(LineByteLength);
  await file.read(buffer, 0, LineByteLength, row * LineByteLength);
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
