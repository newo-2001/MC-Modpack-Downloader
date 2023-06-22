import EventEmitter from "events";

export type Task<T> = () => Promise<T>;

export interface ConcurrentTaskOptions {
    concurrency?: number
}

export interface ConcurrentTaskProgress {
    finished: number,
    remaining: number,
    total: number
}

const defaultConcurrentTaskOptions: ConcurrentTaskOptions = {
    concurrency: 20
}

export class ConcurrentTask<T> extends EventEmitter {
    private results: PromiseSettledResult<Awaited<T>>[] = [];

    constructor(private tasks: Task<T>[], private readonly options?: ConcurrentTaskOptions) {
        super();
    }

    public run(): Promise<PromiseSettledResult<Awaited<T>>[]> {
        return new Promise(async (resolve, reject) => {
            const batchSize = this.options?.concurrency ?? defaultConcurrentTaskOptions.concurrency;

            do {
                const batch = this.tasks.splice(0, batchSize)
                    .map(task => task());

                this.results.push(...await Promise.allSettled(batch));
                
                this.emit(ConcurrentTask.ProgressEvent, this.progress());
            } while (this.tasks.length > 0);

            resolve(this.results);
        });
    }

    public progress(): ConcurrentTaskProgress {
        const finished = this.results.length;
        const remaining = this.tasks.length;

        return {
            finished, remaining,
            total: finished + remaining
        };
    }

    public static ProgressEvent: symbol = Symbol();
}