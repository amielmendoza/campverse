const inflight = new Map<string, Promise<unknown>>()

/**
 * Prevents duplicate mutations (double-click protection).
 *
 * If a mutation with the same key is already in-flight, returns the
 * existing promise instead of firing a second request.
 */
export async function guardedMutation<T>(
  key: string,
  mutationFn: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  const promise = mutationFn().finally(() => {
    inflight.delete(key)
  })

  inflight.set(key, promise)
  return promise
}
