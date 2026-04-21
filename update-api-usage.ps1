# 批量更新API调用方式脚本
# 把直接导入api的方式改成使用this.$http

$files = @(
  "d:\bloglogin\src\vue\components\ZhihuDetail.vue",
  "d:\bloglogin\src\vue\components\UserDynamic.vue",
  "d:\bloglogin\src\vue\components\Register.vue",
  "d:\bloglogin\src\vue\components\Profile.vue",
  "d:\bloglogin\src\vue\components\MyProfile.vue",
  "d:\bloglogin\src\vue\components\Messages.vue",
  "d:\bloglogin\src\vue\components\Detail.vue",
  "d:\bloglogin\src\vue\components\Collections.vue",
  "d:\bloglogin\src\vue\components\BlogModal.vue",
  "d:\bloglogin\src\vue\components\AdminUsers.vue",
  "d:\bloglogin\src\vue\components\AdminDashboard.vue",
  "d:\bloglogin\src\vue\components\AdminBlogs.vue",
  "d:\bloglogin\src\vue\components\Notifications.vue"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Host "Processing file: $file" -ForegroundColor Green
    
    # 读取文件内容
    $content = Get-Content $file -Raw
    
    # 删除import api语句
    $content = $content -replace "import\s+api\s+from\s+['\"]\.\./utils/api['\"]\s*;?\s*", ""
    $content = $content -replace "import\s+api\s+from\s+['\"]\.\./utils/api\.js['\"]\s*;?\s*", ""
    
    # 把api.替换成this.$http.
    $content = $content -replace "api\.", "`$this.`$http."
    
    # 写回文件
    Set-Content -Path $file -Value $content -NoNewline
    
    Write-Host "Updated file: $file" -ForegroundColor Cyan
  } else {
    Write-Host "File not found: $file" -ForegroundColor Red
  }
}

Write-Host "`nAll files processed!" -ForegroundColor Green
