import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { CardStyleInterpolators } from "@react-navigation/stack";

const DURATION = 220;
const timing = { animation: "timing", config: { duration: DURATION } };

// Segue a opção "reduzir movimento" do sistema (e a mudança dela com o app aberto).
export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduce(Boolean(value));
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => setReduce(Boolean(value)));
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduce;
}

// Opções das pilhas: anima em todas as plataformas, 220 ms, e nada com "reduzir movimento".
export function stackScreenOptions({ platform, reduceMotion }) {
  const options = {
    headerShown: false,
    animationEnabled: !reduceMotion,
    transitionSpec: { open: timing, close: timing },
  };
  if (platform === "web") {
    options.cardStyleInterpolator = ({ current: { progress } }) => ({
      cardStyle: { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
    });
  } else if (platform === "android") {
    options.cardStyleInterpolator = CardStyleInterpolators.forFadeFromBottomAndroid;
  }
  return options;
}

// Resposta ao toque: some a escala com "reduzir movimento".
export function pressFeedback(pressed, reduceMotion) {
  if (!pressed) return {};
  return reduceMotion ? { opacity: 0.85 } : { opacity: 0.85, transform: [{ scale: 0.98 }] };
}

export function entranceDuration(reduceMotion) {
  return reduceMotion ? 0 : DURATION;
}

// Esqueleto: com "reduzir movimento", opacidade fixa e sem laço; senão, pulsa entre 0,3 e 0,7.
export function skeletonPulse(reduceMotion) {
  if (reduceMotion) return { animate: false, opacity: 0.5 };
  return { animate: true, opacity: 0.3, from: 0.3, to: 0.7 };
}
