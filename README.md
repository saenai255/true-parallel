
# True Parallel

This library helps you to handle JavaScript threads more easily, without exhausting resources or limiting performance. I made it due to help me with some of my projects.

Feel free the create issues and pull requests.

## Tasks

Task Model:
```ts
class Task<TResult, TArgs> {
	/**
	 * @param fn Function to execute in a separate thread.
	 * @param args Arguments passed to the function.
	 */
	static of(fn: TaskFunction<TResult, TArgs>, args: TArgs): Task<TResult, TArgs>;
	/**
	 * @param path *Absolute* path to the TaskSource interface implementation. 
	 * @param args Arguments passed to the run function.
	 */
	static fromSource(path: string, args: TArgs): Task<TResult, TArgs>;

	/**
	 * Executes the current task in a different thread.
	 */
	execute(): Promise<TResult>;
}
```

## Examples

This section illustrates some synthetic examples. Take them with a grain of salt.

### Using Functions

**Important!**
All functions must be *pure*. This means that they should only rely on *input parameters* and *output* because they cannot access any higher scope, even if the IDE doesn't highlight an error.

Good Example:
```ts
const task = Task.of(({ a, b }) => a + b, {
	a: 1,
	b: 2
});

const result = await Task.execute();
console.log(result) // 3;
```
Bad Example:
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

export default ExampleTask implements TaskSource<number, ExampleTaskArgs> {
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




