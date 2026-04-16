require('dotenv').config();
const express = require('express');
const session = require('cookie-session');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer setup - Use /tmp for Vercel (read-only filesystem)
const upload = multer({ dest: process.env.VERCEL ? '/tmp' : 'uploads/' });

// Handle folder creation for local dev
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (e) {
        console.warn('Warning: Could not create uploads directory. This is expected on serverless environments like Vercel.');
    }
}

// Asset Upload setup (Photo, CV, Video)
const assetStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Fallback to /tmp which is writable on Vercel
        const dest = process.env.VERCEL ? '/tmp' : 'public/uploads/';
        cb(null, dest);
    },
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadAssets = multer({ storage: assetStorage });

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'nsl-secret'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Admin Middleware
function isAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect('/admin/login');
    }
}

// Mock Data (Initial)
let MOCK_DATA = [
    {
        id: "1",
        HoTen: 'John Doe',
        SoDienThoai: '0912345678',
        Diem1: '8.5',
        Diem2: '7.0',
        Total: '15.5',
        CMND: '079123456789',
        NgaySinh: '01/01/2000',
        DiaChi: 'Ho Chi Minh City, Vietnam',
        Email: 'johndoe@example.com',
        LinkCV: 'https://example.com/cv',
        LinkAnh: 'https://example.com/anh',
        LinkVideo: 'https://example.com/video',
        NgayNhap: '16/04/2026'
    }
];

// Microsoft Graph API Helpers
let accessToken = null;
let tokenExpiry = 0;
let cachedSiteId = null;

async function getAccessToken() {
    if (process.env.USE_MOCK_DATA === 'true') return "mock-token";
    const now = Date.now();
    if (accessToken && now < tokenExpiry) return accessToken;

    const { TENANT_ID, CLIENT_ID, CLIENT_SECRET } = process.env;
    const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('scope', 'https://graph.microsoft.com/.default');

    try {
        const response = await axios.post(url, params);
        accessToken = response.data.access_token;
        tokenExpiry = now + (response.data.expires_in * 1000) - 60000;
        return accessToken;
    } catch (error) {
        console.error('Error getting access token:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function getSiteId() {
    if (process.env.USE_MOCK_DATA === 'true') return "mock-site";
    if (cachedSiteId) return cachedSiteId;

    const token = await getAccessToken();
    const { SHAREPOINT_HOST, SHAREPOINT_SITE_PATH } = process.env;
    const url = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_HOST}:${SHAREPOINT_SITE_PATH}`;

    try {
        const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        cachedSiteId = response.data.id;
        return cachedSiteId;
    } catch (error) {
        console.error('Error getting site id:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Data Fetching and Mutation
async function getAllStudents() {
    if (process.env.USE_MOCK_DATA === 'true') {
        // Return only non-deleted by default for app compatibility, 
        // but we'll handle the filter in the routes.
        return MOCK_DATA;
    }
    try {
        const token = await getAccessToken();
        const siteId = await getSiteId();
        const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/HocSinh/items?expand=fields&$top=999`;
        const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        return response.data.value.map(item => ({ id: item.id, ...item.fields }));
    } catch (error) {
        console.error('Error fetching students:', error.message);
        return [];
    }
}

async function addStudent(data) {
    if (process.env.USE_MOCK_DATA === 'true') {
        const newStudent = { id: Date.now().toString(), ...data };
        MOCK_DATA.push(newStudent);
        return newStudent;
    }
    try {
        const token = await getAccessToken();
        const siteId = await getSiteId();
        const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/HocSinh/items`;
        const response = await axios.post(url, { fields: data }, { headers: { Authorization: `Bearer ${token}` } });
        return response.data;
    } catch (error) {
        console.error('Error adding student:', error.message);
        throw error;
    }
}

async function updateStudent(id, data) {
    if (process.env.USE_MOCK_DATA === 'true') {
        const index = MOCK_DATA.findIndex(s => s.id === id);
        if (index !== -1) {
            MOCK_DATA[index] = { ...MOCK_DATA[index], ...data };
            return MOCK_DATA[index];
        }
        return null;
    }
    try {
        const token = await getAccessToken();
        const siteId = await getSiteId();
        const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/HocSinh/items/${id}/fields`;
        const response = await axios.patch(url, data, { headers: { Authorization: `Bearer ${token}` } });
        return response.data;
    } catch (error) {
        console.error('Error updating student:', error.message);
        throw error;
    }
}

// Student Routes
app.get('/', (req, res) => res.render('login', { error: null }));
app.get('/login', (req, res) => res.redirect('/'));

app.post('/login', async (req, res) => {
    const { input } = req.body;
    if (!input) {
        return res.render('login', { error: 'Please enter your phone number or password.' });
    }

    const value = input.trim();

    // 1. Check Admin Password
    if (value === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        return res.redirect('/admin');
    }

    // 2. Check Student Phone
    const students = await getAllStudents();
    const student = students.find(s => s.SoDienThoai && s.SoDienThoai.toString().trim() === value);
    
    if (student) {
        req.session.student = student;
        return res.redirect('/profile');
    }

    // 3. Not found
    res.render('login', { error: 'Invalid login credentials.' });
});

app.get('/profile', (req, res) => {
    if (!req.session.student) return res.redirect('/');
    res.render('profile', { student: req.session.student });
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

// Admin Routes
app.get('/admin/login', (req, res) => res.redirect('/'));

app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    if (password && password.trim() === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.render('admin/login', { error: 'Sai mật khẩu.' });
    }
});

app.get('/admin/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

app.get('/admin', isAdmin, async (req, res) => {
    res.render('admin/dashboard');
});

app.get('/admin/students', isAdmin, async (req, res) => {
    let students = await getAllStudents();
    // Filter out deleted by default
    res.json(students.filter(s => s.isDeleted !== 'true' && s.isDeleted !== true));
});

app.get('/admin/trash', isAdmin, async (req, res) => {
    let students = await getAllStudents();
    res.json(students.filter(s => s.isDeleted === 'true' || s.isDeleted === true));
});

app.put('/admin/students/:id/delete', isAdmin, async (req, res) => {
    try {
        await updateStudent(req.params.id, { isDeleted: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/admin/students/:id/restore', isAdmin, async (req, res) => {
    try {
        await updateStudent(req.params.id, { isDeleted: false });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/admin/students/:id/permanent', isAdmin, async (req, res) => {
    try {
        if (process.env.USE_MOCK_DATA === 'true') {
            const idx = MOCK_DATA.findIndex(s => s.id === req.params.id);
            if (idx > -1) MOCK_DATA.splice(idx, 1);
        } else {
            const token = await getAccessToken();
            const siteId = await getSiteId();
            const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/HocSinh/items/${req.params.id}`;
            await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/admin/students', isAdmin, uploadAssets.fields([
    { name: 'photoFile', maxCount: 1 },
    { name: 'cvFile', maxCount: 1 },
    { name: 'videoFile', maxCount: 1 }
]), async (req, res) => {
    try {
        const studentData = { ...req.body };
        
        // Handle file paths
        if (req.files['photoFile']) studentData.LinkAnh = '/uploads/' + req.files['photoFile'][0].filename;
        if (req.files['cvFile']) studentData.LinkCV = '/uploads/' + req.files['cvFile'][0].filename;
        if (req.files['videoFile']) studentData.LinkVideo = '/uploads/' + req.files['videoFile'][0].filename;

        const student = await addStudent(studentData);
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/admin/students/:id', isAdmin, uploadAssets.fields([
    { name: 'photoFile', maxCount: 1 },
    { name: 'cvFile', maxCount: 1 },
    { name: 'videoFile', maxCount: 1 }
]), async (req, res) => {
    try {
        const studentData = { ...req.body };

        // Handle file paths
        if (req.files['photoFile']) studentData.LinkAnh = '/uploads/' + req.files['photoFile'][0].filename;
        if (req.files['cvFile']) studentData.LinkCV = '/uploads/' + req.files['cvFile'][0].filename;
        if (req.files['videoFile']) studentData.LinkVideo = '/uploads/' + req.files['videoFile'][0].filename;

        const student = await updateStudent(req.params.id, studentData);
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/admin/import', isAdmin, upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) throw new Error('No file uploaded');
        const content = fs.readFileSync(req.file.path, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(',');
            if (parts.length < 5) continue;

            const studentData = {
                HoTen: parts[0],
                SoDienThoai: parts[1],
                Diem1: parts[2],
                Diem2: parts[3],
                Total: parts[4],
                CMND: parts[5] || '',
                NgaySinh: parts[6] || '',
                DiaChi: parts[7] || '',
                Email: parts[8] || '',
                LinkCV: parts[9] || '',
                LinkAnh: parts[10] || '',
                LinkVideo: parts[11] || '',
                NgayNhap: new Date().toLocaleDateString('vi-VN')
            };
            await addStudent(studentData);
        }
        fs.unlinkSync(req.file.path);
        res.redirect('/admin');
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).send('Error importing CSV');
    }
});

app.get('/admin/sample-csv', isAdmin, (req, res) => {
    const header = "HoTen,SoDienThoai,Diem1,Diem2,Total,CMND,NgaySinh,DiaChi,Email,LinkCV,LinkAnh,LinkVideo\n";
    const example = "Nguyen Van B,0901234568,8.0,7.5,15.5,012345678,01/01/2001,Hanoi,b@test.com,http://cv.com,http://img.com,http://vid.com";
    res.setHeader('Content-disposition', 'attachment; filename=sample.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(header + example);
});

// Only start the server if running locally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
