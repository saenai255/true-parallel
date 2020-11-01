export interface EventPublisher<T> {
    publish(value: T);
}

export default abstract class TaskSource<TResult, TArgs, TEvent = never> {
    protected eventPublisher: EventPublisher<TEvent>;
    abstract run(args: TArgs): TResult | Promise<TResult>; 
}

export interface TaskSourceMeta {
    isTypeScript: boolean;
    fileName: string;
}