const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// 跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => {
  res.send('✅ 子节点服务正常运行');
});

// 优化后的抓取接口，解决风控和超时
app.get('/get-avatar', async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'need username' });
  }

  try {
    const url = `https://www.tiktok.com/@${username}`;
    const { data } = await axios.get(url, {
      headers: {
        // 用最新版Chrome UA，降低被风控概率
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      },
      timeout: 10000, // 延长超时到10秒，避免网络波动失败
      maxRedirects: 5,
      decompress: true
    });

    // 正则匹配逻辑完全不变，只优化请求部分
    const avatarMatch = data.match(/"avatarThumb":"(.*?)"/);
    const nicknameMatch = data.match(/"nickname":"(.*?)"/);
    const uniqueIdMatch = data.match(/"uniqueId":"(.*?)"/);
    const followers = data.match(/"followerCount":(\d+)/)?.[1] || 0;
    const following = data.match(/"followingCount":(\d+)/)?.[1] || 0;
    const videos = data.match(/"videoCount":(\d+)/)?.[1] || 0;

    if (avatarMatch && avatarMatch[1]) {
      let avatar = avatarMatch[1].replace(/\\u002F/g, '/').replace(/\\/g, '');

      return res.json({
        success: true,
        uniqueId: uniqueIdMatch ? uniqueIdMatch[1] : username,
        nickname: nicknameMatch ? nicknameMatch[1] : username,
        avatarUrl: avatar,
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
