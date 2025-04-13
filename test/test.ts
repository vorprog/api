import { spawn } from 'child_process';
import { timeout } from '../src/utility.ts';
import exp from 'constants';

const makeApiCalls = async () => {
  const response = await fetch('http://localhost:8080/health');
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const refelctResponse = await fetch('http://localhost:8080');
  if (!refelctResponse.ok) throw new Error(`HTTP error! status: ${refelctResponse.status}`);
  const body = await refelctResponse.json();
  console.log(body);
}

const runtest = async () => {
  const startServer = spawn('./dist/api', [], { stdio: ['inherit', 'overlapped', 'overlapped', 'ipc'] });

  const logs = [];
  startServer.stdout.on('data', (data) => {
    logs.push(data.toString());
  });

  const processMessages = [];
  startServer.on('message', (message) => processMessages.push(message));
  startServer.on('exit', (code) => {
    console.log(`Server exited ${code ? `with code: ${code}` : ``}`);
    process.exit();
  });
  startServer.on('error', (err) => { throw err });

  await timeout(1000);

  try {
    await makeApiCalls();

    console.log(logs[1]);

    const expected = {
      serverport: '"{\\"HttpPort\\":8080}"',
    };

    const tests = {
      serverStart: logs[1].includes(expected.serverport) ? null : `expected ${expected.serverport} but got ${logs[1]}`,
    };

    for (const test in tests) {
      if (tests[test]) console.log(tests[test]);
    }

    console.log(`ran ${Object.keys(tests).length} tests`);

  } finally {
    startServer.kill();
  }
}

runtest();
