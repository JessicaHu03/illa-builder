import { FC, useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSelector } from "react-redux"
import {
  CloseIcon,
  SuccessCircleIcon,
  WarningCircleIcon,
  getColor,
} from "@illa-design/react"
import { CodeEditor } from "@/components/CodeEditor"
import { CODE_LANG } from "@/components/CodeEditor/CodeMirror/extensions/interface"
import { ActionResultProps } from "@/page/App/components/Actions/ActionPanel/ActionResult/interface"
import {
  actionResultContainerStyle,
  alertBarStyle,
  alertTextStyle,
  applyActionContentContainerStyle,
  customerCodeStyle,
} from "@/page/App/components/Actions/ActionPanel/ActionResult/style"
import { DragBar } from "@/page/App/components/Actions/DragBar"
import { getSelectedAction } from "@/redux/config/configSelector"
import { getExecutionResult } from "@/redux/currentApp/executionTree/executionSelector"
import { RootState } from "@/store"
import { AdvancedAPIHeader, RESULT_SHOW_TYPE } from "./restApiHeader"
import { getDisplayResult } from "./utils"

export const ActionResult: FC<ActionResultProps> = (props) => {
  const { onClose, visible } = props

  const resizeRef = useRef<HTMLDivElement>(null)

  const alertRef = useRef<HTMLDivElement>(null)

  const [showType, setShowType] = useState<RESULT_SHOW_TYPE>(
    RESULT_SHOW_TYPE.RESPONSE,
  )

  const selectedAction = useSelector(getSelectedAction)!

  const currentActionExecutionResult = useSelector<
    RootState,
    Record<string, any> | undefined
  >((rootState) => {
    const executionResult = getExecutionResult(rootState)
    if (selectedAction.displayName) {
      return executionResult[selectedAction.displayName]
    }
  })

  const { t } = useTranslation()

  const renderResult =
    visible &&
    (currentActionExecutionResult?.data !== undefined ||
      currentActionExecutionResult?.runResult !== undefined)

  const isError = currentActionExecutionResult?.runResult?.error
  const result = currentActionExecutionResult?.data
  const rawResult = currentActionExecutionResult?.rawData
  const responseHeader = currentActionExecutionResult?.responseHeaders

  const runningTimes =
    (currentActionExecutionResult?.endTime ?? 0) -
    (currentActionExecutionResult?.startTime ?? 0)

  const [codeMirrorHeight, setCodeMirrorHeight] = useState(260)

  const isAdvancedActionTitle = rawResult && responseHeader

  const handleResultTabsClick = useCallback((activeKey: RESULT_SHOW_TYPE) => {
    return () => {
      setShowType(activeKey)
    }
  }, [])

  const finalResult = {
    result,
    rawResult,
    responseHeader,
  }

  const displayData = getDisplayResult(showType, finalResult)

  return (
    <div css={actionResultContainerStyle}>
      <div css={applyActionContentContainerStyle(renderResult)} ref={resizeRef}>
        <DragBar
          minHeight={300}
          resizeRef={resizeRef}
          onChange={() => {
            setCodeMirrorHeight(
              resizeRef.current!.offsetHeight - alertRef.current!.offsetHeight,
            )
          }}
        />

        {isAdvancedActionTitle ? (
          <AdvancedAPIHeader
            showType={showType}
            runningTimes={runningTimes}
            onClose={onClose}
            handleResultTabsClick={handleResultTabsClick}
            ref={alertRef}
            statusCode={responseHeader?.statusCode}
            statusText={responseHeader?.statusText}
          />
        ) : (
          <div ref={alertRef} css={alertBarStyle}>
            {isError ? (
              <WarningCircleIcon c={getColor("red", "03")} />
            ) : (
              <SuccessCircleIcon c={getColor("green", "03")} />
            )}
            <span css={alertTextStyle}>
              {isError
                ? t("editor.action.panel.status.ran_failed")
                : t("editor.action.panel.status.ran_successfully")}
            </span>
            <CloseIcon
              cur="pointer"
              c={getColor("grayBlue", "05")}
              onClick={onClose}
            />
          </div>
        )}

        <CodeEditor
          height={codeMirrorHeight + "px"}
          wrapperCss={customerCodeStyle}
          showLineNumbers
          editable={false}
          value={
            isError
              ? currentActionExecutionResult?.runResult?.message
              : JSON.stringify(displayData, undefined, 2)
          }
          lang={CODE_LANG.JSON}
        />
      </div>
    </div>
  )
}

ActionResult.displayName = "ActionResult"
