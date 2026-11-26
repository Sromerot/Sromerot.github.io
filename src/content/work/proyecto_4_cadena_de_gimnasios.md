---
title: "Cadena de Gimnasios"
summary: "Diseño relacional en 3FN con 18 tablas para administrar membresías, planes, pagos, clases con cupo, accesos y mantenimiento de equipos."
role: "Arquitecto y Modelador de Bases de Datos"
date: 2026-11-24
---

## Contexto

Una cadena de gimnasios con múltiples sedes opera mediante hojas independientes por sede, lo que genera miembros duplicados, falta de control sobre qué membresías están vigentes o habilitadas para acceso multisede, clases grupales sin límite de cupo ni reserva previa, ausencia de registro de entradas/salidas por sede y falta de trazabilidad en el mantenimiento de máquinas con proveedores externos.

## Funcionalidad

* **Membresías y pagos:** relaciona `MIEMBRO`, `PLAN` (`acceso_multisede`), `ASESOR_COMERCIAL` y `SEDE` mediante la agregación `MEMBRESIA`, con historial de cuotas en `PAGO`.
* **Especialización y supervisión:** aplica jerarquía ISA disjunta y parcial (`EMPLEADO` → `ENTRENADOR` / `ASESOR_COMERCIAL`) y supervisión recursiva (`id_jefe`).
* **Clases y control de cupo:** resuelve la programación entre `CLASE`, `SEDE` y `ENTRENADOR` mediante `SESION` (`cupo_maximo`) e `INSCRIPCION` (`asistio`).
* **Accesos y mantenimiento:** audita ingresos/salidas en `ACCESO` y el mantenimiento preventivo/correctivo en `EQUIPO`, `PROVEEDOR` y `MANTENIMIENTO`.

## Normalización

A partir de la tabla plana `INSCRIPCION_PLANA(id_miembro, nombre_miembro, telefonos_miembro, id_sesion, fecha_hora, id_clase, nombre_clase, id_entrenador, nombre_entrenador, especialidad_entrenador, id_sede, nombre_sede, asistio)`:

* **1FN:** se extrae `telefonos_miembro` a `TELEFONO_MIEMBRO` y se establece la clave primaria compuesta `(id_miembro, id_sesion)`.
* **2FN:** se eliminan dependencias parciales creando `MIEMBRO` y `SESION`; `INSCRIPCION` conserva solo `asistio` y `fecha_inscripcion`.
* **3FN:** se eliminan dependencias transitivas separando `CLASE`, `ENTRENADOR`/`EMPLEADO` y `SEDE`, omitiendo el atributo derivado `edad`.

**Tablas resultantes en 3FN:** `MIEMBRO`, `TELEFONO_MIEMBRO`, `INSCRIPCION`, `SESION`, `CLASE`, `EMPLEADO`/`ENTRENADOR` y `SEDE`.

## LinkDraw

* **Diagrama EER, ER Refinado y Modelo Relacional:** [Abrir en draw.io (CadenaGimnasiosBaseDatos.drawio)](https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&target=blank&highlight=0000ff&layers=1&nav=1&title=CadenaGimnasiosBaseDatos.drawio&dark=1#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D10yokA1DxTTqWNrOn0mertvdEMP896f2E%26export%3Ddownload)

## Modelo Relacional (18 tablas)

```text
SEDE(**id_sede**, nombre, ciudad, calle, barrio, numero_direccion, telefono, aforo_maximo)
PLAN(**id_plan**, nombre, precio, duracion_dias, acceso_multisede)
MIEMBRO(**id_miembro**, documento, nombres, apellidos, fecha_nacimiento, ciudad, calle, barrio, numero_direccion, nombre_contacto, telefono_contacto)
TELEFONO_MIEMBRO(**id_miembro**, **numero**)
CORREO_MIEMBRO(**id_miembro**, **direccion_correo**)
EMPLEADO(**id_empleado**, documento, nombres, apellidos, fecha_contratacion, salario, *id_sede*, *id_jefe*)
TELEFONO_EMPLEADO(**id_empleado**, **numero**)
ENTRENADOR(**id_empleado**, especialidad, certificacion)
ASESOR_COMERCIAL(**id_empleado**, comision, meta_mensual)
MEMBRESIA(**id_membresia**, fecha_inicio, fecha_fin, estado, *id_miembro*, *id_plan*, *id_asesor*, *id_sede*)
PAGO(**id_pago**, fecha_pago, monto, metodo_pago, tipo_factura, *id_membresia*)
CLASE(**id_clase**, nombre, descripcion, nivel, duracion_min)
SESION(**id_sesion**, fecha_hora, salon, cupo_maximo, *id_clase*, *id_sede*, *id_entrenador*)
INSCRIPCION(**id_miembro**, **id_sesion**, fecha_inscripcion, asistio)
EQUIPO(**id_equipo**, nombre, marca, fecha_compra, estado, *id_sede*)
PROVEEDOR(**nit**, nombre, telefono, correo)
MANTENIMIENTO(**id_mantenimiento**, fecha, descripcion, costo, *id_equipo*, *nit*)
ACCESO(**id_acceso**, fecha_hora_entrada, fecha_hora_salida, *id_miembro*, *id_sede*)
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
  telefono VARCHAR(20),
  aforo_maximo INT CHECK (aforo_maximo > 0)
);

CREATE TABLE plan (
  id_plan INT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  duracion_dias INT NOT NULL CHECK (duracion_dias > 0),
  acceso_multisede BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE miembro (
  id_miembro INT PRIMARY KEY,
  documento VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  fecha_nacimiento DATE,
  ciudad VARCHAR(50),
  calle VARCHAR(80),
  barrio VARCHAR(60),
  numero_direccion VARCHAR(20),
  nombre_contacto VARCHAR(100),
  telefono_contacto VARCHAR(20)
);

CREATE TABLE telefono_miembro (
  id_miembro INT REFERENCES miembro(id_miembro),
  numero VARCHAR(20),
  PRIMARY KEY (id_miembro, numero)
);

CREATE TABLE correo_miembro (
  id_miembro INT REFERENCES miembro(id_miembro),
  direccion_correo VARCHAR(120),
  PRIMARY KEY (id_miembro, direccion_correo)
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

CREATE TABLE entrenador (
  id_empleado INT PRIMARY KEY REFERENCES empleado(id_empleado),
  especialidad VARCHAR(60),
  certificacion VARCHAR(100)
);

CREATE TABLE asesor_comercial (
  id_empleado INT PRIMARY KEY REFERENCES empleado(id_empleado),
  comision DECIMAL(5,2),
  meta_mensual DECIMAL(12,2)
);

CREATE TABLE membresia (
  id_membresia INT PRIMARY KEY,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado VARCHAR(10) NOT NULL CHECK (estado IN ('VIGENTE','VENCIDA','CONGELADA','CANCELADA')),
  id_miembro INT NOT NULL REFERENCES miembro(id_miembro),
  id_plan INT NOT NULL REFERENCES plan(id_plan),
  id_asesor INT NOT NULL REFERENCES asesor_comercial(id_empleado),
  id_sede INT NOT NULL REFERENCES sede(id_sede),
  CHECK (fecha_fin > fecha_inicio)
);

CREATE TABLE pago (
  id_pago INT PRIMARY KEY,
  fecha_pago DATE NOT NULL,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  metodo_pago VARCHAR(20) NOT NULL,
  tipo_factura VARCHAR(20),
  id_membresia INT NOT NULL REFERENCES membresia(id_membresia)
);

CREATE TABLE clase (
  id_clase INT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  descripcion VARCHAR(200),
  nivel VARCHAR(20),
  duracion_min INT
);

CREATE TABLE sesion (
  id_sesion INT PRIMARY KEY,
  fecha_hora TIMESTAMP NOT NULL,
  salon VARCHAR(30),
  cupo_maximo INT NOT NULL CHECK (cupo_maximo > 0),
  id_clase INT NOT NULL REFERENCES clase(id_clase),
  id_sede INT NOT NULL REFERENCES sede(id_sede),
  id_entrenador INT NOT NULL REFERENCES entrenador(id_empleado)
);

CREATE TABLE inscripcion (
  id_miembro INT REFERENCES miembro(id_miembro),
  id_sesion INT REFERENCES sesion(id_sesion),
  fecha_inscripcion TIMESTAMP NOT NULL,
  asistio BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (id_miembro, id_sesion)
);

CREATE TABLE equipo (
  id_equipo INT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  marca VARCHAR(40),
  fecha_compra DATE,
  estado VARCHAR(15) NOT NULL DEFAULT 'OPERATIVO',
  id_sede INT NOT NULL REFERENCES sede(id_sede)
);

CREATE TABLE proveedor (
  nit VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  correo VARCHAR(120)
);

CREATE TABLE mantenimiento (
  id_mantenimiento INT PRIMARY KEY,
  fecha DATE NOT NULL,
  descripcion VARCHAR(200),
  costo DECIMAL(10,2) CHECK (costo >= 0),
  id_equipo INT NOT NULL REFERENCES equipo(id_equipo),
  nit VARCHAR(20) NOT NULL REFERENCES proveedor(nit)
);

CREATE TABLE acceso (
  id_acceso INT PRIMARY KEY,
  fecha_hora_entrada TIMESTAMP NOT NULL,
  fecha_hora_salida TIMESTAMP,
  id_miembro INT NOT NULL REFERENCES miembro(id_miembro),
  id_sede INT NOT NULL REFERENCES sede(id_sede)
);
```