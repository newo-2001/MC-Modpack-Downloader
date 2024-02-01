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
    private results: PromiseSettledResult<T>[] = [];
    private totalTasks: number;

    constructor(private tasks: Task<T>[], private readonly options?: ConcurrentTaskOptions) {
        super();
        this.totalTasks = tasks.length;
    }

    public async run(): Promise<PromiseSettledResult<T>[]> {
        const concurrency = this.options?.concurrency ?? defaultConcurrentTaskOptions.concurrency;

        return new Promise((resolve, _) => {
            this.on(ConcurrentTask.FinishedEvent, () => resolve(this.results));

            for (let i = 0; i < concurrency; i++) {
                this.nextTask();
            }
        })
    }

    private async nextTask(): Promise<void> {
        if (this.tasks.length == 0) {
            if (this.results.length == this.totalTasks) {
                this.emit(ConcurrentTask.FinishedEvent);
            }

            return;
        }

        try {
            const result = await this.tasks.shift()();
            this.results.push({ status: "fulfilled", value: result });

            this.nextTask();
        } catch (err) {
            this.results.push({ status: "rejected", reason: err });
            this.emit(ConcurrentTask.FailureEvent, err);
        }
        
        this.emit(ConcurrentTask.ProgressEvent, this.progress());
    }

    public progress(): ConcurrentTaskProgress {
        const remaining = this.totalTasks - this.results.length;

        return {
            remaining,
            finished: this.results.length,
            total: this.totalTasks
        };
    }

    public static ProgressEvent: symbol = Symbol();
    public static FinishedEvent: symbol = Symbol();
    public static FailureEvent: symbol = Symbol();
}