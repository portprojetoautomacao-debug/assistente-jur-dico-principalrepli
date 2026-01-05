import { fluentTransitions, fluentVariants } from "@/hooks/use-fluent-motion";
import {
  HTMLMotionProps,
  motion,
  MotionProps,
  TargetAndTransition,
  Transition,
  Variants,
} from "framer-motion";
import { ReactNode } from "react";

type FluentVariantKey = keyof typeof fluentVariants;
type FluentTransitionKey = keyof typeof fluentTransitions;

interface FluentMotionProps extends Omit<HTMLMotionProps<"div">, "transition"> {
  readonly children: ReactNode;
  readonly variant?: FluentVariantKey;
  readonly transition?: FluentTransitionKey;
  readonly delay?: number;
  readonly stagger?: boolean;
  readonly hover?: boolean;
  readonly tap?: boolean;
}

export function FluentMotion({
  children,
  variant = "fadeInUp",
  transition = "standard",
  delay = 0,
  stagger = false,
  hover = false,
  tap = false,
  ...props
}: FluentMotionProps) {
  const selectedVariant = fluentVariants[variant];
  const selectedTransition: Transition = {
    ...fluentTransitions[transition],
    delay,
  };

  const hoverEffect: TargetAndTransition | undefined = hover
    ? {
        scale: 1.02,
        transition: fluentTransitions.decelerate,
      }
    : undefined;
  const tapEffect: TargetAndTransition | undefined = tap
    ? {
        scale: 0.98,
        transition: fluentTransitions.accelerate,
      }
    : undefined;

  const variants: Variants = stagger
    ? {
        initial: selectedVariant.initial,
        animate: {
          ...selectedVariant.animate,
          transition: {
            ...selectedTransition,
            staggerChildren: 0.05,
            delayChildren: 0.1,
          },
        },
        exit: selectedVariant.exit,
      }
    : selectedVariant;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={selectedTransition}
      whileHover={hoverEffect}
      whileTap={tapEffect}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FluentStaggerItem({
  children,
  ...props
}: MotionProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FluentReveal({
  children,
  direction = "left",
  ...props
}: MotionProps &
  React.HTMLAttributes<HTMLDivElement> & {
    direction?: "left" | "right" | "up" | "down";
  }) {
  const variants = {
    left: {
      initial: { clipPath: "inset(0 100% 0 0)" },
      animate: { clipPath: "inset(0 0% 0 0)" },
    },
    right: {
      initial: { clipPath: "inset(0 0 0 100%)" },
      animate: { clipPath: "inset(0 0% 0 0)" },
    },
    up: {
      initial: { clipPath: "inset(100% 0 0 0)" },
      animate: { clipPath: "inset(0% 0 0 0)" },
    },
    down: {
      initial: { clipPath: "inset(0 0 100% 0)" },
      animate: { clipPath: "inset(0 0 0% 0)" },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants[direction]}
      transition={fluentTransitions.emphasized}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FluentFade({
  children,
  delay = 0,
  ...props
}: MotionProps & React.HTMLAttributes<HTMLDivElement> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ ...fluentTransitions.standard, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FluentSlide({
  children,
  direction = "up",
  delay = 0,
  ...props
}: MotionProps &
  React.HTMLAttributes<HTMLDivElement> & {
    direction?: "up" | "down" | "left" | "right";
    delay?: number;
  }) {
  const variants = {
    up: { initial: { y: 40, opacity: 0 }, animate: { y: 0, opacity: 1 } },
    down: { initial: { y: -40, opacity: 0 }, animate: { y: 0, opacity: 1 } },
    left: { initial: { x: 40, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    right: { initial: { x: -40, opacity: 0 }, animate: { x: 0, opacity: 1 } },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="initial"
      variants={variants[direction]}
      transition={{ ...fluentTransitions.emphasized, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FluentScale({
  children,
  delay = 0,
  ...props
}: MotionProps & React.HTMLAttributes<HTMLDivElement> & { delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ ...fluentTransitions.emphasized, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FluentHover({
  children,
  scale = 1.02,
  ...props
}: MotionProps & React.HTMLAttributes<HTMLDivElement> & { scale?: number }) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={fluentTransitions.decelerate}
      {...props}
    >
      {children}
    </motion.div>
  );
}
