import { TaskSource } from "../../src";
import { sum } from "../utils";

export interface ExampleClassArgs {
    a: number;
    b: number;
}

export default class ExampleClassWithImports extends TaskSource<number, ExampleClassArgs> {
    run({ a, b }: ExampleClassArgs): number | Promise<number> {
        return this.computeSumUsingImportedFunction(a, b);
    }

    private computeSumUsingImportedFunction(a: number, b: number): number {
        return sum(a, b);
    }
}