---
title: "Cadena de Hoteles Multisede"
summary: "Modelo EER, esquema relacional en 3FN y SQL de 16 tablas para gestionar reservas, habitaciones, servicios adicionales, aseo y facturación."
role: "Arquitecto y Modelador de Bases de Datos"
date: 2026-11-25
---

## Contexto

Una cadena hotelera con sedes en distintas ciudades lleva su operación en cuadernos locales por hotel, provocando huéspedes registrados varias veces con datos inconsistentes, sobreventa de habitaciones en fechas superpuestas, desconocimiento de disponibilidad y estado de limpieza, cobros de servicios adicionales extraviados antes de facturar y nula trazabilidad del aseo[cite: 1].

## Funcionalidad

* **Gestión de sedes y habitaciones:** modela `HOTEL`, `TIPO_HABITACION` y la entidad débil `HABITACION` (`id_hotel`, `numero_habitacion`) con control de estados (`LIBRE`, `OCUPADA`, `LIMPIEZA`, `MANTENIMIENTO`)[cite: 1].
* **Especialización y jerarquía:** implementa especialización disjunta/parcial (`EMPLEADO` → `RECEPCIONISTA` / `PERSONAL_LIMPIEZA`) y supervisión recursiva (`id_jefe`)[cite: 1].
* **Reservas sin cruce de hotel:** encapsula `RESERVA` con clave foránea compuesta `(id_reserva, id_hotel)` en `DETALLE_RESERVA` para garantizar que todas las habitaciones asignadas pertenezcan al mismo hotel[cite: 1].
* **Servicios, aseo y facturación:** registra consumos en `CONSUMO_SERVICIO`, trazabilidad de limpieza en `ASEO` y emisión 1:1 en `FACTURA`[cite: 1].

## Normalización

A partir de `RESERVA_PLANA(id_reserva, fecha_checkin, fecha_checkout, id_huesped, nombre_huesped, id_hotel, nombre_hotel, numero_habitacion, id_tipo, nombre_tipo, capacidad, precio_base, servicios_consumidos)`[cite: 1]:

* **1FN:** se extrae el grupo repetido `servicios_consumidos` hacia `CONSUMO_SERVICIO` y se define la PK compuesta `(id_reserva, id_hotel, numero_habitacion)`[cite: 1].
* **2FN:** se eliminan dependencias parciales creando `RESERVA`, `HABITACION`, `HOTEL` y `DETALLE_RESERVA`[cite: 1].
* **3FN:** se eliminan dependencias transitivas separando `TIPO_HABITACION`, `HUESPED` y `SERVICIO`, omitiendo los atributos derivados `edad` y `noches`[cite: 1].

## LinkDraw

* **Diagrama EER, ER Refinado y Modelo Relacional:** [Abrir en draw.io (CadenaHotelesBaseDatos.drawio)](https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&target=blank&highlight=0000ff&layers=1&nav=1&title=CadenaHotelesBaseDatos.drawio&dark=auto#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1fwElrdQX6g6BmD1WZLh83NHerSwkmdyf%26export%3Ddownload)

## Modelo Relacional (16 tablas)

```text
HOTEL(**id_hotel**, nombre, ciudad, calle, barrio, numero_direccion, estrellas, telefono)
TIPO_HABITACION(**id_tipo**, nombre, capacidad, precio_base, descripcion)
HABITACION(**id_hotel**, **numero_habitacion**, piso, estado, *id_tipo*)
EMPLEADO(**id_empleado**, documento, nombres, apellidos, fecha_contratacion, salario, *id_hotel*, *id_jefe*)
TELEFONO_EMPLEADO(**id_empleado**, **numero**)
RECEPCIONISTA(**id_empleado**, idiomas, turno)
PERSONAL_LIMPIEZA(**id_empleado**, zona_asignada)
HUESPED(**id_huesped**, tipo_documento, documento, nombres, apellidos, fecha_nacimiento, nacionalidad)
TELEFONO_HUESPED(**id_huesped**, **numero**)
CORREO_HUESPED(**id_huesped**, **direccion_correo**)
RESERVA(**id_reserva**, fecha_reserva, fecha_checkin, fecha_checkout, num_huespedes, estado, *id_huesped*, *id_hotel*, *id_recepcionista*)
DETALLE_RESERVA(**id_reserva**, **id_hotel**, **numero_habitacion**, precio_noche_pactado)
SERVICIO(**id_servicio**, nombre, categoria, precio)
CONSUMO_SERVICIO(**id_reserva**, **id_servicio**, **fecha_consumo**, cantidad, precio_unitario)
ASEO(**id_empleado**, **id_hotel**, **numero_habitacion**, **fecha**, hora_inicio, observaciones)
FACTURA(**id_factura**, fecha_emision, metodo_pago, tipo_factura, valor_total, *id_reserva*)
