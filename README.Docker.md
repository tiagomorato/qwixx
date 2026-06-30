### Running Qwixx in Docker

This project runs on [Bun](https://bun.sh). The image builds the React client and
serves both the static SPA and the `/api` routes from a single Bun server on port
**8787**.

#### Start

```sh
docker compose up --build -d   # or: bun run docker:up
```

The app is then available at http://localhost:8787.

Helper scripts (see `package.json`):

| Script                 | What it does                          |
| ---------------------- | ------------------------------------- |
| `bun run docker:up`    | Build and start the stack (detached)  |
| `bun run docker:down`  | Stop and remove the container         |
| `bun run docker:logs`  | Follow the server logs                |
| `bun run docker:build` | Build the image only                  |

#### Data

`compose.yaml` bind-mounts the host `./data` folder into the container at `/data`
(via `QWIXX_DATA_DIR`). The container and a local `bun run dev:server` therefore
share the same `history.json` / `current.json` — there is one source of truth, no
seeding required. Don't run both against the data folder at the same time.

#### Deploying to a registry

```sh
docker build -t myregistry.com/qwixx .
# cross-arch (e.g. building amd64 from an Apple Silicon Mac):
docker build --platform=linux/amd64 -t myregistry.com/qwixx .
docker push myregistry.com/qwixx
```

Note: the bind-mounted `./data` folder is for local use. In a cloud deployment,
mount a persistent volume at `/data` (or point `QWIXX_DATA_DIR` elsewhere) instead.

#### References

* [Bun Docker guide](https://bun.sh/guides/ecosystem/docker)
* [Docker Compose reference](https://docs.docker.com/compose/compose-file/)
