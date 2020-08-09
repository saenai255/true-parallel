import { TaskSource } from "../src";

export interface ExampleClassArgs {
    a: number;
    b: number;
}

export default class ExampleClass implements TaskSource<number, ExampleClassArgs> {
    run({ a, b }: ExampleClassArgs): number | Promise<number> {
        return a + b;
    }
}