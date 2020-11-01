import TaskSource, { TaskSourceMeta } from "./task-source.model";
import { Worker } from 'worker_threads';
import { exists } from "fs";
import { Observable, Subject, throwError } from "rxjs";

export type TaskFunction<R, A extends Record<string | symbol, any>> = (args: A) => R | Promise<R>;
type TaskSourceTypes<T> = T extends TaskSource<infer Result, infer Args, infer Event> ? [Result, Args, Event] : never;

enum EventType {
    EVENT_TASK_COMPLETED = 'EVENT_TASK_COMPLETED',
    EVENT_PUBLISH = 'EVENT_PUBLISH'
}

interface TaskEvent<TResult> {
    __TP_TYPE: EventType;
    __TP_RESULT?: TResult;
}

function isTaskEvent(obj: any): obj is TaskEvent<any> {
    return obj && '__TP_TYPE' in obj;
}

export default class Task<TResult, TArgs, TEvent = unknown> {
    private events$ = new Subject<TEvent>();

    private constructor(
        private fn: TaskFunction<TResult, TArgs> | null,
        private sourcePath: string | null,
        private args: TArgs) { }

    static of<TResult, TArgs>(fn: TaskFunction<TResult, TArgs>, args: TArgs = undefined): Task<TResult, TArgs, never> {
        return new Task<TResult, TArgs, never>(fn, null, args);
    }

    static fromSource<T>(path: string, args: TaskSourceTypes<T>[1]): Task<TaskSourceTypes<T>[0], TaskSourceTypes<T>[1], TaskSourceTypes<T>[2]> {
        return new Task(null, path, args);
    }

    static wait(ms: number): Task<void, { ms: number }> {
        return new Task(async ({ ms }) => {
            return new Promise(resolve => setTimeout(resolve, ms))
        }, null, { ms });
    }

    get events(): Observable<TEvent> {
        return this.events$.asObservable();
    }

    execute(): Promise<TResult> {
        return new Promise<TResult>(async (resolve, reject) => {
            const worker = new Worker(await this.toThreadSafeRunnable(), {
                eval: true,
                workerData: this.args
            });

            worker.on('message', value => {
                if (isTaskEvent(value)) {
                    if (value.__TP_TYPE === EventType.EVENT_TASK_COMPLETED) {
                        this.events$.complete();
                        return resolve(value.__TP_RESULT);
                    }

                    if (value.__TP_RESULT) {
                        this.events$.next(value.__TP_RESULT);
                        return;
                    }

                    
                } else {
                    this.events$.complete();
                    return reject(value);
                }

            });

            worker.on('error', error => {
                this.events$.complete();
                reject(error)
            });
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
                const { parentPort, workerData } = require('worker_threads');
                const __args = workerData;

                const result = await (${rawFn})(__args);
                parentPort.postMessage({
                    __TP_RESULT: result,
                    __TP_TYPE: '${EventType.EVENT_TASK_COMPLETED}'
                });          
            })();
        `.trim();

        return newRawFn;
    }

    private async convertSourceFileToCode(): Promise<string> {
        const { isTypeScript, fileName } = await this.getSourceMeta(this.sourcePath);

        return `
            (async () => {
                const { parentPort, workerData } = require('worker_threads');
                const __args = workerData;

                if (${isTypeScript}) {
                    require('ts-node').register();
                }

                const file = require('${fileName}');
                const clazz = file.default ? file.default : file;

                const instance = new clazz();
                instance.eventPublisher = {
                    publish: arg => parentPort.postMessage({
                        __TP_RESULT: arg,
                        __TP_TYPE: '${EventType.EVENT_PUBLISH}'
                    })
                };
                
                const result = await instance.run(__args);
                parentPort.postMessage({
                    __TP_RESULT: result,
                    __TP_TYPE: '${EventType.EVENT_TASK_COMPLETED}'
                });
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