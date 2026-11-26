---
title: "Red de Bibliotecas Universitarias"
summary: "Modelo EER Chen, esquema relacional en 3FN y SQL de 18 tablas para gestionar préstamos, ejemplares, reservas y multas en bibliotecas."
role: "Arquitecto y Modelador de Bases de Datos"
date: 2026-11-26
---

## Contexto

Una universidad administra bibliotecas en distintos campus mediante hojas de cálculo aisladas por sede. Esto genera autores y editoriales escritos de múltiples formas, desconocimiento de la disponibilidad real de ejemplares por sede, imposibilidad de apartar libros antes de desplazarse, préstamos sin trazabilidad ejemplar por ejemplar ni fechas individuales de devolución, y multas sin vínculo directo con el retraso que las originó[cite: 1].

## Funcionalidad

* **Catálogo bibliográfico normalizado:** gestiona `EDITORIAL`, `CATEGORIA`, `LIBRO` y `AUTOR` con relación M:N resuelta en `AUTORIA` (`orden_autor`)[cite: 1].
* **Control físico por sede:** modela `EJEMPLAR` como entidad débil dependiente de `LIBRO` con estados (`DISPONIBLE`, `PRESTADO`, `RESERVADO`, `EN_REPARACION`, `PERDIDO`)[cite: 1].
* **Especialización y supervisión:** aplica jerarquía ISA disjunta y parcial (`EMPLEADO` → `BIBLIOTECARIO` / `CATALOGADOR`) y relación recursiva `Supervisar` (`id_jefe`)[cite: 1].
* **Préstamos, reservas y multas:** encapsula los préstamos multiejemplar en `DETALLE_PRESTAMO` con trazabilidad 1:1 hacia `MULTA` y control de apartados en `RESERVA`[cite: 1].

## Normalización

A partir de `PRESTAMO_PLANO(id_prestamo, fecha_prestamo, id_usuario, nombre_usuario, telefonos_usuario, id_ejemplar, isbn, titulo, id_editorial, nombre_editorial, pais_editorial, fecha_devolucion)`[cite: 1]:

* **1FN:** se extrae el atributo multivaluado `telefonos_usuario` a `TELEFONO_USUARIO` y se define la clave primaria compuesta `(id_prestamo, id_ejemplar)`[cite: 1].
* **2FN:** se eliminan dependencias parciales separando `PRESTAMO` (PK `id_prestamo`) y `EJEMPLAR` (PK `id_ejemplar`), dejando `fecha_devolucion` en `DETALLE_PRESTAMO`[cite: 1].
* **3FN:** se eliminan dependencias transitivas creando `LIBRO`, `EDITORIAL` y `USUARIO`, excluyendo el atributo derivado `edad`[cite: 1].

## LinkDraw

* **Diagrama EER, ER Refinado y Modelo Relacional:** [Abrir en draw.io (RedBibliotecaBaseDatos.drawio)](https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&target=blank&highlight=0000ff&layers=1&nav=1&title=RedBibliotecaBaseDatos.drawio&dark=1#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1-LDRXZVx8dTfKV089FdbAmhSxVBs2dt-%26export%3Ddownload)

## Modelo Relacional (18 tablas)

```text
SEDE(**id_sede**, nombre, ciudad, calle, barrio, numero_direccion, telefono)
EDITORIAL(**id_editorial**, nombre, pais)
CATEGORIA(**id_categoria**, nombre)
LIBRO(**isbn**, titulo, edicion, anio_publicacion, num_paginas, *id_editorial*, *id_categoria*)
AUTOR(**id_autor**, nombres, apellidos, nacionalidad)
AUTORIA(**isbn**, **id_autor**, orden_autor)
EMPLEADO(**id_empleado**, documento, nombres, apellidos, fecha_contratacion, salario, *id_sede*, *id_jefe*)
TELEFONO_EMPLEADO(**id_empleado**, **numero**)
BIBLIOTECARIO(**id_empleado**, turno)
CATALOGADOR(**id_empleado**, certificado_catalogacion)
EJEMPLAR(**id_ejemplar**, codigo_barras, estado, fecha_adquisicion, ubicacion, *isbn*, *id_sede*, *id_catalogador*, fecha_catalogacion)
USUARIO(**id_usuario**, documento, nombres, apellidos, fecha_nacimiento, tipo_usuario, ciudad, calle, barrio, numero_direccion)
TELEFONO_USUARIO(**id_usuario**, **numero**)
CORREO_USUARIO(**id_usuario**, **direccion_correo**)
PRESTAMO(**id_prestamo**, fecha_prestamo, fecha_vencimiento, *id_usuario*, *id_bibliotecario*)
DETALLE_PRESTAMO(**id_prestamo**, **id_ejemplar**, fecha_devolucion)
MULTA(**id_multa**, monto, motivo, fecha_generacion, estado_pago, *id_prestamo*, *id_ejemplar*)
RESERVA(**id_reserva**, fecha_reserva, fecha_limite_retiro, estado, *id_usuario*, *id_ejemplar*)
