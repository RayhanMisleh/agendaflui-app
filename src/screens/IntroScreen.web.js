import React from 'react';
import { useTheme } from '../utils/ThemeContext';
import { View, Text, TouchableOpacity, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { fonts, radius } from '../theme/tokens';

export default function IntroScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.container}>
      <View style={[styles.content, isMobile && styles.contentMobile]}>
        <Image
          source={theme.isDarkMode ? require("../../assets/logo-horizontal-negativo.png") : require("../../assets/logo-horizontal.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Agende em segundos</Text>
        <Text style={styles.subtitle}>
          Escolha o profissional, o serviço e o horário. Tudo pelo navegador.
        </Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryButtonText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.secondaryButtonText}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.ground,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    padding: 40,
    borderRadius: radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  contentMobile: {
    padding: 24,
    maxWidth: '100%',
    borderRadius: radius.lg,
  },
  logo: {
    width: 220,
    height: 47,
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: theme.colors.ink,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.text,
    fontSize: 18,
    color: theme.colors.inkMuted,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: theme.colors.brand,
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.onBrand,
    fontFamily: fonts.textBold,
    fontSize: 16,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.brand,
  },
  secondaryButtonText: {
    color: theme.colors.brand,
    fontFamily: fonts.textBold,
    fontSize: 16,
  },
});
