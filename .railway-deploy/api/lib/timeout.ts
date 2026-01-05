export function withTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  const timeout = new Promise<T>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise.then((v) => {
    if (timer) clearTimeout(timer);
    return v;
  }), timeout]);
}

export default withTimeout;
