#!/usr/bin/env node
// Script to kill process on port 5050 (or specified port)

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const PORT = process.env.PORT || process.argv[2] || 5050;

async function killPort() {
  try {
    console.log(`Checking for processes on port ${PORT}...`);
    
    // Find process using the port (works on macOS/Linux)
    const { stdout } = await execAsync(`lsof -ti :${PORT}`);
    const pid = stdout.trim();
    
    if (pid) {
      console.log(`Found process ${pid} on port ${PORT}`);
      console.log(`Killing process ${pid}...`);
      
      try {
        await execAsync(`kill -9 ${pid}`);
        console.log(`✅ Process ${pid} killed successfully`);
      } catch (error) {
        console.log(`⚠️  Could not kill process ${pid}, trying killall...`);
        await execAsync(`killall -9 node 2>/dev/null || true`);
      }
      
      // Wait a moment and verify
      await new Promise(resolve => setTimeout(resolve, 1000));
      const check = await execAsync(`lsof -ti :${PORT} 2>/dev/null || echo ""`).catch(() => ({ stdout: "" }));
      
      if (check.stdout.trim()) {
        console.log(`⚠️  Port ${PORT} may still be in use`);
      } else {
        console.log(`✅ Port ${PORT} is now free`);
      }
    } else {
      console.log(`✅ No process found on port ${PORT}`);
    }
  } catch (error) {
    if (error.code === 1) {
      // lsof returns 1 when no process is found (this is normal)
      console.log(`✅ No process found on port ${PORT}`);
    } else {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }
}

killPort();

