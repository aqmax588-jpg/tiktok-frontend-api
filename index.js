const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
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
        'Referer': 'https://www.tiktok.com/'
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
    throw new Error('no avatar found');
  } catch (e) {
    console.error('抓取失败:', e.message);
    res.status(404).json({ error: 'failed' });
  }
});

app.listen(port, () => {
  console.log('✅ 子节点抓取服务运行正常');
});
