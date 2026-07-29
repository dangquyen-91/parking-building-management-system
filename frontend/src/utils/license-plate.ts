export const LICENSE_PLATE_EXAMPLE = '30A-12345 hoặc 59P2-12345';

export const LICENSE_PLATE_PATTERN = /^\d{2}[A-Z]{1,2}\d?-\d{4,5}$/;

export function normalizeLicensePlate(value: string) {
  return value
    .toUpperCase()
    .trim()
    .replace(/\./g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function getLicensePlateError(value: string) {
  const plate = normalizeLicensePlate(value);
  if (!plate) return 'Vui lòng nhập biển số xe.';

  if (!LICENSE_PLATE_PATTERN.test(plate)) {
    return `Biển số không đúng định dạng. Ví dụ: ${LICENSE_PLATE_EXAMPLE}.`;
  }

  return null;
}

export const isLicensePlateValid = (value: string) => getLicensePlateError(value) === null;
