// This file defines a web worker for offloading create-verify into a different thread

import { schemaWorkerFunctions } from "./helpers"
import { workAsFunctionWorker } from "../function-worker"

workAsFunctionWorker(schemaWorkerFunctions)
