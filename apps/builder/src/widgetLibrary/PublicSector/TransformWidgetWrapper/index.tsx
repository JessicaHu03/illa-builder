import { cloneDeep, get, isFunction, isNumber, set, toPath } from "lodash"
import { FC, Suspense, memo, useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { UNIT_HEIGHT } from "@/page/App/components/DotPanel/constant/canvas"
import { LayoutInfo } from "@/redux/currentApp/editor/components/componentsPayload"
import {
  getCanvas,
  getContainerListDisplayNameMappedChildrenNodeDisplayName,
  searchDsl,
} from "@/redux/currentApp/editor/components/componentsSelector"
import { componentsActions } from "@/redux/currentApp/editor/components/componentsSlice"
import { ComponentNode } from "@/redux/currentApp/editor/components/componentsState"
import {
  getExecutionResult,
  getExecutionWidgetLayoutInfo,
  getIsDragging,
  getIsResizing,
} from "@/redux/currentApp/executionTree/executionSelector"
import { executionActions } from "@/redux/currentApp/executionTree/executionSlice"
import { RootState } from "@/store"
import store from "@/store"
import { evaluateDynamicString } from "@/utils/evaluateDynamicString"
import { runEventHandler } from "@/utils/eventHandlerHelper"
import { ILLAEditorRuntimePropsCollectorInstance } from "@/utils/executionTreeHelper/runtimePropsCollector"
import { convertPathToString } from "@/utils/executionTreeHelper/utils"
import { isObject } from "@/utils/typeHelper"
import { TransformWidgetProps } from "@/widgetLibrary/PublicSector/TransformWidgetWrapper/interface"
import { applyWrapperStylesStyle } from "@/widgetLibrary/PublicSector/TransformWidgetWrapper/style"
import { widgetBuilder } from "@/widgetLibrary/widgetBuilder"
import { MIN_HEIGHT } from "./config"

export const TransformWidgetWrapper: FC<TransformWidgetProps> = memo(
  (props: TransformWidgetProps) => {
    const { columnNumber, displayName, widgetType, parentNodeDisplayName } =
      props

    const displayNameMapProps = useSelector(getExecutionResult)
    const layoutInfo = useSelector<RootState, LayoutInfo>((rootState) => {
      const layoutInfos = getExecutionWidgetLayoutInfo(rootState)
      return layoutInfos[displayName].layoutInfo
    })
    const originComponentNode = useSelector<RootState, ComponentNode>(
      (rootState) => {
        const rootNode = getCanvas(rootState)
        return searchDsl(rootNode, displayName) as ComponentNode
      },
    )

    const realProps = useMemo(
      () => displayNameMapProps[displayName] ?? {},
      [displayName, displayNameMapProps],
    )
    const dispatch = useDispatch()

    const containerListMapChildName = useSelector(
      getContainerListDisplayNameMappedChildrenNodeDisplayName,
    )

    const isDraggingInGlobal = useSelector(getIsDragging)
    const isResizingInGlobal = useSelector(getIsResizing)

    const listContainerDisabled = useMemo(() => {
      const listWidgetDisplayNames = Object.keys(containerListMapChildName)
      let currentListDisplayName = ""
      for (let i = 0; i < listWidgetDisplayNames.length; i++) {
        if (
          containerListMapChildName[listWidgetDisplayNames[i]].includes(
            displayName,
          )
        ) {
          currentListDisplayName = listWidgetDisplayNames[i]
          break
        }
      }
      if (!currentListDisplayName) return realProps?.disabled || false
      const listWidgetProps = displayNameMapProps[currentListDisplayName]
      if (Object.hasOwn(listWidgetProps, "disabled"))
        return listWidgetProps.disabled
      return realProps?.disabled || false
    }, [
      containerListMapChildName,
      displayName,
      displayNameMapProps,
      realProps?.disabled,
    ])

    const updateComponentRuntimeProps = useCallback(
      (runtimeProp: unknown) => {
        ILLAEditorRuntimePropsCollectorInstance.addRuntimeProp(
          displayName,
          runtimeProp,
        )
      },
      [displayName],
    )

    const deleteComponentRuntimeProps = useCallback(() => {
      ILLAEditorRuntimePropsCollectorInstance.deleteRuntimeProp(displayName)
    }, [displayName])

    const updateComponentHeight = useCallback(
      (newHeight: number) => {
        if (isDraggingInGlobal || isResizingInGlobal) return
        const rootState = store.getState()
        const widgetLayoutInfos = getExecutionWidgetLayoutInfo(rootState)
        const oldH = widgetLayoutInfos[displayName]?.layoutInfo.h ?? 0
        // padding 2px so this is +4
        const newH = Math.max(
          Math.ceil((newHeight + 6) / UNIT_HEIGHT),
          MIN_HEIGHT,
        )

        if (newH === oldH) return

        dispatch(
          executionActions.updateWidgetLayoutInfoReducer({
            displayName,
            layoutInfo: {
              h: newH,
            },
            parentNode: parentNodeDisplayName,
            effectRows: newH - oldH,
          }),
        )
      },
      [
        dispatch,
        displayName,
        isDraggingInGlobal,
        isResizingInGlobal,
        parentNodeDisplayName,
      ],
    )

    const handleUpdateDsl = useCallback(
      (value: Record<string, any>) => {
        dispatch(
          executionActions.updateExecutionByDisplayNameReducer({
            displayName,
            value,
          }),
        )
      },
      [dispatch, displayName],
    )

    const handleUpdateMultiExecutionResult = useCallback(
      (allUpdate: { displayName: string; value: Record<string, any> }[]) => {
        dispatch(
          executionActions.updateExecutionByMultiDisplayNameReducer(allUpdate),
        )
      },
      [dispatch],
    )

    const handleUpdateOriginalDSLMultiAttr = useCallback(
      (updateSlice: Record<string, any>) => {
        if (!isObject(updateSlice)) return
        dispatch(
          componentsActions.updateComponentPropsReducer({
            displayName: displayName,
            updateSlice,
          }),
        )
      },
      [dispatch, displayName],
    )

    const handleUpdateOriginalDSLOtherMultiAttr = useCallback(
      (displayName: string, updateSlice: Record<string, any>) => {
        if (!displayName || !isObject(updateSlice)) return
        dispatch(
          componentsActions.updateComponentPropsReducer({
            displayName,
            updateSlice,
          }),
        )
      },
      [dispatch],
    )

    const getRunEvents = useCallback(
      (
        eventType: string,
        path: string,
        otherCalcContext?: Record<string, any>,
      ) => {
        const originEvents = get(originComponentNode.props, path, []) as any[]
        const dynamicPaths = get(
          originComponentNode.props,
          "$dynamicAttrPaths",
          [],
        )
        const needRunEvents = cloneDeep(originEvents).filter((originEvent) => {
          return originEvent.eventType === eventType
        })
        const finalContext =
          ILLAEditorRuntimePropsCollectorInstance.getCurrentPageCalcContext(
            otherCalcContext,
          )
        return {
          dynamicPaths,
          needRunEvents,
          finalContext,
        }
      },
      [originComponentNode?.props],
    )

    const triggerEventHandler = useCallback(
      (
        eventType: string,
        path: string = "events",
        otherCalcContext?: Record<string, any>,
        formatPath?: (path: string) => string,
      ) => {
        const { dynamicPaths, needRunEvents, finalContext } = getRunEvents(
          eventType,
          path,
          otherCalcContext,
        )
        dynamicPaths?.forEach((path: string) => {
          const realPath = isFunction(formatPath)
            ? formatPath(path)
            : convertPathToString(toPath(path).slice(1))
          try {
            const dynamicString = get(needRunEvents, realPath, "")
            if (dynamicString) {
              const calcValue = evaluateDynamicString(
                "",
                dynamicString,
                finalContext,
              )
              set(needRunEvents, realPath, calcValue)
            }
          } catch (e) {
            console.log(e)
          }
        })
        needRunEvents.forEach((scriptObj: any) => {
          runEventHandler(scriptObj, finalContext)
        })
      },
      [getRunEvents],
    )

    const triggerMappedEventHandler = useCallback(
      (
        eventType: string,
        path: string = "events",
        index?: number,
        formatPath?: (path: string) => string,
        isMapped?: (dynamicString: string, calcValue: unknown) => boolean,
      ) => {
        const { dynamicPaths, needRunEvents, finalContext } = getRunEvents(
          eventType,
          path,
        )
        dynamicPaths?.forEach((path: string) => {
          const realPath = isFunction(formatPath)
            ? formatPath(path)
            : convertPathToString(toPath(path).slice(2))

          try {
            const dynamicString = get(needRunEvents, realPath, "")

            if (dynamicString) {
              const calcValue = evaluateDynamicString(
                "",
                dynamicString,
                finalContext,
              )

              let valueToSet = calcValue
              if (Array.isArray(calcValue) && isNumber(index)) {
                if (
                  !isFunction(isMapped) ||
                  isMapped(dynamicString, calcValue)
                ) {
                  valueToSet = calcValue[index]
                }
              }
              set(needRunEvents, realPath, valueToSet)
            }
          } catch (e) {
            console.log(e)
          }
        })
        needRunEvents.forEach((scriptObj: any) => {
          runEventHandler(scriptObj, finalContext)
        })
      },
      [getRunEvents],
    )

    const widgetConfig = widgetBuilder(widgetType)
    if (!widgetConfig) return null
    const Component = widgetConfig.widget
    const {
      hidden,
      borderColor,
      backgroundColor,
      radius,
      borderWidth,
      shadow,
    } = realProps

    const _radius = !isNaN(Number(radius)) ? radius + "px" : radius?.toString()
    const _borderWidth = !isNaN(Number(borderWidth))
      ? borderWidth + "px"
      : borderWidth?.toString()

    return hidden ? null : (
      <div
        css={applyWrapperStylesStyle(
          borderColor,
          _borderWidth,
          _radius,
          backgroundColor,
          shadow,
          widgetType,
        )}
      >
        <Suspense>
          <Component
            {...realProps}
            h={layoutInfo.h}
            columnNumber={columnNumber}
            handleUpdateOriginalDSLMultiAttr={handleUpdateOriginalDSLMultiAttr}
            handleUpdateOriginalDSLOtherMultiAttr={
              handleUpdateOriginalDSLOtherMultiAttr
            }
            handleUpdateDsl={handleUpdateDsl}
            updateComponentHeight={updateComponentHeight}
            handleUpdateMultiExecutionResult={handleUpdateMultiExecutionResult}
            displayName={displayName}
            childrenNode={originComponentNode.childrenNode}
            componentNode={originComponentNode}
            disabled={listContainerDisabled}
            triggerEventHandler={triggerEventHandler}
            triggerMappedEventHandler={triggerMappedEventHandler}
            updateComponentRuntimeProps={updateComponentRuntimeProps}
            deleteComponentRuntimeProps={deleteComponentRuntimeProps}
          />
        </Suspense>
      </div>
    )
  },
)

TransformWidgetWrapper.displayName = "TransformWidgetWrapper"
