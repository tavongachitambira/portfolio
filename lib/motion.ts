export const motionEase = [0.22, 1, 0.36, 1] as const
export const motionSpring = { type: "spring" as const, stiffness: 190, damping: 26, mass: 0.9 }

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: motionEase },
  }),
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" as const } },
};
