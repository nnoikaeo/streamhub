import { describe, it, expect } from 'vitest'
import { nextSegmentIndex } from '../../app/utils/segmentedKeys'

describe('nextSegmentIndex', () => {
  it('steps forward with ArrowRight and ArrowDown', () => {
    expect(nextSegmentIndex('ArrowRight', 0, 3)).toBe(1)
    expect(nextSegmentIndex('ArrowDown', 1, 3)).toBe(2)
  })

  it('steps back with ArrowLeft and ArrowUp', () => {
    expect(nextSegmentIndex('ArrowLeft', 2, 3)).toBe(1)
    expect(nextSegmentIndex('ArrowUp', 1, 3)).toBe(0)
  })

  it('wraps around at both ends', () => {
    expect(nextSegmentIndex('ArrowRight', 2, 3)).toBe(0)
    expect(nextSegmentIndex('ArrowLeft', 0, 3)).toBe(2)
  })

  it('jumps to the ends with Home and End', () => {
    expect(nextSegmentIndex('Home', 2, 3)).toBe(0)
    expect(nextSegmentIndex('End', 0, 3)).toBe(2)
  })

  it('leaves other keys alone', () => {
    expect(nextSegmentIndex('Tab', 0, 3)).toBeUndefined()
    expect(nextSegmentIndex('Enter', 0, 3)).toBeUndefined()
    expect(nextSegmentIndex(' ', 0, 3)).toBeUndefined()
  })

  it('handles an empty option list', () => {
    expect(nextSegmentIndex('ArrowRight', 0, 0)).toBeUndefined()
  })
})
