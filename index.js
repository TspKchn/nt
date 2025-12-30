const http = require('http');
const net = require('net');
const Throttle = require('throttle');

// --- ตั้งค่าให้ตรงกับ 3x-ui ของคุณ ---
const VPS_HOST = '110.78.215.87';
const VPS_PORT = 443; // พอร์ต VLESS + WS ใน 3x-ui

// จำกัดความเร็วเพื่อคุมงบประมาณ (Mbps)
const DL_MBPS = 10; 
const UL_MBPS = 2;

const DL_LIMIT = (DL_MBPS * 1000 * 1000) / 8;
const UL_LIMIT = (UL_MBPS * 1000 * 1000) / 8;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("VLESS Cloud Run Bridge Active");
});

server.on('upgrade', (req, socket, head) => {
    // Handshake สำหรับ WebSocket
    socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
                 'Upgrade: websocket\r\n' +
                 'Connection: Upgrade\r\n\r\n');

    const downThrottle = new Throttle(DL_LIMIT);
    const upThrottle = new Throttle(UL_LIMIT);

    const vpsSocket = net.connect({
        port: VPS_PORT,
        host: VPS_HOST,
        highWaterMark: 16384 // ช่วยให้สปีดนิ่งตั้งแต่เริ่ม
    }, () => {
        vpsSocket.write(head);
        vpsSocket.pipe(downThrottle).pipe(socket); // คุมดาวน์โหลด
        socket.pipe(upThrottle).pipe(vpsSocket);   // คุมอัปโหลด
    });

    // Cleanup เมื่อเลิกใช้งาน
    const cleanup = () => {
        downThrottle.end();
        upThrottle.end();
        vpsSocket.destroy();
        socket.destroy();
    };

    vpsSocket.on('error', cleanup);
    socket.on('error', cleanup);
    vpsSocket.on('close', cleanup);
    socket.on('close', cleanup);
});

server.listen(process.env.PORT || 8080);
