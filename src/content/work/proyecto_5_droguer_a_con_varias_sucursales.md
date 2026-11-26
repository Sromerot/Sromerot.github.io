---
title: "Droguería con Varias Sucursales"
summary: "Base de datos relacional en 3FN de 22 tablas con control de lotes y vencimientos, inventario por sede, apartados y fórmulas médicas."
role: "Arquitecto y Modelador de Bases de Datos"
date: 2026-11-23
---

## Contexto

Una droguería con varias sucursales lleva su inventario en hojas locales por sede, ocasionando nombres duplicados de medicamentos, laboratorios y proveedores, desconocimiento del stock por lote y sucursal, venta de productos vencidos, imposibilidad de apartar existencias, ventas sin detalle por producto y falta de registro de fórmulas médicas y validación farmacéutica.

## Funcionalidad

* **Catálogo farmacéutico y lotes:** estructura `LABORATORIO`, `CATEGORIA`, `PRODUCTO`, `PRINCIPIO_ACTIVO` (`COMPOSICION`) y la entidad débil `LOTE` con control de `fecha_vencimiento`.
* **Inventario, compras y apartados:** controla existencias por lote y sucursal mediante la agregación `INVENTARIO`, órdenes en `ORDEN_COMPRA`/`DETALLE_ORDEN` y reservas de stock en `APARTADO`.
* **Especialización y supervisión:** aplica jerarquía ISA disjunta y parcial (`EMPLEADO` → `FARMACEUTICO` / `AUXILIAR`) y supervisión recursiva (`id_jefe`).
* **Ventas y fórmulas médicas:** soporta ventas anónimas y con cliente registrado (`VENTA`, `DETALLE_VENTA`), asociando `FORMULA_MEDICA` y validación obligatoria de `FARMACEUTICO`.

## Normalización

A partir de la tabla plana `VENTA_PLANA(id_venta, fecha_venta, id_sucursal, nombre_sucursal, id_cliente, nombre_cliente, telefonos_cliente, id_producto, nombre_producto, id_laboratorio, nombre_laboratorio, pais_laboratorio, numero_lote, fecha_vencimiento, cantidad, precio_unitario)`:

* **1FN:** se extrae `telefonos_cliente` a `TELEFONO_CLIENTE` y se define la PK compuesta `(id_venta, id_producto, numero_lote)`.
* **2FN:** se eliminan dependencias parciales creando `VENTA`, `PRODUCTO`, `LOTE` y `DETALLE_VENTA`.
* **3FN:** se eliminan dependencias transitivas separando `LABORATORIO`, `CLIENTE` y `SUCURSAL`, omitiendo el atributo derivado `edad`.

**Tablas resultantes en 3FN:** `VENTA`, `DETALLE_VENTA`, `PRODUCTO`, `LOTE`, `LABORATORIO`, `CLIENTE`, `TELEFONO_CLIENTE` y `SUCURSAL`.

## LinkDraw

* **Diagrama EER, ER Refinado y Modelo Relacional:** [Abrir en draw.io (DrogueriaBaseDatos.drawio)](https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&target=blank&highlight=0000ff&layers=1&nav=1&title=DrogueriaBaseDatos.drawio&dark=1#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D12fgWITxxlrc36h4GWwTSXu7FD4iM3Z7T%26export%3Ddownload)

## Modelo Relacional (22 tablas)

```text
SUCURSAL(**id_sucursal**, nombre, ciudad, calle, barrio, numero_direccion, telefono)
LABORATORIO(**id_laboratorio**, nombre, pais)
CATEGORIA(**id_categoria**, nombre)
PRODUCTO(**id_producto**, nombre, presentacion, precio_venta, requiere_formula, *id_laboratorio*, *id_categoria*)
PRINCIPIO_ACTIVO(**id_principio**, nombre)
COMPOSICION(**id_producto**, **id_principio**, concentracion)
LOTE(**id_producto**, **numero_lote**, fecha_fabricacion, fecha_vencimiento)
INVENTARIO(**id_producto**, **numero_lote**, **id_sucursal**, cantidad_disponible)
PROVEEDOR(**nit**, nombre, telefono, correo)
ORDEN_COMPRA(**id_orden**, fecha_orden, estado, *id_sucursal*, *nit*)
DETALLE_ORDEN(**id_orden**, **id_producto**, **numero_lote**, cantidad, costo_unitario)
EMPLEADO(**id_empleado**, documento, nombres, apellidos, fecha_contratacion, salario, *id_sucursal*, *id_jefe*)
TELEFONO_EMPLEADO(**id_empleado**, **numero**)
FARMACEUTICO(**id_empleado**, tarjeta_profesional)
AUXILIAR(**id_empleado**, turno)
CLIENTE(**id_cliente**, documento, nombres, apellidos, fecha_nacimiento, ciudad, calle, barrio, numero_direccion)
TELEFONO_CLIENTE(**id_cliente**, **numero**)
CORREO_CLIENTE(**id_cliente**, **direccion_correo**)
FORMULA_MEDICA(**id_formula**, fecha_emision, nombre_medico, registro_medico, entidad_emisora, *id_cliente*)
VENTA(**id_venta**, fecha_venta, metodo_pago, tipo_factura, valor_total, *id_sucursal*, *id_empleado*, *id_cliente*, *id_formula*, *id_farmaceutico_valida*)
DETALLE_VENTA(**id_venta**, **id_producto**, **numero_lote**, cantidad, precio_unitario)
APARTADO(**id_apartado**, fecha_apartado, fecha_limite_retiro, cantidad, estado, *id_cliente*, *id_producto*, *numero_lote*, *id_sucursal*)
```

## Código SQL

```sql
CREATE TABLE sucursal (
  id_sucursal INT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  ciudad VARCHAR(50),
  calle VARCHAR(80),
  barrio VARCHAR(60),
  numero_direccion VARCHAR(20),
  telefono VARCHAR(20)
);

CREATE TABLE laboratorio (
  id_laboratorio INT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  pais VARCHAR(50)
);

CREATE TABLE categoria (
  id_categoria INT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE producto (
  id_producto INT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  presentacion VARCHAR(60),
  precio_venta DECIMAL(10,2) NOT NULL CHECK (precio_venta >= 0),
  requiere_formula BOOLEAN NOT NULL DEFAULT FALSE,
  id_laboratorio INT NOT NULL REFERENCES laboratorio(id_laboratorio),
  id_categoria INT NOT NULL REFERENCES categoria(id_categoria)
);

CREATE TABLE principio_activo (
  id_principio INT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE composicion (
  id_producto INT REFERENCES producto(id_producto),
  id_principio INT REFERENCES principio_activo(id_principio),
  concentracion VARCHAR(30),
  PRIMARY KEY (id_producto, id_principio)
);

CREATE TABLE lote (
  id_producto INT REFERENCES producto(id_producto),
  numero_lote VARCHAR(30),
  fecha_fabricacion DATE,
  fecha_vencimiento DATE NOT NULL,
  PRIMARY KEY (id_producto, numero_lote),
  CHECK (fecha_vencimiento > fecha_fabricacion)
);

CREATE TABLE inventario (
  id_producto INT,
  numero_lote VARCHAR(30),
  id_sucursal INT REFERENCES sucursal(id_sucursal),
  cantidad_disponible INT NOT NULL CHECK (cantidad_disponible >= 0),
  PRIMARY KEY (id_producto, numero_lote, id_sucursal),
  FOREIGN KEY (id_producto, numero_lote) REFERENCES lote(id_producto, numero_lote)
);

CREATE TABLE proveedor (
  nit VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  correo VARCHAR(120)
);

CREATE TABLE orden_compra (
  id_orden INT PRIMARY KEY,
  fecha_orden DATE NOT NULL,
  estado VARCHAR(10) NOT NULL CHECK (estado IN ('PENDIENTE','RECIBIDA','CANCELADA')),
  id_sucursal INT NOT NULL REFERENCES sucursal(id_sucursal),
  nit VARCHAR(20) NOT NULL REFERENCES proveedor(nit)
);

CREATE TABLE detalle_orden (
  id_orden INT REFERENCES orden_compra(id_orden),
  id_producto INT,
  numero_lote VARCHAR(30),
  cantidad INT NOT NULL CHECK (cantidad > 0),
  costo_unitario DECIMAL(10,2) NOT NULL CHECK (costo_unitario >= 0),
  PRIMARY KEY (id_orden, id_producto, numero_lote),
  FOREIGN KEY (id_producto, numero_lote) REFERENCES lote(id_producto, numero_lote)
);

CREATE TABLE empleado (
  id_empleado INT PRIMARY KEY,
  documento VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  fecha_contratacion DATE NOT NULL,
  salario DECIMAL(12,2) CHECK (salario >= 0),
  id_sucursal INT NOT NULL REFERENCES sucursal(id_sucursal),
  id_jefe INT REFERENCES empleado(id_empleado)
);

CREATE TABLE telefono_empleado (
  id_empleado INT REFERENCES empleado(id_empleado),
  numero VARCHAR(20),
  PRIMARY KEY (id_empleado, numero)
);

CREATE TABLE farmaceutico (
  id_empleado INT PRIMARY KEY REFERENCES empleado(id_empleado),
  tarjeta_profesional VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE auxiliar (
  id_empleado INT PRIMARY KEY REFERENCES empleado(id_empleado),
  turno VARCHAR(20)
);

CREATE TABLE cliente (
  id_cliente INT PRIMARY KEY,
  documento VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  fecha_nacimiento DATE,
  ciudad VARCHAR(50),
  calle VARCHAR(80),
  barrio VARCHAR(60),
  numero_direccion VARCHAR(20)
);

CREATE TABLE telefono_cliente (
  id_cliente INT REFERENCES cliente(id_cliente),
  numero VARCHAR(20),
  PRIMARY KEY (id_cliente, numero)
);

CREATE TABLE correo_cliente (
  id_cliente INT REFERENCES cliente(id_cliente),
  direccion_correo VARCHAR(120),
  PRIMARY KEY (id_cliente, direccion_correo)
);

CREATE TABLE formula_medica (
  id_formula INT PRIMARY KEY,
  fecha_emision DATE NOT NULL,
  nombre_medico VARCHAR(100) NOT NULL,
  registro_medico VARCHAR(30) NOT NULL,
  entidad_emisora VARCHAR(100),
  id_cliente INT NOT NULL REFERENCES cliente(id_cliente)
);

CREATE TABLE venta (
  id_venta INT PRIMARY KEY,
  fecha_venta TIMESTAMP NOT NULL,
  metodo_pago VARCHAR(20) NOT NULL,
  tipo_factura VARCHAR(20),
  valor_total DECIMAL(12,2) NOT NULL CHECK (valor_total >= 0),
  id_sucursal INT NOT NULL REFERENCES sucursal(id_sucursal),
  id_empleado INT NOT NULL REFERENCES empleado(id_empleado),
  id_cliente INT REFERENCES cliente(id_cliente),
  id_formula INT REFERENCES formula_medica(id_formula),
  id_farmaceutico_valida INT REFERENCES farmaceutico(id_empleado)
);

CREATE TABLE detalle_venta (
  id_venta INT REFERENCES venta(id_venta),
  id_producto INT,
  numero_lote VARCHAR(30),
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  PRIMARY KEY (id_venta, id_producto, numero_lote),
  FOREIGN KEY (id_producto, numero_lote) REFERENCES lote(id_producto, numero_lote)
);

CREATE TABLE apartado (
  id_apartado INT PRIMARY KEY,
  fecha_apartado TIMESTAMP NOT NULL,
  fecha_limite_retiro TIMESTAMP NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  estado VARCHAR(10) NOT NULL CHECK (estado IN ('ACTIVO','RETIRADO','EXPIRADO')),
  id_cliente INT NOT NULL REFERENCES cliente(id_cliente),
  id_producto INT NOT NULL,
  numero_lote VARCHAR(30) NOT NULL,
  id_sucursal INT NOT NULL,
  FOREIGN KEY (id_producto, numero_lote, id_sucursal) REFERENCES inventario(id_producto, numero_lote, id_sucursal)
);
```