resource "google_sql_database_instance" "db_instance" {
  name             = var.database_instance_name
  database_version = "MYSQL_8_0"
  region           = var.region

  settings {
    tier = "db-n1-standard-1"
    ip_configuration {
      ipv4_enabled = true
    }

    backup_configuration {
      enabled = false
    }
  }
  deletion_protection = false
}

resource "google_sql_user" "db_user" {
  name     = var.db_username
  instance = google_sql_database_instance.db_instance.name
  password = var.dbuser_pass
}

resource "google_sql_database" "db" {
  name     = var.db_name
  instance = google_sql_database_instance.db_instance.name
}

resource "google_cloud_run_service" "cloud-run-tf" {
  name     = "cloud-run-tf"
  location = var.region

  template {
    spec {
      containers {
        image = var.flask-app-image
        env {
          name  = "DB_HOST"
          value = google_sql_database_instance.db_instance.connection_name
        }
        env {
          name  = "DB_NAME"
          value = google_sql_database.db.name
        }
        env {
          name  = "DB_USER"
          value = google_sql_user.db_user.name
        }
        env {
          name  = "DB_PASS"
          value = var.dbuser_pass
        }
        env {
          name  = "SECRET_KEY"
          value = var.flask_secretkey
        }
        env {
          name  = "DB_URI"
          value = "mysql+pymysql://${google_sql_user.db_user.name}:${var.dbuser_pass}@/${google_sql_database.db.name}?unix_socket=/cloudsql/${google_sql_database_instance.db_instance.connection_name}"
        }
      }
    }

    metadata {
      annotations = {
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.db_instance.connection_name
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

resource "google_storage_bucket" "function_bucket" {
  name     = "${var.project_id}-function-bucket"
  location = var.region
}

resource "google_storage_bucket_object" "function_code" {
  name   = var.function_code
  bucket = google_storage_bucket.function_bucket.name
  source = var.function_path
}

resource "google_cloudfunctions_function" "daily_email_function" {
  name        = "daily-email-function"
  runtime     = "python39"
  region      = var.region
  entry_point = "main"
  trigger_http = true

  environment_variables = {
    DATABASE_NAME         = var.database_instance_name
    SQL_INSTANCE_CONN     = google_sql_database_instance.db_instance.connection_name
    DB_URI                = "mysql+pymysql://${google_sql_user.db_user.name}:${var.dbuser_pass}@/${google_sql_database.db.name}?unix_socket=/cloudsql/${google_sql_database_instance.db_instance.connection_name}"
    SENDGRID_API_KEY      = var.SendGrid_API_Key
    SENDGRID_EMAIL        = var.SendGrid_Email
  }

  source_archive_bucket = google_storage_bucket.function_bucket.name
  source_archive_object = google_storage_bucket_object.function_code.name

  depends_on = [
    google_project_iam_member.cloud_run_cloudsql_client
  ]
}

resource "google_cloud_scheduler_job" "daily_email_job" {
  name        = "daily-email-job"
  region      = var.region
  schedule    = "0 8 * * *"
  time_zone   = "Europe/Warsaw"

  http_target {
    http_method = "GET"
    uri         = google_cloudfunctions_function.daily_email_function.https_trigger_url
  }
}

resource "google_logging_metric" "endpoint_metrics" {
  count = length(var.endpoints)

  name        = format("endpoint_%s_calls_total", var.endpoints[count.index])
  description = format("Log-based metric for endpoint: %s", var.endpoints[count.index])
  filter      = format("resource.type=\"cloud_run_revision\" AND jsonPayload.endpoint=\"%s\"", var.endpoints[count.index])

  label_extractors = {
    status = "EXTRACT(jsonPayload.status)"
  }

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key         = "status"
      value_type  = "STRING"
      description = "HTTP response status"
    }
  }
}
