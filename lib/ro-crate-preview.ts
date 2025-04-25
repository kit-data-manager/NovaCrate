export async function generateCratePreview(crateData: ICrate) {
    const { ROCrate } = await import("ro-crate")
    const { Preview } = await import("ro-crate-html")

    const crate = new ROCrate(structuredClone(crateData))
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
    
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <script src="${templateParams.render_script}"></script>
    
    <meta charset='utf-8'/>
    <style>
        table.table {
            padding-bottom: 300px;
        }
    </style>
</head>


<body>
    <div class="container">
    <nav class="navbar" style="margin-top: 20px;">
        <ul class="nav navbar-nav" >
            <li><a href="#"><span class="glyphicon glyphicon-home dataset_name">Back to root</span></a></li>
        </ul>
    </nav>
    
    <div class="jumbotron">
        <h4 class="item_name"></h4>
        <div id="check"></div>
        </div>
    
        <div id="summary">
            ${templateParams.html}
        </div>
    </div>
</body>
</html>
       `

    return new Blob([previewPage], { type: "text/html;charset=utf-8" })
}
