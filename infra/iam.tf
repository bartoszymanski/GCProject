data "google_iam_policy" "cloudrun_noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

data "google_iam_policy" "cloud_function_noauth" {
  binding {
    role = "roles/cloudfunctions.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "noauth" {
  location = google_cloud_run_service.cloud-run-tf.location
  project  = google_cloud_run_service.cloud-run-tf.project
  service  = google_cloud_run_service.cloud-run-tf.name
  policy_data = data.google_iam_policy.cloudrun_noauth.policy_data
}

resource "google_project_iam_member" "cloud_run_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = var.project_email
}

resource "google_cloudfunctions_function_iam_policy" "noauth" {
  project      = google_cloudfunctions_function.daily_email_function.project
  region       = google_cloudfunctions_function.daily_email_function.region
  cloud_function = google_cloudfunctions_function.daily_email_function.name
  policy_data  = data.google_iam_policy.cloud_function_noauth.policy_data
}