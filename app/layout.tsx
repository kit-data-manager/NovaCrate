import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "NovaCrate - Web-based Editor for Research Object Crates",
    description:
        "NovaCrate is a web-based interactive editor for editing, visualizing and validating Research Object Crates directly in the browser. Easily create RO-Crates describing your research data and export to a variety of file-formats.",
    applicationName: "NovaCrate",
    keywords: [
        "novacrate",
        "ro-crate",
        "ro",
        "research",
        "object",
        "crate",
        "editor",
        "graph",
        "visualize",
        "validation",
        "nova",
        "web",
        "browser",
        "interactive",
        "edit"
    ],
    robots: "index, follow",
    creator: "Christopher Raquet, Karlsruhe Institute of Technology",
    publisher: "Karlsruhe Institute of Technology",
    alternates: {
        canonical: "https://novacrate.datamanager.kit.edu/"
    }
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
