import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useStore } from "zustand"
import { validationSettings } from "@/lib/state/validation-settings"

export function ValidationSettings() {
    const validationEnabled = useStore(validationSettings, (s) => s.enabled)
    const setValidationEnabled = useStore(validationSettings, (s) => s.setEnabled)

    return (
        <div className={"flex flex-col max-h-full"}>
            <h3 className="font-semibold text-2xl leading-none p-2 pl-0 pt-0 mb-2">Validation</h3>

            <div className="flex items-center gap-3">
                <Checkbox
                    id="enableValidation"
                    checked={validationEnabled}
                    onCheckedChange={setValidationEnabled}
                />
                <Label className="mb-0 pb-0" htmlFor={"enableValidation"}>
                    Enable Validation
                </Label>
            </div>
        </div>
    )
}
