import React from "react";

const ConnectionStatus = ({ state }) => {
  const getLabel = () => {
    switch (state) {
      case "idle":
        return "Listo para iniciar";
      case "connecting":
        return "Conectando…";
      case "connected":
        return "Conectado";
      case "ended":
        return "Entrevista finalizada";
      case "error":
        return "Error en la conexión";
      default:
        return "Desconocido";
    }
  };

  const getColor = () => {
    switch (state) {
      case "connected":
        return "text-green-400";
      case "connecting":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <p className={`text-center font-medium ${getColor()}`}>
      {getLabel()}
    </p>
  );
};

export default ConnectionStatus;