// This file defines a web worker for offloading OPFS operations into a different thread

import { workAsFunctionWorker } from "../function-worker"
import { opfsFunctions } from "./functions"

workAsFunctionWorker(opfsFunctions)
