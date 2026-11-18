import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import { useTheme } from "../../utils/ThemeContext";
import { useBusiness } from "../../business/BusinessProvider";

// Logo da loja escolhida; sem ela (ou se não carregar), o logo Agenda Flui.
export default function BrandLogo({ style, resizeMode = "contain" }) {
  const { theme } = useTheme();
  const { business } = useBusiness();
  const remote = business && business.brand ? business.brand.logoUrl : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [remote]);

  if (remote && !failed) {
    return <Image source={{ uri: remote }} style={style} resizeMode={resizeMode} onError={() => setFailed(true)} />;
  }
  const own = theme.isDarkMode
    ? require("../../../assets/logo-horizontal-negativo.png")
    : require("../../../assets/logo-horizontal.png");
  return <Image source={own} style={style} resizeMode={resizeMode} />;
}
