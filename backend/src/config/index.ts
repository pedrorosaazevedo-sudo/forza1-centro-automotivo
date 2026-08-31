import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'lemoka_secret_key_2026_super_secure',
  vapidKeys: {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BJ-UE98EMqzDuif5HCgn-GKS9vvTheR7zjxYYnd0O4b-1YKyjI4wV6YAdOWiH5A5562afHlS-ZxK6rxVOz2tHzY',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'QO5c_2IF51Yjj6R3J2-IBYIr9aMNJKAtDRmyNai22GA'
  }
};
