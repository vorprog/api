import { spawn } from 'child_process';

const makeApiCalls = async () => {
  const response = await fetch('http://localhost:8080/health');
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const refelctResponse = await fetch('http://localhost:8080');
  if (!refelctResponse.ok) throw new Error(`HTTP error! status: ${refelctResponse.status}`);
  const body = await refelctResponse.json();
  console.log(body);
}

const runtest = async () => {
  const startServer = spawn('../dist/api', [], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });

  startServer.on('message', (message) => console.log(message));
  startServer.on('exit', (code) => console.log(`Server exited with code: ${code}`));
  startServer.on('error', (err) => { throw err });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    await makeApiCalls();
  } finally {
    startServer.kill();
  }
}

runtest();