import { open, mkdir, FileHandle } from 'node:fs/promises';
import { faker } from '@faker-js/faker';

import { GetMemoryUsage, Log } from './utility';
import { ReserveId, ReadMsEpochReservations } from './id-service';
import { WriteLine, ReadLine, WriterTypeError } from './writer';

export const generateUsers = async () => {
  const startTimestamp = new Date();
  Log();
  await mkdir(`${__dirname}/data`, { recursive: true });
  const fd = await open(`${__dirname}/data/users.csv`, 'w+', 0o666);

  try { await testUsers(fd); }
  catch (e) {
    if (e instanceof WriterTypeError) Log(e.stack);
    else throw e;
  }
  await fd.close();
  process.send({
    msEpochReservations: ReadMsEpochReservations(),
    memoryUsageMB: GetMemoryUsage(),
    msExecutionTime: new Date().getTime() - startTimestamp.getTime()
  });
}

const testUsers = async (fd: FileHandle) => {
  for (let i = 0; i < 100; i++) {
    const data = {
      id: ReserveId(),
      email: faker.internet.email(),
      comment: "hello, \"friend\"   ",
      val: faker.number.int({ min: 0, max: 100 }),
      isAdmin: faker.datatype.boolean(),
    };

    await WriteLine({ file: fd, row: i, data: data });
  }

  const testData = { id: ReserveId(), email: null, comment: "hello, \"friend\"" };
  const testData2 = { id: null, email: null, comment: "hello, \"friend\"" };
  await WriteLine({ file: fd, row: 66, data: testData });
  await WriteLine({ file: fd, row: 69, data: testData2 });
  await WriteLine({ file: fd, row: 71, data: {} });

  for (let i = 66; i < 72; i++) {
    const readResult = await ReadLine({ file: fd, row: i, schema: { id: BigInt(0), email: '', comment: '', val: 0, isAdmin: false } });
    Log({ row: i, readResult });
  }

  await WriteLine({ file: fd, row: 66, data: { id: { inner: 'content' } } }); // returns unhandled type error
}
