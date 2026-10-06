# @aleksey_grishechkin/react-chunk-virtualizer

A React hook for list virtualization (windowing) that renders items incrementally in chunks as the user scrolls. It keeps the DOM node count stable on large datasets by rendering only the visible viewport items plus a small buffer.

## Features

- **Hybrid Rendering:** Combines progressive chunk loading with virtual windowing.
- **ResizeObserver Integration:** Automatically tracks the scroll container dimensions.
- **Scroll Optimization:** Uses `requestAnimationFrame` and passive event listeners to throttle scroll updates.
- **No Dependencies:** Written in TypeScript with zero external dependencies.
- **Bidirectional:** Supports both vertical lists and horizontal carousels.

---

## Installation

```bash
npm install @aleksey_grishechkin/react-chunk-virtualizer
# or
yarn add @aleksey_grishechkin/react-chunk-virtualizer
# or
pnpm add @aleksey_grishechkin/react-chunk-virtualizer
```

---

## Usage

### 1. Vertical List

```tsx
import React, { useRef } from 'react';
import { useChunkVirtualizer } from '@aleksey_grishechkin/react-chunk-virtualizer';

const VerticalList = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { virtualItems, totalSize } = useChunkVirtualizer({
    itemCount: data.length,
    itemSize: 40, // Item height in pixels
    scrollContainerRef: containerRef,
    direction: 'vertical',
    overscan: 5,
  });

  return (
    <div
      ref={containerRef}
      style={{ height: '500px', overflowY: 'auto', position: 'relative' }}
    >
      <div style={{ height: `${totalSize}px`, width: '100%', position: 'relative' }}>
        {virtualItems.map((virtualItem) => {
          const item = data[virtualItem.index];
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
              {item.title}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

### 2. Horizontal Carousel

```tsx
import React, { useRef } from 'react';
import { useChunkVirtualizer } from '@aleksey_grishechkin/react-chunk-virtualizer';

const HorizontalCarousel = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { virtualItems, totalSize } = useChunkVirtualizer({
    itemCount: items.length,
    itemSize: 300, // Item width in pixels
    scrollContainerRef: containerRef,
    direction: 'horizontal',
    overscan: 3,
  });

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', overflowX: 'auto', position: 'relative' }}
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
            <img src={items[virtualItem.index].url} alt="" style={{ width: '100%', height: '100%' }} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## API Reference

### `useChunkVirtualizer(options)`

#### Configuration Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `itemCount` | `number` | *Required* | Total number of items in the collection. |
| `itemSize` | `number` | *Required* | Fixed height (vertical) or width (horizontal) of a single item in pixels. |
| `scrollContainerRef` | `React.RefObject` | *Required* | React ref attached to the scrollable container element. |
| `initialCount` | `number` | `30` | Number of items initially available for rendering before chunk expansion is triggered. |
| `step` | `number` | `20` | Number of items added to the rendered limit when reaching the threshold boundary. |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction of the list. |
| `overscan` | `number` | `5` | Number of extra items to render outside the visible viewport boundary to prevent blank spaces. |
| `resetTrigger` | `any` | `undefined` | A primitive value (string, number, boolean). Changing this value automatically calls the `reset` function (useful for filtering or sorting). |

#### Return Value

| Property | Type | Description |
| :--- | :--- | :--- |
| `virtualItems` | `VirtualItem[]` | Array of items that should be rendered in the current viewport window. Each item contains `index`, `size`, and `start` coordinate. |
| `totalSize` | `number` | The total height or width (in pixels) calculated for the inner wrapper spacer element. |
| `loadedCount` | `number` | The current total number of items loaded into the chunk pool. |
| `reset` | `() => void` | Function to manually scroll the container back to `0` and reset the chunk count to `initialCount`. |

---

## License

MIT © 2026 Alexey Grishechkin
