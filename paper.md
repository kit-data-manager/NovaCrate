---
# Use plain text in the title; do not use backticks for code formatting.
title: 'NovaCrate: a web-editor for Research Object Crates'
tags:
  - ro-crate
  - ro
  - research
  - object
  - crate
  - editor
  - graph
  - visualize
  - nova
  - novacrate
  - web
  - browser
  - interactive
  - edit
authors:
  - name: Christopher Raquet
    orcid:  0009-0003-2196-9187
    equal-contrib: true
    affiliation: 1 # (Multiple affiliations must be quoted)
affiliations:
 - name: Karlsruhe Institute of Technology, Germany
   index: 1
   ror: 04t3en479
date: 2026
bibliography: paper.bib
---

# Summary

Enabling a FAIR exchange of research data is a key concern of open science.
Research Object Crate (RO-Crate) is a packaging format that captures both the research data
itself and its corresponding structured metadata in one single file, supporting the
exchange, reuse, and machine-actionability of scientific data. For wide community adoption,
RO-Crates must be tangible for researchers, data stewards, and curators. For this purpose we present
NovaCrate, a web-based tool for creating, editing, and visualizing RO-Crates.


# Statement of need

Research Object Crate (RO-Crate) is a specification for packaging research data together 
with its metadata in one self-contained FAIR Digital Object (FDO). For wide community adoption, 
the format must be tangible for its users, allowing researchers, data stewards, and curators to
interactively create, edit, explore, and validate RO-Crates.

For this purpose we present NovaCrate, a web-based editor for viewing, editing, and 
validating RO-Crates.
The Entity Editor is the core piece of NovaCrate. It allows editing all metadata 
entities through a tabbed interface, including property validation, dynamic property type 
fetching, description fetching, and file previews.
Other features of NovaCrate include a File Explorer, a Graph of the metadata relationships, 
and an agentic AI Assistant.
NovaCrate emphasises an intuitive user interface as well as good usability. This is vital 
to ensure the accessibility of the editor for a wide range of people with varying knowledge
of the RO-Crate specification.

By allowing researchers to directly interact with the metadata of their RO-Crates, NovaCrate 
makes the RO-Crate concept tangible. NovaCrate is equipped with the groundwork to further 
extend it for distributed and collaborative workflows, e.g., through the integration of 
NovaCrate into RO-Crate repositories.

# State of the field

There are currently three distinct editors available for working with RO-Crates.
There are NovaCrate, Crate-O [cite], and Describo [cite]. While the Describo editor has been
discontinued, parts of it have been integrated into other applications to edit
the metadata of an RO-Crate. [cite Describo discontinued, cite RO-Crate Playground]
NovaCrate is the newest addition in the field and has been developed after it was found
that current editors (which were Describo and Crate-O at the time) are lacking [alt?] in
terms of usability and portability. Both Describo and Crate-O are only able to run in
Chromium-based browsers.

Numerous software packages exist to manipulate RO-Crates programmatically, but serve
a different purpose than the graphical editors. While they would directly be used in
automation scripts and research data pipelines, graphical editors cannot serve as 
tools for automation and are rather used for the creation of individual RO-Crates, or
by developers of RO-Crate automations to check their results.

RO-Crates itself are not yet the standard for packaging and exchanging research data,
but graphical editors like NovaCrate enable adopters of the format to get familiar with
it in a directly tangible way.

# Software design

The core princinples of NovaCrate that were set from the very beginning are:
(1) the editor must be useable in all common browser environments (2) the editor
should not depend on a specific RO-Crate package (3) the editor should have a
high degree of usability. The software architecture of NovaCrate is designed
around these principles. NovaCrate can be seperated into a backend and frontend, 
where the frontend is responsible for providing the editors UI user-directed
functionalities, and the backend is responsible for handling the actual RO-Crate.
The backend and the frontend are cleanly separated, and the frontend does not need
to know where the backend is executed and how data is exchanged between backend
and frontend. In its current implementation, the backend of NovaCrate runs directly
in the browser in a separate process (a WebWorker [cite]). In its early development,
the backend was provided by a Java Spring server, but this was abolished early on
due to performance implications. This architecture allows NovaCrate to be adapted to
different execution environments, like (1) as a desktop application with direct manipulation
of RO-Crates on the file system (2) as an embedded tool in RO-Crate repositories
to inspect and possibly manipulate RO-Crates in the repository.

The frontend of NovaCrate is further divided into a typical Model-View-Controller architecture.
The global state is stored in several distinct state stores [slices pattern] that do not
depend on each other. The view is built using the component-based frontend library React, which
allows declaring reusable components that can be placed anywhere throughout the application.
The controller-part of the MVC achitectural pattern is not discretely implemented, but rather
consists of state manipulation actions in the state stores or of component hooks (reusable
functions integrated into the React lifecycle). NovaCrate implements its own "actions" system
similar to those seen in popular code IDEs, where actions can be centrally defined and activated
based on global state, and can then be called from anywhere.

Care was taken to make sure the frontend of NovaCrate is usable without much of an introduction
and that it is responsive. The design of the editor is based on best practices established in [cite]
and was tested in a small internal user study as outlined in [BA].

# Research impact statement

Measuring research impact of a visual tool like NovaCrate comes with some implications. For one, we
do not expect to receive citations from individuals that use NovaCrate only infrequently or as part of
a one-off inspection of their RO-Crates. Even researchers that use NovaCrate as part of their daily work
may not cite it in their works, as it most likely does not contribute to the work itself, and only to
associated research data management. But we believe that research data management and especially open
research exchange is absolutely necessary to increase reproducibility and reusability in science, as 
envisioned by the FAIR principles.

We record anonymous usage numbers of the official NovaCrate instance, although they are not publicly
visible. The results are cleaned of bots, scrapers, and uptime monitors automatically on a best-effort basis.
See an excerpt of the results in the table below:

| Time Frame | Metric                                             | Value | Notes |
|------------|----------------------------------------------------|-------|-------|
| 1 Month    | Unique Users visiting the landing page             | 970   |       |
| 1 Month    | Unique Users visiting the main menu                | 161   |       |
| 1 Month    | Unique Users actively using the editor             | 52    |       |
| 1 Month    | Total number of sessions actively using the editor | 1831  |       |

Time Frame is one month, from 3.11.2026 to 4.10.2026.

# Citations

Citations to entries in paper.bib should be in
[rMarkdown](http://rmarkdown.rstudio.com/authoring_bibliographies_and_citations.html)
format.

If you want to cite a software repository URL (e.g. something on GitHub without a preferred
citation) then you can do it with the example BibTeX entry below for @fidgit.

For a quick reference, the following citation commands can be used:
- `@author:2001`  ->  "Author et al. (2001)"
- `[@author:2001]` -> "(Author et al., 2001)"
- `[@author1:2001; @author2:2001]` -> "(Author1 et al., 2001; Author2 et al., 2002)"

# Figures

Figures can be included like this:
![Caption for example figure.\label{fig:example}](figure.png)
and referenced from text using \autoref{fig:example}.

Figure sizes can be customized by adding an optional second parameter:
![Caption for example figure.](figure.png){ width=20% }

# AI usage disclosure



# Acknowledgements



# References
