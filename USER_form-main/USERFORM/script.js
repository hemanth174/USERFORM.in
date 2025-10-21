import { showToast } from "./toastMessage.js";

//put Method to update password
function initializeForgotPasswordForm() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (!forgotPasswordForm) return;

    forgotPasswordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = forgotPasswordForm.querySelector('input[type="email"]').value;
      const password = forgotPasswordForm.querySelector('input[type="password"]').value;

      try {
  const response = await fetch('http://localhoast:3000/Udate_userdetails/', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }), // Send email and newPassword
        });
        const resultMessage = await response.text();

        if (response.ok) {
          showToast(resultMessage + ' You can now sign in.', 'success');
          forgotPasswordForm.reset();
          display('signInSection'); // Go back to the sign-in page on success
        } else {
          showToast(resultMessage, 'error'); // Shows "User not found" etc.
        }
      } catch (error) {
        console.error('Update Password Error:', error);
        showToast('Could not connect to server. Please try again later.', 'error');
      }
    });
}






















// --- UTILITY FUNCTIONS ---

// Function to switch between Sign In and Sign Up forms
window.display = function(sectionId) {
  document.getElementById('signInSection').style.display = 'none';
  document.getElementById('signUpSection').style.display = 'none';
  document.getElementById('forgotPasswordPage').style.display = 'none';

  // Show the selected section
  document.getElementById(sectionId).style.display = 'block';
}

    


   // ...existing code...


  // ...existing code...

  // --- Handle the Login Form Submission ---
  function initializeLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;

      try {
        // relative path so login works when the page is served over a tunnel/proxy
  const response = await fetch('https://localhost:3000/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('jwtToken', data.jwtToken);
            localStorage.setItem('userEmail', email); // <-- Save email for profile page
            showToast(languageManager?.t('loginSuccess') || 'Login Successful! Welcome back. 🎉', 'success');
            loginForm.reset();
            setTimeout(() => {
              window.location.href = '/profile.html'; // Redirect to profile page
            }, 1500);
          } else {
            const resultMessage = await response.text();
            showToast(resultMessage, 'error');
          }
        } catch (error) {
          console.error('Error during login:', error);
          showToast('Login failed due to a network error.', 'error');
        }
      });
  }






























// ...existing code...

  // --- Handle the Registration Form Submission ---
  function initializeRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = registerForm.querySelector('input[type="email"]').value;
      const password = registerForm.querySelector('input[type="password"]').value;

      try {
        // relative path so registration works when the page is served over a tunnel/proxy
  const response = await fetch('https://localhost:3000/submit-form', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });

            const resultMessage = await response.text();
            showToast(resultMessage, response.ok ? 'success' : 'error');

            if (response.ok) {
              registerForm.reset();
              display('signInSection');
            }
          } catch (error) {
            console.error('Error during registration:', error);
            showToast('Registration failed. Please try again.', 'error');
          }
        });
  }

  // ...existing code...

