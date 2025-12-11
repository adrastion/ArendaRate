import passport from 'passport';
import { Profile as PassportProfile } from 'passport';
import { Strategy as YandexStrategy } from 'passport-yandex';
import { Strategy as VKontakteStrategy, Profile as VKProfile } from 'passport-vkontakte';
import { VerifyCallback } from 'passport-oauth2';
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
      profile: PassportProfile,
      done: VerifyCallback
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
      profile: VKProfile,
      done: VerifyCallback
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

