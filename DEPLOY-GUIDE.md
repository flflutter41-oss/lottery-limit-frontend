# 📖 คู่มือการ Deploy ระบบตั้งลิมิตหวย

## ภาพรวม
- **Backend**: ใช้ Render (ฟรี)
- **Frontend**: ใช้ Netlify (ฟรี)
- **Database**: SQLite (เก็บบน Server)

---

## 🔧 ขั้นตอนที่ 1: เตรียมไฟล์สำหรับ Deploy

### 1.1 โครงสร้างโฟลเดอร์
```
โปรเจค/
├── backend/           ← สำหรับ Render
│   ├── server.js
│   ├── package.json
│   ├── render.yaml
│   └── .env (ต้องสร้างเอง)
│
├── index.html         ← สำหรับ Netlify
├── dashboard.html
├── limit-2digit.html
├── limit-3digit.html
├── settings.html
├── styles.css
├── config.js
├── app.js
├── db.js
└── netlify.toml
```

### 1.2 สร้างไฟล์ .env ในโฟลเดอร์ backend
```bash
cd backend
copy .env.example .env
```

แก้ไขไฟล์ `.env`:
```
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-key-change-this-to-random-32-chars
FRONTEND_URL=https://your-site.netlify.app
```

⚠️ **สำคัญ**: เปลี่ยน `JWT_SECRET` เป็นค่าสุ่มยาวๆ เช่น `abcd1234efgh5678ijkl9012mnop3456`

---

## 🚀 ขั้นตอนที่ 2: Deploy Backend บน Render

### 2.1 สร้าง GitHub Repository สำหรับ Backend
1. ไปที่ [github.com](https://github.com) และเข้าสู่ระบบ
2. คลิก **New Repository**
3. ตั้งชื่อ เช่น `lottery-limit-backend`
4. เลือก **Private** (แนะนำ)
5. คลิก **Create repository**

### 2.2 Push โค้ด Backend ไป GitHub
เปิด Terminal ในโฟลเดอร์ `backend`:
```bash
cd backend
git init
git add .
git commit -m "Initial backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lottery-limit-backend.git
git push -u origin main
```

### 2.3 Deploy บน Render
1. ไปที่ [render.com](https://render.com) และสมัคร/เข้าสู่ระบบ
2. คลิก **New** > **Web Service**
3. เชื่อมต่อกับ GitHub Repository ที่สร้างไว้
4. ตั้งค่า:
   - **Name**: `lottery-limit-api`
   - **Region**: Singapore (หรือใกล้ที่สุด)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. เพิ่ม **Environment Variables**:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | `your-random-secret-key-32-chars` |
   | `FRONTEND_URL` | `https://your-site.netlify.app` |

6. คลิก **Create Web Service**

### 2.4 จด URL ของ Backend
หลัง Deploy สำเร็จ จะได้ URL เช่น:
```
https://lottery-limit-api.onrender.com
```
**จดไว้!** จะต้องใช้ในขั้นตอนถัดไป

---

## 🌐 ขั้นตอนที่ 3: Deploy Frontend บน Netlify

### 3.1 แก้ไข config.js
เปิดไฟล์ `config.js` และแก้ไข `API_URL`:
```javascript
const CONFIG = {
    // เปลี่ยนจาก localhost เป็น URL ของ Render
    API_URL: 'https://lottery-limit-api.onrender.com',
    // ... ส่วนที่เหลือคงเดิม
};
```

### 3.2 สร้าง GitHub Repository สำหรับ Frontend
1. ไปที่ [github.com](https://github.com)
2. คลิก **New Repository**
3. ตั้งชื่อ เช่น `lottery-limit-frontend`
4. เลือก **Private** (แนะนำ)

### 3.3 Push โค้ด Frontend ไป GitHub
เปิด Terminal ในโฟลเดอร์หลัก (ไม่ใช่ backend):
```bash
# สร้าง .gitignore
echo "backend/" > .gitignore
echo "node_modules/" >> .gitignore
echo "lottery.db" >> .gitignore

git init
git add .
git commit -m "Initial frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lottery-limit-frontend.git
git push -u origin main
```

### 3.4 Deploy บน Netlify
1. ไปที่ [netlify.com](https://netlify.com) และสมัคร/เข้าสู่ระบบ
2. คลิก **Add new site** > **Import an existing project**
3. เลือก **GitHub**
4. เลือก Repository `lottery-limit-frontend`
5. ตั้งค่า:
   - **Branch**: `main`
   - **Build command**: (ว่างไว้)
   - **Publish directory**: `.`
6. คลิก **Deploy site**

### 3.5 จด URL ของ Frontend
หลัง Deploy สำเร็จ จะได้ URL เช่น:
```
https://cool-name-123456.netlify.app
```

### 3.6 (เปลี่ยนชื่อ Domain - ทำเสริม)
1. ไปที่ **Site settings** > **Domain management**
2. คลิก **Options** > **Edit site name**
3. เปลี่ยนเป็นชื่อที่ต้องการ เช่น `lottery-limit`
4. URL จะเปลี่ยนเป็น `https://lottery-limit.netlify.app`

---

## 🔗 ขั้นตอนที่ 4: เชื่อมต่อ Frontend กับ Backend

### 4.1 อัปเดต Environment Variables บน Render
1. กลับไปที่ Render Dashboard
2. เลือก Web Service ที่สร้างไว้
3. ไปที่ **Environment**
4. แก้ไข `FRONTEND_URL` เป็น URL จริงของ Netlify:
   ```
   FRONTEND_URL=https://your-actual-site.netlify.app
   ```
5. คลิก **Save Changes**

### 4.2 อัปเดต config.js แล้ว Re-deploy
1. แก้ไข `config.js` ให้ `API_URL` ตรงกับ URL ของ Render
2. Commit และ Push:
   ```bash
   git add config.js
   git commit -m "Update API URL"
   git push
   ```
3. Netlify จะ Auto-deploy

---

## ✅ ขั้นตอนที่ 5: ทดสอบ

1. เปิด URL ของ Netlify
2. เข้าสู่ระบบด้วย:
   - **Username**: `admin`
   - **Password**: `admin123`
3. ทดสอบฟีเจอร์ต่างๆ:
   - ดู Dashboard
   - ตั้งค่าลิมิต 2 ตัว
   - ตั้งค่าลิมิต 3 ตัว
   - เปลี่ยนรหัสผ่าน

---

## 🔒 การป้องกันที่มีในระบบ

### Backend Security
| ฟีเจอร์ | รายละเอียด |
|--------|------------|
| **Helmet** | ป้องกัน XSS, Clickjacking |
| **Rate Limiting** | จำกัด 100 requests/15 นาที |
| **Login Rate Limit** | จำกัด 5 ครั้ง/15 นาที |
| **JWT Authentication** | Token หมดอายุใน 24 ชั่วโมง |
| **Password Hashing** | bcrypt (ปลอดภัยสูง) |
| **CORS** | อนุญาตเฉพาะ Frontend URL |

### Frontend Security
| ฟีเจอร์ | รายละเอียด |
|--------|------------|
| **Token Storage** | เก็บใน localStorage |
| **Auto Redirect** | หาก Token หมดอายุ |
| **Security Headers** | ผ่าน netlify.toml |

---

## 🐛 แก้ไขปัญหาทั่วไป

### 1. "Failed to fetch" หรือ Network Error
- ตรวจสอบว่า `API_URL` ใน config.js ถูกต้อง
- ตรวจสอบว่า Backend บน Render ทำงานอยู่
- Render Free Plan จะ Sleep หลัง 15 นาที → รอ 30 วินาที แล้วลองใหม่

### 2. CORS Error
- ตรวจสอบว่า `FRONTEND_URL` บน Render ตรงกับ URL ของ Netlify
- ต้องรวม `https://` และไม่มี `/` ต่อท้าย

### 3. "Invalid token" หรือ 401 Error  
- Token หมดอายุ → Login ใหม่
- ล้าง LocalStorage แล้ว Login ใหม่

### 4. Database หายหลัง Deploy ใหม่
- Render Free Plan ไม่ persist disk
- **แนะนำ**: Upgrade เป็น Paid Plan หรือใช้ Database Service อื่น

---

## 💡 Tips

### Render Free Plan
- จะ Sleep หลังไม่มี Traffic 15 นาที
- Wake up ใช้เวลา ~30 วินาที
- ถ้าต้องการให้ทำงานตลอด → Upgrade เป็น Paid Plan

### Netlify Free Plan
- Bandwidth: 100GB/เดือน
- Build minutes: 300 นาที/เดือน
- เพียงพอสำหรับใช้งานทั่วไป

### เก็บรหัสผ่านที่ปลอดภัย
- อย่าใช้ `admin123` ใน Production
- เปลี่ยนรหัสผ่านทันทีหลัง Deploy
- ใช้รหัสผ่านที่ยาวและซับซ้อน

---

## 📱 เข้าถึงผ่านมือถือ

เว็บไซต์รองรับ Responsive Design:
1. เปิด URL บน Browser มือถือ
2. กดเมนู ☰ เพื่อแสดงเมนู
3. ใช้งานได้เหมือนบน Desktop

---

## 🔄 Update โค้ด

### อัปเดต Backend
```bash
cd backend
git add .
git commit -m "Update"
git push
```
Render จะ Auto-deploy

### อัปเดต Frontend
```bash
git add .
git commit -m "Update"
git push
```
Netlify จะ Auto-deploy

---

**เสร็จสิ้น!** 🎉

หากมีคำถามหรือปัญหา สามารถสอบถามเพิ่มเติมได้
