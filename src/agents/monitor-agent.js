import cheerio from 'cheerio';
import axios from 'axios';

export class MonitorAgent {
  async checkSource(source) {
    try {
      const response = await axios.get(source.url);
      const $ = cheerio.load(response.data);
      
      return $(source.selector)
        .map((_, el) => ({
          source: source.name,
          title: $(el).text().trim(),
          url: new URL($(el).attr('href'), source.url).toString()
        }))
        .get();
    } catch (error) {
      console.error(`Error checking source ${source.name}:`, error);
      return [];
    }
  }
}