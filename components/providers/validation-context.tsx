import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react"
import { ValidationProvider } from "@/lib/validation/validation-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
import {
    makeBaseValidator,
    makeSpecificationValidators
} from "@/lib/validation/validators/specification-validator"
import { useCore } from "@/components/providers/core-provider"
import { useFileService } from "@/lib/hooks/use-persistence"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { ProfileValidator } from "@/lib/validation/validators/profile-validator"
import { Validator } from "@/lib/validation/validator"

export interface ValidationContext {
    validation: ValidationProvider | undefined
}

export const ValidationContext = createContext<ValidationContext>({ validation: undefined })

export function ValidationContextProvider({ children }: PropsWithChildren) {
    const schemaWorker = useContext(SchemaWorker)
    const core = useCore()
    const editorState = useEditorState((s) => s)

    const fileService = useFileService()
    const contextService = core.getContextService()
    const profileService = core.getProfileService()

    const [profiles, setProfiles] = useState<IProfileHandler[]>(profileService.getProfiles())

    useEffect(() => {
        setProfiles(profileService.getProfiles())
        const remove1 = profileService.events.addEventListener("profiles-changed", (profiles) =>
            setProfiles(profiles)
        )
        return () => {
            remove1()
        }
    }, [profileService])

    const ctx = useMemo(() => {
        return {
            editorState,
            schemaWorker,
            fileService: fileService ?? undefined,
            resolver: contextService.getResolver(),
            context: contextService
        }
    }, [contextService, editorState, fileService, schemaWorker])

    const [validation] = useState(() => {
        const validation = new ValidationProvider(ctx)
        const specValidators = makeSpecificationValidators()
        for (const validator of specValidators) {
            validation.addValidator(validator)
        }
        validation.addValidator(makeBaseValidator())
        return validation
    })

    useEffect(() => {
        validation.updateContext(ctx)
    }, [ctx, validation])

    useEffect(() => {
        const instances: Validator[] = []
        for (const profile of profiles) {
            const inst = validation.addValidator((ctx) => new ProfileValidator(profile, ctx))
            instances.push(inst)
        }

        return () => {
            for (const instance of instances) {
                validation.removeValidator(instance)
            }
        }
    }, [profiles, validation])

    const value = useMemo(() => {
        return { validation: validation }
    }, [validation])

    return <ValidationContext.Provider value={value}>{children}</ValidationContext.Provider>
}
