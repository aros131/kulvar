"use client";

import { Player } from "@lottiefiles/react-lottie-player";

export default function LottieIlerleme() {
  return (
    <Player
      autoplay
      loop
      src="/lotties/ilerleme.json"
      style={{ height: 200, width: 200 }}
    />
  );
}
