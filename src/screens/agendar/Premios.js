import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Alert,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import PointsIcon from "../../components/ui/PointsIcon";
import SectionHeader from "../../components/ui/SectionHeader";
import { useTheme } from "../../utils/ThemeContext";
import { getPrizes, getProfile } from "../../api/legado";

// Movido de AgendarScreen sem reescrever (a Tarefa 5 refaz com /v1/loyalty).
const { width } = Dimensions.get("window");

const Premios = ({ navigation, isAuthenticated, clubMember }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [prizes, setPrizes] = useState([]);
  const [points, setPoints] = useState(0);
  const currentUser = { points, clubMember };

  useEffect(() => {
    getPrizes()
      .catch(() => [])
      .then((fetched) => {
        const palette = ["#0B6E66", "#10b981", "#f59e0b", "#ec4899", "#3b82f6"];
        setPrizes(
          (Array.isArray(fetched) ? fetched : []).map((p, index) => ({
            id: String(p.prize_id),
            prize_id: p.prize_id,
            name: p.name,
            points: p.points_cost,
            icon_url: p.icon_url,
            color: palette[index % palette.length],
          }))
        );
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setPoints(0);
      return;
    }
    getProfile()
      .then((user) => setPoints(user?.user_points_balance ?? 0))
      .catch(() => {});
  }, [isAuthenticated]);

  const handlePrizePress = (item) => {
    if (!isAuthenticated) {
      if (Platform.OS === "web") {
        const goToLogin = window.confirm(
          "Entre na sua conta para resgatar prêmios.\n\nDeseja fazer login agora?"
        );
        if (goToLogin) {
          navigation.navigate("Login");
        }
        return;
      }
      Alert.alert(
        "Login necessário",
        "Entre na sua conta para resgatar prêmios.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Fazer login",
            onPress: () => navigation.navigate("Login"),
          },
        ],
      );
      return;
    }
    if (!currentUser.clubMember) {
      if (Platform.OS === "web") {
        window.alert(
          "Só quem é do clube pode resgatar prêmios."
        );
      } else {
        Alert.alert(
          "Clube",
          "Só quem é do clube pode resgatar prêmios.",
        );
      }
      return;
    }
    if (currentUser.points < item.points) {
      if (Platform.OS === "web") {
        window.alert(
          `Você precisa de ${item.points} pontos para resgatar este prêmio.`
        );
      } else {
        Alert.alert(
          "Saldo Insuficiente",
          `Você precisa de ${item.points} pontos para resgatar este prêmio.`,
        );
      }
      return;
    }
    navigation.navigate("PrizeScanner", { prize: item });
  };

  const renderPrize = ({ item }) => {
    const insufficientPoints =
      (currentUser?.points || 0) < (item.points_cost || item.points);

    return (
      <TouchableOpacity
        style={[
          styles.prizeCard,
          {
            borderColor: insufficientPoints
              ? theme.isDarkMode
                ? theme.colors.borderLight
                : "#F0F0F0"
              : item.color + "40",
          },
          insufficientPoints && styles.prizeCardDisabled,
        ]}
        activeOpacity={insufficientPoints ? 0.6 : 0.8}
        onPress={() => handlePrizePress(item)}
      >
        <View
          style={[
            styles.prizeIconContainer,
            {
              backgroundColor: insufficientPoints
                ? theme.isDarkMode
                  ? theme.colors.backgroundSecondary
                  : "#F5F5F5"
                : item.color + "15",
            },
          ]}
        >
          {item.icon_url ? (
            <Image
              source={{ uri: item.icon_url }}
              style={[
                { width: 32, height: 32, borderRadius: 8 },
                insufficientPoints && { opacity: 0.3, grayscale: 1 },
              ]}
            />
          ) : (
            <MaterialIcons
              name="redeem"
              size={32}
              color={
                insufficientPoints ? "#CCC" : item.color || theme.colors.primary
              }
            />
          )}
        </View>
        <View
          style={{
            alignItems: "center",
            width: "100%",
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          <View style={{ height: 40, justifyContent: "center", width: "100%" }}>
            <Text
              style={[
                styles.prizeName,
                insufficientPoints && { color: "#9E9E9E" },
              ]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </View>
          <View
            style={[
              styles.prizePointsRow,
              insufficientPoints && {
                backgroundColor: theme.isDarkMode
                  ? theme.colors.muted
                  : "#F0F0F0",
                borderColor: theme.isDarkMode ? theme.colors.border : "#E0E0E0",
              },
            ]}
          >
            <PointsIcon
              size={14}
              style={[
                { marginRight: 4 },
                insufficientPoints && { opacity: 0.4 },
              ]}
            />
            <Text
              style={[
                styles.prizePointsText,
                {
                  color: insufficientPoints
                    ? theme.colors.textMuted
                    : theme.colors.textPrimary,
                },
              ]}
            >
              {item.points_cost || item.points}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <>
        <View>
          <SectionHeader
            title="Prêmios"
            subtitle="Troque seus pontos"
            style={styles.sectionHeader}
          />
          <View style={styles.prizesContainer}>
            <FlatList
              data={prizes}
              renderItem={renderPrize}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.prizesList}
            />
            {(!isAuthenticated || !currentUser.clubMember) && (
              <View style={styles.clubeOverlay}>
                <BlurView
                  intensity={10}
                  tint="light"
                  style={styles.blurContainer}
                />
                <View style={styles.clubeOverlayContent}>
                  <View style={styles.clubeLockCircle}>
                    <MaterialIcons
                      name="lock"
                      size={32}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text style={styles.clubeOverlayTitle}>Clube</Text>
                  <Text style={styles.clubeOverlayText}>
                    Resgate prêmios exclusivos sendo membro.
                  </Text>
                  {!isAuthenticated && (
                    <TouchableOpacity
                      style={styles.clubeCTAButton}
                      onPress={() => navigation.navigate("Login")}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.clubeCTAButtonText}>Entrar para participar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

    </>
  );
};

const getStyles = (theme) => {
  return StyleSheet.create({
    sectionHeader: {
      paddingHorizontal: 24,
      marginTop: 16,
      marginBottom: 4,
    },
    prizesList: {
      paddingHorizontal: 24,
      paddingBottom: 20,
      paddingTop: 20,
    },
    prizeCard: {
      width: theme.isTablet ? (width - 80) / 3 : Math.max(140, width * 0.38),
      height: theme.isTablet ? 300 : 165,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginRight: theme.spacing.md,
      alignItems: "center",
      ...theme.shadows.md,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    prizeCardDisabled: {
      backgroundColor: theme.isDarkMode ? theme.colors.muted : "#FAFAFA",
      shadowOpacity: 0.02,
      elevation: 1,
    },
    prizeIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    prizeName: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    prizePointsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.isDarkMode ? theme.colors.background : "#f3f4f6",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    prizePointsText: {
      fontSize: 13,
      fontWeight: "800",
      color: theme.colors.points,
      marginLeft: 4,
    },
    prizesContainer: {
      position: "relative",
      height: theme.isTablet ? 360 : 205,
    },
    clubeOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
      backgroundColor: theme.isDarkMode
        ? "rgba(0,0,0,0.4)"
        : "rgba(255,255,255,0.05)",
    },
    blurContainer: {
      ...StyleSheet.absoluteFillObject,
    },
    clubeOverlayContent: {
      padding: 16,
      alignItems: "center",
      zIndex: 20,
      width: "100%",
    },
    clubeLockCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.isDarkMode
        ? "rgba(30,30,30,0.95)"
        : "rgba(255,255,255,0.95)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 3,
    },
    clubeOverlayTitle: {
      color: theme.colors.textPrimary,
      fontSize: 22,
      fontWeight: "900",
      marginBottom: 6,
      textAlign: "center",
    },
    clubeOverlayText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 18,
      paddingHorizontal: 32,
      fontWeight: "500",
    },
    clubeCTAButton: {
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: theme.isDarkMode
        ? "rgba(11, 110, 102,0.15)"
        : "rgba(255,255,255,0.7)",
    },
    clubeCTAButtonText: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
  });
};

export default Premios;
