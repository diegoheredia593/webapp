"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * Foco que sigue al cursor sobre el bloque de planes.
 *
 * Viene de un componente de tarjeta con resplandor que ilumina el borde de
 * cada caja siguiendo al puntero. Aquí el borde ya existe y no hace falta
 * inventarlo: los planes son un bloque continuo cuyas costuras son el fondo
 * de la rejilla asomando por un hueco de 1 px. Iluminar ese fondo da el mismo
 * gesto —el filete responde a dónde está la mano— sin romper el radio 0 ni
 * añadir sombras, y sin separar las tres tarjetas.
 *
 * El original ponía un listener de `pointermove` en `document` por cada
 * tarjeta. Aquí hay uno solo, en el propio bloque, y las coordenadas van
 * relativas a él en vez de a la ventana: así el foco no se descuadra cuando
 * la página se desplaza.
 */
export function PlansSpotlight({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function track(event: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;

    const box = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
    el.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
    el.style.setProperty("--spot-on", "1");
  }

  function release() {
    ref.current?.style.setProperty("--spot-on", "0");
  }

  return (
    <div
      ref={ref}
      className="plans-spot"
      onPointerMove={track}
      onPointerLeave={release}
    >
      {children}
      {/* Sobre las tarjetas, no debajo: su fondo es opaco. Al 7 % de óxido la
          tinta no pierde contraste y la superficie sí se entibia. */}
      <div className="plans-spot__wash" aria-hidden="true" />
    </div>
  );
}
