import passport from 'passport';
import { Strategy as YandexStrategy } from 'passport-yandex';
import { Strategy as VKontakteStrategy } from 'passport-vkontakte';
import { authService } from '../services/authService';

// Яндекс OAuth
passport.use(
  new YandexStrategy(
    {
      clientID: process.env.YANDEX_CLIENT_ID!,
      clientSecret: process.env.YANDEX_CLIENT_SECRET!,
      callbackURL: process.env.YANDEX_CALLBACK_URL!,
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

type VkParams = {
  email?: string;
};

// VK OAuth
passport.use(
  new VKontakteStrategy(
    {
      clientID: process.env.VK_CLIENT_ID!,
      clientSecret: process.env.VK_CLIENT_SECRET!,
      callbackURL: process.env.VK_CALLBACK_URL!,
      scope: ['email'],
    },
    async (
      accessToken: string,
      refreshToken: string,
      params: VkParams,
      profile: any,
      done: (error: any, user?: any) => void
    ) => {
      try {
        const email = params.email || null;
        const { user, token } = await authService.findOrCreateOAuthUser(
          'vk',
          profile.id,
          email,
          `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim() || 'User',
          profile.photos?.[0]?.value || null
        );

        done(null, { user, token });
      } catch (error) {
        done(error as any, null);
      }
    }
  )
);

export default passport;

