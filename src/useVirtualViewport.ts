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
  visibleCount: number
  reset: () => void
}

const INITIAL_COUNT = 30
const STEP = 20
const OVERSCAN = 5

export function useVirtualViewport({
  itemCount,
  itemSize,
  initialCount = INITIAL_COUNT,
  step = STEP,
  direction = 'vertical',
  overscan = OVERSCAN,
  scrollContainerRef,
  resetTrigger,
}: UseVirtualViewportOptions): UseVirtualViewportReturn {
  const [visibleCount, setVisibleCount] = useState(initialCount)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerSize, setContainerSize] = useState(0)

  const isVertical = direction === 'vertical'
  const safeItemSize = Math.max(1, itemSize)

  // 1. Сброс при изменении внешнего триггера
  useEffect(() => {
    setVisibleCount(initialCount)
    const container = scrollContainerRef.current
    if (container) {
      if (isVertical) container.scrollTop = 0
      else container.scrollLeft = 0
      setScrollTop(0)
    }
  }, [initialCount, resetTrigger, isVertical, scrollContainerRef])

  // 2. Трекинг размеров контейнера (ResizeObserver)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries?.length) return
      const entry = entries[0]
      const size = isVertical 
        ? entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height 
        : entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
      setContainerSize(size)
    })

    resizeObserver.observe(container)
    
    setContainerSize(isVertical ? container.clientHeight : container.clientWidth)
    setScrollTop(isVertical ? container.scrollTop : container.scrollLeft)

    return () => resizeObserver.disconnect()
  }, [scrollContainerRef, isVertical])

  // 3. Высокопроизводительный листенер скролла с requestAnimationFrame
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let animationFrameId: number

    const handleScroll = () => {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(() => {
        setScrollTop(isVertical ? container.scrollTop : container.scrollLeft)
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [scrollContainerRef, isVertical])

  // 4. Твоя чистая логика Infinite Scroll (Исправленная и быстрая)
  useEffect(() => {
    if (visibleCount >= itemCount) return

    const currentTotalSize = visibleCount * safeItemSize
    const scrollRemaining = currentTotalSize - (scrollTop + containerSize)
    const threshold = safeItemSize * 3 

    if (scrollRemaining <= threshold) {
      setVisibleCount((prev) => Math.min(itemCount, prev + step))
    }
  }, [scrollTop, containerSize, visibleCount, itemCount, step, safeItemSize])

  // 5. Твой правильный динамический расчет виртуальной геометрии
  const { virtualItems, totalSize } = useMemo(() => {
    const totalSize = visibleCount * safeItemSize

    const startIndex = Math.max(0, Math.floor(scrollTop / safeItemSize) - overscan)
    const endIndex = Math.min(
      visibleCount - 1,
      Math.floor((scrollTop + containerSize) / safeItemSize) + overscan
    )

    const virtualItems: VirtualItem[] = []
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        index: i,
        size: safeItemSize,
        start: i * safeItemSize,
      })
    }

    return { virtualItems, totalSize }
  }, [visibleCount, safeItemSize, scrollTop, containerSize, overscan])

  const reset = useCallback(() => {
    setVisibleCount(initialCount)
  }, [initialCount])

  return {
    virtualItems,
    totalSize,
    visibleCount,
    reset,
  }
}