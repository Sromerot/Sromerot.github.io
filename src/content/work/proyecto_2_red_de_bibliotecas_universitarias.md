---
title: "Red de Bibliotecas Universitarias"
summary: "Modelo EER Chen, esquema relacional en 3FN y SQL de 18 tablas para gestionar préstamos, ejemplares, reservas y multas en bibliotecas."
role: "Arquitecto y Modelador de Bases de Datos"
date: 2026-11-26
---

## Contexto

Una universidad administra bibliotecas en distintos campus mediante hojas de cálculo aisladas por sede. Esto genera autores y editoriales escritos de múltiples formas, desconocimiento de la disponibilidad real de ejemplares por sede, imposibilidad de apartar libros antes de desplazarse, préstamos sin trazabilidad ejemplar por ejemplar ni fechas individuales de devolución, y multas sin vínculo directo con el retraso que las originó.

## Funcionalidad

* **Catálogo bibliográfico normalizado:** gestiona `EDITORIAL`, `CATEGORIA`, `LIBRO` y `AUTOR` con relación M:N resuelta en `AUTORIA` (`orden_autor`).
* **Control físico por sede:** modela `EJEMPLAR` como entidad débil dependiente de `LIBRO` con estados (`DISPONIBLE`, `PRESTADO`, `RESERVADO`, `EN_REPARACION`, `PERDIDO`).
* **Especialización y supervisión:** aplica jerarquía ISA disjunta y parcial (`EMPLEADO` → `BIBLIOTECARIO` / `CATALOGADOR`) y relación recursiva `Supervisar` (`id_jefe`).
* **Préstamos, reservas y multas:** encapsula los préstamos multiejemplar en la agregación `DETALLE_PRESTAMO` con trazabilidad 1:1 hacia `MULTA` y control de apartados en `RESERVA`.

## Normalización

A partir de la tabla plana `PRESTAMO_PLANO(id_prestamo, fecha_prestamo, id_usuario, nombre_usuario, telefonos_usuario, id_ejemplar, isbn, titulo, id_editorial, nombre_editorial, pais_editorial, fecha_devolucion)`:

* **1FN:** se extrae el atributo multivaluado `telefonos_usuario` a `TELEFONO_USUARIO` y se define una fila atómica por par préstamo-ejemplar con clave primaria compuesta `(id_prestamo, id_ejemplar)`.
* **2FN:** se eliminan dependencias parciales separando `PRESTAMO` (PK `id_prestamo`) y `EJEMPLAR` (PK `id_ejemplar`), dejando `fecha_devolucion` en `DETALLE_PRESTAMO`.
* **3FN:** se eliminan dependencias transitivas creando `LIBRO`, `EDITORIAL` y `USUARIO`, excluyendo el atributo derivado `edad`.

**Tablas resultantes en 3FN:** `USUARIO`, `TELEFONO_USUARIO`, `PRESTAMO`, `DETALLE_PRESTAMO`, `EJEMPLAR`, `LIBRO` y `EDITORIAL`.

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
```

## Código SQL

```sql
CREATE TABLE sede (
  id_sede INT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  ciudad VARCHAR(50),
  calle VARCHAR(80),
  barrio VARCHAR(60),
  numero_direccion VARCHAR(20),
  telefono VARCHAR(20)
);

CREATE TABLE editorial (
  id_editorial INT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  pais VARCHAR(50)
);

CREATE TABLE categoria (
  id_categoria INT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE libro (
  isbn VARCHAR(20) PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  edicion INT,
  anio_publicacion INT,
  num_paginas INT CHECK (num_paginas > 0),
  id_editorial INT NOT NULL REFERENCES editorial(id_editorial),
  id_categoria INT NOT NULL REFERENCES categoria(id_categoria)
);

CREATE TABLE autor (
  id_autor INT PRIMARY KEY,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  nacionalidad VARCHAR(50)
);

CREATE TABLE autoria (
  isbn VARCHAR(20) REFERENCES libro(isbn),
  id_autor INT REFERENCES autor(id_autor),
  orden_autor INT DEFAULT 1,
  PRIMARY KEY (isbn, id_autor)
);

CREATE TABLE empleado (
  id_empleado INT PRIMARY KEY,
  documento VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  fecha_contratacion DATE NOT NULL,
  salario DECIMAL(12,2) CHECK (salario >= 0),
  id_sede INT NOT NULL REFERENCES sede(id_sede),
  id_jefe INT REFERENCES empleado(id_empleado)
);

CREATE TABLE telefono_empleado (
  id_empleado INT REFERENCES empleado(id_empleado),
  numero VARCHAR(20),
  PRIMARY KEY (id_empleado, numero)
);

CREATE TABLE bibliotecario (
  id_empleado INT PRIMARY KEY REFERENCES empleado(id_empleado),
  turno VARCHAR(20)
);

CREATE TABLE catalogador (
  id_empleado INT PRIMARY KEY REFERENCES empleado(id_empleado),
  certificado_catalogacion VARCHAR(100)
);

CREATE TABLE ejemplar (
  id_ejemplar INT PRIMARY KEY,
  codigo_barras VARCHAR(30) NOT NULL UNIQUE,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('DISPONIBLE','PRESTADO','RESERVADO','EN_REPARACION','PERDIDO')),
  fecha_adquisicion DATE,
  ubicacion VARCHAR(40),
  isbn VARCHAR(20) NOT NULL REFERENCES libro(isbn),
  id_sede INT NOT NULL REFERENCES sede(id_sede),
  id_catalogador INT REFERENCES catalogador(id_empleado),
  fecha_catalogacion DATE
);

CREATE TABLE usuario (
  id_usuario INT PRIMARY KEY,
  documento VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  fecha_nacimiento DATE,
  tipo_usuario VARCHAR(15) NOT NULL CHECK (tipo_usuario IN ('ESTUDIANTE','DOCENTE','EXTERNO')),
  ciudad VARCHAR(50),
  calle VARCHAR(80),
  barrio VARCHAR(60),
  numero_direccion VARCHAR(20)
);

CREATE TABLE telefono_usuario (
  id_usuario INT REFERENCES usuario(id_usuario),
  numero VARCHAR(20),
  PRIMARY KEY (id_usuario, numero)
);

CREATE TABLE correo_usuario (
  id_usuario INT REFERENCES usuario(id_usuario),
  direccion_correo VARCHAR(120),
  PRIMARY KEY (id_usuario, direccion_correo)
);

CREATE TABLE prestamo (
  id_prestamo INT PRIMARY KEY,
  fecha_prestamo DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario),
  id_bibliotecario INT NOT NULL REFERENCES bibliotecario(id_empleado),
  CHECK (fecha_vencimiento >= fecha_prestamo)
);

CREATE TABLE detalle_prestamo (
  id_prestamo INT REFERENCES prestamo(id_prestamo),
  id_ejemplar INT REFERENCES ejemplar(id_ejemplar),
  fecha_devolucion DATE,
  PRIMARY KEY (id_prestamo, id_ejemplar)
);

CREATE TABLE multa (
  id_multa INT PRIMARY KEY,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  motivo VARCHAR(100),
  fecha_generacion DATE NOT NULL,
  estado_pago VARCHAR(10) NOT NULL DEFAULT 'PENDIENTE',
  id_prestamo INT NOT NULL,
  id_ejemplar INT NOT NULL,
  UNIQUE (id_prestamo, id_ejemplar),
  FOREIGN KEY (id_prestamo, id_ejemplar) REFERENCES detalle_prestamo(id_prestamo, id_ejemplar)
);

CREATE TABLE reserva (
  id_reserva INT PRIMARY KEY,
  fecha_reserva TIMESTAMP NOT NULL,
  fecha_limite_retiro TIMESTAMP NOT NULL,
  estado VARCHAR(10) NOT NULL CHECK (estado IN ('ACTIVA','CUMPLIDA','EXPIRADA','CANCELADA')),
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario),
  id_ejemplar INT NOT NULL REFERENCES ejemplar(id_ejemplar)
);
```