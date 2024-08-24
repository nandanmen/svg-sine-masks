"use client";

import React, { useRef } from "react";
import { motion, transform, type PanInfo } from "framer-motion";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

export const range = (end: number, increments: number = 1) => {
  return Array.from({ length: end / increments }, (_, i) => i * increments);
};

export const roundTo = (n: number, multiple: number) => {
  const remainder = n % multiple;
  if (remainder < multiple / 2) {
    return n - remainder;
  } else {
    return n + multiple - remainder;
  }
};

export const cn = (...args: Parameters<typeof clsx>) => twMerge(clsx(...args));

export function useDraggableShape(
  ref: React.RefObject<SVGElement>,
  origin: "center" | "top-left" = "top-left"
) {
  const [panState, setPanState] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  return {
    onPanStart: (_: MouseEvent, info: PanInfo) => {
      const shape = ref.current?.getBoundingClientRect();
      if (!shape) {
        console.error("Shape not found");
        return;
      }
      let shapeX = shape.x;
      let shapeY = shape.y;
      if (origin === "center") {
        shapeX += shape.width / 2;
        shapeY += shape.height / 2;
      }
      setPanState({
        x: info.point.x - shapeX - window.scrollX,
        y: info.point.y - shapeY - window.scrollY,
      });
    },
    onPanEnd: () => {
      setPanState(null);
    },
    modifyPoint: (point: { x: number; y: number }) => {
      if (!panState) return null;
      return {
        x: point.x - panState.x,
        y: point.y - panState.y,
      };
    },
  };
}

export const Draggable = React.forwardRef(_Draggable);

type GProps = Omit<
  React.ComponentPropsWithoutRef<(typeof motion)["g"]>,
  "onFocus" | "onBlur" | "onChange"
> & {
  onFocus?: () => void;
  onBlur?: () => void;
};

export function _Draggable(
  {
    x,
    y,
    children,
    round = 1,
    label,
    modifyPoint = (point) => point,
    onFocus,
    onChange,
    onBlur,
    className,
    ...props
  }: {
    x: number;
    y: number;
    children: React.ReactNode;
    label: string;
    round?: number;
    modifyPoint?: (point: {
      x: number;
      y: number;
    }) => { x: number; y: number } | null;
    onChange: (x: number, y: number) => void;
  } & GProps,
  ref: React.Ref<SVGGElement>
) {
  const innerRef = useRef<SVGGElement>(null);
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focused) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        onChange(x, y - round);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onChange(x, y + round);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onChange(x - round, y);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onChange(x + round, y);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focused, x, y, round, onChange]);

  const handlePan = (_: MouseEvent, info: PanInfo) => {
    const wrapper = innerRef?.current?.closest("svg");
    const wrapperBox = wrapper?.getBoundingClientRect();
    if (!wrapperBox) {
      console.error("Wrapper SVG not found");
      return;
    }

    const point = modifyPoint(info.point);
    if (!point) return;
    const pixelX = point.x - wrapperBox.x - window.scrollX;
    const pixelY = point.y - wrapperBox.y - window.scrollY;
    const newX = transform(pixelX, [0, wrapperBox.width], [0, 300]);
    const newY = transform(pixelY, [0, wrapperBox.height], [0, 200]);
    onChange(roundTo(newX, round), roundTo(newY, round));
  };

  return (
    <motion.g
      ref={mergeRefs(ref, innerRef)}
      tabIndex={0}
      role="button"
      aria-label={label}
      style={{ x, y }}
      className={cn("focus:outline-none group peer cursor-default", className)}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      {...props}
      onPan={handlePan}
    >
      {children}
    </motion.g>
  );
}

export function DraggableShape({
  className,
  children,
  label,
  onFocusChange,
  onChange,
  x,
  y,
  origin = "top-left",
}: {
  className?: string;
  children: React.ReactNode;
  label: string;
  x: number;
  y: number;
  onFocusChange?: (focused: boolean) => void;
  onChange?: (x: number, y: number) => void;
  origin?: "center" | "top-left";
}) {
  const ref = React.useRef<SVGGElement>(null);
  const dragProps = useDraggableShape(ref, origin);
  return (
    <Draggable
      className={className}
      ref={ref}
      x={x}
      y={y}
      label={label}
      onFocus={() => onFocusChange?.(true)}
      onBlur={() => onFocusChange?.(false)}
      onChange={(x, y) => onChange?.(x, y)}
      {...dragProps}
    >
      {children}
    </Draggable>
  );
}

function mergeRefs<T>(
  ...inputRefs: (React.Ref<T> | undefined)[]
): React.Ref<T> | React.RefCallback<T> {
  const filteredInputRefs = inputRefs.filter(Boolean);

  if (filteredInputRefs.length <= 1) {
    const firstRef = filteredInputRefs[0];

    return firstRef || null;
  }

  return function mergedRefs(ref) {
    for (const inputRef of filteredInputRefs) {
      if (typeof inputRef === "function") {
        inputRef(ref);
      } else if (inputRef) {
        (inputRef as React.MutableRefObject<T | null>).current = ref;
      }
    }
  };
}
