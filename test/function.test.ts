import { Task } from "../src";
import { sleep, getDuration, simulateHeavyThreadBlockingWork, promisify } from "./utils";


test(`Task#wait - waits works`, async () => {
    const task = Task.wait(1000);
    let waitComplete = false;

    const taskStartTime = Date.now();
    let taskDuration: number;

    task.execute().then(() => {
        waitComplete = true;
        taskDuration = Date.now() - taskStartTime;
    });
    await sleep(1200);

    expect(waitComplete).toBe(true);
    expect(taskDuration).toBeGreaterThanOrEqual(1000);
}, 1500);

test(`Task#of - does not block the thread`, async () => {
    const simulateHeavyWorkAsPromise = promisify(simulateHeavyThreadBlockingWork);
    
    const singleRunDuration = await getDuration(simulateHeavyThreadBlockingWork);
    const doubleRunDuration = await getDuration(() => Promise.all([
        simulateHeavyWorkAsPromise(),
        simulateHeavyWorkAsPromise()
    ]));

    const task = Task.of(simulateHeavyThreadBlockingWork);

    const doubleRunDurationUsingTasks = await getDuration(() => Promise.all([
        task.execute(),
        task.execute()
    ]));

    const singleRunDurationDiff = Math.abs(singleRunDuration - doubleRunDurationUsingTasks);
    const doubleRunDurationDiff = Math.abs(doubleRunDuration - doubleRunDurationUsingTasks);
    const errorMargin = singleRunDuration / 1.5;

    expect(doubleRunDurationUsingTasks).toBeLessThan(doubleRunDuration);
    expect(singleRunDurationDiff).toBeLessThanOrEqual(errorMargin);
    expect(doubleRunDurationDiff).toBeLessThanOrEqual(errorMargin);
});

test(`Task#of - returns the correct value`, async () => {
    const task = Task.of(({ a, b }) => a + b, {
        a: 5,
        b: 7
    });

    const result = await task.execute();
    expect(result).toBe(12);
});