import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

const FLICKER_COUNT = 3;
const FLICKER_INTERVAL = 80;

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState<number>(value);
  const prevValueRef = useRef<number>(value);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (prevValueRef.current === value) return;

    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    const scale = Math.max(Math.abs(value), Math.abs(prevValueRef.current), 1);

    for (let i = 0; i < FLICKER_COUNT; i++) {
      const t = setTimeout(() => {
        setDisplay((Math.random() * 2 - 1) * scale);
      }, i * FLICKER_INTERVAL);
      timerRefs.current.push(t);
    }

    const finalT = setTimeout(() => {
      setDisplay(value);
      prevValueRef.current = value;
    }, FLICKER_COUNT * FLICKER_INTERVAL);
    timerRefs.current.push(finalT);

    return () => timerRefs.current.forEach(clearTimeout);
  }, [value]);

  const absValue = Math.abs(display);
  const isNeg = display < 0;

  const formatted = absValue.toFixed(decimals);
  const [intPart, decPart] = formatted.split(".");

  return (
    <span className={className}>
      <span className="text-[0.55em] font-bold align-top mt-[0.1em] inline-block leading-none">{prefix}</span>
      {isNeg && <span className="text-[0.7em]"> −</span>}
      {intPart}<span className="text-[0.65em]">.{decPart}</span>{suffix}
    </span>
  );
}
