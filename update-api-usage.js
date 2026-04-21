const fs = require('fs');
const path = require('path');

const files = [
  "d:\\bloglogin\\src\\vue\\components\\ZhihuDetail.vue",
  "d:\\bloglogin\\src\\vue\\components\\UserDynamic.vue",
  "d:\\bloglogin\\src\\vue\\components\\Register.vue",
  "d:\\bloglogin\\src\\vue\\components\\Profile.vue",
  "d:\\bloglogin\\src\\vue\\components\\MyProfile.vue",
  "d:\\bloglogin\\src\\vue\\components\\Messages.vue",
  "d:\\bloglogin\\src\\vue\\components\\Detail.vue",
  "d:\\bloglogin\\src\\vue\\components\\Collections.vue",
  "d:\\bloglogin\\src\\vue\\components\\BlogModal.vue",
  "d:\\bloglogin\\src\\vue\\components\\AdminUsers.vue",
  "d:\\bloglogin\\src\\vue\\components\\AdminDashboard.vue",
  "d:\\bloglogin\\src\\vue\\components\\AdminBlogs.vue",
  "d:\\bloglogin\\src\\vue\\components\\Notifications.vue"
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log('\x1b[32mProcessing file:\x1b[0m', file);
    
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/import\s+api\s+from\s+['"]\.\.\/utils\/api['"]\s*;?\s*/g, '');
    content = content.replace(/import\s+api\s+from\s+['"]\.\.\/utils\/api\.js['"]\s*;?\s*/g, '');
    
    content = content.replace(/api\./g, 'this.$http.');
    
    fs.writeFileSync(file, content, 'utf8');
    
    console.log('\x1b[36mUpdated file:\x1b[0m', file);
  } else {
    console.log('\x1b[31mFile not found:\x1b[0m', file);
  }
});

console.log('\n\x1b[32mAll files processed!\x1b[0m');
