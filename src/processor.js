import { MonitorAgent } from './agents/monitor-agent.js';
import { DownloadAgent } from './agents/download-agent.js';
import { AnalysisAgent } from './agents/analysis-agent.js';
import { sources } from './sources.js';
import { isReportProcessed, saveReport, saveAnalysis } from './database.js';

const monitorAgent = new MonitorAgent();
const downloadAgent = new DownloadAgent();
const analysisAgent = new AnalysisAgent();

// Cost control limits
const MAX_REPORTS_PER_RUN = 5; // Limit reports per run
const MAX_FILE_SIZE_MB = 10; // Max PDF size in MB

export async function processReports() {
  const newReports = [];
  let processedCount = 0;

  // Monitor sources for new reports
  for (const source of sources) {
    if (processedCount >= MAX_REPORTS_PER_RUN) {
      console.log('Reached maximum reports limit for this run');
      break;
    }

    const reports = await monitorAgent.checkSource(source);
    
    for (const report of reports) {
      if (processedCount >= MAX_REPORTS_PER_RUN) break;
      
      if (!await isReportProcessed(report.url)) {
        const filename = `${source.name}-${Date.now()}.pdf`;
        try {
          // Download and check file size
          const filePath = await downloadAgent.downloadReport(report.url, filename, MAX_FILE_SIZE_MB);
          report.filePath = filePath;
          
          // Save report to database
          const result = await saveReport(report);
          const reportWithId = { ...report, id: result.lastInsertRowid };
          
          // Analyze the report
          const analysis = await analysisAgent.analyzePDF(filePath);
          await saveAnalysis(reportWithId.id, analysis);
          
          newReports.push({ report: reportWithId, analysis });
          processedCount++;
        } catch (error) {
          console.error(`Error processing report ${report.title}:`, error);
        }
      }
    }
  }

  return newReports;
}