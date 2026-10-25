#!/usr/bin/env bash
set -uo pipefail

APP_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
NODELINK_DIR="${NODELINK_DIR:-${APP_DIR}/nodelink}"
NODELINK_PID=""
BOT_PID=""

required=(DISCORD_TOKEN CLIENT_ID NODELINK_HOST NODELINK_PORT NODELINK_PASS)
for variable in "${required[@]}"; do
    if [[ -z "${!variable:-}" ]]; then
        printf 'Startup error: required environment variable %s is not set.\n' "$variable" >&2
        exit 1
    fi
done

cleanup() {
    trap - EXIT INT TERM
    if [[ -n "$BOT_PID" ]] && kill -0 "$BOT_PID" 2>/dev/null; then
        kill -TERM "$BOT_PID" 2>/dev/null || true
        wait "$BOT_PID" 2>/dev/null || true
    fi
    if [[ -n "$NODELINK_PID" ]] && kill -0 "$NODELINK_PID" 2>/dev/null; then
        kill -TERM "$NODELINK_PID" 2>/dev/null || true
        wait "$NODELINK_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

host="${NODELINK_HOST,,}"
host="${host//[[:space:]]/}"
secure="${NODELINK_SECURE:-false}"
secure="${secure,,}"
case "$host" in
    localhost|127.0.0.1|::1)
        if [[ "$secure" == "true" ]]; then
            printf 'Startup error: embedded NodeLink uses an unencrypted local WebSocket. Set NODELINK_SECURE=false, or use an external TLS-enabled NodeLink host.\n' >&2
            exit 1
        fi

        if [[ ! -f "${NODELINK_DIR}/package.json" ]]; then
            printf 'Startup error: NODELINK_HOST is local, but NodeLink was not installed at %s. Enable embedded NodeLink during the image/server install, or set NODELINK_HOST to an external address.\n' "$NODELINK_DIR" >&2
            exit 1
        fi

        if [[ ! -f "${APP_DIR}/nodelink.config.ts" ]]; then
            printf 'Startup error: NodeLink config template is missing at %s/nodelink.config.ts.\n' "$APP_DIR" >&2
            exit 1
        fi

        if [[ ! -f "${NODELINK_DIR}/config.ts" ]]; then
            cp "${APP_DIR}/nodelink.config.ts" "${NODELINK_DIR}/config.ts"
        fi
        export NODELINK_SERVER_HOST=0.0.0.0
        export NODELINK_SERVER_PORT="$NODELINK_PORT"
        export NODELINK_SERVER_PASSWORD="$NODELINK_PASS"

        printf 'Starting embedded NodeLink on port %s...\n' "$NODELINK_PORT"
        (cd "$NODELINK_DIR" && npm start) &
        NODELINK_PID=$!
        sleep 3

        if ! kill -0 "$NODELINK_PID" 2>/dev/null; then
            wait "$NODELINK_PID"
            printf 'Startup error: embedded NodeLink exited during startup.\n' >&2
            exit 1
        fi
        ;;
    *)
        printf 'Using external NodeLink at %s:%s.\n' "$NODELINK_HOST" "$NODELINK_PORT"
        ;;
esac

cd "$APP_DIR"
node dist/index.js &
BOT_PID=$!
trap cleanup EXIT INT TERM
wait "$BOT_PID"