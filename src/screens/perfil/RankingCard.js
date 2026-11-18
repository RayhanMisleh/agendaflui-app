import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Avatar from "../../components/ui/Avatar";
import PointsIcon from "../../components/ui/PointsIcon";
import Skeleton from "../../components/ui/Skeleton";
import { useTheme } from "../../utils/ThemeContext";
import { getRanking } from "../../api/loyalty";
import { pointsLabel } from "../../business/terms";
import { fonts, radius, type } from "../../theme/tokens";

// Ranking do mês: primeiro nome e pontos, até 10. A API não diz quem é o cliente, então não há destaque "você".
// Desligado (`enabled: false`), sem módulo ou com falha: a seção inteira some.
const RankingCard = ({ terms, slug }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setRanking(null);
    setLoading(true);
    getRanking()
      .then((data) => {
        if (!cancelled) setRanking(data);
      })
      .catch(() => {
        if (!cancelled) setRanking(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!loading && (!ranking || !ranking.enabled)) return null;

  const entries = ranking ? ranking.entries.slice(0, 10) : [];

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.inkMuted }]}>Ranking do mês</Text>
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
        {loading ? (
          [1, 2, 3].map((key) => (
            <View key={key} style={styles.row}>
              <Skeleton width={28} height={28} style={{ borderRadius: 14 }} />
              <Skeleton width={36} height={36} style={{ borderRadius: 18, marginLeft: 10 }} />
              <Skeleton width={120} height={16} style={{ marginLeft: 12 }} />
            </View>
          ))
        ) : entries.length === 0 ? (
          <Text style={[styles.empty, { color: c.inkMuted }]}>Ninguém pontuou neste mês ainda.</Text>
        ) : (
          entries.map((entry, index) => (
            <View key={`${entry.position}-${entry.firstName}-${index}`} style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
              <View style={[styles.position, { backgroundColor: entry.position <= 3 ? c.carameloTint : c.ground }]}>
                <Text style={[styles.positionText, { color: c.ink }]}>{entry.position}</Text>
              </View>
              <Avatar source={entry.avatarUrl} name={entry.firstName} size="sm" style={{ marginLeft: 10 }} />
              <Text style={[styles.name, { color: c.ink }]} numberOfLines={1}>{entry.firstName}</Text>
              <PointsIcon size={14} />
              <Text style={[styles.points, { color: c.ink }]} accessibilityLabel={pointsLabel(entry.points, terms)}>
                {Number(entry.points).toLocaleString("pt-BR")}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  sectionTitle: { ...type.small, fontFamily: fonts.textSemi, marginBottom: 8, marginLeft: 4 },
  card: { borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: 14, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  position: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  positionText: { fontFamily: fonts.textBold, fontSize: 13, lineHeight: 16 },
  name: { ...type.bodyStrong, flex: 1, marginLeft: 12, marginRight: 8 },
  points: { ...type.time, marginLeft: 4 },
  empty: { ...type.body, paddingVertical: 20, textAlign: "center" },
});

export default RankingCard;
