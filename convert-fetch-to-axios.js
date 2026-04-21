const fs = require('fs');

const files = [
  "d:\\bloglogin\\src\\vue\\components\\MyProfile.vue",
  "d:\\bloglogin\\src\\vue\\components\\TopicList.vue",
  "d:\\bloglogin\\src\\vue\\components\\TopicDetail.vue",
  "d:\\bloglogin\\src\\vue\\components\\Following.vue",
  "d:\\bloglogin\\src\\vue\\components\\Followers.vue",
  "d:\\bloglogin\\src\\vue\\components\\Create.vue",
  "d:\\bloglogin\\src\\vue\\components\\EditProfile.vue",
  "d:\\bloglogin\\src\\vue\\components\\Search.vue",
  "d:\\bloglogin\\src\\vue\\components\\MyCreation.vue"
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log('\x1b[32mProcessing file:\x1b[0m', file);
    
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // 简单的fetch调用替换 - 这里需要更智能的处理
    // 先检查文件中是否还有fetch调用
    if (content.includes('fetch(')) {
      console.log('\x1b[33m⚠️ Found fetch calls in\x1b[0m', file);
      modified = true;
    }
    
    if (modified) {
      console.log('\x1b[36mFile needs manual review:\x1b[0m', file);
    } else {
      console.log('\x1b[32mNo fetch calls found in\x1b[0m', file);
    }
  } else {
    console.log('\x1b[31mFile not found:\x1b[0m', file);
  }
});

console.log('\n\x1b[32mAll files checked!\x1b[0m');
