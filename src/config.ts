import * as z from 'zod';

export const LineByteLength = z.number().default(100).parse(process.env.LINE_BYTE_LENGTH);
export const PartitionLineLength = z.number().default(100).parse(process.env.PARTITION_LINE_LENGTH);
export const MsEpochReservationLimit = z.number().default(1000).parse(process.env.MS_EPOCH_RESERVATION_LIMIT);
