import { ReactElement } from "react"
import { AirtableIcon } from "@/page/App/components/Icons/airtable"
import { AppwriteIcon } from "@/page/App/components/Icons/appwrite"
import { ClickhouseIcon } from "@/page/App/components/Icons/clickhouse"
import { CouchDBIcon } from "@/page/App/components/Icons/couchdb"
import { DynamoIcon } from "@/page/App/components/Icons/dynamo"
import { ElasticIcon } from "@/page/App/components/Icons/elastic"
import { FirebaseIcon } from "@/page/App/components/Icons/firebase"
import { GoogleSheetIcon } from "@/page/App/components/Icons/googlesheets"
import { GraphQLIcon } from "@/page/App/components/Icons/graphql"
import { HuggingFaceIcon } from "@/page/App/components/Icons/huggingface"
import { MariaDbIcon } from "@/page/App/components/Icons/mariadb"
import { MicrosoftSqlIcon } from "@/page/App/components/Icons/microsoftsql"
import { MongoDbIcon } from "@/page/App/components/Icons/mongodb"
import { MySqlIcon } from "@/page/App/components/Icons/mysql"
import { NeonIcon } from "@/page/App/components/Icons/neon"
import { OracleDBIcon } from "@/page/App/components/Icons/oracle"
import { PostgreSqlIcon } from "@/page/App/components/Icons/postgresql"
import { RedisIcon } from "@/page/App/components/Icons/redis"
import { RestApiIcon } from "@/page/App/components/Icons/restapi"
import { S3Icon } from "@/page/App/components/Icons/s3"
import { SmtpIcon } from "@/page/App/components/Icons/smtp"
import { SnowflakeIcon } from "@/page/App/components/Icons/snowflake"
import { SupabaseIcon } from "@/page/App/components/Icons/supabase"
import { TidbIcon } from "@/page/App/components/Icons/tidb"
import { TransformerIcon } from "@/page/App/components/Icons/transformer"
import { UpstashIcon } from "@/page/App/components/Icons/upstash"
import { ActionType } from "@/redux/currentApp/action/actionState"
import { ResourceType } from "@/redux/resource/resourceState"

export function getIconFromResourceType(
  type: ResourceType,
  size: string,
): ReactElement | null {
  switch (type) {
    case "supabasedb":
      return <SupabaseIcon size={size} />
    case "graphql":
      return <GraphQLIcon size={size} />
    case "elasticsearch":
      return <ElasticIcon size={size} />
    case "dynamodb":
      return <DynamoIcon size={size} />
    case "snowflake":
      return <SnowflakeIcon size={size} />
    case "smtp":
      return <SmtpIcon size={size} />
    case "googlesheets":
      return <GoogleSheetIcon size={size} />
    case "hfendpoint":
    case "huggingface":
      return <HuggingFaceIcon size={size} />
    case "mariadb":
      return <MariaDbIcon size={size} />
    case "tidb":
      return <TidbIcon size={size} />
    case "neon":
      return <NeonIcon size={size} />
    case "s3":
      return <S3Icon size={size} />
    case "mysql":
      return <MySqlIcon size={size} />
    case "mssql":
      return <MicrosoftSqlIcon size={size} />
    case "restapi":
      return <RestApiIcon size={size} />
    case "mongodb":
      return <MongoDbIcon size={size} />
    case "redis":
      return <RedisIcon size={size} />
    case "upstash":
      return <UpstashIcon size={size} />
    case "postgresql":
      return <PostgreSqlIcon size={size} />
    case "firebase":
      return <FirebaseIcon size={size} />
    case "clickhouse":
      return <ClickhouseIcon size={size} />
    case "couchdb":
      return <CouchDBIcon size={size} />
    case "oracle":
      return <OracleDBIcon size={size} />
    case "appwrite":
      return <AppwriteIcon size={size} />
    case "airtable":
      return <AirtableIcon size={size} />
  }
  return null
}

export function getIconFromActionType(
  type: ActionType,
  size: string,
): ReactElement | null {
  switch (type) {
    case "graphql":
      return <GraphQLIcon size={size} />
    case "elasticsearch":
      return <ElasticIcon size={size} />
    case "dynamodb":
      return <DynamoIcon size={size} />
    case "snowflake":
      return <SnowflakeIcon size={size} />
    case "supabasedb":
      return <SupabaseIcon size={size} />
    case "smtp":
      return <SmtpIcon size={size} />
    case "googlesheets":
      return <GoogleSheetIcon size={size} />
    case "hfendpoint":
    case "huggingface":
      return <HuggingFaceIcon size={size} />
    case "transformer":
      return <TransformerIcon size={size} />
    case "mariadb":
      return <MariaDbIcon size={size} />
    case "tidb":
      return <TidbIcon size={size} />
    case "neon":
      return <NeonIcon size={size} />
    case "s3":
      return <S3Icon size={size} />
    case "mysql":
      return <MySqlIcon size={size} />
    case "mssql":
      return <MicrosoftSqlIcon size={size} />
    case "restapi":
      return <RestApiIcon size={size} />
    case "mongodb":
      return <MongoDbIcon size={size} />
    case "redis":
      return <RedisIcon size={size} />
    case "upstash":
      return <UpstashIcon size={size} />
    case "postgresql":
      return <PostgreSqlIcon size={size} />
    case "firebase":
      return <FirebaseIcon size={size} />
    case "clickhouse":
      return <ClickhouseIcon size={size} />
    case "oracle":
      return <OracleDBIcon size={size} />
    case "couchdb":
      return <CouchDBIcon size={size} />
    case "appwrite":
      return <AppwriteIcon size={size} />
    case "airtable":
      return <AirtableIcon size={size} />
  }
  return null
}
