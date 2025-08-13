import 'dotenv/config';
import cors from "cors";
import path from 'path';
import axios from 'axios';
import express from 'express';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import NepaliDate from 'nepali-date';
import moment from 'moment-timezone';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const serverStartTime = new Date();

app.use(express.json());
app.use(cors());

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON file:', err.message);
    throw new Error('Error reading JSON file');
  }
};

const getRandomElement = (array) => {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

const sendPrettyJson = (res, data) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data, null, 2));
};

app.use((req, res, next) => {
  const blockedFiles = ['/index.js'];
  if (blockedFiles.some(file => req.url.startsWith(file))) {
    return res.status(404).sendFile(path.join(__dirname, '404.html'));
  }
  next();
});

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

   res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'An error occurred, please try again!' });
  }
});


const badWords = ["subash", "baniya"];

app.get('/api/imagine', async (req, res) => {
  const prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).send("Please provide a prompt.");
  }

  const words = prompt.split(/[\s,]+/);
  const bannedWord = words.find(word => badWords.includes(word.toLowerCase()));
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
      num_outputs: '',
      num_inference_steps: '',
      controlnet_conditioning_scale: 0.5,
      guidance_scale: '5.5',
      scheduler: '',
      seed: ''
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
    res.status(500).send("Failed to generate the image. Please try again later.");
  }
});

app.get("/api/chat", async (req, res) => {
    const prompt = req.query.prompt;

    if (!prompt) {
        return res.status(400).json({ error: "The 'prompt' query parameter is required." });
    }

    try {
        const response = await axios.post(
            "https://api.deepinfra.com/v1/openai/chat/completions",
            {
                model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a friendly AI Assistant*, providing *short, human-like, and engaging* responses. Keep answers *concise and to the point* while being friendly and helpful.

                        - Stick to *related* topics only.  
                        - If a user asks *who you are*, reply: "I am an AI assistant designed to assist users effectively with their queries and tasks."
                        - **Be brief but informative**—avoid long explanations.  
                        - Use *simple, natural language* like a human conversation.
                        - Use clear, natural language, making responses feel like a human conversation.`
                    },
                    { role: "user", content: prompt }
                ],
                stream: false
            },
            {
                headers: {
                    "accept": "text/event-stream",
                    "content-type": "application/json",
                    "x-deepinfra-source": "web-embed",
                    "Referer": "https://deepinfra.com/"
                }
            }
        );
      res.setHeader('Content-Type', 'text/plain');
      res.send(JSON.stringify(response.data, null, 2));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});