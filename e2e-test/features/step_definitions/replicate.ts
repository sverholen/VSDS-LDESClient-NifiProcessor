import assert from 'assert';
import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { exec, execSync } from 'child_process';
import axios from 'axios';
import { Agent } from 'https';
import { LdesFragment } from '../support/ldes-fragment';

const seconds = 1000;
const minutes = 60 * seconds;
const defaultRetryTimeout = 1 * seconds;

const ignoreSSLIssuesAgent = new Agent({ rejectUnauthorized: false }); // ignore SSL issues (self-signed certs, etc.)
const http = axios.create();
const https = axios.create({httpsAgent: ignoreSSLIssuesAgent});

let expected: string[] = [];
//const actual: string[] = [];

const simulatorPort = 9001;
const simulatorBaseUrl = `http://localhost:${simulatorPort}`;

const niFiPort = 8443;
const nifiBaseUrl = `https://localhost:${niFiPort}`;
const nifiApiUrl = nifiBaseUrl + '/nifi-api';
// const nifiRootProcessGroupUrl = nifiApiUrl + '/process-groups/root';

const sinkPort = 9003;
const sinkBaseUrl = `http://localhost:${sinkPort}`;

async function wait(milliseconds: number) {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
}

function www(url: string) {
    return url.startsWith('https') ? https : http;
}

async function waitUntilAvailable(url: string, retryTimeout: number = defaultRetryTimeout) {
    let status: number;
    while (status !== 200) {
        try {
            status = await www(url).get(url).then(x => x && x.status);
        }
        catch (error: any) {
            await wait(retryTimeout);
        }
    }
}

async function waitUntilAllMembersReceived(sinkGetCount: string, expectedCount: number, retryTimeout: number = defaultRetryTimeout) {
    while (true) {
        const actualCount = await http.get(sinkGetCount).then(x => x && x.data && (typeof x.data === 'string' ? JSON.parse(x.data) : x.data)).then(x => x && x.count);
        if (actualCount === expectedCount) break;
        await wait(retryTimeout);
    }
}

async function startContainers() {
    console.debug('Starting containers...');
    exec('docker compose up');
    console.debug('Waiting for sink...');
    await waitUntilAvailable(sinkBaseUrl);
    console.debug('Waiting for simulator...');
    await waitUntilAvailable(simulatorBaseUrl);
    console.debug('Waiting for workflow...');
    await waitUntilAvailable(nifiApiUrl + '/access/config', 5 * seconds);
    console.debug('Started containers.');
}

async function stopContainers() {
    execSync('docker compose down', {stdio: 'ignore'});
}

function withoutSimulatorBaseUrl(nodeUrl: string): string {
    const baseUrl = 'http://gipod-simulator';
    return nodeUrl.replace(baseUrl, '');
}

async function visitNode(partialUrl: string, visited: string[]): Promise<string[]> {
    if (visited.includes(partialUrl)) {
        return;
    }

    const content = await http.get(simulatorBaseUrl + partialUrl).then(x => x.data).catch(e => { console.error(`Requesting '${this.url}' failed\n`, e); throw e; });
    const fragment = new LdesFragment(content);
    visited.push(withoutSimulatorBaseUrl(fragment.id));

    fragment.memberIds.forEach(x => expected.push(x));
    const relatedUrls = fragment.relatedNodeIds.map(x => withoutSimulatorBaseUrl(x));

    for (const url of relatedUrls) {
        await visitNode(url, visited);
    }
}

async function retrieveExpectedMemberIds(nodeUrl: string) {
    expected = [];
    const visited: string[] = [];
    await visitNode(nodeUrl, visited);
    expected.sort();
}

// async function startNifiWorkflow(workflowId: string) {
//     await www.put(nifiApiUrl + '/flow/process-groups/' + workflowId, {id:workflowId,state:"RUNNING"});
// }

// async function stopNifiWorkflow(workflowId: string) {
//     await www.put(nifiApiUrl + '/flow/process-groups/' + workflowId, {id:workflowId,state:"STOPPED"});
// }

Before({ timeout: 5 * minutes }, async function () {
    await startContainers();
});

After({ timeout: 15 * seconds }, function () {
    stopContainers();
});

Given('the GIPOD data set is available at {string}', async function (url: string) {
    await retrieveExpectedMemberIds(url);
});

When('the LDES client retrieves the complete data set', { timeout: 5 * seconds }, async function () { // TODO: change timeout to 5 minutes
    // TODO: add new process group to nifiRootProcessGroupUrl with pre-configured workflow and start it
    await waitUntilAllMembersReceived(sinkBaseUrl + '/', expected.length);
    // TODO: stop and remove the new process group
});

Then('all the LDES member are received', async function () {
    const sinkGetMembers = sinkBaseUrl + '/member';
    const actual = await http.get(sinkGetMembers).then(response => response.data).then((x: string[]) => x.sort());
    assert.deepStrictEqual(actual, expected);
});
