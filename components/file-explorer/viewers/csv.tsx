import { useCallback, useEffect, useState } from "react"
import { ViewerProps } from "@/lib/file-preview"
import Papa from "papaparse"
import {
    OverflowTable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Error } from "@/components/error"

export function CSVViewer(props: ViewerProps) {
    const [data, setData] = useState<string[][]>([])
    const [parseError, setParseError] = useState<unknown>()

    if (parseError) console.error(parseError)

    const parseCSV = useCallback(
        (data: Blob) => {
            let abort = false
            setData([])
            Papa.parse<string[]>(new File([data], props.tab.fileName, { type: "text/csv" }), {
                step(step, parser) {
                    if (abort) return parser.abort()

                    if (step.errors.length > 0) setParseError(step.errors)
                    if (step.data) setData((prev) => [...prev, step.data])
                },
                error(err) {
                    setParseError(err)
                },
                header: false
            })

            return () => {
                abort = true
            }
        },
        [props.tab.fileName]
    )

    useEffect(() => {
        if (props.data) {
            return parseCSV(props.data)
        }
    }, [parseCSV, props.data])

    if (!props.data) return null

    return (
        <div className="">
            <div>
                <Error title={"Failed to parse CSV"} error={parseError} />
                <OverflowTable>
                    <TableHeader>
                        {data.slice(0, 1).map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <TableHead key={cellIndex}>{cell}</TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {data.slice(1).map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <TableCell key={cellIndex}>{cell}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </OverflowTable>
            </div>
        </div>
    )
}
