import { open, mkdir } from 'node:fs/promises';
import { faker } from '@faker-js/faker';

import { GetMemoryUsage, Log } from './utility';
import { GenerateId, ReserveId, ReadMsEpochReservations } from './id-service';
import { WriteLine, ReadLine } from './writer';

export const generateUsers = async (params?: { processName: string}) => {
  const startTimestamp = new Date();
  Log();
  await mkdir(`${__dirname}/data`, { recursive: true });
  const fd = await open(`${__dirname}/data/users.csv`, 'w+', 0o666);

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
  Log({ read: readResult});

  await fd.close();
  process.send({
    msEpochReservations: ReadMsEpochReservations(),
    memoryUsageMB: GetMemoryUsage(),
    msExecutionTime: new Date().getTime() - startTimestamp.getTime() 
  });
}
