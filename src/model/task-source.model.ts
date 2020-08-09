export default interface TaskSource<TResult, TArgs> {
    run(args: TArgs): TResult | Promise<TResult>; 
}

export interface TaskSourceMeta {
    isTypeScript: boolean;
    fileName: string;
}