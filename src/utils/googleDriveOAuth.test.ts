// src/utils/googleDriveOAuth.test.ts
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldUseSameTabForGoogleOAuth,
  getValidatedGoogleOAuthAuthorizationUrl,
} from './googleDriveOAuth';

describe('Google Drive OAuth Utility Tests', () => {
  test('1. Viewport mobile utiliza a mesma aba', () => {
    const isMobileViewport = true;
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    const result = shouldUseSameTabForGoogleOAuth(isMobileViewport, desktopUA);
    assert.strictEqual(result, true);
  });

  test('2. Android utiliza a mesma aba mesmo em orientação paisagem', () => {
    const isMobileViewport = false;
    const androidUA =
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    const result = shouldUseSameTabForGoogleOAuth(isMobileViewport, androidUA);
    assert.strictEqual(result, true);
  });

  test('3. Desktop mantém o popup', () => {
    const isMobileViewport = false;
    const macDesktopUA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const result = shouldUseSameTabForGoogleOAuth(isMobileViewport, macDesktopUA);
    assert.strictEqual(result, false);
  });

  test('4. Uma URL HTTPS de accounts.google.com é aceita', () => {
    const validUrl =
      'https://accounts.google.com/o/oauth2/v2/auth?client_id=123456.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fjuceliasantanaengencivil.com.br%2Fadmin%2Fbackups%2Foauth-complete&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file';
    const validated = getValidatedGoogleOAuthAuthorizationUrl(validUrl);
    assert.strictEqual(validated, validUrl);
  });

  test('5. https://accounts.google.com.evil.example é rejeitada', () => {
    const maliciousUrl = 'https://accounts.google.com.evil.example/o/oauth2/v2/auth';
    assert.throws(
      () => {
        getValidatedGoogleOAuthAuthorizationUrl(maliciousUrl);
      },
      (err: any) => {
        assert.match(err.message, /URL de autorização inválida/);
        return true;
      }
    );
  });

  test('6. http://accounts.google.com é rejeitada', () => {
    const insecureUrl = 'http://accounts.google.com/o/oauth2/v2/auth';
    assert.throws(
      () => {
        getValidatedGoogleOAuthAuthorizationUrl(insecureUrl);
      },
      (err: any) => {
        assert.match(err.message, /URL de autorização inválida/);
        return true;
      }
    );
  });
});
