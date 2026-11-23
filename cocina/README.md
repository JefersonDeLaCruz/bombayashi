# Bombayashi · tienda en línea (Node.js)

Clon de la web de WordPress de Panadería Bombayashi, migrado a Node.js con carrito real, checkout y pagos con Stripe en modo prueba.
**Cero dependencias**: solo Node 18+.

## Correr
```
cd project/cocina
node server.js          # http://localhost:3000
```
Con otro puerto: `PORT=3100 node server.js`.

## Stripe (modo prueba)
1. Copiá `.env.example` a `.env` y poné tu llave de prueba (`sk_test_...`, dashboard de Stripe → Developers → API keys).
2. Reiniciá. "Confirmar y pagar con tarjeta" abre el **Stripe Checkout real**; tarjeta de prueba `4242 4242 4242 4242`, cualquier fecha futura y CVC.
3. Sin llave, el servidor usa un **simulador local** del checkout (mismo flujo, misma tarjeta 4242). Se muestra un aviso de "modo prueba".

El servidor recalcula los precios (el navegador solo manda producto y cantidad) y confirma el pago contra Stripe al volver a `/gracias`.

## Rutas
`/` · `/nosotros` · `/contacto` · `/politicas` · `/pedido` (carrito + checkout) · `/gracias` · `/admin` (pedidos y mensajes guardados en `data/*.json`)

## Qué se agregó frente a WordPress
Carrito lateral con cantidades (sin límite de ítems), checkout en una página con validación, horarios que respetan domingos y combos (1 día de anticipación), pedido mínimo de envío validado, pago con tarjeta (Stripe), páginas de confirmación con mensaje listo para WhatsApp, panel de pedidos, animaciones al hacer scroll, hover y accesibilidad (foco visible, `prefers-reduced-motion`).
