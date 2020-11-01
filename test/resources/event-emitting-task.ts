import { TaskSource } from "../../src";

export interface TaskProps {
    iterations: number;
}

export default class EmitFibNumbers extends TaskSource<void, TaskProps, number[]> {
    run({ iterations }: TaskProps): void {
        
        let [first, second] = this.fib(0, 1);
        while(iterations--) {
            this.eventPublisher.publish([first, second]);
            [first, second] = this.fib(first, second);
        }
    }

    private fib(first: number, second: number): [number, number] {
        return [second, first + second];
    }
}