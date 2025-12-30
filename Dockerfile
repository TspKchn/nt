# ใช้ Node.js 18 บน Alpine Linux เพื่อความเบาที่สุด
FROM node:18-alpine

# สร้างโฟลเดอร์ทำงาน
WORKDIR /usr/src/app

# คัดลอกเฉพาะไฟล์ที่จำเป็นสำหรับการลง Library
COPY package*.json ./

# ติดตั้งเฉพาะ Production Dependencies
RUN npm install --only=production

# คัดลอกโค้ด index.js เข้าไป
COPY . .

# Cloud Run มักจะใช้พอร์ต 8080 เป็นมาตรฐาน
EXPOSE 8080

# สั่งรันแอป
CMD [ "node", "index.js" ]
