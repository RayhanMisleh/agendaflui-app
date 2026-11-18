import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import Card from "../../components/ui/Card";
import PointsDisplay from "../../components/ui/PointsDisplay";
import { useTheme } from "../../utils/ThemeContext";
import { useTerms } from "../../business/BusinessProvider";
import { getProfile } from "../../api/legado";

// Movido de AgendarScreen sem reescrever (a Tarefa 5 refaz com /v1/loyalty/me).
const SaldoPontos = ({ isAuthenticated }) => {
  const { theme } = useTheme();
  const terms = useTerms();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setPoints(0);
      return;
    }
    getProfile()
      .then((user) => setPoints(user?.user_points_balance ?? 0))
      .catch(() => {});
  }, [isAuthenticated]);

  return (
    <Card style={{ backgroundColor: theme.colors.pointsBackground }} padding="sm">
      <PointsDisplay amount={points} label={terms.points.plural} size="md" />
    </Card>
  );
};

export default SaldoPontos;
