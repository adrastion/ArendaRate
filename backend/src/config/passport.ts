import passport from 'passport';
import { Strategy as YandexStrategy } from 'passport-yandex';
import { Strategy as VKIDStrategy } from 'passport-vk-id';
import { authService } from '../services/authService';

// Яндекс OAuth
if (process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET && process.env.YANDEX_CALLBACK_URL) {
  passport.use(
    new YandexStrategy(
      {
        clientID: process.env.YANDEX_CLIENT_ID,
        clientSecret: process.env.YANDEX_CLIENT_SECRET,
        callbackURL: process.env.YANDEX_CALLBACK_URL,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const { user, token } = await authService.findOrCreateOAuthUser(
            'yandex',
            profile.id,
            profile.emails?.[0]?.value || null,
            profile.displayName || profile.username || 'User',
            profile.photos?.[0]?.value || null
          );

          done(null, { user, token });
        } catch (error) {
          done(error as any, null);
        }
      }
    )
  );
} else {
  console.warn('Yandex OAuth is not configured: missing YANDEX_CLIENT_ID/SECRET/CALLBACK');
}

// VK ID (id.vk.ru) — современный OAuth VK
if (process.env.VK_CLIENT_ID && process.env.VK_CLIENT_SECRET && process.env.VK_CALLBACK_URL) {
  passport.use(
    new VKIDStrategy(
      {
        clientID: process.env.VK_CLIENT_ID,
        clientSecret: process.env.VK_CLIENT_SECRET,
        callbackURL: process.env.VK_CALLBACK_URL,
        scope: ['vkid.personal_info', 'email'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const email = profile.email || null;
          const name = `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || profile.displayName || 'User';
          const { user, token } = await authService.findOrCreateOAuthUser(
            'vk',
            String(profile.id),
            email,
            name,
            profile.photos?.[0]?.value || null
          );

          done(null, { user, token });
        } catch (error) {
          done(error as any, null);
        }
      }
    )
  );
} else {
  console.warn('VK OAuth is not configured: missing VK_CLIENT_ID/SECRET/CALLBACK');
}

export default passport;

