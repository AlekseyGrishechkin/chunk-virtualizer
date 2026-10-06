import { useCallback, useRef, useState, useEffect, useMemo } from 'react'

export interface UseVirtualViewportOptions {
  itemCount: number
  itemSize: number
  initialCount?: number
  step?: number
  direction?: 'horizontal' | 'vertical'
  overscan?: number
  scrollContainerRef: React.RefObject<HTMLElement | null>
  resetTrigger?: string | number | boolean 
}

export interface VirtualItem {
  index: number
  size: number
  start: number
}

export interface UseVirtualViewportReturn {
  virtualItems: VirtualItem[]
  totalSize: number
  loadedCount: number
  reset: () => void
}

const DEFAULT_INITIAL_COUNT = 30
const DEFAULT_STEP = 20
const DEFAULT_OVERSCAN = 5

/**
 * Validates numerical inputs to guarantee runtime protection against NaN, Infinity, or negative bounds.
 */
const toPositiveNumber = (value: number, fallback: number): number =>
  Number.isFinite(value) && value > 0 ? value : fallback

export function useVirtualViewport({
  itemCount,
  itemSize,
  initialCount = DEFAULT_INITIAL_COUNT,
  step = DEFAULT_STEP,
  direction = 'vertical',
  overscan = DEFAULT_OVERSCAN,
  scrollContainerRef,
  resetTrigger,
}: UseVirtualViewportOptions): UseVirtualViewportReturn {
  // 1. Strict validation of configuration arguments
  const safeItemSize = toPositiveNumber(itemSize, 1)
  const safeStep = toPositiveNumber(step, DEFAULT_STEP)
  const safeOverscan = Math.max(0, Number.isFinite(overscan) ? overscan : DEFAULT_OVERSCAN)
  const safeItemCount = Math.max(0, Number.isFinite(itemCount) ? itemCount : 0)
  const safeInitialCount = Math.min(toPositiveNumber(initialCount, DEFAULT_INITIAL_COUNT), safeItemCount)

  // Core internal layout states
  const [loadedCount, setLoadedCount] = useState(safeInitialCount)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [containerSize, setContainerSize] = useState(0)

  const isVertical = direction === 'vertical'

  // 2. State synchronization: clamps memory space down instantly during dynamic Big Data filtering
  useEffect(() => {
    setLoadedCount((prev) => Math.min(prev, safeItemCount))
  }, [safeItemCount])

  // Normalizes lookups against strict collection boundaries
  const effectiveLoadedCount = Math.min(loadedCount, safeItemCount)

  // Unitary callback clearing layout states and hardware nodes synchronously
  const reset = useCallback(() => {
    setLoadedCount(safeInitialCount)
    setScrollOffset(0)
    
    const container = scrollContainerRef.current
    if (container) {
      if (isVertical) container.scrollTop = 0
      else container.scrollLeft = 0
    }
  }, [safeInitialCount, isVertical, scrollContainerRef])

  // 3. Automated handle triggering baseline rollback sequence when query dependencies switch
  useEffect(() => {
    reset()
  }, [resetTrigger, reset])

  // 4. Reactive geometry evaluation allocating container bounds tracking via ResizeObserver
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries?.length) return
      const entry = entries[0]
      
      // Cross-browser safe allocation mapping for layout size shifts
      const borderBox = entry.borderBoxSize?.[0] ?? entry.borderBoxSize
      const size = isVertical 
        ? borderBox?.blockSize ?? entry.contentRect.height 
        : borderBox?.inlineSize ?? entry.contentRect.width
        
      setContainerSize(size)
    })

    resizeObserver.observe(container)
    
    // Synchronous allocation fallbacks preventing empty frames immediately on mount
    setContainerSize(isVertical ? container.clientHeight : container.clientWidth)
    setScrollOffset(isVertical ? Math.max(0, container.scrollTop) : Math.max(0, container.scrollLeft))

    return () => resizeObserver.disconnect()
  }, [scrollContainerRef, isVertical])

  // 5. Throttled scroll listener executing coordinate synchronization via requestAnimationFrame
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let animationFrameId: number

    const handleScroll = () => {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(() => {
        const currentOffset = isVertical ? container.scrollTop : container.scrollLeft
        // Clamps lower boundary against negative values (triggered by iOS rubber-banding bounce/RTL layouts)
        setScrollOffset(Math.max(0, currentOffset))
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [scrollContainerRef, isVertical])

  // 6. Progressive chunk allocation threshold evaluating dynamic infinite loading strides
  useEffect(() => {
    if (effectiveLoadedCount >= safeItemCount) return

    const currentTotalSize = effectiveLoadedCount * safeItemSize
    const scrollRemaining = currentTotalSize - (scrollOffset + containerSize)
    const threshold = safeItemSize * 3 

    if (scrollRemaining <= threshold) {
      // Deterministically computes specific required offset vectors to seamlessly bridge wide layout frames
      const visibleEnd = Math.ceil((scrollOffset + containerSize) / safeItemSize)
      const targetCount = visibleEnd + safeOverscan + 3

      setLoadedCount((prev) => {
        if (prev >= safeItemCount) return prev
        const nextCount = Math.max(prev + safeStep, targetCount)
        return Math.min(safeItemCount, nextCount)
      })
    }
  }, [scrollOffset, containerSize, effectiveLoadedCount, safeItemCount, safeStep, safeItemSize, safeOverscan])

  // 7. Declarative virtual window space mapping calculations avoiding direct mutations
  const { virtualItems, totalSize } = useMemo(() => {
    const totalSize = effectiveLoadedCount * safeItemSize

    const startIndex = Math.max(0, Math.floor(scrollOffset / safeItemSize) - safeOverscan)
    const endIndex = Math.min(
      effectiveLoadedCount - 1,
      Math.floor((scrollOffset + containerSize) / safeItemSize) + safeOverscan
    )

    // Tracks total active index count slots designated for virtualization bounds context
    const rangeSize = endIndex >= startIndex ? endIndex - startIndex + 1 : 0

    // Generates coordinates cleanly without mutable loop markers
    const virtualItems: VirtualItem[] = Array.from({ length: rangeSize }, (_, k) => {
      const index = startIndex + k
      return {
        index,
        size: safeItemSize,
        start: index * safeItemSize,
      }
    })

    return { virtualItems, totalSize }
  }, [effectiveLoadedCount, safeItemSize, scrollOffset, containerSize, safeOverscan])

  return {
    virtualItems,
    totalSize,
    loadedCount: effectiveLoadedCount,
    reset,
  }
}
