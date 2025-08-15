#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="/tmp/backoffice.pid"
LOG_FILE="/tmp/backoffice.log"
PORT="${PORT:-5173}"
HOST="${HOST:-0.0.0.0}"

is_running() {
  if [[ -f "${PID_FILE}" ]]; then
    local pid
    pid=$(cat "${PID_FILE}" || true)
    if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

start() {
  if is_running; then
    echo "Backoffice already running (pid $(cat "${PID_FILE}"))"
    exit 0
  fi
  echo "Starting backoffice (port ${PORT})..."
  cd "${APP_DIR}"
  nohup npm run dev -- --host "${HOST}" --port "${PORT}" > "${LOG_FILE}" 2>&1 &
  echo $! > "${PID_FILE}"
  echo "Started. pid $(cat "${PID_FILE}")"
  echo "Logs: ${LOG_FILE}"
  echo "Open http://localhost:${PORT}"
}

stop() {
  if ! is_running; then
    echo "Backoffice is not running"
    exit 0
  fi
  local pid
  pid=$(cat "${PID_FILE}")
  echo "Stopping backoffice (pid ${pid})..."
  kill "${pid}" || true
  sleep 1
  if kill -0 "${pid}" 2>/dev/null; then
    echo "Force killing ${pid}"
    kill -9 "${pid}" || true
  fi
  rm -f "${PID_FILE}"
  echo "Stopped."
}

status() {
  if is_running; then
    echo "Backoffice running (pid $(cat "${PID_FILE}"))"
    exit 0
  else
    echo "Backoffice not running"
    exit 1
  fi
}

logs() {
  [[ -f "${LOG_FILE}" ]] || { echo "No logs at ${LOG_FILE}"; exit 1; }
  tail -n 200 -f "${LOG_FILE}"
}

usage() {
  cat <<EOF
Usage: $(basename "$0") <start|stop|status|logs>

Environment:
  PORT (default: 5173)
  HOST (default: 0.0.0.0)
EOF
}

cmd="${1:-}" || true
case "${cmd}" in
  start) start ;;
  stop) stop ;;
  status) status ;;
  logs) logs ;;
  *) usage; exit 2 ;;
 esac
