import { FC, useCallback, useEffect, useMemo, useRef } from "react"
import { ContainerProps } from "@/widgetLibrary/ContainerWidget/interface"
import { AutoHeightContainer } from "@/widgetLibrary/PublicSector/AutoHeightContainer"
import { TooltipWrapper } from "@/widgetLibrary/PublicSector/TooltipWrapper"
import { RenderChildrenCanvas } from "../PublicSector/RenderChildrenCanvas"
import { ContainerEmptyState } from "./emptyState"
import { containerWrapperStyle } from "./style"

export const ContainerWidget: FC<ContainerProps> = (props) => {
  const {
    currentIndex,
    updateComponentRuntimeProps,
    deleteComponentRuntimeProps,
    handleUpdateOriginalDSLMultiAttr,
    handleUpdateOriginalDSLOtherMultiAttr,
    viewList,
    tooltipText,
    childrenNode,
    columnNumber,
    dynamicHeight = "fixed",
    triggerEventHandler,
    updateComponentHeight,
    linkWidgetDisplayName,
    dynamicMaxHeight,
    dynamicMinHeight,
  } = props
  const preCurrentViewIndex = useRef<number>(currentIndex)

  useEffect(() => {
    if (typeof preCurrentViewIndex.current !== "number") {
      preCurrentViewIndex.current = currentIndex
    }
    if (preCurrentViewIndex.current !== currentIndex) {
      triggerEventHandler("change")
      preCurrentViewIndex.current = currentIndex
    }
  }, [currentIndex, triggerEventHandler])

  const handleOnClick = useCallback(() => {
    triggerEventHandler("click")
  }, [triggerEventHandler])

  const renderComponent = useMemo(() => {
    if (Array.isArray(childrenNode) && currentIndex < childrenNode.length) {
      const currentViewComponentNode = childrenNode[currentIndex]

      return (
        <RenderChildrenCanvas
          currentComponentNode={currentViewComponentNode}
          columnNumber={columnNumber}
        />
      )
    }
    return <ContainerEmptyState />
  }, [columnNumber, childrenNode, currentIndex])

  const handleUpdateOriginalDSLAttrs = useCallback(
    (updateSlice: Record<string, any>) => {
      handleUpdateOriginalDSLMultiAttr(updateSlice)
      if (linkWidgetDisplayName) {
        handleUpdateOriginalDSLOtherMultiAttr?.(
          linkWidgetDisplayName,
          updateSlice,
        )
      }
    },
    [
      handleUpdateOriginalDSLMultiAttr,
      handleUpdateOriginalDSLOtherMultiAttr,
      linkWidgetDisplayName,
    ],
  )

  useEffect(() => {
    updateComponentRuntimeProps?.({
      setCurrentViewKey: (key: string) => {
        const index = viewList.findIndex((viewItem) => viewItem.key === key)
        if (index === -1) return
        handleUpdateOriginalDSLAttrs({
          currentIndex: index,
          currentKey: key,
        })
      },
      setCurrentViewIndex: (index: string) => {
        const numberIndex = parseInt(index)
        const view = viewList[numberIndex]
        if (!view) return
        handleUpdateOriginalDSLAttrs({
          currentIndex: numberIndex,
          currentKey: view.key,
        })
      },
      showNextView: (loop: boolean) => {
        let newCurrentIndex = currentIndex + 1
        if (newCurrentIndex >= viewList.length) {
          if (!loop) return
          newCurrentIndex = 0
        }
        const currentView = viewList[newCurrentIndex]
        handleUpdateOriginalDSLAttrs({
          currentIndex: newCurrentIndex,
          currentKey: currentView.key,
        })
      },
      showNextVisibleView: (loop: boolean) => {
        let newCurrentIndex = currentIndex + 1
        if (newCurrentIndex >= viewList.length) {
          if (!loop) return
          newCurrentIndex = 0
        }
        let currentView = viewList[newCurrentIndex]
        while (currentView.hidden || currentView.disabled) {
          newCurrentIndex++
          currentView = viewList[newCurrentIndex]
          if (newCurrentIndex >= viewList.length) {
            if (!loop) return
            newCurrentIndex = 0
          }
        }
        handleUpdateOriginalDSLAttrs({
          currentIndex: newCurrentIndex,
          currentKey: currentView.key,
        })
      },
      showPreviousView: (loop: boolean) => {
        let newCurrentIndex = currentIndex - 1

        if (newCurrentIndex < 0) {
          if (!loop) return
          newCurrentIndex = viewList.length - 1
        }
        const currentView = viewList[newCurrentIndex]
        handleUpdateOriginalDSLAttrs({
          currentIndex: newCurrentIndex,
          currentKey: currentView.key,
        })
      },
      showPreviousVisibleView: (loop: boolean) => {
        let newCurrentIndex = currentIndex - 1

        if (newCurrentIndex < 0) {
          if (!loop) return
          newCurrentIndex = viewList.length - 1
        }
        let currentView = viewList[newCurrentIndex]
        while (currentView.hidden || currentView.disabled) {
          newCurrentIndex--
          currentView = viewList[newCurrentIndex]
          if (newCurrentIndex < 0) {
            if (!loop) return
            newCurrentIndex = viewList.length - 1
          }
        }
        handleUpdateOriginalDSLAttrs({
          currentIndex: newCurrentIndex,
          currentKey: currentView.key,
        })
      },
    })
    return () => {
      deleteComponentRuntimeProps()
    }
  }, [
    deleteComponentRuntimeProps,
    updateComponentRuntimeProps,
    handleUpdateOriginalDSLAttrs,
    viewList,
    currentIndex,
  ])

  const enableAutoHeight = useMemo(() => {
    switch (dynamicHeight) {
      case "auto":
        return true
      case "limited":
        return true
      case "fixed":
      default:
        return false
    }
  }, [dynamicHeight])

  const dynamicOptions = {
    dynamicMinHeight,
    dynamicMaxHeight,
  }

  return (
    <TooltipWrapper tooltipText={tooltipText} tooltipDisabled={!tooltipText}>
      <div css={containerWrapperStyle} onClick={handleOnClick}>
        <AutoHeightContainer
          updateComponentHeight={updateComponentHeight}
          enable={enableAutoHeight}
          dynamicOptions={dynamicOptions}
        >
          {renderComponent}
        </AutoHeightContainer>
      </div>
    </TooltipWrapper>
  )
}

export default ContainerWidget
