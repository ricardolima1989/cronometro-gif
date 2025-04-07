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

    // Marca o tempo de início para medir quanto tempo a geração leva
    const startTime = Date.now();

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
    encoder.setRepeat(-1);            // loop infinito
    encoder.setDelay(1000 / 20);      // 250ms por frame (4 FPS)
    encoder.setQuality(100);           // 1‑30 (1 = melhor)
	encoder.setTransparent(0x00FF00);

    /* --- canvas buffer --- */
    const canvas = createCanvas(width, height);
    const ctx    = canvas.getContext('2d');

	// Pinta o fundo com a cor que será usada como "transparente"
	ctx.fillStyle = '#00FF00';
	ctx.fillRect(0, 0, width, height);

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

    // Quando a escrita do arquivo terminar, calcula o tempo gasto e envia a resposta
    outStream.on('finish', () => {
      const elapsed = Date.now() - startTime; // tempo gasto em milissegundos
      res.json({ url: `/gif/${fileName}`, estimatedTime: elapsed });
    });

  } catch (err) {
    console.error('Erro ao gerar GIF:', err);
    res.status(500).json({ error: 'Erro ao gerar GIF' });
  }
});
/* =================================== */

app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`);
);