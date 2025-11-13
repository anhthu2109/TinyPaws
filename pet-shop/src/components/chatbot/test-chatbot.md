# 🧪 Test Chatbot Widget

## ✅ Checklist kiểm tra

### 1. Visual & Layout
- [ ] Bubble icon hiển thị ở góc phải dưới
- [ ] Bubble có animation pulse
- [ ] Bubble hover có scale effect
- [ ] Chat window mở với animation slide up
- [ ] Header có gradient đỏ đẹp
- [ ] Messages area có scrollbar custom
- [ ] Input area fixed ở bottom

### 2. Z-index & Overlay
- [ ] Widget luôn nổi trên tất cả elements
- [ ] Không bị đè bởi navigation
- [ ] Không bị đè bởi slider/banner
- [ ] Không bị đè bởi footer
- [ ] Input có thể click và nhập text

### 3. Functionality
- [ ] Click bubble → Chat window mở
- [ ] Click close button → Chat window đóng
- [ ] Nhập text vào input → Text hiển thị
- [ ] Enter → Gửi message
- [ ] Message user hiển thị bên phải (đỏ)
- [ ] Loading indicator hiển thị khi đang gửi
- [ ] Bot response hiển thị bên trái (trắng)
- [ ] Auto scroll xuống message mới nhất

### 4. API Integration
- [ ] POST request gửi đến http://localhost:8001/chat
- [ ] Request body đúng format: `{ "message": "..." }`
- [ ] Response parse đúng: `response.data.response`
- [ ] Error handling hiển thị message lỗi thân thiện
- [ ] Loading state disable input khi đang xử lý

### 5. Responsive
- [ ] Desktop (>480px): 380x550px
- [ ] Mobile (≤480px): Full width - 32px
- [ ] Bubble position điều chỉnh theo màn hình
- [ ] Text wrap đúng trong bubbles
- [ ] Scrollbar hoạt động mượt

### 6. Animations
- [ ] Bubble pulse animation (2s loop)
- [ ] Window slide up (0.3s)
- [ ] Message fade in (0.3s)
- [ ] Typing indicator (3 dots bounce)
- [ ] Close button rotate (90deg)
- [ ] Send button scale on hover

### 7. Edge Cases
- [ ] Gửi message rỗng → Không gửi
- [ ] Gửi message chỉ có spaces → Không gửi
- [ ] API timeout → Hiển thị error
- [ ] API 500 error → Hiển thị error
- [ ] Network offline → Hiển thị error
- [ ] Message dài → Text wrap đúng
- [ ] Nhiều messages → Scroll hoạt động

## 🧪 Test Cases

### Test 1: Basic Flow
```
1. Load trang web
2. Kiểm tra bubble icon hiển thị
3. Click bubble
4. Kiểm tra chat window mở
5. Nhập "Xin chào"
6. Click send hoặc Enter
7. Kiểm tra message user hiển thị
8. Kiểm tra loading indicator
9. Kiểm tra bot response
10. Click close button
11. Kiểm tra window đóng
```

### Test 2: Input Validation
```
1. Mở chat
2. Nhập ""  (rỗng) → Không gửi
3. Nhập "   " (spaces) → Không gửi
4. Nhập "Chó của tôi bị ốm" → Gửi thành công
```

### Test 3: API Error Handling
```
1. Tắt FastAPI server
2. Mở chat
3. Gửi message
4. Kiểm tra error message hiển thị
5. Kiểm tra không bị crash
```

### Test 4: Z-index Priority
```
1. Scroll xuống footer
2. Mở chat
3. Kiểm tra widget nổi trên footer
4. Hover vào navigation mega dropdown
5. Kiểm tra widget vẫn nổi trên
```

### Test 5: Responsive
```
1. Resize browser → 1920px
   - Widget: 380x550px
2. Resize → 768px
   - Widget: 380x550px
3. Resize → 375px
   - Widget: calc(100vw - 32px)
```

### Test 6: Multiple Messages
```
1. Gửi 10 messages liên tiếp
2. Kiểm tra auto scroll
3. Kiểm tra scrollbar
4. Scroll lên xem messages cũ
5. Gửi message mới
6. Kiểm tra auto scroll xuống
```

## 🐛 Common Issues & Solutions

### Issue: Input không nhập được
**Debug:**
```javascript
// Check pointer-events
console.log(window.getComputedStyle(inputElement).pointerEvents);
// Should be "auto"

// Check z-index
console.log(window.getComputedStyle(inputElement).zIndex);
// Should be high number
```

**Fix:**
```css
.chatbot-input {
  pointer-events: auto !important;
  position: relative;
  z-index: 1000000;
}
```

### Issue: Widget bị đè
**Debug:**
```javascript
// Check z-index của tất cả elements
document.querySelectorAll('*').forEach(el => {
  const z = window.getComputedStyle(el).zIndex;
  if (z !== 'auto' && parseInt(z) > 1000) {
    console.log(el, z);
  }
});
```

**Fix:**
```css
.chatbot-widget {
  z-index: 999999 !important;
}
```

### Issue: API CORS error
**Debug:**
```javascript
// Check network tab
// Error: "Access-Control-Allow-Origin"
```

**Fix (FastAPI):**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Messages không auto scroll
**Debug:**
```javascript
// Check ref
console.log(chatEndRef.current);
// Should not be null

// Check scroll behavior
chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
```

**Fix:**
```javascript
useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
```

## 📊 Performance Metrics

### Target Metrics
- **Time to Interactive**: < 200ms
- **First Contentful Paint**: < 100ms
- **API Response Time**: 1-3s
- **Animation FPS**: 60fps
- **Memory Usage**: < 50MB

### Monitoring
```javascript
// Measure API response time
const start = performance.now();
await axios.post(API_URL, { message });
const end = performance.now();
console.log(`API took ${end - start}ms`);

// Measure render time
const renderStart = performance.now();
setMessages([...messages, newMessage]);
requestAnimationFrame(() => {
  const renderEnd = performance.now();
  console.log(`Render took ${renderEnd - renderStart}ms`);
});
```

## 🎯 Acceptance Criteria

✅ **PASS** nếu:
- Tất cả 7 sections trong checklist đều PASS
- Không có console errors
- Không có visual bugs
- API integration hoạt động
- Responsive trên tất cả devices
- Animations mượt mà (60fps)

❌ **FAIL** nếu:
- Input không nhập được
- Widget bị đè bởi elements khác
- API không kết nối được
- Có memory leaks
- Animations giật lag

## 📝 Test Report Template

```markdown
# Chatbot Widget Test Report

**Date**: [DATE]
**Tester**: [NAME]
**Environment**: 
- Browser: Chrome 120
- OS: Windows 11
- Screen: 1920x1080

## Results

### Visual & Layout: ✅ PASS
- All items checked

### Z-index & Overlay: ✅ PASS
- Widget always on top
- Input works perfectly

### Functionality: ✅ PASS
- All features working

### API Integration: ⚠️ PARTIAL
- Connection works
- Timeout handling needs improvement

### Responsive: ✅ PASS
- Works on all screen sizes

### Animations: ✅ PASS
- 60fps, smooth

### Edge Cases: ✅ PASS
- All edge cases handled

## Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]

## Overall: ✅ PASS / ❌ FAIL
```

## 🚀 Next Steps

1. Run all tests
2. Fix any issues found
3. Document in test report
4. Deploy to staging
5. User acceptance testing
6. Deploy to production
