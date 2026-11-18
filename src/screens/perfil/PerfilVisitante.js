import React from "react";
import { View, Text, StyleSheet, Image, Linking } from "react-native";
import Button from "../../components/ui/Button";
import { useTheme } from "../../utils/ThemeContext";
import { useBusiness } from "../../business/BusinessProvider";
import { config } from "../../config";
import { type } from "../../theme/tokens";
import { Secao, MenuLista, SeletorTema, Rodape } from "./MenuConta";

const open = (url) => Linking.openURL(url).catch(() => {});

// Perfil de quem ainda não entrou: convite para entrar, informações, aparência e rodapé.
export default function PerfilVisitante({ navigation, businessSwitch }) {
  const { theme } = useTheme();
  const { business } = useBusiness();
  const c = theme.colors;
  const logoUrl = business && business.brand ? business.brand.logoUrl : null;

  return (
    <View>
      <View style={styles.hero}>
        {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" accessibilityLabel={business.name} /> : null}
        <Text style={[styles.title, { color: c.ink }]}>{business ? `Bem-vindo a ${business.name}` : "Bem-vindo"}</Text>
        <Text style={[styles.text, { color: c.inkMuted }]}>Entre ou crie uma conta para agendar, acompanhar seus horários e ganhar pontos.</Text>
        <Button title="Entrar ou criar conta" onPress={() => navigation.navigate("Login")} fullWidth size="lg" />
      </View>

      <Secao title="Informações">
        <MenuLista
          items={[
            { icon: "shield", label: "Política de privacidade", onPress: () => open(config.privacyUrl) },
            { icon: "file-text", label: "Termos de uso", onPress: () => open(config.termsUrl) },
            { icon: "repeat", label: "Trocar de loja", onPress: businessSwitch },
          ]}
        />
      </Secao>

      <Secao title="Aparência">
        <SeletorTema />
      </Secao>

      <Rodape />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", marginTop: 16 },
  logo: { width: 140, height: 64, marginBottom: 16 },
  title: { ...type.title, textAlign: "center", marginBottom: 8 },
  text: { ...type.body, textAlign: "center", marginBottom: 24 },
});
