import os
import sqlalchemy
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from sqlalchemy.sql import text

def get_db_connection():
    db_uri = os.getenv('DB_URI')
    if not db_uri:
        raise ValueError("DB_URI environment variable not set.")

    try:
        engine = sqlalchemy.create_engine(db_uri, pool_size=5, pool_timeout=30, pool_recycle=1800)
        conn = engine.connect()
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        raise

def fetch_users_and_balances(conn):
    query = text("""
        SELECT
            u.username AS nick,
            u.email_address AS email,
            GROUP_CONCAT(CONCAT(c.currency_code, ': ', c.sum_amount) SEPARATOR ', ') AS waluty_zsumowane
        FROM user u
        JOIN (
            SELECT w.user_id, w.currency_code, SUM(w.amount) AS sum_amount
            FROM wallet w
            GROUP BY w.user_id, w.currency_code
        ) c ON u.id = c.user_id
        GROUP BY u.id, u.username, u.email_address;
    """)

    result = conn.execute(query)
    rows = result.mappings().all()
    return [(row['email'], row['waluty_zsumowane']) for row in rows]

def send_email(sendgrid_client, to_email, amount_summary):
    message = Mail(
        from_email=os.getenv('SENDGRID_EMAIL'),
        to_emails=to_email,
        subject='Your Account Balance',
        html_content=f"<p>Your current balances: {amount_summary}</p>"
    )
    response = sendgrid_client.send(message)
    return response.status_code

def main(request):
    sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
    if not sendgrid_api_key:
        print("SENDGRID_API_KEY not set.")
        return ("Internal server error", 500)

    sendgrid_client = SendGridAPIClient(sendgrid_api_key)
    conn = None
    try:
        conn = get_db_connection()
        users = fetch_users_and_balances(conn)

        if not users:
            print("No users found.")
            return ("No users to send emails to.", 200)

        for email, amount_summary in users:
            status = send_email(sendgrid_client, email, amount_summary)
            if status != 202:
                print(f"Failed to send email to {email}, status code: {status}")

        return ("Emails sent successfully", 200)
    except Exception as e:
        print(f"Error in main function: {str(e)}")
        return ("An error occurred", 500)
    finally:
        if conn:
            conn.close()
