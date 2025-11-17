#!/bin/bash
# Script to kill process on port 5050

PORT=5050

echo "Checking for processes on port $PORT..."

# Find process using the port
PID=$(lsof -ti :$PORT)

if [ -z "$PID" ]; then
  echo "✅ No process found on port $PORT"
else
  echo "Found process $PID on port $PORT"
  echo "Killing process $PID..."
  kill -9 $PID
  sleep 1
  
  # Verify it's killed
  if lsof -ti :$PORT > /dev/null 2>&1; then
    echo "⚠️  Process still running, trying force kill..."
    killall -9 node 2>/dev/null
  else
    echo "✅ Port $PORT is now free"
  fi
fi

