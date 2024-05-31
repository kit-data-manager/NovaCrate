import { MenubarItem, MenubarItemProps, MenubarShortcut } from "@/components/ui/menubar"
import { useAction } from "@/lib/hooks"
import { Fragment, memo, useMemo } from "react"
import { KeyboardShortcut } from "@/components/actions/action-keyboard-shortcuts"
import { Button, ButtonProps } from "@/components/ui/button"
import { ContextMenuItem, ContextMenuItemProps } from "@/components/ui/context-menu"
import { DropdownMenuItem, DropdownMenuItemProps } from "@/components/ui/dropdown-menu"

export interface GenericActionContentProps {
    actionId: string
    noShortcut?: boolean
}

function GenericActionContent(props: GenericActionContentProps) {
    const action = useAction(props.actionId)

    const Icon = useMemo(() => {
        return action.icon
    }, [action.icon])

    return (
        <>
            {Icon && <Icon className="w-4 h-4 mr-2" />} {action.name}
            {!props.noShortcut ? (
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
        <Button onClick={() => action.execute()} {...cleanProps(props)}>
            <GenericActionContent {...props} />
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

function cleanProps<T extends Record<string, any>>(props: T) {
    const newData = {
        ...props
    }

    delete newData.noShortcut
    delete newData.actionId

    return newData
}
