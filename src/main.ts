// const startTimestamp = new Date();

// import S3 from 'aws-sdk/clients/s3';
import { isMainThread, Worker } from 'node:worker_threads';
import { workerThread } from './worker'
import { Log } from './utility';

if (isMainThread) {
  Log(`Main thread started`);
  new Worker(__filename, { workerData: { foo: 'bar' } }).on('message', (msg) => Log(msg));
}
else workerThread();
