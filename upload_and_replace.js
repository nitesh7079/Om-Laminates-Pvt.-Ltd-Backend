const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({ 
  cloud_name: 'ddpcospqm', 
  api_key: '884372597811671', 
  api_secret: 'bvLyLsXqriGIPjr46qqkNii5CFo' 
});

const publicImagesDir = path.join(__dirname, '../frontend/public/images');
const srcDir = path.join(__dirname, '../frontend/src');
const mapFile = path.join(__dirname, 'cloudinary_map.json');

let uploadMap = {};
if (fs.existsSync(mapFile)) {
  uploadMap = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
}

async function uploadImages(dir, relativePath = '/images') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = `${relativePath}/${entry.name}`;
    
    if (entry.isDirectory()) {
      await uploadImages(fullPath, relPath);
    } else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(entry.name)) {
      if (!uploadMap[relPath]) {
        console.log(`Uploading ${relPath}...`);
        try {
          const result = await cloudinary.uploader.upload(fullPath, {
            folder: 'om_veneer' + relativePath.replace('/images', ''),
            use_filename: true,
            unique_filename: false,
            overwrite: true
          });
          uploadMap[relPath] = result.secure_url;
          fs.writeFileSync(mapFile, JSON.stringify(uploadMap, null, 2));
        } catch (error) {
          console.error(`Failed to upload ${relPath}:`, error);
        }
      } else {
        // console.log(`Already uploaded: ${relPath}`);
      }
    }
  }
}

function replaceInFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      replaceInFiles(fullPath);
    } else if (/\.(js|jsx)$/i.test(entry.name)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const [localPath, cloudUrl] of Object.entries(uploadMap)) {
        // We replace exactly the string "localPath" with "cloudUrl"
        const regex = new RegExp(`"${localPath}"|'${localPath}'|\`${localPath}\``, 'g');
        const quoteAgnosticReplacement = content.replace(regex, (match) => {
          const quote = match[0];
          return `${quote}${cloudUrl}${quote}`;
        });
        
        if (content !== quoteAgnosticReplacement) {
          content = quoteAgnosticReplacement;
          changed = true;
        }

        // Also handle cases like src={`/images/goliya/${img}`} -> This is tricky to replace dynamically if they use template literals.
        // Let's check if there are template literals for images.
      }
      
      // Specifically fix template literal in HomePage.jsx
      if (content.includes('src={`/images/goliya/${img}`}') || content.includes('src={`/images/goliya/${img}`}')) {
        // We will just leave it if it's dynamic, OR we can replace the base URL.
        // But since we uploaded to cloudinary maintaining the same filename, we can change the template literal base.
        const baseUrlMatch = uploadMap['/images/goliya/IMG_6656.jpg'];
        if (baseUrlMatch) {
            const baseDirCloud = baseUrlMatch.substring(0, baseUrlMatch.lastIndexOf('/'));
            content = content.replace(/`\/images\/goliya\/\$\{img\}`/g, `\`${baseDirCloud}/\${img}\``);
            changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

async function run() {
  console.log('Starting uploads...');
  await uploadImages(publicImagesDir);
  console.log('Uploads complete. Starting replacement...');
  replaceInFiles(srcDir);
  console.log('Done!');
}

run();
