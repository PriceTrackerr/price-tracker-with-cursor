require('dotenv').config();
const EmailService = require('../dist/services/emailService').default;

async function main() {
  const mode = (process.argv[2] || '').toLowerCase();
  const to = process.argv[3] || process.env.TEST_EMAIL || 'michaelabrham8@gmail.com';
  const email = new EmailService();

  if (!mode || ['help', '-h', '--help'].includes(mode)) {
    console.log('Usage: node scripts/testEmails.cjs <mode> <toEmail> [extra args]\n');
    console.log('Modes:');
    console.log('  welcome <toEmail> [username]');
    console.log('  single <toEmail> [title] [currentPrice] [previousPrice] [url] [platform]');
    console.log('  consolidated1 <toEmail>  // sends a consolidated email with 1 price drop');
    console.log('  consolidatedMany <toEmail>  // sends a consolidated email with multiple drops');
    console.log('\nExamples:');
    console.log('  node scripts/testEmails.cjs welcome someone@example.com Michael');
    console.log('  node scripts/testEmails.cjs single someone@example.com "Apple AirPods Pro" 189.00 249.00 https://www.amazon.com/dp/B0BDJ3G9QW amazon');
    console.log('  node scripts/testEmails.cjs consolidated1 someone@example.com');
    console.log('  node scripts/testEmails.cjs consolidatedMany someone@example.com');
    process.exit(0);
  }

  try {
    if (mode === 'welcome') {
      const username = process.argv[4] || 'PriceTracker User';
      console.log(`➡️  Sending welcome email to ${to} (username: ${username})...`);
      const ok = await email.sendWelcomeEmail(to, username);
      console.log(ok ? '✅ Sent' : '❌ Failed');
      return;
    }

    if (mode === 'single') {
      const title = process.argv[4] || 'Apple AirPods Pro (2nd Generation)';
      const currentPrice = Number(process.argv[5] || 189.0);
      const previousPrice = Number(process.argv[6] || 249.0);
      const url = process.argv[7] || 'https://www.amazon.com/dp/B0BDJ3G9QW';
      const platform = (process.argv[8] || 'amazon');
      console.log(`➡️  Sending single price drop email to ${to}...`);
      const ok = await email.sendPriceDropAlert(to, title, currentPrice, previousPrice, url, platform);
      console.log(ok ? '✅ Sent' : '❌ Failed');
      return;
    }

    if (mode === 'consolidated1') {
      console.log(`➡️  Sending consolidated (single) price drop email to ${to}...`);
      const ok = await email.sendConsolidatedPriceDropAlert(to, [
        {
          productTitle: 'Samsung Galaxy S21 Ultra 128GB',
          currentPrice: 799.0,
          previousPrice: 999.0,
          productUrl: 'https://www.amazon.com/dp/B08N2MSSZY',
          platform: 'amazon',
        },
      ]);
      console.log(ok ? '✅ Sent' : '❌ Failed');
      return;
    }

    if (mode === 'consolidatedmany') {
      console.log(`➡️  Sending consolidated (multiple) price drops email to ${to}...`);
      const ok = await email.sendConsolidatedPriceDropAlert(to, [
        {
          productTitle: 'Apple iPhone 15 128GB Black - Unlocked',
          currentPrice: 699.0,
          previousPrice: 799.0,
          productUrl: 'https://www.amazon.com/dp/B0CHX9K7W1',
          platform: 'amazon',
        },
        {
          productTitle: 'Google Pixel 8 Pro 128GB',
          currentPrice: 799.0,
          previousPrice: 999.0,
          productUrl: 'https://www.walmart.com/ip/google-pixel-8-pro',
          platform: 'walmart',
        },
      ]);
      console.log(ok ? '✅ Sent' : '❌ Failed');
      return;
    }

    console.error('❌ Unknown mode. Run with no args for help.');
    process.exit(1);
  } catch (err) {
    console.error('❌ Error sending test email:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main(); 