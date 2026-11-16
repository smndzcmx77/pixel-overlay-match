# Migración a Supabase

- [x] Crear tablas, reglas de acceso y guardado transaccional del estado del POS.
- [x] Importar una sola vez los datos existentes de localStorage y cargar desde Supabase.
- [x] Adaptar catálogo, órdenes, cobros, cocina, restauración y asistente a operaciones en Supabase.
- [x] Probar reglas de negocio y el flujo completo de venta con persistencia real.

# Asistente de IA

- [x] Eliminar la pantalla "Asistente del encargado" y todo uso de AI Gateway.

# Acceso del personal

- [x] Crear perfiles con nombre y puesto, cuentas pendientes y rol de encargado.
- [x] Proteger las siete tablas del POS para que solo el personal aprobado pueda operarlas.
- [x] Añadir registro, inicio/cierre de sesión y pantalla de cuenta pendiente.
- [x] Añadir aprobación de cuentas desde el área Personal del encargado.
- [x] Probar reglas de permisos, rutas y acceso público sin sesión.
- [ ] Registrar la primera cuenta y designarla como encargado en Supabase; requiere el correo y la acción del usuario.
