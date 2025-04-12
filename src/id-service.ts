/** A map of how many IDs are reserved for each millisecond's epoch */
const msEpochReservations: Record<number, number> = {};
let oldEpoch = new Date().getTime() - 1000;

setInterval(() => {
  oldEpoch = new Date().getTime() - 1000
  for (const key in msEpochReservations) {
    if (parseInt(key) < oldEpoch) delete msEpochReservations[key];
  }
}, 1000);

export class ReserveIDError extends Error {}

export const ReserveId = (attempt = 0) => {
  const ms = new Date().getTime();

  if (msEpochReservations.hasOwnProperty(ms) === false) msEpochReservations[ms] = 0;
  else if (msEpochReservations[ms] < 999) msEpochReservations[ms]++;
  else if (attempt < 10) return ReserveId(attempt + 1);
  else throw new ReserveIDError(`Maximum attempts reached for ID reservation at ${ms}`);

  return BigInt(ms) * 1000n + BigInt(msEpochReservations[ms]);
}

/** Return a copy of how many IDs are reserved for each millisecond's epoch */
export const ReadMsEpochReservations = () => Object.assign({}, msEpochReservations);
