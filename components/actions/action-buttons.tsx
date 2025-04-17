import { MenubarItem, MenubarItemProps } from "@/components/ui/menubar"
import { useAction, useActionsReady } from "@/lib/hooks"
import { memo, useMemo } from "react"
import { KeyboardShortcut } from "@/components/actions/action-keyboard-shortcuts"
import { Button, ButtonProps } from "@/components/ui/button"
import { ContextMenuItem, ContextMenuItemProps } from "@/components/ui/context-menu"
import { DropdownMenuItem, DropdownMenuItemProps } from "@/components/ui/dropdown-menu"
import { CommandItem, CommandItemProps } from "@/components/ui/command"
import { Loader2 } from "lucide-react"

export interface GenericActionContentProps {
    actionId: string
    noShortcut?: boolean
    iconOnly?: boolean
    hideName?: boolean
}

function GenericActionContent(props: GenericActionContentProps) {
    const action = useAction(props.actionId)
    const ready = useActionsReady()

    const Icon = useMemo(() => {
        return action.icon
    }, [action.icon])

    if (!ready) return <Loader2 className="size-4 animate-spin" />

    return (
        <>
            {Icon && (
                <Icon className={`size-4 ${props.iconOnly || props.hideName ? "" : "mr-2"}`} />
            )}{" "}
            {props.iconOnly || props.hideName ? null : action.name}
            {!props.iconOnly && !props.noShortcut && action.keyboardShortcut ? (
                <span className="flex ml-auto pl-2 text-xs tracking-widest text-muted-foreground">
                    <KeyboardShortcut action={action} />
                </span>
            ) : null}
        </>
    )
}

export const ActionMenubarItem = memo(function ActionMenubarItem(
    props: MenubarItemProps & GenericActionContentProps
) {
    const action = useAction(props.actionId)

    return (
        <MenubarItem onClick={() => action.execute()} {...cleanProps(props)}>
            <GenericActionContent {...props} />
        </MenubarItem>
    )
})

export const ActionButton = memo(function ActionButton(
    props: ButtonProps & GenericActionContentProps
) {
    const action = useAction(props.actionId)

    return (
        <Button
            onClick={() => action.execute()}
            size={props.iconOnly ? "icon" : "default"}
            {...cleanProps(props)}
        >
            <GenericActionContent {...props} />
            {props.children}
        </Button>
    )
})

export const ActionDropdownMenuItem = memo(function ActionDropdownMenuItem(
    props: DropdownMenuItemProps & GenericActionContentProps
) {
    const action = useAction(props.actionId)

    return (
        <DropdownMenuItem onClick={() => action.execute()} {...cleanProps(props)}>
            <GenericActionContent {...props} />
        </DropdownMenuItem>
    )
})

export const ActionContextMenuItem = memo(function ActionContextMenuItem(
    props: ContextMenuItemProps & GenericActionContentProps
) {
    const action = useAction(props.actionId)

    return (
        <ContextMenuItem onClick={() => action.execute()} {...cleanProps(props)}>
            <GenericActionContent {...props} />
        </ContextMenuItem>
    )
})

export const ActionCommandItem = memo(function ActionContextMenuItem(
    props: CommandItemProps & GenericActionContentProps & { closeAnd?: (fn: () => void) => void }
) {
    const action = useAction(props.actionId)

    return (
        <CommandItem
            value={action.name}
            onSelect={() => (props.closeAnd ? props.closeAnd(action.execute) : action.execute())}
            {...cleanProps(props)}
        >
            <GenericActionContent {...props} />
        </CommandItem>
    )
})

function cleanProps<T extends object>(props: T) {
    const newData = {
        ...props
    }

    if ("noShortcut" in newData) delete newData.noShortcut
    if ("actionId" in newData) delete newData.actionId
    if ("closeAnd" in newData) delete newData.closeAnd
    if ("iconOnly" in newData) delete newData.iconOnly
    if ("hideName" in newData) delete newData.hideName

    return newData
}
