import { Serializable, spawn } from 'node:child_process';
import { Server } from 'node:http';
import { Log } from './utility';
import { HttpPort, AppVersion } from './config';
import { generateUsers } from './worker';
import { httpHandler } from './http-handler';

// import S3 from 'aws-sdk/clients/s3';

if (process.argv[2] === 'worker') generateUsers();
else {
  Log({ version: AppVersion });
  const childProcess = spawn(__filename, ['worker', 'genUserChild'], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
  const messageHandler = (message: Serializable) => Log(JSON.parse(JSON.stringify(message)));
  childProcess.on('message', messageHandler);

  const listeningHandler = () => Log({ HttpPort });
  new Server(httpHandler).listen(HttpPort, listeningHandler);
}
