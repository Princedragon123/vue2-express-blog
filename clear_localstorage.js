
console.log('🧹 清除浏览器localStorage和sessionStorage中的旧数据...');

// 在浏览器中运行这段代码来清除旧数据
const clearScript = `
(function() {
  console.log('开始清除旧数据...');
  
  // 清除localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('currentStyle');
  localStorage.removeItem('isSimpleMode');
  
  // 清除sessionStorage
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
  console.log('✅ 旧数据已清除！');
  console.log('现在请重新登录！');
  
  // 刷新页面
  // location.reload();
})();
`;

console.log('请在浏览器控制台中运行以下代码：');
console.log('');
console.log(clearScript);
console.log('');
console.log('或者直接访问：http://localhost:8081/login，然后按F12打开控制台运行上面的代码');
