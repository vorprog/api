import { parentPort, threadId } from 'node:worker_threads';
import * as fs from 'node:fs';
import { faker } from '@faker-js/faker';

import { encodeBigIntb64v2, decodeBigIntb64v2, GetMemoryUsage, Log } from './utility';
import { GenerateId, ReserveId, ReadMsEpochReservations } from './id-service';
import { WriteLine, ReadLine } from './writer';

export const workerThread = async () => {
  const startTimestamp = new Date();
  Log(`Worker ${threadId} started`);
  await fs.promises.mkdir(`${__dirname}/data`, { recursive: true });
  const fd = await fs.promises.open(`${__dirname}/data/${threadId}.csv`, 'w+', 0o666);

  for (let i = 0; i < 100; i++) {
    const data = {
      id: ReserveId(),
      email: faker.internet.email(),
      comment: "hello, \"friend\"   ",
      val: faker.number.int({ min: 0, max: 100 }),
      isAdmin: faker.datatype.boolean(),
    };

    await WriteLine({ file: fd, row: i, schema: data });
  }

  const testData = { id: GenerateId(), email: null, comment: "hello, \"friend\"" };
  await WriteLine({ file: fd, row: 66, schema: testData });
  const readResult = await ReadLine({ file: fd, row: 67, schema: { id: BigInt(0), email: '', comment: '', val: 0, isAdmin: false } });
  Log(readResult);

  // // const uuidOriginal = BigInt("0x292626557c5b4e91ba69317a49597ebe");
  // const uuid = BigInt("0xffffffffffffffffffffffffffffffff");
  // const currentId = BigInt(new Date().getTime()) * BigInt(1000) + BigInt(1);
  // const currentId2 = BigInt(new Date().getTime() + faker.number.int({min: 1000, max: 100000 })) * BigInt(1000) + BigInt(1);
  // const futureId = (BigInt(new Date('2600-01-01').getTime())*BigInt(1000)+BigInt(1));

  const uuid = BigInt(new Date().getTime()) * BigInt(1000) + BigInt(1);
  const encodedUuid = encodeBigIntb64v2(uuid);

  Log(`uuid: ${uuid}`);
  Log(`encoded uuid: ${encodedUuid}`);
  Log(`decoded uuid: ${decodeBigIntb64v2(encodedUuid)}`);

  Log(ReadMsEpochReservations());

  await fd.close();

  Log(`The script uses approximately ${GetMemoryUsage()} MB`);
  parentPort?.postMessage({ threadId, time: new Date().getTime() - startTimestamp.getTime() });
}
