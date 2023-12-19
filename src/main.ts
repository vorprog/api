import { isMainThread, Worker } from 'node:worker_threads';
import { Server } from 'node:http';
import { Log } from './utility';
import { HttpPort } from './config';
import { workerThread } from './worker';
import { httpHandler } from './http-handler';


// import S3 from 'aws-sdk/clients/s3';

if (isMainThread) {
  Log(`Main thread started`);
  new Worker(__filename, { workerData: { foo: 'bar' } }).on('message', (msg) => Log(msg));
  new Server(httpHandler).listen(HttpPort, () => Log(`Server running at http://localhost:${HttpPort}/`));
}
else workerThread();
