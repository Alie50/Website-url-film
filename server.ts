import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { MediaItem, ShareToken } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'data.json');

app.use(express.json());

// Initialize Database with sample data if it doesn't exist
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      items: [
        {
          id: 'movie-sintel',
          type: 'movie',
          title: 'فيلم سينتل (Sintel)',
          description: 'فيلم رسوم متحركة مفتوح المصدر وثلاثي الأبعاد حائز على جوائز عالمية. يروي قصة فتاة تبحث عن تنينها الصغير المفقود.',
          posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
          videoType: 'direct',
          createdAt: new Date().toISOString()
        },
        {
          id: 'movie-big-buck-bunny',
          type: 'movie',
          title: 'فيلم الأرنب الضخم (Big Buck Bunny)',
          description: 'مغامرة كوميدية كرتونية ممتعة للأرنب الضخم اللطيف وهو يواجه السناجب المشاغبة في الغابة.',
          posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          videoType: 'direct',
          createdAt: new Date().toISOString()
        },
        {
          id: 'series-tears-of-steel',
          type: 'series',
          title: 'مسلسل خيال علمي: دموع من فولاذ (Tears of Steel)',
          description: 'مسلسل خيال علمي قصير يستكشف مستقبلًا بائسًا تدور أحداثه في مدينة أمستردام المستقبلية مع مقاتلين آليين عملاقين.',
          posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
          episodes: [
            {
              id: 'ep-tos-1',
              episodeNumber: 1,
              seasonNumber: 1,
              title: 'الحلقة الأولى: البداية الصادمة',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
              videoType: 'direct',
              createdAt: new Date().toISOString()
            },
            {
              id: 'ep-tos-2',
              episodeNumber: 2,
              seasonNumber: 1,
              title: 'الحلقة الثانية: هجوم الروبوتات العملاقة',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback.mp4',
              videoType: 'direct',
              createdAt: new Date().toISOString()
            }
          ]
        }
      ] as MediaItem[],
      tokens: [] as ShareToken[]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

initDb();

// Read Database Helper
function readDb(): { items: MediaItem[]; tokens: ShareToken[] } {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return { items: [], tokens: [] };
  }
}

// Write Database Helper
function writeDb(data: { items: MediaItem[]; tokens: ShareToken[] }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing database file:', error);
  }
}

// Security headers for index avoidance
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  next();
});

// robots.txt route to explicitly prevent indexing
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

// Middlewares for admin authentication
const getAdminPassword = () => process.env.ADMIN_PASSWORD || 'admin123';

function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'] || '';
  const password = authHeader.replace('Bearer ', '').trim();
  
  if (password === getAdminPassword()) {
    next();
  } else {
    res.status(401).json({ error: 'غير مصرح به: كلمة مرور غير صحيحة' });
  }
}

// --- API ENDPOINTS ---

// Check if admin password is configured or valid
app.post('/api/auth/verify', (req, res) => {
  const { password } = req.body;
  if (password === getAdminPassword()) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
  }
});

// Watch secure link endpoint (NO AUTH REQUIRED!)
app.get('/api/watch/:tokenId', (req, res) => {
  const { tokenId } = req.params;
  const db = readDb();
  
  const tokenIndex = db.tokens.findIndex(t => t.id === tokenId);
  if (tokenIndex === -1) {
    return res.status(404).json({ valid: false, error: 'عذراً، الرابط غير موجود أو تم حذفه.' });
  }
  
  const token = db.tokens[tokenIndex];
  
  // Validation checks
  if (!token.isActive) {
    return res.status(403).json({ valid: false, error: 'عذراً، هذا الرابط غير نشط حالياً.' });
  }
  
  if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
    return res.status(403).json({ valid: false, error: 'عذراً، انتهت صلاحية هذا الرابط.' });
  }
  
  if (token.maxViews !== null && token.views >= token.maxViews) {
    return res.status(403).json({ valid: false, error: 'عذراً، وصل هذا الرابط للحد الأقصى من عدد المشاهدات المسموح بها.' });
  }
  
  // Find item
  const item = db.items.find(i => i.id === token.itemId);
  if (!item) {
    return res.status(404).json({ valid: false, error: 'عذراً، المادة المطلوبة لم تعد متوفرة.' });
  }
  
  // Find episode if specified
  let episode;
  if (token.episodeId && item.episodes) {
    episode = item.episodes.find(e => e.id === token.episodeId);
    if (!episode) {
      return res.status(404).json({ valid: false, error: 'عذراً، الحلقة المطلوبة لم تعد متوفرة.' });
    }
  }
  
  // Increment view counter and save
  token.views += 1;
  db.tokens[tokenIndex] = token;
  writeDb(db);
  
  // Return secure subset (hide secrets or other system info)
  res.json({
    valid: true,
    token: {
      id: token.id,
      title: token.title,
      views: token.views,
      maxViews: token.maxViews,
      expiresAt: token.expiresAt
    },
    item: {
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      posterUrl: item.posterUrl,
      // Include video only if it is a movie (or fallback)
      videoUrl: item.type === 'movie' ? item.videoUrl : undefined,
      videoType: item.type === 'movie' ? item.videoType : undefined,
    },
    episode: episode ? {
      id: episode.id,
      episodeNumber: episode.episodeNumber,
      seasonNumber: episode.seasonNumber,
      title: episode.title,
      videoUrl: episode.videoUrl,
      videoType: episode.videoType
    } : undefined
  });
});

// --- ADMIN ONLY ENDPOINTS ---

// Get all movies and series
app.get('/api/items', checkAdminAuth, (req, res) => {
  const db = readDb();
  res.json(db.items);
});

// Add a movie or series
app.post('/api/items', checkAdminAuth, (req, res) => {
  const newItem: MediaItem = req.body;
  
  if (!newItem.title || !newItem.type) {
    return res.status(400).json({ error: 'العنوان والنوع مطلوبان' });
  }
  
  newItem.id = newItem.id || `${newItem.type}-${Date.now()}`;
  newItem.createdAt = new Date().toISOString();
  
  if (newItem.type === 'series') {
    newItem.episodes = newItem.episodes || [];
    newItem.episodes.forEach(ep => {
      ep.id = ep.id || `ep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      ep.createdAt = ep.createdAt || new Date().toISOString();
    });
  }
  
  const db = readDb();
  db.items.unshift(newItem);
  writeDb(db);
  
  res.status(201).json(newItem);
});

// Edit a movie or series
app.put('/api/items/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  const updatedItem: MediaItem = req.body;
  const db = readDb();
  
  const index = db.items.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'المادة غير موجودة' });
  }
  
  // Keep creation date and ensure episodes have ids
  updatedItem.id = id;
  updatedItem.createdAt = db.items[index].createdAt;
  
  if (updatedItem.type === 'series' && updatedItem.episodes) {
    updatedItem.episodes.forEach((ep, epIndex) => {
      ep.id = ep.id || `ep-${Date.now()}-${epIndex}-${Math.floor(Math.random() * 1000)}`;
      ep.createdAt = ep.createdAt || new Date().toISOString();
    });
  }
  
  db.items[index] = updatedItem;
  writeDb(db);
  
  res.json(updatedItem);
});

// Delete a movie or series
app.delete('/api/items/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const index = db.items.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'المادة غير موجودة' });
  }
  
  db.items.splice(index, 1);
  
  // Also clean up associated tokens
  db.tokens = db.tokens.filter(t => t.itemId !== id);
  
  writeDb(db);
  res.json({ success: true, message: 'تم الحذف بنجاح' });
});

// Get all tokens
app.get('/api/tokens', checkAdminAuth, (req, res) => {
  const db = readDb();
  res.json(db.tokens);
});

// Create a sharing token (Unique Link)
app.post('/api/tokens', checkAdminAuth, (req, res) => {
  const { itemId, episodeId, title, expiresHours, maxViews } = req.body;
  const db = readDb();
  
  const item = db.items.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'المادة المحددة غير موجودة' });
  }
  
  // Generate high-entropy unique key
  const randomChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let tokenId = '';
  for (let i = 0; i < 24; i++) {
    tokenId += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  
  let expiresAt: string | null = null;
  if (expiresHours && Number(expiresHours) > 0) {
    const date = new Date();
    date.setHours(date.getHours() + Number(expiresHours));
    expiresAt = date.toISOString();
  }
  
  const newToken: ShareToken = {
    id: tokenId,
    itemId,
    episodeId: episodeId || undefined,
    title: title || `${item.title}${episodeId ? ' - حلقة محددة' : ''}`,
    createdAt: new Date().toISOString(),
    expiresAt,
    views: 0,
    maxViews: maxViews && Number(maxViews) > 0 ? Number(maxViews) : null,
    isActive: true
  };
  
  db.tokens.unshift(newToken);
  writeDb(db);
  
  res.status(201).json(newToken);
});

// Toggle token active state
app.post('/api/tokens/:id/toggle', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const index = db.tokens.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'الرابط غير موجود' });
  }
  
  db.tokens[index].isActive = !db.tokens[index].isActive;
  writeDb(db);
  
  res.json(db.tokens[index]);
});

// Delete sharing token
app.delete('/api/tokens/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const index = db.tokens.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'الرابط غير موجود' });
  }
  
  db.tokens.splice(index, 1);
  writeDb(db);
  
  res.json({ success: true, message: 'تم حذف الرابط بنجاح' });
});

// Dashboard stats endpoint
app.get('/api/stats', checkAdminAuth, (req, res) => {
  const db = readDb();
  const totalItems = db.items.length;
  const totalTokens = db.tokens.length;
  const totalViews = db.tokens.reduce((acc, curr) => acc + curr.views, 0);
  
  res.json({
    totalItems,
    totalTokens,
    totalViews
  });
});

// --- VITE DEV AND PROD MIDDLEWARE SETUP ---

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} with local storage initialized.`);
  });
}

start();
