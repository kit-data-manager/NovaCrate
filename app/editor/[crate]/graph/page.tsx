import LayoutFlow from "@/components/graph/entity-graph"
import { metadata } from "@/lib/metadata"

export const generateMetadata = metadata("Graph")

export default function Graph() {
    return (
        <div className="w-full h-full">
            <LayoutFlow />
        </div>
    )
}
