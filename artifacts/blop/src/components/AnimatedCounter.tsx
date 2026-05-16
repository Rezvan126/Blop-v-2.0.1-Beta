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
  const intWithCommas = parseInt(intPart).toLocaleString();

  const small: React.CSSProperties = {
    fontSize: "0.55em",
    lineHeight: 1,
    paddingTop: "0.15em",
    display: "inline-block",
    opacity: 0.65,
  };

  return (
    <span className={`inline-flex items-start leading-none tabular-nums ${className ?? ""}`}>
      <span style={small}>{prefix}</span>
      {isNeg && <span style={small}>−</span>}
      <span>{intWithCommas}</span>
      <span style={small}>.{decPart}</span>
      {suffix && <span style={small}>{suffix}</span>}
    </span>
  );
}
