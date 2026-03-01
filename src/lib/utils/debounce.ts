/** Returns a debounced version of the given function with a cancel method */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delayMs)
  }
  debounced.cancel = () => clearTimeout(timeoutId)
  return debounced
}
