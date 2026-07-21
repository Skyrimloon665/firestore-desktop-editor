export function parseFieldValue(value: string, type: string): any {
  if (type === "number") {
    const parsed = Number(value);
    if (isNaN(parsed)) {
      throw new Error("El valor ingresado no es un número válido.");
    }
    return parsed;
  }
  if (type === "boolean") {
    return value.toLowerCase() === "true" || value === "1";
  }
  return value;
}
