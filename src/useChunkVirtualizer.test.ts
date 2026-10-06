// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChunkVirtualizer } from './useChunkVirtualizer'
import React from 'react'

// 1. Mock global browser API environments
const mockResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(() => {
    // Simulates an immediate observer callback setting container size to 500px
    callback([{ 
      borderBoxSize: [{ blockSize: 500, inlineSize: 500 }], 
      contentRect: { height: 500, width: 500 } 
    }])
  }),
  disconnect: vi.fn(),
}))
vi.stubGlobal('ResizeObserver', mockResizeObserver)

vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => cb(0))
vi.stubGlobal('cancelAnimationFrame', vi.fn())

describe('useVirtualViewport', () => {
  let scrollContainerRef: React.RefObject<HTMLElement>

  beforeEach(() => {
    vi.clearAllMocks()
    // Create a mock DOM node for the scrollable container wrapper
    const element = document.createElement('div')
    Object.defineProperty(element, 'clientHeight', { value: 500, writable: true })
    Object.defineProperty(element, 'clientWidth', { value: 500, writable: true })
    Object.defineProperty(element, 'scrollTop', { value: 0, writable: true })
    scrollContainerRef = { current: element }
  })

  it('should initialize geometry state with proper default configurations', () => {
    const { result } = renderHook(() => useChunkVirtualizer({
      itemCount: 100,
      itemSize: 50,
      scrollContainerRef,
    }))

    // Container size 500px / itemSize 50px = 10 items visible + 5 overscan + 1 edge buffer slot = 16 elements
    expect(result.current.virtualItems.length).toBe(16)
    // totalSize calculation must cleanly map against target track footprints (initialCount 30 * 50 = 1500px)
    expect(result.current.totalSize).toBe(1500)
    expect(result.current.loadedCount).toBe(30)
  })

  it('should guarantee absolute runtime protection against non-valid elements where itemSize <= 0', () => {
    const { result } = renderHook(() => useChunkVirtualizer({
      itemCount: 100,
      itemSize: 0, // Passing unexpected numerical boundary zero
      scrollContainerRef,
    }))

    // safeItemSize runtime fallback enforces baseline divisor block array allocation width to avoid divisions by zero
    expect(result.current.virtualItems[0].size).toBe(1)
  })

  it('should properly execute entire transactional interface resetting coordinates along hardware nodes', () => {
    const { result } = renderHook(() => useChunkVirtualizer({
      itemCount: 100,
      itemSize: 50,
      scrollContainerRef,
    }))

    // Simulate scrolling sequence actions downwards
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 300
    }

    act(() => {
      result.current.reset()
    })

    expect(result.current.loadedCount).toBe(30)
    expect(scrollContainerRef.current?.scrollTop).toBe(0)
  })
})
