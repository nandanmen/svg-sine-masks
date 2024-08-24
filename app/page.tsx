"use client";

import { useState } from "react";
import { checkIntersection } from "line-intersect";
import { Draggable } from "./draggable";

const wavelength = 60;

export default function Home() {
  const [linePoints, setLinePoints] = useState([
    [0, 100],
    [150, 120],
    [300, 100],
  ]);
  const halfWavelength = wavelength / 2;
  const curveCount = Math.ceil(300 / halfWavelength);

  const curve = ({ sign = 1, amp = 0 } = {}) => {
    return `c ${(halfWavelength * 0.3642).toFixed(3)} 0 ${(
      halfWavelength * 0.6358
    ).toFixed(3)} ${amp * sign} ${halfWavelength} ${amp * sign}`;
  };

  const getDistanceToLineAtIndex = (i: number) => {
    const x = (i + 1) * halfWavelength + halfWavelength / 2;

    const point = linePoints.findIndex((p) => {
      return p[0] >= x;
    });
    if (point <= 0) return null;

    const [[x3, y3], [x4, y4]] = [linePoints[point - 1], linePoints[point]];
    const intersection = checkIntersection(x, 0, x, 200, x3, y3, x4, y4);
    if (intersection.type !== "intersecting") return null;
    return Math.abs(intersection.point.y - 100) * 2;
  };

  const [x0, y0] = linePoints[0];
  return (
    <main className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <svg viewBox="-10 -10 320 220" className="w-[70%]">
        <g transform={`translate(${(halfWavelength / 2) * -1} 0)`}>
          <path
            fill="none"
            d={`M ${x0} ${y0} ${curve({
              sign: -1,
              amp: getDistanceToLineAtIndex(-1) ?? 0,
            })} ${Array.from({ length: curveCount }, (_, i) => {
              const amp = getDistanceToLineAtIndex(i) ?? 0;
              const sign = i % 2 === 0 ? 1 : -1;
              return curve({ sign, amp });
            }).join(" ")}`}
            stroke="currentColor"
            strokeWidth={2}
          />
        </g>
        <g className="text-blue-500">
          <path
            d={linePoints
              .map(([x, y], i) => {
                if (i) return `L ${x} ${y}`;
                return `M ${x} ${y}`;
              })
              .join(" ")}
            strokeWidth="1.5"
            fill="none"
            stroke="currentColor"
          />
          {linePoints.map(([x, y], i) => {
            if (!i || i === linePoints.length - 1) {
              return <circle cx={x} cy={y} fill="currentColor" r="2" />;
            }
            return (
              <Draggable
                key={i}
                label={`line point ${i}`}
                x={x}
                y={y}
                onChange={(x, y) => {
                  setLinePoints((p) => {
                    const newP = [...p];
                    newP[i] = [x, y];
                    return newP;
                  });
                }}
              >
                <circle fill="currentColor" r="2" />
                <circle
                  stroke="currentColor"
                  fill="none"
                  r="3"
                  //strokeDasharray="5 1"
                />
              </Draggable>
            );
          })}
        </g>
        {Array.from({ length: curveCount }).map((_, i) => {
          const x = i * halfWavelength + halfWavelength / 2;

          const point = linePoints.findIndex((p) => {
            return p[0] >= x;
          });
          if (point <= 0) return null;

          const [[x3, y3], [x4, y4]] = [
            linePoints[point - 1],
            linePoints[point],
          ];
          const intersection = checkIntersection(x, 0, x, 200, x3, y3, x4, y4);
          return (
            <>
              <g transform={`translate(${x} 100)`}>
                <rect width="2" height="2" fill="blue" x="-1" y="-1" />
              </g>
              {intersection.type === "intersecting" && (
                <rect
                  x={intersection.point.x}
                  y={intersection.point.y}
                  width="2"
                  height="2"
                  fill="red"
                />
              )}
            </>
          );
        })}
      </svg>
    </main>
  );
}
