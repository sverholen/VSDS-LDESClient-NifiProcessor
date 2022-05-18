# E2E Test Sink
The E2E test sink is a small http server used for E2E testing the LDES client NiFi processor.

## Docker
The sink can be run as a docker container, after creating a docker image for it. The docker container will keep running until stopped.

To create a docker image, run the following command:
```bash
docker build --tag vsds/sink .
```

To run the sink docker image mapped on port 9000, you can use:
```bash
docker run -d -p 9000:80 vsds/sink
```

The docker run command will return a container ID (e.g. `0cc5d65d8108f8e91778a0a4cdb6504a2b3926055ce10cb899dceb98db4c3eef`), which you need to stop the container.

Alternatively you can run `docker ps` to retrieve the (short version of the) container ID.
 ```
CONTAINER ID   IMAGE       COMMAND                  CREATED          STATUS          PORTS                    NAMES
0cc5d65d8108   vsds/sink   "/usr/bin/dumb-init …"   12 seconds ago   Up 11 seconds   0.0.0.0:9000->80/tcp   intelligent_bell
 ```
To stop the container, you need to call the stop command with the (long or short) container ID, e.g. `docker stop 0cc5d65d8108`

## Manual build and run
The sink is implemented as a [node.js](https://nodejs.org/en/) application.
You need to run the following commands to build it:
```bash
npm i
npm run build
```

The sink takes the following command line arguments:
* `--port=<port-number>` allows to set the port, defaults to 8080
* `--host=<host-name>` allows to set the hostname, defaults to localhost
* `--silent` prevents any console debug output

You can run it with one of the following command after building it:
```bash
npm start
node dist/server.js
node dist/server.js --silent
node dist/server.js --port=6789
node dist/server.js --port=6789 --silent
```
