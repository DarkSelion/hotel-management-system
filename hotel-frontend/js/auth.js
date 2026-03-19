async function login() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.classList.add('d-none');

  if (!email || !password) {
    errorMsg.textContent = 'Please enter email and password.';
    errorMsg.classList.remove('d-none');
    return;
  }
  try {
    const res  = await fetch(`${API}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));
      window.location.href = 'dashboard.html';
    } else {
      errorMsg.textContent = data.message;
      errorMsg.classList.remove('d-none');
    }
  } catch (err) {
    errorMsg.textContent = 'Cannot connect to server. Make sure backend is running.';
    errorMsg.classList.remove('d-none');
  }
}

document.addEventListener('keypress', e => {
  if (e.key === 'Enter') login();
});