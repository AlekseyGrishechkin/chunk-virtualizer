# @aleksey_grishechkin/react-virtual-viewport ⚡

A ultra-lightweight, high-performance, and **zero-dependency** React hook for universal list virtualization (windowing) and dynamic infinite scrolling. 

Engineered to handle massive datasets (**20,000+ items / 90MB+ JSON payloads**) without a single frame drop, maintaining a consistent 60 FPS by rendering only what's visible in the viewport using `requestAnimationFrame`.

## Key Features 🚀

- 📦 **Ultra-lightweight:** ~1.5 KB minified (zero external dependencies).
- 🔄 **Universal Geometry:** Works seamlessly with both **vertical** lists and **horizontal** carousels out of the box.
- 📏 **Layout Shift Resilient:** Powered by `ResizeObserver` to dynamically track container size changes.
- 🏎️ **Passive Scrolling & rAF:** Uses passive event listeners and `requestAnimationFrame` to ensure butter-smooth scrolling.
- 🛡️ **Strict Mode & React 18/19 Ready:** Fully compatible with concurrent rendering features.

---

## Installation

```bash
npm install @aleksey_grishechkin/react-virtual-viewport
# or
yarn add @aleksey_grishechkin/react-virtual-viewport
# or
pnpm add @aleksey_grishechkin/react-virtual-viewport
```

---

## Usage Examples

### 1. Vertical Big Data List (e.g., Metrics, Logs, Heavy Tables)

```tsx
import React, { useRef } from 'react';
import { useVirtualViewport } from '@aleksey_grishechkin/react-virtual-viewport';

const HeavyList = ({ largeDataArray }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { virtualItems, totalSize } = useVirtualViewport({
    itemCount: largeDataArray.length,
    itemSize: 40, // fixed height of each row in px
    scrollContainerRef: containerRef,
    direction: 'vertical',
    overscan: 5,
  });

  return (
    <div
      ref={containerRef}
      style={{ height: '500px', overflowY: 'auto', position: 'relative' }}
    >
      {/* Absolute boundary spacer tracking the simulated height */}
      <div style={{ height: `${totalSize}px`, width: '100%', position: 'relative' }}>
        {virtualItems.map((virtualItem) => {
          const item = largeDataArray[virtualItem.index];
          return (
            <div
              key={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              Row index: {virtualItem.index} - {item.title}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

### 2. Horizontal Virtualized Carousel

```tsx
import React, { useRef } from 'react';
import { useVirtualViewport } from '@aleksey_grishechkin/react-virtual-viewport';

const VirtualCarousel = ({ images }) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const { virtualItems, totalSize } = useVirtualViewport({
    itemCount: images.length,
    itemSize: 300, // fixed width of each slide in px
    scrollContainerRef: carouselRef,
    direction: 'horizontal',
    overscan: 3,
  });

  return (
    <div
      ref={carouselRef}
      style={{ width: '100%', overflowX: 'auto', position: 'relative', display: 'flex' }}
    >
      <div style={{ width: `${totalSize}px`, height: '200px', position: 'relative' }}>
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${virtualItem.size}px`,
              height: '100%',
              transform: `translateX(${virtualItem.start}px)`,
            }}
          >
            <img src={images[virtualItem.index].url} alt="Slide" style={{ width: '100%', height: '100%' }} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## API Reference

### `useVirtualViewport(options)`

#### Options Configuration

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `itemCount` | `number` | *Required* | Total number of elements available in your source data. |
| `itemSize` | `number` | *Required* | Fixed height (vertical) or width (horizontal) of a single item in pixels. |
| `scrollContainerRef` | `React.RefObject` | *Required* | Ref pinned to the scrollable wrapper element. |
| `initialCount` | `number` | `30` | Initial chunk size to draw before triggering expansion thresholds. |
| `step` | `number` | `20` | Dynamic chunk modifier increment size on upcoming border boundary allocation. |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout alignment rotation context. |
| `overscan` | `number` | `5` | Safety padding count rendered immediately outside view allocations to avoid trailing blank spots. |
| `resetTrigger` | `string \| number \| boolean` | `undefined` | Primitive identifier token context to reset active index pointers (e.g., filter type changes). |

#### Return Object

| Property | Type | Description |
| :--- | :--- | :--- |
| `virtualItems` | `VirtualItem[]` | An array of currently sliced invisible and visible elements containing indexes and absolute coordinate mappings. |
| `totalSize` | `number` | The total aggregate computed tracking track size footprint. Apply this to the parent bounds relative layout track spacer. |
| `loadedCount` | `number` | Active tracking state of computed preloaded record offsets inside index boundaries. |
| `reset` | `() => void` | Programmatic handle callback function context allocating standard state rollback variables. |

---

## License

MIT © 2026 AlexeyGrishechkin
