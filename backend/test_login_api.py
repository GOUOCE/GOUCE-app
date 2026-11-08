import urllib.request
import json

url = "http://localhost:8000/auth/login"
payload = {
    "email": "admin@gouce.com.br",
    "senha": "Admin@123456",
    "lembrar_me": False
}
req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
try:
    with urllib.request.urlopen(req) as resp:
        print("Status:", resp.status)
        print("Response:", resp.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
