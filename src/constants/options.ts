export const CURRENCIES = [
  "USD",
  "EUR",
  "MXN",
  "COP",
  "ARS",
  "CLP",
  "PEN"
] as const;

export const JOB_STATUS_LABELS = {
  ACTIVE: "Activa",
  INACTIVE: "Inactiva"
} as const;

export const CANDIDATE_STATUS_LABELS = {
  applied: "Postulado",
  invited: "Invitado",
  interviewing: "En Entrevista",
  reviewed: "En Revisión",
  rejected: "Rechazado",
  hired: "Contratado"
} as const;

export const LISTING_TYPE_PLACEHOLDER = "Selecciona un tipo";

export const CONTRACT_TYPE_LABELS = {
  FULL_TIME: "Tiempo completo",
  PART_TIME: "Medio tiempo",
  CONTRACT: "Contrato",
  FREELANCE: "Freelance"
} as const;
