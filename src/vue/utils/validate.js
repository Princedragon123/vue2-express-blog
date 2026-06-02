// 抽离登录/注册通用校验规则，避免组件内重复编写
export const validateRules = {
  // 邮箱校验（支持纯用户名/邮箱格式）
  email(val) {
    if (!val) return '请输入用户名或邮箱';
    if (val.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return '请输入有效的邮箱地址';
    }
    return '';
  },
  // 严格邮箱校验（仅邮箱格式，用于注册）
  strictEmail(val) {
    if (!val) return '请输入邮箱';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return '请输入有效的邮箱地址';
    }
    return '';
  },
  // 密码校验
  password(val) {
    if (!val) return '请输入密码';
    if (val.length < 6) return '密码长度不能少于6位';
    return '';
  },
  // 用户名校验
  username(val) {
    if (!val) return '请输入用户名';
    if (val.length < 3) return '用户名长度不能少于3位';
    return '';
  },
  // 确认密码校验
  confirmPassword(val, pwd) {
    if (!val) return '请确认密码';
    if (val !== pwd) return '两次输入的密码不一致';
    return '';
  }
};

// 防抖函数（防止重复提交）
export function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args)  {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}