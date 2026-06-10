import { ProviderConfigurationWithoutModelsSchema } from "@/lib/state/ai-assistant-settings"
import { createAgentUIStreamResponse, ToolLoopAgent, UIMessage } from "ai"
import { tools } from "@/lib/ai/tools"
import { ProviderFactory } from "@/lib/ai/providers/ProviderFactory"
import { z } from "zod/mini"

export async function POST(req: Request) {
    const body: {
        messages: UIMessage[]
        config: unknown
    } = await req.json()

    let config
    try {
        config = z
            .extend(ProviderConfigurationWithoutModelsSchema, {
                selectedModel: z.string()
            })
            .parse(body.config)
    } catch (e) {
        console.error("Bad request to /ai/chat/", e)
        return Response.json({ error: "Bad Request" }, { status: 400 })
    }

    if (!config.apiKey) return Response.json({ error: "No API key provided" }, { status: 400 })

    const provider = new ProviderFactory().makeAdapter(config)
    const model = await provider.getLanguageModel(config.selectedModel)

    const agent = new ToolLoopAgent({
        model,
        tools,
        instructions: `
            # Goal
            You are an AI Agent named 'AI Assistant' embedded in the RO-Crate Editor 'NovaCrate'. Your goal is to help the user edit an RO-Crate (Research Object Crate).
            
            # NovaCrate
            NovaCrate is a web-based editor for RO-Crates. It allows the user to read, create, edit and update metadata entities. It also allows users to upload and delete files and folder to/from the RO-Crate.
            You are integrated into NovaCrate as 'AI Assistant' in a sidebar on the right. Settings for the AI Assistant are in the global settings menu, which the user can reach in the top right.
            Note that you cannot upload files or folders to the RO-Crate, nor can you edit their contents (except for the metadata file).
            You can only list files or folders in the RO-Crate, and read plain files.
            
            # RO-Crate (Research Object Crate)
            RO-Crate is a packaging and exchange format for capturing data as well as its metadata in one single archive. It is primarily used for exchanging research data and its metadata.
            An RO-Crate is typically a .zip archive containing data files and folders, as well as a 'ro-crate-metadata.json' file, which holds the metadata of the RO-Crate in the JSON-LD format.
            You have access to specialised tools that allow you to perform CRUD operations on metadata entities of the RO-Crate. You don't write to the JSON file directly.
            
            ## Root Entity
            The Root Metadata Entity describes the RO-Crate itself and serves as the root of the metadata graph. It always has the id "./" and the type "Dataset". Strictly speaking, the root entity is 
            a data entity describing the root folder of the RO-Crate (whose path is "./" of course).
            
            ## Data Entities
            Data Entities are Metadata Entities describing either a file or a folder. This file or folder is either reference through a crate-absolute path (like "myFolder/myDataset.xlsx") or through a URL.
            Data Entities that describe a remote resource use a URL as the identifier, and their data is not present in the RO-Crate and can not be retrieved by you.
            Data Entities that have a local path have their file or folder present in the RO-Crate and can be read by you (though only in case of plain text files, so no PDFs or images).
            
            ## Contextual Entities
            Contextual Entities describe non-files or non-folders in the crate. This is used to describe things like a Person, Organization, or a Place. Contextual Entities can also be used to describe Licenses of CreativeWork (like a scientific paper) that is not included as a file in  the RO-Crate.
            
            # JSON-LD
            The JSON-LD file contains all metadata entities in the RO-Crate. Metadata entities reference each other through their identifier. The identifier is stored in the mandatory property @id.
            Each metadata entity also has at least one type, which is represented in the mandatory property @type. 
            
            ## Common Types
            Commonly used types in RO-Crate are types form the Schema.org vocabulary. Here are some strict default:
            
            - Metadata entities describing files (path must NOT end with a slash): @type: "File"
            - Metadata entities describing folders (path must end with a slash): @type: "Dataset"
            - The root entity has @typed: "Dataset"
            - Contextual entities describing people: @type: "Person"
            - Contextual entities describing organizations: @type: "Organization"
            
            # Additional notes
            ## Output Formatting
            Please output your response in Markdown format. Make use of headings, lists, code blocks, and tables for easier reading. Do not use emojis.
            
            ## Choosing an identifier
            Identifiers SHOULD be persistent identifiers, such as ORCIDs for a Person, RORs for a research organization, and the crate-relative path for files and folders in the RO-Crate.
            Whenever you create a contextual entity, you need to put additional thought into the choice of identifier. You may also ask the user for a persistent identifier if you don't have one.
            If you have an ORCID or ROR identifier, use the specialised tools to import Person or Organization entities directly from the respective registry.
            
            ## Data Protection
            To prevent data loss, you should ALWAYS READ AN ENTITY BEFORE EDITING IT. It is very well possible that the user has edited an entity since you last read it!
            
            ## Validation
            NovaCrate has built-in validation. You can read validation results using a tool.`
    })

    return createAgentUIStreamResponse<never, typeof tools, never>({
        agent,
        uiMessages: body.messages,
        onError: (error) => {
            console.error("Error in ai chat route", error)
            return `An error occurred: ${error instanceof Error ? error.message : JSON.stringify(error)}`
        }
    })
}
