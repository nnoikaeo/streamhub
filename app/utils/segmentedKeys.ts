/**
 * Which option a key moves to in a SegmentedControl, or `undefined` when the
 * key is not one the control handles (so the event is left alone).
 *
 * Same keys as a native radio group: the arrows step and wrap around, Home and
 * End jump to the ends.
 */
export function nextSegmentIndex(key: string, index: number, count: number): number | undefined {
  if (count <= 0) return undefined
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (index + 1) % count
    case 'ArrowLeft':
    case 'ArrowUp':
      return (index - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return undefined
  }
}
