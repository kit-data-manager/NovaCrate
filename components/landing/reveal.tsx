import React, { ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
    const reducedMotion = useReducedMotion()
    if (reducedMotion) {
        return <div className={className}>{children}</div>
    }
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    )
}
