import React, { useState, useEffect, RefObject, FC } from "react"
import { actionEditorDragBarStyle } from "./style"
import { DragBarProps } from "./interface"
import { isNumber } from "@illa-design/system"

const handleResize = (
  resizeRef: RefObject<HTMLDivElement>,
  movementY: number,
  minHeight: number,
  maxHeight?: number,
  callback?: () => void,
) => {
  const resize = resizeRef?.current
  if (!resize) return

  const { height } = resize.getBoundingClientRect()
  const updatedHeight = height - movementY

  if (isNumber(maxHeight) && updatedHeight > maxHeight) return

  if (updatedHeight < window.innerHeight && updatedHeight > minHeight) {
    resize.style.height = `${updatedHeight}px`
    callback?.()
  }
}

export const DragBar: FC<DragBarProps> = (props) => {
  const { resizeRef, minHeight = 300, maxHeight, onChange } = props
  const [mouseDown, setMouseDown] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      handleResize(resizeRef, e.movementY, minHeight, maxHeight, () => {
        onChange?.()
      })
    }
    if (mouseDown) {
      window.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [maxHeight, minHeight, mouseDown, resizeRef])

  useEffect(() => {
    handleResize(resizeRef, 0, minHeight, maxHeight)
    const handleMouseUp = () => setMouseDown(false)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [maxHeight, minHeight, resizeRef])

  return (
    <div
      css={actionEditorDragBarStyle}
      onMouseDown={() => {
        setMouseDown(true)
      }}
    />
  )
}

DragBar.displayName = "DragBar"
