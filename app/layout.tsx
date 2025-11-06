import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "NovaCrate - RO-Crate Editor",
    description: "Web-based interactive editor for editing, visualizing and validating RO-Crates.",
    applicationName: "NovaCrate",
    keywords: [
        "ro-crate",
        "ro",
        "research",
        "object",
        "crate",
        "editor",
        "graph",
        "visualize",
        "nova",
        "novacrate",
        "web",
        "browser",
        "interactive",
        "edit",
        "next",
        "nextjs",
        "react"
    ]
}

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className="w-full h-full" suppressHydrationWarning>
            <body className={"w-full h-full " + inter.className}>
                <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
                    <TooltipProvider>{children}</TooltipProvider>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    )
}
