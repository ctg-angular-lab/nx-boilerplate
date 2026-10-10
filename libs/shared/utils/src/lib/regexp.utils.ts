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
 * Valida contraseñas seguras con los siguientes requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una letra minúscula
 * - Al menos una letra mayúscula
 * - Al menos un dígito numérico
 * - Al menos un carácter especial (@$!%*?&_-#)
 */
export const REGEX_STRONG_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/;
