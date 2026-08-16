## 🚨 Cloudflare Pages Asset Size Limit Prevention

### **Problem**:
```
[ERROR] Error: Pages only supports files up to 25 MiB in size
  demo-theme-change.mp4 is 39.2 MiB in size
Failed: error occurred while validating assets in your output directory.
```

### **Root Cause**:
Cloudflare Pages enforces a hard 25 MiB maximum file size limit for static assets deployed in the output directory (`dist/` copied from `public/`). Uncompressed raw videos or large media exceeding 25 MiB cause the Cloudflare deployment validator to immediately fail.

### **Prevention Rule**:
```
# ❌ WRONG - Committing large uncompressed video files (>25MB) directly to public/
public/demo-video.mp4 (39MB)

# ✅ CORRECT - Convert to optimized animated GIFs or compressed WebM/MP4 under 15MB
public/demo-video.gif (<15MB)
```

### **Implementation**:
1. All media in `public/` must remain under 15 MiB.
2. Animated demos should be converted to optimized adaptive GIFs or compressed WebM.
3. Check all assets before deployment using `find public/ -size +20M`.
