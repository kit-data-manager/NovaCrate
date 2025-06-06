import { toArray } from "@/lib/utils"
import React, {
    ChangeEvent,
    PropsWithChildren,
    ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

const DEFAULT_PAGE_SIZE = 10

export function Pagination({
    children,
    pageSize = DEFAULT_PAGE_SIZE,
    leftContent
}: PropsWithChildren<{
    pageSize?: number
    leftContent?: ReactElement
}>) {
    const [page, setPage] = useState(0)
    const [jumpToPageValue, setJumpToPageValue] = useState("1")

    const jumpToPageChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setJumpToPageValue(e.target.value)
    }, [])

    const lastChildrenLength = useRef(-1)
    const childrenLength = useMemo(() => {
        if (
            children &&
            typeof children === "object" &&
            "length" in children &&
            typeof children.length === "number"
        )
            return children.length
        else return 1
    }, [children])

    const active = useMemo(() => {
        return childrenLength > pageSize
    }, [childrenLength, pageSize])

    const pageCount = useMemo(() => {
        return Math.floor((childrenLength - 1) / pageSize) + 1
    }, [childrenLength, pageSize])

    useEffect(() => {
        if (lastChildrenLength.current >= 0) {
            // If last children length was 1 or less, assume it was just a loading skeleton -> do not jump to last page
            if (childrenLength > lastChildrenLength.current && lastChildrenLength.current > 1) {
                setPage(pageCount - 1)
            }
        }
        lastChildrenLength.current = childrenLength
    }, [childrenLength, pageCount])

    useEffect(() => {
        if (page >= pageCount) {
            setPage(pageCount - 1)
        }
    }, [page, pageCount])

    const jumpToPage = useCallback(() => {
        const val = parseInt(jumpToPageValue)
        if (isNaN(val)) return
        if (val < 1 || val > pageCount) return
        setPage(val - 1)
    }, [jumpToPageValue, pageCount])

    const jumpToPageKeyHandler = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                jumpToPage()
            }
        },
        [jumpToPage]
    )

    const nextPage = useCallback(() => {
        if (page < pageCount - 1) {
            setPage(page + 1)
        }
    }, [page, pageCount])

    const previousPage = useCallback(() => {
        if (page > 0) {
            setPage(page - 1)
        }
    }, [page])

    const sliceStart = useMemo(() => {
        return page * pageSize
    }, [page, pageSize])

    const sliceEnd = useMemo(() => {
        return (page + 1) * pageSize
    }, [page, pageSize])

    return active ? (
        <>
            {toArray(children).slice(sliceStart, sliceEnd)}
            <div className="flex justify-between items-start">
                {leftContent ? <div className="mt-[-16px]">{leftContent}</div> : <div />}
                <div className="flex">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-r-none"
                        onClick={previousPage}
                    >
                        <ChevronLeft className="size-4 shrink-0" />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-l-0 border-r-0 rounded-none"
                            >
                                {page + 1}
                                <span className="text-muted-foreground ml-1"> / {pageCount}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 grid grid-cols-1 gap-2 mr-10">
                            <h4 className="font-medium leading-none"> Jump to Page</h4>
                            <div className="flex">
                                <Input
                                    type="number"
                                    className="rounded-r-none"
                                    value={jumpToPageValue}
                                    onChange={jumpToPageChangeHandler}
                                    onKeyDown={jumpToPageKeyHandler}
                                />
                                <Button className="border-l-0 rounded-l-none" onClick={jumpToPage}>
                                    <ArrowRight className="size-4" />
                                </Button>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                There are {pageCount} pages with {pageSize} entries per page. In
                                total, there are {childrenLength} entries.
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-l-none"
                        onClick={nextPage}
                    >
                        <ChevronRight className="size-4 shrink-0" />
                    </Button>
                </div>
            </div>
        </>
    ) : (
        <>
            {children}
            {leftContent ? <div className="mt-[-16px]">{leftContent}</div> : null}
        </>
    )
}
