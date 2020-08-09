import { Task } from "../src";
import { resolve } from "path";
import ExampleClass from "./example-task";
import ExampleClassWithImports from "./example-task-with-imports";

test(`Task#fromSource - returns the correct value`, async () => {
    const task = Task.fromSource<ExampleClass>(resolve(__dirname, './example-task'), {
        a: 5,
        b: 7
    });

    const result = await task.execute();
    expect(result).toBe(12);
});

test(`Task#fromSource - works using imports`, async () => {
    const task = Task.fromSource<ExampleClassWithImports>(resolve(__dirname, './example-task-with-imports'), {
        a: 5,
        b: 7
    });

    const result = await task.execute();
    expect(result).toBe(12);
});