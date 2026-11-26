---
title: "Proyecto 2: Red de Bibliotecas Universitarias"
description: "Base de datos relacional normalizada en 3FN para la gestión de una red de bibliotecas universitarias multisede."
---

<iframe
  frameborder="0"
  style="width: 100%; height: 550px; border: 1px solid #30363d; border-radius: 8px;"
  src="https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&target=blank&highlight=0000ff&layers=1&nav=1&title=RedBibliotecaBaseDatos.drawio&dark=1#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1-LDRXZVx8dTfKV089FdbAmhSxVBs2dt-%26export%3Ddownload"
></iframe>

**LinkDraw:** [Abrir diagrama en draw.io (RedBibliotecaBaseDatos.drawio)](https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&target=blank&highlight=0000ff&layers=1&nav=1&title=RedBibliotecaBaseDatos.drawio&dark=1#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1-LDRXZVx8dTfKV089FdbAmhSxVBs2dt-%26export%3Ddownload)

## Contexto

Se requiere una base de datos centralizada para una red de bibliotecas universitarias con varias sedes (una por campus). Actualmente el registro se lleva en hojas de cálculo independientes por sede, lo que genera autores y editoriales escritos de múltiples formas, desconocimiento de la disponibilidad real de ejemplares por campus, imposibilidad de apartar libros antes de desplazarse, préstamos sin control individual de devolución por ejemplar y multas sin trazabilidad del préstamo que las originó.

## Funcionalidades

- **Catálogo bibliográfico normalizado:** Registro único de `EDITORIAL`, `CATEGORIA`, `LIBRO` y `AUTOR`, resolviendo la coautoría y el orden de los autores mediante la relación M:N `AUTORIA`.
- **Control físico por sede:** Manejo de copias físicas a través de la entidad débil `EJEMPLAR` (dependiente de `LIBRO`), indicando su código de barras, ubicación, sede (`SEDE`) y estado (`DISPONIBLE`, `PRESTADO`, `RESERVADO`, `EN_REPARACION`, `PERDIDO`).
- **Gestión de personal con especialización y jerarquía:** Supertipo `EMPLEADO` con relación recursiva `Supervisar` (`id_jefe`), teléfonos multivaluados (`TELEFONO_EMPLEADO`) y especialización disjunta y parcial hacia `BIBLIOTECARIO` y `CATALOGADOR`.
- **Usuarios y apartados:** Control de `USUARIO` (`ESTUDIANTE`, `DOCENTE`, `EXTERNO`) con teléfonos y correos multivaluados (`TELEFONO_USUARIO`, `CORREO_USUARIO`) y sistema de `RESERVA` para apartar ejemplares disponibles.
- **Préstamos multiejemplar y trazabilidad de multas:** Modelado de la agregación `DETALLE_PRESTAMO` (entre `PRESTAMO` y `EJEMPLAR` con `fecha_devolucion` individual) enlazada en relación `1:1` con `MULTA` para garantizar trazabilidad exacta por retraso.

## Normalización (1FN → 2FN → 3FN)

**Tabla plana de partida:**

`PRESTAMO_PLANO(id_prestamo, fecha_prestamo, id_usuario, nombre_usuario, telefonos_usuario, id_ejemplar, isbn, titulo, id_editorial, nombre_editorial, pais_editorial, fecha_devolucion)`

| Forma Normal | Problema / Dependencia eliminada | Corrección aplicada |
| --- | --- | --- |
| **1FN** | `telefonos_usuario` almacena varios valores en una celda y un préstamo con varios libros repite la cabecera en múltiples filas. | Se extrae `telefonos_usuario` a `TELEFONO_USUARIO` y se define una fila atómica por par préstamo-ejemplar con `PK(id_prestamo, id_ejemplar)`. |
| **2FN** | Dependencias parciales sobre la PK compuesta: `fecha_prestamo`, `id_usuario` y `nombre_usuario` dependen solo de `id_prestamo`; `isbn`, `titulo` y datos de editorial dependen solo de `id_ejemplar`. | Se crean `PRESTAMO` y `EJEMPLAR`; `DETALLE_PRESTAMO` conserva únicamente `(id_prestamo, id_ejemplar)` y `fecha_devolucion`. |
| **3FN** | Dependencias transitivas: `id_ejemplar → isbn → titulo, id_editorial`; `isbn → id_editorial → nombre_editorial, pais_editorial`; `id_prestamo → id_usuario → nombre_usuario`. | Se separan `LIBRO`, `EDITORIAL` y `USUARIO`, dejando solo claves foráneas. El atributo derivado `edad` no se almacena. |

**Tablas resultantes en 3FN:** `USUARIO`, `TELEFONO_USUARIO`, `PRESTAMO`, `DETALLE_PRESTAMO`, `EJEMPLAR`, `LIBRO` y `EDITORIAL`.

<details>
<summary>Ver Modelo Relacional (18 tablas) y Script SQL</summary>

### Modelo Relacional

- `SEDE`(**id_sede**, nombre, ciudad, calle, barrio, numero_direccion, telefono)
- `EDITORIAL`(**id_editorial**, nombre, pais)
- `CATEGORIA`(**id_categoria**, nombre)
- `LIBRO`(**isbn**, titulo, edicion, anio_publicacion, num_paginas, *id_editorial*, *id_categoria*)
- `AUTOR`(**id_autor**, nombres, apellidos, nacionalidad)
- `AUTORIA`(***isbn***, ***id_autor***, orden_autor)
- `EMPLEADO`(**id_empleado**, documento, nombres, apellidos, fecha_contratacion, salario, *id_sede*, *id_jefe*)
- `TELEFONO_EMPLEADO`(***id_empleado***, **numero**)
- `BIBLIOTECARIO`(***id_empleado***, turno)
- `CATALOGADOR`(***id_empleado***, certificado_catalogacion)
- `EJEMPLAR`(**id_ejemplar**, codigo_barras, estado, fecha_adquisicion, ubicacion, *isbn*, *id_sede*, *id_catalogador*, fecha_catalogacion)
- `USUARIO`(**id_usuario**, documento, nombres, apellidos, fecha_nacimiento, tipo_usuario, ciudad, calle, barrio, numero_direccion)
- `TELEFONO_USUARIO`(***id_usuario***, **numero**)
- `CORREO_USUARIO`(***id_usuario***, **direccion_correo**)
- `PRESTAMO`(**id_prestamo**, fecha_prestamo, fecha_vencimiento, *id_usuario*, *id_bibliotecario*)
- `DETALLE_PRESTAMO`(***id_prestamo***, ***id_ejemplar***, fecha_devolucion)
- `MULTA`(**id_multa**, monto, motivo, fecha_generacion, estado_pago, *id_prestamo*, *id_ejemplar*)
- `RESERVA`(**id_reserva**, fecha_reserva, fecha_limite_retiro, estado, *id_usuario*, *id_ejemplar*)

### Tablas en SQL

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

</details>