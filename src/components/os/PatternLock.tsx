import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface PatternLockProps {
  value: string;
  onChange: (pattern: string) => void;
}

const DOT_POSITIONS = [
  { row: 0, col: 0 },
  { row: 0, col: 1 },
  { row: 0, col: 2 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
];

export function PatternLock({ value, onChange }: PatternLockProps) {
  const [selectedDots, setSelectedDots] = useState<number[]>(
    value ? value.split(',').map(Number).filter(n => !isNaN(n)) : []
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getDotCenter = (index: number) => {
    const dot = DOT_POSITIONS[index];
    const spacing = 48;
    const padding = 24;
    return {
      x: padding + dot.col * spacing,
      y: padding + dot.row * spacing,
    };
  };

  const handleDotInteraction = useCallback((index: number) => {
    if (selectedDots.includes(index)) return;
    const newDots = [...selectedDots, index];
    setSelectedDots(newDots);
    onChange(newDots.join(','));
  }, [selectedDots, onChange]);

  const handlePointerDown = useCallback((index: number) => {
    setIsDrawing(true);
    setSelectedDots([index]);
    onChange(String(index));
  }, [onChange]);

  const handlePointerEnter = useCallback((index: number) => {
    if (isDrawing) {
      handleDotInteraction(index);
    }
  }, [isDrawing, handleDotInteraction]);

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedDots([]);
    onChange('');
  }, [onChange]);

  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 1; i < selectedDots.length; i++) {
    const from = getDotCenter(selectedDots[i - 1]);
    const to = getDotCenter(selectedDots[i]);
    lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative w-[144px] h-[144px] bg-muted/50 rounded-lg border border-border select-none touch-none"
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {lines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
        </svg>
        {DOT_POSITIONS.map((dot, index) => {
          const isSelected = selectedDots.includes(index);
          const center = getDotCenter(index);
          return (
            <div
              key={index}
              className={cn(
                "absolute w-6 h-6 rounded-full border-2 -translate-x-1/2 -translate-y-1/2 transition-colors cursor-pointer",
                isSelected
                  ? "bg-primary border-primary scale-110"
                  : "bg-background border-muted-foreground/40 hover:border-primary/60"
              )}
              style={{ left: center.x, top: center.y }}
              onPointerDown={(e) => {
                e.preventDefault();
                handlePointerDown(index);
              }}
              onPointerEnter={() => handlePointerEnter(index)}
            >
              {isSelected && (
                <div className="absolute inset-1 rounded-full bg-primary-foreground/80" />
              )}
            </div>
          );
        })}
      </div>
      {selectedDots.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Limpar desenho
        </button>
      )}
    </div>
  );
}
