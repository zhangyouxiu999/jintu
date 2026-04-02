import { createTamagui } from 'tamagui'
import { defaultConfig } from '@tamagui/config/v4'

const appConfig = {
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    space: {
      ...defaultConfig.tokens.space,
      '$1': 4,
      '$2': 8,
      '$3': 12,
      '$4': 16,
      '$5': 20,
      '$6': 24,
      '$7': 32,
      '$8': 40,
      '$9': 48,
      '$10': 56,
      '$true': 16,
    },
    size: {
      ...defaultConfig.tokens.size,
      '$1': 16,
      '$2': 20,
      '$3': 24,
      '$4': 28,
      '$5': 32,
      '$6': 36,
      '$7': 40,
      '$8': 44,
      '$9': 52,
      '$10': 60,
      '$true': 44,
    },
    radius: {
      ...defaultConfig.tokens.radius,
      '1': 12,
      '2': 16,
      '3': 22,
      '4': 28,
      '5': 32,
      true: 16,
    },
  },
  themes: {
    classroomCalm: {
      ...defaultConfig.themes.light,
      accentBackground: '#6F8A72',
      accentColor: '#FFFDFC',
      background: '#F6F3ED',
      background0: '#FFFDFC',
      background02: '#FCF9F4',
      background04: '#F7F2EA',
      background06: '#F0ECE4',
      background08: '#E9E3D8',
      backgroundHover: '#F2ECE4',
      backgroundPress: '#E9E3D8',
      backgroundFocus: '#FFFDFC',
      borderColor: '#DDD8CE',
      borderColorHover: '#CFC8BA',
      borderColorPress: '#BDB5A4',
      borderColorFocus: '#6F8A72',
      color1: '#FDFBF7',
      color2: '#FBF7F0',
      color3: '#F6F0E7',
      color4: '#F0E9DD',
      color5: '#E7DDCF',
      color6: '#DACCBA',
      color7: '#C5B7A1',
      color8: '#AC9C85',
      color9: '#6F8A72',
      color10: '#5E7561',
      color11: '#6C726B',
      color12: '#2F342F',
      color: '#2F342F',
      colorHover: '#2F342F',
      colorPress: '#2F342F',
      colorFocus: '#2F342F',
      colorTransparent: 'rgba(255,255,255,0)',
      outlineColor: '#6F8A72',
      placeholderColor: '#8B8F85',
      shadowColor: 'rgba(94, 79, 52, 0.12)',
      blue9: '#6F8A72',
      green9: '#6FAE74',
      red9: '#C96B5C',
      yellow9: '#D6A85F',
    },
  },
}

const config = createTamagui(appConfig)

type AppConfig = typeof config

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config
