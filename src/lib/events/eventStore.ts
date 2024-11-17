import { v7 as uuidv7 } from 'uuid';

export interface Tag {
    key: string;
    value: string;
}

export interface Event<E> {
    id: string;
    type: string;
    payload: E;
    tags: Tag[];
    timestamp: Date;
}

export class TagGroup {
    private tags: Tag[] = [];

    constructor(tags: Tag[]) {
        this.tags = tags;
    }

    static create(tags: Tag[]): TagGroup {
        return new TagGroup(tags);
    }

    matches(eventTags: Tag[]): boolean {
        return this.tags.every(searchTag =>
            eventTags.some(eventTag =>
                eventTag.key === searchTag.key &&
                eventTag.value === searchTag.value
            )
        );
    }
}

export class InMemoryEventStore {
    private events: Event<any>[] = [];

    async append<E>(event: Omit<Event<E>, 'id' | 'timestamp'>): Promise<void> {
        this.events.push({
            ...event,
            id: uuidv7(),
            timestamp: new Date()
        });
    }

    async getEventsByTagGroups(tagGroups: TagGroup[]): Promise<Event<any>[]> {
        return this.events.filter(event =>
            // OR between groups
            tagGroups.some(group =>
                group.matches(event.tags)
            )
        );
    }

    async getAllEvents(): Promise<Event<any>[]> {
        return [...this.events];
    }
}

export const eventStore = new InMemoryEventStore(); 