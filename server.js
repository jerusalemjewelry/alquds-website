const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
const { getCachedImage, setCachedImage } = require('./utils/cache');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Image Optimization Proxy Server is running!');
});

app.get('/optimize', async (req, res) => {
  const { url, w, q, format = 'webp' } = req.query;

  if (!url) {
    return res.status(400).send('Missing "url" parameter');
  }

  const width = w ? parseInt(w, 10) : undefined;
  const quality = q ? parseInt(q, 10) : 80;

  try {
    // 1. Check if we already have this specific combination cached
    const cachedImage = getCachedImage(url, width, format);
    
    if (cachedImage) {
      console.log(`[CACHE HIT] Serving ${url} from cache`);
      res.set('Content-Type', `image/${format}`);
      res.set('Cache-Control', 'public, max-age=31536000'); // Tell browser to cache for 1 year
      return res.send(cachedImage);
    }

    console.log(`[CACHE MISS] Fetching and optimizing ${url}`);

    // 2. Fetch the original image from the provided URL
    const response = await axios({
      url,
      responseType: 'arraybuffer', // Get the image as binary data
    });

    const originalBuffer = Buffer.from(response.data);

    // 3. Set up the Sharp instance for processing
    let sharpInstance = sharp(originalBuffer);

    // Resize if a width was provided
    if (width) {
      sharpInstance = sharpInstance.resize({ width });
    }

    // Convert to the desired format (e.g., WebP)
    if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    } else if (format === 'jpeg' || format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality });
    } else if (format === 'avif') {
      sharpInstance = sharpInstance.avif({ quality });
    }

    // 4. Perform the actual processing
    const optimizedBuffer = await sharpInstance.toBuffer();

    // 5. Save the result to our local disk cache
    setCachedImage(url, width, format, optimizedBuffer);

    // 6. Send the optimized image back to the user
    res.set('Content-Type', `image/${format}`);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(optimizedBuffer);

  } catch (error) {
    console.error(`[ERROR] Failed to optimize image:`, error.message);
    res.status(500).send('Error processing the image.');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Image Optimization Server running on http://localhost:${PORT}`);
  console.log(`Test example: http://localhost:${PORT}/optimize?url=https://images.unsplash.com/photo-1502899576159-f224dc2349fa&w=400`);
});
