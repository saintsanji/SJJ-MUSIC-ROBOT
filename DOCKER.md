# Run the music bot in Docker

The Compose service builds the TypeScript bot into a Node.js 22 image. It reads Discord and NodeLink credentials from the existing `.env` file and routes the NodeLink connection to the host machine, where the supplied NodeLink configuration listens on port `3000`.

Before starting the container, stop any other music-bot process using the same Discord token. Keep NodeLink running.

Start the bot:

```sh
docker-compose up --build -d
```

View its logs:

```sh
docker-compose logs -f music-bot
```

Stop the container:

```sh
docker-compose down
```

By default, the container connects to `host.docker.internal:3000`. To use another reachable NodeLink address, set `NODELINK_DOCKER_HOST` in `.env`; set `NODELINK_PORT` to the matching port. The NodeLink server must be reachable from the Docker host gateway.

This project does not currently have a Git remote. A Pterodactyl egg installer needs a hosted source repository or archive URL to fetch the bot code; the Docker setup here does not depend on publishing the project.