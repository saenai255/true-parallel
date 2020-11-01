import { Task } from "../src";
import { resolve } from "path";
import ExampleClass from "./resources/example-task";
import ExampleClassWithImports from "./resources/example-task-with-imports";
import EmitFibNumbers from "./resources/event-emitting-task";

describe(`Class-based tasks`, () => {
    test(`Task#fromSource - returns the correct value`, async () => {
        const task = Task.fromSource<ExampleClass>(resolve(__dirname, '../resources/example-task'), {
            a: 5,
            b: 7
        });
    
        const result = await task.execute();
        expect(result).toBe(12);
    });
    
    test(`Task#fromSource - works using imports`, async () => {
        const task = Task.fromSource<ExampleClassWithImports>(resolve(__dirname, '../resources/example-task-with-imports'), {
            a: 5,
            b: 7
        });
    
        const result = await task.execute();
        expect(result).toBe(12);
    });
    
    test(`Task#fromSource - emits events as expected`, async () => {
        const iterations = 50;
        const someHandler = {
            handleFibNumbers(...args) {
                // code ...
            }
        }

        const task = Task.fromSource<EmitFibNumbers>(resolve(__dirname, './resources/event-emitting-task'), {
            iterations
        });

        const spy = jest.spyOn(someHandler, 'handleFibNumbers');
    
        task.events.subscribe(value => {
            someHandler.handleFibNumbers(value);
        })
    
        await task.execute();
        expect(spy).toHaveBeenCalledTimes(iterations);
    })
})