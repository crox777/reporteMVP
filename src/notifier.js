import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function formatAnalysis(analyses) {
  let emailContent = '<h1>New Report Analysis Digest</h1>';

  for (const { report, analysis } of analyses) {
    emailContent += `
      <h2>${report.title}</h2>
      <p><strong>Source:</strong> ${report.source}</p>
      <h3>Summary</h3>
      <p>${analysis.summary}</p>
      <h3>Key Findings</h3>
      <ul>
        ${analysis.kpis.map(kpi => `<li><strong>${kpi.key}:</strong> ${kpi.value}</li>`).join('')}
      </ul>
      <h3>Detailed Analysis</h3>
      <p>${analysis.fullAnalysis}</p>
      <hr>
    `;
  }

  return emailContent;
}

export async function sendDigest(analyses) {
  if (analyses.length === 0) return;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `Report Analysis Digest - ${new Date().toLocaleDateString()}`,
    html: formatAnalysis(analyses)
  };

  await transporter.sendMail(mailOptions);
}