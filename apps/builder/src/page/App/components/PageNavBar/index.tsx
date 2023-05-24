import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import {
  Badge,
  BugIcon,
  Button,
  ButtonGroup,
  CaretRightIcon,
  DropList,
  DropListItem,
  Dropdown,
  ExitIcon,
  FullScreenIcon,
  LockIcon,
  MoreIcon,
  Trigger,
  UnlockIcon,
  getColor,
  useMessage,
} from "@illa-design/react"
import { ReactComponent as Logo } from "@/assets/illa-logo.svg"
import { ReactComponent as SnowIcon } from "@/assets/snow-icon.svg"
import {
  ILLA_MIXPANEL_BUILDER_PAGE_NAME,
  ILLA_MIXPANEL_EVENT_TYPE,
} from "@/illa-public-component/MixpanelUtils/interface"
import { ForkAndDeployModal } from "@/page/App/components/ForkAndDeployModal"
import { AppName } from "@/page/App/components/PageNavBar/AppName"
import { AppSizeButtonGroup } from "@/page/App/components/PageNavBar/AppSizeButtonGroup"
import { CollaboratorsList } from "@/page/App/components/PageNavBar/CollaboratorsList"
import { WindowIcons } from "@/page/App/components/PageNavBar/WindowIcons"
import { PageNavBarProps } from "@/page/App/components/PageNavBar/interface"
import { DuplicateModal } from "@/page/Dashboard/components/DuplicateModal"
import {
  getFreezeState,
  getIsILLAEditMode,
  getIsILLAGuideMode,
  getIsOnline,
  isOpenDebugger,
} from "@/redux/config/configSelector"
import { configActions } from "@/redux/config/configSlice"
import { getAppInfo } from "@/redux/currentApp/appInfo/appInfoSelector"
import { getExecutionDebuggerData } from "@/redux/currentApp/executionTree/executionSelector"
import { fetchDeployApp, forkCurrentApp } from "@/services/apps"
import { fromNow } from "@/utils/dayjs"
import { track, trackInEditor } from "@/utils/mixpanelHelper"
import {
  descriptionStyle,
  informationStyle,
  logoCursorStyle,
  navBarStyle,
  rightContentStyle,
  rowCenter,
  saveFailedTipStyle,
  viewControlStyle,
} from "./style"

export const PageNavBar: FC<PageNavBarProps> = (props) => {
  const { className } = props
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const message = useMessage()
  const navigate = useNavigate()

  const { teamIdentifier, appId } = useParams()

  const appInfo = useSelector(getAppInfo)
  const debuggerVisible = useSelector(isOpenDebugger)
  const isFreezeCanvas = useSelector(getFreezeState)
  const isOnline = useSelector(getIsOnline)
  const debuggerData = useSelector(getExecutionDebuggerData)
  const debugMessageNumber = debuggerData ? Object.keys(debuggerData).length : 0
  const isEditMode = useSelector(getIsILLAEditMode)
  const isGuideMode = useSelector(getIsILLAGuideMode)

  const [duplicateVisible, setDuplicateVisible] = useState(false)
  const [forkModalVisible, setForkModalVisible] = useState(false)
  const [deployLoading, setDeployLoading] = useState<boolean>(false)

  const previewButtonText = isEditMode
    ? t("preview.button_text")
    : t("exit_preview")

  const handleClickDebuggerIcon = useCallback(() => {
    trackInEditor(ILLA_MIXPANEL_EVENT_TYPE.CLICK, {
      element: "debug",
      parameter2: debugMessageNumber,
    })
    dispatch(configActions.updateDebuggerVisible(!debuggerVisible))
  }, [debugMessageNumber, debuggerVisible, dispatch])
  const handleClickFreezeIcon = useCallback(() => {
    trackInEditor(ILLA_MIXPANEL_EVENT_TYPE.CLICK, {
      element: "lock_icon",
      parameter2: !isFreezeCanvas ? "lock" : "unlock",
    })
    dispatch(configActions.updateFreezeStateReducer(!isFreezeCanvas))
  }, [dispatch, isFreezeCanvas])

  useEffect(() => {
    trackInEditor(ILLA_MIXPANEL_EVENT_TYPE.SHOW, {
      element: "debug",
      parameter2: debugMessageNumber,
    })
  }, [debugMessageNumber])

  const deployApp = useCallback(
    (appId: string) => {
      setDeployLoading(true)
      fetchDeployApp(appId)
        .then(
          () => {
            window.open(
              window.location.protocol +
                "//" +
                window.location.host +
                `/${teamIdentifier}/deploy/app/${appId}`,
              "_blank",
            )
          },
          () => {
            message.error({
              content: t("editor.deploy.fail"),
            })
          },
        )
        .finally(() => {
          setDeployLoading(false)
        })
    },
    [teamIdentifier, message, t],
  )

  const forkGuideAppAndDeploy = useCallback(
    async (appName: string) => {
      if (appName === undefined || appName === "" || appName?.trim() === "") {
        message.error({
          content: t("dashboard.app.name_empty"),
        })
        return
      }
      setDeployLoading(true)
      const appId = await forkCurrentApp(appName)
      setForkModalVisible(false)
      deployApp(appId)
    },
    [deployApp, message, t],
  )

  const handleClickDeploy = useCallback(() => {
    if (isGuideMode) {
      setForkModalVisible(true)
    } else {
      trackInEditor(ILLA_MIXPANEL_EVENT_TYPE.CLICK, {
        element: "deploy",
      })
      deployApp(appInfo.appId)
    }
  }, [appInfo.appId, isGuideMode, deployApp])

  const handlePreviewButtonClick = useCallback(() => {
    if (isEditMode) {
      trackInEditor(ILLA_MIXPANEL_EVENT_TYPE.CLICK, {
        element: "preview",
      })
      dispatch(configActions.updateIllaMode("preview"))
    } else {
      trackInEditor(ILLA_MIXPANEL_EVENT_TYPE.CLICK, {
        element: "exit_preview",
      })
      dispatch(configActions.updateIllaMode("edit"))
    }
  }, [dispatch, isEditMode])

  const PreviewButton = useMemo(
    () => (
      <Button
        colorScheme="grayBlue"
        leftIcon={isEditMode ? <FullScreenIcon /> : <ExitIcon />}
        variant="fill"
        bdRadius="8px"
        onClick={handlePreviewButtonClick}
      >
        {previewButtonText}
      </Button>
    ),
    [handlePreviewButtonClick, isEditMode, previewButtonText],
  )

  const handleLogoClick = useCallback(() => {
    navigate(`/${teamIdentifier}/dashboard/apps`)
  }, [navigate, teamIdentifier])

  useEffect(() => {
    duplicateVisible &&
      track(
        ILLA_MIXPANEL_EVENT_TYPE.SHOW,
        ILLA_MIXPANEL_BUILDER_PAGE_NAME.EDITOR,
        { element: "duplicate_modal", parameter5: appId },
      )
  }, [appId, duplicateVisible])

  return (
    <div className={className} css={navBarStyle}>
      <div css={rowCenter}>
        <Logo width="34px" onClick={handleLogoClick} css={logoCursorStyle} />
        <div css={informationStyle}>
          <AppName appName={appInfo.appName} />
          {isOnline ? (
            <div css={descriptionStyle}>
              {t("edit_at") + " " + fromNow(appInfo?.updatedAt)}
            </div>
          ) : (
            <div css={saveFailedTipStyle}>
              <SnowIcon />
              <span> {t("edit_failed")}</span>
            </div>
          )}
        </div>
      </div>
      <div css={viewControlStyle}>
        {isEditMode && <WindowIcons />}
        <AppSizeButtonGroup />
      </div>
      <div css={rightContentStyle}>
        {!isGuideMode && <CollaboratorsList />}
        {isEditMode ? (
          <div>
            {!isGuideMode && (
              <Dropdown
                position="bottom-end"
                trigger="click"
                triggerProps={{ closeDelay: 0, openDelay: 0 }}
                onVisibleChange={(visible) => {
                  if (visible) {
                    track(
                      ILLA_MIXPANEL_EVENT_TYPE.SHOW,
                      ILLA_MIXPANEL_BUILDER_PAGE_NAME.EDITOR,
                      { element: "app_duplicate", parameter5: appId },
                    )
                  }
                }}
                dropList={
                  <DropList w={"184px"}>
                    <DropListItem
                      key="duplicate"
                      value="duplicate"
                      title={t("duplicate")}
                      onClick={() => {
                        setDuplicateVisible(true)
                        track(
                          ILLA_MIXPANEL_EVENT_TYPE.CLICK,
                          ILLA_MIXPANEL_BUILDER_PAGE_NAME.EDITOR,
                          { element: "app_duplicate", parameter5: appId },
                        )
                      }}
                    />
                    <DropListItem
                      key="configWaterMark"
                      value="configWaterMark"
                      title={<span>{t("Remove watermark")}</span>}
                      onClick={() => {
                        // set configWaterMark
                      }}
                    />
                  </DropList>
                }
              >
                <Button
                  mr="8px"
                  colorScheme="white"
                  leftIcon={<MoreIcon size="14px" />}
                />
              </Dropdown>
            )}
            <ButtonGroup spacing="8px">
              <Badge count={debuggerData && Object.keys(debuggerData).length}>
                <Button
                  colorScheme="white"
                  size="medium"
                  leftIcon={
                    <BugIcon color={getColor("grayBlue", "02")} size="14px" />
                  }
                  onClick={handleClickDebuggerIcon}
                />
              </Badge>
              <Trigger
                content={isFreezeCanvas ? t("freeze_tips") : t("unfreeze_tips")}
                colorScheme="grayBlue"
                position="bottom"
                showArrow={false}
                autoFitPosition={false}
                trigger="hover"
              >
                <Button
                  colorScheme="white"
                  size="medium"
                  leftIcon={
                    isFreezeCanvas ? (
                      <LockIcon
                        size="14px"
                        color={getColor("grayBlue", "02")}
                      />
                    ) : (
                      <UnlockIcon
                        size="14px"
                        color={getColor("grayBlue", "02")}
                      />
                    )
                  }
                  onClick={handleClickFreezeIcon}
                />
              </Trigger>
              {PreviewButton}
              <Button
                loading={deployLoading}
                colorScheme="techPurple"
                size="medium"
                leftIcon={<CaretRightIcon />}
                onClick={handleClickDeploy}
              >
                {isGuideMode
                  ? t("editor.tutorial.panel.tutorial.modal.fork")
                  : t("deploy")}
              </Button>
            </ButtonGroup>
          </div>
        ) : (
          <>{PreviewButton}</>
        )}
      </div>
      <ForkAndDeployModal
        visible={forkModalVisible}
        okLoading={deployLoading}
        onOk={forkGuideAppAndDeploy}
        onVisibleChange={setForkModalVisible}
      />
      {appId ? (
        <DuplicateModal
          appId={appId}
          visible={duplicateVisible}
          onVisibleChange={(visible) => {
            setDuplicateVisible(visible)
          }}
        />
      ) : null}
    </div>
  )
}

PageNavBar.displayName = "PageNavBar"
