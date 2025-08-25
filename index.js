import 'dotenv/config';
import cors from "cors";
import path from 'path';
import axios from 'axios';
import express from 'express';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import NepaliDate from 'nepali-date';
import moment from 'moment-timezone';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const serverStartTime = new Date();

app.use(express.json());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "*"
}));

app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/ai', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ai.html'));
});

const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON file:', err.message);
    return [];
  }
};

const getRandomElement = (array) => {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

app.get('/api', async (req, res) => {
  try {
    const now = moment.tz('Asia/Kathmandu');
    const neTime = now.format('hh:mm:ss A');
    const adDateStr = now.format('dddd, MMMM DD, YYYY');

    const kathmanduDate = now.toDate();
    const nepaliDateInstance = new NepaliDate(kathmanduDate);
    const bsDateStr = nepaliDateInstance.format('dddd, MMMM DD, YYYY');

    const filePath = path.join(__dirname, 'quotes_db.json');
    const quotes = await readJsonFile(filePath);

    if (!quotes || quotes.length === 0) {
      return res.status(500).json({ error: 'No quotes found in database' });
    }

    const randomQuote = getRandomElement(quotes);

    const response = [
      {
        quote: randomQuote.quote,
        character: randomQuote.character,
        anime: randomQuote.anime,
      },
      {
        date: {
          ad: adDateStr,
          bs: bsDateStr,
          nst: neTime,
        },
      },
      {
        api: {
          ai: "/api/chat?prompt=your_prompt",
          t2i: "/api/imagine?prompt=your_prompt",
        },
      },
      {
        social: {
          github: "https://github.com/subashbaniyaa",
          tiktok: "https://tiktok.com/@subashbaniyaa",
          facebook: "https://facebook.com/subashbaniyaa",
          instagram: "https://instagram.com/subashbaniyaa",
        },
      },
    ];

    res.json(response);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: process.env.NODE_ENV === "development"
        ? error.message
        : "Internal Server Error"
    });
  }
});

// ✅ Improved bad words check
const badWords = ["subash", "baniya"];

app.get('/api/imagine', async (req, res) => {
  const prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).send("Please provide a prompt.");
  }

  const bannedWord = badWords.find(bw =>
    new RegExp(`\\b${bw}\\b`, "i").test(prompt)
  );

  if (bannedWord) {
    return res.status(400).send(`Sorry, but you are not allowed to use the word "${bannedWord}".`);
  }

  const baseURL = 'https://api.creartai.com/api/v1/text2image';

  const options = {
    method: 'POST',
    url: baseURL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: new URLSearchParams({
      prompt: prompt,
      negative_prompt: ',malformed hands,malformed fingers,malformed faces,malformed body parts,mutated body parts,malfromed eyes,mutated fingers,mutated hands,realistic,worst quality, low quality, blurry, pixelated, extra limb, extra fingers, bad hand, text, name, letters, out of frame, lowres, text, error, cropped, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username,',
      aspect_ratio: '3x3',
      controlnet_conditioning_scale: 0.5,
      guidance_scale: '5.5',
    })
  };

  try {
    const response = await axios(options);
    const imageData = response.data.image_base64;
    const imageBuffer = Buffer.from(imageData, 'base64');

    res.set('Content-Type', 'image/jpeg');
    res.send(imageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: process.env.NODE_ENV === "development"
        ? error.message
        : "Failed to generate the image. Please try again later."
    });
  }
});

app.get("/api/chat", async (req, res) => {
  const prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).json({
      error: "The 'prompt' query parameter is required."
    });
  }

  try {
    const response = await axios.post(
      "https://api.deepinfra.com/v1/openai/chat/completions",
      {
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages: [
          {
            role: "system",
            content: `You are a friendly AI Assistant, providing short, human-like, and engaging responses.`
          },
          { role: "user", content: prompt }
        ],
        stream: false
      },
      {
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "x-deepinfra-source": "web-embed",
          "Referer": "https://deepinfra.com/"
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: process.env.NODE_ENV === "development"
        ? error.message
        : "Chat request failed"
    });
  }
});

app.use((req, res, next) => {
  const blocked = [
    '/index.js',
    '/server.js',
    '/.env',
    '/package.json',
    '/package-lock.json',
    '/node_modules',
  ];

  if (blocked.some(f => req.url.startsWith(f))) {
    return res.status(404).sendFile(
      path.join(__dirname, 'public', '404.html'),
      (err) => {
        if (err) res.status(404).send("404 - Not Found");
      }
    );
  }

  next();
});

app.use((req, res) => {
  res.status(404).sendFile(
    path.join(__dirname, 'public', '404.html'),
    (err) => {
      if (err) res.status(404).send("404 - Not Found");
    }
  );
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
