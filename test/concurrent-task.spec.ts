import "reflect-metadata";
import { describe, expect, test, vi } from "vitest";
import { ConcurrentTask } from "../src/concurrent-task";

async function sleep(millis: number): Promise<void> {
    return new Promise((resolve, _) => setTimeout(resolve, millis));
}

describe("run()", () => {
    test("executes the tasks concurrently", async () => {
        let secondStarted = false;
        let firstFinished = false;

        const first = async () => {
            while (!secondStarted) await sleep(0);
            firstFinished = true;
        }

        const second = async () => {
            secondStarted = true;
            while (!firstFinished) await sleep(0);
        }

        const task = new ConcurrentTask([first, second], { concurrency: 2 });
        const results = await task.run();
        expect(results.every(x => x.status == "fulfilled"));
    });

    test("emits a ProgressEvent for every finished subtask", async () => {
        const task = new ConcurrentTask([
            () => Promise.resolve(),
            () => Promise.resolve(),
            () => Promise.reject()
        ]);

        const callback = vi.fn(); 
        task.on(ConcurrentTask.ProgressEvent, callback);

        await task.run();

        expect(callback).toHaveBeenCalledTimes(3);
        for (let i = 1; i <= 3; i++) {
            expect(callback).toHaveBeenNthCalledWith(i, {
                finished: i,
                remaining: 3 - i,
                total: 3
            });
        }
    });

    test("emits a FailureEvent for every failed subtask", async () => {
        const task = new ConcurrentTask([
            () => Promise.reject("First Error"),
            () => Promise.reject("Second Error"),
            () => Promise.resolve()
        ]);

        const callback = vi.fn();
        task.on(ConcurrentTask.FailureEvent, callback);

        await task.run();

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith("First Error");
        expect(callback).toHaveBeenCalledWith("Second Error");
    });

    test("emits a FinishedEvent when all subtasks are done", async () => {
        let finished = false;
        const callback = vi.fn(() => finished = true);

        const task = new ConcurrentTask([
            () => Promise.resolve(finished),
            () => Promise.reject(finished),
        ]);

        task.on(ConcurrentTask.FinishedEvent, callback);

        const results = await task.run();

        expect(callback).toHaveBeenCalledOnce();

        expect(results.length).toBe(2);
        expect(results).toEqual(expect.arrayContaining([
            { status: "rejected", reason: false },
            { status: "fulfilled", value: false }
        ]));
    });
});