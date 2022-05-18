# LDES Client NiFi processor end-to-end tests
These end-to-end tests verify that the LDES client works as expected.

The tests are meant to be living documentation and therefore specified in [Gherkin language](https://cucumber.io/docs/gherkin/) while the supporting step definitions are written in TypeScript.

## Preparation
In order to run the tests, you currently need to take a few steps as preparation.
* prepare the simulator (source LDES server)
* prepare the sink (target http server needed for assertions)
* prepare Apache NiFi (containing the LDES client package and a workflow) 

### Prepare simulator
The simulator is a separate [repository](https://github.com/Informatievlaanderen/VSDS-LDESServerSimulator). Currently, you need to clone this repository and build the simulator (see instructions there) yourself. Later, we will provide a ready-to-run docker container, which the E2E test will launch automatically when needed.

### Prepare sink
The sink is a small http server capturing the output of the LDES client through POST requests, extracting the member IDs and allowing to GET those for comparison with the expected result. To build the sink:
```bash
cd sink
npm i
npm run build
cd ..
```

### Prepare Apache NiFI
The LDES client is currently only provided as a NiFi processor and therefore needs to be used as part of a NiFi process group writing its output (LDES members) to a sink. To setup NiFi:
* install NiFi (if not done)
* add the LDES client package (.nar file) to NiFi's `lib` directory
* run Nifi and logon with the generated credentials
* create a new process group importing the definition found at `./data/e2e-test.nifi-workflow.json`

## Running the tests
Currently, there is only one test. When this test is run, it will:
1. launch the pre-built sink
2. launch the pre-built simulator and retrieve the IDs of the expected LDES members
3. wait (indefinitely) until the expected amount of LDES members is sent to the sink
4. compare the member IDs received by the sink with the expected IDs (retrieved directly from the simulator)

Currently, the test cannot start the NiFi workflow (due to some security reasons) and therefore you need to manually start the workflow while the test is waiting for the expected amount of members (step 3).

To run the test execute:
```bash
npm i
npm test
```
> **Note**: we will improve the test at a later stage to use docker containers containing a pre-built simulator, a pre-built sink and Apache NiFi with LDES client and workflow included, automatically launch & stop these containers, as well as start & stop the NiFi workflow. This will make it easier to run the test(s).
