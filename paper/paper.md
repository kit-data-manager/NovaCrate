---
# Use plain text in the title; do not use backticks for code formatting.
title: 'NovaCrate: a web-editor for Research Object Crates'
tags:
  - ro-crate
  - editor
  - graph
  - fair
  - rdm
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
NovaCrate, a web-based tool for creating, editing, and visualizing RO-Crates. NovaCrate is an open-source
project licensed under the Apache 2.0 license. The source code is available on [GitHub](https://github.com/kit-data-manager/NovaCrate) 
and archived on Zenodo with the
DOI [10.5281/zenodo.15183573](https://doi.org/10.5281/zenodo.15183573). An official instance is
hosted at [novacrate.datamanager.kit.edu](https://novacrate.datamanager.kit.edu/editor/).


# Statement of need

RO-Crate [@sefton_ro-crate_2026] is a specification for packaging research data together 
with its metadata in one self-contained FAIR Digital Object (FDO). For wide community adoption, 
the format must be tangible for its users, allowing researchers, data stewards, and curators to
interactively create, edit, explore, and validate RO-Crates.

NovaCrate allows researchers to directly interact with the metadata of their RO-Crate, which 
makes the RO-Crate concept tangible. It is further equipped with the groundwork to be 
extended for distributed or collaborative workflows, e.g., through the integration of 
NovaCrate into RO-Crate repositories or workflow engines. NovaCrate emphasizes an intuitive 
user interface as well as good usability. This is vital
to ensure the accessibility of the editor for a wide range of people, with little to no
knowledge of the RO-Crate specification required.

# State of the field

There are currently three distinct editors available for working with RO-Crates: 
NovaCrate, Crate-O [@peter_sefton_and_contributors_crate-o_2025], and Describo [@marco_la_rosa_and_contributors_describo_2023], although Describo was discontinued
in 2025.
NovaCrate is the newest addition to the field and was developed from the ground up
with improved portability, usability, and maintainability in mind. The efforts that were
made to achieve all three points are outlined in \autoref{software-design}.

Numerous software packages exist to manipulate RO-Crates programmatically, such as
ro-crate-java [@tzochev_ro-crate-java_2026], ro-crate-js [@sebastian_ro-crate-js_2026], ro-crate-py [@bauer_ro-crate-py_2026], and ro-crate-rs [@burridge_ro-crate-rs_2026].

The RO-Crate specification was originally published in 2019. The specification has reached version 1.3.0 at the time of
writing [@sefton_ro-crate_2026]. A rich ecosystem of services and tools has already emerged to support researchers, data
stewards and software developers, as outlined in the tools list [@noauthor_tools_2026] on the RO-Crate website. NovaCrate contributes to this ecosystem by allowing users
to directly visualize and interact with the metadata of an RO-Crate. It can not only be used to
create RO-Crates from research data, but also e.g. for verifying the results of automated RO-Crate pipelines
by developers. NovaCrate can further be directly embedded in RO-Crate repositories or workflow engines for seamless integration.

# Features

The Entity Editor is the core piece of NovaCrate. It allows editing all metadata
entities through a tabbed interface, including property validation, dynamic property type
fetching, description fetching, and file previews.
Other features of NovaCrate include a File Explorer, a Graph of the metadata relationships,
and an agentic AI Assistant.

# Software design

The core principles of NovaCrate that were set from the very beginning are:

- The editor must be usable in all common browser environments 
- The editor should not depend on a specific RO-Crate package 
- The editor should have a high degree of usability. 

The software architecture of NovaCrate is designed
around these principles. NovaCrate can be separated into a backend and frontend, 
where the frontend is responsible for providing the editor's UI
functionalities, and the backend is responsible for handling the RO-Crate data and metadata.
The backend and the frontend are cleanly separated, and the frontend does not need
to know where the backend is executed and how data is exchanged between backend
and frontend. In its current implementation, the backend of NovaCrate runs directly
in the browser in a separate process. In its early development,
the backend was provided by a Java Spring server, but this was abandoned
due to performance and portability implications. This architecture allows NovaCrate to be adapted to
different environments, such as:

- A desktop application with direct manipulation of RO-Crates on the file system
- An embedded tool in RO-Crate repositories to inspect and possibly manipulate RO-Crates in the repository
- A standalone web application with a browser-based file system

The frontend of NovaCrate is further divided into a typical Model-View-Controller architecture.
The global state is stored in several distinct state stores that do not
depend on each other. The view is built using the component-based frontend library React [@meta_open_source_react_nodate], which
allows declaring reusable components that can be placed anywhere throughout the application.
The controller-part of the MVC architectural pattern is not discretely implemented, but rather
consists of state manipulation actions in the state stores or of component hooks (reusable
functions integrated into the React lifecycle). NovaCrate implements its own "actions" system
similar to those seen in popular code IDEs, where actions can be centrally defined and activated
based on global state, and can then be called from anywhere.

With the recent addition of an agentic AI Assistant within NovaCrate, it was shown that all of the
editor's capabilities can easily be called by an AI agent. This indicated a properly working separation
between UI and functionality and a healthy and maintainable architecture.

Care was taken to make sure the frontend of NovaCrate is usable without much of an introduction
and that it is responsive. The design of the editor is based on best practices established in the books
of Krug [@krug_dont_2014], Valencia [@valencia_designing_2019], and Shneiderman et al. [@shneiderman_designing_2017]
and was tested in a small internal user study as outlined in the bachelor thesis in which NovaCrate
was initially developed [@raquet_design_2024].


# Research impact statement

We believe that research data management and especially open
research exchange is absolutely necessary to increase reproducibility and reusability in open science, as 
envisioned by the FAIR principles.

To understand the usage of our tools, we record anonymous usage numbers of the official NovaCrate instance.
The results are not publicly accessible for privacy reasons. Bots, scrapers, and uptime monitors are automatically 
removed from the statistics on a best-effort basis.

See an excerpt of the results in the table below:

| Time Frame | Metric                                             | Value | Notes |
|------------|----------------------------------------------------|-------|-------|
| 1 Month    | Unique Users visiting the landing page             | 1070   |       |
| 1 Month    | Unique Users visiting the main menu                | 195   |       |
| 1 Month    | Unique Users actively using the editor             | 71    |       |
| 1 Month    | Total number of sessions in the editor | 179  |       |
| 1 Month    | Chat Messages sent to the AI Assistant | 103  |       |

- Unique users are estimated by counting unique IP-Addresses
- Sessions are counted through the number of times the worker script for the editor was loaded. We assume that it stays in cache for the duration of one working session, e.g. one day of work within NovaCrate

Time Frame is one month, from 18th of October to the 17th of November 2026.

# AI usage disclosure

Several different AI models were used throughout the recent development of NovaCrate to aid
with code generation. The general software architecture was designed without AI help. AI code was always
cautiously reviewed and tested through the included extensive test suite.

While it is not possible to fully reconstruct which AI models were used throughout the development
of NovaCrate, the following models were in use at some point:

- DeepSeek v4.1 Flash
- DeepSeek v4 Flash
- GLM v5.3 Flash
- GLM v5.2
- Claude Opus 4.8
- GitHub Copilot

The following models were used for proofreading the contents of this paper:

- DeepSeek v4.1 Flash

# Acknowledgements

We acknowledge the contribution to NovaCrate from River Tae Smith, as well as all bug reports and feedback
received from the RO-Crate community. NovaCrate is part of the Helmholtz Cloud and is funded by the [FAIR Data Commons](https://helmholtz-metadaten.de/fair-data-commons/overview) project of the [Helmholtz Metadata Collaboration](https://helmholtz-metadaten.de/). Numerous people, including but not limited to Thomas Jejkal, Maximilian Inckmann, Rossella Aversa, Andreas Pfeil, Sabrine Chelbi, Gabin Thibaut Oumbe Tekam, from the department of Data Exploitation Methods at the Scientific Computing Center of Karlsruhe Institute of Technology have played a significant role in the development and dissemination of NovaCrate.

# References
