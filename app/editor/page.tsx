import {
    ArrowRight,
    CurlyBraces,
    EllipsisVertical,
    FolderOpen,
    Package,
    Package2,
    PackageOpen,
    PackagePlus,
    PackageSearch,
    Pencil,
    Upload,
    UploadCloud,
    X
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface RecentCrates {
    id: string
    name: string
    lastOpened: Date
}

const demoRecentCrates: RecentCrates[] = [
    {
        id: "123456",
        name: "My Research Data",
        lastOpened: new Date()
    },
    {
        id: "abcde",
        name: "Quantum Mechanics for React",
        lastOpened: new Date("01.01.1970")
    },
    {
        id: "fff",
        name: "React for Quantum Mechanics",
        lastOpened: new Date("10.23.2001")
    }
]

export default function EditorLandingPage() {
    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex flex-col items-center justify-center h-[max(45vh,200px)] p-10">
                <Package className="w-32 h-32 mb-10" />
                <h2 className="text-5xl font-bold">Editor Name</h2>
            </div>
            <div className="flex justify-center">
                <Button size="lg" variant="outline" className="border-r-0 rounded-r-none h-16">
                    <UploadCloud className="w-6 h-6 mr-3" /> Upload Crate
                </Button>
                <Button size="lg" variant="outline" className="rounded-none border-r-0 h-16">
                    <FolderOpen className="w-6 h-6 mr-3" /> Open Folder
                </Button>
                <Button size="lg" variant="outline" className="rounded-l-none h-16">
                    <PackagePlus className="w-6 h-6 mr-3" /> Start from Scratch
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
                                    <td>{recentCrate.name}</td>
                                    <td>{recentCrate.lastOpened.toLocaleString()}</td>
                                    <td className="flex gap-2">
                                        <Button>Open</Button>
                                        <Button variant="outline" size="icon">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col items-center text-muted-foreground">
                <div>Editor Name v0.0.0 (editor.example.org)</div>
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-success mt-[7px]"></div>{" "}
                    <div>Connected to ro-crate-rest.example.org</div>
                </div>
            </div>
        </div>
    )
}
