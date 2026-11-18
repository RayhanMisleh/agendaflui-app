import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { getMyRedemptions, getProfile } from "../api/legado";
import { createTextStyle } from "../utils/theme";
import { useTheme } from "../utils/ThemeContext";
import Skeleton from "../components/ui/Skeleton";
import PointsIcon from "../components/ui/PointsIcon";
import { useAuth } from "../components/AuthProvider";
import { useFocusEffect } from "@react-navigation/native";

const MinhaJornadaScreen = ({ navigation }) => {
  const { theme, themeMode } = useTheme();
  const { isDarkMode } = theme;
  const styles = getStyles(theme, isDarkMode, themeMode);
  const { isAuthenticated } = useAuth();

  const [redemptions, setRedemptions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      carregarDados();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [perfilData, redemptionsData] = await Promise.all([
        getProfile().catch(() => null),
        getMyRedemptions().catch(() => [])
      ]);
      setProfile(perfilData);
      setRedemptions(redemptionsData || []);
    } catch (error) {
      console.error("Erro ao carregar jornada:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  };

  const isClubMember = profile?.club_member;

  const dataToRender = isClubMember ? redemptions : [];

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="timeline" size={64} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>Sua jornada de prêmios começa aqui.</Text>
      <Text style={styles.emptySubtitle}>
        Resgate prêmios e eles aparecerão no seu histórico.
      </Text>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <View style={styles.jornadaItem}>
      <View style={styles.jornadaTimeline}>
        <View style={styles.jornadaIconContainer}>
          {item.prize?.icon_url ? (
            <Image source={{ uri: item.prize.icon_url }} style={styles.jornadaPrizeIcon} />
          ) : (
            <MaterialIcons name="redeem" size={16} color={theme.colors.primary} />
          )}
        </View>
        {index < dataToRender.length - 1 && <View style={styles.jornadaLine} />}
      </View>
      <View style={styles.jornadaContent}>
        <Text style={styles.jornadaTitle}>{item.prize?.name}</Text>
        <Text style={styles.jornadaDate}>
          {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(item.redeemed_at))}
        </Text>
      </View>
      <View style={styles.jornadaPoints}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PointsIcon size={16} />
          <Text style={[styles.jornadaPointsText, { marginLeft: 4 }]}>
            {item.prize?.points_cost || item.prize?.points}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={theme.colors.foreground}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Histórico de Prêmios</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.listContainer}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={styles.jornadaItem}>
              <View style={styles.jornadaTimeline}>
                <Skeleton width={32} height={32} style={{ borderRadius: 16 }} />
                <View style={styles.jornadaLine} />
              </View>
              <View style={styles.jornadaContent}>
                <Skeleton width={150} height={18} style={{ marginBottom: 4 }} />
                <Skeleton width={100} height={14} />
              </View>
              <View style={styles.jornadaPoints}>
                <Skeleton width={40} height={18} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={theme.colors.foreground}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de Prêmios</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <FlatList
          data={dataToRender}
          keyExtractor={(item) => item.redemption_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />

        {(!isClubMember) && (
          <View style={styles.clubeOverlay}>
            <BlurView intensity={themeMode === 'dark' ? 30 : 10} tint={themeMode === 'dark' ? 'dark' : 'light'} style={styles.blurContainer} />
            <View style={styles.clubeOverlayContent}>
              <View style={styles.clubeLockCircle}>
                <MaterialIcons name="lock" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.clubeOverlayTitle}>Histórico Reservado</Text>
              <Text style={styles.clubeOverlayText}>
                Só quem é do clube acompanha a evolução e os resgates.
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme, isDarkMode, themeMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    ...createTextStyle("h3", "textPrimary", theme),
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  listContainer: {
    padding: theme.spacing.lg,
    flexGrow: 1,
  },
  jornadaItem: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  jornadaTimeline: {
    width: 40,
    alignItems: 'center',
  },
  jornadaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight + "20",
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  jornadaPrizeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  jornadaLine: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.borderLight,
    marginTop: 4,
    marginBottom: 4,
  },
  jornadaContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 24,
  },
  jornadaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  jornadaDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  jornadaPoints: {
    paddingLeft: 12,
    paddingTop: 2,
  },
  jornadaPointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    marginTop: 40,
  },
  emptyTitle: {
    ...createTextStyle("h3", "textPrimary", theme),
    marginTop: theme.spacing.lg,
    textAlign: "center",
  },
  emptySubtitle: {
    ...createTextStyle("body", "textMuted", theme),
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  clubeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: theme.isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.15)',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  clubeOverlayContent: {
    padding: 20,
    alignItems: 'center',
    zIndex: 20,
    width: '100%',
  },
  clubeLockCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.isDarkMode ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  clubeOverlayTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  clubeOverlayText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
});

export default MinhaJornadaScreen;
