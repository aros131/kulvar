"use client";

import { Player } from "@lottiefiles/react-lottie-player";

export default function LottieTopluluk() {
  return (
    <Player
      autoplay
      loop
      src="/lotties/topluluk.json"
      style={{ height: 200, width: 200 }}
    />
  );
}
