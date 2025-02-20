import { MutableRefObject, useEffect, useLayoutEffect, useRef } from "react"

export const useAutoUpdateHeight = (
  handleUpdateHeight: (height: number) => void,
  enable: boolean = true,
  dynamicOptions?: {
    dynamicMinHeight?: number
    dynamicMaxHeight?: number
  },
): [MutableRefObject<HTMLDivElement | null>] => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useLayoutEffect(() => {
    const containerRefValue = containerRef.current
    const observerRef = new ResizeObserver((entries) => {
      if (!isMounted.current || !handleUpdateHeight) return
      const height = entries[0].contentRect.height
      if (
        dynamicOptions &&
        dynamicOptions.dynamicMaxHeight &&
        height >= dynamicOptions.dynamicMaxHeight - 6
      ) {
        handleUpdateHeight(dynamicOptions.dynamicMaxHeight - 6)
        return
      }
      if (
        dynamicOptions &&
        dynamicOptions.dynamicMinHeight &&
        height <= dynamicOptions.dynamicMinHeight - 6
      ) {
        handleUpdateHeight(dynamicOptions.dynamicMinHeight - 6)
        return
      }
      handleUpdateHeight?.(height)
    })
    if (observerRef && containerRefValue && enable) {
      observerRef.unobserve(containerRefValue)
      observerRef.observe(containerRefValue)
    }

    return () => {
      if (containerRefValue && enable) {
        observerRef.unobserve(containerRefValue)
      }
    }
  }, [dynamicOptions, enable, handleUpdateHeight])
  return [containerRef]
}
