# 小怪兽存档

## 1. 可爱小怪兽表情

### 模板
```html
<!-- 不喜欢的小怪兽 -->
<div class="anim-card" ref="card2">
  <div class="card-label">👾 可爱小怪兽表情</div>
  <div class="card-stage">
    <div class="monster-wrapper">
      <div class="monster" ref="monster">
        <div class="ear-left"></div>
        <div class="ear-right"></div>
        <div class="eye" ref="eye">
          <div class="eye-ball" ref="eyeBall">
            <div class="eye-highlight"></div>
          </div>
        </div>
        <div class="mouth" ref="mouth">
          <div class="tongue"></div>
        </div>
      </div>
      <div class="monster-shadow" ref="monsterShadow"></div>
    </div>
  </div>
</div>
```

### 样式
```css
/* 不喜欢的小怪兽样式 */
.monster-wrapper {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 12px;
  min-height: 300px;
}

.monster {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 32px;
  background: #ff9a9e;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.ear-left,
.ear-right {
  position: absolute;
  width: 20px;
  height: 16px;
  background: #ff9a9e;
  border-radius: 50% 50% 0 0;
  top: -10px;
}

.ear-left {
  left: 24px;
}

.ear-right {
  right: 24px;
}

.monster .eye {
  width: 48px;
  height: 48px;
  background: #fff;
  border-radius: 50%;
  margin: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.monster .eye .eye-ball {
  width: 24px;
  height: 24px;
  background: #333;
  border-radius: 50%;
  position: relative;
}

.monster .eye .eye-ball .eye-highlight {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border-radius: 50%;
  top: 4px;
  left: 4px;
}

.monster .mouth {
  width: 40px;
  height: 24px;
  background: #c44569;
  border-radius: 0 0 50% 50%;
  position: relative;
  overflow: hidden;
}

.monster .mouth .tongue {
  position: absolute;
  width: 24px;
  height: 12px;
  background: #ff6b6b;
  border-radius: 50%;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
}

.monster-shadow {
  width: 96px;
  height: 20px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  margin-top: 20px;
}
```

### 动画
```javascript
// 小怪兽循环动画
this.monsterTl = gsap.timeline({ repeat: -1 });

// 弹跳动画
this.monsterTl
  .to(
    this.$refs.monster,
    { y: -20, duration: 0.8, ease: "power1.inOut" },
    0,
  )
  .to(
    this.$refs.monster,
    { y: 0, duration: 0.8, ease: "power1.inOut" },
    0.8,
  );

// 眼球移动动画
this.monsterTl
  .to(
    this.$refs.eyeBall,
    { x: 8, duration: 1.5, ease: "power1.inOut" },
    0,
  )
  .to(
    this.$refs.eyeBall,
    { x: -8, duration: 1.5, ease: "power1.inOut" },
    1.5,
  );

// 阴影动画
this.monsterTl
  .to(
    this.$refs.monsterShadow,
    { scale: 0.8, opacity: 0.5, duration: 0.8, ease: "power1.inOut" },
    0,
  )
  .to(
    this.$refs.monsterShadow,
    { scale: 1.1, opacity: 0.9, duration: 0.8, ease: "power1.inOut" },
    0.8,
  );

// 咀嚼动画（独立的循环）
this.chewTl = gsap.timeline({ repeat: -1 });
this.chewTl
  .to(
    this.$refs.mouth,
    {
      height: 24,
      borderRadius: "0 0 50% 50%",
      duration: 0.25,
      ease: "power1.inOut",
    },
    0,
  )
  .to(
    this.$refs.mouth,
    {
      height: 12,
      borderRadius: "0 0 30% 30%",
      duration: 0.25,
      ease: "power1.inOut",
    },
    0.25,
  )
  .to(
    this.$refs.mouth,
    {
      height: 6,
      borderRadius: "4px",
      duration: 0.25,
      ease: "power1.inOut",
    },
    0.5,
  )
  .to(
    this.$refs.mouth,
    {
      height: 12,
      borderRadius: "0 0 30% 30%",
      duration: 0.25,
      ease: "power1.inOut",
    },
    0.75,
  )
  .to(
    this.$refs.mouth,
    {
      height: 24,
      borderRadius: "0 0 50% 50%",
      duration: 0.25,
      ease: "power1.inOut",
    },
    1,
  );
```

---

## 2. 不开心的小怪兽

### 模板
```html
<!-- 不开心的小怪兽 -->
<div class="anim-card" ref="card3">
  <div class="card-label">😾 不开心的小怪兽</div>
  <div class="card-stage">
    <div class="sad-monster-wrapper">
      <div class="sad-monster" ref="sadMonster">
        <div class="sad-ear-left"></div>
        <div class="sad-ear-right"></div>
        <div class="sad-eye" ref="sadEye">
          <div class="sad-eye-ball" ref="sadEyeBall">
            <div class="sad-eye-highlight"></div>
          </div>
        </div>
        <div class="sad-mouth" ref="sadMouth">
          <div class="sad-tongue"></div>
        </div>
      </div>
      <div class="sad-monster-shadow" ref="sadMonsterShadow"></div>
    </div>
  </div>
</div>
```

### 样式
```css
/* 不开心的小怪兽样式 */
.sad-monster-wrapper {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 12px;
  min-height: 300px;
}

.sad-monster {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 32px;
  background: #ff9a9e;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.sad-ear-left,
.sad-ear-right {
  position: absolute;
  width: 20px;
  height: 16px;
  background: #ff9a9e;
  border-radius: 50% 50% 0 0;
  top: -10px;
}

.sad-ear-left {
  left: 24px;
}

.sad-ear-right {
  right: 24px;
}

.sad-monster .sad-eye {
  width: 48px;
  height: 48px;
  background: #fff;
  border-radius: 50%;
  margin: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sad-monster .sad-eye .sad-eye-ball {
  width: 24px;
  height: 24px;
  background: #333;
  border-radius: 50%;
  position: relative;
}

.sad-monster .sad-eye .sad-eye-ball .sad-eye-highlight {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border-radius: 50%;
  top: 4px;
  left: 4px;
}

.sad-monster .sad-mouth {
  width: 40px;
  height: 18px;
  background: #c44569;
  border-bottom: none;
  border-radius: 80px 80px 0 0;
  position: relative;
  overflow: hidden;
}

.sad-monster .sad-mouth .sad-tongue {
  position: absolute;
  width: 24px;
  height: 12px;
  background: #ff6b6b;
  border-radius: 50%;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
}

.sad-monster-shadow {
  width: 96px;
  height: 20px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  margin-top: 20px;
}
```

### 动画
```javascript
// 不开心小怪兽动画
this.sadMonsterTl = gsap.timeline({ repeat: -1 });
this.sadMonsterTl
  .to(
    this.$refs.sadMonster,
    { rotation: -2, duration: 0.6, ease: "power1.inOut" },
    0,
  )
  .to(
    this.$refs.sadMonster,
    { rotation: 2, duration: 0.6, ease: "power1.inOut" },
    0.6,
  );
```
