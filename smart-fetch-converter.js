const fs = require('fs');

const files = [
  "d:\\bloglogin\\src\\vue\\components\\TopicList.vue",
  "d:\\bloglogin\\src\\vue\\components\\TopicDetail.vue",
  "d:\\bloglogin\\src\\vue\\components\\Following.vue",
  "d:\\bloglogin\\src\\vue\\components\\Followers.vue",
  "d:\\bloglogin\\src\\vue\\components\\Create.vue",
  "d:\\bloglogin\\src\\vue\\components\\EditProfile.vue",
  "d:\\bloglogin\\src\\vue\\components\\Search.vue",
  "d:\\bloglogin\\src\\vue\\components\\MyCreation.vue"
];

console.log('\x1b[36m⚠️  Note: Manual conversion needed for complex fetch patterns\x1b[0m');
console.log('\x1b[33mThe following files contain fetch calls that need manual review:\x1b[0m\n');

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Count fetch occurrences
    const fetchCount = (content.match(/fetch\(/g) || []).length;
    
    if (fetchCount > 0) {
      const fileName = file.split('\\').pop();
      console.log(`  ${fileName} - ${fetchCount} fetch call(s)`);
    }
  }
});

console.log('\n\x1b[32m📋 Summary:\x1b[0m');
console.log('Due to the complexity of fetch patterns, these files need manual conversion:');
console.log('  - TopicList.vue');
console.log('  - TopicDetail.vue');
console.log('  - Following.vue');
console.log('  - Followers.vue');
console.log('  - Create.vue');
console.log('  - EditProfile.vue');
console.log('  - Search.vue');
console.log('  - MyCreation.vue');
console.log('\n\x1b[33m💡 Tip: For each file, look for fetch calls and convert them to this.$http methods\x1b[0m');
