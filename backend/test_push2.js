require('dotenv').config();
const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');

// Use DIRECT_URL for scripts to bypass pooler limits
process.env.DATABASE_URL = process.env.DIRECT_URL;

const prisma = new PrismaClient();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:test@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function main() {
  try {
    const subs = await prisma.push_subscriptions.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    console.log('Found', subs.length, 'subscriptions in DB');
    if (subs.length === 0) {
      console.log('No subscriptions found!');
      process.exit(0);
    }
    
    const sub = subs[0];
    console.log('Testing push to endpoint:', sub.endpoint);
    
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };
    
    const payload = JSON.stringify({
      title: 'Notifikasi CLI',
      body: 'Testing dari CLI dengan logo',
      url: '/notifications'
    });
    
    const result = await webpush.sendNotification(pushSub, payload);
    console.log('Push Success! Response:', result.statusCode);
  } catch (error) {
    console.error('Push Error Details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
