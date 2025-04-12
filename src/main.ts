import { spawn } from 'node:child_process';
import { Server } from 'node:http';
import { Log } from './utility';
import { HttpPort, AppVersion } from './config';
import { generateUsers } from './worker';
import { httpHandler } from './http-handler';

if (process.argv[2] === 'worker') generateUsers();
else {
  Log({ version: AppVersion });
  const childProcess = spawn(__filename, ['worker', 'genUserChild'], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
  childProcess.on('message', message => Log(message));
  new Server(httpHandler).listen(HttpPort, () => Log({ HttpPort }));
}
