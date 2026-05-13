export const getDirectImageUrl = (url) => {
  if (!url) return '';
  
  // LOG UNTUK DEBUG
  console.log("LOG: Mengecek URL ->", url);

  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
    const fileId = match ? (match[1] || match[2]) : null;
    
    if (fileId) {
      const newUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      console.log("LOG: Berhasil dikonversi ->", newUrl);
      return newUrl;
    }
  }
  
  return url;
};