const { spawn } = require('child_process');
const { createServer } = require('http');

console.log('🔧 Safe Start Script - Starting Backend Server');

// Check if port is free first
function checkPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

async function startSafely() {
  console.log('📋 Checking if port 3001 is available...');
  const isPortFree = await checkPort(3001);
  
  if (!isPortFree) {
    console.error('❌ Port 3001 is busy. Please kill existing processes first.');
    console.log('💡 Run: taskkill /f /im node.exe');
    process.exit(1);
  }

  console.log('✅ Port 3001 is available');
  console.log('🚀 Starting backend server...');

  const server = spawn('npx', ['ts-node', 'src/index.ts'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  server.on('close', (code) => {
    console.log(`\n📊 Server process exited with code ${code}`);
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    server.kill('SIGINT');
    process.exit(0);
  });
}

startSafely(); 