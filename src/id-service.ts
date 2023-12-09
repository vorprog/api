import { MsEpochReservationLimit } from './config';

let MsEpochReservations = {};

const attemptReserveId = (p?: { millisecondEpoch?: number, attempt?: number, maxAttempts?: number }): bigint | boolean => {
  const ms = p?.millisecondEpoch || new Date().getTime();

  if (MsEpochReservations.hasOwnProperty(ms) === false) {
    MsEpochReservations[ms] = 0; 
  }
  else if (MsEpochReservations[ms] < (MsEpochReservationLimit - 1)) MsEpochReservations[ms]++;
  else {
    const attempt = p?.attempt || 1;
    const maxAttempts = p?.maxAttempts || 10;
    if (attempt < maxAttempts) return attemptReserveId({ millisecondEpoch: ms + 1, attempt: attempt + 1, maxAttempts: maxAttempts });
    else return false;
  }

  const uniqueMsInt = MsEpochReservations[ms];
  return BigInt(ms) * BigInt(MsEpochReservationLimit) + BigInt(uniqueMsInt);
}

export const GenerateId = () => {
  const result = attemptReserveId();
  if (typeof result !== 'bigint') throw new Error(`Could not reserve an id`);
  return result;
}

export const ReserveId = (p?: { date?: Date }) => {
  const millisecondEpoch = p?.date?.getTime() || new Date().getTime();
  const result = attemptReserveId({ millisecondEpoch: millisecondEpoch, maxAttempts: 1 });
  if (typeof result !== 'bigint') throw new Error(`Could not reserve id for millisecond epoch: ${millisecondEpoch}`);
  return result;
}

export const ReadMsEpochReservations = () => JSON.stringify(MsEpochReservations);
