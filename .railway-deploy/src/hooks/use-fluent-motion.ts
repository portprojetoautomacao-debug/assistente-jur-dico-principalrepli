import { useReducedMotion } from "framer-motion";

export const fluentTransitions = {
  standard: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  emphasized: {
    duration: 0.4,
    ease: [0.2, 0, 0, 1] as [number, number, number, number],
  },
  decelerate: {
    duration: 0.25,
    ease: [0, 0, 0.2, 1] as [number, number, number, number],
  },
  accelerate: {
    duration: 0.2,
    ease: [0.4, 0, 1, 1] as [number, number, number, number],
  },
};

export const fluentVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  fadeInScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 40 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  },
  scaleIn: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },
  reveal: {
    initial: { clipPath: "inset(0 100% 0 0)" },
    animate: { clipPath: "inset(0 0% 0 0)" },
    exit: { clipPath: "inset(0 0 0 100%)" },
  },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function useFluentMotion() {
  const shouldReduceMotion = useReducedMotion();

  return {
    transitions: shouldReduceMotion ? { duration: 0.01 } : fluentTransitions,
    variants: shouldReduceMotion ? { initial: {}, animate: {}, exit: {} } : fluentVariants,
    shouldReduceMotion,
  };
}
