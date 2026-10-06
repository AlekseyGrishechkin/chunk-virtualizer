import { useCallback,  useState, useEffect, useMemo } from 'react'

export interface UseChunkVirtualizerOptions {
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

export interface UseChunkVirtualizerReturn {
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

export function useChunkVirtualizer({
  itemCount,
  itemSize,
  initialCount = DEFAULT_INITIAL_COUNT,
  step = DEFAULT_STEP,
  direction = 'vertical',
  overscan = DEFAULT_OVERSCAN,
  scrollContainerRef,
  resetTrigger,
}: UseChunkVirtualizerOptions): UseChunkVirtualizerReturn {
  
  // 1. Strict runtime sanitization of user configuration properties
  const safeItemSize = toPositiveNumber(itemSize, 1)
  const safeStep = toPositiveNumber(step, DEFAULT_STEP)
  const safeOverscan = Math.max(0, Number.isFinite(overscan) ? overscan : DEFAULT_OVERSCAN)
  const safeItemCount = Math.max(0, Number.isFinite(itemCount) ? itemCount : 0)
  const safeInitialCount = Math.min(toPositiveNumber(initialCount, DEFAULT_INITIAL_COUNT), safeItemCount)

  // 2. Core reactive layout dimensions and pagination markers
  const [loadedCount, setLoadedCount] = useState(safeInitialCount)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [containerSize, setContainerSize] = useState(0)
  
  const isVertical = direction === 'vertical'
  const effectiveLoadedCount = Math.min(loadedCount, safeItemCount)

  // 3. React Core State Optimization: Adjusts internal boundaries during the rendering phase
  if (loadedCount > safeItemCount) {
    setLoadedCount(safeItemCount)
  }

  // 4. Unitary transactional handler restoring geometry and scrolling offsets synchronously
  const reset = useCallback(() => {
    setLoadedCount(safeInitialCount)
    setScrollOffset(0)
    const container = scrollContainerRef.current
    if (container) {
      if (isVertical) container.scrollTop = 0
      else container.scrollLeft = 0
    }
  }, [safeInitialCount, isVertical, scrollContainerRef])

  // Triggers holistic baseline resetting sequence whenever query or external tokens switch
  useEffect(() => {
    reset()
  }, [resetTrigger, reset])

  // 5. Geometry Evaluation: Tracking node dimensions via un-cluttered ResizeObserver
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries?.length) return
      const entry = entries[0]
      const borderBox = entry.borderBoxSize?.[0] ?? entry.borderBoxSize
      
      const size = isVertical 
        ? borderBox?.blockSize ?? entry.contentRect.height 
        : borderBox?.inlineSize ?? entry.contentRect.width
        
      setContainerSize(size)
    })

    resizeObserver.observe(container)
    
    // Reads initial coordinates precisely once upon mounting sequence execution
    setScrollOffset(isVertical ? Math.max(0, container.scrollTop) : Math.max(0, container.scrollLeft))

    return () => resizeObserver.disconnect()
  }, [scrollContainerRef, isVertical])

  // 6. High-Performance Scroll Handler: Throttling calculations using requestAnimationFrame
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let animationFrameId: number

    const handleScroll = () => {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(() => {
        const currentOffset = isVertical ? container.scrollTop : container.scrollLeft
        // Filters lower coordinate bounds against erratic hardware signals (e.g. iOS rubber-band bounce)
        setScrollOffset(Math.max(0, currentOffset))
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [scrollContainerRef, isVertical])

  // 7. Progressive Allocation Threshold: Dynamic incremental pagination (Chunking)
  useEffect(() => {
    if (effectiveLoadedCount >= safeItemCount) return

    const currentTotalSize = effectiveLoadedCount * safeItemSize
    const scrollRemaining = currentTotalSize - (scrollOffset + containerSize)
    const threshold = safeItemSize * 3

    if (scrollRemaining <= threshold) {
      // Calculates accurate indexes allocation payload to securely bridge vast layout strides
      const visibleEnd = Math.ceil((scrollOffset + containerSize) / safeItemSize)
      const targetCount = visibleEnd + safeOverscan + 3
      
      setLoadedCount((prev) => {
        if (prev >= safeItemCount) return prev
        const nextCount = Math.max(prev + safeStep, targetCount)
        return Math.min(safeItemCount, nextCount)
      })
    }
  }, [scrollOffset, containerSize, effectiveLoadedCount, safeItemCount, safeStep, safeItemSize, safeOverscan])

  // 8. Declarative Coordinate Matrix Compilation: Zero internal push mutations
  const { virtualItems, totalSize } = useMemo(() => {
    const totalSize = effectiveLoadedCount * safeItemSize
    const startIndex = Math.max(0, Math.floor(scrollOffset / safeItemSize) - safeOverscan)
    const endIndex = Math.min(
      effectiveLoadedCount - 1,
      Math.floor((scrollOffset + containerSize) / safeItemSize) + safeOverscan
    )

    // Calculates exactly how many item slots map inside current active track coordinates
    const rangeSize = endIndex >= startIndex ? endIndex - startIndex + 1 : 0

    // Transforms layout allocations into positional frames fluidly
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
