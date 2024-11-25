import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export class DownloadAgent {
  async downloadReport(url, filename, maxSizeMB) {
    try {
      // First, make a HEAD request to check content length
      const head = await axios.head(url);
      const contentLength = head.headers['content-length'];
      
      if (contentLength && (parseInt(contentLength) > maxSizeMB * 1024 * 1024)) {
        throw new Error(`File size exceeds maximum limit of ${maxSizeMB}MB`);
      }

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        maxContentLength: maxSizeMB * 1024 * 1024
      });

      const downloadsDir = path.join(process.cwd(), 'downloads');
      await fs.mkdir(downloadsDir, { recursive: true });
      
      const filePath = path.join(downloadsDir, filename);
      await fs.writeFile(filePath, response.data);
      return filePath;
    } catch (error) {
      console.error(`Error downloading report: ${error}`);
      throw error;
    }
  }
}