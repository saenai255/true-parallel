
# True Parallel

![Tests](https://github.com/paulcosma97/true-parallel/workflows/master%20tests/badge.svg)

This library helps you to handle JavaScript threads more easily, without exhausting resources or limiting performance. I made it to help me with some of my projects.

Feel free the create issues and pull requests.

## Tasks

Task Model:
```ts
class Task<TResult, TArgs, TEvent = unknown> {
	/**
	 * @param fn Function to execute in a separate thread.
	 * @param args Arguments passed to the function.
	 */
	static of(fn: TaskFunction<TResult, TArgs>, args: TArgs): Task<TResult, TArgs, never>;
	/**
	 * @param path *Absolute* path to the TaskSource interface implementation. 
	 * @param args Arguments passed to the run function.
	 */
	static fromSource(path: string, args: TArgs): Task<TResult, TArgs, TEvent>;

	/**
	 * Executes the current task in a different thread.
	 */
	execute(): Promise<TResult>;

	/**
	 * Returns an *rxjs* Observable that holds all the emitted events.
	 */
	events: Observable<TEvent>;
}
```

## Examples

This section illustrates some synthetic examples. Take them with a grain of salt.

### Using Functions

**Important!**
All functions must be *pure*. This means that they should only rely on *input parameters* and *output* because they cannot access any higher scope, even if the IDE doesn't highlight an error.

Working Example:
```ts
const task = Task.of(({ a, b }) => a + b, {
	a: 1,
	b: 2
});

const result = await Task.execute();
console.log(result) // 3;
```
Example of a bad function parameter:
```ts
const b = 2;
const task = Task.of({ a }) => a + b /* b is not in scope */, {
	a: 1
});

const result = await Task.execute(); // Error
console.log(result);
```

### Using files

**Important!**
Classes must be `default` exported in order to work. For non-typescript users, `module.exports = MyClass;` also works.

By using this method, you are no longer constrained by the current scope. 

example-task.ts
```ts
interface ExampleTaskArgs {
	a: number;
	b: number;
}

export default ExampleTask extends TaskSource<number, ExampleTaskArgs> {
	run({ a, b }: ExampleTaskArgs): number | Promise<number> {
		return a + b;
	}
}
```

main.ts
```ts
import ExampleTask from './example-task';
import { resolve } from 'path';

async function main(): Promise<void> {
	const taskPath = resolve(__dirname, './example-task');
	const task = Task.fromSource<ExampleTask>(taskPath, { a: 5, b: 3 });

	const result = await Task.execute();
	console.log(result) // 8;
}

main();
```

#### Emitting events from child to parent

example-task-with-events.ts
```ts
export default ExampleTaskWithEvents extends TaskSource<boolean, void, string> {
	run(): boolean {
		this.eventPublisher.publish('Hello');
		this.eventPublisher.publish('World!');
		return true;
	}
}
```

main.ts
```ts
import ExampleTaskWithEvents from './example-task-with-events';
import { resolve } from 'path';

async function main(): Promise<void> {
	const taskPath = resolve(__dirname, './example-task-with-events');
	const task = Task.fromSource<ExampleTaskWithEvents>(taskPath);

	task.events.subscribe(message => {
		console.log(message); // prints 'Hello' then 'World!'
	});

	const result = await Task.execute();
	console.log(result) // true;
}

main();
```