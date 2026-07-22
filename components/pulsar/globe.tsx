"use client";

import { useEffect, useRef, useState } from "react";

type V3 = { x: number; y: number; z: number };

function latLonToXYZ(lat: number, lon: number, r: number): V3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return {
    x: -r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  };
}

function rotateY(p: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}
function rotateX(p: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

const PORTS = [
  { name: "Manzanillo", lat: 19.05, lon: -104.31 },
  { name: "Long Beach", lat: 33.75, lon: -118.19 },
  { name: "New York", lat: 40.7, lon: -74.0 },
  { name: "Yokohama", lat: 35.44, lon: 139.64 },
  { name: "Tokyo", lat: 35.68, lon: 139.65 },
  { name: "Singapur", lat: 1.29, lon: 103.85 },
  { name: "Shanghai", lat: 31.23, lon: 121.47 },
  { name: "Hamburg", lat: 53.55, lon: 9.99 },
  { name: "Rotterdam", lat: 51.95, lon: 4.14 },
  { name: "Veracruz", lat: 19.17, lon: -96.13 },
];

const ARCS: [string, string][] = [
  ["Manzanillo", "Yokohama"],
  ["Long Beach", "Singapur"],
  ["New York", "Shanghai"],
  ["Tokyo", "Hamburg"],
];

/** Rotating night-earth globe with luminous suborbital arcs + a rocket
 *  travelling one arc. Scroll zooms the camera out to reveal Moon & Mars. */
export function Globe({ zoom = 0 }: { zoom?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rocketScreen = useRef<{ x: number; y: number } | null>(null);
  const [rocketInfo, setRocketInfo] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let rot = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    // dotted sphere points
    const dots: V3[] = [];
    for (let lat = -80; lat <= 80; lat += 8) {
      const step = Math.max(
        6,
        Math.round(360 / (Math.cos((lat * Math.PI) / 180) * 42 + 6)),
      );
      for (let lon = -180; lon < 180; lon += step) {
        dots.push(latLonToXYZ(lat, lon, 1));
      }
    }

    const start = performance.now();

    function draw(now: number) {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const baseR = Math.min(w, h) * (0.34 - zoom * 0.16);
      rot += 0.0016;
      const tilt = -0.35;

      ctx.clearRect(0, 0, w, h);

      // atmosphere glow
      const glow = ctx.createRadialGradient(
        cx,
        cy,
        baseR * 0.6,
        cx,
        cy,
        baseR * 1.6,
      );
      glow.addColorStop(0, "rgba(59,130,246,0.18)");
      glow.addColorStop(1, "rgba(59,130,246,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // globe body
      const body = ctx.createRadialGradient(
        cx - baseR * 0.3,
        cy - baseR * 0.3,
        baseR * 0.1,
        cx,
        cy,
        baseR,
      );
      body.addColorStop(0, "#0f1d3a");
      body.addColorStop(1, "#060a16");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.fill();

      const project = (p: V3) => {
        let q = rotateY(p, rot);
        q = rotateX(q, tilt);
        return { sx: cx + q.x * baseR, sy: cy - q.y * baseR, z: q.z };
      };

      // land dots
      for (const d of dots) {
        const { sx, sy, z } = project(d);
        if (z < 0) continue;
        const a = 0.15 + z * 0.5;
        ctx.fillStyle = `rgba(96,165,250,${a})`;
        ctx.beginPath();
        ctx.arc(sx, sy, dpr * (0.8 + z * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      const portScreen: Record<string, { sx: number; sy: number; z: number }> =
        {};
      for (const p of PORTS) {
        const s = project(latLonToXYZ(p.lat, p.lon, 1.01));
        portScreen[p.name] = s;
        if (s.z < 0) continue;
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(s.sx, s.sy, dpr * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(56,189,248,0.4)";
        ctx.beginPath();
        ctx.arc(
          s.sx,
          s.sy,
          dpr * (4 + Math.sin(now / 400) * 1.5),
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }

      // arcs (great-circle-ish elevated) + rocket
      const t = ((now - start) / 6000) % 1;
      rocketScreen.current = null;
      ARCS.forEach(([a, b], i) => {
        const pa = latLonToXYZ(
          PORTS.find((p) => p.name === a)!.lat,
          PORTS.find((p) => p.name === a)!.lon,
          1,
        );
        const pb = latLonToXYZ(
          PORTS.find((p) => p.name === b)!.lat,
          PORTS.find((p) => p.name === b)!.lon,
          1,
        );
        const segs = 60;
        ctx.beginPath();
        let started = false;
        let rocketAt: { sx: number; sy: number } | null = null;
        for (let s = 0; s <= segs; s++) {
          const f = s / segs;
          const lift = 1 + Math.sin(f * Math.PI) * 0.28;
          const mid: V3 = {
            x: pa.x + (pb.x - pa.x) * f,
            y: pa.y + (pb.y - pa.y) * f,
            z: pa.z + (pb.z - pa.z) * f,
          };
          const len = Math.hypot(mid.x, mid.y, mid.z) || 1;
          const pt = {
            x: (mid.x / len) * lift,
            y: (mid.y / len) * lift,
            z: (mid.z / len) * lift,
          };
          const sp = project(pt);
          if (sp.z < -0.1) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(sp.sx, sp.sy);
            started = true;
          } else ctx.lineTo(sp.sx, sp.sy);
          if (i === 0 && Math.abs(f - t) < 0.5 / segs)
            rocketAt = { sx: sp.sx, sy: sp.sy };
        }
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, "rgba(56,189,248,0.15)");
        grad.addColorStop(0.5, "rgba(96,165,250,0.9)");
        grad.addColorStop(1, "rgba(56,189,248,0.15)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = dpr * 1.4;
        ctx.stroke();

        if (rocketAt) {
          rocketScreen.current = { x: rocketAt.sx / dpr, y: rocketAt.sy / dpr };
          ctx.save();
          ctx.shadowColor = "#60a5fa";
          ctx.shadowBlur = 14;
          ctx.fillStyle = "#eaf2ff";
          ctx.beginPath();
          ctx.arc(rocketAt.sx, rocketAt.sy, dpr * 3.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Moon & Mars appear as camera zooms out
      if (zoom > 0.05) {
        const moon = {
          x: cx + baseR * 3.1,
          y: cy - baseR * 1.4,
          r: baseR * 0.28 * (0.5 + zoom),
        };
        drawBody(
          ctx,
          moon.x,
          moon.y,
          moon.r,
          "#c9d1e0",
          "#7c8598",
          zoom,
          "La Luna",
        );
        // arc earth->moon
        arcLine(
          ctx,
          cx,
          cy,
          moon.x,
          moon.y,
          "rgba(96,165,250,0.5)",
          false,
          dpr,
        );

        const mars = {
          x: cx + baseR * 4.6,
          y: cy + baseR * 1.7,
          r: baseR * 0.34 * (0.4 + zoom),
        };
        drawBody(
          ctx,
          mars.x,
          mars.y,
          mars.r,
          "#e0714a",
          "#8a3a20",
          zoom,
          "Marte",
        );
        arcLine(
          ctx,
          moon.x,
          moon.y,
          mars.x,
          mars.y,
          "rgba(244,120,80,0.5)",
          true,
          dpr,
        );
      }

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [zoom]);

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-pointer"
        onClick={(e) => {
          const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const r = rocketScreen.current;
          if (r && Math.hypot(r.x - x, r.y - y) < 26) {
            setRocketInfo({ x: r.x, y: r.y });
          } else {
            setRocketInfo(null);
          }
        }}
      />
      {rocketInfo && (
        <div
          className="absolute z-10 w-56 rounded-xl border border-pulse-blue/40 bg-space-900/95 p-4 shadow-2xl backdrop-blur"
          style={{
            left: Math.min(rocketInfo.x + 16, 320),
            top: Math.max(rocketInfo.y - 40, 8),
          }}
        >
          <div
            className="text-pulse-cyan"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pulsar Heavy · PL-04
          </div>
          <div className="mt-2 space-y-1 text-[13px] text-muted-foreground">
            <div className="flex justify-between">
              <span>Ruta</span>
              <span className="text-foreground">MZO → YOK</span>
            </div>
            <div className="flex justify-between">
              <span>Carga</span>
              <span className="text-foreground">62 t</span>
            </div>
            <div className="flex justify-between">
              <span>ETA</span>
              <span className="text-foreground">88 min</span>
            </div>
            <div className="flex justify-between">
              <span>Estado</span>
              <span className="text-pulse-cyan">En vuelo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  c1: string,
  c2: string,
  alpha: number,
  label: string,
) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha * 1.4);
  const g = ctx.createRadialGradient(
    x - r * 0.3,
    y - r * 0.3,
    r * 0.1,
    x,
    y,
    r,
  );
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = Math.min(1, alpha * 1.4) * 0.7;
  ctx.fillStyle = "#8b96b3";
  ctx.font = `${Math.round(r * 0.5)}px 'Space Grotesk', sans-serif`;
  ctx.fillText(label, x - r, y + r + r * 0.6);
  ctx.restore();
}

function arcLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dotted: boolean,
  dpr: number,
) {
  ctx.save();
  if (dotted) ctx.setLineDash([6 * dpr, 8 * dpr]);
  ctx.strokeStyle = color;
  ctx.lineWidth = dpr;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.stroke();
  ctx.restore();
}
