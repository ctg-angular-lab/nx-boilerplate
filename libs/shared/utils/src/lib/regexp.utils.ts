/**
 * Constantes de Expresiones Regulares (RegExp) para validación de datos y formularios.
 */

/**
 * Valida texto compuesto exclusivamente por letras del alfabeto en español,
 * incluyendo caracteres acentuados, diéresis, ñ/Ñ y espacios.
 */
export const REGEX_LETTERS_ACCENTS_SPACES = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

/**
 * Valida cadenas que contienen únicamente dígitos numéricos (0-9).
 */
export const REGEX_ONLY_NUMBERS = /^[0-9]+$/;

/**
 * Valida direcciones de correo electrónico bajo formato estándar (RFC 5322 simplificado).
 */
export const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validas contraseñas seguras con los siguientes requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una letra minúscula
 * - Al menos una letra mayúscula
 * - Al menos un dígito numérico
 * - Al menos un carácter especial (@$!%*?&_-#)
 */
export const REGEX_STRONG_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/;

/**
 * Valida cadenas exclusivamente alfanuméricas.
 */
export const REGEX_ALPHANUMERIC = /^[a-zA-Z0-9]+$/;

/**
 * Valida identificadores hexadecimales de 24 caracteres tipo ObjectId de MongoDB.
 */
export const REGEX_MONGO_OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/**
 * Detecta caracteres de diacríticos y marcas de acento Unicode tras normalización NFD.
 */
export const REGEX_DIACRITICS = /[\u0300-\u036f]/g;

/**
 * Valida el formato de visualización de turnos 'HH:mm - HH:mm' (ej. 07:00 - 07:45).
 */
export const REGEX_TIME_SLOT_DISPLAY = /^\d{2}:\d{2} - \d{2}:\d{2}$/;

/**
 * Detecta caracteres especiales de expresiones regulares para su escape seguro.
 */
export const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

/**
 * Escapa caracteres especiales en un string para construir expresiones regulares dinámicas seguras.
 */
export function escapeRegExp(text: string): string {
  return text.replace(REGEX_SPECIAL_CHARACTERS, '\\$&');
}

/**
 * Remueve tildes y caracteres diacríticos normalizando a caracteres base ASCII.
 */
export function removeDiacritics(text: string): string {
  return text.normalize('NFD').replace(REGEX_DIACRITICS, '');
}
