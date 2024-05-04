"use client"

import {
    Blocks,
    BookOpen,
    ChevronDown,
    Cog,
    EllipsisVertical,
    FolderOpen,
    Moon,
    Package,
    PackageOpen,
    PackagePlus,
    Sun
} from "lucide-react"
import { Button } from "@/components/ui/button"
import packageJson from "@/package.json"
import { useTheme } from "next-themes"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useFilePicker } from "use-file-picker"
import { useCallback, useEffect, useRef, useState } from "react"
import { RestProvider } from "@/lib/rest-provider"
import { useRouter } from "next/navigation"
import { Error } from "@/components/error"
import { useAsync } from "@/components/use-async"

interface RecentCrates {
    id: string
    name: string
    lastOpened: Date
}

const demoRecentCrates: RecentCrates[] = [
    {
        id: "448b5807-c3db-4297-81d3-54103d3b885a",
        name: "My Research Data",
        lastOpened: new Date("04.10.2024 14:32:21")
    },
    {
        id: "d4388eb2-d363-4786-94fa-8da508f02ea6",
        name: "Quantum Mechanics for React",
        lastOpened: new Date("04.09.2024 17:21:43")
    },
    {
        id: "bcbabcca-5233-4978-9104-b37fcb1fda57",
        name: "React for Quantum Mechanics",
        lastOpened: new Date("04.03.2024 09:11:03")
    }
]

export default function EditorLandingPage() {
    const router = useRouter()
    const theme = useTheme()
    const [error, setError] = useState("")
    const serviceProvider = useRef(new RestProvider())
    const { openFilePicker, plainFiles } = useFilePicker({
        accept: ".zip"
    })

    const redirectToCrate = useCallback(
        (id: string) => {
            if (id !== "undefined") router.push(`/editor/${id}/entities`)
        },
        [router]
    )

    const createEmptyCrate = useCallback(() => {
        if (serviceProvider.current) {
            serviceProvider.current
                .createCrate()
                .then((id) => {
                    redirectToCrate(id)
                })
                .catch((e) => {
                    setError(e.toString())
                })
        }
    }, [redirectToCrate])

    const createCrateFromCrateZip = useCallback(() => {
        if (plainFiles.length > 0 && serviceProvider.current) {
            serviceProvider.current
                .createCrateFromCrateZip(plainFiles[0])
                .then((id) => {
                    redirectToCrate(id)
                })
                .catch((e) => {
                    setError(e.toString())
                })
        }
    }, [plainFiles, redirectToCrate])

    useEffect(() => {
        if (plainFiles.length > 0 && serviceProvider.current) {
            createCrateFromCrateZip()
        }
    }, [createCrateFromCrateZip, plainFiles])

    const storedCratesResolver = useCallback(async () => {
        if (serviceProvider.current) {
            return await serviceProvider.current.getStoredCrateIds()
        }

        return []
    }, [])

    const {
        data: storedCrates,
        error: storedCratesError,
        isPending: storedCratesIsPending
    } = useAsync("", storedCratesResolver)

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex flex-col items-center justify-center h-[max(45vh,200px)] p-10">
                <Package className="w-32 h-32 mb-10" />
                <h2 className="text-5xl font-bold">Editor Name</h2>
            </div>
            <Error text={error} />
            <div className="flex justify-center">
                <Button
                    size="lg"
                    variant="outline"
                    className="border-r-0 rounded-r-none h-16"
                    onClick={() => openFilePicker()}
                >
                    <PackageOpen className="w-6 h-6 mr-3" /> Import Crate
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-none border-r-0 h-16"
                        >
                            <PackagePlus className="w-6 h-6 mr-3" /> New Crate{" "}
                            <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={createEmptyCrate}>
                            <PackagePlus className="w-4 h-4 mr-2" />
                            Empty Crate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <FolderOpen className="w-4 h-4 mr-2" /> From Folder
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Blocks className="w-4 h-4 mr-2" /> Examples
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem>
                                    <Blocks className="w-4 h-4 mr-2" /> Example One
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button size="lg" variant="outline" className="rounded-none border-r-0 h-16">
                    <BookOpen className="w-6 h-6 mr-3" /> Documentation
                </Button>
                <Button size="lg" variant="outline" className="rounded-none border-r-0 h-16">
                    <Cog className="w-6 h-6 mr-3" /> Settings
                </Button>
                <Button
                    size="icon"
                    variant="outline"
                    className="rounded-l-none h-16 w-16"
                    onClick={() => theme.setTheme(theme.theme === "light" ? "dark" : "light")}
                    suppressHydrationWarning
                >
                    {theme.theme === "light" ? (
                        <Sun className="w-6 h-6" suppressHydrationWarning />
                    ) : (
                        <Moon className="w-6 h-6" suppressHydrationWarning />
                    )}
                </Button>
            </div>
            <div className="flex justify-center p-20">
                <table className="w-[min(90vw,1000px)] rounded-lg [&_td]:border-t [&_td]:p-2 [&_th]:p-2 [&_th]:text-left">
                    <thead>
                        <tr>
                            <th className="w-0"></th>
                            <th>Recent Crates</th>
                            <th>Last Opened</th>
                            <th className="w-0">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {demoRecentCrates.map((recentCrate) => {
                            return (
                                <tr key={recentCrate.id}>
                                    <td>
                                        <Package className="w-4 h-4" />
                                    </td>
                                    <td>
                                        <div>{recentCrate.name}</div>
                                        <div className="text-muted-foreground text-xs flex items-center">
                                            {recentCrate.id}
                                        </div>
                                    </td>
                                    <td>{recentCrate.lastOpened.toLocaleString()}</td>
                                    <td className="flex gap-2">
                                        <Button>Open</Button>
                                        <Button variant="outline" size="icon">
                                            <EllipsisVertical className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center p-20 pt-0">
                <table className="w-[min(90vw,1000px)] rounded-lg [&_td]:border-t [&_td]:p-2 [&_th]:p-2 [&_th]:text-left">
                    <thead>
                        <tr>
                            <th className="w-0"></th>
                            <th>Your Crates</th>
                            <th>Last Opened</th>
                            <th className="w-0">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {demoRecentCrates.map((recentCrate) => {
                            return (
                                <tr key={recentCrate.id}>
                                    <td>
                                        <Package className="w-4 h-4" />
                                    </td>
                                    <td>
                                        <div>{recentCrate.name}</div>
                                        <div className="text-muted-foreground text-xs flex items-center">
                                            {recentCrate.id}
                                        </div>
                                    </td>
                                    <td>{recentCrate.lastOpened.toLocaleString()}</td>
                                    <td className="flex gap-2">
                                        <Button>Open</Button>
                                        <Button variant="outline" size="icon">
                                            <EllipsisVertical className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col items-center text-muted-foreground pb-4">
                <div>
                    {packageJson.name} v{packageJson.version}
                </div>
            </div>
        </div>
    )
}
