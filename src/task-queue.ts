export type Task<T> = () => Promise<T>;

export interface TaskQueueOptions {
    parallelOperations?: number
}

export async function runTasks<T>(tasks: Task<T>[], options?: TaskQueueOptions): Promise<PromiseSettledResult<Awaited<T>>[]> {
    const batchSize = options?.parallelOperations ?? 20;
    let results = [];

    do {
        const batch = tasks.splice(0, batchSize)
            .map(task => task());

        results.push(...await Promise.allSettled(batch));
    } while (tasks.length > 0);
    
    return results;
}