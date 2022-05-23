interface TreeRelation {
    "@type": string;
    "tree:node": string;
}

interface LdesMember {
    "@id": string;
}

interface LdesContent {
    "@id": string;
    "tree:relation": TreeRelation[];
    items: LdesMember[];
}

export class LdesFragment {
    constructor(private data: LdesContent) { }

    public get id(): string {
        return this.data['@id'];
    }

    public get memberIds(): string[] {
        return this.data.items.map(x => x['@id']);
    }

    public get relatedNodeIds(): string[] {
        return this.data['tree:relation'].map(x => x['tree:node']);
    }
}
