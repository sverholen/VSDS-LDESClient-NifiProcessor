import axios from 'axios';

interface TreeRelation {
    "@type": string;
    "tree:node": string;
}

interface LdesMember {
    "@id": string;
}

interface LdesContent {
    "tree:relation": TreeRelation[];
    items: LdesMember[];
}

const www = axios;

export class LdesFragment {
    private data: LdesContent;
    constructor(private url: string) { }

    private async load() {
        // console.debug(`Requesting '${this.url}'`);
        this.data = await www.get(this.url)
            .then(response => response.data)
            .catch(e => { console.error(`Requesting '${this.url}' failed\n`, e); throw e; });
    }

    private get members(): LdesMember[] {
        return this.data.items;
    }

    private nextNode(ofType: string = 'tree:GreaterThanRelation'): LdesFragment | undefined {
        const relations: TreeRelation[] = this.data['tree:relation'];
        const node = relations.filter(x => x['@type'] === ofType).shift();
        return node ? new LdesFragment(node['tree:node']) : undefined;
    }

    public static async traverse(url: string, handleMember: (member: LdesMember) => void) {
        let fragment = new LdesFragment(url);
        while (fragment) {
            await fragment.load();
            fragment.members.forEach(x => handleMember(x));
            fragment = fragment.nextNode();
        }
    }
}
