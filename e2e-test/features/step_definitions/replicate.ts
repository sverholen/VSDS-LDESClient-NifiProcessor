import assert from 'assert';
import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { ChildProcess, exec } from 'child_process';
import axios from 'axios';
import { LdesFragment } from '../support';

const www = axios;
const retryTimeout = 100; // milliseconds

const expected: string[] = [];
//const actual: string[] = [];

const simulatorPort = 9001;
const simulatorBaseUrl = `http://localhost:${simulatorPort}`;
let simulator: ChildProcess;

//const niFiPort = 9002;
//const nifiApiUrl = `https://localhost:${niFiPort}/nifi-api`;
//const nifiRootProcessGroupUrl = nifiApiUrl + '/process-groups/root'; // TODO: use this root process group to add workflow process group
//const workflowProcessGroupId = 'd639639e-0180-1000-0a80-d621e8b92418';

const sinkPort = 9003;
const sinkBaseUrl = `http://localhost:${sinkPort}`;
let sink: ChildProcess;

async function waitUntilAvailable(url: string) {
    let status: number;
    while (status !== 200) {
        try {
            status = await www.get(url).then(x => x && x.status);
        }
        catch {
            await new Promise(resolve => setTimeout(resolve, retryTimeout));
        }
    }
}

async function waitUntilAllMembersReceived(sinkGetCount: string, expectedCount: number) {
    while (true) {
        const actualCount = await www.get(sinkGetCount).then(x => x && x.data).then(x => x && x.count);
        if (actualCount === expectedCount) break;
        await new Promise(resolve => setTimeout(resolve, retryTimeout));
    }
}

async function startSink() {
    const cmd = `node ./sink/src/index.js --port=${sinkPort} --host=localhost`;
    const sink = exec(cmd);
    await waitUntilAvailable(sinkBaseUrl);
    return sink;
}

async function startSimulator() {
    const simulatorBaseFolder = '../../VSDS-LDESServerSimulator'; // TODO: do not use simulator from its repository, but instead use a docker container
    const cmd = `node ${simulatorBaseFolder}/dist/server.js --port=${simulatorPort} --host=localhost --baseUrl=${simulatorBaseUrl} --seed=${simulatorBaseFolder}/data/gipod`;
    const simulator = exec(cmd);
    await waitUntilAvailable(simulatorBaseUrl);
    return simulator;
}

async function retrieveExpectedMemberIds(nodeUrl: string) {
    //await LdesFragment.traverse(nodeUrl, x => expected.push(x['@id']));
    //expected.sort();
    expected.push("http://example.com/id/123");
}

// async function startNifiWorkflow(workflowId: string) {
//     await www.put(nifiBaseUrl + '/flow/process-groups/' + workflowId, {id:workflowId,state:"RUNNING"});
// }

// async function stopNifiWorkflow(workflowId: string) {
//     await www.put(nifiBaseUrl + '/flow/process-groups/' + workflowId, {id:workflowId,state:"STOPPED"});
// }

Before(async function () {
    // TODO: use 'docker compose up -d' instead
    sink = await startSink();
    simulator = await startSimulator();
    // Start Nifi container (containing LDES client nar)
});

After(function () {
    // TODO: use 'docker compose down' instead
    // TODO: stop Nifi container
    simulator.kill();
    sink.kill();
});

Given('the GIPOD data set is available at {string}', async function (url: string) {
    await retrieveExpectedMemberIds(simulatorBaseUrl + url);
});

When('the LDES client retrieves the complete data set', { timeout: -1 }, async function () {
    // TODO: upload configured workflow (simulatorRootNodeUrl && sinkPostMember)
    // const sinkPostMember = sinkBaseUrl + '/member';
    //const workflowId = workflowProcessGroupId;
    //await startNifiWorkflow(workflowId);
    await www.post(sinkBaseUrl + '/member', '<http://example.com/ldes/collection> <https://w3id.org/tree#member> <http://example.com/id/123> .', { headers: { "Content-Type": "application/n-quads" } }); // TODO: remove this temp code
    await waitUntilAllMembersReceived(sinkBaseUrl + '/', expected.length);
    //await stopNifiWorkflow(workflowId);
});

Then('all the LDES member are received', async function () {
    const sinkGetMembers = sinkBaseUrl + '/member';
    const actual = await www.get<string[]>(sinkGetMembers).then(response => response.data).then(x => x.sort());
    assert.deepStrictEqual(actual, expected);
});
