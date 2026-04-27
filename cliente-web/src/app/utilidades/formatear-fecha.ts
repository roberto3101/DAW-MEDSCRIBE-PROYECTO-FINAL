export const formatearFecha = (fecha: string): string => {
  if (!fecha) return '';
  const objetoFecha = new Date(fecha);
  if (isNaN(objetoFecha.getTime())) return fecha;
  const dia = objetoFecha.getDate().toString().padStart(2, '0');
  const mes = (objetoFecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = objetoFecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

export const formatearFechaHora = (fecha: string): string => {
  if (!fecha) return '';
  const objetoFecha = new Date(fecha);
  if (isNaN(objetoFecha.getTime())) return fecha;
  const dia = objetoFecha.getDate().toString().padStart(2, '0');
  const mes = (objetoFecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = objetoFecha.getFullYear();
  const horas = objetoFecha.getHours().toString().padStart(2, '0');
  const minutos = objetoFecha.getMinutes().toString().padStart(2, '0');
  return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
};

export const calcularEdadDesdeFecha = (fechaNac: string): number | null => {
  if (!fechaNac) return null;
  const soloFecha = fechaNac.split('T')[0];
  const nacimiento = new Date(soloFecha);
  if (isNaN(nacimiento.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad >= 0 && edad < 130 ? edad : null;
};
