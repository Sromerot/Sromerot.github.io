---
title: "Proyecto 6: Restaurante con Varias Sedes y Domicilios"
description: "Base de datos relacional normalizada en 3FN para la operación de un restaurante multisede con atención en mesa, para llevar y domicilios."
---

<iframe
  frameborder="0"
  style="width: 100%; height: 550px; border: 1px solid #30363d; border-radius: 8px;"
  src="https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&target=blank&highlight=0000ff&layers=1&nav=1&title=RestauranteBaseDatos.drawio&dark=1#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1YqeEb536MfyTnHW4LkZmQkwsJdG-lYin%26export%3Ddownload"
></iframe>

**LinkDraw:** [Abrir diagrama en draw.io (RestauranteBaseDatos.drawio)](https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&target=blank&highlight=0000ff&layers=1&nav=1&title=RestauranteBaseDatos.drawio&dark=1#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1YqeEb536MfyTnHW4LkZmQkwsJdG-lYin%26export%3Ddownload)

## Contexto

Se requiere una base de datos para un restaurante con varias sedes que opera bajo las modalidades de atención en mesa, para llevar y a domicilio. Cada pedido incluye múltiples platos elaborados con ingredientes definidos en su receta, abastecidos por proveedores en cada sede. El registro actual en comandas de papel y hojas de inventario locales produce datos inconsistentes, imposibilidad de consultar ventas plato por plato, oferta de platos sin insumos disponibles, pérdida de reservas de mesas y falta de trazabilidad de tiempos en cocina.

## Funcionalidades

- **Sedes, mesas y reservas:** Administración de `SEDE`, la entidad débil `MESA` `(id_sede, numero_mesa)` y `RESERVA_MESA` vinculada a `CLIENTE` (con `TELEFONO_CLIENTE` y `CORREO_CLIENTE`) para evitar pérdida de mesas apartadas.
- **Personal especializado y jerarquía:** Supertipo `EMPLEADO` con supervisión recursiva (`id_jefe` para el chef/jefe), teléfonos multivaluados (`TELEFONO_EMPLEADO`) y especialización disjunta y parcial en `MESERO` y `COCINERO`.
- **Menú, recetas e inventario por sede:** Gestión de `CATEGORIA_PLATO`, `PLATO`, `INGREDIENTE`, composición de platos en `RECETA` y stock disponible en `INVENTARIO_SEDE`.
- **Suministros ternarios de proveedores:** Resolución de la relación ternaria `Suministrar` (`PROVEEDOR`, `INGREDIENTE`, `SEDE`) mediante la entidad asociativa `SUMINISTRO` con fecha, cantidad y costo unitario.
- **Comandas multicanal y trazabilidad de cocina:** Cabecera y detalle (`PEDIDO`, `DETALLE_PEDIDO`) con participación opcional `(0,1)` para `CLIENTE` y `MESA`, dirección de entrega compuesta para domicilios, `precio_unitario` histórico y seguimiento de preparación por cocinero en `PREPARACION` (`hora_inicio`, `hora_fin`).

## Normalización (1FN → 2FN → 3FN)

**Tabla plana de partida:**

`COMANDA_PLANA(id_pedido, fecha_hora, id_sede, nombre_sede, id_cliente, nombre_cliente, telefonos_cliente, id_plato, nombre_plato, id_categoria, nombre_categoria, precio_plato, cantidad)`

| Forma Normal | Problema / Dependencia eliminada | Corrección aplicada |
| --- | --- | --- |
| **1FN** | `telefonos_cliente` guarda múltiples valores en una celda y un pedido con varios platos repite el encabezado en cada fila. | Se extrae `TELEFONO_CLIENTE` y se establece una fila atómica por par pedido-plato con `PK(id_pedido, id_plato)`. |
| **2FN** | Dependencias parciales: `fecha_hora`, sede y cliente dependen solo de `id_pedido`; `nombre_plato`, `id_categoria` y `precio_plato` dependen solo de `id_plato`. | Se separan `PEDIDO` y `PLATO`; `DETALLE_PEDIDO` conserva la PK compuesta, `cantidad` y `precio_unitario` (valor histórico de la venta, sin violar 3FN). |
| **3FN** | Dependencias transitivas: `id_plato → id_categoria → nombre_categoria`; `id_pedido → id_cliente → nombre_cliente`; `id_pedido → id_sede → nombre_sede`. | Se crean `CATEGORIA_PLATO`, `CLIENTE` y `SEDE`, manteniendo solo claves foráneas. El atributo derivado `edad` no se almacena. |

**Tablas resultantes en 3FN:** `PEDIDO`, `DETALLE_PEDIDO`, `PLATO`, `CATEGORIA_PLATO`, `CLIENTE`, `TELEFONO_CLIENTE` y `SEDE`.

<details>
<summary>Ver Modelo Relacional (20 tablas) y Script SQL</summary>

### Modelo Relacional

- `SEDE`(**id_sede**, nombre, ciudad, calle, barrio, numero_direccion, telefono)
- `MESA`(***id_sede***, **numero_mesa**, capacidad, zona)
- `CLIENTE`(**id_cliente**, nombres, apellidos, fecha_nacimiento, ciudad, calle, barrio, numero_direccion)
- `TELEFONO_CLIENTE`(***id_cliente***, **numero**)
- `CORREO_CLIENTE`(***id_cliente***, **direccion_correo**)
- `EMPLEADO`(**id_empleado**, documento, nombres, apellidos, fecha_contratacion, salario, *id_sede*, *id_jefe*)
- `TELEFONO_EMPLEADO`(***id_empleado***, **numero**)
- `MESERO`(***id_empleado***, zona_asignada)
- `COCINERO`(***id_empleado***, especialidad, estacion)
- `CATEGORIA_PLATO`(**id_categoria**, nombre)
- `PLATO`(**id_plato**, nombre, descripcion, precio, tiempo_preparacion_min, *id_categoria*)
- `INGREDIENTE`(**id_ingrediente**, nombre, unidad_medida, stock_minimo)
- `RECETA`(***id_plato***, ***id_ingrediente***, cantidad_requerida)
- `INVENTARIO_SEDE`(***id_sede***, ***id_ingrediente***, cantidad_actual)
- `PROVEEDOR`(**nit**, nombre, telefono, correo)
- `SUMINISTRO`(***nit***, ***id_ingrediente***, ***id_sede***, **fecha_suministro**, cantidad, costo_unitario)
- `PEDIDO`(**id_pedido**, fecha_hora, tipo_pedido, estado, metodo_pago, tipo_factura, propina, valor_total, ciudad_entrega, calle_entrega, barrio_entrega, numero_entrega, *id_sede*, *id_mesero*, *id_cliente*, *numero_mesa*)
- `DETALLE_PEDIDO`(***id_pedido***, ***id_plato***, cantidad, precio_unitario, observaciones)
- `PREPARACION`(***id_pedido***, ***id_cocinero***, hora_inicio, hora_fin)
- `RESERVA_MESA`(**id_reserva**, fecha_hora, num_personas, estado, *id_cliente*, *id_sede*, *numero_mesa*)

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

CREATE TABLE mesa (
  id_sede INT REFERENCES sede(id_sede),
  numero_mesa INT,
  capacidad INT NOT NULL CHECK (capacidad > 0),
  zona VARCHAR(30),
  PRIMARY KEY (id_sede, numero_mesa)
);

CREATE TABLE cliente (
  id_cliente INT PRIMARY KEY,
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

CREATE TABLE mesero (
  id_empleado INT PRIMARY KEY REFERENCES empleado(id_empleado),
  zona_asignada VARCHAR(30)
);

CREATE TABLE cocinero (
  id_empleado INT PRIMARY KEY REFERENCES empleado(id_empleado),
  especialidad VARCHAR(60),
  estacion VARCHAR(40)
);

CREATE TABLE categoria_plato (
  id_categoria INT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE plato (
  id_plato INT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(200),
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  tiempo_preparacion_min INT CHECK (tiempo_preparacion_min > 0),
  id_categoria INT NOT NULL REFERENCES categoria_plato(id_categoria)
);

CREATE TABLE ingrediente (
  id_ingrediente INT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  unidad_medida VARCHAR(15) NOT NULL,
  stock_minimo DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE receta (
  id_plato INT REFERENCES plato(id_plato),
  id_ingrediente INT REFERENCES ingrediente(id_ingrediente),
  cantidad_requerida DECIMAL(10,3) NOT NULL CHECK (cantidad_requerida > 0),
  PRIMARY KEY (id_plato, id_ingrediente)
);

CREATE TABLE inventario_sede (
  id_sede INT REFERENCES sede(id_sede),
  id_ingrediente INT REFERENCES ingrediente(id_ingrediente),
  cantidad_actual DECIMAL(10,3) NOT NULL CHECK (cantidad_actual >= 0),
  PRIMARY KEY (id_sede, id_ingrediente)
);

CREATE TABLE proveedor (
  nit VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  correo VARCHAR(120)
);

CREATE TABLE suministro (
  nit VARCHAR(20) REFERENCES proveedor(nit),
  id_ingrediente INT REFERENCES ingrediente(id_ingrediente),
  id_sede INT REFERENCES sede(id_sede),
  fecha_suministro DATE,
  cantidad DECIMAL(10,3) NOT NULL CHECK (cantidad > 0),
  costo_unitario DECIMAL(10,2) NOT NULL CHECK (costo_unitario >= 0),
  PRIMARY KEY (nit, id_ingrediente, id_sede, fecha_suministro)
);

CREATE TABLE pedido (
  id_pedido INT PRIMARY KEY,
  fecha_hora TIMESTAMP NOT NULL,
  tipo_pedido VARCHAR(10) NOT NULL CHECK (tipo_pedido IN ('MESA','LLEVAR','DOMICILIO')),
  estado VARCHAR(12) NOT NULL CHECK (estado IN ('TOMADO','EN_COCINA','LISTO','ENTREGADO','CANCELADO')),
  metodo_pago VARCHAR(20),
  tipo_factura VARCHAR(20),
  propina DECIMAL(10,2) DEFAULT 0 CHECK (propina >= 0),
  valor_total DECIMAL(12,2) NOT NULL CHECK (valor_total >= 0),
  ciudad_entrega VARCHAR(50),
  calle_entrega VARCHAR(80),
  barrio_entrega VARCHAR(60),
  numero_entrega VARCHAR(20),
  id_sede INT NOT NULL REFERENCES sede(id_sede),
  id_mesero INT NOT NULL REFERENCES mesero(id_empleado),
  id_cliente INT REFERENCES cliente(id_cliente),
  numero_mesa INT,
  FOREIGN KEY (id_sede, numero_mesa) REFERENCES mesa(id_sede, numero_mesa),
  CHECK (tipo_pedido <> 'MESA' OR numero_mesa IS NOT NULL),
  CHECK (tipo_pedido <> 'DOMICILIO' OR calle_entrega IS NOT NULL)
);

CREATE TABLE detalle_pedido (
  id_pedido INT REFERENCES pedido(id_pedido),
  id_plato INT REFERENCES plato(id_plato),
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  observaciones VARCHAR(150),
  PRIMARY KEY (id_pedido, id_plato)
);

CREATE TABLE preparacion (
  id_pedido INT REFERENCES pedido(id_pedido),
  id_cocinero INT REFERENCES cocinero(id_empleado),
  hora_inicio TIMESTAMP,
  hora_fin TIMESTAMP,
  PRIMARY KEY (id_pedido, id_cocinero),
  CHECK (hora_fin IS NULL OR hora_fin >= hora_inicio)
);

CREATE TABLE reserva_mesa (
  id_reserva INT PRIMARY KEY,
  fecha_hora TIMESTAMP NOT NULL,
  num_personas INT NOT NULL CHECK (num_personas > 0),
  estado VARCHAR(10) NOT NULL CHECK (estado IN ('ACTIVA','CUMPLIDA','CANCELADA','NO_LLEGO')),
  id_cliente INT NOT NULL REFERENCES cliente(id_cliente),
  id_sede INT NOT NULL,
  numero_mesa INT NOT NULL,
  FOREIGN KEY (id_sede, numero_mesa) REFERENCES mesa(id_sede, numero_mesa)
);
```

</details>