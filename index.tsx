import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Accelerometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const COLORES_ESTADO: Record<string, string> = {
  "Sin actividad": "#9CA3AF",
  "Preparándose...": "#F59E0B",
  Caminando: "#3B82F6",
  Corriendo: "#EF4444",
};

function colorPorEstado(tipo: string) {
  return COLORES_ESTADO[tipo] ?? "#111111";
}

function IconoActividad({
  tipo,
  size = 30,
  color,
}: {
  tipo: string;
  size?: number;
  color?: string;
}) {
  const colorFinal = color ?? colorPorEstado(tipo);

  if (tipo === "Corriendo") {
    return <MaterialCommunityIcons name="run" size={size} color={colorFinal} />;
  }
  if (tipo === "Caminando") {
    return (
      <MaterialCommunityIcons name="walk" size={size} color={colorFinal} />
    );
  }
  if (tipo === "Preparándose...") {
    return <Ionicons name="hourglass-outline" size={size} color={colorFinal} />;
  }
  return <Ionicons name="ellipse-outline" size={size} color={colorFinal} />;
}

export default function HomeScreen() {
  const [activo, setActivo] = useState(false);
  const [pasos, setPasos] = useState(0);

  const [tipoMovimiento, setTipoMovimiento] = useState("Sin actividad");

  const [intensidad, setIntensidad] = useState(0);

  const [aceleracion, setAceleracion] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  const movimientoSuavizado = useRef(0);
  const movimientoAnterior = useRef(0);
  const picoActual = useRef(0);
  const ultimoPaso = useRef(0);
  const movimientoSubiendo = useRef(false);

  useEffect(() => {
    if (!activo) {
      return;
    }

    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener((datos) => {
      setAceleracion(datos);

      const magnitud = Math.sqrt(
        datos.x * datos.x + datos.y * datos.y + datos.z * datos.z,
      );

      const movimientoCrudo = Math.abs(magnitud - 1);

      movimientoSuavizado.current =
        movimientoSuavizado.current * 0.7 + movimientoCrudo * 0.3;

      const movimiento = movimientoSuavizado.current;

      const intensidadCalculada = Math.min(Math.round(movimiento * 150), 100);

      setIntensidad(intensidadCalculada);

      const ahora = Date.now();

      if (movimiento > movimientoAnterior.current) {
        movimientoSubiendo.current = true;

        if (movimiento > picoActual.current) {
          picoActual.current = movimiento;
        }
      }

      if (
        movimiento < movimientoAnterior.current &&
        movimientoSubiendo.current
      ) {
        const picoValido = picoActual.current > 0.08;
        const tiempoDesdePaso = ahora - ultimoPaso.current;
        const tiempoValido = tiempoDesdePaso > 300;

        if (picoValido && tiempoValido) {
          setPasos((actuales) => actuales + 1);
          ultimoPaso.current = ahora;
        }

        picoActual.current = 0;
        movimientoSubiendo.current = false;
      }

      movimientoAnterior.current = movimiento;

      if (movimiento > 0.5) {
        setTipoMovimiento("Corriendo");
      } else if (movimiento > 0.08) {
        setTipoMovimiento("Caminando");
      } else if (ahora - ultimoPaso.current > 2000) {
        setTipoMovimiento("Sin actividad");
      }
    });

    return () => {
      subscription.remove();
    };
  }, [activo]);

  const iniciarActividad = () => {
    setPasos(0);
    setIntensidad(0);

    setTipoMovimiento("Preparándose...");

    movimientoSuavizado.current = 0;
    movimientoAnterior.current = 0;
    picoActual.current = 0;
    ultimoPaso.current = 0;
    movimientoSubiendo.current = false;

    setActivo(true);
  };

  const detenerActividad = () => {
    setActivo(false);

    setTipoMovimiento("Sin actividad");
    setIntensidad(0);

    movimientoSuavizado.current = 0;
    movimientoAnterior.current = 0;
    picoActual.current = 0;
    ultimoPaso.current = 0;
    movimientoSubiendo.current = false;
  };

  const distanciaMetros = pasos * 0.75;
  const distanciaKilometros = distanciaMetros / 1000;

  const colorEstado = colorPorEstado(tipoMovimiento);

  return (
    <View style={styles.container}>
      <View style={styles.tituloContainer}>
        <MaterialCommunityIcons name="run-fast" size={32} color="#111" />
        <Text style={styles.titulo}>MI ACTIVIDAD</Text>
      </View>

      <View style={styles.filaCards}>
        <View style={[styles.card, styles.cardMitad]}>
          <View style={styles.metricaContainer}>
            <MaterialCommunityIcons name="shoe-print" size={28} color="#111" />
            <Text style={styles.numero}>{pasos}</Text>
          </View>
          <Text style={styles.etiqueta}>PASOS</Text>
        </View>

        <View style={[styles.card, styles.cardMitad]}>
          <View style={styles.metricaContainer}>
            <MaterialCommunityIcons name="speedometer" size={28} color="#111" />
            <Text style={styles.numero}>{intensidad}%</Text>
          </View>
          <View style={styles.barraFondo}>
            <View
              style={[
                styles.barraRelleno,
                { width: `${intensidad}%`, backgroundColor: colorEstado },
              ]}
            />
          </View>
          <Text style={styles.etiqueta}>INTENSIDAD</Text>
        </View>
      </View>

      <View
        style={[styles.card, { borderColor: colorEstado, borderWidth: 1.5 }]}
      >
        <View style={styles.movimientoContainer}>
          <IconoActividad tipo={tipoMovimiento} />
          <Text style={[styles.movimiento, { color: colorEstado }]}>
            {tipoMovimiento}
          </Text>
        </View>
        <Text style={styles.etiqueta}>TIPO DE MOVIMIENTO</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.metricaContainer}>
          <MaterialCommunityIcons
            name="map-marker-distance"
            size={28}
            color="#111"
          />
          <Text style={styles.numero}>{distanciaKilometros.toFixed(2)} km</Text>
        </View>
        <Text style={styles.etiqueta}>DISTANCIA APROXIMADA</Text>
      </View>

      <View style={styles.sensorCard}>
        <View style={styles.sensorTituloContainer}>
          <MaterialCommunityIcons name="axis-arrow" size={22} color="#ffffff" />
          <Text style={styles.sensorTitulo}>ACELERÓMETRO</Text>
        </View>
        <Text style={styles.sensor}>X: {aceleracion.x.toFixed(2)}</Text>
        <Text style={styles.sensor}>Y: {aceleracion.y.toFixed(2)}</Text>
        <Text style={styles.sensor}>Z: {aceleracion.z.toFixed(2)}</Text>
      </View>

      <Pressable
        style={[
          styles.boton,
          { backgroundColor: activo ? "#DC2626" : "#16A34A" },
        ]}
        onPress={activo ? detenerActividad : iniciarActividad}
      >
        <Ionicons name={activo ? "stop" : "play"} size={22} color="#ffffff" />
        <Text style={styles.textoBoton}>
          {activo ? "DETENER" : "INICIAR ACTIVIDAD"}
        </Text>
      </Pressable>
    </View>
  );
}

const sombra = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },
  tituloContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 25,
  },
  filaCards: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
    ...sombra,
  },
  cardMitad: {
    flex: 1,
    marginBottom: 0,
  },
  numero: {
    fontSize: 26,
    fontWeight: "bold",
  },
  metricaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  movimiento: {
    fontSize: 22,
    fontWeight: "bold",
  },
  movimientoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  etiqueta: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
  },
  barraFondo: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    marginTop: 8,
    overflow: "hidden",
  },
  barraRelleno: {
    height: "100%",
    borderRadius: 3,
  },
  sensorCard: {
    display: "none",
    backgroundColor: "#222",
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
    ...sombra,
  },
  sensorTituloContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  sensorTitulo: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
  sensor: {
    color: "#ffffff",
    fontSize: 14,
    marginVertical: 2,
  },
  boton: {
    padding: 17,
    borderRadius: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    ...sombra,
  },
  textoBoton: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
