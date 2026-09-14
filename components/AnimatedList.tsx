
import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/motionPresets';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * Staggered-animation list wrapper using Framer Motion.
 * Items appear one-by-one with spring physics on mount.
 * Falls back to a plain div for non-motion-compatible wrappers.
 */
export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className = '',
  as: Component = 'div'
}) => {
  // Wrap each direct child in a motion.div with staggered variant
  const childArray = React.Children.toArray(children);

  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {childArray.map((child, i) => (
        <motion.div key={(child as any)?.key ?? i} variants={staggerItem}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
