import LayoutFlow from "@/components/graph/entity-graph"
import { GitFork } from "lucide-react"

export default function Graph() {
    return (
        <div className="w-full h-full">
            <div className="pl-4 bg-accent text-sm h-10 flex items-center">
                <GitFork className="w-4 h-4 shrink-0 mr-2" /> Entity Graph
            </div>
            <LayoutFlow />
        </div>
    )
}
