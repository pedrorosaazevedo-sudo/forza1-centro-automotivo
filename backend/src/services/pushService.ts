import webpush from 'web-push';
import { config } from '../config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Setup VAPID details if available
try {
  webpush.setVapidDetails(
    'mailto:contato@forza1.com.br',
    config.vapidKeys.publicKey,
    config.vapidKeys.privateKey
  );
} catch (err) {
  console.log('Push VAPID key setup notice:', err);
}

export const saveSubscription = async (subscriptionData: any) => {
  const { endpoint, keys } = subscriptionData;
  const keysJson = JSON.stringify(keys);

  return await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { keys: keysJson },
    create: { endpoint, keys: keysJson }
  });
};

export const sendNotificationToAll = async (title: string, body: string, icon = '/icons/icon-192x192.png') => {
  const subscriptions = await prisma.pushSubscription.findMany();

  const payload = JSON.stringify({
    title,
    body,
    icon,
    badge: '/icons/icon-72x72.png',
    data: { url: '/' }
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: JSON.parse(sub.keys)
        };
        await webpush.sendNotification(pushSubscription, payload);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired or gone, clean up
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        throw error;
      }
    })
  );

  return results;
};
