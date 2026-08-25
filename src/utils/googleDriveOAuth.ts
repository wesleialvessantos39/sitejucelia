// src/utils/googleDriveOAuth.ts

const MOBILE_USER_AGENT_PATTERN = /Android|iPhone|iPad|iPod/i;

export function shouldUseSameTabForGoogleOAuth(
  matchesMobileViewport: boolean,
  userAgent: string
): boolean {
  return matchesMobileViewport || MOBILE_USER_AGENT_PATTERN.test(userAgent);
}

export function getValidatedGoogleOAuthAuthorizationUrl(rawUrl: string): string {
  const url = new URL(rawUrl);

  if (url.protocol !== 'https:' || url.hostname !== 'accounts.google.com') {
    throw new Error('O servidor retornou uma URL de autorização inválida.');
  }

  return url.toString();
}
