declare module 'vanta/dist/vanta.dots.min' {
  interface VantaEffect {
    setOptions: (options: unknown) => void;
    destroy: () => void;
  }

  const dots: (options?: unknown) => VantaEffect;
  export default dots;
}
