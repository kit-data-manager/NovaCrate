import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import FaroMonitoring from "@/components/monitoring/faro"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "NovaCrate - RO-Crate Editor"
}

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className="w-full h-full" suppressHydrationWarning>
            <body className={"w-full h-full " + inter.className}>
                <FaroMonitoring />
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <TooltipProvider>{children}</TooltipProvider>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    )
}
