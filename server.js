const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

app.post('/automacao', async (req, res) => {
  const { inviteLink, email, password, executions } = req.body;
  
  if (!inviteLink || !email || !password || !executions) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const results = [];
  
  for (let i = 0; i < executions; i++) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      const page = await browser.newPage();
      await page.goto(inviteLink, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Login
      await page.type('input[type="email"], input[name="email"]', email);
      await page.type('input[type="password"], input[name="password"]', password);
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Entrar")');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Duplo clique no botão Publish
      const publishBtn = await page.$('button:has-text("Publish"), button:has-text("Publicar")');
      if (publishBtn) {
        await publishBtn.click();
        await new Promise(r => setTimeout(r, 2000));
        await publishBtn.click();
      }
      
      results.push({ execution: i + 1, status: 'success' });
    } catch (error) {
      results.push({ execution: i + 1, status: 'error', message: error.message });
    } finally {
      if (browser) await browser.close();
    }
  }
  
  res.json({ success: true, results });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
