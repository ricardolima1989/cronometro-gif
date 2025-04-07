// server.js
const express   = require('express');
const bodyParser = require('body-parser');
const fs        = require('fs');
const GIFEncoder = require('gifencoder');
const { createCanvas, loadImage } = require('canvas');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

/* ========= ROTA PRINCIPAL ========= */
app.post('/api/gerar-gif', async (req, res) => {
  try {
    const frames = req.body.frames;
    if (!frames?.length) return res.status(400).json({ error: 'Nenhum frame recebido.' });

    /* --- pega a resolução real dos frames --- */
    const img0   = await loadImage(frames[0]);
    const width  = img0.width;   // ex.: 1500
    const height = img0.height;  // ex.: 1500

    /* --- configura encoder no mesmo tamanho --- */
    const encoder   = new GIFEncoder(width, height);
    const fileName  = `cronometro-${Date.now()}.gif`;
    const filePath  = `public/gif/${fileName}`;
    const outStream = fs.createWriteStream(filePath);

    encoder.createReadStream().pipe(outStream);
    encoder.start();
    encoder.setRepeat(0);      // loop infinito
    encoder.setDelay(1000);    // 1 fps
    encoder.setQuality(1);     // 1‑30 (1 = melhor)

    /* --- canvas buffer --- */
    const canvas = createCanvas(width, height);
    const ctx    = canvas.getContext('2d');

    /* primeiro frame já carregado */
    ctx.drawImage(img0, 0, 0, width, height);
    encoder.addFrame(ctx);

    /* demais frames */
    for (let i = 1; i < frames.length; i++) {
      const img = await loadImage(frames[i]);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      encoder.addFrame(ctx);
    }

    encoder.finish();

    outStream.on('finish', () => res.json({ url: `/gif/${fileName}` }));

  } catch (err) {
    console.error('Erro ao gerar GIF:', err);
    res.status(500).json({ error: 'Erro ao gerar GIF' });
  }
});
/* =================================== */

app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
