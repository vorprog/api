import { FileHandle } from 'node:fs/promises';
import { encodeBigIntb64v2, decodeBigIntb64v2, Throw, SampleMemoryUsage } from './utility';
import { FileLineLength, LineByteLength } from './config';

export class WriterTypeError extends Error { }

const formatValue = (v) => v === null ? '' :
  typeof v === 'string' ? v.replace(/"/g, `'`).replace(/,/g, `;`).trim() :
    typeof v === 'bigint' ? encodeBigIntb64v2(v) :
      typeof v === 'number' ? v.toString() :
        typeof v === 'boolean' ? v ? '1' : '0' :
          Throw(new WriterTypeError(`Unhandled type '${typeof v}'`));

export const WriteLine = async (params: { file: FileHandle, row: number, data: Object }) => {
  const { file, row, data } = params;
  if (row < 0 || row > FileLineLength) throw new Error(`Line number ${row} is out of range`);

  if (!data) throw new Error(`Data for line ${row} is null`);

  const stringValues = row === 0 ? Object.keys(data) : Object.values(data).map(formatValue);
  const dataString = stringValues.join(',');

  const fillerLength = LineByteLength - (Buffer.byteLength(dataString) + 1);
  if (fillerLength < 0) throw new Error(`Content for line ${row} is ${fillerLength} too long: ${dataString}`);

  const filler = Buffer.alloc(fillerLength).fill(' ').toString();

  SampleMemoryUsage();
  return await file.write(dataString + filler + '\n', row * LineByteLength);
}

export const ReadLine = async (p: { file: FileHandle, row: number, schema?: Object }) => {
  const { file, row, schema } = p;
  if (row < 0 || row > FileLineLength) throw new Error(`Line number ${row} is out of range`);

  const buffer = Buffer.alloc(LineByteLength);
  await file.read(buffer, 0, LineByteLength, row * LineByteLength);
  const stringArrayResult = buffer.toString().trim().split(',');

  if (!schema) return stringArrayResult;

  return Object.keys(schema).reduce((acc, key, index) => {
    const value = stringArrayResult[index];
    const type = typeof schema[key];

    acc[key] = type === 'string' ? value :
      type === 'bigint' ? decodeBigIntb64v2(value) :
        type === 'number' ? parseInt(value) :
          type === 'boolean' ? value === '1' :
            Throw(new WriterTypeError(`Unhandled type ${type}`));

    return acc;
  }
    , {});
}
