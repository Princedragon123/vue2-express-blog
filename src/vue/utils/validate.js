// 表单校验规则 + 防抖函数
// 从 helpers.js 导入 debounce，避免重复定义
import { debounce } from './helpers';

export { debounce };

// 校验规则集
export const validateRules = {
  email(val) {
    if (!val) return '请输入用户名或邮箱';
    if (val.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return '请输入有效的邮箱地址';
    }
    return '';
  },

  strictEmail(val) {
    if (!val) return '请输入邮箱';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return '请输入有效的邮箱地址';
    }
    return '';
  },

  password(val) {
    if (!val) return '请输入密码';
    if (val.length < 6) return '密码长度不能少于6位';
    return '';
  },

  username(val) {
    if (!val) return '请输入用户名';
    if (val.length < 3) return '用户名长度不能少于3位';
    return '';
  },

  confirmPassword(val, pwd) {
    if (!val) return '请确认密码';
    if (val !== pwd) return '两次输入的密码不一致';
    return '';
  }
};
