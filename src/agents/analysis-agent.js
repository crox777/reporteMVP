import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Cost control constants
const MAX_TOKENS = 1000;
const RETRY_LIMIT = 2;

export class AnalysisAgent {
  async analyzePDF(filePath) {
    let retries = 0;
    
    while (retries <= RETRY_LIMIT) {
      try {
        const fileContent = await fs.readFile(filePath);
        const mediaType = 'application/pdf';

        const response = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: MAX_TOKENS,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this report and provide: 1) A brief summary (max 2 paragraphs) 2) Key Performance Indicators or important numerical data (max 5 points) 3) A concise analysis of the main findings and implications (max 3 paragraphs).'
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: fileContent.toString('base64')
                }
              }
            ]
          }]
        });

        const analysis = response.content[0].text;
        const [summary, kpisSection, fullAnalysis] = analysis.split('\n\n');

        return {
          summary,
          kpis: this.extractKPIs(kpisSection),
          fullAnalysis
        };
      } catch (error) {
        retries++;
        if (retries > RETRY_LIMIT) {
          console.error('Error analyzing PDF after retries:', error);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
      }
    }
  }

  extractKPIs(kpisText) {
    return kpisText.split('\n')
      .filter(line => line.includes(':'))
      .map(line => {
        const [key, value] = line.split(':');
        return { key: key.trim(), value: value.trim() };
      })
      .slice(0, 5); // Ensure max 5 KPIs
  }
}