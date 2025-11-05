const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const apiKey = process.env.GOOGLE_API_KEY;
const testPhotoRef = 'AciIO2fvQ0qssED7VBXyxXt-lnACLpYv3O0e2zpEggBltQRVI2jMuLVqGj8ussKZWY8aBE67zaSh_NHkYehDDgAf5JFt4BMvE-mIfGLH7EwYqsauTi2WxaJIUHbwuwXYvOTXlsFgiElTO95z_r3iphWjWW7oH0U8gn5dLmouolr3f4TKM6_OcYkiDv7jpBQH6Gd_hAl6ZFk5SITwDwwl3fiG9V8FqsPumo2j9mCPYfiTo4l-61d1o9dlOd6-TzmryKRJdtwmeWw2Irk2PEKXMxRpA2uKmuD3s1KLMAom_Ao5eqM83Q';

console.log('Testing Google Places Photo API call...');
console.log(`API Key: ${apiKey.substring(0, 10)}...`);
console.log(`Photo Reference: ${testPhotoRef.substring(0, 20)}...`);

const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${testPhotoRef}&key=${apiKey}`;

console.log(`Full URL: ${photoUrl}`);

function downloadPhoto(url, filepath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      console.log(`Status: ${response.statusCode} for URL: ${url}`);

      if (response.statusCode === 302 && response.headers.location) {
        console.log('Following redirect to:', response.headers.location);
        return downloadPhoto(response.headers.location, filepath);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log('Image downloaded successfully to:', filepath);

        // Check file size
        const stats = fs.statSync(filepath);
        console.log(`Downloaded file size: ${stats.size} bytes`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Clean up empty file on error
      reject(err);
    });
  });
}

downloadPhoto(photoUrl, path.join(__dirname, 'images', 'test-photo.jpg'))
  .then(() => console.log('SUCCESS: Test completed!'))
  .catch((err) => console.error('FAILED:', err.message));
