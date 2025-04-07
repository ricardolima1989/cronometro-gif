const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const GIFEncoder = require('gifencoder');
const { createCanvas, loadImage } = require('canvas');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

app.post('/api/gerar-gif', async (req, res) => {
  try {
    console.log("Recebendo frames do cliente...");
    const frames = req.body.frames;

    if (!frames || frames.length === 0) {
      console.error("Nenhum frame recebido.");
      return res.status(400).json({ error: "Nenhum frame recebido." });
    }

    const width = 200, height = 200;
    const encoder = new GIFEncoder(width, height);
    const fileName = `cronometro-${Date.now()}.gif`;
    const filePath = `public/gif/${fileName}`;
    const stream = fs.createWriteStream(filePath);

    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(1000);
    encoder.setQuality(10);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    for (const frame of frames) {
      const img = await loadImage(frame);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      encoder.addFrame(ctx);
    }

    encoder.finish();

    stream.on('finish', () => {
      console.log("GIF gerado com sucesso:", filePath);
      res.json({ url: `/gif/${fileName}` });
    });

  } catch (err) {
    console.error("Erro ao gerar GIF:", err);
    res.status(500).json({ error: 'Erro ao gerar GIF' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});