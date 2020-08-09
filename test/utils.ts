export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const getDuration = async (fn: () => any): Promise<number> => {
    const start = Date.now();
    await fn();
    return Date.now() - start;
}

export const simulateHeavyThreadBlockingWork = (): true => {
    for(let i = 0; i < 1000000000; i++);
    return true;
}

export const promisify = cb => () => new Promise(resolve => {
    setImmediate(async () => {
        await cb();
        resolve();
    });
});

export const sum = (a: number, b: number): number => a + b;
