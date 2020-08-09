import TaskSource, { TaskSourceMeta } from "./task-source.model";
import { Worker } from 'worker_threads';
import { exists } from "fs";

export type TaskFunction<R, A extends Record<string | symbol, any>> = (args: A) => R | Promise<R>;
type TaskSourceTypes<T> = T extends TaskSource<infer Result, infer Args> ? [Result, Args] : never; 

export default class Task<TResult, TArgs> {
    private constructor(
        private fn: TaskFunction<TResult, TArgs> | null,
        private sourcePath: string | null,
        private args: TArgs) { }

    static of<TResult, TArgs>(fn: TaskFunction<TResult, TArgs>, args: TArgs = undefined): Task<TResult, TArgs> {
        return new Task<TResult, TArgs>(fn, null, args);
    }

    static fromSource<T>(path: string, args: TaskSourceTypes<T>[1]): Task<TaskSourceTypes<T>[0], TaskSourceTypes<T>[1]> {
        return new Task(null, path, args);
    }

    static wait(ms: number): Task<void, { ms: number }> {
        return new Task(async ({ ms }) => {
            return new Promise(resolve => setTimeout(resolve, ms))
        }, null, { ms });
    }

    execute(): Promise<TResult> {
        return new Promise(async (resolve, reject) => {
            const worker = new Worker(await this.toThreadSafeRunnable(), {
                eval: true
            });

            worker.on('message', resolve);
            worker.on('error', reject);
        });
    }

    private get isFunction(): boolean {
        return !!this.fn;
    }

    private async toThreadSafeRunnable(): Promise<string> {
        if (this.isFunction) {
            return this.convertFunctionToCode();
        } else {
            return this.convertSourceFileToCode();
        }
    }

    private convertFunctionToCode(): string {
        const rawFn = this.fn.toString();
        let newRawFn = `
            (async () => {
                const { parentPort } = require('worker_threads');
                let __args;
                
                try {
                    __args = JSON.parse('${JSON.stringify(this.args)}');
                } catch(e) {
                    __args = this.args;
                }

                const result = await (${rawFn})(__args);
                parentPort.postMessage(result);          
            })();
        `.trim();

        return newRawFn;
    }

    private async convertSourceFileToCode(): Promise<string> {
        const { isTypeScript, fileName } = await this.getSourceMeta(this.sourcePath);

        return `
            (async () => {
                const { parentPort } = require('worker_threads');
                if (${isTypeScript}) {
                    require('ts-node').register();
                }
                const file = require('${fileName}');

                const clazz = file.default ? file.default : file;

                let __args;
                
                try {
                    __args = JSON.parse('${JSON.stringify(this.args)}');
                } catch(e) {
                    __args = this.args;
                }

                const instance = new clazz();
                const result = await instance.run(__args);
                parentPort.postMessage(result);
            })();
        `;
    }

    private fileExists(path: string): Promise<boolean> {
        return new Promise(resolve => exists(path, resolve));
    }

    private async getSourceMeta(path: string): Promise<TaskSourceMeta> {
        if (await this.fileExists(path + '.ts')) {
            return {
                fileName: path + '.ts',
                isTypeScript: true
            }
        } else {
            return {
                fileName: path + '.js',
                isTypeScript: false
            }
        }
    }
}