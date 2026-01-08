
async function login() {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username.value,
      password: password.value
    })
  });

  if (!res.ok) {
    alert("Login failed");
    return;
  }

  const user = await res.json();

  // ✅ STORE USER
  localStorage.setItem("user", JSON.stringify(user));

  window.location.href = "/dashboard.html";
}
