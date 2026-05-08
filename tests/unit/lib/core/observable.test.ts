import { Observable } from "@/lib/core/impl/Observable"

type TestEvents = {
    "simple-event": () => void
    "data-event": (data: string) => void
    "multi-arg-event": (a: number, b: string) => void
}

describe("Observable", () => {
    let observable: Observable<TestEvents>

    beforeEach(() => {
        observable = new Observable<TestEvents>()
    })

    describe("addEventListener", () => {
        it("should register a listener and call it on emit", () => {
            const listener = jest.fn()
            observable.addEventListener("simple-event", listener)
            observable.emit("simple-event")
            expect(listener).toHaveBeenCalledTimes(1)
        })

        it("should support multiple listeners for the same event", () => {
            const listener1 = jest.fn()
            const listener2 = jest.fn()
            observable.addEventListener("simple-event", listener1)
            observable.addEventListener("simple-event", listener2)
            observable.emit("simple-event")
            expect(listener1).toHaveBeenCalledTimes(1)
            expect(listener2).toHaveBeenCalledTimes(1)
        })

        it("should support listeners for different events independently", () => {
            const simpleListener = jest.fn()
            const dataListener = jest.fn()
            observable.addEventListener("simple-event", simpleListener)
            observable.addEventListener("data-event", dataListener)

            observable.emit("simple-event")
            expect(simpleListener).toHaveBeenCalledTimes(1)
            expect(dataListener).not.toHaveBeenCalled()

            observable.emit("data-event", "hello")
            expect(simpleListener).toHaveBeenCalledTimes(1)
            expect(dataListener).toHaveBeenCalledTimes(1)
        })

        it("should return a cleanup function that removes the listener", () => {
            const listener = jest.fn()
            const remove = observable.addEventListener("simple-event", listener)

            observable.emit("simple-event")
            expect(listener).toHaveBeenCalledTimes(1)

            remove()
            observable.emit("simple-event")
            expect(listener).toHaveBeenCalledTimes(1)
        })
    })

    describe("removeEventListener", () => {
        it("should remove a previously registered listener", () => {
            const listener = jest.fn()
            observable.addEventListener("simple-event", listener)

            observable.emit("simple-event")
            expect(listener).toHaveBeenCalledTimes(1)

            observable.removeEventListener("simple-event", listener)
            observable.emit("simple-event")
            expect(listener).toHaveBeenCalledTimes(1)
        })

        it("should not throw when removing a listener that was never added", () => {
            const listener = jest.fn()
            expect(() => {
                observable.removeEventListener("simple-event", listener)
            }).not.toThrow()
        })

        it("should only remove the specified listener", () => {
            const listener1 = jest.fn()
            const listener2 = jest.fn()
            observable.addEventListener("simple-event", listener1)
            observable.addEventListener("simple-event", listener2)

            observable.removeEventListener("simple-event", listener1)
            observable.emit("simple-event")

            expect(listener1).not.toHaveBeenCalled()
            expect(listener2).toHaveBeenCalledTimes(1)
        })

        it("should clean up the internal set when the last listener is removed", () => {
            const listener = jest.fn()
            observable.addEventListener("simple-event", listener)
            observable.removeEventListener("simple-event", listener)

            observable.emit("simple-event")
            expect(listener).not.toHaveBeenCalled()
        })
    })

    describe("emit", () => {
        it("should not throw when emitting an event with no listeners", () => {
            expect(() => {
                observable.emit("simple-event")
            }).not.toThrow()
        })

        it("should pass a single data argument directly to the listener", () => {
            const listener = jest.fn()
            observable.addEventListener("data-event", listener)
            observable.emit("data-event", "test-data")
            expect(listener).toHaveBeenCalledWith("test-data")
        })

        it("should pass multiple arguments spread to the listener", () => {
            const listener = jest.fn()
            observable.addEventListener("multi-arg-event", listener)
            observable.emit("multi-arg-event", 42, "hello")
            expect(listener).toHaveBeenCalledWith(42, "hello")
        })

        it("should call listeners in order of registration", () => {
            const order: number[] = []
            observable.addEventListener("simple-event", (() => order.push(1)) as () => void)
            observable.addEventListener("simple-event", (() => order.push(2)) as () => void)
            observable.addEventListener("simple-event", (() => order.push(3)) as () => void)

            observable.emit("simple-event")
            expect(order).toEqual([1, 2, 3])
        })

        it("should handle multiple emissions correctly", () => {
            const listener = jest.fn()
            observable.addEventListener("data-event", listener)
            observable.emit("data-event", "first")
            observable.emit("data-event", "second")
            observable.emit("data-event", "third")
            expect(listener).toHaveBeenCalledTimes(3)
            expect(listener).toHaveBeenNthCalledWith(1, "first")
            expect(listener).toHaveBeenNthCalledWith(2, "second")
            expect(listener).toHaveBeenNthCalledWith(3, "third")
        })
    })
})
