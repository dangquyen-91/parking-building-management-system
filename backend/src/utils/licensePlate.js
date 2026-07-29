export const LICENSE_PLATE_PATTERN = /^\d{2}[A-Z]{1,2}\d?-\d{4,5}$/;

const invalidFormatMessage =
  'Biển số không đúng định dạng. Ví dụ: 30A-12345 hoặc 59P2-12345.';

export const licensePlateMessages = {
  'any.required': 'Vui lòng nhập biển số xe.',
  'string.empty': 'Vui lòng nhập biển số xe.',
  'string.min': invalidFormatMessage,
  'string.max': invalidFormatMessage,
  'string.pattern.base': invalidFormatMessage,
};
