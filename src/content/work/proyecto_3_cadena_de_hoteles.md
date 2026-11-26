---
title: "Proyecto 3: Cadena de Hoteles"
description: "Base de datos relacional normalizada en 3FN para la gestión operativa de una cadena hotelera multisede."
---

<iframe
  frameborder="0"
  style="width: 100%; height: 550px; border: 1px solid #30363d; border-radius: 8px;"
  src="https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&target=blank&highlight=0000ff&layers=1&nav=1&title=CadenaHotelesBaseDatos.drawio&dark=auto#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1fwElrdQX6g6BmD1WZLh83NHerSwkmdyf%26export%3Ddownload"
></iframe>

**LinkDraw:** [Abrir diagrama en draw.io (CadenaHotelesBaseDatos.drawio)](https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&target=blank&highlight=0000ff&layers=1&nav=1&title=CadenaHotelesBaseDatos.drawio&dark=auto#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1fwElrdQX6g6BmD1WZLh83NHerSwkmdyf%26export%3Ddownload)

## Contexto

Se requiere una base de datos para administrar una cadena de hoteles con sedes en distintas ciudades. Cada hotel cuenta con habitaciones clasificadas por tipo, atiende reservas de huéspedes por rango de fechas, cobra consumos de servicios adicionales (spa, restaurante, lavandería), controla el aseo de habitaciones y emite la factura final. El manejo actual en cuadernos por hotel provoca huéspedes duplicados, sobreventa de habitaciones, falta de visibilidad de disponibilidad, pérdida de consumos y ausencia de trazabilidad del aseo.

## Funcionalidades

- **Gestión de hoteles y habitaciones:** Registro de `HOTEL`, `TIPO_HABITACION` y la entidad débil `HABITACION` identificada por `(id_hotel, numero_habitacion)` con control de estado (`LIBRE`, `OCUPADA`, `LIMPIEZA`, `MANTENIMIENTO`).
- **Personal con especialización y supervisión:** Supertipo `EMPLEADO` con relación recursiva `Supervisar` (`id_jefe`), teléfonos multivaluados (`TELEFONO_EMPLEADO`) y especialización disjunta y parcial en `RECEPCIONISTA` y `PERSONAL_LIMPIEZA`.
- **Reservas con integridad de sede:** Modelado de `RESERVA` (agregación conceptual entre `HUESPED` y `HOTEL` atendida por `RECEPCIONISTA`) y `DETALLE_RESERVA`, reforzando con clave foránea compuesta `(id_reserva, id_hotel)` que todas las habitaciones reservadas pertenezcan al mismo hotel.
- **Consumos, aseo y facturación:** Registro detallado de servicios en `SERVICIO` y `CONSUMO_SERVICIO` (guardando `precio_unitario` histórico), trazabilidad de limpieza en `ASEO` y relación `1:1` entre `RESERVA` y `FACTURA`.
- **Control de huéspedes:** Identificación única por `(tipo_documento, documento)` en `HUESPED` con múltiples teléfonos y correos en `TELEFONO_HUESPED` y `CORREO_HUESPED`.

## Normalización (1FN → 2FN → 3FN)

**Tabla plana de partida:**

`RESERVA_PLANA(id_reserva, fecha_checkin, fecha_checkout, id_huesped, nombre_huesped, id_hotel, nombre_hotel, numero_habitacion, id_tipo, nombre_tipo, capacidad, precio_base, servicios_consumidos)`

| Forma Normal | Problema / Dependencia eliminada | Corrección aplicada |
| --- | --- | --- |
| **1FN** | `servicios_consumidos` agrupa múltiples consumos en una celda y una reserva con varias habitaciones repite datos de cabecera. | Se pasa `servicios_consumidos` a `CONSUMO_SERVICIO` (una fila atómica por consumo) y se fija la PK principal en `(id_reserva, id_hotel, numero_habitacion)`. |
| **2FN** | Dependencias parciales: fechas y huésped dependen solo de `id_reserva`; tipo y atributos de habitación dependen de `(id_hotel, numero_habitacion)`; `nombre_hotel` depende solo de `id_hotel`. | Se separan `RESERVA`, `HABITACION` y `HOTEL`; `DETALLE_RESERVA` conserva la PK compuesta y `precio_noche_pactado`. |
| **3FN** | Dependencias transitivas: `(id_hotel, numero_habitacion) → id_tipo → nombre_tipo, capacidad, precio_base`; `id_reserva → id_huesped → nombre_huesped`. | Se crean `TIPO_HABITACION`, `HUESPED` y `SERVICIO`. Los atributos derivados `edad` y `noches` no se almacenan. |

**Tablas resultantes en 3FN:** `HUESPED`, `RESERVA`, `DETALLE_RESERVA`, `HABITACION`, `TIPO_HABITACION`, `HOTEL`, `CONSUMO_SERVICIO` y `SERVICIO`.

<details>
<summary>Ver Modelo Relacional (16 tablas) y Script SQL</summary>

### Modelo Relacional

- `HOTEL`(**id_hotel**, nombre, ciudad, calle, barrio, numero_direccion, estrellas, telefono)
- `TIPO_HABITACION`(**id_tipo**, nombre, capacidad, precio_base, descripcion)
- `HABITACION`(***id_hotel***, **numero_habitacion**, piso, estado, *id_tipo*)
- `EMPLEADO`(**id_empleado**, documento, nombres, apellidos, fecha_contratacion, salario, *id_hotel*, *id_jefe*)
- `TELEFONO_EMPLEADO`(***id_empleado***, **numero**)
- `RECEPCIONISTA`(***id_empleado***, idiomas, turno)
- `PERSONAL_LIMPIEZA`(***id_empleado***, zona_asignada)
- `HUESPED`(**id_huesped**, tipo_documento, documento, nombres, apellidos, fecha_nacimiento, nacionalidad)
- `TELEFONO_HUESPED`(***id_huesped***, **numero**)
- `CORREO_HUESPED`(***id_huesped***, **direccion_correo**)
- `RESERVA`(**id_reserva**, fecha_reserva, fecha_checkin, fecha_checkout, num_huespedes, estado, *id_huesped*, *id_hotel*, *id_recepcionista*)
- `DETALLE_RESERVA`(***id_reserva***, ***id_hotel***, ***numero_habitacion***, precio_noche_pactado)
- `SERVICIO`(**id_servicio**, nombre, categoria, precio)
- `CONSUMO_SERVICIO`(***id_reserva***, ***id_servicio***, **fecha_consumo**, cantidad, precio_unitario)
- `ASEO`(***id_empleado***, ***id_hotel***, ***numero_habitacion***, **fecha**, hora_inicio, observaciones)
- `FACTURA`(**id_factura**, fecha_emision, metodo_pago, tipo_factura, valor_total, *id_reserva*)

### Tablas en SQL

```sql
CREATE TABLE hotel (
  id_hotel INT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  ciudad VARCHAR(50),
  calle VARCHAR(80),
  barrio VARCHAR(60),
  numero_direccion VARCHAR(20),
  estrellas INT CHECK (estrellas BETWEEN 1 AND 5),
  telefono VARCHAR(20)
);

CREATE TABLE tipo_habitacion (
  id_tipo INT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL UNIQUE,
  capacidad INT NOT NULL CHECK (capacidad > 0),
  precio_base DECIMAL(10,2) NOT NULL CHECK (precio_base >= 0),
  descripcion VARCHAR(200)
);

CREATE TABLE habitacion (
  id_hotel INT REFERENCES hotel(id_hotel),
  numero_habitacion VARCHAR(10),
  piso INT,
  estado VARCHAR(15) NOT NULL CHECK (estado IN ('LIBRE','OCUPADA','LIMPIEZA','MANTENIMIENTO')),
  id_tipo INT NOT NULL REFERENCES tipo_habitacion(id_tipo),
  PRIMARY KEY (id_hotel, numero_habitacion)
);

CREATE TABLE empleado (
  id_empleado INT PRIMARY KEY,
  documento VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  fecha_contratacion DATE NOT NULL,
  salario DECIMAL(12,2) CHECK (salario >= 0),
  id_hotel INT NOT NULL REFERENCES hotel(id_hotel),
  id_jefe INT REFERENCES empleado(id_empleado)
);

CREATE TABLE telefono_empleado (
  id_empleado INT REFERENCES empleado(id_empleado),
  numero VARCHAR(20),
  PRIMARY KEY (id_empleado, numero)
);

CREATE TABLE recepcionista (
  id_empleado INT PRIMARY KEY REFERENCES empleado(id_empleado),
  idiomas VARCHAR(100),
  turno VARCHAR(20)
);

CREATE TABLE personal_limpieza (
  id_empleado INT PRIMARY KEY REFERENCES empleado(id_empleado),
  zona_asignada VARCHAR(40)
);

CREATE TABLE huesped (
  id_huesped INT PRIMARY KEY,
  tipo_documento VARCHAR(10) NOT NULL,
  documento VARCHAR(20) NOT NULL,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  fecha_nacimiento DATE,
  nacionalidad VARCHAR(50),
  UNIQUE (tipo_documento, documento)
);

CREATE TABLE telefono_huesped (
  id_huesped INT REFERENCES huesped(id_huesped),
  numero VARCHAR(20),
  PRIMARY KEY (id_huesped, numero)
);

CREATE TABLE correo_huesped (
  id_huesped INT REFERENCES huesped(id_huesped),
  direccion_correo VARCHAR(120),
  PRIMARY KEY (id_huesped, direccion_correo)
);

CREATE TABLE reserva (
  id_reserva INT PRIMARY KEY,
  fecha_reserva TIMESTAMP NOT NULL,
  fecha_checkin DATE NOT NULL,
  fecha_checkout DATE NOT NULL,
  num_huespedes INT NOT NULL CHECK (num_huespedes > 0),
  estado VARCHAR(12) NOT NULL CHECK (estado IN ('PENDIENTE','CONFIRMADA','EN_CURSO','FINALIZADA','CANCELADA')),
  id_huesped INT NOT NULL REFERENCES huesped(id_huesped),
  id_hotel INT NOT NULL REFERENCES hotel(id_hotel),
  id_recepcionista INT NOT NULL REFERENCES recepcionista(id_empleado),
  CHECK (fecha_checkout > fecha_checkin),
  UNIQUE (id_reserva, id_hotel)
);

CREATE TABLE detalle_reserva (
  id_reserva INT,
  id_hotel INT,
  numero_habitacion VARCHAR(10),
  precio_noche_pactado DECIMAL(10,2) NOT NULL CHECK (precio_noche_pactado >= 0),
  PRIMARY KEY (id_reserva, id_hotel, numero_habitacion),
  FOREIGN KEY (id_reserva, id_hotel) REFERENCES reserva(id_reserva, id_hotel),
  FOREIGN KEY (id_hotel, numero_habitacion) REFERENCES habitacion(id_hotel, numero_habitacion)
);

CREATE TABLE servicio (
  id_servicio INT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  categoria VARCHAR(30),
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0)
);

CREATE TABLE consumo_servicio (
  id_reserva INT REFERENCES reserva(id_reserva),
  id_servicio INT REFERENCES servicio(id_servicio),
  fecha_consumo TIMESTAMP,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  PRIMARY KEY (id_reserva, id_servicio, fecha_consumo)
);

CREATE TABLE aseo (
  id_empleado INT REFERENCES personal_limpieza(id_empleado),
  id_hotel INT,
  numero_habitacion VARCHAR(10),
  fecha DATE,
  hora_inicio TIME,
  observaciones VARCHAR(200),
  PRIMARY KEY (id_empleado, id_hotel, numero_habitacion, fecha),
  FOREIGN KEY (id_hotel, numero_habitacion) REFERENCES habitacion(id_hotel, numero_habitacion)
);

CREATE TABLE factura (
  id_factura INT PRIMARY KEY,
  fecha_emision DATE NOT NULL,
  metodo_pago VARCHAR(20) NOT NULL,
  tipo_factura VARCHAR(20) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL CHECK (valor_total >= 0),
  id_reserva INT NOT NULL UNIQUE REFERENCES reserva(id_reserva)
);
```

</details>