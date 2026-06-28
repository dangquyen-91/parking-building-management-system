import * as Yup from 'yup';

export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email không đúng định dạng')
    .required('Vui lòng nhập email'),
  password: Yup.string()
    .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự')
    .required('Vui lòng nhập mật khẩu'),
});

export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email không đúng định dạng')
    .required('Vui lòng nhập email'),
});

export const resetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .matches(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ cái in hoa')
    .matches(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 chữ số')
    .required('Vui lòng nhập mật khẩu mới'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
});

export const registerSchema = Yup.object().shape({
  fullName: Yup.string()
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .required('Vui lòng nhập họ và tên'),
  email: Yup.string()
    .email('Email không đúng định dạng')
    .required('Vui lòng nhập email'),
  password: Yup.string()
    .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự')
    .matches(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ cái in hoa')
    .matches(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 chữ số')
    .required('Vui lòng nhập mật khẩu'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận phải trùng khớp với mật khẩu đã nhập')
    .required('Vui lòng xác nhận mật khẩu'),
  terms: Yup.boolean()
    .oneOf([true], 'Bạn phải chấp nhận Điều khoản & Chính sách để đăng ký tài khoản')
    .required('Bạn phải chấp nhận Điều khoản & Chính sách'),
});
