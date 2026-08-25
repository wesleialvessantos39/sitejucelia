import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeTextDisplaySettings,
  resolveTextSectionConfig,
  DEFAULT_TEXT_DISPLAY_SETTINGS,
} from '../data/defaultTextDisplaySettings';
import { TextDisplaySettings } from '../types/textDisplay';

describe('Text Display System - OE-SITE-001 Tests', () => {
  it('should return default settings when input is empty or null', () => {
    const norm = normalizeTextDisplaySettings(null);
    assert.strictEqual(norm.enabled, true);
    assert.strictEqual(norm.mode, 'collapsible');
    assert.strictEqual(norm.minimumCharacters, 180);
    assert.strictEqual(norm.mobileLines, 3);
    assert.strictEqual(norm.tabletLines, 4);
    assert.strictEqual(norm.desktopLines, 5);
  });

  it('should clamp lines and characters safely within reasonable bounds', () => {
    const custom = normalizeTextDisplaySettings({
      minimumCharacters: 10, // below 80 -> should clamp to 80
      mobileLines: 1, // below 2 -> should clamp to 2
      desktopLines: 50, // above 12 -> should clamp to 12
    });
    assert.strictEqual(custom.minimumCharacters, 80);
    assert.strictEqual(custom.mobileLines, 2);
    assert.strictEqual(custom.desktopLines, 12);
  });

  it('should resolve viewport specific configs correctly', () => {
    const settings: TextDisplaySettings = {
      ...DEFAULT_TEXT_DISPLAY_SETTINGS,
      mobileLines: 2,
      tabletLines: 4,
      desktopLines: 6,
    };

    const mobileConfig = resolveTextSectionConfig(settings, 'about', 'mobile');
    assert.strictEqual(mobileConfig.maxLines, 2);

    const desktopConfig = resolveTextSectionConfig(settings, 'about', 'desktop');
    assert.strictEqual(desktopConfig.maxLines, 6);
  });

  it('should respect section overrides when specified', () => {
    const settings: TextDisplaySettings = {
      ...DEFAULT_TEXT_DISPLAY_SETTINGS,
      mode: 'collapsible',
      desktopLines: 5,
      sectionOverrides: {
        about: {
          mode: 'compact',
          desktopLines: 3,
        },
      },
    };

    const aboutConfig = resolveTextSectionConfig(settings, 'about', 'desktop');
    assert.strictEqual(aboutConfig.mode, 'compact');
    assert.strictEqual(aboutConfig.maxLines, 3);
    assert.strictEqual(aboutConfig.showToggle, false); // compact does not show toggle

    const servicesConfig = resolveTextSectionConfig(settings, 'services', 'desktop');
    assert.strictEqual(servicesConfig.mode, 'collapsible');
    assert.strictEqual(servicesConfig.maxLines, 5);
    assert.strictEqual(servicesConfig.showToggle, true);
  });

  it('should disable reduction when system is globally disabled', () => {
    const settings: TextDisplaySettings = {
      ...DEFAULT_TEXT_DISPLAY_SETTINGS,
      enabled: false,
    };

    const config = resolveTextSectionConfig(settings, 'hero', 'desktop');
    assert.strictEqual(config.enabled, false);
    assert.strictEqual(config.mode, 'full');
    assert.strictEqual(config.showToggle, false);
  });
});
