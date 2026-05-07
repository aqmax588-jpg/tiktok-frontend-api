const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// 跨域保留原版，不改动
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => {
  res.send('✅ TikTok 提速优化版接口正常运行');
});

// 核心接口：原版抓取正则全部不动，只做网络层面提速优化
app.get('/get-avatar', async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'need username' });
  }

  try {
    const url = `https://www.tiktok.com/@${username}`;
    const { data } = await axios.get(url, {
      // 精简请求头，只保留必需，减少握手耗时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36'
      },
      timeout: 8000,     // 优化超时，没必要过长等待
      maxRedirects: 3,   // 限制重定向，去掉多余跳转加载
      decompress: true   // 开启压缩，减少页面传输体积、提速
    });

    // 【你原版原生正则 完全一字不改】
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

    throw new Error('no avatar');
  } catch (e) {
    res.status(404).json({ error: 'failed' });
  }
});

app.listen(port, () => {
  console.log('TikTok提速版接口运行成功');
});
