declare module "ro-crate-html/lib/ro-crate-preview.js" {
    import { ROCrate } from "ro-crate"

    type TemplateParams = {
        html: string
        json_ld: string
        dataset_name: string
        render_script: string
    }

    export default class Preview {
        constructor(crate: ROCrate)
        templateParams(): TemplateParams
    }
}
