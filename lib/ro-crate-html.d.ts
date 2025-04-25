declare module "ro-crate-html" {
    import { ROCrate } from "ro-crate"

    type TemplateParams = {
        html: string
        json_ld: string
        dataset_name: string
        render_script: string
    }

    export class Preview {
        constructor(crate: ROCrate)
        templateParams(): TemplateParams
    }
}
