import { CaseReducer, PayloadAction } from "@reduxjs/toolkit"
import { cloneDeep, set } from "lodash"
import { generateNewViewItem } from "@/page/App/components/PagePanel/Components/ViewsList/utils"
import {
  BatchUpdateComponentNodeLayoutInfoPayload,
  LayoutInfo,
  UpdateComponentContainerPayload,
  UpdateComponentNodeLayoutInfoPayload,
  UpdateComponentSlicePropsPayload,
} from "@/redux/currentApp/editor/components/componentsPayload"
import { searchDsl } from "@/redux/currentApp/editor/components/componentsSelector"
import {
  AddModalComponentPayload,
  AddSectionViewPayload,
  AddTargetPageSectionPayload,
  ComponentNode,
  ComponentsInitialState,
  ComponentsState,
  DeleteComponentNodePayload,
  DeleteGlobalStatePayload,
  DeletePageNodePayload,
  DeleteSectionViewPayload,
  DeleteTargetPageSectionPayload,
  ModalSectionNode,
  RootComponentNode,
  RootComponentNodeProps,
  SectionViewShape,
  SetGlobalStatePayload,
  SortComponentNodeChildrenPayload,
  UpdateComponentDisplayNamePayload,
  UpdateComponentNodeHeightPayload,
  UpdateComponentPropsPayload,
  UpdateComponentReflowPayload,
  UpdateSectionViewPropsPayload,
  UpdateTargetPageLayoutPayload,
  UpdateTargetPagePropsPayload,
  ViewportSizeType,
} from "@/redux/currentApp/editor/components/componentsState"
import { getNewWidgetPropsByUpdateSlice } from "@/utils/componentNode"
import { DisplayNameGenerator } from "@/utils/generators/generateDisplayName"
import {
  generateModalSectionConfig,
  generateSectionConfig,
  generateSectionContainerConfig,
  layoutValueMapGenerateConfig,
} from "@/utils/generators/generatePageOrSectionConfig"
import { isObject } from "@/utils/typeHelper"

export const initComponentReducer: CaseReducer<
  ComponentsState,
  PayloadAction<ComponentsState>
> = (state, action) => {
  return action.payload
}

// update real-time
export const addComponentReducer: CaseReducer<
  ComponentsState,
  PayloadAction<ComponentNode[]>
> = (state, action) => {
  action.payload.forEach((dealNode) => {
    if (state == null || dealNode.parentNode == null) {
      return state
    } else {
      const parentNode = searchDsl(state, dealNode.parentNode)
      if (parentNode != null) {
        if (dealNode.props) {
          dealNode.props = getNewWidgetPropsByUpdateSlice(
            dealNode.props ?? {},
            {},
          )
        }
        if (!Array.isArray(parentNode.childrenNode)) {
          parentNode.childrenNode = [dealNode]
        } else {
          parentNode.childrenNode.push(dealNode)
        }
      }
    }
  })
}

export const addModalComponentReducer: CaseReducer<
  ComponentsState,
  PayloadAction<AddModalComponentPayload>
> = (state, action) => {
  const { currentPageDisplayName, modalComponentNode } = action.payload
  if (!currentPageDisplayName || !modalComponentNode) {
    return state
  }
  const currentPageNode = searchDsl(state, currentPageDisplayName)
  if (currentPageNode == null || !Array.isArray(currentPageNode.childrenNode))
    return state
  const modalSectionNode = currentPageNode.childrenNode.find((child) => {
    return child.type === "MODAL_SECTION_NODE"
  }) as ModalSectionNode | undefined
  if (!modalSectionNode) {
    const newModalSectionNode = generateModalSectionConfig(
      currentPageDisplayName,
      "modalSection",
    )
    modalComponentNode.parentNode = newModalSectionNode.displayName
    newModalSectionNode.childrenNode = [modalComponentNode]
    currentPageNode.childrenNode.push(newModalSectionNode)
  } else {
    modalComponentNode.parentNode = modalSectionNode.displayName
    if (!Array.isArray(modalSectionNode.childrenNode)) {
      modalSectionNode.childrenNode = []
    }
    modalSectionNode.childrenNode.push(modalComponentNode)
  }
}

export const deleteComponentNodeReducer: CaseReducer<
  ComponentsState,
  PayloadAction<DeleteComponentNodePayload>
> = (state, action) => {
  const { displayNames } = action.payload
  if (state == null) {
    return
  }
  const rootNode = state
  const allDisplayNames = [...displayNames]
  displayNames.forEach((value) => {
    const searchNode = searchDsl(rootNode, value)
    if (!searchNode) return
    const searchNodeChildNodes = searchNode.childrenNode
    searchNodeChildNodes?.forEach((node) => {
      allDisplayNames.push(node.displayName)
    })
    const parentNode = searchDsl(rootNode, searchNode.parentNode)
    if (parentNode == null) {
      return
    }
    const childrenNodes = parentNode.childrenNode
    if (childrenNodes == null) {
      return
    }

    const currentIndex = childrenNodes.findIndex((value) => {
      return value.displayName === searchNode.displayName
    })
    childrenNodes.splice(currentIndex, 1)
  })
  DisplayNameGenerator.removeDisplayNameMulti(allDisplayNames)
}

export const deletePageNodeReducer: CaseReducer<
  ComponentsState,
  PayloadAction<DeletePageNodePayload>
> = (state, action) => {
  const { displayName } = action.payload
  if (state == null) {
    return
  }
  const rootNode = state

  const searchNode = searchDsl(rootNode, displayName)
  if (!searchNode) return
  const parentNode = rootNode as RootComponentNode
  const childrenNodes = parentNode.childrenNode
  const currentIndex = childrenNodes.findIndex((value) => {
    return value.displayName === searchNode.displayName
  })
  childrenNodes.splice(currentIndex, 1)
  const indexOfSortedKey = parentNode.props.pageSortedKey.findIndex(
    (key) => key === displayName,
  )
  if (indexOfSortedKey === -1) return
  parentNode.props.pageSortedKey.splice(indexOfSortedKey, 1)
  DisplayNameGenerator.removeDisplayName(displayName)
}

export const sortComponentNodeChildrenReducer: CaseReducer<
  ComponentsState,
  PayloadAction<SortComponentNodeChildrenPayload>
> = (state, action) => {
  const { parentDisplayName, newChildrenNode } = action.payload
  const parentNode = searchDsl(state, parentDisplayName)
  if (!parentNode) return
  parentNode.childrenNode = newChildrenNode
}

export const updateComponentPropsReducer: CaseReducer<
  ComponentsState,
  PayloadAction<UpdateComponentPropsPayload>
> = (state, action) => {
  const { displayName, updateSlice } = action.payload
  if (!isObject(updateSlice) || !displayName) {
    return
  }
  const node = searchDsl(state, displayName)
  if (!node) return
  const widgetProps = node.props || {}
  const clonedWidgetProps = cloneDeep(widgetProps)
  node.props = getNewWidgetPropsByUpdateSlice(updateSlice, clonedWidgetProps)
}

export const updateMultiComponentPropsReducer: CaseReducer<
  ComponentsState,
  PayloadAction<UpdateComponentPropsPayload[]>
> = (state, action) => {
  action.payload.forEach(({ displayName, updateSlice }) => {
    if (!isObject(updateSlice) || !displayName) {
      return
    }
    const node = searchDsl(state, displayName)
    if (!node) return
    const widgetProps = node.props || {}
    const clonedWidgetProps = cloneDeep(widgetProps)
    node.props = getNewWidgetPropsByUpdateSlice(updateSlice, clonedWidgetProps)
  })
}

export const batchUpdateMultiComponentSlicePropsReducer: CaseReducer<
  ComponentsState,
  PayloadAction<UpdateComponentSlicePropsPayload[]>
> = (state, action) => {
  action.payload.forEach(({ displayName, propsSlice }) => {
    if (!isObject(propsSlice) || !displayName) {
      return
    }
    const node = searchDsl(state, displayName)
    if (!node) return
    const widgetProps = node.props || {}
    const clonedWidgetProps = cloneDeep(widgetProps)
    Object.keys(propsSlice).forEach((path) => {
      const newValue = propsSlice[path]
      set(clonedWidgetProps, path, newValue)
    })
    node.props = clonedWidgetProps
  })
}

const changeDisplayName = (
  newDisplayName: string,
  displayName: string,
  state: ComponentsState,
) => {
  if (!newDisplayName || !displayName) {
    return
  }
  const node = searchDsl(state, displayName)
  if (!node) return
  node.displayName = newDisplayName
  if (Array.isArray(node.childrenNode)) {
    node.childrenNode.forEach((child) => {
      child.parentNode = newDisplayName
    })
  }
  const parentNode = searchDsl(state, node.parentNode)
  if (parentNode && parentNode.props) {
    if (Array.isArray(parentNode.props.pageSortedKey)) {
      const indexOfOldDisplayName = parentNode.props.pageSortedKey.findIndex(
        (originDisplayName) => originDisplayName === displayName,
      )
      if (indexOfOldDisplayName !== -1) {
        parentNode.props.pageSortedKey.splice(
          indexOfOldDisplayName,
          1,
          newDisplayName,
        )
      }
    }
    if (Array.isArray(parentNode.props.viewSortedKey)) {
      const indexOfOldDisplayName = parentNode.props.viewSortedKey.findIndex(
        (originDisplayName) => originDisplayName === displayName,
      )
      if (indexOfOldDisplayName !== -1) {
        parentNode.props.pageSortedKey.splice(
          indexOfOldDisplayName,
          1,
          newDisplayName,
        )
      }
    }
    if (parentNode.displayName === "root" && parentNode.props) {
      if (parentNode.props.homepageDisplayName === displayName) {
        parentNode.props.homepageDisplayName = newDisplayName
      }
      if (!parentNode.props.homepageDisplayName) {
        parentNode.props.homepageDisplayName = parentNode.props.pageSortedKey[0]
      }
    }
  }
}

export const updateComponentDisplayNameReducer: CaseReducer<
  ComponentsState,
  PayloadAction<UpdateComponentDisplayNamePayload>
> = (state, action) => {
  const { displayName, newDisplayName } = action.payload
  changeDisplayName(newDisplayName, displayName, state)
}

export const updateComponentContainerReducer: CaseReducer<
  ComponentsState,
  PayloadAction<UpdateComponentContainerPayload>
> = (state, action) => {
  const { oldParentNodeDisplayName, newParentNodeDisplayName, updateSlices } =
    action.payload

  if (oldParentNodeDisplayName === newParentNodeDisplayName) {
    updateSlices.forEach((slice) => {
      const currentNode = searchDsl(state, slice.displayName)
      if (!currentNode) return
      currentNode.x = slice.x
      currentNode.y = slice.y
      currentNode.w = slice.w
      currentNode.h = slice.h
    })
    return
  }

  updateSlices.forEach((slice) => {
    // delete Old
    const currentNode = searchDsl(state, slice.displayName)
    if (!currentNode) return
    const olaParentNode = searchDsl(state, oldParentNodeDisplayName)
    if (!olaParentNode) return
    const currentIndex = olaParentNode.childrenNode.findIndex(
      (node) => node.displayName === currentNode.displayName,
    )
    if (currentIndex === -1) return
    olaParentNode.childrenNode.splice(currentIndex, 1)
    // add New
    const newParentNode = searchDsl(state, newParentNodeDisplayName)
    if (!newParentNode) return
    currentNode.parentNode = newParentNodeDisplayName
    currentNode.x = slice.x
    currentNode.y = slice.y
    currentNode.w = slice.w
    currentNode.h = slice.h
    if (!Array.isArray(newParentNode.childrenNode)) {
      newParentNode.childrenNode = [currentNode]
    } else {
      newParentNode.childrenNode.push(currentNode)
    }
  })
}

export const updateComponentReflowReducer: CaseReducer<
  ComponentsState,
  PayloadAction<UpdateComponentReflowPayload[]>
> = (state, action) => {
  const payloadArray = action.payload
  payloadArray.forEach((payload) => {
    const { parentDisplayName, childNodes } = payload
    const targetNode = searchDsl(state, parentDisplayName)
    if (targetNode) {
      const childNodesDisplayNamesMap = new Map()
      childNodes.forEach((node) => {
        childNodesDisplayNamesMap.set(node.displayName, node)
      })
      targetNode.childrenNode = targetNode.childrenNode?.map((node) => {
        if (childNodesDisplayNamesMap.has(node.displayName)) {
          const newPositionNode = childNodesDisplayNamesMap.get(
            node.displayName,
          )
          return {
            ...node,
            w: newPositionNode.w,
            h: newPositionNode.h,
            x: newPositionNode.x,
            y: newPositionNode.y,
          }
        }
        return node
      })
    }
  })
}

export const updateHeaderSectionReducer: CaseReducer<
  ComponentsState,
  PayloadAction<string>
> = (state, action) => {
  const { payload } = action
  const targetSection = searchDsl(state, "headerSection")
  if (targetSection) {
    targetSection.props = {
      ...targetSection.props,
      height: payload,
    }
  }
}

const transComponentNode = (node: ComponentNode, displayName: string[]) => {
  if (Array.isArray(node.childrenNode)) {
    node.childrenNode.forEach((child) => {
      displayName.push(child.displayName)
      transComponentNode(child, displayName)
    })
  }
}

export const updateTargetPageLayoutReducer: CaseReducer<
  ComponentsState,
  PayloadAction<UpdateTargetPageLayoutPayload>
> = (state, action) => {
  if (!state) return state
  const { pageName, layout } = action.payload
  const config = layoutValueMapGenerateConfig[layout]
  let targetPageNodeIndex = state.childrenNode.findIndex(
    (node) => node.displayName === pageName,
  )
  if (targetPageNodeIndex === -1) return state
  const targetPageNode = state.childrenNode[targetPageNodeIndex]
  const allComponentDisplayName: string[] = []
  transComponentNode(targetPageNode, allComponentDisplayName)
  const pageConfig = config(targetPageNode.displayName)
  DisplayNameGenerator.removeDisplayNameMulti(allComponentDisplayName)
  state.childrenNode.splice(targetPageNodeIndex, 1, pageConfig)
}

export const updateTargetPagePropsReducer: CaseReducer<
  ComponentsState,
  PayloadAction<UpdateTargetPagePropsPayload>
> = (state, action) => {
  if (!state?.props) return state
  const { pageName, newProps } = action.payload
  const currentPage = state.childrenNode.find(
    (node) => node.displayName === pageName,
  )
  if (!currentPage) return state
  currentPage.props = {
    ...currentPage.props,
    ...newProps,
  }
}

const generationPageOptionsWhenDelete = (
  deletedSectionName:
    | "leftSection"
    | "rightSection"
    | "headerSection"
    | "footerSection",
) => {
  switch (deletedSectionName) {
    case "leftSection": {
      return {
        hasLeft: false,
        leftWidth: 0,
        leftPosition: "NONE",
        layout: "Custom",
      }
    }
    case "rightSection": {
      return {
        hasRight: false,
        rightWidth: 0,
        rightPosition: "NONE",
        layout: "Custom",
      }
    }
    case "headerSection": {
      return {
        hasHeader: false,
        topHeight: 0,
        layout: "Custom",
      }
    }
    case "footerSection": {
      return {
        hasFooter: false,
        bottomHeight: 0,
        layout: "Custom",
      }
    }
  }
}

export const deleteTargetPageSectionReducer: CaseReducer<
  ComponentsState,
  PayloadAction<DeleteTargetPageSectionPayload>
> = (state, action) => {
  if (!state?.childrenNode) return state
  const { pageName, deleteSectionName } = action.payload
  const targetPageIndex = state.childrenNode.findIndex(
    (node) => node.displayName === pageName,
  )
  if (targetPageIndex === -1) return state
  const targetPage = cloneDeep(state.childrenNode[targetPageIndex])

  targetPage.props = {
    ...targetPage.props,
    ...generationPageOptionsWhenDelete(deleteSectionName),
  }

  const targetPageChildrenNodeIndex = targetPage.childrenNode.findIndex(
    (node) => node.showName === deleteSectionName,
  )
  if (targetPageChildrenNodeIndex === -1) return state
  targetPage.childrenNode.splice(targetPageChildrenNodeIndex, 1)
  state.childrenNode.splice(targetPageIndex, 1, targetPage)
}

const generationPageOptionsWhenAdd = (
  deletedSectionName:
    | "leftSection"
    | "rightSection"
    | "headerSection"
    | "footerSection",
) => {
  switch (deletedSectionName) {
    case "leftSection": {
      return {
        hasLeft: true,
        leftWidth: 20,
        leftPosition: "FULL",
        layout: "Custom",
      }
    }
    case "rightSection": {
      return {
        hasRight: true,
        rightWidth: 20,
        rightPosition: "FULL",
        layout: "Custom",
      }
    }
    case "headerSection": {
      return {
        hasHeader: true,
        topHeight: 96,
        layout: "Custom",
      }
    }
    case "footerSection": {
      return {
        hasFooter: true,
        bottomHeight: 96,
        layout: "Custom",
      }
    }
  }
}

export const addTargetPageSectionReducer: CaseReducer<
  ComponentsState,
  PayloadAction<AddTargetPageSectionPayload>
> = (state, action) => {
  if (!state?.childrenNode) return state
  const { pageName, addedSectionName } = action.payload
  const targetPageIndex = state.childrenNode.findIndex(
    (node) => node.displayName === pageName,
  )
  if (targetPageIndex === -1) return state
  const targetPage = cloneDeep(state.childrenNode[targetPageIndex])

  targetPage.props = {
    ...targetPage.props,
    ...generationPageOptionsWhenAdd(addedSectionName),
  }

  const config = generateSectionConfig(pageName, addedSectionName)
  if (!config) return state
  targetPage.childrenNode.push(config)
  state.childrenNode.splice(targetPageIndex, 1, targetPage)
}

export const updateRootNodePropsReducer: CaseReducer<
  ComponentsState,
  PayloadAction<Partial<RootComponentNodeProps>>
> = (state, action) => {
  if (!state) return state
  if (!state.props) {
    state.props = action.payload
  } else {
    state.props = {
      ...state.props,
      ...action.payload,
    }
  }
}

export const addPageNodeWithSortOrderReducer: CaseReducer<
  ComponentsState,
  PayloadAction<ComponentNode[]>
> = (state, action) => {
  action.payload.forEach((node) => {
    const parentNode = searchDsl(
      state,
      node.parentNode,
    ) as RootComponentNode | null
    if (!parentNode) return
    parentNode.props.pageSortedKey.push(node.displayName)
    if (!Array.isArray(parentNode.childrenNode)) {
      parentNode.childrenNode = [node]
    } else {
      parentNode.childrenNode.push(node)
    }
  })
}

export const addSectionViewReducer: CaseReducer<
  ComponentsState,
  PayloadAction<AddSectionViewPayload>
> = (state, action) => {
  const { parentNodeName, sectionName } = action.payload

  const parentNode = searchDsl(state, parentNodeName)
  if (!parentNode || !parentNode.props) return
  const config = generateSectionContainerConfig(
    parentNodeName,
    `${sectionName}Container`,
  )
  const hasKeys = parentNode.props.sectionViewConfigs.map(
    (item: SectionViewShape) => {
      return `${parentNodeName}-${item.key}`
    },
  )
  const newSectionViewConfig = generateNewViewItem(
    hasKeys,
    config.displayName,
    parentNodeName,
  )
  parentNode.childrenNode.push(config)
  parentNode.props.viewSortedKey.push(config.displayName)
  parentNode.props.sectionViewConfigs.push(newSectionViewConfig)
}

export const updateSectionViewPropsReducer: CaseReducer<
  ComponentsState,
  PayloadAction<UpdateSectionViewPropsPayload>
> = (state, action) => {
  const { parentNodeName, newProps } = action.payload
  const parentNode = searchDsl(state, parentNodeName)
  if (!parentNode || !parentNode.props) return
  parentNode.props = {
    ...parentNode.props,
    ...newProps,
  }
}

export const deleteSectionViewReducer: CaseReducer<
  ComponentsState,
  PayloadAction<DeleteSectionViewPayload>
> = (state, action) => {
  const { viewDisplayName } = action.payload
  const currentNode = searchDsl(state, viewDisplayName)
  if (!currentNode) return
  const parentNode = searchDsl(state, currentNode.parentNode)
  if (!parentNode || !parentNode.props) return
  const currentIndex = parentNode.childrenNode.findIndex(
    (node) => node.displayName === viewDisplayName,
  )
  if (currentIndex === -1) return
  parentNode.childrenNode.splice(currentIndex, 1)
  const viewSortedKeyIndex = parentNode.props.viewSortedKey.findIndex(
    (key: string) => key === viewDisplayName,
  )
  if (viewSortedKeyIndex === -1) return
  parentNode.props.viewSortedKey.splice(viewSortedKeyIndex, 1)
  const sectionViewConfigsIndex = parentNode.props.sectionViewConfigs.findIndex(
    (config: SectionViewShape) => config.viewDisplayName === viewDisplayName,
  )
  if (sectionViewConfigsIndex === -1) return
  parentNode.props.sectionViewConfigs.splice(sectionViewConfigsIndex, 1)
}

export const updateViewportSizeReducer: CaseReducer<
  ComponentsState,
  PayloadAction<{
    viewportWidth?: number
    viewportHeight?: number
    viewportSizeType?: ViewportSizeType
  }>
> = (state, action) => {
  if (!state) return
  if (!state.props) state.props = {}
  state.props.viewportWidth = action.payload.viewportWidth
  state.props.viewportHeight = action.payload.viewportHeight
  state.props.viewportSizeType = action.payload.viewportSizeType
}

export const resetComponentsReducer: CaseReducer<
  ComponentsState,
  PayloadAction
> = () => {
  return ComponentsInitialState
}

const updateComponentLayoutInfoHelper = (
  state: ComponentsState,
  displayName: string,
  layoutInfo: Partial<LayoutInfo>,
) => {
  let currentNode = searchDsl(state, displayName)
  if (!currentNode || !layoutInfo || Object.keys(layoutInfo).length === 0)
    return
  ;(Object.keys(layoutInfo) as Partial<Array<keyof LayoutInfo>>).forEach(
    (key) => {
      ;(currentNode as ComponentNode)[key as keyof LayoutInfo] = layoutInfo[
        key as keyof LayoutInfo
      ] as number
    },
  )
}

export const updateComponentNodeHeightReducer: CaseReducer<
  ComponentsState,
  PayloadAction<UpdateComponentNodeHeightPayload>
> = (state, action) => {
  if (!state) return
  const { displayName, height } = action.payload
  const currentNode = searchDsl(state, displayName)
  if (!currentNode) return
  currentNode.h = Math.max(height, currentNode.minH)
}

export const updateComponentLayoutInfoReducer: CaseReducer<
  ComponentsState,
  PayloadAction<UpdateComponentNodeLayoutInfoPayload>
> = (state, action) => {
  if (!state) return
  const { displayName, layoutInfo } = action.payload
  updateComponentLayoutInfoHelper(state, displayName, layoutInfo)
}

export const batchUpdateComponentLayoutInfoWhenReflowReducer: CaseReducer<
  ComponentsState,
  PayloadAction<BatchUpdateComponentNodeLayoutInfoPayload[]>
> = (state, action) => {
  if (!state) return
  action.payload.forEach((updateSlice) => {
    const { displayName, layoutInfo } = updateSlice
    updateComponentLayoutInfoHelper(state, displayName, layoutInfo)
  })
}

export const batchUpdateComponentLayoutInfoReducer: CaseReducer<
  ComponentsState,
  PayloadAction<UpdateComponentNodeLayoutInfoPayload[]>
> = (state, action) => {
  if (!state) return
  action.payload.forEach((updateSlice) => {
    const { displayName, layoutInfo } = updateSlice
    updateComponentLayoutInfoHelper(state, displayName, layoutInfo)
  })
}

export const setGlobalStateReducer: CaseReducer<
  ComponentsState,
  PayloadAction<SetGlobalStatePayload>
> = (state, action) => {
  if (!state) return
  const { value, key, oldKey } = action.payload
  const originGlobalData = state.props?.globalData || {}
  if (oldKey && originGlobalData[oldKey]) {
    delete originGlobalData[oldKey]
  }
  const newProps = {
    ...state.props,
    globalData: {
      ...originGlobalData,
      [key]: value,
    },
  }
  state.props = getNewWidgetPropsByUpdateSlice(
    newProps ?? {},
    state.props ?? {},
  )
}

export const deleteGlobalStateByKeyReducer: CaseReducer<
  ComponentsState,
  PayloadAction<DeleteGlobalStatePayload>
> = (state, action) => {
  if (!state || !state.props) return
  const { key } = action.payload
  const originGlobalData = state.props?.globalData || {}
  if (Object.hasOwn(originGlobalData, key)) delete originGlobalData[key]
}
