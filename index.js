const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => {
  res.send('✅ 子节点服务正常运行');
});

app.get('/get-avatar', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'need username' });

  try {
    const { data } = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': 'https://www.tiktok.com/',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const avatarMatch = data.match(/"avatarThumb":"(.*?)"/);
    const nicknameMatch = data.match(/"nickname":"(.*?)"/);
    const uniqueIdMatch = data.match(/"uniqueId":"(.*?)"/);
    const followers = data.match(/"followerCount":(\d+)/)?.[1] || 0;
    const following = data.match(/"followingCount":(\d+)/)?.[1] || 0;
    const videos = data.match(/"videoCount":(\d+)/)?.[1] || 0;

    if (avatarMatch && avatarMatch[1]) {
      return res.json({
        success: true,
        uniqueId: uniqueIdMatch ? uniqueIdMatch[1] : username,
        nickname: nicknameMatch ? nicknameMatch[1] : username,
        avatarUrl: avatarMatch[1].replace(/\\/g, ''),
        followerCount: Number(followers),
        followingCount: Number(following),
        videoCount: Number(videos)
      });
    }
    throw new Error('no avatar');
  } catch (e) {
    console.error('error:', e.message);
    res.status(404).json({ error: 'failed' });
  }
});

app.listen(port, () => console.log('✅ 子节点服务运行正常'));
