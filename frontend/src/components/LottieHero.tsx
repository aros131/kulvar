"use client";

import { Player } from "@lottiefiles/react-lottie-player";

export default function LottieHero() {
  return (
    <Player
      autoplay
      loop
      src="/lotties/IGuqTensH3.json"
      style={{ width: 300, height: 300 }}
    />
  );
}
