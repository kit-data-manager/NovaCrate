/**
 * NovaCrate local ESLint plugin.
 *
 * Currently provides:
 *  - use-add-event-listener-return: enforces that the return value of
 *    `IObservable.prototype.addEventListener` (the unlisten callback) is used.
 *
 * In this codebase every `IObservable` is exposed as a property named `events`
 * (e.g. `service.events.addEventListener(...)`), while DOM/Worker
 * `addEventListener` calls (`window`, `document`, elements, `worker`, ...) are
 * never reached through an `events` property. Matching on `*.events.addEventListener`
 * therefore targets exactly the `IObservable` calls with no false positives and
 * without needing type-aware linting.
 */
const useAddEventListenerReturnRule = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Require the return value of IObservable.addEventListener (the unlisten callback) to be used.",
        },
        schema: [
            {
                type: "object",
                properties: {
                    eventsProperties: {
                        type: "array",
                        items: { type: "string" },
                        uniqueItems: true,
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unused:
                "The return value of addEventListener() is the unlisten callback and must be used to avoid leaking listeners. Assign it (e.g. `const remove = …events.addEventListener(…)`) and call it during cleanup.",
        },
    },
    create(context) {
        const options = context.options[0] || {}
        const eventsProperties = new Set(options.eventsProperties || ["events"])

        /** Static property name of a MemberExpression, or null if dynamically computed. */
        function memberPropertyName(member) {
            if (!member || member.type !== "MemberExpression") return null
            if (member.computed) {
                if (member.property.type === "Literal" && typeof member.property.value === "string") {
                    return member.property.value
                }
                return null
            }
            if (member.property.type === "Identifier") return member.property.name
            return null
        }

        function isObservableAddEventListenerCall(node) {
            if (!node || node.type !== "CallExpression") return false
            const callee = node.callee
            if (!callee || callee.type !== "MemberExpression") return false
            if (memberPropertyName(callee) !== "addEventListener") return false
            // The receiver must be a member access on one of the configured
            // IObservable property names, e.g. `service.events.addEventListener`.
            const receiverProp = memberPropertyName(callee.object)
            if (receiverProp === null) return false
            return eventsProperties.has(receiverProp)
        }

        return {
            ExpressionStatement(node) {
                let expr = node.expression
                // Unwrap `await x.events.addEventListener(...)` (not expected today,
                // but harmless to handle).
                if (expr && expr.type === "AwaitExpression") {
                    expr = expr.argument
                }
                if (isObservableAddEventListenerCall(expr)) {
                    context.report({ node: expr.callee, messageId: "unused" })
                }
            },
        }
    },
}

export default {
    meta: { name: "novacrate", version: "1.0.0" },
    rules: {
        "use-add-event-listener-return": useAddEventListenerReturnRule,
    },
}
