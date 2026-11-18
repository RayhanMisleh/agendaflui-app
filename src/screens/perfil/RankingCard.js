import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { BlurView } from "expo-blur";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import PointsIcon from "../../components/ui/PointsIcon";
import Skeleton from "../../components/ui/Skeleton";
import { useTheme } from "../../utils/ThemeContext";
import { createTextStyle } from "../../utils/theme";
import { getProfile, getRanking } from "../../api/legado";

// Movido de PerfilScreen sem reescrever (a Tarefa 5 refaz com /v1/loyalty/ranking).
const RankingCard = ({ isAuthenticated, clubMember }) => {
  const { theme, themeMode } = useTheme();
  const styles = getStyles(theme);
  const [profile, setProfile] = useState(null);
  const [rankingList, setRankingList] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [myRankingPosition, setMyRankingPosition] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    getProfile()
      .then((data) => setProfile({ ...data, club_member: clubMember }))
      .catch(() => setProfile({ club_member: clubMember }));
    setLoadingRanking(true);
    getRanking()
      .then((data) => {
        setRankingList(data?.ranking || []);
        setMyRankingPosition(data?.myPosition || null);
      })
      .catch(() => {})
      .finally(() => setLoadingRanking(false));
  }, [isAuthenticated, clubMember]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
        {/* Ranking de pontos */}
        <Text style={styles.sectionLabel}>Ranking do clube</Text>
        <View style={styles.rankingContainer}>
          <View style={styles.rankingCard}>
            {(!clubMember) && (
              <View style={styles.clubeOverlay}>
                <BlurView intensity={themeMode === 'dark' ? 30 : 10} tint={themeMode === 'dark' ? 'dark' : 'light'} style={styles.blurContainer} />
                <View style={styles.clubeOverlayContent}>
                  <View style={styles.clubeLockCircle}>
                    <MaterialIcons name="lock" size={24} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.clubeOverlayTitle}>Ranking Exclusivo</Text>
                  <Text style={styles.clubeOverlayText}>
                    Entre para o clube para participar do ranking e disputar prêmios.
                  </Text>
                </View>
              </View>
            )}

            {loadingRanking ? (
              [1, 2, 3, 4].map((item) => (
                <View key={item} style={styles.rankingItem}>
                  <View style={styles.rankingPosition}>
                    <Skeleton width={20} height={20} borderRadius={10} />
                  </View>
                  <View style={styles.rankingAvatar}>
                    <Skeleton width={36} height={36} borderRadius={18} />
                  </View>
                  <View style={styles.rankingContent}>
                    <Skeleton width={120} height={16} borderRadius={4} />
                  </View>
                  <View style={styles.rankingPoints}>
                    <Skeleton width={40} height={16} borderRadius={4} />
                  </View>
                </View>
              ))
            ) : rankingList.length === 0 ? (
              <View style={{ padding: 24, alignItems: "center" }}>
                <MaterialIcons name="emoji-events" size={36} color={theme.colors.textMuted} />
                <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginTop: 8 }}>
                  Nenhum participante no ranking ainda
                </Text>
              </View>
            ) : (
              <>
                {rankingList.slice(0, 10).map((user, index) => {
                  const isThisUserMe = user.isMe || (profile?.user_name && user.name === profile.user_name) || (profile?.user_id && String(user.id) === String(profile.user_id));
                  return (
                    <View key={user.id || index} style={[styles.rankingItem, isThisUserMe && styles.rankingItemMe]}>
                      <View style={styles.rankingPosition}>
                        {index === 0 ? (
                          <MaterialIcons name="emoji-events" size={24} color="#F2A93B" />
                        ) : index === 1 ? (
                          <MaterialIcons name="emoji-events" size={24} color="#C0C0C0" />
                        ) : index === 2 ? (
                          <MaterialIcons name="emoji-events" size={24} color="#CD7F32" />
                        ) : (
                          <Text style={styles.rankingPositionText}>{user.position || index + 1}º</Text>
                        )}
                      </View>
                      <View style={styles.rankingAvatar}>
                        {user.avatar ? (
                          <Image source={{ uri: user.avatar }} style={styles.rankingAvatarImg} />
                        ) : (
                          <View style={styles.rankingAvatarPlaceholder}>
                            <Text style={styles.rankingAvatarInitials}>{getInitials(user.name)}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.rankingContent}>
                        <Text style={[styles.rankingName, isThisUserMe && styles.rankingNameMe]} numberOfLines={1}>
                          {user.name}
                        </Text>
                      </View>
                      <View style={styles.rankingPoints}>
                        <PointsIcon size={14} />
                        <Text style={styles.rankingPointsText}>
                          {typeof user.points === "number" ? user.points.toLocaleString("pt-BR") : user.points}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* Se o usuário não estiver no top 10, mostrar a posição dele no rodapé do card */}
                {myRankingPosition && myRankingPosition > 10 && !rankingList.slice(0, 10).some(u => u.isMe || (profile?.user_id && String(u.id) === String(profile.user_id))) && (
                  <View style={[styles.rankingItem, styles.rankingItemMe, { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
                    <View style={styles.rankingPosition}>
                      <Text style={styles.rankingPositionText}>{myRankingPosition}º</Text>
                    </View>
                    <View style={styles.rankingAvatar}>
                      {profile?.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={styles.rankingAvatarImg} />
                      ) : (
                        <View style={styles.rankingAvatarPlaceholder}>
                          <Text style={styles.rankingAvatarInitials}>{getInitials(profile?.user_name || "Você")}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.rankingContent}>
                      <Text style={[styles.rankingName, styles.rankingNameMe]} numberOfLines={1}>
                        {profile?.user_name || "Você"}
                      </Text>
                    </View>
                    <View style={styles.rankingPoints}>
                      <PointsIcon size={14} />
                      <Text style={styles.rankingPointsText}>
                        {typeof profile?.user_points_balance === "number" ? profile.user_points_balance.toLocaleString("pt-BR") : (profile?.user_points_balance || 0)}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
    </>
  );
};

const getStyles = (theme) => StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  rankingContainer: {
    paddingHorizontal: 20,
    marginBottom: theme.spacing.xl,
  },
  rankingCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    ...(theme.isDarkMode ? {} : theme.shadows.md),
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  rankingItemMe: {
    backgroundColor: theme.colors.primaryLight + "10",
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderBottomWidth: 0,
  },
  rankingPosition: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingPositionText: {
    ...createTextStyle("body", "textMuted", theme),
    fontWeight: '700',
  },
  rankingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 8,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rankingAvatarImg: {
    width: '100%',
    height: '100%',
  },
  rankingAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankingAvatarInitials: {
    ...createTextStyle("caption", "textMuted", theme),
    fontWeight: 'bold',
  },
  rankingContent: {
    flex: 1,
    paddingLeft: 12,
  },
  rankingName: {
    ...createTextStyle("body", "textPrimary", theme),
    fontWeight: '500',
  },
  rankingNameMe: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  rankingPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankingPointsText: {
    ...createTextStyle("caption", "textPrimary", theme),
    fontWeight: '700',
    marginLeft: 4,
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
    lineHeight: 16,
    paddingHorizontal: 24,
    fontWeight: '500',
  },
});

export default RankingCard;
