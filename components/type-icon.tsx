import {
    BookMarked,
    Building,
    Contact,
    FileIcon,
    FolderOpen,
    GraduationCap,
    LucideIcon,
    MapPin,
    Shapes,
    User
} from "lucide-react"
import {
    RO_CRATE_DATASET,
    RO_CRATE_FILE,
    SCHEMA_ORG_CONTACT_POINT,
    SCHEMA_ORG_CREATIVE_WORK,
    SCHEMA_ORG_ORGANIZATION,
    SCHEMA_ORG_PERSON,
    SCHEMA_ORG_PLACE,
    SCHEMA_ORG_SCHOLARLY_ARTICLE
} from "@/lib/constants"
import { useEditorState } from "@/lib/state/editor-state"

export const CommonIcons: Record<string, LucideIcon> = {
    [SCHEMA_ORG_PERSON]: User,
    [SCHEMA_ORG_PLACE]: MapPin,
    [SCHEMA_ORG_CREATIVE_WORK]: BookMarked,
    [SCHEMA_ORG_ORGANIZATION]: Building,
    [SCHEMA_ORG_SCHOLARLY_ARTICLE]: GraduationCap,
    [SCHEMA_ORG_CONTACT_POINT]: Contact,
    [RO_CRATE_FILE]: FileIcon,
    [RO_CRATE_DATASET]: FolderOpen
}

/**
 * Hook to retrieve the icon for a given type. Will resolve the type name in the local context if
 * necessary
 * @param type Type, either the name (e.g. Person) or the full URL (e.g. https://schema.org/Person)
 */
export function useTypeIcon(type: string) {
    const context = useEditorState.useCrateContext()

    const icon = CommonIcons[type.startsWith("http") ? type : context.resolve(type) || type]
    if (icon) {
        return icon
    } else return Shapes
}
