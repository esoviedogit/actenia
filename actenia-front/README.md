# Actenia Frontend

Aplicación Angular standalone para gestionar activos de organizaciones de salud con Supabase: equipos clínicos, biomédicos, informáticos, impresoras e infraestructura.

## Configuración

1. Ejecuta `database/migrations/001_equipment_ownership_and_alert_dates.sql` en el SQL Editor de Supabase.
2. Ejecuta `database/migrations/002_sede_contact_and_reps.sql` para agregar los datos de contacto y habilitación de sedes.
3. Ejecuta `database/migrations/003_ubicaciones_area_fields.sql` para habilitar piso y código de servicio en las áreas.
4. Ejecuta `database/migrations/004_equipment_name.sql` para agregar el nombre visible del activo y completar los registros existentes.
5. Ejecuta `database/migrations/005_equipment_type_management.sql` para agregar clasificación, frecuencia de mantenimiento y propiedad por usuario a los tipos de equipo.
6. Ejecuta `database/migrations/006_equipment_images_storage.sql` para crear el bucket público `equipment-images` con carga de imágenes por carpeta de usuario.
7. Ejecuta `database/migrations/007_equipment_detail_and_maintenance.sql` para fotos de activos, fechas de agenda y el historial de mantenimiento con RLS.
8. Si ya hay datos, asigna el `user_id` correcto a las filas existentes de `equipos`, `sedes`, `consultorios` y `proveedores` antes de usarlas desde la aplicación. La migración no puede inferir de forma segura quién es su propietario. Los tipos existentes sin `user_id` se conservan como compartidos.
9. Configura el URL del proyecto y su clave pública `anon`/publishable en `src/environments/environment.ts`. No uses nunca la clave `service_role` en el frontend.
10. Comprueba que el proyecto tiene habilitado el registro/inicio de sesión. El cliente requiere un usuario autenticado; RLS sigue siendo la barrera de seguridad en la base de datos.

```ts
export const environment = {
  supabaseUrl: 'https://<project-ref>.supabase.co',
  supabaseAnonKey: '<publishable-key>',
};
```

La columna `user_id` se obtiene de la sesión validada con `auth.getUser()` en cada operación; la UI no puede elegir o sobrescribir ese propietario. El servicio aplica el filtro de usuario y las políticas RLS lo vuelven a validar en PostgreSQL.

## Autenticación

- `AuthService` restaura la sesión de Supabase al iniciar y mantiene su estado actualizado con `onAuthStateChange`.
- El formulario de acceso usa `signInWithPassword`; el guard valida el usuario con `auth.getUser()` antes de permitir rutas privadas.
- El cliente Supabase singleton adjunta el token de sesión (`Authorization: Bearer ...`) a las consultas, y RLS aplica las políticas de la base de datos.
- La opción **Cerrar sesión** invalida la sesión con Supabase y regresa al formulario de acceso.

## Módulos incluidos

- `EquipmentService`: CRUD, catálogos de formulario y consultas relacionales con sede, consultorio, proveedor y tipo.
- Login y protección de las rutas de inventario y formularios.
- Gestión de sedes con código REPS y selección de sedes del usuario en la hoja de vida de equipos.
- Gestión de áreas/ubicaciones respaldada por la tabla existente `consultorios` (sin renombrar ni migrar las claves foráneas), filtrada por sede y vinculada a los activos.
- Gestión de tipos de equipo por usuario, con acceso de lectura a los tipos compartidos existentes.
- Imágenes de referencia de tipos de equipo almacenadas en Supabase Storage y visibles en el catálogo y el formulario de activos.
- Hoja de vida individual con fotografía del activo, datos completos del proveedor y ubicación, especificaciones técnicas e historial de mantenimiento/calibración.
- Listado con búsqueda por inventario, marca, modelo y serial, badges de estado y alertas.
- Formulario reactivo para crear/editar la hoja de vida de activos. Los datos INVIMA y REPS se completan cuando aplican al activo y a la sede.
- Alertas: vencido (rojo), dentro de los próximos 30 días (ámbar), al día (verde) y sin fecha programada (gris).

## Desarrollo

```bash
npm install
npm start
npm test
npm run build
```
