export async function generateCratePreview(crateData: ICrate) {
    const { ROCrate } = await import("ro-crate")
    const { Preview } = await import("ro-crate-html")

    const crate = new ROCrate(crateData)
    const preview = new Preview(crate)

    const templateParams = preview.templateParams()
    const previewPage = `
<html lang="en">
<head>
    <script type="application/ld+json"> 
        ${templateParams.json_ld}
    </script>
    <title>
        ${templateParams.dataset_name}
    </title>
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <script src="${templateParams.render_script}"></script>
    
    <meta charset='utf-8'/>
    <style>
        body {
            font-family: sans-serif;
        }
        
        table.table {
            padding-bottom: 300px;
        }
    </style>
</head>


<body>
    <nav class="flex items-center justify-between flex-wrap bg-teal-500 p-6">
        <div class="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
            <div class="text-sm lg:flex-grow">
                <a href="" class="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4"><span class="glyphicon glyphicon-home dataset_name">&nbsp; Home</a></span></a>
            </div>
            <div class="text-sm lg:flex-grow">
                <a href="">⬇️🏷️ Download metadata</a>
            </div>
        </div>
    </nav>
    
    <div>This preview was generated from NovaCrate using ro-crate-html</div>
    
    
    <h1>${templateParams.dataset_name}</h1>
    
    <div class="container">
        <div class="jumbotron">
        <h4 class="item_name"></h4>
        <div id="check"></div>
    </div>
    
    <div id="summary">
        ${templateParams.html}
    </div>
</body>
</html>
       `

    return new Blob([previewPage], { type: "text/html;charset=utf-8" })
}
