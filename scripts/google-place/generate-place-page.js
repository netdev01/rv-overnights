// Node.js Script to Generate Google Places HTML Page
// Usage: node generate-place-page.js [address_or_place_id]

const fs = require('fs');
const https = require('https');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Default values - change these constants as needed
const DEFAULT_ADDRESS = "Oak Tree Community Church";
const DEFAULT_PLACE_ID = "ChIJPWIBFSvHuFQRUUA5gzJ0nK8";

const googleApiKey = process.env.GOOGLE_API_KEY;
if (!googleApiKey) {
  console.error('GOOGLE_API_KEY not found in .env file');
  process.exit(1);
}

// Get input: either address or place_id, or use defaults
const inputArg = process.argv[2];

// Determine which input to use (prioritize PLACE_ID if both exist)
const input = inputArg || (DEFAULT_PLACE_ID ? DEFAULT_PLACE_ID : DEFAULT_ADDRESS);

console.log('=== Google Places HTML Generator ===');
console.log(`Default Address: ${DEFAULT_ADDRESS}`);
console.log(`Default Place ID: ${DEFAULT_PLACE_ID}`);
console.log(`Using input: ${input} ${inputArg ? '(from command line)' : '(default value)'}`);
console.log('=====================================');

// Function to make API requests
function makeApiRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 'OK') {
            resolve(result);
          } else {
            reject(new Error(`API Error: ${result.status} - ${result.error_message || 'Unknown error'}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Function to get place details from address or place_id
async function getPlaceDetails(input) {
  // Check if input is a place_id (starts with 'ChIJ')
  if (input.startsWith('ChIJ')) {
    console.log('Input looks like a place_id, fetching place details...');
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(input)}&key=${googleApiKey}`;
    const result = await makeApiRequest(url);
    return result.result;
  } else {
    console.log('Input looks like an address, searching for places...');
    // First find the place_id from address
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(input)}&inputtype=textquery&fields=place_id&key=${googleApiKey}`;
    const searchResult = await makeApiRequest(searchUrl);

    if (!searchResult.candidates || searchResult.candidates.length === 0) {
      throw new Error('No places found for the given address');
    }

    const placeId = searchResult.candidates[0].place_id;
    console.log(`Found place_id: ${placeId}, fetching details...`);

    // Now get the place details
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googleApiKey}`;
    const detailsResult = await makeApiRequest(detailsUrl);
    return detailsResult.result;
  }
}

async function run() {
  // Main execution - get place details from API
  const placeResult = await getPlaceDetails(input);

  // Extract photo references and construct Google Photos API URLs
  const photos = placeResult.photos || [];

  console.log(`Found ${photos.length} photos in place details`);

  // Create images directory if it doesn't exist
  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
  }

  // Function to download image using Google Photos API with redirect handling
  function downloadImage(photoRef, filename, maxWidth = 800) {
    return new Promise((resolve, reject) => {
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${googleApiKey}`;
      const filepath = path.join(imagesDir, filename);

      console.log(`Downloading photo: ${photoUrl}`);

      function downloadToFile(url, outputPath) {
        https.get(url, (response) => {
          if (response.statusCode === 302 && response.headers.location) {
            console.log(`Following redirect to: ${response.headers.location}`);
            return downloadToFile(response.headers.location, outputPath);
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download: ${response.statusCode}`));
            return;
          }

          const fileStream = fs.createWriteStream(outputPath);
          response.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close();
            resolve(filepath);
          });
        }).on('error', (err) => {
          fs.unlink(filepath, () => {}); // Delete the file on error
          reject(err);
        });
      }

      downloadToFile(photoUrl, filepath);
    });
  }

  // Generate HTML content
  function generateHTML(place, photos) {
    const formattedAddress = place.formatted_address;
    const name = place.name;
    const placeId = place.place_id;
    const phone = place.formatted_phone_number || '';
    const website = place.website || '';
    const rating = place.rating || 'N/A';
    const priceLevel = place.price_level || '';
    const types = place.types ? place.types.join(', ') : '';
    const businessStatus = place.business_status;
    const openingHours = place.opening_hours ? place.opening_hours.weekday_text.join('<br>') : '';

    // Format reviews
    const reviews = place.reviews ? place.reviews.slice(0, 3) : []; // Show first 3 reviews
    const reviewsHTML = reviews.map(review => `
      <div class="review">
        <h4>${review.author_name}</h4>
        <div class="rating">Rating: ${review.rating}⭐</div>
        <p>"${review.text}"</p>
        <small>${review.relative_time_description}</small>
      </div>
    `).join('');

    // Generate photo gallery using local image paths
    const photosHTML = photos.map((photoPath, index) => {
      return `<img src="${photoPath}" alt="Photo ${index + 1}" class="place-image" onerror="this.style.display='none'">`;
    }).join('');

    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${name} - Place Details</title>
      <style>
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f8f9fa;
              color: #333;
          }
          .container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              overflow: hidden;
          }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .place-id {
            font-size: 0.9em;
            margin-top: 15px;
            opacity: 0.9;
            font-family: monospace;
            padding: 8px 16px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            display: inline-block;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .content {
            padding: 30px;
        }
        .info-section {
            margin-bottom: 30px;
            padding: 20px;
            border-left: 4px solid #667eea;
            background-color: #f8f9fa;
        }
        .info-section h2 {
            color: #667eea;
            margin-top: 0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            display: flex;
            flex-direction: column;
        }
        .info-item label {
            font-weight: bold;
            margin-bottom: 5px;
            color: #555;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .place-image {
            width: 100%;
            height: 250px;
            object-fit: cover;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .place-image:hover {
            transform: scale(1.05);
        }
        .reviews-section {
            margin-top: 40px;
        }
        .review {
            border: 1px solid #e0e6ed;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #fafbfc;
        }
        .review .rating {
            color: #ffa500;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .address {
            font-size: 1.1em;
            margin: 10px 0;
        }
        .phone, .website {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
        }
        .phone:hover, .website:hover {
            text-decoration: underline;
        }
        .status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.9em;
        }
        .status.operational {
            background-color: #d4edda;
            color: #155724;
        }
    </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>${name}</h1>
              <div class="address">${formattedAddress}</div>
              <div class="place-id">${placeId}</div>
              <div class="status operational">${businessStatus}</div>
          </div>

          <div class="content">
              <div class="info-section">
                  <h2>Place Information</h2>
                  <div class="info-grid">
                      <div class="info-item">
                          <label>Phone:</label>
                          <span>${phone ? `<a href="tel:${phone}" class="phone">${phone}</a>` : 'Not available'}</span>
                      </div>
                      <div class="info-item">
                          <label>Website:</label>
                          <span>${website ? `<a href="${website}" class="website" target="_blank">${website}</a>` : 'Not available'}</span>
                      </div>
                      <div class="info-item">
                          <label>Rating:</label>
                          <span>${rating}⭐ (${place.user_ratings_total || 0} reviews)</span>
                      </div>
                      <div class="info-item">
                          <label>Types:</label>
                          <span>${types}</span>
                      </div>
                  </div>
              </div>

              ${openingHours ? `
              <div class="info-section">
                  <h2>Opening Hours</h2>
                  <div>${openingHours}</div>
              </div>
              ` : ''}

              ${place.description ? `
              <div class="info-section">
                  <h2>Description</h2>
                  <p>${place.description}</p>
              </div>
              ` : ''}

              <div class="info-section">
                  <h2>Photo Gallery</h2>
                  <div class="gallery">
                      ${photosHTML}
                  </div>
              </div>

              ${reviewsHTML ? `
              <div class="reviews-section">
                  <h2>Recent Reviews</h2>
                  ${reviewsHTML}
              </div>
              ` : ''}
          </div>
      </div>

      <script>
          // Handle image loading errors
          document.querySelectorAll('.place-image').forEach(img => {
              img.addEventListener('error', function() {
                  this.style.display = 'none';
                  console.log('Image failed to load:', this.src);
              });
          });
      </script>
  </body>
  </html>`;
  }

  console.log('Downloading images from Google Photos API to local images folder...');

  // Download all images using photo references from Google Places API
  const sanitizedLocationName = placeResult.name.replace(/\s+/g, '_').replace(/[\/\\:*?"<>|,]/g, '_').replace(/_+/g, '_').toLowerCase();
  const downloadedImages = [];
  for (let i = 0; i < photos.length; i++) {
    const photoRef = photos[i].photo_reference;
    const filename = `${sanitizedLocationName}_photo_${i + 1}.jpg`;

    try {
      console.log(`Downloading image ${i + 1}/${photos.length}: ${filename}`);
      await downloadImage(photoRef, filename);
      downloadedImages.push({
        filename: filename,
        photoRef: photoRef
      });
    } catch (error) {
      console.error(`Failed to download ${filename}:`, error.message);
    }
  }

  console.log(`Downloaded ${downloadedImages.length} images to images/ folder`);

  // Generate HTML using local image paths
  const localImagePaths = downloadedImages.map(img => `images/${img.filename}`);

  // Update filename to include location name
  const locationName = placeResult.name.replace(/\s+/g, '_').replace(/[\/\\:*?"<>|,]/g, '_').replace(/_+/g, '_').toLowerCase();
  const htmlFilename = `place-details_${locationName}.html`;

  const htmlContent = generateHTML(placeResult, localImagePaths);

  fs.writeFileSync(htmlFilename, htmlContent);

  console.log(`Place details HTML page generated: ${htmlFilename}`);

  process.exit(0);
}

run().catch(console.error);
