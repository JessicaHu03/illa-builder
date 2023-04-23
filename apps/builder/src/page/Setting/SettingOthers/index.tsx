import { FC, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSelector } from "react-redux"
import { Button, Select } from "@illa-design/react"
import { LabelAndSetter } from "@/page/Setting/Components/LabelAndSetter"
import { publicButtonWrapperStyle } from "@/page/Setting/SettingAccount/style"
import { getCurrentUser } from "@/redux/currentUser/currentUserSelector"
import { fetchChangeLanguage } from "@/services/setting"

const options = [
  {
    label: "English",
    value: "en-US",
  },
  {
    label: "简体中文",
    value: "zh-CN",
  },
  {
    label: "한국인",
    value: "ko-KR",
  },
  {
    label: "日本語",
    value: "ja-JP",
  },
]

export const SettingOthers: FC = () => {
  const { t } = useTranslation()
  const userLanguage = useSelector(getCurrentUser).language || "en-US"

  const [languageValue, setLanguageValue] = useState(userLanguage)

  const [isLoading, setIsLoading] = useState(false)

  // TODO: @aruseito hack method,wait Router defender perfect
  useEffect(() => {
    setLanguageValue(userLanguage || "en-US")
  }, [userLanguage])

  const handleChangeLanguage = (value: string) => {
    setLanguageValue(value)
  }

  const isButtonDisabled = languageValue === userLanguage

  const handleClickSubmit = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetchChangeLanguage(languageValue)
      localStorage.setItem("i18nextLng", languageValue)
      window.location.reload()
    } catch (e) {
      console.error(e)
    }
    setIsLoading(false)
  }, [languageValue])

  return (
    <>
      <LabelAndSetter errorMessage="" label={t("setting.other.language")}>
        <Select
          colorScheme="techPurple"
          size="large"
          options={options}
          value={languageValue}
          onChange={(value) => {
            handleChangeLanguage(value as string)
          }}
        />
      </LabelAndSetter>

      <div css={publicButtonWrapperStyle}>
        <Button
          size="large"
          fullWidth
          disabled={isButtonDisabled}
          loading={isLoading}
          colorScheme="techPurple"
          onClick={handleClickSubmit}
        >
          {t("setting.password.submit_button")}
        </Button>
      </div>
    </>
  )
}

SettingOthers.displayName = "SettingOthers"
